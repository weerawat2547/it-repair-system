<?php
define('LINE_CHANNEL_TOKEN', 'DHjt0bQw6MKuH6jxwmD+nER4YGp+ixenbssdcDyU4Gw/zsFVB9k5tGGmbLTM+hsNYe70/kC5V/m7/8/CXOW5TBXrFdFnLaGfpx6cN2ZBgDn+c/yJWqFS0u5qu87TJEeb061QTJ/iHPYeYpzmCbb18wdB04t89/1O/w1cDnyilFU=');

function sendLineMessage(string $userId, string $message): bool {
    if (empty($userId) || empty($message)) return false;

    $payload = json_encode([
        "to" => $userId,
        "messages" => [
            ["type" => "text", "text" => $message]
        ]
    ]);

    $ch = curl_init("https://api.line.me/v2/bot/message/push");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_HTTPHEADER     => [
            "Content-Type: application/json",
            "Authorization: Bearer " . LINE_CHANNEL_TOKEN,
        ],
    ]);
    $res  = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return $code === 200;
}

function notifyRepairCreated(PDO $pdo, array $request): void {
    $msg = "🔧 แจ้งซ่อมใหม่!\n";
    $msg .= "เลขที่: {$request['request_no']}\n";
    $msg .= "อุปกรณ์: {$request['equipment_model']}\n";
    $msg .= "สถานที่: {$request['location_description']}\n";
    $msg .= "ปัญหา: {$request['problem_description']}\n";
    $msg .= "ความเร่งด่วน: " . priorityLabel($request['priority']) . "\n";

    if (!empty($request['image_urls'])) {
        $msg .= "📷 รูปภาพ (" . count($request['image_urls']) . " รูป):\n";
        foreach ($request['image_urls'] as $i => $url) {
            $msg .= "รูปที่ " . ($i + 1) . ": {$url}\n";
        }
    }

    $msg .= "เวลา: " . date('d/m/Y H:i');

    $stmt = $pdo->prepare(
        "SELECT line_user_id FROM users
         WHERE role IN ('admin','technician')
           AND is_active = 1
           AND line_user_id IS NOT NULL
           AND line_user_id != ''"
    );
    $stmt->execute();
    $recipients = $stmt->fetchAll(PDO::FETCH_COLUMN);

    foreach ($recipients as $userId) {
        sendLineMessage($userId, $msg);
    }
}

function notifyRepairUpdated(PDO $pdo, string $requestId, string $oldStatus, string $newStatus, string $changedBy, string $technicianNotes = ''): void {
    // ดึงข้อมูลคำขอซ่อมและชื่อผู้เปลี่ยนจาก DB
    $stmt = $pdo->prepare("
        SELECT r.*,
               u.name as requester_name, u.line_user_id as requester_line_id,
               c.name as changer_name
        FROM repair_requests r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN users c ON c.id = ?
        WHERE r.id = ? OR r.request_no = ?
    ");
    $stmt->execute([$changedBy, $requestId, $requestId]);
    $info = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$info) return;

    // ดึงข้อความจาก DB หรือ Parameter
    $dbNote = trim((string)($info['technician_notes'] ?? ''));
    $paramNote = trim((string)$technicianNotes);
    $finalNote = ($dbNote !== '') ? $dbNote : $paramNote;

    // 🔴 ใส่แท็กทดสอบไว้ที่หัวข้อตรงนี้
    $msg = "📋 [TEST-999] อัปเดตสถานะงานซ่อม\n";
    $msg .= "เลขที่: " . ($info['request_no'] ?? $requestId) . "\n";
    $msg .= "อุปกรณ์: " . ($info['equipment_model'] ?? '-') . "\n";
    $msg .= "สถานที่: " . ($info['location_description'] ?? '-') . "\n";
    $msg .= "สถานะเดิม: " . statusLabel($oldStatus) . "\n";
    $msg .= "สถานะใหม่: " . statusLabel($newStatus) . "\n";
    
    // 🔹 บังคับแสดงบรรทัดหมายเหตุช่าง
    $msg .= "💬 หมายเหตุจากช่าง: " . ($finalNote !== '' ? $finalNote : 'ไม่มีข้อมูลส่งมา') . "\n";

    $msg .= "อัปเดตโดย: " . ($info['changer_name'] ?? 'ช่างเทคนิค') . "\n";
    $msg .= "เวลา: " . date('d/m/Y H:i');

    // ส่ง LINE หาผู้แจ้งซ่อม
    if (!empty($info['requester_line_id'])) {
        sendLineMessage($info['requester_line_id'], $msg);
    }

    // ส่ง LINE หา Admin ทุกคน
    $stmtAdmin = $pdo->prepare("
        SELECT line_user_id FROM users
        WHERE role = 'admin' AND is_active = 1
          AND line_user_id IS NOT NULL AND line_user_id != ''
    ");
    $stmtAdmin->execute();
    $admins = $stmtAdmin->fetchAll(PDO::FETCH_COLUMN);
    foreach ($admins as $adminId) {
        sendLineMessage($adminId, $msg);
    }
}

function statusLabel(string $status): string {
    return match($status) {
        'pending'     => '⏳ รอดำเนินการ',
        'assigned'    => '👤 มอบหมายแล้ว',
        'in_progress' => '🔧 กำลังซ่อม',
        'completed'   => '✅ ซ่อมเสร็จแล้ว',
        'cancelled'   => '❌ ยกเลิก',
        default       => $status,
    };
}

function priorityLabel(string $priority): string {
    return match($priority) {
        'urgent' => '🔴 เร่งด่วนมาก',
        'high'   => '🟠 เร่งด่วน',
        'medium' => '🟡 ปานกลาง',
        'low'    => '🟡 ปานกลาง',
        default  => $priority,
    };
}