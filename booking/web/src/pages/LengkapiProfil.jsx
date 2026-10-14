import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError } from '../lib/api.js'
import { useAuth } from '../lib/auth.jsx'

/**
 * Lengkapi Profil (PRD Bab 10.1, Bab 19.4):
 * Customer baru (Google) wajib isi nama + WA utama + alamat default
 * sebelum bisa booking. profile_complete dihitung ulang server-side.
 */
export default function LengkapiProfil() {
  const { user, loading, refresh } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [label, setLabel] = useState('Rumah')
  const [street, setStreet] = useState('')
  const [village, setVillage] = useState('')
  const [district, setDistrict] = useState('')
  const [city, setCity] = useState('')
  const [province, setProvince] = useState('')
  const [postal, setPostal] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    document.title = 'Lengkapi Profil | App InDeep Booking'
  }, [])

  useEffect(() => {
    if (user?.profile_complete) {
      navigate('/booking', { replace: true })
    }
  }, [user, navigate])

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      // 1. Nama + WA utama dulu
      await api('/me.php', {
        method: 'PATCH',
        body: JSON.stringify({ name: name.trim(), phone_primary: phone.trim() }),
      })
      // 2. Alamat default
      await api('/addresses.php', {
        method: 'POST',
        body: JSON.stringify({
          label: label.trim(),
          street_no: street.trim(),
          village: village.trim(),
          district: district.trim(),
          city: city.trim(),
          province: province.trim(),
          postal: postal.trim(),
          is_default: true,
        }),
      })
      await refresh()
      navigate('/booking', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menyimpan. Coba lagi ya.')
      setBusy(false)
    }
  }

  if (loading) {
    return <main className="mx-auto max-w-2xl px-4 py-16 text-center font-bold">Memuat…</main>
  }
  if (!user) {
    navigate('/login', { replace: true })
    return null
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <header className="mb-6">
        <p className="text-sm font-bold uppercase tracking-wide text-brand">InDeepCleaningID</p>
        <h1 className="text-3xl font-extrabold">Lengkapi Profil</h1>
        <p className="mt-1 text-sm text-gray-600">
          Sebelum booking, isi nama, nomor WhatsApp, dan alamat dulu ya — biar tim kami mudah menghubungi.
        </p>
      </header>

      {error ? (
        <p role="alert" className="mb-4 rounded-xl border-2 border-black bg-red-100 px-3 py-2 text-sm font-bold">
          {error}
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="card space-y-4 p-5">
        <h2 className="text-lg font-extrabold">Data Diri</h2>
        <label className="block text-sm font-bold">
          Nama lengkap <span className="text-red-600">*</span>
          <input
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-brutal mt-1"
            placeholder="Budi Santoso"
          />
        </label>
        <label className="block text-sm font-bold">
          Nomor WhatsApp <span className="text-red-600">*</span>
          <input
            required
            maxLength={30}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input-brutal mt-1"
            placeholder="081234567890"
          />
        </label>

        <hr className="border-ink" />
        <h2 className="text-lg font-extrabold">Alamat Utama</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-bold">
            Label <span className="text-red-600">*</span>
            <input required maxLength={40} value={label} onChange={(e) => setLabel(e.target.value)} className="input-brutal mt-1" placeholder="Rumah" />
          </label>
          <label className="block text-sm font-bold">
            Kecamatan <span className="text-red-600">*</span>
            <input required maxLength={100} value={district} onChange={(e) => setDistrict(e.target.value)} className="input-brutal mt-1" placeholder="Sawangan" />
          </label>
        </div>
        <label className="block text-sm font-bold">
          Nama jalan dan nomor <span className="text-red-600">*</span>
          <input required maxLength={255} value={street} onChange={(e) => setStreet(e.target.value)} className="input-brutal mt-1" placeholder="Jl. Melati No. 12" />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-bold">
            Kelurahan/Desa <span className="text-red-600">*</span>
            <input required maxLength={100} value={village} onChange={(e) => setVillage(e.target.value)} className="input-brutal mt-1" placeholder="Kemiri Muka" />
          </label>
          <label className="block text-sm font-bold">
            Kota/Kabupaten <span className="text-red-600">*</span>
            <input required maxLength={100} value={city} onChange={(e) => setCity(e.target.value)} className="input-brutal mt-1" placeholder="Depok" />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-bold">
            Provinsi <span className="text-red-600">*</span>
            <input required maxLength={100} value={province} onChange={(e) => setProvince(e.target.value)} className="input-brutal mt-1" placeholder="Jawa Barat" />
          </label>
          <label className="block text-sm font-bold">
            Kode pos
            <input maxLength={10} value={postal} onChange={(e) => setPostal(e.target.value.replace(/\D/g, ''))} className="input-brutal mt-1" placeholder="16511" />
          </label>
        </div>

        <button type="submit" disabled={busy} className="btn btn-cta w-full py-3 text-base">
          {busy ? 'Menyimpan…' : 'Simpan & Lanjut Booking'}
        </button>
      </form>
    </main>
  )
}
