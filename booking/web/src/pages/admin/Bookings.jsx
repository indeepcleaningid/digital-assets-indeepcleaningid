import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError } from '../../lib/api.js'
import { formatRupiah, formatDateShort, formatSlotTime, statusBadgeClass, statusLabel } from '../../lib/format.js'
import { useAuth } from '../../lib/auth.jsx'

/**
 * Booking admin (PRD Bab 16.3): tabel + filter + search + pagination server-side.
 * Aksi tulis (D1): ubah status dengan alasan + optimistic lock (version).
 * Superadmin (T7-B2): pindah jadwal (pending/confirmed) + hapus permanen.
 */

const TRANSITIONS = {
  pending: [
    { to: 'confirmed', label: 'Konfirmasi', cta: true },
    { to: 'rejected', label: 'Tolak', needReason: true },
    { to: 'cancelled', label: 'Batalkan', needReason: true },
  ],
  confirmed: [
    { to: 'in_progress', label: 'Mulai Kerjakan', cta: true },
    { to: 'cancelled', label: 'Batalkan', needReason: true },
  ],
  in_progress: [{ to: 'completed', label: 'Selesaikan', cta: true }],
}

// Aksi butuh alasan (tolak/batalkan) = destruktif — hover merah muda biar
// jelas kelihatan, bukan ghost putih-krem yang nyaris tak terlihat
const BTN_CTA = 'btn text-xs btn-cta'
const BTN_NEED_REASON = 'btn text-xs border-red-700 bg-red-50 text-red-800 hover:bg-red-100 hover:translate-x-px hover:translate-y-px'
const BTN_PLAIN = 'btn text-xs btn-press'

// Tanggal lokal browser (bukan toISOString — itu UTC) buat min/max input
// pindah jadwal: hari ini s/d H+30, aturan sama dengan backend (issue #17)
function hariLokal(offsetHari = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offsetHari)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// Guard UX Selasa (backend juga menolak — slot_assert_date_rules, issue #17)
function isSelasa(ymd) {
  return ymd !== '' && new Date(`${ymd}T00:00:00`).getDay() === 2
}

const STATUS_OPTIONS = [
  '', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rejected', 'expired',
]

/**
 * Link click-to-chat WhatsApp (wa.me) — admin tinggal klik, chat terbuka
 * langsung ke nomor customer dari WhatsApp admin (web/app yang sudah login).
 * Nomor dinormalisasi ke format internasional tanpa "+": 0812… -> 62812…
 * Template pesan disesuaikan permintaan Bang Rob (rincian item + surcharge).
 */
