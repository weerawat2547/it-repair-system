<?php
require_once 'config.php';

// 1. สถิติรวม
$stmt = $pdo->query("SELECT
    COUNT(*) as total,
    SUM(CASE WHEN status='pending'     THEN 1 ELSE 0 END) as pending,
    SUM(CASE WHEN status='in_progress' THEN 1 ELSE 0 END) as in_progress,
    SUM(CASE WHEN status='assigned'    THEN 1 ELSE 0 END) as assigned,
    SUM(CASE WHEN status='completed'   THEN 1 ELSE 0 END) as completed,
    SUM(CASE WHEN status='cancelled'   THEN 1 ELSE 0 END) as cancelled
    FROM repair_requests");
$totals = $stmt->fetch();

// 2. งานซ่อมแต่ละเดือน (6 เดือนล่าสุด)
$stmt = $pdo->query("SELECT
    DATE_FORMAT(created_at, '%Y-%m') as month,
    DATE_FORMAT(created_at, '%b %Y') as label,
    COUNT(*) as total,
    SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed
    FROM repair_requests
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
    GROUP BY DATE_FORMAT(created_at, '%Y-%m')
    ORDER BY month ASC");
$byMonth = $stmt->fetchAll();

// 3. ประเภทอุปกรณ์ที่แจ้งซ่อมบ่อย
$stmt = $pdo->query("SELECT
    COALESCE(et.name, 'ไม่ระบุ') as name,
    COUNT(*) as total
    FROM repair_requests r
    LEFT JOIN equipment_types et ON r.equipment_type_id = et.id
    GROUP BY et.id, et.name
    ORDER BY total DESC
    LIMIT 8");
$byEquipment = $stmt->fetchAll();

// 4. ระดับความเร่งด่วน
$stmt = $pdo->query("SELECT priority, COUNT(*) as total FROM repair_requests GROUP BY priority");
$byPriority = $stmt->fetchAll();

// 5. Top 5 ช่างที่ซ่อมงานมากที่สุด
$stmt = $pdo->query("SELECT
    u.name,
    COUNT(*) as total,
    SUM(CASE WHEN r.status='completed' THEN 1 ELSE 0 END) as completed
    FROM repair_requests r
    JOIN users u ON r.assigned_to = u.id
    GROUP BY r.assigned_to, u.name
    ORDER BY total DESC
    LIMIT 5");
$byTechnician = $stmt->fetchAll();

echo json_encode([
    "success"       => true,
    "totals"        => $totals,
    "byMonth"       => $byMonth,
    "byEquipment"   => $byEquipment,
    "byPriority"    => $byPriority,
    "byTechnician"  => $byTechnician,
]);
