<?php
require_once 'config.php';
require_once 'line_notify.php';
require_once 'cloudinary_upload.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getRequests();
        break;
    case 'POST':
        createRequest();
        break;
    case 'PUT':
        updateRequest();
        break;
    case 'DELETE':
        deleteRequest();
        break;
    default:
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Method not allowed"]);
}

function getRequests() {
    global $pdo;
    $userId = $_GET['user_id'] ?? null;
    $role   = $_GET['role']    ?? null;
    $id     = $_GET['id']      ?? null;

    if ($id) {
        $stmt = $pdo->prepare("SELECT r.*, u.name as user_name, u.email as user_email, u.phone as user_phone, u.department,
            t.name as technician_name, et.name as equipment_type_name
            FROM repair_requests r
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN users t ON r.assigned_to = t.id
            LEFT JOIN equipment_types et ON r.equipment_type_id = et.id
            WHERE r.id = ?");
        $stmt->execute([$id]);
        $req = $stmt->fetch();
        echo json_encode(["success" => true, "data" => $req]);
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

    $requests = $stmt->fetchAll();
    echo json_encode(["success" => true, "data" => $requests]);
}

function createRequest() {
    global $pdo;

    // รองรับทั้ง FormData และ JSON
    if (!empty($_POST)) {
        $userId              = $_POST['user_id']              ?? '';
        $equipmentTypeId     = !empty($_POST['equipment_type_id']) ? (int)$_POST['equipment_type_id'] : null;
        $equipmentModel      = $_POST['equipment_model']      ?? '';
        $serialNumber        = $_POST['serial_number']        ?? '';
        $locationDescription = $_POST['location_description'] ?? '';
        $locationLat         = !empty($_POST['location_lat']) ? (float)$_POST['location_lat'] : null;
        $locationLng         = !empty($_POST['location_lng']) ? (float)$_POST['location_lng'] : null;
        $problemDescription  = $_POST['problem_description']  ?? '';
        $priority            = $_POST['priority']             ?? 'medium';
    } else {
        $data = json_decode(file_get_contents("php://input"), true);
        $userId              = $data['user_id']              ?? '';
        $equipmentTypeId     = !empty($data['equipment_type_id']) ? (int)$data['equipment_type_id'] : null;
        $equipmentModel      = $data['equipment_model']      ?? '';
        $serialNumber        = $data['serial_number']        ?? '';
        $locationDescription = $data['location_description'] ?? '';
        $locationLat         = !empty($data['location_lat']) ? (float)$data['location_lat'] : null;
        $locationLng         = !empty($data['location_lng']) ? (float)$data['location_lng'] : null;
        $problemDescription  = $data['problem_description']  ?? '';
        $priority            = $data['priority']             ?? 'medium';
    }

    if (!$userId || !$locationDescription || !$problemDescription) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "กรุณากรอกข้อมูลให้ครบถ้วน"]);
        return;
    }

    // อัปโหลดรูปภาพไปยัง Cloudinary
    $imageUrls = [];
    if (!empty($_FILES['images'])) {
        $files = $_FILES['images'];
        $count = is_array($files['tmp_name']) ? count($files['tmp_name']) : 1;
        for ($i = 0; $i < $count; $i++) {
            $tmpName = is_array($files['tmp_name']) ? $files['tmp_name'][$i] : $files['tmp_name'];
            $error   = is_array($files['error'])    ? $files['error'][$i]    : $files['error'];
            if ($error === UPLOAD_ERR_OK) {
                $url = uploadToCloudinary($tmpName, 'it_repair');
                if ($url) $imageUrls[] = $url;
            }
        }
    }

    $id        = uniqid('REQ-', true);
    $requestNo = 'REQ-' . date('Y') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
    $imagesJson = !empty($imageUrls) ? json_encode($imageUrls) : null;

    $stmt = $pdo->prepare("INSERT INTO repair_requests
        (id, request_no, user_id, equipment_type_id, equipment_model, serial_number,
         location_description, location_lat, location_lng, problem_description, priority, images)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$id, $requestNo, $userId, $equipmentTypeId, $equipmentModel, $serialNumber,
        $locationDescription, $locationLat, $locationLng, $problemDescription, $priority, $imagesJson]);

    // แจ้งเตือน LINE
    notifyRepairCreated($pdo, [
        'request_no'           => $requestNo,
        'equipment_model'      => $equipmentModel,
        'location_description' => $locationDescription,
        'problem_description'  => $problemDescription,
        'priority'             => $priority,
        'image_urls'           => $imageUrls,
    ]);

    echo json_encode(["success" => true, "message" => "แจ้งซ่อมสำเร็จ", "id" => $id, "request_no" => $requestNo]);
}

function updateRequest() {
    global $pdo;
    $data = json_decode(file_get_contents("php://input"), true);

    $id              = $data['id']               ?? '';
    $status          = $data['status']           ?? '';
    $assignedTo      = $data['assigned_to']      ?? null;
    $technicianNotes = $data['technician_notes'] ?? '';
    $changedBy       = $data['changed_by']       ?? '';

    if (!$id || !$status) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "ข้อมูลไม่ครบถ้วน"]);
        return;
    }

    // ดึงข้อมูลเก่า
    $stmt = $pdo->prepare("SELECT status, assigned_to FROM repair_requests WHERE id = ?");
    $stmt->execute([$id]);
    $old = $stmt->fetch();

    $completedAt = ($status === 'completed') ? date('Y-m-d H:i:s') : null;

    $stmt = $pdo->prepare("UPDATE repair_requests
        SET status = ?, assigned_to = ?, technician_notes = ?, updated_at = NOW(), completed_at = ?
        WHERE id = ?");
    $stmt->execute([$status, $assignedTo, $technicianNotes, $completedAt, $id]);

    // บันทึกประวัติ
    $historyId = uniqid('hist_', true);
    $stmt = $pdo->prepare("INSERT INTO repair_status_history
        (id, repair_request_id, changed_by, old_status, new_status, old_assigned_to, new_assigned_to, note)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$historyId, $id, $changedBy, $old['status'], $status,
        $old['assigned_to'], $assignedTo, $technicianNotes]);

    // แจ้งเตือน LINE เมื่อสถานะเปลี่ยน
    if ($old['status'] !== $status) {
        notifyRepairUpdated($pdo, $id, $old['status'], $status, $changedBy);
    }

    echo json_encode(["success" => true, "message" => "อัปเดตสำเร็จ"]);
}

function deleteRequest() {
    global $pdo;
    $id = $_GET['id'] ?? '';
    if (!$id) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "ไม่พบ ID"]);
        return;
    }
    $stmt = $pdo->prepare("DELETE FROM repair_requests WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(["success" => true, "message" => "ลบสำเร็จ"]);
}
