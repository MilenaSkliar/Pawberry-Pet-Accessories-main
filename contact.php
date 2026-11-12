<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function respond(int $code, bool $success, string $message): never {
    http_response_code($code);
    echo json_encode(['success' => $success, 'message' => $message]);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(405, false, 'Method not allowed.');
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 20000) respond(413, false, 'Request too large.');
$raw = file_get_contents(__DIR__ . '/config/config.js');
if ($raw === false) respond(503, false, 'Configuration unavailable.');
$start = strpos($raw, '{');
$end = strrpos($raw, '}');
if ($start === false || $end === false) respond(503, false, 'Configuration unavailable.');
$config = json_decode(substr($raw, $start, $end - $start + 1), true);
if (!is_array($config) || empty($config['form']['enabled'])) respond(503, false, 'Contact form unavailable.');
$recipient = $config['email'] ?? '';
if (!filter_var($recipient, FILTER_VALIDATE_EMAIL) || preg_match('/[\r\n]/', $recipient) || str_ends_with(strtolower($recipient), '.example')) respond(503, false, 'Email delivery has not been configured.');
foreach (['name','email','message','topic','website','consent'] as $field) {
    if (isset($_POST[$field]) && !is_string($_POST[$field])) respond(422, false, 'Invalid input.');
}
$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$message = trim($_POST['message'] ?? '');
$topic = trim($_POST['topic'] ?? '');
if (!empty($_POST['website'])) respond(422, false, 'Unable to process request.');
if (strlen($name) < 2 || strlen($name) > 200 || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254 || preg_match('/[\r\n]/', $email . $name) || strlen($message) < 10 || strlen($message) > 10000 || ($_POST['consent'] ?? '') !== 'yes' || !in_array($topic, $config['form']['topics'] ?? [], true)) respond(422, false, 'Please check your form fields.');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && strtolower((string)parse_url($origin, PHP_URL_HOST)) !== strtolower(explode(':', $_SERVER['HTTP_HOST'] ?? '')[0])) respond(403, false, 'Invalid origin.');
session_start(['cookie_httponly' => true, 'cookie_samesite' => 'Lax', 'cookie_secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off']);
if (isset($_SESSION['last_request']) && time() - $_SESSION['last_request'] < 60) respond(429, false, 'Please wait a minute before sending again.');
$_SESSION['last_request'] = time();
session_write_close();
$subject = preg_replace('/[\r\n]+/', ' ', (string)($config['form']['subject'] ?? 'Website enquiry'));
$body = "Name: $name\nEmail: $email\nTopic: $topic\n\n$message\n\nPrivacy consent: yes\n";
$headers = ['From' => $recipient, 'Reply-To' => $email, 'Content-Type' => 'text/plain; charset=UTF-8', 'MIME-Version' => '1.0'];
$accepted = function_exists('mail') && @mail($recipient, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, $headers);
if (!$accepted) respond(503, false, 'Mail service could not accept your request.');
respond(200, true, (string)$config['form']['success']);
