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
