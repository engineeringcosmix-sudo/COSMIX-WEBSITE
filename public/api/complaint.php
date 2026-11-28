<?php
require __DIR__ . '/lib.php';
cosmix_boot();

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    cosmix_json(['ok' => false, 'message' => 'Please check the form and try again.'], 405);
}
if (trim((string) ($_POST['company_website'] ?? '')) !== '') {
    cosmix_json(['ok' => false, 'message' => 'Please message us on WhatsApp.'], 400);
}

$customerName = cosmix_clean($_POST['customerName'] ?? ($_POST['name'] ?? ''), 160);
$problemDescription = cosmix_clean($_POST['problemDescription'] ?? ($_POST['problem'] ?? ''), 4000);
if ($customerName === '' || $problemDescription === '') {
    cosmix_json(['ok' => false, 'message' => 'Please enter your name and describe the problem.'], 400);
}
$brand = cosmix_clean($_POST['brand'] ?? '', 20);
if ($brand !== '' && !in_array($brand, cosmix_complaint_brands(), true)) {
    cosmix_json(['ok' => false, 'message' => 'Please choose a brand.'], 400);
}

$fields = [
    'customerName' => $customerName,
    'mobile' => cosmix_clean($_POST['mobile'] ?? ($_POST['phone'] ?? ''), 40),
    'email' => cosmix_clean($_POST['email'] ?? '', 160),
    'city' => cosmix_clean($_POST['city'] ?? '', 80),
    'siteAddress' => cosmix_clean($_POST['siteAddress'] ?? ($_POST['address'] ?? ''), 300),
    'brand' => $brand,
    'unitType' => cosmix_clean($_POST['unitType'] ?? '', 120),
    'model' => cosmix_clean($_POST['model'] ?? '', 120),
    'serialNumber' => cosmix_clean($_POST['serialNumber'] ?? '', 120),
    'errorCode' => cosmix_clean($_POST['errorCode'] ?? '', 80),
    'problemDescription' => $problemDescription,
    'preferredVisitTime' => cosmix_clean($_POST['preferredVisitTime'] ?? ($_POST['visit'] ?? ''), 160),
    'turnstileToken' => cosmix_clean($_POST['turnstileToken'] ?? '', 2000),
];

$photos = cosmix_uploaded('photos');
if (count($photos) > 3) {
    cosmix_json(['ok' => false, 'message' => 'Please choose no more than 3 photos.'], 400);
}
$files = [];
foreach ($photos as $photo) {
    if ($photo['error'] !== UPLOAD_ERR_OK || $photo['size'] > 8 * 1024 * 1024) {
        cosmix_json(['ok' => false, 'message' => 'Each photo must be 8 MB or smaller.'], 400);
    }
    $bytes = cosmix_read_upload($photo);
    $kind = cosmix_photo_kind($photo['name']);
    if ($bytes === false || $kind === '' || !cosmix_looks_like($bytes, $kind)) {
        cosmix_json(['ok' => false, 'message' => 'Photos must be JPEG, PNG, or WEBP.'], 400);
    }
    $files[] = [
        'name' => 'photos',
        'filename' => $photo['name'],
        'type' => $photo['type'] !== '' ? $photo['type'] : 'image/jpeg',
        'bytes' => $bytes,
    ];
}

$videos = cosmix_uploaded('video');
if ($videos !== []) {
    $video = $videos[0];
    if ($video['error'] !== UPLOAD_ERR_OK || $video['size'] > 50 * 1024 * 1024) {
        cosmix_json(['ok' => false, 'message' => 'The video must be 50 MB or smaller.'], 400);
    }
    $bytes = cosmix_read_upload($video);
    if ($bytes === false || !str_ends_with(strtolower($video['name']), '.mp4') || !cosmix_looks_like($bytes, 'mp4')) {
        cosmix_json(['ok' => false, 'message' => 'The video must be an MP4 file.'], 400);
    }
    $files[] = [
        'name' => 'video',
        'filename' => $video['name'],
        'type' => 'video/mp4',
        'bytes' => $bytes,
    ];
}

$multipart = cosmix_build_multipart($fields, $files);
$result = cosmix_post_hub('complaints', $multipart['body'], $multipart['contentType']);
cosmix_json($result['body'], $result['status']);
