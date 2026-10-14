<?php
// TEMPORARY OTP SEND TEST — hapus setelah selesai!
header('Content-Type: text/plain; charset=utf-8');

$root = __DIR__ . '/..';
require $root . '/app/lib/bootstrap.php';
require $root . '/app/lib/smtp.php';

$to = $_GET['to'] ?? '';
if ($to === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
    echo "Pakai: smtp-test.php?to=email@domain.com\n";
    exit;
}

$host = (string) config('SMTP_HOST');
$user = (string) config('SMTP_USER');
$pass = (string) config('SMTP_PASS');
$from = $user; // DMARC: from = user

echo "=== OTP EMAIL SEND TEST ===\n\n";
echo "Dari: {$from}\n";
echo "Ke:   {$to}\n";
echo "Host: {$host}:465\n\n";

$subject = "Test OTP — InDeepCleaningID";
$body = "Ini email test dari App InDeep Booking.\n\nKalau kamu terima email ini, berarti SMTP work.\n";

$remote = 'tls://' . $host . ':465';
$fp = @stream_socket_client($remote, $errno, $errstr, 15, STREAM_CLIENT_CONNECT);
if ($fp === false) {
    echo "GAGAL konek: {$errstr} ({$errno})\n";
    exit;
}
stream_set_timeout($fp, 20);

echo "--- SMTP DIALOG ---\n";

// Banner
$banner = rtrim(fgets($fp, 4096), "\r\n");
echo "S: {$banner}\n";

// EHLO
fwrite($fp, "EHLO localhost\r\n");
while (true) {
    $line = rtrim(fgets($fp, 4096), "\r\n");
    echo "S: {$line}\n";
    if (preg_match('/^(\d{3})[ ]/', $line)) break;
}

// AUTH LOGIN
fwrite($fp, "AUTH LOGIN\r\n");
echo "S: " . rtrim(fgets($fp, 4096), "\r\n") . "\n";

fwrite($fp, base64_encode($user) . "\r\n");
echo "S: " . rtrim(fgets($fp, 4096), "\r\n") . "\n";

fwrite($fp, base64_encode($pass) . "\r\n");
$authResult = rtrim(fgets($fp, 4096), "\r\n");
echo "S: {$authResult}\n";

if (strpos($authResult, '235') !== 0) {
    echo "\nAUTH GAGAL!\n";
    fclose($fp);
    exit;
}

// MAIL FROM
fwrite($fp, "MAIL FROM:<{$from}>\r\n");
echo "S: " . rtrim(fgets($fp, 4096), "\r\n") . "\n";

// RCPT TO
fwrite($fp, "RCPT TO:<{$to}>\r\n");
$rcpt = rtrim(fgets($fp, 4096), "\r\n");
echo "S: {$rcpt}\n";

if (strpos($rcpt, '250') !== 0 && strpos($rcpt, '251') !== 0) {
    echo "\nRCPT TO DITOLAK! Gmail gak terima alamat ini.\n";
    fclose($fp);
    exit;
}

// DATA
fwrite($fp, "DATA\r\n");
echo "S: " . rtrim(fgets($fp, 4096), "\r\n") . "\n";

// Message
$message =
    "From: " . smtp_encode_header('InDeepCleaningID') . " <{$from}>\r\n" .
    "To: <{$to}>\r\n" .
    "Subject: " . smtp_encode_header($subject) . "\r\n" .
    "Date: " . date(DATE_RFC2822) . "\r\n" .
    "MIME-Version: 1.0\r\n" .
    "Content-Type: text/plain; charset=UTF-8\r\n" .
    "Content-Transfer-Encoding: base64\r\n" .
    "\r\n" .
    chunk_split(base64_encode($body));

fwrite($fp, $message . ".\r\n");
$sendResult = rtrim(fgets($fp, 4096), "\r\n");
echo "S: {$sendResult}\n";

fwrite($fp, "QUIT\r\n");
fclose($fp);

if (strpos($sendResult, '250') === 0) {
    echo "\n=== STATUS: ✅ EMAIL DITERIMA GMAIL (250) ===\n";
    echo "Kalau gak masuk Inbox, cek SPAM.\n";
} else {
    echo "\n=== STATUS: ❌ GMAIL NOLAK EMAIL ===\n";
}
