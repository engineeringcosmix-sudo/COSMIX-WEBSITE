<?php
require __DIR__ . '/lib.php';
cosmix_boot();

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    cosmix_json(['ok' => false, 'message' => 'Please check the form and try again.'], 405);
}
if (trim((string) ($_POST['company_website'] ?? '')) !== '') {
    cosmix_json(['ok' => false, 'message' => 'Please message us on WhatsApp.'], 400);
}

$parsed = cosmix_lead_from_fields($_POST);
if (isset($parsed['error'])) {
    cosmix_json(['ok' => false, 'message' => $parsed['error']], 400);
}

$files = [];
$uploads = cosmix_uploaded('boq');
if ($uploads !== []) {
    $file = $uploads[0];
    if ($file['error'] !== UPLOAD_ERR_OK) {
        cosmix_json(['ok' => false, 'message' => 'The bill of quantities must be 15 MB or smaller.'], 400);
    }
    if ($file['size'] > 15 * 1024 * 1024) {
        cosmix_json(['ok' => false, 'message' => 'The bill of quantities must be 15 MB or smaller.'], 400);
    }
    $bytes = cosmix_read_upload($file);
    $kind = cosmix_boq_kind($file['name']);
    if ($bytes === false || $kind === '' || !cosmix_looks_like($bytes, $kind)) {
        cosmix_json(['ok' => false, 'message' => 'Upload the bill of quantities as an Excel or PDF file.'], 400);
    }
    $files[] = [
        'name' => 'boq',
        'filename' => $file['name'],
        'type' => $file['type'] !== '' ? $file['type'] : 'application/octet-stream',
        'bytes' => $bytes,
    ];
}

$multipart = cosmix_build_multipart($parsed['lead'], $files);
$result = cosmix_post_hub('quote-requests', $multipart['body'], $multipart['contentType']);
cosmix_json($result['body'], $result['status']);
