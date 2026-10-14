import { useEffect, useRef, useState } from 'react'
import { api, ApiError } from '../lib/api.js'
import { useAuth } from '../lib/auth.jsx'
import PasswordInput from '../components/PasswordInput.jsx'

/**
 * Halaman Profil (PRD Bab 10.3 + 16.2):
 * - Foto profil: upload max 2 MB (jpg/png/webp), nama file acak di server.
 * - Data diri: nama, WA utama, WA cadangan, preferensi jam (09.00/13.00).
 * - Panel alamat, ganti password (OTP), ganti email (OTP) di file terpisah.
 */
export default function Profil() {
  const { user, refresh } = useAuth()
  const fileRef = useRef(null)

  const [name, setName] = useState('')
  const [phonePrimary, setPhonePrimary] = useState('')
  const [phoneSecondary, setPhoneSecondary] = useState('')
  const [preferredTime, setPreferredTime] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    document.title = 'Profil | App InDeep Booking'
  }, [])

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setPhonePrimary(user.phone_primary || '')
      setPhoneSecondary(user.phone_secondary || '')
      setPreferredTime(user.preferred_time || '')
    }
  }, [user])

  if (!user) return null

  async function onSimpan(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setBusy(true)
    try {
      await api('/me.php', {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          phone_primary: phonePrimary,
          phone_secondary: phoneSecondary,
          preferred_time: preferredTime || null,
        }),
      })
      await refresh()
      setSuccess('Data diri tersimpan.')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menyimpan. Coba lagi ya.')
    } finally {
      setBusy(false)
    }
  }

  async function onFotoChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setError('Ukuran foto maksimal 2 MB ya.')
      return
    }

    setError('')
    setSuccess('')
    setUploading(true)
    try {
      const form = new FormData()
      form.append('photo', file)
      await api('/me-photo.php', { method: 'POST', body: form })
      await refresh()
      setSuccess('Foto profil tersimpan.')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload foto gagal. Coba lagi ya.')
    } finally {
      setUploading(false)
    }
  }

  async function onHapusFoto() {
    setError('')
    setSuccess('')
    setUploading(true)
    try {
      await api('/me-photo.php', { method: 'DELETE' })
      await refresh()
      setSuccess('Foto profil dihapus.')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menghapus foto. Coba lagi ya.')
    } finally {
      setUploading(false)
    }
  }

  const fotoUrl = user.photo_url || null

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold">Profil Saya</h1>
        <p className="mt-1 text-sm text-gray-600">
          Data diri, foto, alamat, dan keamanan akun kamu.
        </p>
        <p
          className={
            'mt-3 inline-block rounded-xl border-2 border-black px-3 py-1 text-sm font-bold ' +
            (user.profile_complete ? 'bg-green-200' : 'bg-yellow-200')
          }
        >
          {user.profile_complete
            ? 'Profil lengkap — siap booking.'
            : 'Profil belum lengkap — isi nama, WA utama, dan alamat default.'}
        </p>
      </header>

      {error ? (
        <p role="alert" className="mb-4 rounded-xl border-2 border-black bg-red-100 px-3 py-2 text-sm font-bold">
          {error}
        </p>
      ) : null}
      {success ? (
        <p role="status" className="mb-4 rounded-xl border-2 border-black bg-green-100 px-3 py-2 text-sm font-bold">
          {success}
        </p>
      ) : null}

      {/* --- Foto profil --- */}
      <section className="card mb-6 p-5">
        <h2 className="mb-3 text-lg font-extrabold">Foto Profil</h2>
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-black bg-gray-100">
            {fotoUrl ? (
              <img src={fotoUrl} alt="Foto profil" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-extrabold text-gray-400">
                {(user.name || user.email || '?').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="btn btn-press"
            >
              {uploading ? 'Memproses…' : fotoUrl ? 'Ganti foto' : 'Upload foto'}
            </button>
            {fotoUrl ? (
              <button
                type="button"
                disabled={uploading}
                onClick={onHapusFoto}
                className="btn btn-ghost"
              >
                Hapus
              </button>
            ) : null}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={onFotoChange}
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          JPG, PNG, atau WebP. Maksimal 2 MB.
        </p>
      </section>

      {/* --- Data diri --- */}
      <section className="card mb-6 p-5">
        <h2 className="mb-3 text-lg font-extrabold">Data Diri</h2>
        <form onSubmit={onSimpan} noValidate>
          <div className="mb-4">
            <label htmlFor="nama" className="mb-1 block text-sm font-bold">
              Nama lengkap
            </label>
            <input
              id="nama"
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border-2 border-black px-3 py-2 focus-visible:outline-none"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="wa-utama" className="mb-1 block text-sm font-bold">
              Nomor WhatsApp utama
            </label>
            <input
              id="wa-utama"
              type="tel"
              required
              value={phonePrimary}
              onChange={(e) => setPhonePrimary(e.target.value)}
              className="w-full rounded-xl border-2 border-black px-3 py-2 focus-visible:outline-none"
              placeholder="081234567890"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="wa-cadangan" className="mb-1 block text-sm font-bold">
              Nomor WhatsApp cadangan <span className="font-normal text-gray-500">(opsional)</span>
            </label>
            <input
              id="wa-cadangan"
              type="tel"
              value={phoneSecondary}
              onChange={(e) => setPhoneSecondary(e.target.value)}
              className="w-full rounded-xl border-2 border-black px-3 py-2 focus-visible:outline-none"
              placeholder="081234567890"
            />
          </div>
          <div className="mb-5">
            <label htmlFor="preferensi" className="mb-1 block text-sm font-bold">
              Preferensi jam kedatangan teknisi
            </label>
            <select
              id="preferensi"
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              className="w-full rounded-xl border-2 border-black px-3 py-2 focus-visible:outline-none"
            >
              <option value="">Belum memilih</option>
              <option value="09.00">09.00 (pagi)</option>
              <option value="13.00">13.00 (siang)</option>
            </select>
          </div>
          <button type="submit" disabled={busy} className="btn btn-cta py-3">
            {busy ? 'Menyimpan…' : 'Simpan Data Diri'}
          </button>
        </form>
      </section>

      <AlamatPanel onBerubah={refresh} />
      <GantiPassword email={user.email} />
      <GantiEmail email={user.email} onBerubah={refresh} />
    </main>
  )
}

/* ===== Panel alamat (list + tambah + edit + default + hapus) ===== */

const ALAMAT_KOSONG = {
  label: '',
  street_no: '',
  village: '',
  district: '',
  city: '',
  province: '',
  postal: '',
  note: '',
  maps_url: '',
}

function AlamatPanel({ onBerubah }) {
  const { user } = useAuth()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState(null) // null = tertutup, 'baru' = tambah, angka id = edit
  const [isi, setIsi] = useState(ALAMAT_KOSONG)
  const [busy, setBusy] = useState(false)

  const alamat = user?.addresses || []

  function bukaBaru() {
    setIsi(ALAMAT_KOSONG)
    setForm('baru')
    setError('')
    setSuccess('')
  }

  function bukaEdit(a) {
    setIsi({
      label: a.label || '',
      street_no: a.street_no || '',
      village: a.village || '',
      district: a.district || '',
      city: a.city || '',
      province: a.province || '',
      postal: a.postal || '',
      note: a.note || '',
      maps_url: a.maps_url || '',
      is_default: a.is_default,
    })
    setForm(a.id)
    setError('')
    setSuccess('')
  }

  function ubah(field, value) {
    setIsi((old) => ({ ...old, [field]: value }))
  }

  async function onSimpan(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    const payload = {
      label: isi.label,
      street_no: isi.street_no,
      village: isi.village,
      district: isi.district,
      city: isi.city,
      province: isi.province,
      postal: isi.postal,
      note: isi.note,
      maps_url: isi.maps_url,
      is_default: form === 'baru' ? !!isi.is_default : undefined,
    }
    try {
      if (form === 'baru') {
        await api('/addresses.php', { method: 'POST', body: JSON.stringify(payload) })
        setSuccess('Alamat tersimpan.')
      } else {
        await api('/addresses.php', {
          method: 'PATCH',
          body: JSON.stringify({ id: form, ...payload }),
        })
        setSuccess('Alamat diperbarui.')
      }
      await onBerubah()
      setForm(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menyimpan alamat. Coba lagi ya.')
    } finally {
      setBusy(false)
    }
  }

  async function onSetDefault(id) {
    setError('')
    setSuccess('')
    try {
      await api('/addresses.php', {
        method: 'PATCH',
        body: JSON.stringify({ id, setDefault: true }),
      })
      await onBerubah()
      setSuccess('Alamat utama diperbarui.')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal mengubah alamat utama.')
    }
  }

  async function onHapus(a) {
    if (!window.confirm(`Hapus alamat "${a.label}"?`)) return
    setError('')
    setSuccess('')
    try {
      await api(`/addresses.php?id=${a.id}`, { method: 'DELETE' })
      await onBerubah()
      setSuccess('Alamat dihapus.')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menghapus alamat.')
    }
  }

  return (
    <section className="card mb-6 p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold">Alamat Saya</h2>
        {form === null ? (
          <button type="button" onClick={bukaBaru} className="btn btn-press text-sm">
            + Tambah alamat
          </button>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="mb-3 rounded-xl border-2 border-black bg-red-100 px-3 py-2 text-sm font-bold">
          {error}
        </p>
      ) : null}
      {success ? (
        <p role="status" className="mb-3 rounded-xl border-2 border-black bg-green-100 px-3 py-2 text-sm font-bold">
          {success}
        </p>
      ) : null}

      {alamat.length === 0 && form === null ? (
        <p className="text-sm text-gray-600">Belum ada alamat. Tambah satu biar booking cepat.</p>
      ) : null}

      <ul className="space-y-3">
        {alamat.map((a) => (
          <li key={a.id} className="rounded-xl border-2 border-black p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-extrabold">
                  {a.label}{' '}
                  {a.is_default ? (
                    <span className="ml-1 rounded-md border-2 border-black bg-cta px-1.5 py-0.5 text-xs font-extrabold text-brand">
                      Utama
                    </span>
                  ) : null}
                </p>
                <p className="text-sm text-gray-700">{a.street_no}</p>
                <p className="text-sm text-gray-600">
                  {a.village}, {a.district}, {a.city} {a.postal}
                </p>
                {a.maps_url ? (
                  <a
                    href={a.maps_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-sm font-bold text-brand underline"
                  >
                    Buka di Google Maps
                  </a>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {!a.is_default ? (
                  <button
                    type="button"
                    onClick={() => onSetDefault(a.id)}
                    className="btn btn-press text-xs"
                  >
                    Jadikan utama
                  </button>
                ) : null}
                <button type="button" onClick={() => bukaEdit(a)} className="btn btn-press text-xs">
                  Edit
                </button>
                {!a.is_default ? (
                  <button
                    type="button"
                    onClick={() => onHapus(a)}
                    className="btn btn-ghost text-xs"
                  >
                    Hapus
                  </button>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {form !== null ? (
        <form onSubmit={onSimpan} noValidate className="mt-4 rounded-xl border-2 border-dashed border-black p-4">
          <h3 className="mb-3 font-extrabold">
            {form === 'baru' ? 'Alamat baru' : 'Edit alamat'}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Label (Rumah/Kantor)" required>
              <input
                type="text"
                required
                maxLength={40}
                value={isi.label}
                onChange={(e) => ubah('label', e.target.value)}
                className="input-brutal"
                placeholder="Rumah"
              />
            </Field>
            <Field label="Nama jalan & nomor" required>
              <input
                type="text"
                required
                maxLength={255}
                value={isi.street_no}
                onChange={(e) => ubah('street_no', e.target.value)}
                className="input-brutal"
                placeholder="Jl. Melati No. 10"
              />
            </Field>
            <Field label="Kelurahan/desa" required>
              <input
                type="text"
                required
                maxLength={100}
                value={isi.village}
                onChange={(e) => ubah('village', e.target.value)}
                className="input-brutal"
              />
            </Field>
            <Field label="Kecamatan" required>
              <input
                type="text"
                required
                maxLength={100}
                value={isi.district}
                onChange={(e) => ubah('district', e.target.value)}
                className="input-brutal"
              />
            </Field>
            <Field label="Kota" required>
              <input
                type="text"
                required
                maxLength={100}
                value={isi.city}
                onChange={(e) => ubah('city', e.target.value)}
                className="input-brutal"
              />
            </Field>
            <Field label="Provinsi" required>
              <input
                type="text"
                required
                maxLength={100}
                value={isi.province}
                onChange={(e) => ubah('province', e.target.value)}
                className="input-brutal"
              />
            </Field>
            <Field label="Kode pos" required>
              <input
                type="text"
                required
                pattern="\d{5}"
                value={isi.postal}
                onChange={(e) => ubah('postal', e.target.value)}
                className="input-brutal"
                placeholder="16415"
              />
            </Field>
            <Field label="Link Google Maps (opsional)">
              <input
                type="url"
                value={isi.maps_url}
                onChange={(e) => ubah('maps_url', e.target.value)}
                className="input-brutal"
                placeholder="https://maps.app.goo.gl/…"
              />
            </Field>
            <Field label="Catatan untuk teknisi (opsional)">
              <input
                type="text"
                maxLength={255}
                value={isi.note}
                onChange={(e) => ubah('note', e.target.value)}
                className="input-brutal"
                placeholder="Patokan: sebelah minimarket"
              />
            </Field>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-sm font-bold">
                <input
                  type="checkbox"
                  checked={!!isi.is_default}
                  onChange={(e) => ubah('is_default', e.target.checked)}
                  className="h-4 w-4 accent-brand"
                />
                Jadikan alamat utama
              </label>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={busy} className="btn btn-cta py-2">
              {busy ? 'Menyimpan…' : 'Simpan alamat'}
            </button>
            <button type="button" onClick={() => setForm(null)} className="btn btn-ghost py-2">
              Batal
            </button>
          </div>
        </form>
      ) : null}
    </section>
  )
}

/* ===== Ganti password via OTP ===== */

function GantiPassword({ email }) {
  const [fase, setFase] = useState('mintakode') // mintakode | isi kode
  const [kode, setKode] = useState('')
  const [passwordBaru, setPasswordBaru] = useState('')
  const [error, setError] = useState('')
  const [sukses, setSukses] = useState('')
  const [busy, setBusy] = useState(false)
  const [info, setInfo] = useState(null)

  async function mintaKode() {
    setError('')
    setSukses('')
    setBusy(true)
    try {
      const res = await api('/otp-request.php', {
        method: 'POST',
        body: JSON.stringify({ purpose: 'ganti_password' }),
      })
      setInfo(res.data)
      setFase('isikode')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal minta kode. Coba lagi ya.')
    } finally {
      setBusy(false)
    }
  }

  async function verifikasi(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api('/otp-verify.php', {
        method: 'POST',
        body: JSON.stringify({
          purpose: 'ganti_password',
          code: kode,
          newPassword: passwordBaru,
        }),
      })
      setSukses('Password baru sudah aktif. Pakai password itu di login berikutnya ya.')
      setFase('mintakode')
      setKode('')
      setPasswordBaru('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memverifikasi. Coba lagi ya.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card mb-6 p-5">
      <h2 className="mb-1 text-lg font-extrabold">Ganti Password</h2>
      <p className="mb-3 text-sm text-gray-600">
        Kami kirim kode 6 digit ke <strong>{email}</strong>. Password baru aktif setelah kode cocok.
      </p>

      {error ? (
        <p role="alert" className="mb-3 rounded-xl border-2 border-black bg-red-100 px-3 py-2 text-sm font-bold">
          {error}
        </p>
      ) : null}
      {sukses ? (
        <p role="status" className="mb-3 rounded-xl border-2 border-black bg-green-100 px-3 py-2 text-sm font-bold">
          {sukses}
        </p>
      ) : null}

      {fase === 'mintakode' ? (
        <button type="button" disabled={busy} onClick={mintaKode} className="btn btn-press">
          {busy ? 'Mengirim…' : 'Kirim kode ke email'}
        </button>
      ) : (
        <form onSubmit={verifikasi} noValidate>
          {info ? (
            <p className="mb-3 text-sm text-gray-600">
              Kode dikirim ke <strong>{info.email_masked}</strong>, berlaku {Math.round(info.expires_in / 60)} menit.
              {info.dev_note ? (
                <span className="mt-2 block rounded-xl border-2 border-amber-700 bg-amber-50 p-2 text-sm font-bold text-amber-900">
                  {info.dev_note}
                </span>
              ) : null}
            </p>
          ) : null}
          <div className="mb-3 max-w-48">
            <label htmlFor="kode-gpw" className="mb-1 block text-sm font-bold">
              Kode 6 digit
            </label>
            <input
              id="kode-gpw"
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              required
              value={kode}
              onChange={(e) => setKode(e.target.value.replace(/\D/g, ''))}
              className="input-brutal text-center text-lg font-extrabold tracking-widest"
            />
          </div>
          <div className="mb-4 max-w-sm">
            <label htmlFor="pw-baru" className="mb-1 block text-sm font-bold">
              Password baru
            </label>
            <PasswordInput
              id="pw-baru"
              name="pw-baru"
              minLength={8}
              required
              autoComplete="new-password"
              value={passwordBaru}
              onChange={(e) => setPasswordBaru(e.target.value)}
              className="input-brutal"
              placeholder="Minimal 8 karakter"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="btn btn-cta py-2">
              {busy ? 'Memeriksa…' : 'Simpan password baru'}
            </button>
            <button type="button" onClick={() => setFase('mintakode')} className="btn btn-ghost py-2">
              Batal
            </button>
          </div>
        </form>
      )}
    </section>
  )
}

/* ===== Ganti email via dua OTP (email lama + email baru) ===== */

function GantiEmail({ email, onBerubah }) {
  const [fase, setFase] = useState('awal') // awal | konfirmasi
  const [emailBaru, setEmailBaru] = useState('')
  const [kodeLama, setKodeLama] = useState('')
  const [kodeBaru, setKodeBaru] = useState('')
  const [error, setError] = useState('')
  const [sukses, setSukses] = useState('')
  const [busy, setBusy] = useState(false)
  const [devNote, setDevNote] = useState('')

  async function mulai(event) {
    event.preventDefault()
    setError('')
    setSukses('')
    // Validasi di FE dulu (form noValidate, browser gak nge-block) — biar user
    // gak kena error backend pas klik tanpa isi / format aneh. Backend tetap
    // jadi penjaga terakhir (cek bentrok, sama dgn email lama, dll).
    const isi = emailBaru.trim()
    if (isi === '') {
      setError('Isi dulu email barunya ya.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(isi)) {
      setError('Format email belum benar ya. Contoh: nama@email.com')
      return
    }
    setBusy(true)
    try {
      // 1. OTP ke email LAMA
      await api('/otp-email-request-old.php', { method: 'POST' })
      // 2. OTP ke email BARU
      const res = await api('/otp-request.php', {
        method: 'POST',
        body: JSON.stringify({ purpose: 'ganti_email', newEmail: isi }),
      })
      setDevNote(res.data?.dev_note || '')
      setFase('konfirmasi')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal mengirim kode. Coba lagi ya.')
    } finally {
      setBusy(false)
    }
  }

  async function konfirmasi(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api('/otp-email-confirm.php', {
        method: 'POST',
        body: JSON.stringify({
          newEmail: emailBaru,
          oldCode: kodeLama,
          newCode: kodeBaru,
        }),
      })
      await onBerubah()
      setSukses(`Email berhasil diganti ke ${emailBaru}.`)
      setFase('awal')
      setEmailBaru('')
      setKodeLama('')
      setKodeBaru('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal mengonfirmasi. Coba lagi ya.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card p-5">
      <h2 className="mb-1 text-lg font-extrabold">Ganti Email</h2>
      <p className="mb-3 text-sm text-gray-600">
        Email sekarang: <strong>{email}</strong>. Butuh kode dari email lama <em>dan</em> email baru.
      </p>

      {error ? (
        <p role="alert" className="mb-3 rounded-xl border-2 border-black bg-red-100 px-3 py-2 text-sm font-bold">
          {error}
        </p>
      ) : null}
      {sukses ? (
        <p role="status" className="mb-3 rounded-xl border-2 border-black bg-green-100 px-3 py-2 text-sm font-bold">
          {sukses}
        </p>
      ) : null}

      {fase === 'awal' ? (
        <form onSubmit={mulai} noValidate>
          <div className="mb-3 max-w-sm">
            <label htmlFor="email-baru" className="mb-1 block text-sm font-bold">
              Email baru
            </label>
            <input
              id="email-baru"
              type="email"
              required
              value={emailBaru}
              onChange={(e) => setEmailBaru(e.target.value)}
              className="input-brutal"
              placeholder="nama@email.com"
            />
          </div>
          <button type="submit" disabled={busy} className="btn btn-press">
            {busy ? 'Mengirim…' : 'Kirim dua kode OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={konfirmasi} noValidate>
          {devNote ? (
            <p className="mb-3 rounded-xl border-2 border-amber-700 bg-amber-50 p-2 text-sm font-bold text-amber-900">
              {devNote}
            </p>
          ) : null}
          <div className="mb-3 max-w-48">
            <label htmlFor="kode-lama" className="mb-1 block text-sm font-bold">
              Kode dari email lama
            </label>
            <input
              id="kode-lama"
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              required
              value={kodeLama}
              onChange={(e) => setKodeLama(e.target.value.replace(/\D/g, ''))}
              className="input-brutal text-center font-extrabold tracking-widest"
            />
          </div>
          <div className="mb-4 max-w-48">
            <label htmlFor="kode-baru" className="mb-1 block text-sm font-bold">
              Kode dari email baru
            </label>
            <input
              id="kode-baru"
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              required
              value={kodeBaru}
              onChange={(e) => setKodeBaru(e.target.value.replace(/\D/g, ''))}
              className="input-brutal text-center font-extrabold tracking-widest"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="btn btn-cta py-2">
              {busy ? 'Memeriksa…' : 'Konfirmasi ganti email'}
            </button>
            <button type="button" onClick={() => setFase('awal')} className="btn btn-ghost py-2">
              Batal
            </button>
          </div>
        </form>
      )}
    </section>
  )
}

/* ===== Kecil: label + input ===== */

function Field({ label, required, children }) {
  return (
    <label className="block text-sm font-bold">
      {label} {required ? <span className="text-red-600">*</span> : null}
      <span className="mt-1 block">{children}</span>
    </label>
  )
}
