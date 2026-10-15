# ENGINEER — Log Perubahan

> Dokumen ini wajib di-update setiap kali ada perubahan lewat PR.
> Format: tanggal, judul, apa yang berubah + kenapa, file yang kena.

---

## 2026-10-14

### Inisialisasi monorepo website InDeep CleaningID

**Apa:** Setup awal repository monorepo untuk website InDeep CleaningID.

**Kenapa:** Sebelumnya website di-deploy manual (zip upload) dan app booking
di repo terpisah. Monorepo menyatukan semua jadi satu sumber kebenaran dan
memudahkan deploy via GitHub → Hostinger Git.

**Yang berubah:**
- Buat `.gitignore` — block file development (`__shot.html`, `chat.md`, `*.sh`)
- Buat `README.md` — dokumentasi overview website
- Buat `LICENSE` — proprietary license (source available for inspection)
- Buat `CONTRIBUTING.md` — aturan kontribusi (wajib PR, owner review)
- Buat `ENGINEER.md` — file ini (log perubahan)
- `git init` — inisialisasi repository

**File:** `.gitignore`, `README.md`, `LICENSE`, `CONTRIBUTING.md`, `ENGINEER.md`

### Hapus folder invoice/ dan landingpage/

**Apa:** Hapus folder `invoice/` (app lama yang sudah tidak dipakai) dan
`landingpage/` (landing page ads lama yang akan dibuat ulang di subdomain
terpisah). Bersihkan referensi di `sitemap.xml` dan `.htaccess`.

**Kenapa:** `invoice/` adalah app lama yang sudah tidak digunakan.
`landingpage/` akan diganti dengan landing page baru di subdomain khusus
(terpisah dari website utama).

**Yang berubah:**
- Hapus folder `invoice/` (5 file)
- Hapus folder `landingpage/` (1 file: `v2.html`)
- Hapus 2 entry landing page dari `sitemap.xml`
- Hapus rewrite rules `/landingpage/v2` dari `.htaccess`

**File:** `sitemap.xml`, `.htaccess`, `invoice/`, `landingpage/`

### Update README.md sinkron dengan struktur terkini

**Apa:** Perbarui README.md setelah penghapusan folder `invoice/` dan
`landingpage/`. Hapus referensi ke folder yang sudah dihapus, perbarui
nama repo dan URL clone.

**Kenapa:** README harus mencerminkan kondisi aktual repository.

**Yang berubah:**
- Hapus `invoice/` dan `landingpage/` dari diagram struktur
- Tandai `booking/` sebagai "[akan ditambahkan]"
- Update nama repo di diagram struktur
- Update URL clone di bagian Local Development

**File:** `README.md`

---

## 2026-10-16

### SEO: OG image 1200×630 di semua halaman (issue #23)

**Apa:** Ganti `og:image`/`twitter:image` di website utama dari `Logo.webp`
(513×513) ke `assets/img/og-banner.webp` (**1200×630**, standar OG).

**Kenapa:** Sebelumnya semua halaman pakai logo polos sebagai OG image → saat
di-share di WA/FB/Twitter cuma tampil logo, kurang menarik klik. Sekarang visual
khusus + dimensi sesuai standar social preview.

**Yang berubah:**
- Tambah aset `assets/img/og-banner.webp` (1200×630).
- `og:image` + `twitter:image` → `og-banner.webp` di 13 halaman (index, about,
  contact, gallery, coverage, pricing-estimator, 404, dan 6 halaman services).
- `og:image:width`/`height` sudah 1200/630 (konsisten dengan aset).

**File:** `assets/img/og-banner.webp` (baru) + 13 halaman HTML

---

## 2026-10-15

### Security: header HSTS di website utama + booking (issue #28)

**Apa:** Tambah header `Strict-Transport-Security` di root `.htaccess` dan
`booking/public/.htaccess`.

**Kenapa:** Tanpa HSTS, browser masih memulai request HTTP pertama yang bisa
diganggu (SSL-strip) sebelum redirect 301 ke HTTPS berlaku. 1 baris, biaya
hampir nol.

**Yang berubah:**
- Nilai: `max-age=31536000; includeSubDomains` (**tanpa** `preload` — tunggu
  semua subdomain siap HTTPS penuh).
- Dipasang di header utama (`Header always set`) supaya tetap terkirim di
  respons redirect maupun error.

**File:** `.htaccess`, `booking/public/.htaccess`

---

## 2026-10-15

### SEO website: H1 about.html + meta description + title baby-stuff (issue #20, #21, #22)

**Apa:** Perbaikan SEO on-page di website utama (root).

**Kenapa:** Hasil audit SEO — `about.html` tidak punya tag `<h1>` (Google lemah
paham topik halaman); meta description `about.html` 170 char (kepotong di hasil
search); title `services/baby-stuff.html` 71 char (>60, kepotong).

**Yang berubah:**
- `about.html`: heading hero `Mengapa Indeep Cleaning Ada?` (dulu `<h2>`) →
  `<h1>Tentang Indeep Cleaning — Jasa Cuci Soft Furniture Jabodetabek</h1>`;
  meta description dipendekkan 170 → 140 char.
- `services/baby-stuff.html`: title 71 → 58 char
  (`Jasa Cuci Baby Stuff Jakarta - Indeep Cleaning | Aman Bayi`).

**File:** `about.html`, `services/baby-stuff.html`

---

## Format Entry

Copy template di bawah ini untuk entry baru:

```markdown
### Judul singkat perubahan

**Apa:** Apa yang berubah.

**Kenapa:** Kenapa perubahan ini dilakukan.

**Yang berubah:**
- Item 1
- Item 2

**File:** file1, file2, folder/file3
```
