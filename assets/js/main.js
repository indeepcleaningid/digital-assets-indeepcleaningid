/* ============================================
   INDEEP CLEANING ID - Main JavaScript
   Navbar, Smooth Scroll, Mobile Menu
   ============================================ */

(function () {
    'use strict';

    // ============================
    // Mobile Menu Toggle
    // ============================
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuIcon = document.getElementById('menu-icon');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function () {
            mobileMenu.classList.toggle('hidden');

            // Toggle icon between hamburger and close
            if (mobileMenu.classList.contains('hidden')) {
                menuIcon.setAttribute('d', 'M4 6h16M4 12h16M4 18h16');
            } else {
                menuIcon.setAttribute('d', 'M6 18L18 6M6 6l12 12');
            }
        });

        // Close mobile menu when clicking a link
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(function (link) {
            link.addEventListener('click', function () {
                mobileMenu.classList.add('hidden');
                menuIcon.setAttribute('d', 'M4 6h16M4 12h16M4 18h16');
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', function (e) {
            if (!mobileMenuBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
                mobileMenu.classList.add('hidden');
                menuIcon.setAttribute('d', 'M4 6h16M4 12h16M4 18h16');
            }
        });
    }

    // ============================
    // Smart Navbar (Hide on scroll down, show on scroll up + Glassmorphism)
    // ============================
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;
    const scrollThreshold = 100;

    if (navbar) {
        navbar.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease';

        window.addEventListener('scroll', function () {
            const currentScroll = window.pageYOffset;

            if (currentScroll > 50) {
                navbar.classList.add('nb-scrolled');
            } else {
                navbar.classList.remove('nb-scrolled');
            }

            if (currentScroll > scrollThreshold) {
                if (currentScroll > lastScroll) {
                    navbar.style.transform = 'translateY(-100%)';
                } else {
                    navbar.style.transform = 'translateY(0)';
                }
            } else {
                navbar.style.transform = 'translateY(0)';
            }

            lastScroll = currentScroll;
        });
    }

    // ============================
    // Scroll Reveal Animations
    // ============================
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');

    const revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(function (el) {
        revealObserver.observe(el);
    });

    // ============================
    // Counter Animation
    // ============================
    const counters = document.querySelectorAll('[data-counter]');

    const counterObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                const target = entry.target;
                const targetValue = parseInt(target.getAttribute('data-counter'), 10);
                const duration = 2000;
                const startTime = performance.now();

                function updateCounter(currentTime) {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const easeProgress = 1 - Math.pow(1 - progress, 4);
                    const currentValue = Math.floor(easeProgress * targetValue);

                    target.textContent = currentValue.toLocaleString('id-ID');

                    if (progress < 1) {
                        requestAnimationFrame(updateCounter);
                    } else {
                        target.textContent = targetValue.toLocaleString('id-ID') + '+';
                    }
                }

                requestAnimationFrame(updateCounter);
                counterObserver.unobserve(target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(function (counter) {
        counterObserver.observe(counter);
    });

    // ============================
    // Smooth Scroll for Anchor Links
    // ============================
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const navHeight = navbar ? navbar.offsetHeight : 0;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ============================
    // Active Nav Link Highlight
    // ============================
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('nav a');

    navLinks.forEach(function (link) {
        link.classList.remove('active');
        const linkPath = link.getAttribute('href');
        if (linkPath && linkPath.includes(currentPage)) {
            link.classList.add('active');
        }
    });

    // ============================
    // FAQ Accordion
    // ============================
    // ============================
    // FAQ Accordion
    // ============================
    const faqButtons = document.querySelectorAll('.faq-btn, .faq-question');

    faqButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            const content = this.nextElementSibling;
            const icon = this.querySelector('.faq-icon');
            const isOpen = content.classList.contains('open');

            // Toggle current item
            content.classList.toggle('open');
            content.classList.toggle('hidden');
            this.setAttribute('aria-expanded', !isOpen);

            // Rotate icon (arrow down when open)
            if (icon) {
                icon.classList.toggle('rotate-180');
            }

            // Adjust max-height for smooth open/close
            if (!isOpen) {
                content.classList.remove('hidden');
                content.style.maxHeight = content.scrollHeight + 'px';
            } else {
                content.style.maxHeight = '0px';
                content.classList.add('hidden');
            }
        });
    });

    // ============================
    // Fade In on Scroll (Intersection Observer)
    // ============================
    const fadeElements = document.querySelectorAll('.fade-in');

    if (fadeElements.length > 0 && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        fadeElements.forEach(function (el) {
            observer.observe(el);
        });
    }

    // ============================
    // Before/After Slider
    // ============================
    const sliders = document.querySelectorAll('[data-slider]');

    sliders.forEach(function (slider) {
        const divider = slider.querySelector('.ba-divider');
        const handle = slider.querySelector('.ba-handle');
        const afterImg = slider.querySelector('.ba-image-after');
        let isDragging = false;

        function updateSlider(position) {
            const rect = slider.getBoundingClientRect();
            let x = position.clientX - rect.left;
            let percentage = (x / rect.width) * 100;
            percentage = Math.max(5, Math.min(95, percentage));

            divider.style.left = percentage + '%';
            handle.style.left = percentage + '%';
            afterImg.style.clipPath = 'inset(0 0 0 ' + percentage + '%)';
        }

        // Mouse events
        handle.addEventListener('mousedown', function (e) {
            isDragging = true;
            e.preventDefault();
        });

        slider.addEventListener('mousedown', function (e) {
            isDragging = true;
            updateSlider(e);
        });

        document.addEventListener('mousemove', function (e) {
            if (!isDragging) return;
            updateSlider(e);
        });

        document.addEventListener('mouseup', function () {
            isDragging = false;
        });

        // Touch events
        handle.addEventListener('touchstart', function (e) {
            isDragging = true;
            e.preventDefault();
        });

        slider.addEventListener('touchstart', function (e) {
            isDragging = true;
            updateSlider(e.touches[0]);
        });

        document.addEventListener('touchmove', function (e) {
            if (!isDragging) return;
            updateSlider(e.touches[0]);
        });

        document.addEventListener('touchend', function () {
            isDragging = false;
        });
    });

    // ============================
    // Gallery Filter
    // ============================
    const filterBtns = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    filterBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var filter = this.getAttribute('data-filter');

            // Update active button
            filterBtns.forEach(function (b) {
                b.classList.remove('active', 'bg-primary', 'text-white');
                b.classList.add('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
            });
            this.classList.add('active', 'bg-primary', 'text-white');
            this.classList.remove('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');

            // Filter items
            galleryItems.forEach(function (item) {
                var category = item.getAttribute('data-category');
                if (filter === 'all' || category === filter) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });

    // ============================
    // Lazy Load Images (Native + Fallback)
    // ============================
    if ('loading' in HTMLImageElement.prototype) {
        // Native lazy loading supported
    } else {
        // Fallback: simple intersection observer for lazy load
        const lazyImages = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });

        lazyImages.forEach(function (img) {
            imageObserver.observe(img);
        });
    }

    // ============================
    // Testimonial Slider
    // ============================
    const testiTrack = document.getElementById('testi-track');
    const testiViewport = document.getElementById('testi-viewport');
    const testiPrev = document.getElementById('testi-prev');
    const testiNext = document.getElementById('testi-next');
    const testiDots = document.getElementById('testi-dots');

    if (testiTrack && testiViewport && testiPrev && testiNext && testiDots) {
        const testiCards = testiTrack.querySelectorAll('[class*="flex-shrink-0"]');
        let testiIndex = 0;
        let testiCardsPerView = 3;
        let testiTotalSlides = 0;

        function getTestiCardsPerView() {
            if (window.innerWidth >= 1024) return 3;
            if (window.innerWidth >= 640) return 2;
            return 1;
        }

        function updateTestiSlider() {
            testiCardsPerView = getTestiCardsPerView();
            testiTotalSlides = Math.ceil(testiCards.length / testiCardsPerView);
            if (testiIndex >= testiTotalSlides) testiIndex = testiTotalSlides - 1;

            const cardWidth = 100 / testiCardsPerView;
            const offset = testiIndex * testiCardsPerView * cardWidth;
            testiTrack.style.transform = `translateX(-${offset}%)`;

            buildTestiDots();
        }

        function buildTestiDots() {
            testiDots.innerHTML = '';
            for (let i = 0; i < testiTotalSlides; i++) {
                const dot = document.createElement('button');
                dot.className = `h-2.5 rounded-full transition-all ${i === testiIndex ? 'w-6 bg-accent shadow-[2px_2px_5px_rgba(6,44,61,0.2)]' : 'w-2.5 bg-navy/20 hover:bg-navy/40'}`;
                dot.setAttribute('aria-label', `Slide ${i + 1}`);
                dot.addEventListener('click', () => {
                    testiIndex = i;
                    updateTestiSlider();
                });
                testiDots.appendChild(dot);
            }
        }

        testiPrev.addEventListener('click', () => {
            if (testiIndex > 0) {
                testiIndex--;
                updateTestiSlider();
            }
        });

        testiNext.addEventListener('click', () => {
            if (testiIndex < testiTotalSlides - 1) {
                testiIndex++;
                updateTestiSlider();
            }
        });

        window.addEventListener('resize', updateTestiSlider);
        updateTestiSlider();
    }

    // ============================
    // Magnetic Button Effect
    // ============================
    const magneticBtns = document.querySelectorAll('.magnetic-btn');

    magneticBtns.forEach(function (btn) {
        btn.addEventListener('mousemove', function (e) {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const deltaX = (x - centerX) / centerX;
            const deltaY = (y - centerY) / centerY;

            btn.style.transform = `translate(${deltaX * 8}px, ${deltaY * 8}px)`;
            btn.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
            btn.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);
        });

        btn.addEventListener('mouseleave', function () {
            btn.style.transform = 'translate(0, 0)';
        });
    });

    // ============================
    // 3D Tilt Card Effect
    // ============================
    const tiltCards = document.querySelectorAll('.tilt-card');

    tiltCards.forEach(function (card) {
        card.addEventListener('mousemove', function (e) {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -8;
            const rotateY = ((x - centerX) / centerX) * 8;

            card.style.setProperty('--rotate-x', `${rotateX}deg`);
            card.style.setProperty('--rotate-y', `${rotateY}deg`);
        });

        card.addEventListener('mouseleave', function () {
            card.style.setProperty('--rotate-x', '0deg');
            card.style.setProperty('--rotate-y', '0deg');
        });
    });

    // ============================
    // Mobile Sticky CTA
    // ============================
    const mobileCta = document.querySelector('.mobile-sticky-cta');
    if (mobileCta) {
        let ctaLastScroll = 0;
        window.addEventListener('scroll', function () {
            const currentScroll = window.pageYOffset;
            if (currentScroll > 500) {
                if (currentScroll > ctaLastScroll) {
                    mobileCta.classList.remove('visible');
                } else {
                    mobileCta.classList.add('visible');
                }
            } else {
                mobileCta.classList.remove('visible');
            }
            ctaLastScroll = currentScroll;
        });
    }

    // ============================
    // Lightbox (klik gambar untuk memperbesar)
    // ============================
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxBackdrop = document.getElementById('lightbox-backdrop');
    const lightboxFigure = document.getElementById('lightbox-figure');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxTriggers = document.querySelectorAll('[data-lightbox]');

    if (lightbox && lightboxImg && lightboxTriggers.length) {
        let lastFocused = null;

        function openLightbox(src, alt) {
            lastFocused = document.activeElement;
            lightboxImg.src = src;
            lightboxImg.alt = alt || '';
            lightbox.classList.remove('hidden');
            lightbox.classList.add('flex');
            document.body.style.overflow = 'hidden';

            // Paksa reflow dulu biar browser ngitung state awal (opacity 0),
            // baru tambah is-open → transisi jalan. Tanpa requestAnimationFrame.
            void lightbox.offsetHeight;
            lightbox.classList.add('is-open');

            lightboxClose.focus();
        }

        function closeLightbox() {
            // Hapus is-open buat animasi keluar
            lightbox.classList.remove('is-open');
            document.body.style.overflow = '';

            // Tunggu animasi keluar sebelum sembunyikan
            setTimeout(function () {
                lightbox.classList.add('hidden');
                lightbox.classList.remove('flex');
                lightboxImg.src = '';
                if (lastFocused) lastFocused.focus();
            }, 300);
        }

        lightboxTriggers.forEach(function (trigger) {
            trigger.addEventListener('click', function () {
                openLightbox(trigger.getAttribute('data-lightbox'), trigger.getAttribute('data-lightbox-alt'));
            });

            // Dukung keyboard (Enter/Space) karena pakai role="button"
            trigger.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openLightbox(trigger.getAttribute('data-lightbox'), trigger.getAttribute('data-lightbox-alt'));
                }
            });
        });

        // Tutup via tombol close, backdrop, atau Esc
        lightboxClose.addEventListener('click', closeLightbox);
        lightboxBackdrop.addEventListener('click', closeLightbox);
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && !lightbox.classList.contains('hidden')) {
                closeLightbox();
            }
        });
    }

})();
