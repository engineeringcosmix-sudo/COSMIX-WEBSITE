<?php
require __DIR__ . '/lib.php';
cosmix_boot();

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    cosmix_json(['ok' => false], 200);
}

$payload = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($payload)) {
    $payload = [];
}
$body = [
    'page' => cosmix_clean($payload['page'] ?? '', 300),
    'brand' => cosmix_clean($payload['brand'] ?? '', 40),
];
foreach (['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as $key) {
    $value = cosmix_clean($payload[$key] ?? '', 160);
    if ($value !== '') {
        $body[$key] = $value;
    }
}
$raw = json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
$result = $raw === false
    ? ['ok' => false]
    : cosmix_post_hub('whatsapp-clicks', $raw, 'application/json');
cosmix_json(['ok' => !empty($result['ok'])], 200);
