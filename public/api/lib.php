<?php
/**
 * Shared Hub intake for the Hostinger PHP endpoints.
 * Not a public URL. .htaccess denies requests for this file.
 */

function cosmix_boot(): void
{
    ini_set('display_errors', '0');
    ini_set('html_errors', '0');
}

function cosmix_json(array $body, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function cosmix_config_path(): string
{
    $override = getenv('COSMIX_CONFIG');
    if (is_string($override) && $override !== '') {
        return $override;
    }
    // public_html/api -> parent of public_html (../cosmix-config.php from the site root).
    return dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'cosmix-config.php';
}

function cosmix_load_config(): array
{
    $path = cosmix_config_path();
    if (!is_file($path)) {
        return [];
    }
    $config = include $path;
    return is_array($config) ? $config : [];
}

function cosmix_hub_settings(?array $config = null): ?array
{
    $config ??= cosmix_load_config();
    $base = rtrim(trim((string) ($config['HUB_BASE_URL'] ?? '')), '/');
    $key = trim((string) ($config['HUB_API_KEY'] ?? ''));
    $secret = trim((string) ($config['HUB_HMAC_SECRET'] ?? ''));
    if ($base === '' || $key === '' || $secret === '') {
        return null;
    }
    return ['base' => $base, 'key' => $key, 'secret' => $secret];
}

function cosmix_fallback(): array
{
    return [
        'ok' => false,
        'fallback' => true,
        'status' => 200,
        'body' => [
            'ok' => false,
            'fallback' => true,
            'message' => 'Please message us on WhatsApp and we will take this from there.',
        ],
    ];
}

function cosmix_sign(string $secret, string $timestamp, string $rawBody): string
{
    return 'sha256=' . hash_hmac('sha256', $timestamp . '.' . $rawBody, $secret);
}

function cosmix_client_ip(): string
{
    $header = $_SERVER['HTTP_X_NF_CLIENT_CONNECTION_IP']
        ?? $_SERVER['HTTP_CF_CONNECTING_IP']
        ?? $_SERVER['HTTP_X_FORWARDED_FOR']
        ?? $_SERVER['REMOTE_ADDR']
        ?? '';
    $part = explode(',', (string) $header)[0] ?? '';
    return trim($part);
}

function cosmix_clean($value, int $max = 500): string
{
    $text = str_replace("\0", '', (string) ($value ?? ''));
    if (function_exists('mb_substr')) {
        return mb_substr(trim($text), 0, $max);
    }
    return substr(trim($text), 0, $max);
}

function cosmix_product_interests(): array
{
    return [
        'AUX_VRF',
        'AUX_OTHER',
        'CLIVET_CHILLER',
        'CLIVET_HEATPUMP',
        'CLIVET_ROOFTOP',
        'CLIVET_AHU',
        'LUKO_DEHUMIDIFIER',
        'HOLTOP_AHU',
        'SERVICES',
    ];
}

function cosmix_sources(): array
{
    return ['WEBSITE', 'GOOGLE', 'FACEBOOK', 'WHATSAPP', 'EXHIBITION', 'REFERRAL'];
}

function cosmix_complaint_brands(): array
{
    return ['AUX', 'CLIVET', 'LUKO', 'OTHER'];
}

function cosmix_lead_from_fields(array $fields): array
{
    $name = cosmix_clean($fields['name'] ?? '', 160);
    $mobile = cosmix_clean($fields['mobile'] ?? ($fields['phone'] ?? ''), 40);
    $whatsapp = cosmix_clean($fields['whatsapp'] ?? '', 40);
    $email = cosmix_clean($fields['email'] ?? '', 160);
    if ($name === '') {
        return ['error' => 'Please enter your name.'];
    }
    if ($mobile === '' && $whatsapp === '' && $email === '') {
        return ['error' => 'Please enter a mobile number, WhatsApp number, or email.'];
    }
    $productInterest = cosmix_clean($fields['productInterest'] ?? '', 40);
    if ($productInterest !== '' && !in_array($productInterest, cosmix_product_interests(), true)) {
        return ['error' => 'Please choose a product interest.'];
    }
    $sourceRaw = cosmix_clean($fields['source'] ?? '', 20);
    $source = in_array($sourceRaw, cosmix_sources(), true) ? $sourceRaw : 'WEBSITE';
    $lead = ['name' => $name, 'source' => $source];
    $optional = [
        'company' => cosmix_clean($fields['company'] ?? '', 160),
        'designation' => cosmix_clean($fields['designation'] ?? '', 120),
        'mobile' => $mobile,
        'whatsapp' => $whatsapp,
        'email' => $email,
        'city' => cosmix_clean($fields['city'] ?? '', 80),
        'province' => cosmix_clean($fields['province'] ?? '', 80),
        'message' => cosmix_clean($fields['message'] ?? '', 4000),
        'productInterest' => $productInterest,
        'projectType' => cosmix_clean($fields['projectType'] ?? '', 120),
        'timeline' => cosmix_clean($fields['timeline'] ?? '', 120),
        'budget' => cosmix_clean($fields['budget'] ?? '', 80),
        'pageUrl' => cosmix_clean($fields['pageUrl'] ?? '', 500),
        'turnstileToken' => cosmix_clean($fields['turnstileToken'] ?? '', 2000),
    ];
    foreach ($optional as $key => $value) {
        if ($value !== '') {
            $lead[$key] = $value;
        }
    }
    foreach (['areaSqFt', 'estimatedTR'] as $numeric) {
        if (!array_key_exists($numeric, $fields) || $fields[$numeric] === '' || $fields[$numeric] === null) {
            continue;
        }
        if (!is_numeric($fields[$numeric])) {
            continue;
        }
        $lead[$numeric] = $fields[$numeric] + 0;
    }
    foreach (['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as $key) {
        $value = cosmix_clean($fields[$key] ?? '', 160);
        if ($value !== '') {
            $lead[$key] = $value;
        }
    }
    return ['lead' => $lead];
}

function cosmix_looks_like(string $bytes, string $kind): bool
{
    $len = strlen($bytes);
    if ($kind === 'pdf') {
        return $len > 4 && substr($bytes, 0, 4) === '%PDF';
    }
    if ($kind === 'xlsx') {
        return $len > 4 && $bytes[0] === "\x50" && $bytes[1] === "\x4b" && str_contains($bytes, 'xl/');
    }
    if ($kind === 'xls') {
        return $len > 4
            && $bytes[0] === "\xd0"
            && $bytes[1] === "\xcf"
            && $bytes[2] === "\x11"
            && $bytes[3] === "\xe0";
    }
    if ($kind === 'jpeg') {
        return $len > 3 && $bytes[0] === "\xff" && $bytes[1] === "\xd8" && $bytes[2] === "\xff";
    }
    if ($kind === 'png') {
        return $len > 4 && $bytes[0] === "\x89" && $bytes[1] === "\x50" && $bytes[2] === "\x4e" && $bytes[3] === "\x47";
    }
    if ($kind === 'webp') {
        return $len > 12 && substr($bytes, 0, 4) === 'RIFF' && substr($bytes, 8, 4) === 'WEBP';
    }
    if ($kind === 'mp4') {
        return str_contains(substr($bytes, 0, min($len, 32)), 'ftyp');
    }
    return false;
}

function cosmix_boq_kind(string $filename): string
{
    $lower = strtolower($filename);
    if (str_ends_with($lower, '.pdf')) {
        return 'pdf';
    }
    if (str_ends_with($lower, '.xlsx')) {
        return 'xlsx';
    }
    if (str_ends_with($lower, '.xls')) {
        return 'xls';
    }
    return '';
}

function cosmix_photo_kind(string $filename): string
{
    $lower = strtolower($filename);
    if (str_ends_with($lower, '.jpg') || str_ends_with($lower, '.jpeg')) {
        return 'jpeg';
    }
    if (str_ends_with($lower, '.png')) {
        return 'png';
    }
    if (str_ends_with($lower, '.webp')) {
        return 'webp';
    }
    return '';
}

function cosmix_build_multipart(array $fields, array $files): array
{
    $boundary = '----CosmixHub' . bin2hex(random_bytes(8));
    $body = '';
    foreach ($fields as $name => $value) {
        if ($value === null || $value === '') {
            continue;
        }
        $body .= "--{$boundary}\r\nContent-Disposition: form-data; name=\"{$name}\"\r\n\r\n{$value}\r\n";
    }
    foreach ($files as $file) {
        $type = $file['type'] !== '' ? $file['type'] : 'application/octet-stream';
        $filename = str_replace(["\r", "\n", '"'], '', (string) ($file['filename'] ?? 'upload'));
        $body .= "--{$boundary}\r\nContent-Disposition: form-data; name=\"{$file['name']}\"; filename=\"{$filename}\"\r\nContent-Type: {$type}\r\n\r\n";
        $body .= $file['bytes'];
        $body .= "\r\n";
    }
    $body .= "--{$boundary}--\r\n";
    return [
        'body' => $body,
        'contentType' => "multipart/form-data; boundary={$boundary}",
    ];
}

function cosmix_post_hub(string $path, string $rawBody, string $contentType, ?array $config = null): array
{
    $settings = cosmix_hub_settings($config);
    if ($settings === null || !function_exists('curl_init')) {
        return cosmix_fallback();
    }
    $timestamp = (string) time();
    $signature = cosmix_sign($settings['secret'], $timestamp, $rawBody);
    $ch = curl_init($settings['base'] . '/api/v1/public/' . $path);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $rawBody,
        CURLOPT_HTTPHEADER => [
            'Content-Type: ' . $contentType,
            'X-Cosmix-Key: ' . $settings['key'],
            'X-Cosmix-Timestamp: ' . $timestamp,
            'X-Cosmix-Signature: ' . $signature,
            'X-Cosmix-Client-Ip: ' . cosmix_client_ip(),
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
    ]);
    $text = curl_exec($ch);
    if ($text === false) {
        curl_close($ch);
        return cosmix_fallback();
    }
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    $parsed = json_decode($text, true);
    if (!is_array($parsed)) {
        $parsed = ['message' => substr((string) $text, 0, 300)];
    }
    if ($status < 200 || $status >= 300) {
        $message = $parsed['message'] ?? ($parsed['title'] ?? 'The office system could not accept that.');
        if (!is_string($message) || $message === '') {
            $message = 'The office system could not accept that.';
        }
        return [
            'ok' => false,
            'fallback' => false,
            'status' => $status,
            'body' => ['ok' => false, 'message' => $message],
        ];
    }
    return [
        'ok' => true,
        'fallback' => false,
        'status' => $status,
        'body' => ['ok' => true] + $parsed,
    ];
}

function cosmix_uploaded(string $key): array
{
    if (!isset($_FILES[$key]) || !is_array($_FILES[$key])) {
        return [];
    }
    $file = $_FILES[$key];
    $rows = [];
    if (is_array($file['name'])) {
        foreach ($file['name'] as $index => $name) {
            $rows[] = [
                'name' => (string) $name,
                'type' => (string) ($file['type'][$index] ?? ''),
                'tmp' => (string) ($file['tmp_name'][$index] ?? ''),
                'error' => (int) ($file['error'][$index] ?? UPLOAD_ERR_NO_FILE),
                'size' => (int) ($file['size'][$index] ?? 0),
            ];
        }
    } else {
        $rows[] = [
            'name' => (string) ($file['name'] ?? ''),
            'type' => (string) ($file['type'] ?? ''),
            'tmp' => (string) ($file['tmp_name'] ?? ''),
            'error' => (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE),
            'size' => (int) ($file['size'] ?? 0),
        ];
    }
    return array_values(array_filter($rows, static function (array $row): bool {
        return $row['error'] !== UPLOAD_ERR_NO_FILE;
    }));
}

function cosmix_read_upload(array $file): string|false
{
    if ($file['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($file['tmp'])) {
        return false;
    }
    return file_get_contents($file['tmp']);
}
