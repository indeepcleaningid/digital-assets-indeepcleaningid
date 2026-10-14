<?php
/**
 * POST   /api/addresses.php — tambah alamat (PRD Bab 16.2).
 * PATCH  /api/addresses.php — edit alamat / set default.
 * DELETE /api/addresses.php — hapus alamat (bukan default).
 *
 * Body (POST / PATCH): label, street_no, village, district, city,
 *   province, postal, note, maps_url, is_default, id (untuk PATCH).
 * Delete: ?id=123 atau body {id}.
 */

require __DIR__ . '/../../app/lib/bootstrap.php';
require __DIR__ . '/../../app/lib/session.php';
require __DIR__ . '/../../app/lib/audit.php';

$user = require_login();
$userId = (int) $user['id'];
$method = $_SERVER['REQUEST_METHOD'];

function address_validate(array $body, bool $isCreate): array
{
    $label      = trim((string) ($body['label'] ?? ''));
    $streetNo   = trim((string) ($body['street_no'] ?? ''));
    $village    = trim((string) ($body['village'] ?? ''));
    $district   = trim((string) ($body['district'] ?? ''));
    $city       = trim((string) ($body['city'] ?? ''));
    $province   = trim((string) ($body['province'] ?? ''));
    $postal     = trim((string) ($body['postal'] ?? ''));
    $note       = trim((string) ($body['note'] ?? ''));
    $mapsUrl    = trim((string) ($body['maps_url'] ?? ''));

    if ($label === '' || mb_strlen($label) > 40) {
        json_error(400, 'address_invalid', 'Label alamat wajib diisi, maksimal 40 karakter ya.');
    }
    if ($streetNo === '' || mb_strlen($streetNo) > 255) {
        json_error(400, 'address_invalid', 'Nama jalan dan nomor wajib diisi ya.');
    }
    if ($village === '' || mb_strlen($village) > 100) {
        json_error(400, 'address_invalid', 'Kelurahan/desa wajib diisi ya.');
    }
    if ($district === '' || mb_strlen($district) > 100) {
        json_error(400, 'address_invalid', 'Kecamatan wajib diisi ya.');
    }
    if ($city === '' || mb_strlen($city) > 100) {
        json_error(400, 'address_invalid', 'Kota wajib diisi ya.');
    }
    if ($province === '' || mb_strlen($province) > 100) {
        json_error(400, 'address_invalid', 'Provinsi wajib diisi ya.');
    }
    if (!preg_match('/^\d{5}$/', $postal)) {
        json_error(400, 'address_invalid', 'Kode pos harus 5 angka ya.');
    }
    if ($mapsUrl !== '' && !filter_var($mapsUrl, FILTER_VALIDATE_URL)) {
        json_error(400, 'address_invalid', 'Link Google Maps tidak valid ya.');
    }
    if (mb_strlen($note) > 255) {
        json_error(400, 'address_invalid', 'Catatan maksimal 255 karakter ya.');
    }

    return [
        'label'      => $label,
        'street_no'  => $streetNo,
        'village'    => $village,
        'district'   => $district,
        'city'       => $city,
        'province'   => $province,
        'postal'     => $postal,
        'note'       => $note !== '' ? $note : null,
        'maps_url'   => $mapsUrl !== '' ? $mapsUrl : null,
        'is_default' => !empty($body['is_default']) ? 1 : 0,
    ];
}

$raw  = file_get_contents('php://input');
$body = json_decode($raw ?: '', true);
if (!is_array($body)) {
    $body = [];
}

$id = isset($body['id']) ? (int) $body['id'] : (int) ($_GET['id'] ?? 0);

