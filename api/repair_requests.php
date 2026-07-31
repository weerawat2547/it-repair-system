<?php
// 1. ซ่อน Warning/Notice เพื่อไม่ให้แทรกใน JSON Response
error_reporting(0);
ini_set('display_errors', 0);

// 2. กำหนด CORS Header สำหรับรองรับ React Frontend
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400'); // Cache Preflight 1 วัน
} else {
    header("Access-Control-Allow-Origin: *");
}

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, X-PINGOTHER");

// ป้องกันปัญหา CORS Preflight (OPTIONS Request)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// 3. ดึงไฟล์ที่เกี่ยวข้องโดยใช้อ้างอิงพาธโฟลเดอร์ปัจจุบัน (__DIR__)
require_once __DIR__ . '/config.php';

if (file_exists(__DIR__ . '/line_notify.php')) {
    require_once __DIR__ . '/line_notify.php';
}

if (file_exists(__DIR__ . '/cloudinary_upload.php')) {
    require_once __DIR__ . '/cloudinary_upload.php';
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getRequests();
        break;
    case 'POST':
    case 'PUT':
        updateOrCreateRequest();
        break;
    case 'DELETE':
        deleteRequest();
        break;
    default:
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Method not allowed"]);
        exit();
}

function getRequests() {
    global $pdo;
    $userId = $_GET['user_id'] ?? $_GET['userId'] ?? null;
    $role   = $_GET['role']    ?? null;
    $id     = $_GET['id']      ?? null;

    try {
        if ($id) {
            $stmt = $pdo->prepare("SELECT r.*, u.name as user_name, u.email as user_email, u.phone as user_phone, u.department,
                t.name as technician_name, et.name as equipment_type_name
                FROM repair_requests r
                LEFT JOIN users u ON r.user_id = u.id
                LEFT JOIN users t ON r.assigned_to = t.id
                LEFT JOIN equipment_types et ON r.equipment_type_id = et.id
                WHERE r.id = ? OR r.request_no = ?");
            $stmt->execute([$id, $id]);
            $req = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($req && !empty($req['images'])) {
                $req['images'] = json_decode($req['images'], true);
            }
            
            echo json_encode(["success" => true, "data" => $req ?: null]);
            return;
        }

        if ($role === 'student' && $userId) {
            $stmt = $pdo->prepare("SELECT r.*, u.name as user_name, u.email as user_email, u.phone as user_phone, u.department,
                t.name as technician_name, et.name as equipment_type_name
                FROM repair_requests r
                LEFT JOIN users u ON r.user_id = u.id
                LEFT JOIN users t ON r.assigned_to = t.id
                LEFT JOIN equipment_types et ON r.equipment_type_id = et.id
                WHERE r.user_id = ? ORDER BY r.created_at DESC");
            $stmt->execute([$userId]);
        } else {
            $stmt = $pdo->prepare("SELECT r.*, u.name as user_name, u.email as user_email, u.phone as user_phone, u.department,
                t.name as technician_name, et.name as equipment_type_name
                FROM repair_requests r
                LEFT JOIN users u ON r.user_id = u.id
                LEFT JOIN users t ON r.assigned_to = t.id
                LEFT JOIN equipment_types et ON r.equipment_type_id = et.id
                ORDER BY r.created_at DESC");
            $stmt->execute();
        }

        $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // แปลงภาพจาก JSON string เป็น Array
        foreach ($requests as &$item) {
            if (!empty($item['images'])) {
                $item['images'] = json_decode($item['images'], true);
            }
        }

        echo json_encode(["success" => true, "data" => $requests]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
    }
}

function updateOrCreateRequest() {
    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput, true) ?? [];

    if (!empty($data['id']) || !empty($_POST['id'])) {
        updateRequest($data);
    } else {
        createRequest($data);
    }
}

function createRequest(array $data) {
    global $pdo;

    $userId              = $data['user_id']              ?? $data['userId']              ?? $_POST['user_id']              ?? $_POST['userId']              ?? '';
    $equipmentTypeId     = !empty($data['equipment_type_id']) ? (int)$data['equipment_type_id'] : (!empty($data['equipmentTypeId']) ? (int)$data['equipmentTypeId'] : (!empty($_POST['equipment_type_id']) ? (int)$_POST['equipment_type_id'] : null));
    $equipmentModel      = $data['equipment_model']      ?? $data['equipmentModel']      ?? $_POST['equipment_model']      ?? '';
    $serialNumber        = $data['serial_number']        ?? $data['serialNumber']        ?? $_POST['serial_number']        ?? '';
    $locationDescription = $data['location_description'] ?? $data['location']              ?? $_POST['location_description'] ?? $_POST['location']          ?? '';
    $locationLat         = !empty($data['location_lat']) ? (float)$data['location_lat'] : (!empty($_POST['location_lat']) ? (float)$_POST['location_lat'] : null);
    $locationLng         = !empty($data['location_lng']) ? (float)$data['location_lng'] : (!empty($_POST['location_lng']) ? (float)$_POST['location_lng'] : null);
    $problemDescription  = $data['problem_description']  ?? $data['problemDescription']  ?? $_POST['problem_description']  ?? '';
    $priority            = $data['priority']             ?? $_POST['priority']             ?? 'medium';

    if (!$userId || !$locationDescription || !$problemDescription) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "กรุณากรอกข้อมูลให้ครบถ้วน (userId, location, problemDescription)"]);
        return;
    }

    $imageUrls = [];
    if (!empty($_FILES['images'])) {
        $files = $_FILES['images'];
        $count = is_array($files['tmp_name']) ? count($files['tmp_name']) : 1;
        for ($i = 0; $i < $count; $i++) {
            $tmpName = is_array($files['tmp_name']) ? $files['tmp_name'][$i] : $files['tmp_name'];
            $error   = is_array($files['error'])    ? $files['error'][$i]    : $files['error'];
            if ($error === UPLOAD_ERR_OK && function_exists('uploadToCloudinary')) {
                $url = uploadToCloudinary($tmpName, 'it_repair');
                if ($url) $imageUrls[] = $url;
            }
        }
    }

    try {
        $id         = uniqid('REQ-', true);
        $requestNo  = 'REQ-' . date('Y') . '-' . str_pad((string)rand(1, 9999), 4, '0', STR_PAD_LEFT);
        $imagesJson = !empty($imageUrls) ? json_encode($imageUrls) : null;

        $stmt = $pdo->prepare("INSERT INTO repair_requests
            (id, request_no, user_id, equipment_type_id, equipment_model, serial_number,
             location_description, location_lat, location_lng, problem_description, priority, images, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())");
        
        $stmt->execute([
            $id, 
            $requestNo, 
            $userId, 
            $equipmentTypeId, 
            $equipmentModel, 
            $serialNumber,
            $locationDescription, 
            $locationLat, 
            $locationLng, 
            $problemDescription, 
            $priority, 
            $imagesJson
        ]);

        if (function_exists('notifyRepairCreated')) {
            notifyRepairCreated($pdo, [
                'request_no'           => $requestNo,
                'equipment_model'      => $equipmentModel,
                'location_description' => $locationDescription,
                'problem_description'  => $problemDescription,
                'priority'             => $priority,
                'image_urls'           => $imageUrls,
            ]);
        }

        echo json_encode([
            "success" => true, 
            "message" => "แจ้งซ่อมสำเร็จ", 
            "id" => $id, 
            "request_no" => $requestNo
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database Insert Error: " . $e->getMessage()]);
    }
}

function updateRequest(array $data) {
    global $pdo;

    $id         = $data['id']          ?? $_POST['id']          ?? '';
    $status     = $data['status']      ?? $_POST['status']      ?? '';
    $assignedTo = $data['assigned_to'] ?? $data['assignedTo']   ?? $_POST['assigned_to'] ?? null;
    $changedBy  = $data['changed_by']  ?? $data['changedBy']    ?? $_POST['changed_by']  ?? '';

    $technicianNotes = $data['technician_notes'] 
                    ?? $data['technicianNotes'] 
                    ?? $data['notes'] 
                    ?? $data['note']
                    ?? $_POST['technician_notes'] 
                    ?? $_POST['technicianNotes'] 
                    ?? $_POST['notes'] 
                    ?? $_POST['note'] 
                    ?? '';

    if (!$id || !$status) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "ข้อมูลไม่ครบถ้วน (ต้องการ id และ status)"]);
        return;
    }

    try {
        // ดึงสถานะเดิม
        $stmt = $pdo->prepare("SELECT status FROM repair_requests WHERE id = ? OR request_no = ?");
        $stmt->execute([$id, $id]);
        $old = $stmt->fetch(PDO::FETCH_ASSOC);
        $oldStatus = $old['status'] ?? 'pending';

        $completedAt = ($status === 'completed') ? date('Y-m-d H:i:s') : null;

        // อัปเดตข้อมูลลงฐานข้อมูล MySQL
        $stmt = $pdo->prepare("UPDATE repair_requests
            SET status = ?, assigned_to = ?, technician_notes = ?, updated_at = NOW(), completed_at = ?
            WHERE id = ? OR request_no = ?");
        $stmt->execute([$status, $assignedTo, $technicianNotes, $completedAt, $id, $id]);

        // ส่งการแจ้งเตือน LINE Notify
        if (function_exists('notifyRepairUpdated')) {
            notifyRepairUpdated($pdo, $id, $oldStatus, $status, $changedBy, $technicianNotes);
        }

        echo json_encode(["success" => true, "message" => "อัปเดตสำเร็จ"]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database Update Error: " . $e->getMessage()]);
    }
}

function deleteRequest() {
    global $pdo;
    $id = $_GET['id'] ?? '';
    if (!$id) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "ไม่พบ ID"]);
        return;
    }
    try {
        $stmt = $pdo->prepare("DELETE FROM repair_requests WHERE id = ? OR request_no = ?");
        $stmt->execute([$id, $id]);
        echo json_encode(["success" => true, "message" => "ลบสำเร็จ"]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database Delete Error: " . $e->getMessage()]);
    }
}