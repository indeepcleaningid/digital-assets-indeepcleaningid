<?php
// TEMPORARY SMTP TEST — hapus setelah selesai testing!
header('Content-Type: text/plain; charset=utf-8');

$root = __DIR__ . '/..';
require $root . '/app/lib/bootstrap.php';

echo "=== SMTP TEST ===\n\n";

$host = (string) config('SMTP_HOST');
$user = (string) config('SMTP_USER');
$pass = (string) config('SMTP_PASS');

echo "SMTP_HOST: " . ($host === '(kosong)' || $host === '' ? '(KOSONG!)' : $host) . "\n";
echo "SMTP_USER: " . ($user === '' ? '(KOSONG!)' : $user) . "\n";
echo "SMTP_PASS: " . ($pass === '' ? '(KOSONG!)' : str_repeat('*', 4) . ' (terisi, ' . strlen($pass) . ' karakter)') . "\n";
echo "APP_URL:   " . (string) config('APP_URL') . "\n";
echo "\n";

if ($host === '' || $user === '' || $pass === '') {
    echo "STATUS: GAGAL — SMTP belum lengkap di config/config.php!\n";
    echo "Isi SMTP_HOST, SMTP_USER, SMTP_PASS dulu ya.\n";
    exit;
}

echo "Coba koneksi ke {$host}:465...\n";

$remote = 'tls://' . $host . ':465';
$fp = @stream_socket_client($remote, $errno, $errstr, 10, STREAM_CLIENT_CONNECT);

if ($fp === false) {
    echo "STATUS: GAGAL konek — {$errstr} ({$errno})\n";
    exit;
}

echo "Koneksi OK! Baca sapaan server...\n";
stream_set_timeout($fp, 10);

$banner = rtrim(fgets($fp, 4096), "\r\n");
echo "Server: {$banner}\n";

// EHLO
fwrite($fp, "EHLO localhost\r\n");
$resp = '';
while (true) {
    $line = rtrim(fgets($fp, 4096), "\r\n");
    $resp .= $line . "\n";
    if (preg_match('/^(\d{3})[ ]/', $line)) break;
}
echo "EHLO response:\n{$resp}\n";

// AUTH LOGIN
fwrite($fp, "AUTH LOGIN\r\n");
$auth = rtrim(fgets($fp, 4096), "\r\n");
echo "AUTH LOGIN: {$auth}\n";

// Username
fwrite($fp, base64_encode($user) . "\r\n");
$authUser = rtrim(fgets($fp, 4096), "\r\n");
echo "Username response: {$authUser}\n";

if (strpos($authUser, '334') !== 0) {
    echo "STATUS: GAGAL di username step!\n";
    fclose($fp);
    exit;
}

// Password
fwrite($fp, base64_encode($pass) . "\r\n");
$authPass = rtrim(fgets($fp, 4096), "\r\n");
echo "Password response: {$authPass}\n";

if (strpos($authPass, '235') === 0) {
    echo "\nSTATUS: ✅ AUTH BERHASIL! SMTP ready.\n";
} else {
    echo "\nSTATUS: ❌ AUTH GAGAL — App Password salah atau Gmail block.\n";
}

fclose($fp);
