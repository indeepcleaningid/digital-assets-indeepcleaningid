<?php
/**
 * GET /api/availability.php?from=&to= — ketersediaan slot 30 hari (PRD Bab 5.4, 5.5, 11, 16.1).
 *
 * - Selasa selalu libur mutlak (BR01), tanpa baris slot.
 * - Baris slot di-ensure lazily (INSERT IGNORE) saat dibaca — tanpa cron.
 * - Status per slot:
 *   libur    -> Selasa atau dikunci admin (is_locked).
 *   penuh    -> booked >= capacity.
 *   terkunci -> hari H tapi sudah lewat cutoff 7 jam (BR02a, UX date picker).
 *   tersedia -> sisanya.
 * - Window default: hari ini sampai H+29 (total 30 hari, PRD 5.4 maks H+30).
 */

require __DIR__ . '/../../app/lib/bootstrap.php';
require __DIR__ . '/../../app/lib/ratelimit.php';

rate_limit('pub:availability', 120, 60); // 120 hitungan / menit / IP (PRD Bab 18)

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error(405, 'method_not_allowed', 'Metode ini tidak didukung.');
}

const MAX_WINDOW_DAYS = 30;

/** Nama hari Bahasa Indonesia tanpa perlu ext-intl. 1=Senin .. 7=Minggu */
function day_name_id(int $isoDay): string
{
    static $names = [
        1 => 'Senin', 2 => 'Selasa', 3 => 'Rabu', 4 => 'Kamis',
        5 => 'Jumat', 6 => 'Sabtu', 7 => 'Minggu',
    ];
    return $names[$isoDay] ?? '';
}

function avail_date_or_fail(string $raw, string $fallback): string
{
    $raw = $raw !== '' ? $raw : $fallback;
    $d = DateTimeImmutable::createFromFormat('Y-m-d', $raw);
    $err = DateTimeImmutable::getLastErrors();
    if (!$d || ($err !== false && ($err['warning_count'] > 0 || $err['error_count'] > 0))) {
        json_error(400, 'bad_request', 'Format tanggal harus YYYY-MM-DD ya.');
    }
    return $d->format('Y-m-d');
}

$today = new DateTimeImmutable('now'); // container sudah Asia/Jakarta (WIB)

$from = avail_date_or_fail(trim((string) ($_GET['from'] ?? '')), $today->format('Y-m-d'));
$to   = avail_date_or_fail(trim((string) ($_GET['to'] ?? '')), (new DateTimeImmutable($today->format('Y-m-d') . ' +29 days'))->format('Y-m-d'));

if ($to < $from) {
    json_error(400, 'bad_request', 'Tanggal selesai tidak boleh sebelum tanggal mulai ya.');
}

// Clamp maksimal H+30 (rentang 30 hari) — kalender jangan liar (PRD 5.4).
$maxEnd = new DateTimeImmutable($today->format('Y-m-d') . ' +' . (MAX_WINDOW_DAYS - 1) . ' days');
if ($to > $maxEnd->format('Y-m-d')) {
    $to = $maxEnd->format('Y-m-d');
}

$capacity = (int) config('SLOT_CAPACITY_DEFAULT');
$times = ['09.00', '13.00']; // BR02

// --- Ensure baris slot non-Selasa dalam window (lazy, anti duplikat via unique key) ---
$pdo = db();
$ins = $pdo->prepare(
    'INSERT IGNORE INTO slots (slot_date, slot_time, capacity, booked) VALUES (?, ?, ?, 0)'
);
$cur = new DateTimeImmutable($from);
$curEnd = new DateTimeImmutable($to);
while ($cur <= $curEnd) {
    if ((int) $cur->format('N') !== 2) { // 2 = Selasa
        foreach ($times as $t) {
            $ins->execute([$cur->format('Y-m-d'), $t, $capacity]);
        }
    }
    $cur = $cur->modify('+1 day');
}

// --- Ambil baris slot yang ada ---
$stmt = $pdo->prepare(
    'SELECT slot_date, slot_time, capacity, booked, is_locked
     FROM slots
     WHERE slot_date BETWEEN ? AND ?
     ORDER BY slot_date ASC, slot_time ASC'
);
$stmt->execute([$from, $to]);
$rows = $stmt->fetchAll();

$byDate = [];
foreach ($rows as $r) {
    $byDate[$r['slot_date']][] = $r;
}

// --- Susun response per tanggal ---
$out = [];
$cur = new DateTimeImmutable($from);
while ($cur <= $curEnd) {
    $date = $cur->format('Y-m-d');
    $isTuesday = (int) $cur->format('N') === 2;
    $isToday = $date === $today->format('Y-m-d');

    if ($isTuesday) {
        $out[] = [
            'date'     => $date,
            'day_name' => 'Selasa',
            'status'   => 'libur',
            'slots'    => [],
            'note'     => 'Selasa kami libur ya.',
        ];
        $cur = $cur->modify('+1 day');
        continue;
    }

    $slots = [];
    $dateStatus = 'tersedia';
    foreach ($byDate[$date] ?? [] as $r) {
        $time = $r['slot_time'];
        $timeHour = substr($time, 0, 2);
        $timeMin = substr($time, 3, 2);

        if ((int) $r['is_locked'] === 1) {
            $status = 'libur';
        } elseif ((int) $r['booked'] >= (int) $r['capacity']) {
            $status = 'penuh';
        } elseif ($isToday) {
            // BR02a: cutoff 7 jam sebelum jam cuci — lewat itu slot hari H terkunci.
            $cutoff = new DateTimeImmutable($date . ' ' . $timeHour . ':' . $timeMin . ':00');
            $cutoff = $cutoff->modify('-7 hours');
            $status = ($today >= $cutoff) ? 'terkunci' : 'tersedia';
        } else {
            $status = 'tersedia';
        }

        if ($status === 'penuh' || $status === 'libur') {
            $dateStatus = 'penuh';
        }

        $slots[] = [
            'time'     => $time,
            'status'   => $status,
            'booked'   => (int) $r['booked'],
            'capacity' => (int) $r['capacity'],
        ];
    }

    $out[] = [
        'date'     => $date,
        'day_name' => day_name_id((int) $cur->format('N')),
        'status'   => $dateStatus,
        'slots'    => $slots,
        'note'     => null,
    ];
    $cur = $cur->modify('+1 day');
}

json_response([
    'data' => [
        'from'      => $from,
        'to'        => $to,
        'cutoff_hours' => 7,
        'days'      => $out,
    ],
]);
