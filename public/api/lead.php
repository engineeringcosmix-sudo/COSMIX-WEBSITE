<?php
require __DIR__ . '/lib.php';
cosmix_boot();

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    cosmix_json(['ok' => false, 'message' => 'Please check the form and try again.'], 405);
}

$payload = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($payload)) {
    cosmix_json(['ok' => false, 'message' => 'Please check the form and try again.'], 400);
}
if (trim((string) ($payload['company_website'] ?? '')) !== '') {
    cosmix_json(['ok' => false, 'message' => 'Please message us on WhatsApp.'], 400);
}

$parsed = cosmix_lead_from_fields($payload);
if (isset($parsed['error'])) {
    cosmix_json(['ok' => false, 'message' => $parsed['error']], 400);
}

$raw = json_encode($parsed['lead'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if ($raw === false) {
    cosmix_json(['ok' => false, 'message' => 'Please check the form and try again.'], 400);
}

$result = cosmix_post_hub('leads', $raw, 'application/json');
cosmix_json($result['body'], $result['status']);
