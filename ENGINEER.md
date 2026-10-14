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
