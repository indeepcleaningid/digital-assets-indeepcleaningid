# CONTRIBUTING — Aturan Kontribusi Website InDeep CleaningID

> **Untuk pembaca publik:** ini sistem produksi bisnis tertentu — bukan library
> umum. **Laporan bug lewat issue terbuka sangat diterima**, terima kasih!
> Soal keamanan jangan lewat issue publik — langsung hubungi Bang Rob.
> PR dari kontributor luar: perbaikan kecil dipertimbangkan setelah
> didiskusikan di issue dulu; perubahan besar atau fitur baru jarang diterima
> karena ini website operasional bisnis spesifik, bukan produk umum.
>
> Aturan di bawah berlaku untuk **siapa pun** yang menyentuh repo ini,
> termasuk maintainer. Baca dokumen ini sepenuhnya sebelum mengubah apa pun.

## ⚠️ Aturan Utama (wajib baca)

### 1. `main` = production, dilarang push langsung

Setiap push ke branch `main` **langsung ter-deploy otomatis ke Hostinger**
(`indeepcleaningid.site` untuk website, `booking.indeepcleaningid.site` untuk
app booking) dalam 15–20 detik. Karena itu:

- **Semua perubahan WAJIB lewat Pull Request (PR).**
- **Bang Rob mengecek manual dulu sebelum merge.** Jangan pernah merge PR
  sendiri, jangan pernah push langsung ke `main`, jangan pernah force-push.
- PR yang CI-nya merah jangan dilanjutkan review sampai hijau.

### 2. Setiap perubahan wajib dicatat di `ENGINEER.md`

Tiap PR **wajib** menambah entry baru di [`ENGINEER.md`](ENGINEER.md):

- Tanggal perubahan (YYYY-MM-DD)
- Judul singkat + commit/PR
- **Apa** yang berubah dan **kenapa**
- File yang kena (ringkas)

PR tanpa log `ENGINEER.md` = ditolak. Ini yang bikin riwayat sistem
terlacak saat ada tim nanti.

### 3. File yang TIDAK BOLEH pernah masuk repo

| File/folder | Alasan |
|---|---|
| `__shot.html` | File development, bukan website |
| `chat.md` | Catatan internal |
| `*.sh` | Script tooling, bukan bagian website |
| `.env`, `.env.*` | Environment asli |
| `*.log` | Log files |

Double-check `git status` sebelum `git add`. Kalau ada file yang ragu-ragu:
**jangan di-commit**, tanya dulu.

---

## Alur Kerja Standar

```bash
# 1. Ambil terbaru dari main
git checkout main && git pull origin main

# 2. Bikin branch (pakai prefix ini)
git checkout -b fitur/nama-singkat        # fitur baru
git checkout -b fix/nama-singkat          # perbaikan bug
git checkout -b docs/nama-singkat         # dokumentasi
git checkout -b chore/nama-singkat        # ritual (deps, CI, cleanup)

# 3. Kerjakan perubahan, lalu jalankan checklist di bawah

# 4. Update ENGINEER.md (wajib!), lalu commit
git add <file-yang-berubah>
git commit -m "Area: deskripsi singkat perubahan"

# 5. Push branch + buka PR
git push -u origin <branch>
gh pr create --title "Area: deskripsi" --body "Apa + kenapa + cara tes"

# 6. Tunggu CI hijau → tunggu Bang Rob review → BANG ROB yang merge
```

### Gaya commit message

Konsisten dengan riwayat repo: `Area: deskripsi singkat`

Contoh yang benar:

- `Homepage: perbaiki CTA WhatsApp biar gak kepotong di mobile`
- `Services: tambah halaman cuci keyboard`
- `docs: README, CONTRIBUTING, ENGINEER, LICENSE`

---

## Checklist Sebelum Buka PR

Jalankan yang relevan (semua wajib kecuali ditandai opsional):

- [ ] **HTML valid** — pastikan tidak ada tag yang error
- [ ] **Link berfungsi** — cek semua internal link tidak 404
- [ ] **Responsive** — cek tampilan di mobile dan desktop
- [ ] **`git status` bersih** dari file terlarang (Aturan 3)
- [ ] **`ENGINEER.md` sudah dapat entry baru**

## Struktur Monorepo

Repo ini berisi dua aplikasi:

| Folder | Aplikasi | URL Live |
|--------|----------|----------|
| `/` (root) | Website utama | `indeepcleaningid.site` |
| `booking/` | App booking | `booking.indeepcleaningid.site` |

### Perubahan di Website (root)

- Edit file HTML, CSS, JS di root dan folder `assets/`, `services/`, `landingpage/`
- Pastikan `.htaccess` tetap konsisten kalau ada perubahan URL

### Perubahan di App Booking (`booking/`)

- Ikuti juga [CONTRIBUTING.md](booking/CONTRIBUTING.md) untuk detail app
- Pastikan build Vite jalan sebelum push (kalau ada perubahan di `booking/web/`)
- Bundle hasil build ikut ter-commit

---

## Setelah Merge

1. Tunggu auto-deploy Hostinger (±15–20 detik).
2. Verifikasi cepat di live: buka website, cek halaman yang berubah,
   pastikan tidak ada error 500/404.
3. Kalau ada masalah: **revert via PR baru**, jangan force-push `main`.

## Pertanyaan

Kalau ragu soal cakupan perubahan, desain, atau dampak ke data production —
tanya Bang Rob dulu sebelum menulis kode. Lebih murah diskusi daripada
merewrite.
