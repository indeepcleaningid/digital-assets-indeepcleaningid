# ENGINEER — Log Perubahan Sistem

> Riwayat perubahan teknis App InDeep Booking. **Setiap PR wajib menambah
> entry baru di sini** (aturan di [CONTRIBUTING.md](CONTRIBUTING.md)).
>
> Format: tanggal (YYYY-MM-DD) → judul → commit/PR → **apa** yang berubah →
> **kenapa** → file kena.

---

## 2026-10-15

### README disinkronkan dengan realita produksi (subdomain, Google aktif, CI mati, build base '/') — PR ini

- **Apa**: `README.md` diperbaiki di titik-titik yang sudah tidak sesuai kondisi
  nyata: (1) repo yang benar `digital-assets-indeepcleaningid` (badge CI &
  perintah `git clone` lama menunjuk repo `indeep-booking` yang **tidak ada**);
  (2) alamat produksi = subdomain `booking.indeepcleaningid.site`
  (`/app-booking/` sudah 404) — termasuk diagram arsitektur, referensi
  `APP_URL`/`WEB_URL`, redirect URI Google, dan jalur cron; (3) build produksi
  pakai base `/` — instruksi `VITE_BASE_PATH=/app-booking/` dihapus (kalau
  diikuti, aset produksi 404); (4) Google OAuth ditandai **aktif** (diverifikasi
  `302` ke `accounts.google.com` dengan `client_id` terisi), bukan lagi "nunggu
  credential"; (5) CI ditandai **belum aktif** (workflow ada di
  `booking/.github/workflows/`, GitHub hanya baca root repo — `gh run list`
  kosong) di badge, tech stack, bagian deployment, dan tabel integrasi;
  (6) struktur repo dijelaskan sebagai **monorepo** (website + `booking/`);
  (7) klaim `app/models/` dihapus (foldernya kosong — issue #13); (8) bagian
  keamanan ditambah: `login-dev.php` lokal-saja, pengecualian anti-enumerasi
  `409 password_not_set` yang disengaja, dan catatan rate limit per-IP belum
  "tepercaya" (issue #25); (9) skenario 2 Tahap 2 ditandai gagal pre-existing.
- **Kenapa**: README jadi sumber kebingungan — menyuruh build dengan env yang
  salah dan mendokumentasikan status yang sudah berubah (Google OAuth, CI,
  URL produksi), padahal repo ini dibuka untuk inspeksi & bakal dipakai tim.
- **Verifikasi**: semua klaim baru dicek langsung — `404` di path lama, `302`
  Google di live, hash bundle produksi == hash bundle `main`, `gh run list`
  kosong, `ls app/models/` kosong, `gh repo view indeep-booking` tidak ada.
- **File**: `README.md`, `ENGINEER.md`.

### Login customer email + password manual: endpoint `/login.php` + form `Login.jsx` — issue #30, tutup #31, PR #33 (merged `9d4ad1b`)

- **Apa**: Dua bagian — (1) endpoint baru `POST /api/login.php`: validasi input,
  rate limit 5 percobaan / 10 menit / IP (tabel `login_attempts`, pola
  `admin-login.php`, basis `REMOTE_ADDR`), cari customer by email,
  `password_verify`, lalu `session_boot()` + `login_user()` (regenerate id) +
  `audit_log`. (2) form di `Login.jsx` diganti dari email+nama (panggilan
  `login-dev.php`) jadi **email + password** pakai `PasswordInput`, Google
  tetap di atas sebagai pintu utama, link "Lupa password?" dipindah ke sebelah
  field password. Suite uji baru `uji-login-password.mjs` (19 cek) +
  `uji-login-helper.php`. README (fitur, tabel login, tabel suite, keterbatasan)
  ikut disinkronkan; bundle `public/` di-rebuild.
- **Kenapa**: Issue #30 — jalur set/reset password sudah ada tapi tidak ada
  pintu masuknya, jadi reset password dead end dan customer tanpa Google tidak
  bisa masuk sama sekali di produksi. Alur ini juga menyelesaikan issue #31
  (form yang memanggil `login-dev.php` — sekarang 403 di produksi — sudah
  diganti, jadi `login-dev.php` murni alat dev lokal).
- **Keputusan produk**: (a) akun yang belum punya password (dibuat via Google)
  dibalas **409 `password_not_set`** dengan arahan ke Google / "Lupa password"
  — sadar membocorkan status akun, dipilih demi UX (issue #30); (b) gagal
  password salah vs email tidak terdaftar tetap **401 identik** (anti
  enumerasi); (c) rate limit basis `REMOTE_ADDR` (konsisten admin-login,
  tidak bisa dipalsukan header) — revisi "IP tepercaya" menyusul di #25.
- **Hasil uji (state DB fresh)**: login password **19/19**, OTP **21/21**,
  Admin **28/28**, Tahap 2 **11/12** (1 gagal S2 surcharge = pre-existing,
  sudah dibuktikan gagal juga di `main`).
- **File**: `public/api/login.php` (baru), `web/src/pages/Login.jsx`,
  `scripts/uji-login-helper.php` (baru), `scripts/uji-login-password.mjs`
  (baru), `README.md`, `public/index.html` + `public/assets/*` (hasil build),
  `ENGINEER.md`.

### Backdoor login-dev ditutup total di produksi: gate .htaccess + gate PHP dobel + audit trail — issue #27, PR #32 (merged)

- **Apa**: Tiga lapis penutupan `public/api/login-dev.php` — (1) `public/.htaccess`
  dan `.htaccess` root nge-block file ini dengan `[F,L]` sebelum PHP sempat
  jalan; (2) gate di PHP diperkuat jadi dobel: wajib `APP_URL` lokal **dan**
  `PHP_SAPI === 'cli-server'` (server `php -S` Docker lokal — Apache/LiteSpeed
  produksi gak mungkin punya SAPI ini); (3) `audit_log()` dipanggil tiap
  endpoint dipanggil (`login_dev_blocked` saat gate menahan, `login_dev`
  saat login lokal lolos).
- **Kenapa**: Issue #27 (hasil analisa pentest) — endpoint auto-provision akun
  (INSERT `role='customer'` + session tanpa bukti apa pun) ikut ter-deploy ke
  produksi dan gate tunggalnya cuma string `APP_URL`, jadi sekali config
  salah ketik backdoor nyala **senyap**. Usulan "exclude dari artefak deploy"
  gak bisa: Hostinger auto-deploy gak punya mekanisme exclude ("files
  committed to the repo are the files served"), jadi diganti gate di web
  server yang gak baca config sama sekali. Gate SAPI menggantikan usulan flag
  `DEV_LOGIN_ENABLED` — tanpa config key sama sekali (gak ada risiko
  `config()` lempar error karena kunci gak dikenal), dan gak perlu ngoprek
  config server. Dev lokal + suite uji tetap jalan: `php -S` gak baca
  `.htaccess`, dan SAPI-nya `cli-server`.
- **File**: `public/api/login-dev.php`, `public/.htaccess`, `.htaccess`,
  `ENGINEER.md`.

## 2026-10-13

### Persiapan flip public: README top-matter, LICENSE, CONTRIBUTING — PR #21 (PR ini)

- **Apa**: Tiga file presentasi disiapkan buat repo publik — README: badge CI
  + ringkasan Inggris singkat + framing "proprietary, source available for
  inspection" (baris "Status repo: private" dihapus, bagian Lisensi ikut);
  LICENSE: klausa "Repository is PRIVATE" diganti model source-available
  (Section 2 baru "Nature of this Release", pembatasan reuse diperkuat
  termasuk larangan layanan bersaing); CONTRIBUTING: preamble untuk pembaca
  publik (bug report welcome, security via SECURITY.md, kebijakan PR
  eksternal).
- **Kenapa**: Repo mau di-flip public buat porto & review tanpa minta akses —
  dokumen lama masih menjamin privasi repo yang sudah tidak berlaku, dan
  LICENSE lama justru melarang keras hal yang baru kita putuskan.
- **File**: `README.md`, `LICENSE`, `CONTRIBUTING.md`, `ENGINEER.md`.

### Go-public hygiene: jejak password default dihapus + SECURITY.md — PR #20 (merged `17a0070`)

- **Apa**: Persiapan repo sebelum di-flip public — 6 titik password default
  hardcoded dihapus dari `README` (2), `config.example.php`, `seed.php`,
  `dev.mjs`, dan `uji-admin-tahap4.mjs`. Seed kini **wajib** `SEED_ADMIN_*`
  diisi sendiri (guard `exit(1)`, tanpa echo password); test admin baca
  kredensial dari `config/config.php` lokal / env `UJI_ADMIN_*`. `SECURITY.md`
  baru: disclosure policy + pernyataan "tidak ada credential/PII di repo".
- **Kenapa**: Repo disiapkan jadi publik (porto + bisa direview tanpa minta
  akses). Password default terdokumentasi = petunjuk username + pola password
  buat attacker live site. Secret scan 14 commit history: **bersih** — string
  mirip token hanyalah integrity hash `package-lock.json`.
- **File**: `README.md`, `config/config.example.php`, `scripts/seed.php`,
  `scripts/dev.mjs`, `scripts/uji-admin-tahap4.mjs`, `SECURITY.md`, `ENGINEER.md`.

### Repo dikasih kerangka maintain: README, CONTRIBUTING, ENGINEER, LICENSE, CI — PR #1 (merged `54a8a6e`)

- **Apa**: Lima file fondasi — README (dokumentasi lengkap app), CONTRIBUTING
  (aturan wajib PR + review manual Bang Rob + wajib log), ENGINEER (log
  perubahan, diisi dari git log), LICENSE (proprietary), dan GitHub Actions CI
  pertama (`php -l` + build Vite + cek bundle `public/` sinkron sama source).
- **Kenapa**: `main` auto-deploy ke live, jadi perubahan gak boleh masuk tanpa
  review; repo juga disiapin jadi referensi tim dan template project porto.
- **File**: `README.md`, `CONTRIBUTING.md`, `ENGINEER.md`, `LICENSE`,
  `.github/workflows/ci.yml`.

### README versi Indonesia — PR #2 (PR ini)

- **Apa**: Seluruh isi `README.md` diterjemahkan ke bahasa Indonesia
  (struktur, tabel, kode identik — cuma bahasa prosa). Anchor internal
  `CONTRIBUTING.md` disesuaikan (`#testing` → `#pengujian`).
- **Kenapa**: Permintaan Bang Rob — repo dan tim pakai bahasa Indonesia biar
  gak ada salah paham. (Keputusan awal Inggris demi porto, ditukar belakangan.)
- **File**: `README.md`, `CONTRIBUTING.md`, `ENGINEER.md`.

### FE ganti email: validasi sebelum kirim — `c86b008`

- **Apa**: Form "Ganti Email" di `/profil` menolak email kosong dan format
  salah di frontend sebelum memanggil API (banner pesan + trim spasi pinggir).
  Tombol tidak lagi memicu request `newEmail` kosong.
- **Kenapa**: Gejala live — klik "Kirim dua kode OTP" tanpa isi email
  (form `noValidate` tidak memblokir) membuat backend membalas
  `400 invalid_email` "Email baru belum benar formatnya ya." sehingga fase
  input OTP tidak pernah terbuka.
- **File**: `web/src/pages/Profil.jsx`, bundle `public/assets/`.

## 2026-10-12

### OTP produksi: klien SMTP mentah Gmail — `392993c`

- **Apa**: Klien SMTP nol-dependensi baru `app/lib/smtp.php` (dialog
  EHLO → AUTH LOGIN → MAIL → RCPT → DATA, TLS implisit port 465) menggantikan
  PHPMailer sesuai amendmen PRD Bab 10.4. Produksi dengan SMTP kosong kini
  membalas `503 email_disabled` yang jujur (bukan sukses palsu ke file log).
  Ditambah `scripts/cleanup-otp.php` buat cron 10 menit.
- **Kenapa**: PRD asli mewajibkan PHPMailer, tapi keputusan Bang Rob:
  zero-dep ala EXP011, satu provider Gmail, tiap baris bisa ditrace.
- **File**: `app/lib/smtp.php` (baru), `app/lib/mailer.php`,
  `scripts/cleanup-otp.php` (baru), `config/config.example.php`.
- **Verifikasi**: uji protocol offline lawan fake SMTP TLS + suite OTP
  21/21 lolos + live `otp-request` membalas 200.

### PRD disinkronisasi ke realita (file internal, di luar git)

- **Apa**: 15 titik PRD diperbarui: PHPMailer → SMTP mentah, port 8000 →
  Docker 5011, upload manual → deploy auto push `main`, CSRF token per form →
  Origin allowlist, build `web/dist/` → `public/`, risiko SMTP ditutup,
  dedup risiko Node/PHP, footer Next ditujuin.
- **Kenapa**: PRD sempat jadi "harapan", bukan "realita kode".
- **File**: `Credential+plan/PRD-app-indeep.md` (tidak dicommit, sengaja).

### Seed produksi: pintu dibuka sekali lalu ditutup permanen — `335dd43`, `8c3095c`, `a0230a6`

- **Apa**: Seed jalan di Hostinger shared (tanpa SSH) lewat wrapper web
  sekali-pakai `seed-web.php` → 10 tabel, 44 SKU, 3 surcharge, admin Argon2id
  terisi. Pintu kemudian dihapus dan diblokir permanen di root `.htaccess`.
- **Kenapa**: Hostinger gak punya akses CLI; seeding wajib sekali di server.
- **File**: `scripts/seed.php`, `scripts/seed-web.php`, `.htaccess`.

### Fix path produksi: origin check, base API, prefix brand — `ea2394d`

- **Apa**: Semua request tulis tadinya kena `403` universal di produksi
  karena origin check membandingkan full URL vs origin. Diperbaiki via
  `origin_of()` (scheme://host[:port]). `api.js` kini turun dari
  `import.meta.env.BASE_URL` (gak perlu `VITE_API_URL`), prefix
  `/app-booking/` untuk link Google login dan URL foto profil, robots +
  sitemap ke domain asli.
- **Kenapa**: Deploy pertama bikin semua tulis (login, booking, OTP) gagal.
- **File**: `app/lib/security.php`, `app/lib/response.php`, `web/src/api.js`,
  4 file brand, `web/public/robots.txt`, `web/public/sitemap.xml`.

### Deploy auto: Vite outDir ke public/ + root .htaccess routing — `33ef6cf`, `8982f27`

- **Apa**: Build frontend jatuh langsung ke `public/` (bukan `web/dist/`),
  root `.htaccess` memblok file repo internal lalu mengarahkan sisanya ke
  `public/` dengan fallback SPA React Router untuk deploy sub-path.
- **Kenapa**: Hostinger auto-deploy menyinkronkan repo ke `public_html`;
  tanpa routing ini asset React 404 di hard-refresh route dalam.
- **File**: `web/vite.config.js`, `.htaccess`, `public/index.html`,
  `public/assets/*`.

### Bersihkan file uji struk PDF — `565282a`

- **Apa**: File hasil uji `web/struk-*.pdf` dihapus dan masuk `.gitignore`.
- **Kenapa**: File uji bukan bagian produk.

### Rilis v1 — `37d5fc0`

- **Apa**: Aplikasi lengkap sesuai PRD locked: booking 5 langkah, pricelist
  44 SKU, slot anti-tumpang-tindih (transaksi InnoDB + optimistic lock),
  dashboard admin, profil + OTP, struk PDF, auth Google + admin, seed,
  neobrutalism rounded. React 19 + Vite 8 + Tailwind 4 + PHP 8.3 zero-dep
  + MariaDB 11 Docker.
- **Kenapa**: Inisialisasi repo dari PRD (11 Okt 2026).

---

> Aturan: entry terbaru di atas. Jangan menghapus entry lama — riwayat ini
> yang dipakai saat audit, debugging "kenapa keputusan ini", dan onboarding tim.
