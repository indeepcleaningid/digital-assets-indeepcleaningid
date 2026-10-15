import { useEffect, useState } from 'react'
import { api } from '../../lib/api.js'

// Kontrak field resmi = snake_case (issue #16 — diseragamkan dengan profil)
const EMPTY_ADDRESS = {
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

/**
 * Langkah 1 — Identitas (PRD Bab 9.2, FR C01, C02):
 * nama, WA utama & cadangan, pilih alamat tersimpan atau tambah baru.
 */
export default function StepIdentitas({
  me,
  onSave,
  selectedAddressId,
  onSelectAddress,
  newAddress,
  onNewAddress,
  onNext,
}) {
  const [name, setName] = useState('')
  const [phonePrimary, setPhonePrimary] = useState('')
  const [phoneSecondary, setPhoneSecondary] = useState('')
  const [form, setForm] = useState(EMPTY_ADDRESS)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    if (!me) return
    setName(me.name || '')
    setPhonePrimary(me.phone_primary || '')
    setPhoneSecondary(me.phone_secondary || '')
    if ((me.addresses || []).length === 0) {
      setShowForm(true)
    }
  }, [me])

  const addresses = me?.addresses || []

  const validate = () => {
    if (name.trim().length < 3) return 'Nama lengkap wajib diisi minimal 3 huruf ya.'
    if (!phonePrimary.trim()) return 'Nomor WhatsApp utama wajib diisi buat koordinasi teknisi ya.'
    if (showForm || newAddress) {
      const a = newAddress || form
      if (!a.street_no.trim() || !a.village.trim() || !a.district.trim() || !a.city.trim() || !a.province.trim()) {
        return 'Alamat belum lengkap. Isi nomor rumah, kelurahan, kecamatan, kota, dan provinsi ya.'
      }
    }
    if (!newAddress && selectedAddressId == null && addresses.length > 0) {
      return 'Pilih salah satu alamat dulu ya.'
    }
    return ''
  }

  const handleNext = async () => {
    const v = validate()
    setLocalError(v)
    if (v) return

    setSaving(true)
    setError('')
    try {
      // 1. Simpan identitas
      const updated = await onSave({
        name: name.trim(),
        phone_primary: phonePrimary.trim(),
        phone_secondary: phoneSecondary.trim(),
      })

      // 2. Kalau isi alamat baru — langsung kirim bareng booking nanti.
      //    Tapi supaya profile_complete terhitung, alamat baru disimpan lewat create.
      //    Untuk lanjut wizard: pastikan ada pilihan alamat.
      const addrs = updated.addresses || []
      if (newAddress) {
        // Belum dikirim ke server — simpan sementara, dikirim saat submit booking.
        onNext()
        return
      }
      if (addrs.length > 0 && selectedAddressId == null) {
        const def = addrs.find((a) => a.is_default) || addrs[0]
        onSelectAddress(def.id)
      }
      if (addrs.length === 0 && !newAddress) {
        setLocalError('Isi alamat dulu biar tim tahu datang ke mana ya.')
        setShowForm(true)
        return
      }
      onNext()
    } catch (err) {
      setError(err.message || 'Gagal menyimpan identitas. Coba lagi ya.')
    } finally {
      setSaving(false)
    }
  }

  const fieldClass =
    'w-full rounded-xl border-2 border-ink bg-white px-3 py-2 text-base focus:outline-none focus-visible:outline-3'

  return (
    <section className="rounded-card border-2 border-ink bg-white p-5 shadow-brutal sm:p-6">
      <h2 className="mb-1 text-xl font-extrabold">Langkah 1 — Identitas</h2>
      <p className="mb-5 text-sm text-gray-600">
        Kami pakai nomor ini buat koordinasi teknisi, ya. Bisa diganti kapan saja.
      </p>

      {error && (
        <div role="alert" className="mb-4 rounded-xl border-2 border-ink bg-danger p-3 font-bold">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="bk-name" className="mb-1 block font-bold">
          Nama lengkap <span className="text-red-600">*</span>
        </label>
        <input
          id="bk-name"
          className={fieldClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          minLength={3}
          maxLength={100}
          autoComplete="name"
        />
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="bk-wa1" className="mb-1 block font-bold">
            WA utama <span className="text-red-600">*</span>
          </label>
          <input
            id="bk-wa1"
            className={fieldClass}
            value={phonePrimary}
            onChange={(e) => setPhonePrimary(e.target.value)}
            placeholder="081234567890"
            inputMode="tel"
            autoComplete="tel"
          />
        </div>
        <div>
          <label htmlFor="bk-wa2" className="mb-1 block font-bold">
            WA cadangan <span className="font-normal text-gray-500">(opsional)</span>
          </label>
          <input
            id="bk-wa2"
            className={fieldClass}
            value={phoneSecondary}
            onChange={(e) => setPhoneSecondary(e.target.value)}
            placeholder="08987654321"
            inputMode="tel"
          />
        </div>
      </div>

      <h3 className="mb-2 mt-6 font-extrabold">Alamat</h3>

      {addresses.length > 0 && !showForm && (
        <ul className="mb-4 space-y-2">
          {addresses.map((a) => (
            <li key={a.id}>
              <label
                className={[
                  'flex cursor-pointer gap-3 rounded-xl border-2 p-3',
                  selectedAddressId === a.id && !newAddress
                    ? 'border-ink bg-cta/30 shadow-brutal-sm'
                    : 'border-ink bg-white',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="bk-address"
                  className="mt-1 accent-[#062b3d]"
                  checked={selectedAddressId === a.id && !newAddress}
                  onChange={() => {
                    onNewAddress(null)
                    onSelectAddress(a.id)
                  }}
                />
                <span className="text-sm">
                  <span className="block font-bold">
                    {a.label || 'Alamat'} {a.is_default && <span className="text-xs">(utama)</span>}
                  </span>
                  {a.street_no}, Kel. {a.village}, Kec. {a.district}, {a.city}, {a.province}
                  {a.postal ? ` ${a.postal}` : ''}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}

      {addresses.length > 0 && (
        <button
          type="button"
          className="mb-4 text-sm font-bold underline"
          onClick={() => {
            setShowForm((s) => !s)
            if (!showForm) onNewAddress(null)
          }}
        >
          {showForm ? '✕ Batal tambah alamat' : '+ Tambah alamat baru'}
        </button>
      )}

      {showForm && (
        <div className="mb-4 space-y-3 rounded-xl border-2 border-dashed border-ink p-4">
          <div>
            <label htmlFor="ad-label" className="mb-1 block font-bold">
              Label alamat <span className="font-normal text-gray-500">(opsional)</span>
            </label>
            <input
              id="ad-label"
              className={fieldClass}
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Rumah, Kantor, dll"
              maxLength={40}
            />
          </div>
          <div>
            <label htmlFor="ad-street" className="mb-1 block font-bold">
              Jalan & nomor rumah / patokan <span className="text-red-600">*</span>
            </label>
            <input
              id="ad-street"
              className={fieldClass}
              value={form.street_no}
              onChange={(e) => setForm({ ...form, street_no: e.target.value })}
              placeholder="Jl Mawar 2 No 45 RT 03 RW 07"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="ad-village" className="mb-1 block font-bold">
                Kelurahan / desa <span className="text-red-600">*</span>
              </label>
              <input
                id="ad-village"
                className={fieldClass}
                value={form.village}
                onChange={(e) => setForm({ ...form, village: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="ad-district" className="mb-1 block font-bold">
                Kecamatan <span className="text-red-600">*</span>
              </label>
              <input
                id="ad-district"
                className={fieldClass}
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="ad-city" className="mb-1 block font-bold">
                Kota / kabupaten <span className="text-red-600">*</span>
              </label>
              <input
                id="ad-city"
                className={fieldClass}
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="ad-province" className="mb-1 block font-bold">
                Provinsi <span className="text-red-600">*</span>
              </label>
              <input
                id="ad-province"
                className={fieldClass}
                value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="ad-postal" className="mb-1 block font-bold">
                Kode pos <span className="font-normal text-gray-500">(opsional)</span>
              </label>
              <input
                id="ad-postal"
                className={fieldClass}
                value={form.postal}
                onChange={(e) => setForm({ ...form, postal: e.target.value })}
                inputMode="numeric"
                maxLength={10}
              />
            </div>
            <div>
              <label htmlFor="ad-maps" className="mb-1 block font-bold">
                Link maps <span className="font-normal text-gray-500">(opsional)</span>
              </label>
              <input
                id="ad-maps"
                className={fieldClass}
              value={form.maps_url}
              onChange={(e) => setForm({ ...form, maps_url: e.target.value })}
                placeholder="https://maps.app.goo.gl/…"
              />
            </div>
          </div>
          <div>
            <label htmlFor="ad-note" className="mb-1 block font-bold">
              Catatan alamat <span className="font-normal text-gray-500">(opsional)</span>
            </label>
            <input
              id="ad-note"
              className={fieldClass}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Pagar hitam sebelah mushola"
              maxLength={255}
            />
          </div>
          <button
            type="button"
            className="btn"
            onClick={() => {
              onNewAddress({ ...form })
              setShowForm(false)
              setLocalError('')
            }}
          >
            Pakai alamat ini
          </button>
        </div>
      )}

      {newAddress && !showForm && (
        <div className="mb-4 rounded-xl border-2 border-ink bg-success/40 p-3 text-sm">
          <span className="font-bold">Alamat baru (akan disimpan):</span>
          <br />
          {newAddress.street_no}, Kel. {newAddress.village}, Kec. {newAddress.district},{' '}
          {newAddress.city}, {newAddress.province}
          {newAddress.postal ? ` ${newAddress.postal}` : ''}
          <br />
          <button type="button" className="mt-1 font-bold underline" onClick={() => onNewAddress(null)}>
            Ganti dengan alamat tersimpan
          </button>
        </div>
      )}

      {localError && (
        <p role="alert" className="mb-4 font-bold text-red-700">
          {localError}
        </p>
      )}

      <button type="button" className="btn btn-cta w-full py-3" onClick={handleNext} disabled={saving}>
        {saving ? 'Menyimpan…' : 'Lanjut — Pilih Item'}
      </button>
    </section>
  )
}
