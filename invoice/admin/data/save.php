<?php
// ============================================
// INDEEP CLEANING ID - Auto Save untuk Invoice
// Opsi B - File Storage di Hostinger 1TB
// Hanya 1KB, tidak berat
// ============================================
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['type']) || !isset($data['content'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid data"]);
    exit();
}

$type = $data['type']; // 'customers' or 'company'
$content = $data['content'];

$allowed = ['customers', 'company'];
if (!in_array($type, $allowed)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Type not allowed"]);
    exit();
}

$filename = $type . '.js';

if (file_put_contents($filename, $content) !== false) {
    echo json_encode(["status" => "ok", "message" => "$filename saved", "file" => $filename]);
} else {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Failed to write file"]);
}
?>
