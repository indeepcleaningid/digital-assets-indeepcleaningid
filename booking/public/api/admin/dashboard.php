<?php
/**
 * GET /api/admin/dashboard.php — ringkasan dashboard admin (PRD Bab 16.3).
 * Booking hari ini, jumlah pending, slot penuh, omzet estimasi hari ini + bulan ini.
 */

require __DIR__ . '/../../../app/lib/bootstrap.php';
require __DIR__ . '/../../../app/lib/session.php';

require_role('admin', 'superadmin');

$pdo = db();
$today = date('Y-m-d');

// Booking hari ini (status aktif, bukan batal/tolak/kedaluwarsa)
$st = $pdo->prepare(
    "SELECT COUNT(*) FROM bookings
     WHERE slot_date = ? AND status NOT IN ('cancelled','rejected','expired')"
);
$st->execute([$today]);
$todayBookings = (int) $st->fetchColumn();

// Menunggu konfirmasi
$pending = (int) $pdo->query("SELECT COUNT(*) FROM bookings WHERE status = 'pending'")->fetchColumn();

// Slot penuh hari ini
$st = $pdo->prepare('SELECT COUNT(*) FROM slots WHERE slot_date = ? AND booked >= capacity');
$st->execute([$today]);
$slotsFull = (int) $st->fetchColumn();

// Omzet estimasi hari ini (status confirmed/in_progress/completed)
$st = $pdo->prepare(
    "SELECT COALESCE(SUM(total), 0) FROM bookings
     WHERE slot_date = ? AND status IN ('confirmed','in_progress','completed')"
);
$st->execute([$today]);
$omzetToday = (int) $st->fetchColumn();

// Omzet estimasi bulan ini (pakai rentang tanggal biar index ramah)
$monthStart = date('Y-m-01');
$monthEnd = date('Y-m-t');
$st = $pdo->prepare(
    "SELECT COALESCE(SUM(total), 0) FROM bookings
     WHERE slot_date BETWEEN ? AND ? AND status IN ('confirmed','in_progress','completed')"
);
$st->execute([$monthStart, $monthEnd]);
$omzetMonth = (int) $st->fetchColumn();

json_response(['data' => [
    'today_bookings'  => $todayBookings,
    'pending_count'   => $pending,
    'slots_full_today'=> $slotsFull,
    'omzet_today'     => $omzetToday,
    'omzet_month'     => $omzetMonth,
]]);
