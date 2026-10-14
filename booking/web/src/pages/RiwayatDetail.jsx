import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { api, ApiError } from '../lib/api.js'
import { useAuth } from '../lib/auth.jsx'
import { formatDate, formatRupiah, formatSlotTime, statusBadgeClass, statusLabel } from '../lib/format.js'
import HubungiAdmin from '../components/HubungiAdmin.jsx'

/**
 * Detail booking customer (klik card di Riwayat):
 * ringkasan kayak halaman sukses + rincian barang & biaya tambahan
 * + alamat, biar customer lihat jelas apa yang dipesan.
 */
export default function RiwayatDetail() {
  const { id } = useParams()
  const { user, loading } = useAuth()
  const [b, setB] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = 'Detail Booking | App InDeep Booking'
  }, [])

  useEffect(() => {
    if (!user) return
    let alive = true
    ;(async () => {
      try {
        const res = await api(`/bookings-detail.php?id=${id}`)
        if (alive) setB(res.data)
      } catch (err) {
        if (alive) setError(err instanceof ApiError ? err.message : 'Gagal memuat detail booking.')
      }
    })()
    return () => {
      alive = false
    }
  }, [user, id])

  if (loading) {
    return <main className="mx-auto max-w-2xl px-4 py-16 text-center font-bold">Memuat…</main>
  }
  if (!user) return <Navigate to="/login" replace />

  if (error) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div role="alert" className="rounded-card border-2 border-ink bg-danger p-4 font-bold shadow-brutal-sm">
          {error}
        </div>
        <Link to="/riwayat" className="btn btn-ghost btn-press mt-4 inline-block px-4 py-2">
          ← Kembali ke Riwayat
        </Link>
      </main>
    )
  }

  if (!b) {
    return <main className="mx-auto max-w-2xl px-4 py-16 text-center font-bold">Memuat detail…</main>
  }

  const a = b.address

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <Link to="/riwayat" className="btn btn-ghost btn-press mb-4 inline-block px-4 py-2 text-sm">
        ← Riwayat
      </Link>

      <section className="rounded-card border-2 border-ink bg-white p-6 text-center shadow-brutal sm:p-8">
        <div className="mb-2 flex items-center justify-center gap-2">
          <span className={`rounded-full border-2 border-ink px-3 py-1 text-xs font-bold ${statusBadgeClass(b.status)}`}>
            {statusLabel(b.status)}
          </span>
        </div>
        <h1 className="mb-1 text-2xl font-extrabold">Detail Pesanan</h1>

        <div className="mx-auto mb-6 mt-4 max-w-sm rounded-card border-2 border-ink bg-paper p-4 text-left shadow-brutal-sm">
          <p className="text-sm text-gray-600">Nomor booking</p>
          <p className="mb-3 text-xl font-extrabold tracking-wide">{b.code}</p>
          <p className="text-sm text-gray-600">Jadwal</p>
          <p className="mb-3 font-bold">
            {formatDate(b.slot_date)} — {formatSlotTime(b.slot_time)}
          </p>
          <p className="text-sm text-gray-600">Total estimasi</p>
          <p className="text-lg font-extrabold">{formatRupiah(b.total)}</p>
        </div>

        {/* Rincian barang & biaya tambahan */}
        <div className="mx-auto mb-6 max-w-md text-left">
          <h2 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-gray-600">Rincian Pesanan</h2>
          <ul className="rounded-card border-2 border-ink bg-white divide-y divide-gray-200 text-sm shadow-brutal-sm">
            {(b.items || []).map((it) => (
              <li key={it.sku_id} className="flex items-start justify-between gap-3 p-3">
                <span>
                  {it.name_snapshot} {it.size_snapshot}{' '}
                  <span className="text-gray-500">×{Number(it.qty)} {it.unit}</span>
                </span>
                <span className="shrink-0 font-bold">{formatRupiah(Number(it.line_total))}</span>
              </li>
            ))}
            {(b.surcharges || []).map((sc) => (
              <li key={sc.code} className="flex items-start justify-between gap-3 p-3 text-amber-900">
                <span>
                  + {sc.title_snapshot}{' '}
                  <span className="text-amber-700">×{Number(sc.qty_affected)}</span>
                </span>
                <span className="shrink-0 font-bold">{formatRupiah(Number(sc.line_total))}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex justify-between text-sm">
            <span>Subtotal barang</span>
            <span className="font-bold">{formatRupiah(b.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Biaya tambahan</span>
            <span className="font-bold">{formatRupiah(b.surchargeTotal)}</span>
          </div>
        </div>

        {/* Alamat */}
        <div className="mx-auto mb-6 max-w-md text-left">
          <h2 className="mb-1 text-sm font-extrabold uppercase tracking-wide text-gray-600">Alamat Layanan</h2>
          <p className="text-sm">
            {a.street_no}, Kel. {a.village}, Kec. {a.district}
            <br />
            {a.city}, {a.province} {a.postal || ''}
          </p>
          {a.note && <p className="mt-1 text-sm text-gray-500 italic">Catatan: {a.note}</p>}
        </div>

        {b.cancel_reason && (
          <p className="mx-auto mb-6 max-w-md rounded-card border-2 border-ink bg-danger/40 p-3 text-left text-sm">
            <span className="font-bold">Dibatalkan:</span> {b.cancel_reason}
          </p>
        )}

        {b.status === 'pending' && <HubungiAdmin bookingCode={b.code} className="mx-auto mb-4 max-w-md text-left" />}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to={`/riwayat/${b.id}/struk`} className="btn btn-cta py-3">
            Unduh Struk
          </Link>
        </div>
      </section>
    </main>
  )
}
