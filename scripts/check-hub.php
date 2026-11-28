<?php
require dirname(__DIR__) . '/public/api/lib.php';

$failed = false;
function fail(string $message): void
{
    global $failed;
    fwrite(STDERR, $message . PHP_EOL);
    $failed = true;
}

$secret = 'test-secret';
$timestamp = '1700000000';
$body = '{"name":"Ayesha Khan","mobile":"03001234567"}';
$signed = cosmix_sign($secret, $timestamp, $body);
$openssl = shell_exec('printf %s ' . escapeshellarg($timestamp . '.' . $body) . ' | openssl dgst -sha256 -hmac ' . escapeshellarg($secret));
$opensslHex = '';
if (preg_match('/([a-f0-9]{64})\s*$/', (string) $openssl, $match)) {
    $opensslHex = $match[1];
}
if ($signed !== 'sha256=' . $opensslHex) {
    fail('PHP HMAC did not match OpenSSL.');
}

$missing = cosmix_post_hub('leads', $body, 'application/json', []);
if (empty($missing['body']['fallback']) || ($missing['body']['ok'] ?? true) !== false) {
    fail('Missing Hub configuration should ask the visitor to use WhatsApp.');
}

if (!isset(cosmix_lead_from_fields([])['error'])) {
    fail('A lead without a name should be rejected.');
}
if (!isset(cosmix_lead_from_fields(['name' => 'A', 'mobile' => '0300', 'productInterest' => 'VRF'])['error'])) {
    fail('Unknown product interest should be rejected.');
}
$lead = cosmix_lead_from_fields([
    'name' => 'Ayesha Khan',
    'mobile' => '03001234567',
    'productInterest' => 'AUX_VRF',
    'areaSqFt' => '1200',
    'estimatedTR' => '',
    'utm_source' => 'google',
    'company' => '',
]);
if (isset($lead['error']) || ($lead['lead']['areaSqFt'] ?? null) !== 1200 || ($lead['lead']['productInterest'] ?? '') !== 'AUX_VRF') {
    fail('Lead fields were not normalised.');
}
if (array_key_exists('company', $lead['lead']) || array_key_exists('estimatedTR', $lead['lead'])) {
    fail('Empty lead fields should be omitted.');
}

if (!cosmix_looks_like("%PDF-1.4\n", 'pdf')) {
    fail('PDF magic bytes should pass.');
}
if (cosmix_looks_like('not a pdf', 'pdf')) {
    fail('Plain text should not pass as a PDF.');
}
$xlsx = "\x50\x4b\x03\x04" . 'xl/workbook.xml';
if (!cosmix_looks_like($xlsx, 'xlsx')) {
    fail('XLSX magic bytes should pass.');
}
if (cosmix_looks_like("\x50\x4b\x03\x04\x00", 'xlsx')) {
    fail('A ZIP without an xl/ entry should not pass as XLSX.');
}

$multipart = cosmix_build_multipart(
    ['name' => 'Ayesha', 'mobile' => '03001234567'],
    [['name' => 'boq', 'filename' => 'boq.pdf', 'type' => 'application/pdf', 'bytes' => "%PDF-1.4\n"]]
);
if (!str_contains($multipart['contentType'], 'boundary=') || !str_contains($multipart['body'], "%PDF-1.4\n") || !str_contains($multipart['body'], 'name="boq"')) {
    fail('Multipart body did not keep the BOQ bytes.');
}

$port = 8791;
$router = sys_get_temp_dir() . '/cosmix-mock-hub.php';
file_put_contents($router, <<<'PHP'
<?php
$secret = 'test-secret';
$raw = file_get_contents('php://input');
$timestamp = $_SERVER['HTTP_X_COSMIX_TIMESTAMP'] ?? '';
$signature = $_SERVER['HTTP_X_COSMIX_SIGNATURE'] ?? '';
$key = $_SERVER['HTTP_X_COSMIX_KEY'] ?? '';
$expect = 'sha256=' . hash_hmac('sha256', $timestamp . '.' . $raw, $secret);
if ($key !== 'test-key' || !hash_equals($expect, $signature)) {
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode(['message' => 'Website credential was missing or did not match.']);
    exit;
}
http_response_code(201);
header('Content-Type: application/json');
echo json_encode(['leadId' => 'lead-1', 'duplicate' => false]);
PHP);
$log = sys_get_temp_dir() . '/cosmix-mock-hub.log';
$proc = proc_open(
    ['php', '-S', '127.0.0.1:' . $port, $router],
    [1 => ['file', $log, 'w'], 2 => ['file', $log, 'a']],
    $pipes,
    sys_get_temp_dir()
);
$ready = false;
if (is_resource($proc)) {
    for ($i = 0; $i < 40; $i++) {
        $socket = @fsockopen('127.0.0.1', $port, $errno, $error, 0.2);
        if ($socket) {
            fclose($socket);
            $ready = true;
            break;
        }
        usleep(100000);
    }
}
if (!$ready) {
    fail('Mock Hub did not start.');
} else {
    $posted = cosmix_post_hub('leads', $body, 'application/json', [
        'HUB_BASE_URL' => 'http://127.0.0.1:' . $port,
        'HUB_API_KEY' => 'test-key',
        'HUB_HMAC_SECRET' => $secret,
    ]);
    if (empty($posted['ok']) || ($posted['body']['leadId'] ?? '') !== 'lead-1') {
        fail('Signed lead was not accepted by the mock Hub.');
    }
}
if (is_resource($proc)) {
    proc_terminate($proc);
    proc_close($proc);
}

if ($failed) {
    fwrite(STDERR, "Hub check failed\n");
    exit(1);
}
echo "Hub check ok\n";
