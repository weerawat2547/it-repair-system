<?php
require_once 'config.php';

$userId = $_GET['user_id'] ?? null;
$role   = $_GET['role']    ?? null;

if ($role === 'student' && $userId) {
    $stmt = $pdo->prepare("SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending'     THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'completed'   THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'cancelled'   THEN 1 ELSE 0 END) as cancelled
        FROM repair_requests WHERE user_id = ?");
    $stmt->execute([$userId]);
} else {
    $stmt = $pdo->prepare("SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending'     THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'completed'   THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'cancelled'   THEN 1 ELSE 0 END) as cancelled
        FROM repair_requests");
    $stmt->execute();
}

$stats = $stmt->fetch();

// จำนวน technician (สำหรับ admin)
$techCount = 0;
if ($role === 'admin') {
    $stmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'technician' AND is_active = 1");
    $stmt->execute();
    $techCount = $stmt->fetch()['cnt'];
}

echo json_encode([
    "success"    => true,
    "total"      => (int)$stats['total'],
    "pending"    => (int)$stats['pending'],
    "in_progress"=> (int)$stats['in_progress'],
    "completed"  => (int)$stats['completed'],
    "cancelled"  => (int)$stats['cancelled'],
    "technicians"=> (int)$techCount,
]);
