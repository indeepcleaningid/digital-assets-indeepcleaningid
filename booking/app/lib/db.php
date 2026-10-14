<?php
/**
 * Koneksi PDO tunggal ke MySQL/MariaDB InnoDB (PRD Bab 14.1 dan 15).
 * - Exception mode: semua error query langsung meledak, gak ditelan diam-diam.
 * - tanpa emulasi prepare: pakai prepared statement asli MySQL (anti SQL injection).
 * - charset utf8mb4 sesuai PRD Bab 15.
 */

declare(strict_types=1);

function db(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=utf8mb4',
        (string) config('DB_HOST'),
        (string) config('DB_NAME')
    );

    $pdo = new PDO($dsn, (string) config('DB_USER'), (string) config('DB_PASS'), [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    return $pdo;
}
