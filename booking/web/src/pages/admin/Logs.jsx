import { useEffect, useState } from 'react'
import { useListQuery } from '../../lib/useListQuery.js'

/**
 * Audit log admin (PRD Bab 11 poin 9, 16.3): siapa, kapan, aksi, dari→ke status, alasan.
 * created_at UTC sesuai PRD Bab 15 — tampilkan apa adanya + catatan UTC.
 */

const AKSI_LIST = [
  '', 'booking_create', 'booking_cancel', 'booking_status',
  'slot_update', 'pricelist_update',
  'email_change', 'password_change', 'password_reset',
  'address_create', 'address_update', 'address_delete', 'address_set_default',
]

function aksiLabel(a) {
  const map = {
    booking_create: 'Booking Dibuat',
    booking_cancel: 'Booking Dibatalkan',
    booking_status: 'Status Booking',
    slot_update: 'Slot Diubah',
    pricelist_update: 'Pricelist Diubah',
    email_change: 'Email Diganti',
    password_change: 'Password Diganti',
    password_reset: 'Password Reset',
    address_create: 'Alamat Ditambah',
    address_update: 'Alamat Diubah',
    address_delete: 'Alamat Dihapus',
    address_set_default: 'Alamat Utama Diubah',
  }
  return map[a] || a
}

export default function AdminLogs() {
  const [action, setAction] = useState('')
  const [bookingId, setBookingId] = useState('')

  // Logs tidak punya tombol "Terapkan": semua filter auto-apply. `booking_id`
  // (teks) di-debounce, `action` (dropdown) langsung. Plus abort request lama.
  const { rows, total, page, totalPages, loading, error, setPage } = useListQuery({
    path: '/admin/logs.php',
    params: { action, booking_id: bookingId },
    pageSize: 30,
    liveKeys: ['booking_id', 'action'],
  })

  useEffect(() => {
    document.title = 'Audit Log Admin | App InDeep Booking'
  }, [])

  return (
    <div>
      <h2 className="mb-1 text-2xl font-extrabold">Audit Log</h2>
      <p className="mb-4 text-sm text-gray-600">Waktu ditampilkan dalam UTC (sesuai PRD Bab 15).</p>

      <div className="card mb-4 flex flex-wrap items-end gap-3 p-4">
        <label className="block text-sm font-bold">
          Aksi
          <select value={action} onChange={(e) => setAction(e.target.value)} className="input-brutal mt-1">
            {AKSI_LIST.map((a) => (
              <option key={a} value={a}>{a === '' ? 'Semua' : aksiLabel(a)}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-bold">
          ID Booking
          <input
            type="number"
            min="1"
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
            className="input-brutal mt-1 w-36"
            placeholder="semua"
          />
        </label>
      </div>

      {error ? (
        <p role="alert" className="mb-3 rounded-xl border-2 border-black bg-red-100 px-3 py-2 text-sm font-bold">{error}</p>
      ) : null}

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b-2 border-black bg-paper">
            <tr>
              <th className="p-3 font-extrabold">Waktu (UTC)</th>
              <th className="p-3 font-extrabold">Pelaku</th>
              <th className="p-3 font-extrabold">Aksi</th>
              <th className="p-3 font-extrabold">Booking</th>
              <th className="p-3 font-extrabold">Perubahan</th>
              <th className="p-3 font-extrabold">Alasan</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-4 text-center text-gray-500">Memuat…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center text-gray-500">Tidak ada log.</td></tr>
            ) : rows.map((l) => (
              <tr key={l.id} className="border-b border-gray-200 last:border-0">
                <td className="p-3 whitespace-nowrap">{l.created_at}</td>
                <td className="p-3">
                  {l.actor_id ? `#${l.actor_id}` : '—'}
                  <span className="ml-1 rounded border border-black px-1 text-xs">{l.actor_role}</span>
                </td>
                <td className="p-3 font-bold">{aksiLabel(l.action)}</td>
                <td className="p-3">{l.booking_id ?? '—'}</td>
                <td className="p-3">
                  {l.from_status || l.to_status
                    ? `${l.from_status || '—'} → ${l.to_status || '—'}`
                    : '—'}
                </td>
                <td className="p-3 text-xs text-gray-600">{l.reason || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm text-gray-600">Total {total} log · Halaman {page}/{totalPages}</p>
        <div className="flex gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-press text-sm disabled:opacity-40">
            Sebelumnya
          </button>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="btn btn-press text-sm disabled:opacity-40">
            Berikutnya
          </button>
        </div>
      </div>
    </div>
  )
}
