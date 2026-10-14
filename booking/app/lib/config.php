<?php
/**
 * Loader config — baca config/config.php sekali lalu cache di memori.
 * Dipanggil lewat app/lib/bootstrap.php.
 */

declare(strict_types=1);

function config(string $key): mixed
{
    static $cfg = null;

    if ($cfg === null) {
        $path = dirname(__DIR__, 2) . '/config/config.php';
        if (!is_file($path)) {
            throw new RuntimeException(
                'config/config.php belum ada. Salin config/config.example.php jadi config/config.php lalu isi nilai lokal.'
            );
        }
        $cfg = require $path;
    }

    if (!array_key_exists($key, $cfg)) {
        throw new RuntimeException("Kunci config tidak dikenal: {$key}");
    }

    return $cfg[$key];
}
