INDEEP CLEANING ID - INVOICE ADMIN
===============================
URL: https://indeepcleaningid.site/invoice/admin/data/invoice.html
Akses: Internal only (noindex, tidak ada link publik)

FILE:
- invoice.html : page utama
- customers.js : database pelanggan (download via File Manager untuk backup)
- company.js   : data perusahaan (logo, alamat, WA, rekening)
- save.php     : auto-save ke file (jangan dihapus)

CARA BACKUP DATA PELANGGAN:
1. Buka hPanel Hostinger -> File Manager
2. Masuk ke /public_html/invoice/admin/data/
3. Klik kanan customers.js -> Download

TIPS:
- Data pelanggan baru otomatis kesimpen ke customers.js via save.php
- Jika save.php error, data tetap kesimpen di browser (localStorage) dan ada tombol Export manual
- Edit logo/alamat/WA via tombol ⚙️ di invoice.html
