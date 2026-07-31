<?php
define('CLOUDINARY_CLOUD_NAME', 'zrsovvpb');
define('CLOUDINARY_API_KEY',    '128811941525325');
define('CLOUDINARY_API_SECRET', 'UXp7CVB0IssPK6uz6Hb8jTNFbR8');

function uploadToCloudinary(string $filePath, string $folder = 'it_repair'): ?string {
    $timestamp = time();
    $sigString = "folder={$folder}&timestamp={$timestamp}" . CLOUDINARY_API_SECRET;
    $signature = sha1($sigString);

    $url = "https://api.cloudinary.com/v1_1/" . CLOUDINARY_CLOUD_NAME . "/image/upload";

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_POSTFIELDS     => [
            'file'      => new CURLFile($filePath),
            'api_key'   => CLOUDINARY_API_KEY,
            'timestamp' => $timestamp,
            'signature' => $signature,
            'folder'    => $folder,
        ],
    ]);

    $res  = curl_exec($ch);
    curl_close($ch);

    $data = json_decode($res, true);
    return $data['secure_url'] ?? null;
}