// --- DELETE ---
if ($method === 'DELETE') {
    if ($id <= 0) {
        json_error(400, 'bad_request', 'Alamat mana yang mau dihapus ya?');
    }
    $stmt = db()->prepare('SELECT id, is_default FROM addresses WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, $userId]);
    $row = $stmt->fetch();
    if (!$row) {
        json_error(404, 'not_found', 'Alamatnya tidak ditemukan ya.');
    }
    if ((int) $row['is_default'] === 1) {
        json_error(400, 'cannot_delete', 'Alamat utama tidak bisa dihapus. Jadikan alamat lain sebagai utama dulu ya.');
    }
    db()->prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?')
        ->execute([$id, $userId]);
    audit_log($userId, 'customer', 'address_delete', null, null, null, 'Alamat #' . $id);
    recompute_profile_complete($userId);
    json_response(['data' => ['ok' => true]]);
}

// --- POST: tambah ---
if ($method === 'POST') {
    $data = address_validate($body, true);

    $pdo = db();
    $pdo->beginTransaction();
    try {
        // Kalau ini alamat pertama atau user minta default → jadikan default
        $count = $pdo->prepare('SELECT COUNT(*) FROM addresses WHERE user_id = ?');
        $count->execute([$userId]);
        $total = (int) $count->fetchColumn();

        if ($total === 0 || $data['is_default'] === 1) {
            $pdo->prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?')
                ->execute([$userId]);
            $data['is_default'] = 1;
        }

        $ins = $pdo->prepare(
            'INSERT INTO addresses (user_id, label, street_no, village, district, city, province, postal, note, maps_url, is_default)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $ins->execute([
            $userId,
            $data['label'], $data['street_no'], $data['village'], $data['district'],
            $data['city'], $data['province'], $data['postal'], $data['note'],
            $data['maps_url'], $data['is_default'],
        ]);
        $newId = (int) $pdo->lastInsertId();
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        json_error(500, 'server_error', 'Gagal menyimpan alamat. Coba lagi ya.');
    }

    audit_log($userId, 'customer', 'address_create', null, null, null, 'Alamat #' . $newId);
    recompute_profile_complete($userId);

    $stmt = $pdo->prepare('SELECT * FROM addresses WHERE id = ?');
    $stmt->execute([$newId]);
    $row = $stmt->fetch();
    $row['id'] = (int) $row['id'];
    $row['is_default'] = (bool) $row['is_default'];

    json_response(['data' => $row]);
}

// --- PATCH: edit / set default ---
if ($method === 'PATCH') {
    if ($id <= 0) {
        json_error(400, 'bad_request', 'Alamat mana yang mau diubah ya?');
    }
    $stmt = db()->prepare('SELECT id, is_default FROM addresses WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, $userId]);
    $row = $stmt->fetch();
    if (!$row) {
        json_error(404, 'not_found', 'Alamatnya tidak ditemukan ya.');
    }

    // Khusus: set default saja (tanpa field lain)
    if (array_key_exists('setDefault', $body) && $body['setDefault']) {
        $pdo = db();
        $pdo->beginTransaction();
        $pdo->prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?')
            ->execute([$userId]);
        $pdo->prepare('UPDATE addresses SET is_default = 1 WHERE id = ? AND user_id = ?')
            ->execute([$id, $userId]);
        $pdo->commit();
        audit_log($userId, 'customer', 'address_set_default', null, null, null, 'Alamat #' . $id);
        recompute_profile_complete($userId);
        json_response(['data' => ['ok' => true]]);
    }

    // Edit field
    $data = address_validate($body, false);
    $pdo = db();

    if ($data['is_default'] === 1 && (int) $row['is_default'] !== 1) {
        $pdo->prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?')
            ->execute([$userId]);
    }

    $upd = $pdo->prepare(
        'UPDATE addresses SET label = ?, street_no = ?, village = ?, district = ?,
         city = ?, province = ?, postal = ?, note = ?, maps_url = ?, is_default = ?
         WHERE id = ? AND user_id = ?'
    );
    $upd->execute([
        $data['label'], $data['street_no'], $data['village'], $data['district'],
        $data['city'], $data['province'], $data['postal'], $data['note'],
        $data['maps_url'], $data['is_default'] === 1 ? 1 : (int) $row['is_default'],
        $id, $userId,
    ]);

    audit_log($userId, 'customer', 'address_update', null, null, null, 'Alamat #' . $id);
    recompute_profile_complete($userId);

    $stmt = $pdo->prepare('SELECT * FROM addresses WHERE id = ?');
    $stmt->execute([$id]);
    $fresh = $stmt->fetch();
    $fresh['id'] = (int) $fresh['id'];
    $fresh['is_default'] = (bool) $fresh['is_default'];

    json_response(['data' => $fresh]);
}

json_error(405, 'method_not_allowed', 'Metode ini tidak didukung.');
