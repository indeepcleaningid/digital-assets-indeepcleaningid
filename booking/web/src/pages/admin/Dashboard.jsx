import { useEffect, useState } from 'react'
import { api } from '../../lib/api.js'
import { formatRupiah } from '../../lib/format.js'

/**
 * Dashboard admin (PRD Bab 16.3): booking hari ini, pending,
 * slot penuh, omzet estimasi hari ini + bulan ini.
 */
export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = 'Dashboard Admin | App InDeep Booking'
    api('/admin/dashboard.php')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
  }, [])

  if (error) {
    return (
      <p role="alert" className="rounded-xl border-2 border-black bg-red-100 px-3 py-2 text-sm font-bold">
        {error}
      </p>
    )
  }
  if (!data) return <p className="text-gray-600">Memuat…</p>

  const cards = [
    { label: 'Booking Hari Ini', value: data.today_bookings, sub: 'aktif (bukan batal)' },
    { label: 'Menunggu Konfirmasi', value: data.pending_count, sub: 'perlu ditindak' },
    { label: 'Slot Penuh Hari Ini', value: data.slots_full_today, sub: 'pagi + siang' },
    { label: 'Omzet Estimasi Hari Ini', value: formatRupiah(data.omzet_today), sub: 'confirmed → completed' },
    { label: 'Omzet Estimasi Bulan Ini', value: formatRupiah(data.omzet_month), sub: 'bulan berjalan' },
  ]

  return (
    <div>
      <h2 className="mb-4 text-2xl font-extrabold">Dashboard</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <p className="text-sm font-bold text-gray-600">{c.label}</p>
            <p className="mt-2 text-3xl font-extrabold">{c.value}</p>
            <p className="mt-1 text-xs text-gray-500">{c.sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
