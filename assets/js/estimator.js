/* ============================================
   INDEEP CLEANING ID - Price Estimator (v2)
   Logic hitung harga client-side
   Data source: assets/data/pricelist.js
   ============================================ */

(function () {
    'use strict';

    // ============================
    // DATA HARGA
    // ============================
    const priceData = typeof indeepPricelist !== 'undefined' ? indeepPricelist : {};

    // ============================
    // DOM Elements
    // ============================
    const serviceSelect = document.getElementById('service-type');
    const sizeSelect = document.getElementById('item-size');
    const extraOptions = document.getElementById('extra-options');
    const btnCalculate = document.getElementById('btn-calculate');
    const resultSection = document.getElementById('result-section');
    const resultPrice = document.getElementById('result-price');
    const resultDetail = document.getElementById('result-detail');
    const btnWhatsApp = document.getElementById('btn-whatsapp');

    // ============================
    // Format Rupiah
    // ============================
    function formatRupiah(amount) {
        return 'Rp ' + amount.toLocaleString('id-ID');
    }

    // ============================
    // Nama Kategori yang Cantik
    // ============================
    const categoryNames = {
        kasur: 'Cuci Kasur',
        dipan: 'Cuci Dipan',
        headboard: 'Cuci Headboard',
        bantal: 'Cuci Bantal',
        guling: 'Cuci Guling',
        sofa: 'Cuci Sofa',
        sofabed: 'Cuci Sofabed',
        recline: 'Cuci Recline',
        stool: 'Cuci Stool',
        kursi: 'Cuci Kursi',
        matras: 'Cuci Matras',
        karpet: 'Cuci Karpet',
        karpet_tangga: 'Cuci Karpet Tangga',
        gordyn: 'Cuci Gordyn/Curtain',
        vitrase: 'Cuci Vitrase',
        stroller: 'Cuci Stroller',
        baby_carseat: 'Cuci Baby Car Seat',
        interior_mobil_bawah: 'Interior Mobil Bawah',
        interior_mobil_atas: 'Interior Mobil Atas (Plafon)',
        bagasi: 'Cuci Bagasi',
        sunroof: 'Cuci Sunroof',
    };

    // ============================
    // Update Dropdown Ukuran
    // ============================
    function updateSizeDropdown(service) {
        // Clear current options
        sizeSelect.innerHTML = '<option value="">-- Pilih Ukuran / Tipe --</option>';

        if (!service || !priceData[service]) {
            sizeSelect.disabled = true;
            return;
        }

        const items = priceData[service];
        items.forEach(function (item) {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item.nama_barang + ' (' + item.ukuran + ') — ' + formatRupiah(item.harga);
            option.dataset.price = item.harga;
            sizeSelect.appendChild(option);
        });

        sizeSelect.disabled = false;
    }

    // ============================
    // Update Extra Options (Dinamis per Kategori)
    // ============================
    function updateExtraOptions(service) {
        extraOptions.innerHTML = '<p class="text-sm text-gray-500">Pilih tambahan yang berlaku (jika ada)</p>';

        if (!service) return;

        // Kasur Latex
        if (service === 'kasur') {
            const label = document.createElement('label');
            label.className = 'flex items-center space-x-3 cursor-pointer';
            label.innerHTML = `
                <input type="checkbox" class="extra-checkbox" data-extra="40000" data-label="Kasur Latex (+Rp 40.000)" checked>
                <span class="text-sm text-gray-700">Kasur Latex (+Rp 40.000)</span>
            `;
            extraOptions.appendChild(label);
        }

        // Sofa - Lepas Pasang + Lebar >75cm
        if (service === 'sofa') {
            const label1 = document.createElement('label');
            label1.className = 'flex items-center space-x-3 cursor-pointer';
            label1.innerHTML = `
                <input type="checkbox" class="extra-checkbox" data-extra="20000" data-label="Lepas Pasang (+Rp 20.000/seat)" checked>
                <span class="text-sm text-gray-700">Lepas Pasang (+Rp 20.000/seat)</span>
            `;
            extraOptions.appendChild(label1);

            const label2 = document.createElement('label');
            label2.className = 'flex items-center space-x-3 cursor-pointer';
            label2.innerHTML = `
                <input type="checkbox" class="extra-checkbox" data-extra="20000" data-label="Lebar >75cm/seat (+Rp 20.000/seat)" checked>
                <span class="text-sm text-gray-700">Lebar >75cm/seat (+Rp 20.000/seat)</span>
            `;
            extraOptions.appendChild(label2);
        }
    }

    // ============================
    // Event: Service Type Change
    // ============================
    if (serviceSelect) {
        serviceSelect.addEventListener('change', function () {
            const service = this.value;
            updateSizeDropdown(service);
            updateExtraOptions(service);

            // Reset result
            resultSection.classList.add('hidden');
        });
    }

    // ============================
    // Hitung Total Tambahan
    // ============================
    function calculateExtraTotal() {
        const checkboxes = extraOptions.querySelectorAll('.extra-checkbox:checked');
        let total = 0;
        checkboxes.forEach(function (cb) {
            total += parseInt(cb.dataset.extra) || 0;
        });
        return total;
    }

    // ============================
    // Event: Calculate Price
    // ============================
    if (btnCalculate) {
        btnCalculate.addEventListener('click', function () {
            const service = serviceSelect.value;
            const sizeValue = sizeSelect.value;

            // Validation
            if (!service) {
                alert('Silakan pilih jenis layanan terlebih dahulu.');
                return;
            }

            if (!sizeValue) {
                alert('Silakan pilih ukuran / tipe barang.');
                return;
            }

            // Find price from data
            const items = priceData[service];
            const selectedItem = items.find(function (item) {
                return item.id == sizeValue;
            });

            if (!selectedItem) return;

            // Calculate extra
            let extraTotal = calculateExtraTotal();

            // Calculate total
            let totalPrice = selectedItem.harga + extraTotal;

            // Build extra text
            const extraLabels = [];
            const checkboxes = extraOptions.querySelectorAll('.extra-checkbox:checked');
            checkboxes.forEach(function (cb) {
                extraLabels.push(cb.dataset.label);
            });

            // Show result
            resultPrice.textContent = formatRupiah(totalPrice);
            let detailText = selectedItem.nama_barang + ' (' + selectedItem.ukuran + ') — ' + formatRupiah(selectedItem.harga);
            if (extraLabels.length > 0) {
                detailText += ' + ' + extraLabels.join(' + ');
            }
            resultDetail.textContent = detailText;

            // Build WhatsApp link
            const catName = categoryNames[service] || service;
            const waText = encodeURIComponent(
                'Halo MinDi, saya mau pesan ' + catName + ' ' + selectedItem.nama_barang + ' ukuran ' + selectedItem.ukuran +
                '. Estimasi harga: ' + formatRupiah(totalPrice) +
                (extraLabels.length > 0 ? ' (termasuk tambahan)' : '') +
                '. Mohon konfirmasi ketersediaan jadwal ya!'
            );
            btnWhatsApp.href = 'https://wa.me/6287748244464?text=' + waText;

            // Show result section with animation
            resultSection.classList.remove('hidden');
            resultSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }

})();
