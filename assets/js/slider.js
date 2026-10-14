/* ============================================
   INDEEP CLEANING ID - Before/After Slider
   Vanilla JS, tanpa library berat
   ============================================ */

(function () {
    'use strict';

    // Initialize all sliders on the page
    const sliders = document.querySelectorAll('[data-slider], .ba-slider');

    sliders.forEach(function (slider) {
        const beforeImg = slider.querySelector('.ba-image-before');
        const afterImg = slider.querySelector('.ba-image-after');
        const divider = slider.querySelector('.ba-divider');
        const handle = slider.querySelector('.ba-handle');

        if (!beforeImg || !afterImg || !divider || !handle) return;

        let isDragging = false;

        function updateSlider(xPosition) {
            const rect = slider.getBoundingClientRect();
            let percentage = ((xPosition - rect.left) / rect.width) * 100;

            // Clamp between 0 and 100
            percentage = Math.max(0, Math.min(100, percentage));

            // Update clip-path for after image
            afterImg.style.clipPath = 'inset(0 ' + (100 - percentage) + '% 0 0)';

            // Update divider position
            divider.style.left = percentage + '%';

            // Update handle position
            handle.style.left = percentage + '%';
        }

        // Mouse events
        slider.addEventListener('mousedown', function (e) {
            isDragging = true;
            e.preventDefault();
            updateSlider(e.clientX);
        });

        document.addEventListener('mousemove', function (e) {
            if (!isDragging) return;
            updateSlider(e.clientX);
        });

        document.addEventListener('mouseup', function () {
            isDragging = false;
        });

        // Touch events (mobile)
        slider.addEventListener('touchstart', function (e) {
            isDragging = true;
            updateSlider(e.touches[0].clientX);
        });

        document.addEventListener('touchmove', function (e) {
            if (!isDragging) return;
            updateSlider(e.touches[0].clientX);
        });

        document.addEventListener('touchend', function () {
            isDragging = false;
        });

        // Click to jump
        slider.addEventListener('click', function (e) {
            updateSlider(e.clientX);
        });
    });

})();
