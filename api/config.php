<?php
// --- ตั้งค่า Database (ตรวจจับ Local vs Production อัตโนมัติ) ---
$server_name = $_SERVER['SERVER_NAME'] ?? 'localhost';
$is_local = in_array($server_name, ['localhost', '127.0.0.1']);

if ($is_local) {
    // 🖥️ ค่าสำหรับรันบนเครื่อง Local (XAMPP)
    $host     = "localhost";
    $dbname   = "it_repair_system";
    $username = "root";
    $password = "";
} else {
    // 🌐 ค่าสำหรับรันบน Hosting (เช่น InfinityFree หรือ Freehosting)
    $host     = "sqlxxx.infinityfree.com"; 
    $dbname   = "if0_xxxx_it_repair_system"; 
    $username = "if0_xxxx"; 
    $password = "your_infinityfree_password"; 
}

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "เชื่อมต่อฐานข้อมูลไม่ได้: " . $e->getMessage()]);
    exit();
}