<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$username = trim($data['username'] ?? '');
$password = trim($data['password'] ?? '');

if (!$username || !$password) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน"]);
    exit();
}

$stmt = $pdo->prepare("
    SELECT id, username, password_hash, name, email, role, department, phone, created_at
    FROM users
    WHERE username = ? AND is_active = 1
");
$stmt->execute([$username]);
$user = $stmt->fetch();

if (!$user || $user['password_hash'] !== $password) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"]);
    exit();
}

// ไม่ส่ง password กลับไป
unset($user['password_hash']);

// แปลง field ให้ตรงกับ TypeScript User interface
$userResponse = [
    "id"         => $user['id'],
    "username"   => $user['username'],
    "name"       => $user['name'],
    "email"      => $user['email'],
    "role"       => $user['role'],
    "department" => $user['department'],
    "phone"      => $user['phone'],
    "createdAt"  => $user['created_at'],
];

echo json_encode([
    "success" => true,
    "message" => "เข้าสู่ระบบสำเร็จ",
    "user"    => $userResponse
]);
