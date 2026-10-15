<?php
/**
 * Helper domain slot/jadwal:
 * - sinkronisasi counter slots.booked (bugfix T8-B5 post-E2E)
 * - aturan tanggal jadwal bersama: Selasa libur, tidak lewat, maks H+30
 *   (issue #17 — dipakai create customer & reschedule admin)
 *
 * slots.booked adalah counter turunan; source of truth = tabel bookings.
 * Sebelum fix, hard delete & cancel-admin memakai decrement manual tersebar —
 * booking completed terhapus meninggalkan "ghost count" (slot kebaca penuh
 * padahal tidak ada booking).
 *
 * Aturan konsisten dengan seluruh perilaku create/cancel/expire:
 *   status yang MENGHITUNG booked = pending, confirmed, in_progress, completed
 *   (completed tetap menghitung: slot sudah terpakai dikerjakan)
 *   cancelled, rejected, expired   = tidak menghitung
 */

declare(strict_types=1);

/**
 * Recount booked 1 slot dari tabel bookings. Panggil DALAM transaksi.
 * Pakai di: hard delete booking, hard delete customer, cancel/reject admin.
 */
function slot_recount(PDO $pdo, string $slotDate, string $slotTime): void
{
    $st = $pdo->prepare(
        "UPDATE slots s
         SET booked = (
             SELECT COUNT(*) FROM bookings b
             WHERE b.slot_date = s.slot_date
               AND b.slot_time = s.slot_time
               AND b.status IN ('pending','confirmed','in_progress','completed')
         )
         WHERE s.slot_date = ? AND s.slot_time = ?"
    );
    $st->execute([$slotDate, $slotTime]);
}

/**
 * Recount banyak slot sekaligus (pakai saat hard delete customer —
 * semua booking customer diselesaikan dulu, baru slot-nya dikunci ulang).
 * $pairs: list ['slot_date' => ..., 'slot_time' => ...]
 */
function slot_recount_many(PDO $pdo, array $pairs): void
{
    $seen = [];
    foreach ($pairs as $p) {
        $key = $p['slot_date'] . '|' . $p['slot_time'];
        if (isset($seen[$key])) {
            continue;
        }
        $seen[$key] = true;
        slot_recount($pdo, (string) $p['slot_date'], (string) $p['slot_time']);
    }
}

/**
 * Aturan tanggal jadwal BERSAMA (BR01 Selasa libur, tidak lewat, maks H+30).
 * Satu aturan untuk bookings-create (customer) & reschedule admin — jangan
 * ditulis ulang di endpoint lain (issue #17). Backend jangan percaya frontend.
 *
 * @return DateTimeImmutable tanggal valid (sudah terverifikasi format Y-m-d)
 * Melempar json_error(400) kalau format salah / lewat / melebihi H+30 / Selasa.
 */
function slot_assert_date_rules(string $dateRaw): DateTimeImmutable
{
    $d = DateTimeImmutable::createFromFormat('Y-m-d', $dateRaw);
    $err = DateTimeImmutable::getLastErrors();
    if (!$d || $dateRaw === '' || ($err !== false && ($err['warning_count'] > 0 || $err['error_count'] > 0))) {
        json_error(400, 'date_invalid', 'Pilih tanggal dulu ya.');
    }

    $todayStr = (new DateTimeImmutable('now'))->format('Y-m-d'); // WIB — bootstrap

    if ($dateRaw < $todayStr) {
        json_error(400, 'date_invalid', 'Tanggal sudah lewat. Pilih tanggal ke depan ya.');
    }

    $maxDate = new DateTimeImmutable($todayStr . ' +30 days');
    if ($dateRaw > $maxDate->format('Y-m-d')) {
        json_error(400, 'date_invalid', 'Jadwal maksimal 30 hari ke depan ya.');
    }

    if ((int) $d->format('N') === 2) {
        json_error(400, 'hari_selasa', 'Selasa kami libur ya. Pilih Rabu sampai Senin.');
    }

    return $d;
}
