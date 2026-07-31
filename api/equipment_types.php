<?php
require_once 'config.php';

$stmt = $pdo->prepare("SELECT id, name FROM equipment_types WHERE is_active = 1 ORDER BY id");
$stmt->execute();
echo json_encode(["success" => true, "data" => $stmt->fetchAll()]);