function waLink(phone, booking) {
  let n = String(phone || '').replace(/[^0-9]/g, '')
  if (n.startsWith('0')) n = '62' + n.slice(1)
  if (!n) return null

  const cap = (s) => String(s || '').charAt(0).toUpperCase() + String(s || '').slice(1)
  const rupiahPlain = (v) => 'Rp ' + Number(v).toLocaleString('id-ID')
  const sizeLabel = (size) => {
    const s = String(size || '').trim()
    return /^\d+$/.test(s) ? ` uk.${s}` : ` ${s}`
  }

  const lines = (booking.items || []).map((it) =>
    `- Wet Cleaning ${cap(it.name)}${sizeLabel(it.size)} : ${rupiahPlain(it.total)}`
  )
  for (const s of (booking.surcharges || [])) {
    lines.push(`- Tambahan ${s.title} : ${rupiahPlain(s.total)}`)
  }

  // 🙏 tanpa skin-tone modifier (sequence skin-tone gampang pecah jadi kotak
  // di sebagian device/pipeline) + unicode escape biar gak tergantung encoding file
  const pray = '\u{1F64F}'
  const text =
    `Halo kak *${booking.name}*, kami menerima pembookingan dengan booking *ID ${booking.code}* ` +
    `tanggal ${formatDateShort(booking.slot_date)} jam ${formatSlotTime(booking.slot_time)} ` +
    `dengan rincian sebagai berikut:\n` +
    lines.join('\n') +
    `\n\n*Total: ${rupiahPlain(booking.total)},-*\n\n` +
    `Mohon konfirmasi terlebih dahulu untuk kebenaran datanya ya kak agar dapat kami keep jadwal bookingnya. Terima kasih ${pray}`

  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`
}

export default function AdminBookings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isSuper = user?.role === 'superadmin'

  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [status, setStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [slotTime, setSlotTime] = useState('')
  const [search, setSearch] = useState('')

  // dialog aksi: { booking, action }
  const [dialog, setDialog] = useState(null)
  const [alasan, setAlasan] = useState('')
  const [busy, setBusy] = useState(false)

  // dialog pindah jadwal & hapus (superadmin)
  const [move, setMove] = useState(null) // { booking, slot_date, slot_time, reason }
  const [moveError, setMoveError] = useState('')
  const [hapus, setHapus] = useState(null) // booking yang mau dihapus

  const muat = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '20' })
      if (status) qs.set('status', status)
      if (dateFrom) qs.set('date_from', dateFrom)
      if (dateTo) qs.set('date_to', dateTo)
      if (slotTime) qs.set('slot_time', slotTime)
      if (search) qs.set('search', search)
      const res = await api(`/admin/bookings.php?${qs}`)
      setRows(res.data.data)
      setTotal(res.data.total)
      setPage(res.data.page)
      setTotalPages(res.data.totalPages)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat booking.')
    } finally {
      setLoading(false)
    }
  }, [page, status, dateFrom, dateTo, slotTime, search])

  useEffect(() => {
    document.title = 'Booking Admin | App InDeep Booking'
  }, [])

  useEffect(() => {
    muat()
  }, [muat])

  function onFilter(e) {
    e.preventDefault()
    setPage(1)
    muat()
  }

  function bukaDialog(booking, action) {
    setDialog({ booking, action })
    setAlasan('')
  }

  async function jalankanAksi() {
    if (!dialog) return
    const { booking, action } = dialog
    if (action.needReason && !alasan.trim()) {
      setError('Alasan wajib diisi ya.')
      return
    }
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      await api('/admin/bookings.php', {
        method: 'PATCH',
        body: JSON.stringify({
          id: booking.id,
          status: action.to,
          reason: alasan.trim() || undefined,
          version: booking.version,
        }),
      })
      setSuccess(`Booking ${booking.code} → ${statusLabel(action.to)}.`)
      setDialog(null)
      await muat()
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('Booking baru diubah orang lain. Daftar dimuat ulang ya.')
        setDialog(null)
        await muat()
      } else {
        setError(err instanceof ApiError ? err.message : 'Gagal mengubah status.')
      }
    } finally {
      setBusy(false)
    }
  }

  async function simpanPindah() {
    if (!move) return
    if (!move.slot_date || !move.slot_time) {
      setMoveError('Pilih tanggal dan jam baru dulu ya.')
      return
    }
    if (isSelasa(move.slot_date)) {
      setMoveError('Selasa kami libur ya. Pilih Rabu sampai Senin.')
      return
    }
    setBusy(true)
    setMoveError('')
    setSuccess('')
    try {
      await api('/admin/bookings.php', {
        method: 'PATCH',
        body: JSON.stringify({
          id: move.booking.id,
          slot_date: move.slot_date,
          slot_time: move.slot_time,
          reason: move.reason?.trim() || undefined,
        }),
      })
      setSuccess(`Booking ${move.booking.code} dipindah ke ${move.slot_date} ${move.slot_time}.`)
      setMove(null)
      await muat()
    } catch (err) {
      setMoveError(err instanceof ApiError ? err.message : 'Gagal memindah jadwal.')
    } finally {
      setBusy(false)
    }
  }

  async function konfirmasiHapus() {
    if (!hapus) return
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      await api(`/admin/bookings.php?id=${hapus.id}`, { method: 'DELETE' })
      setSuccess(`Booking ${hapus.code} dihapus permanen.`)
      setHapus(null)
      await muat()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menghapus booking.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <h2 className="mb-4 text-2xl font-extrabold">Semua Booking</h2>

      {/* Filter */}
      <form onSubmit={onFilter} className="card mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="block text-sm font-bold">
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-brutal mt-1">
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s === '' ? 'Semua' : statusLabel(s)}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-bold">
          Dari tanggal
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-brutal mt-1" />
        </label>
        <label className="block text-sm font-bold">
          Sampai tanggal
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input-brutal mt-1" />
        </label>
        <label className="block text-sm font-bold">
          Jam
          <select value={slotTime} onChange={(e) => setSlotTime(e.target.value)} className="input-brutal mt-1">
            <option value="">Semua</option>
            <option value="09.00">Pagi 09.00</option>
            <option value="13.00">Siang 13.00</option>
          </select>
        </label>
        <label className="block text-sm font-bold">
          Cari (kode/nama/WA)
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} className="input-brutal mt-1" placeholder="IDP-… / nama" />
        </label>
        <div className="sm:col-span-2 lg:col-span-5">
          <button type="submit" className="btn btn-press">Terapkan Filter</button>
        </div>
      </form>

      {error ? (
        <p role="alert" className="mb-3 rounded-xl border-2 border-black bg-red-100 px-3 py-2 text-sm font-bold">{error}</p>
      ) : null}
      {success ? (
        <p role="status" className="mb-3 rounded-xl border-2 border-black bg-green-100 px-3 py-2 text-sm font-bold">{success}</p>
      ) : null}

      {/* Tabel desktop */}
      <div className="card hidden overflow-x-auto p-0 lg:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b-2 border-black bg-paper">
            <tr>
              <th className="p-3 font-extrabold">Kode</th>
              <th className="p-3 font-extrabold">Nama</th>
              <th className="p-3 font-extrabold">Jadwal</th>
              <th className="p-3 font-extrabold">Total</th>
              <th className="p-3 font-extrabold">Status</th>
              <th className="p-3 font-extrabold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-4 text-center text-gray-500">Memuat…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center text-gray-500">Tidak ada booking dengan filter ini.</td></tr>
            ) : rows.map((b) => (
              <tr
                key={b.id}
                role="link"
                tabIndex={0}
                aria-label={`Lihat struk booking ${b.code}`}
                className="cursor-pointer border-b border-gray-200 transition last:border-0 hover:bg-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                onClick={() => navigate(`/admin-bookings/${b.id}/struk`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    navigate(`/admin-bookings/${b.id}/struk`)
                  }
                }}
              >
                <td className="p-3 font-bold">{b.code}</td>
                <td className="p-3">
                  <p className="font-bold">{b.name}</p>
                  <p className="text-xs text-gray-500">{b.phone} · {b.city}</p>
                </td>
                <td className="p-3">
                  {formatDateShort(b.slot_date)}
                  <br />
                  <span className="text-xs text-gray-500">{formatSlotTime(b.slot_time)}</span>
                </td>
                <td className="p-3 font-bold">
                  {formatRupiah(b.total)}
                  {(b.items?.length > 0 || b.surcharges?.length > 0) ? (
                    <ul className="mt-1 space-y-0.5 text-xs font-normal text-gray-600">
                      {(b.items || []).map((it, i) => (
                        <li key={i}>
                          {it.name} {it.size ? `(${it.size})` : ''} ×{Number(it.qty)}
                          {' — '}
                          {formatRupiah(it.total)}
                        </li>
                      ))}
                      {(b.surcharges || []).map((s, i) => (
                        <li key={`s${i}`} className="text-amber-800">
                          + {s.title}{Number(s.qty) > 1 ? ` ×${Number(s.qty)}` : ''} — {formatRupiah(s.total)}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </td>
                <td className="p-3">
                  <span className={`inline-block rounded-lg border-2 border-black px-2 py-0.5 text-xs font-extrabold ${statusBadgeClass(b.status)}`}>
                    {statusLabel(b.status)}
                  </span>
                </td>
                <td className="p-3">
                  {/* stopPropagation: klik tombol aksi jangan ikut buka struk */}
                  <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
                    {waLink(b.phone, b) ? (
                      <a
                        href={waLink(b.phone, b)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn border-emerald-700 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-900 hover:bg-emerald-100"
                        title={`Chat WhatsApp ${b.name}`}
                      >
                        WA
                      </a>
                    ) : null}
                    {(TRANSITIONS[b.status] || []).map((a) => (
                      <button
                        key={a.to}
                        type="button"
                        onClick={() => bukaDialog(b, a)}
                        className={a.cta ? BTN_CTA : a.needReason ? BTN_NEED_REASON : BTN_PLAIN}
                      >
                        {a.label}
                      </button>
                    ))}
                    {isSuper && ['pending', 'confirmed'].includes(b.status) ? (
                      <button
                        type="button"
                        onClick={() => { setMove({ booking: b, slot_date: b.slot_date, slot_time: b.slot_time, reason: '' }); setMoveError('') }}
                        className="btn btn-press text-xs"
                      >
                        Pindah
                      </button>
                    ) : null}
                    {isSuper ? (
                      <button
                        type="button"
                        onClick={() => setHapus(b)}
                        className="btn border-red-700 bg-red-50 px-2 py-1 text-xs text-red-800 hover:bg-red-100"
                      >
                        Hapus
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards mobile */}
      <div className="space-y-3 lg:hidden">
        {loading ? (
          <p className="text-gray-500">Memuat…</p>
        ) : rows.length === 0 ? (
          <p className="text-gray-500">Tidak ada booking dengan filter ini.</p>
        ) : rows.map((b) => (
          <div
            key={b.id}
            role="link"
            tabIndex={0}
            aria-label={`Lihat struk booking ${b.code}`}
            className="card cursor-pointer p-4 transition hover:bg-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            onClick={() => navigate(`/admin-bookings/${b.id}/struk`)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                navigate(`/admin-bookings/${b.id}/struk`)
              }
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-extrabold">{b.code}</p>
                <p className="text-sm">{b.name} · {b.phone}</p>
                <p className="text-sm text-gray-600">{formatDateShort(b.slot_date)} · {formatSlotTime(b.slot_time)}</p>
                <p className="mt-1 font-bold">{formatRupiah(b.total)}</p>
                {(b.items?.length > 0 || b.surcharges?.length > 0) ? (
                  <ul className="mt-1 space-y-0.5 text-xs text-gray-600">
                    {(b.items || []).map((it, i) => (
                      <li key={i}>
                        {it.name} {it.size ? `(${it.size})` : ''} ×{Number(it.qty)} — {formatRupiah(it.total)}
                      </li>
                    ))}
                    {(b.surcharges || []).map((s, i) => (
                      <li key={`s${i}`} className="text-amber-800">
                        + {s.title}{Number(s.qty) > 1 ? ` ×${Number(s.qty)}` : ''} — {formatRupiah(s.total)}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <span className={`shrink-0 rounded-lg border-2 border-black px-2 py-0.5 text-xs font-extrabold ${statusBadgeClass(b.status)}`}>
                {statusLabel(b.status)}
              </span>
            </div>
            {(TRANSITIONS[b.status] || []).length > 0 || isSuper ? (
              <div className="mt-3 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                {waLink(b.phone, b) ? (
                  <a
                    href={waLink(b.phone, b)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn border-emerald-700 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-900 hover:bg-emerald-100"
                    title={`Chat WhatsApp ${b.name}`}
                  >
                    WA
                  </a>
                ) : null}
                {(TRANSITIONS[b.status] || []).map((a) => (
                  <button
                    key={a.to}
                    type="button"
                    onClick={() => bukaDialog(b, a)}
                    className={a.cta ? BTN_CTA : a.needReason ? BTN_NEED_REASON : BTN_PLAIN}
                  >
                    {a.label}
                  </button>
                ))}
                {isSuper && ['pending', 'confirmed'].includes(b.status) ? (
                  <button
                    type="button"
                    onClick={() => { setMove({ booking: b, slot_date: b.slot_date, slot_time: b.slot_time, reason: '' }); setMoveError('') }}
                    className="btn btn-press text-xs"
                  >
                    Pindah
                  </button>
                ) : null}
                {isSuper ? (
                  <button
                    type="button"
                    onClick={() => setHapus(b)}
                    className="btn border-red-700 bg-red-50 px-2 py-1 text-xs text-red-800 hover:bg-red-100"
                  >
                    Hapus
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          Total {total} booking · Halaman {page}/{totalPages}
        </p>
        <div className="flex gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-press text-sm disabled:opacity-40">
            Sebelumnya
          </button>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="btn btn-press text-sm disabled:opacity-40">
            Berikutnya
          </button>
        </div>
      </div>

      {/* Dialog aksi */}
      {dialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="card w-full max-w-md p-5">
            <h3 className="text-lg font-extrabold">
              {dialog.action.label} — {dialog.booking.code}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {dialog.booking.name} · {formatDateShort(dialog.booking.slot_date)} {formatSlotTime(dialog.booking.slot_time)}
            </p>
            {dialog.action.needReason ? (
              <label className="mt-4 block text-sm font-bold">
                Alasan <span className="text-red-600">*</span>
                <textarea
                  value={alasan}
                  onChange={(e) => setAlasan(e.target.value)}
                  rows={3}
                  className="input-brutal mt-1"
                  placeholder="Contoh: slot bentrok, customer minta reschedule…"
                />
              </label>
            ) : (
              <p className="mt-4 text-sm text-gray-600">Yakin ubah status booking ini?</p>
            )}
            <div className="mt-4 flex gap-2">
              <button type="button" disabled={busy} onClick={jalankanAksi} className="btn btn-cta">
                {busy ? 'Menyimpan…' : 'Ya, ' + dialog.action.label}
              </button>
              <button type="button" onClick={() => setDialog(null)} className="btn btn-ghost">
                Batal
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Dialog pindah jadwal (superadmin) */}
      {move ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="card w-full max-w-md p-5">
            <h3 className="text-lg font-extrabold">Pindah Jadwal — {move.booking.code}</h3>
            <p className="mt-1 text-sm text-gray-600">
              Sekarang: {formatDateShort(move.booking.slot_date)} {formatSlotTime(move.booking.slot_time)}
            </p>
            <label className="mt-4 block text-sm font-bold">
              Tanggal baru
              <input
                type="date"
                value={move.slot_date}
                min={hariLokal()}
                max={hariLokal(30)}
                onChange={(e) => {
                  const v = e.target.value
                  setMove({ ...move, slot_date: v })
                  setMoveError(isSelasa(v) ? 'Selasa kami libur ya. Pilih Rabu sampai Senin.' : '')
                }}
                className="input-brutal mt-1"
              />
            </label>
            <label className="mt-3 block text-sm font-bold">
              Jam baru
              <select value={move.slot_time} onChange={(e) => setMove({ ...move, slot_time: e.target.value })} className="input-brutal mt-1">
                <option value="">— pilih —</option>
                <option value="09.00">09.00</option>
                <option value="13.00">13.00</option>
              </select>
            </label>
            <label className="mt-3 block text-sm font-bold">
              Alasan (opsional)
              <input value={move.reason} maxLength={500} onChange={(e) => setMove({ ...move, reason: e.target.value })} className="input-brutal mt-1" placeholder="Contoh: customer minta ganti hari" />
            </label>
            {moveError ? (
              <p role="alert" className="mt-3 rounded-xl border-2 border-black bg-red-100 px-3 py-2 text-sm font-bold">{moveError}</p>
            ) : null}
            <div className="mt-4 flex gap-2">
              <button type="button" disabled={busy} onClick={simpanPindah} className="btn btn-cta">
                {busy ? 'Memindah…' : 'Pindahkan'}
              </button>
              <button type="button" onClick={() => { setMove(null); setMoveError('') }} className="btn btn-ghost">Batal</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Dialog hapus permanen (superadmin) */}
      {hapus ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="card w-full max-w-md p-5">
            <h3 className="text-lg font-extrabold text-red-700">Hapus {hapus.code}?</h3>
            <p className="mt-1 text-sm text-gray-600">
              {hapus.name} · {formatDateShort(hapus.slot_date)} {formatSlotTime(hapus.slot_time)} · {formatRupiah(hapus.total)}
            </p>
            <p className="mt-3 text-sm text-gray-600">
              Booking beserta isi barangnya dihapus <b>permanen</b>. Slotnya dibuka lagi. Riwayat audit tetap tersimpan. Tidak bisa dibatalkan.
            </p>
            <div className="mt-4 flex gap-2">
              <button type="button" disabled={busy} onClick={konfirmasiHapus} className="btn border-red-700 bg-red-600 text-white hover:bg-red-700">
                {busy ? 'Menghapus…' : 'Ya, Hapus Permanen'}
              </button>
              <button type="button" onClick={() => setHapus(null)} className="btn btn-ghost">Batal</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
