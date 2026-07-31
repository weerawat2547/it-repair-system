<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$username   = trim($data['username']   ?? '');
$password   = trim($data['password']   ?? '');
$name       = trim($data['name']       ?? '');
$email      = trim($data['email']      ?? '');
$phone      = trim($data['phone']      ?? '');
$department = trim($data['department'] ?? '');

// Validation
if (!$username || !$password || !$name || !$email) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "กรุณากรอกข้อมูลให้ครบถ้วน"]);
    exit();
}

if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "รหัสผ่านต้องมีอักขระอย่างน้อย 6 ตัว"]);
    exit();
}

// เช็ค username ซ้ำ
$stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
$stmt->execute([$username]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(["success" => false, "message" => "ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว"]);
    exit();
}

// เช็ค email ซ้ำ
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$email]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(["success" => false, "message" => "อีเมลนี้มีอยู่ในระบบแล้ว"]);
    exit();
}

// สร้างผู้ใช้ใหม่
$id   = uniqid('u_', true);
$role = 'student';

$stmt = $pdo->prepare("
    INSERT INTO users (id, username, password_hash, name, email, role, department, phone)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
");
$stmt->execute([$id, $username, $password, $name, $email, $role, $department, $phone]);

echo json_encode([
    "success" => true,
    "message" => "สมัครสมาชิกสำเร็จ",
    "user" => [
        "id"         => $id,
        "username"   => $username,
        "name"       => $name,
        "email"      => $email,
        "role"       => $role,
        "department" => $department,
        "phone"      => $phone,
    ]
]);
