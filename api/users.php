<?php
require_once 'config.php';

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
}

function getUsers() {
    global $pdo;
    $role = $_GET['role'] ?? null;
    $id   = $_GET['id']   ?? null;

    if ($id) {
        $stmt = $pdo->prepare("SELECT id, username, name, email, role, department, phone, is_active, created_at FROM users WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["success" => true, "data" => $stmt->fetch()]);
        return;
    }

    if ($role) {
        $stmt = $pdo->prepare("SELECT id, username, name, email, role, department, phone, is_active, created_at FROM users WHERE role = ? ORDER BY created_at DESC");
        $stmt->execute([$role]);
    } else {
        $stmt = $pdo->prepare("SELECT id, username, name, email, role, department, phone, is_active, created_at FROM users ORDER BY created_at DESC");
        $stmt->execute();
    }

    echo json_encode(["success" => true, "data" => $stmt->fetchAll()]);
}

function createUser() {
    global $pdo;
    $data = json_decode(file_get_contents("php://input"), true);

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

    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$username]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(["success" => false, "message" => "ชื่อผู้ใช้นี้มีอยู่แล้ว"]);
        return;
    }

    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(["success" => false, "message" => "อีเมลนี้มีอยู่แล้ว"]);
        return;
    }

    $id = uniqid('u_', true);
    $stmt = $pdo->prepare("INSERT INTO users (id, username, password_hash, name, email, role, department, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$id, $username, $password, $name, $email, $role, $department, $phone]);

    echo json_encode(["success" => true, "message" => "เพิ่มผู้ใช้สำเร็จ", "id" => $id]);
}

function updateUser() {
    global $pdo;
    $data = json_decode(file_get_contents("php://input"), true);

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

    if ($password) {
        $stmt = $pdo->prepare("UPDATE users SET name=?, email=?, role=?, department=?, phone=?, password_hash=?, updated_at=NOW() WHERE id=?");
        $stmt->execute([$name, $email, $role, $department, $phone, $password, $id]);
    } else {
        $stmt = $pdo->prepare("UPDATE users SET name=?, email=?, role=?, department=?, phone=?, updated_at=NOW() WHERE id=?");
        $stmt->execute([$name, $email, $role, $department, $phone, $id]);
    }

    echo json_encode(["success" => true, "message" => "แก้ไขผู้ใช้สำเร็จ"]);
}

function deleteUser() {
    global $pdo;
    $id = $_GET['id'] ?? '';
    if (!$id) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "ไม่พบ ID"]);
        return;
    }
    $stmt = $pdo->prepare("UPDATE users SET is_active = 0 WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(["success" => true, "message" => "ลบผู้ใช้สำเร็จ"]);
}
