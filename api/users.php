<?php
// 1. ซ่อน Error / Warning เพื่อป้องกัน JSON Response เสียหาย
error_reporting(0);
ini_set('display_errors', 0);

// 2. กำหนด CORS Header ให้รองรับ React Frontend
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
} else {
    header("Access-Control-Allow-Origin: *");
}

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, X-PINGOTHER");

// 3. จัดการ CORS Preflight (OPTIONS Request)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// 4. ดึงไฟล์เชื่อมต่อฐานข้อมูล
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getUsers();
        break;
    case 'POST':
        createUser();
        break;
    case 'PUT':
        updateUser();
        break;
    case 'DELETE':
        deleteUser();
        break;
    default:
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Method not allowed"]);
        exit();
}

function getUsers() {
    global $pdo;
    $role = $_GET['role'] ?? null;
    $id   = $_GET['id']   ?? null;

    try {
        if ($id) {
            $stmt = $pdo->prepare("SELECT id, username, name, email, role, department, phone, is_active, created_at FROM users WHERE id = ?");
            $stmt->execute([$id]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode(["success" => true, "data" => $user ?: null]);
            return;
        }

        if ($role) {
            $stmt = $pdo->prepare("SELECT id, username, name, email, role, department, phone, is_active, created_at FROM users WHERE role = ? AND is_active = 1 ORDER BY created_at DESC");
            $stmt->execute([$role]);
        } else {
            $stmt = $pdo->prepare("SELECT id, username, name, email, role, department, phone, is_active, created_at FROM users WHERE is_active = 1 ORDER BY created_at DESC");
            $stmt->execute();
        }

        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["success" => true, "data" => $users]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
    }
}

function createUser() {
    global $pdo;
    $data = json_decode(file_get_contents("php://input"), true) ?? [];

    $username   = trim($data['username']   ?? '');
    $password   = trim($data['password']   ?? '');
    $name       = trim($data['name']       ?? '');
    $email      = trim($data['email']      ?? '');
    $role       = trim($data['role']       ?? 'student');
    $department = trim($data['department'] ?? '');
    $phone      = trim($data['phone']      ?? '');

    if (!$username || !$password || !$name || !$email) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "กรุณากรอกข้อมูลให้ครบถ้วน"]);
        return;
    }

    try {
        // ตรวจสอบ Username ซ้ำ
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([$username]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(["success" => false, "message" => "ชื่อผู้ใช้นี้มีอยู่แล้ว"]);
            return;
        }

        // ตรวจสอบ Email ซ้ำ
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(["success" => false, "message" => "อีเมลนี้มีอยู่แล้ว"]);
            return;
        }

        $id = uniqid('u_', true);
        
        // แฮชรหัสผ่านเพื่อความปลอดภัย
        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

        $stmt = $pdo->prepare("INSERT INTO users (id, username, password_hash, name, email, role, department, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$id, $username, $hashedPassword, $name, $email, $role, $department, $phone]);

        echo json_encode(["success" => true, "message" => "เพิ่มผู้ใช้สำเร็จ", "id" => $id]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
    }
}

function updateUser() {
    global $pdo;
    $data = json_decode(file_get_contents("php://input"), true) ?? [];

    $id         = $data['id']         ?? '';
    $name       = $data['name']       ?? '';
    $email      = $data['email']      ?? '';
    $role       = $data['role']       ?? '';
    $department = $data['department'] ?? '';
    $phone      = $data['phone']      ?? '';
    $password   = $data['password']   ?? '';

    if (!$id) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "ไม่พบ ID"]);
        return;
    }

    try {
        // กรณีมีการส่ง Password ใหม่มาปรับแก้ ให้ทำการ Hash ใหม่ด้วย
        if (!empty($password)) {
            $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
            $stmt = $pdo->prepare("UPDATE users SET name=?, email=?, role=?, department=?, phone=?, password_hash=?, updated_at=NOW() WHERE id=?");
            $stmt->execute([$name, $email, $role, $department, $phone, $hashedPassword, $id]);
        } else {
            $stmt = $pdo->prepare("UPDATE users SET name=?, email=?, role=?, department=?, phone=?, updated_at=NOW() WHERE id=?");
            $stmt->execute([$name, $email, $role, $department, $phone, $id]);
        }

        echo json_encode(["success" => true, "message" => "แก้ไขผู้ใช้สำเร็จ"]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
    }
}

function deleteUser() {
    global $pdo;
    $id = $_GET['id'] ?? '';
    if (!$id) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "ไม่พบ ID"]);
        return;
    }

    try {
        // Soft Delete กำหนดให้ is_active = 0
        $stmt = $pdo->prepare("UPDATE users SET is_active = 0 WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["success" => true, "message" => "ลบผู้ใช้สำเร็จ"]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
    }
}