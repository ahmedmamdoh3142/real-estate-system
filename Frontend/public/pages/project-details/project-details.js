/**
 * =============================================
 * PROJECT DETAILS PAGE - PREMIUM JAVASCRIPT
 * =============================================
 * Optimized, clean architecture with AOS support
 * Performance-focused with requestAnimationFrame
 * 
 * UPDATED: Added 3D Carousel for Related Projects
 * Added CTA Stats Animation
 * Server-ready version (relative API paths)
 * =============================================
 */
(function() {
    'use strict';

    console.log('✅ project-details.js loaded - PREMIUM VERSION v2.0 (server)');

    // ─────────────────────────────────────────────
    // Configuration
    // ─────────────────────────────────────────────
    const CONFIG = {
        baseURL: '',               // فارغ – المسارات نسبية
        autoPlayInterval: 5000,
        transitionDuration: 800,
        enableAutoPlay: true,
        enableKeyboard: true,
        enableTouch: true,
        visibleCards: 5
    };

    // ─────────────────────────────────────────────
    // Sample Projects Data (Fallback)
    // ─────────────────────────────────────────────
    const SAMPLE_PROJECTS = [
        {
            id: 1,
            projectName: 'فيلا النخيل الفاخرة',
            projectType: 'سكني',
            city: 'الرياض',
            district: 'حي النخيل',
            area: 450,
            bedrooms: 5,
            bathrooms: 4,
            price: 25000,
            priceType: 'إيجار',
            isFeatured: true,
            status: 'متاح',
            mainImage: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80'
        },
        {
            id: 2,
            projectName: 'برج الأعمال المركزي',
            projectType: 'تجاري',
            city: 'جدة',
            district: 'الكورنيش',
            area: 200,
            bedrooms: 0,
            bathrooms: 2,
            price: 18000,
            priceType: 'إيجار',
            isFeatured: true,
            status: 'متاح',
            mainImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80'
        },
        {
            id: 3,
            projectName: 'شقق الريان السكنية',
            projectType: 'سكني',
            city: 'الدمام',
            district: 'حي الريان',
            area: 180,
            bedrooms: 3,
            bathrooms: 2,
            price: 8500,
            priceType: 'إيجار',
            isFeatured: false,
            status: 'متاح',
            mainImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80'
        },
        {
            id: 4,
            projectName: 'مجمع الواحة التجاري',
            projectType: 'تجاري',
            city: 'الرياض',
            district: 'العليا',
            area: 350,
            bedrooms: 0,
            bathrooms: 3,
            price: 35000,
            priceType: 'إيجار',
            isFeatured: true,
            status: 'متاح',
            mainImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80'
        },
        {
            id: 5,
            projectName: 'فيلا الصفا الحديثة',
            projectType: 'سكني',
            city: 'جدة',
            district: 'حي الصفا',
            area: 520,
            bedrooms: 6,
            bathrooms: 5,
            price: 45000,
            priceType: 'إيجار',
            isFeatured: true,
            status: 'متاح',
            mainImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80'
        },
        {
            id: 6,
            projectName: 'مكاتب النور الإدارية',
            projectType: 'تجاري',
            city: 'الرياض',
            district: 'طريق الملك فهد',
            area: 150,
            bedrooms: 0,
            bathrooms: 1,
            price: 12000,
            priceType: 'إيجار',
            isFeatured: false,
            status: 'متاح',
            mainImage: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80'
        }
    ];

    // ─────────────────────────────────────────────
    // 3D Carousel Class — CINEMATIC V2 (adapted for server)
    // ─────────────────────────────────────────────
    class Carousel3D {
        constructor(containerId, indicatorsId) {
            this.carousel = document.getElementById(containerId);
            this.indicatorsContainer = document.getElementById(indicatorsId);
            this.prevBtn = document.querySelector('.nav-prev');
            this.nextBtn = document.querySelector('.nav-next');
            this.wrapper = document.querySelector('.carousel-wrapper');

            this.projects = [];
            this.currentIndex = 0;
            this.autoPlayTimer = null;
            this.isTransitioning = false;
            this.touchStartX = 0;
            this.touchEndX = 0;

            this.init();
        }

        init() {
            this.setupEventListeners();
            if (CONFIG.enableAutoPlay) {
                this.startAutoPlay();
            }
        }

        loadProjects(projects) {
            if (!projects || projects.length === 0) {
                this.projects = SAMPLE_PROJECTS;
            } else {
                this.projects = projects;
            }
            this.currentIndex = 0;
            this.renderCarousel();
            this.renderIndicators();
        }

        getFullImageUrl(imageUrl) {
            if (!imageUrl) return SAMPLE_PROJECTS[0].mainImage;
            if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                return imageUrl;
            }
            // المسارات النسبية التي تبدأ بـ / نضيف لها baseURL (فارغ حاليًا)
            if (imageUrl.startsWith('/')) {
                return `${CONFIG.baseURL}${imageUrl}`;
            }
            return imageUrl;
        }

        formatPrice(price) {
            if (!price || price === 0) return 'اتصل للسعر';
            const num = parseFloat(price);
            if (isNaN(num)) return 'اتصل للسعر';
            if (num >= 1000000) {
                return (num / 1000000).toFixed(1).replace('.0', '') + ' مليون';
            }
            if (num >= 1000) {
                return (num / 1000).toFixed(0) + ' ألف';
            }
            return new Intl.NumberFormat('ar-SA').format(num);
        }

        getPropertyType(type) {
            const types = {
                'سكني': 'سكني',
                'تجاري': 'تجاري',
                'صناعي': 'صناعي',
                'فندقي': 'فندق',
                'فندق': 'فندق',
                'residential': 'سكني',
                'commercial': 'تجاري'
            };
            return types[type] || type || 'عقار';
        }

        getPriceType(type) {
            const rentTypes = ['تأجير', 'إيجار', 'إيجار_تشغيلي', 'rent'];
            return rentTypes.includes(type) ? 'إيجار' : 'شراء';
        }

        getStatus(status) {
            const statuses = {
                'نشط': 'نشط',
                'جاهز': 'جاهز',
                'مكتمل': 'مكتمل',
                'مباع': 'مباع',
                'متاح': 'متاح',
                'قيد_الإنشاء': 'قيد الإنشاء'
            };
            return statuses[status] || status || 'متاح';
        }

        renderCarousel() {
            if (!this.carousel || this.projects.length === 0) return;

            const html = this.projects.map((project, index) => {
                const image = this.getFullImageUrl(project.mainImage);
                const name = project.projectName || 'عقار مميز';
                const city = project.city || 'الرياض';
                const district = project.district || '';
                const location = district ? `${city}، ${district}` : city;
                const area = project.area || 0;
                const bedrooms = project.bedrooms || 0;
                const bathrooms = project.bathrooms || 0;
                const price = this.formatPrice(project.price);
                const isFeatured = Boolean(project.isFeatured);
                const priceType = this.getPriceType(project.priceType);
                const priceText = priceType === 'إيجار' ? 'ريال/شهري' : 'ريال';

                let detailsHTML = `
                    <div class="detail-item">
                        <i class="fas fa-expand-arrows-alt"></i>
                        <span>${area} م²</span>
                    </div>
                `;

                if (bedrooms > 0) {
                    detailsHTML += `
                        <div class="detail-item">
                            <i class="fas fa-bed"></i>
                            <span>${bedrooms} غرف</span>
                        </div>
                    `;
                }

                if (bathrooms > 0) {
                    detailsHTML += `
                        <div class="detail-item">
                            <i class="fas fa-bath"></i>
                            <span>${bathrooms} حمام</span>
                        </div>
                    `;
                }

                return `
                    <article class="project-card" data-index="${index}">
                        <div class="card-image">
                            <img src="${image}" alt="${name}" loading="${index < 3 ? 'eager' : 'lazy'}" decoding="async">
                        </div>
                        <div class="card-overlay">
                            <div class="card-top">
                                ${isFeatured ? `
                                <span class="card-badge featured">
                                    <i class="fas fa-crown"></i>
                                    <span>مميز</span>
                                </span>` : ''}
                            </div>
                            <div class="card-bottom">
                                <h3 class="card-title">${name}</h3>
                                <div class="card-location">
                                    <i class="fas fa-map-marker-alt"></i>
                                    <span>${location}</span>
                                </div>
                                <div class="card-details">
                                    ${detailsHTML}
                                </div>
                                <div class="card-footer">
                                    <div class="card-price">
                                        <span class="price-value">${price}</span>
                                        <span class="price-period">${priceText}</span>
                                    </div>
                                    <a href="index.html?id=${project.id}" class="card-action">
                                        <span>التفاصيل</span>
                                        <i class="fas fa-arrow-left"></i>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </article>
                `;
            }).join('');

            this.carousel.innerHTML = html;
            this.updateCardPositions();
        }

        renderIndicators() {
            if (!this.indicatorsContainer) return;

            const html = this.projects.map((_, index) =>
                `<button class="indicator ${index === 0 ? 'active' : ''}" data-index="${index}" aria-label="عرض العقار ${index + 1}"></button>`
            ).join('');

            this.indicatorsContainer.innerHTML = html;
        }

        updateCardPositions() {
            const cards = this.carousel.querySelectorAll('.project-card');
            const total = cards.length;

            cards.forEach((card, index) => {
                card.classList.remove('active', 'prev', 'next', 'far-prev', 'far-next', 'hidden');

                let relativeIndex = index - this.currentIndex;

                if (relativeIndex > total / 2) relativeIndex -= total;
                if (relativeIndex < -total / 2) relativeIndex += total;

                if (relativeIndex === 0) {
                    card.classList.add('active');
                } else if (relativeIndex === -1) {
                    card.classList.add('prev');
                } else if (relativeIndex === 1) {
                    card.classList.add('next');
                } else if (relativeIndex === -2) {
                    card.classList.add('far-prev');
                } else if (relativeIndex === 2) {
                    card.classList.add('far-next');
                } else {
                    card.classList.add('hidden');
                }
            });

            this.updateIndicators();
        }

        updateIndicators() {
            const indicators = this.indicatorsContainer.querySelectorAll('.indicator');
            indicators.forEach((indicator, index) => {
                indicator.classList.toggle('active', index === this.currentIndex);
            });
        }

        goToSlide(index) {
            if (this.isTransitioning) return;

            this.isTransitioning = true;
            this.currentIndex = index;

            if (this.currentIndex < 0) {
                this.currentIndex = this.projects.length - 1;
            } else if (this.currentIndex >= this.projects.length) {
                this.currentIndex = 0;
            }

            this.updateCardPositions();

            setTimeout(() => {
                this.isTransitioning = false;
            }, CONFIG.transitionDuration);

            if (CONFIG.enableAutoPlay) {
                this.resetAutoPlay();
            }
        }

        goToPrev() {
            this.goToSlide(this.currentIndex - 1);
        }

        goToNext() {
            this.goToSlide(this.currentIndex + 1);
        }

        startAutoPlay() {
            if (this.wrapper) {
                this.wrapper.classList.add('autoplay');
            }

            this.autoPlayTimer = setInterval(() => {
                this.goToNext();
            }, CONFIG.autoPlayInterval);
        }

        stopAutoPlay() {
            if (this.wrapper) {
                this.wrapper.classList.remove('autoplay');
            }

            if (this.autoPlayTimer) {
                clearInterval(this.autoPlayTimer);
                this.autoPlayTimer = null;
            }
        }

        resetAutoPlay() {
            this.stopAutoPlay();
            this.startAutoPlay();
        }

        setupEventListeners() {
            if (this.prevBtn) {
                this.prevBtn.addEventListener('click', () => this.goToPrev());
            }

            if (this.nextBtn) {
                this.nextBtn.addEventListener('click', () => this.goToNext());
            }

            if (this.indicatorsContainer) {
                this.indicatorsContainer.addEventListener('click', (e) => {
                    const indicator = e.target.closest('.indicator');
                    if (indicator) {
                        const index = parseInt(indicator.dataset.index);
                        this.goToSlide(index);
                    }
                });
            }

            if (this.carousel) {
                this.carousel.addEventListener('click', (e) => {
                    const card = e.target.closest('.project-card');
                    if (card && !card.classList.contains('active')) {
                        const index = parseInt(card.dataset.index);
                        this.goToSlide(index);
                    }
                });
            }

            if (CONFIG.enableKeyboard) {
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'ArrowLeft') {
                        this.goToNext();
                    } else if (e.key === 'ArrowRight') {
                        this.goToPrev();
                    }
                });
            }

            if (CONFIG.enableTouch && this.carousel) {
                this.carousel.addEventListener('touchstart', (e) => {
                    this.touchStartX = e.touches[0].clientX;
                    this.stopAutoPlay();
                }, { passive: true });

                this.carousel.addEventListener('touchmove', (e) => {
                    this.touchEndX = e.touches[0].clientX;
                }, { passive: true });

                this.carousel.addEventListener('touchend', () => {
                    const diff = this.touchStartX - this.touchEndX;
                    const threshold = 50;

                    if (Math.abs(diff) > threshold) {
                        if (diff > 0) {
                            this.goToNext();
                        } else {
                            this.goToPrev();
                        }
                    }

                    if (CONFIG.enableAutoPlay) {
                        this.startAutoPlay();
                    }
                });
            }

            if (this.wrapper) {
                this.wrapper.addEventListener('mouseenter', () => {
                    this.stopAutoPlay();
                });

                this.wrapper.addEventListener('mouseleave', () => {
                    if (CONFIG.enableAutoPlay) {
                        this.startAutoPlay();
                    }
                });
            }

            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.stopAutoPlay();
                } else if (CONFIG.enableAutoPlay) {
                    this.startAutoPlay();
                }
            });
        }
    }

    // ─────────────────────────────────────────────
    // Main Page Controller
    // ─────────────────────────────────────────────
    class ProjectDetailsPage {
        constructor() {
            this.apiBaseUrl = '/api/public';
            this.baseURL = '';          // رابط الخادم الخلفي
            this.projectId = this.getProjectIdFromURL();
            this.projectData = null;
            this.relatedProjects = [];
            this.isMenuOpen = false;
            this.scrollTicking = false;
            this.carousel3D = null;
            this.ctaStatsAnimated = false;
            this.statsData = null;

            this.init();
        }

        /**
         * تحويل مسار الصورة إلى رابط كامل إذا كانت محفوظة على السيرفر
         * @param {string} imageUrl - المسار النسبي أو المطلق للصورة
         * @returns {string} رابط كامل صالح للعرض
         */
        getFullImageUrl(imageUrl) {
            if (!imageUrl) return '/global/assets/images/project-placeholder.jpg';
            // إذا كان الرابط مطلقاً بالفعل (يبدأ بـ http) نرجعه كما هو
            if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                return imageUrl;
            }
            // فقط مسارات الملفات المرفوعة على السيرفر نضيف لها رابط الخادم
            if (imageUrl.startsWith('/uploads/')) {
                return `${this.baseURL}${imageUrl}`;
            }
            // أي مسار آخر (مثل الصور المحلية الافتراضية) نرجعه دون تغيير
            return imageUrl;
        }

        init() {
            console.log('🚀 ProjectDetailsPage initializing...');
            console.log('📌 Project ID:', this.projectId);

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setupPage());
            } else {
                this.setupPage();
            }
        }

        getProjectIdFromURL() {
            const urlParams = new URLSearchParams(window.location.search);
            const id = urlParams.get('id');
            return id ? parseInt(id) : 1;
        }

        setupPage() {
            console.log('🔧 Setting up project details page...');

            // Initialize AOS
            this.initAOS();

            // Setup components
            this.setupMobileMenu();
            this.setupNavbarScroll();
            this.setupEventListeners();

            // Initialize 3D Carousel for Related Projects
            this.carousel3D = new Carousel3D('carousel3d', 'carouselIndicators');

            // Setup CTA stats observer
            this.setupCtaStatsObserver();

            // Load data with slight delay for smooth animations
            setTimeout(() => {
                this.loadProjectDetails();
                this.loadStatistics();
            }, 300);
        }

        /**
         * Initialize AOS Animation Library
         */
        initAOS() {
            if (typeof AOS !== 'undefined') {
                AOS.init({
                    duration: 600,
                    easing: 'ease-out-cubic',
                    once: true,
                    mirror: false,
                    offset: 50,
                    disable: window.innerWidth < 768 ? 'mobile' : false
                });
                console.log('✨ AOS initialized');

                // Refresh AOS after window load
                window.addEventListener('load', () => {
                    setTimeout(() => AOS.refresh(), 200);
                });
            } else {
                console.warn('⚠️ AOS library not loaded');
            }
        }

        /**
         * Setup Mobile Menu with Touch Support
         */
        setupMobileMenu() {
            const toggle = document.getElementById('mobile-toggle');
            const navMenu = document.querySelector('.nav-menu');

            if (!toggle || !navMenu) return;

            const openMenu = () => {
                navMenu.classList.add('active');
                toggle.classList.add('active');
                document.body.style.overflow = 'hidden';
                this.isMenuOpen = true;

                setTimeout(() => {
                    document.addEventListener('click', closeMenuOnClickOutside);
                    document.addEventListener('touchstart', closeMenuOnClickOutside);
                }, 10);
            };

            const closeMenu = () => {
                navMenu.classList.remove('active');
                toggle.classList.remove('active');
                document.body.style.overflow = '';
                this.isMenuOpen = false;

                document.removeEventListener('click', closeMenuOnClickOutside);
                document.removeEventListener('touchstart', closeMenuOnClickOutside);
            };

            const closeMenuOnClickOutside = (e) => {
                if (!navMenu.contains(e.target) && !toggle.contains(e.target)) {
                    closeMenu();
                }
            };

            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.isMenuOpen ? closeMenu() : openMenu();
            });

            // Close menu on nav link click
            navMenu.addEventListener('click', (e) => {
                if (e.target.closest('.nav-link')) {
                    closeMenu();
                }
            });

            // Close on resize
            window.addEventListener('resize', () => {
                if (window.innerWidth > 768 && this.isMenuOpen) {
                    closeMenu();
                }
            });

            // Close on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isMenuOpen) {
                    closeMenu();
                }
            });
        }

        /**
         * Setup Navbar Scroll Effect with RAF
         */
        setupNavbarScroll() {
            const navbar = document.querySelector('.navbar');
            if (!navbar) return;

            const handleScroll = () => {
                if (!this.scrollTicking) {
                    requestAnimationFrame(() => {
                        if (window.scrollY > 50) {
                            navbar.classList.add('scrolled');
                        } else {
                            navbar.classList.remove('scrolled');
                        }
                        this.scrollTicking = false;
                    });
                    this.scrollTicking = true;
                }
            };

            window.addEventListener('scroll', handleScroll, { passive: true });
            handleScroll(); // Initial check
        }

        addMobileAdminButtonStyles() {
            if (document.getElementById('mobile-admin-styles')) return;

            const style = document.createElement('style');
            style.id = 'mobile-admin-styles';
            style.textContent = `
                @media (max-width: 768px) {
                    .mobile-admin-btn {
                        margin-top: auto;
                        padding-top: 1.5rem;
                        border-top: 1px solid rgba(203, 205, 205, 0.08);
                        display: block !important;
                    }
                    
                    .mobile-admin-btn .premium-link {
                        background: rgba(203, 205, 205, 0.05) !important;
                        border: 1px solid rgba(203, 205, 205, 0.1) !important;
                    }
                }
                
                @media (min-width: 769px) {
                    .mobile-admin-btn {
                        display: none !important;
                    }
                }
            `;

            document.head.appendChild(style);
        }

        /**
         * Setup Event Listeners
         */
        setupEventListeners() {
            // Share button
            const shareBtn = document.getElementById('share-button');
            if (shareBtn) {
                shareBtn.addEventListener('click', () => this.shareProject());
            }

            // Print button
            const printBtn = document.getElementById('print-button');
            if (printBtn) {
                printBtn.addEventListener('click', () => this.printProjectDetails());
            }

            // Download button
            const downloadBtn = document.getElementById('download-button');
            if (downloadBtn) {
                downloadBtn.addEventListener('click', () => this.downloadProjectDetails());
            }

            // Inquiry form
            const form = document.getElementById('inquiry-form');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.submitInquiryForm();
                });
            }

            // Reset form button
            const resetBtn = document.getElementById('reset-form');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => this.resetInquiryForm());
            }

            // New inquiry button
            const newInquiryBtn = document.getElementById('new-inquiry');
            if (newInquiryBtn) {
                newInquiryBtn.addEventListener('click', () => this.showInquiryForm());
            }

            // Form validation
            this.setupFormValidation();

            // Gallery modal
            this.setupGalleryModal();
        }

        /**
         * Setup Form Validation
         */
        setupFormValidation() {
            const form = document.getElementById('inquiry-form');
            if (!form) return;

            const inputs = form.querySelectorAll('input, textarea, select');

            inputs.forEach(input => {
                input.addEventListener('input', () => this.validateField(input));
                input.addEventListener('blur', () => this.validateField(input));
            });

            // Special handling for radio buttons
            const radioButtons = document.querySelectorAll('input[name="contactPreference"]');
            radioButtons.forEach(radio => {
                radio.addEventListener('change', () => {
                    const errorEl = document.getElementById('contactPref-error');
                    if (errorEl) {
                        errorEl.textContent = '';
                        errorEl.classList.remove('active');
                    }
                });
            });

            // Phone validation
            const phoneInput = document.getElementById('customer-phone');
            if (phoneInput) {
                phoneInput.addEventListener('input', () => this.validatePhoneField(phoneInput));
                phoneInput.addEventListener('blur', () => this.validatePhoneField(phoneInput));
            }
        }

        /**
         * Validate Phone Field
         */
        validatePhoneField(input) {
            const value = input.value.trim();
            const errorElement = document.getElementById('phone-error');

            input.classList.remove('valid', 'invalid');

            if (!value) {
                if (input.required) {
                    errorElement.textContent = 'هذا الحقل مطلوب';
                    errorElement.classList.add('active');
                    input.classList.add('invalid');
                }
                return false;
            }

            // Relaxed phone regex for Saudi numbers
            const phoneRegex = /^(05|5)([0-9]{8,9})$/;
            const cleaned = value.replace(/\s+/g, '');

            if (phoneRegex.test(cleaned)) {
                errorElement.textContent = '';
                errorElement.classList.remove('active');
                input.classList.add('valid');
                return true;
            } else {
                errorElement.textContent = 'رقم الجوال غير صالح (يجب أن يبدأ بـ 05 ويتكون من 10 أرقام)';
                errorElement.classList.add('active');
                input.classList.add('invalid');
                return false;
            }
        }

        /**
         * Validate Field
         */
        validateField(input) {
            const errorElement = document.getElementById(`${input.name}-error`);
            if (!errorElement) return true;

            const value = input.value.trim();

            errorElement.textContent = '';
            errorElement.classList.remove('active');
            input.classList.remove('valid', 'invalid');

            if (input.required && !value) {
                errorElement.textContent = 'هذا الحقل مطلوب';
                errorElement.classList.add('active');
                input.classList.add('invalid');
                return false;
            }

            if (input.type === 'email' && value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    errorElement.textContent = 'البريد الإلكتروني غير صالح';
                    errorElement.classList.add('active');
                    input.classList.add('invalid');
                    return false;
                }
            }

            if (value) {
                input.classList.add('valid');
            }

            return true;
        }

        // ─────────────────────────────────────────────
        // CTA Stats Animation (from home.js)
        // ─────────────────────────────────────────────
        setupCtaStatsObserver() {
            const ctaStats = document.querySelector('.cta-stats-float');
            if (!ctaStats) return;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !this.ctaStatsAnimated) {
                        this.ctaStatsAnimated = true;
                        if (this.statsData) {
                            this.updateCtaStats(this.statsData);
                        }
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.3 });

            observer.observe(ctaStats);
        }

        async loadStatistics() {
            try {
                const response = await fetch(`${this.apiBaseUrl}/home/stats`);
                if (!response.ok) throw new Error('Failed to load stats');

                const data = await response.json();

                if (data.success) {
                    this.statsData = data.data;
                    if (this.ctaStatsAnimated) {
                        this.updateCtaStats(this.statsData);
                    }
                }
            } catch (error) {
                console.warn('Stats load error:', error.message);
                // Use fallback stats
                this.statsData = {
                    totalProjects: 48,
                    totalCities: 12,
                    totalClients: 350
                };
                if (this.ctaStatsAnimated) {
                    this.updateCtaStats(this.statsData);
                }
            }
        }

        updateCtaStats(stats) {
            const mapping = [
                { id: 'cta-stat-projects', value: stats.totalProjects || 0 },
                { id: 'cta-stat-cities', value: stats.totalCities || 0 }
            ];

            mapping.forEach(({ id, value }) => {
                const container = document.getElementById(id);
                if (container) {
                    const numEl = container.querySelector('.stat-num');
                    if (numEl && !numEl.hasAttribute('data-static')) {
                        const currentVal = parseInt(numEl.textContent.replace(/[^0-9]/g, '')) || 0;
                        if (currentVal !== value) {
                            this.animateCounter(numEl, currentVal, value);
                        }
                    }
                }
            });
        }

        animateCounter(element, start, end, suffix = '+') {
            if (!element) return;

            const duration = 1500;
            const startTime = performance.now();

            const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

            const update = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = easeOutQuart(progress);

                const current = Math.floor(start + (end - start) * easedProgress);
                element.textContent = current.toLocaleString('ar-SA') + suffix;

                if (progress < 1) {
                    requestAnimationFrame(update);
                } else {
                    element.textContent = end.toLocaleString('ar-SA') + suffix;
                }
            };

            requestAnimationFrame(update);
        }

        /**
         * Load Project Details from API
         */
        async loadProjectDetails() {
            try {
                console.log(`🔍 جلب تفاصيل العقار ID: ${this.projectId}`);
                this.showLoadingState();

                const response = await fetch(`${this.apiBaseUrl}/project-details/${this.projectId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to load project details: ${response.status}`);
                }

                const data = await response.json();
                console.log('✅ Project details loaded:', data);

                if (data.success && data.data) {
                    this.projectData = data.data;
                    this.renderProjectDetails();
                    this.initializeGallery();
                    this.loadRelatedProjects();

                    // Refresh AOS after content load
                    setTimeout(() => {
                        if (typeof AOS !== 'undefined') AOS.refresh();
                    }, 100);
                } else {
                    throw new Error('No project data found');
                }

            } catch (error) {
                console.error('❌ Error loading project details:', error);
                this.showFallbackProjectDetails();
            }
        }

        /**
         * Load Related Projects
         */
        async loadRelatedProjects() {
            try {
                console.log('🏢 جلب العقارات المشابهة...');

                const response = await fetch(`${this.apiBaseUrl}/project-details/${this.projectId}/related`, {
                    headers: { 'Accept': 'application/json' }
                });

                if (!response.ok) {
                    this.relatedProjects = [];
                    this.renderRelatedProjects();
                    return;
                }

                const data = await response.json();

                if (data.success && data.data?.projects?.length > 0) {
                    this.relatedProjects = data.data.projects.filter(p => p.id !== this.projectId);
                    this.renderRelatedProjects();
                    setTimeout(() => {
                        if (typeof AOS !== 'undefined') AOS.refresh();
                    }, 100);
                } else {
                    this.relatedProjects = [];
                    this.renderRelatedProjects();
                }

            } catch (error) {
                console.error('❌ Error loading related projects:', error);
                this.relatedProjects = [];
                this.renderRelatedProjects();
            }
        }

        /**
         * Submit Inquiry Form
         */
        async submitInquiryForm() {
            const form = document.getElementById('inquiry-form');
            const submitBtn = document.getElementById('submit-inquiry');
            const loadingEl = document.getElementById('inquiry-loading');

            if (!form || !submitBtn || !loadingEl) {
                this.showNotification('خطأ في تحميل النموذج', 'error');
                return;
            }

            // Validate all fields
            let isValid = true;
            const inputs = form.querySelectorAll('input[required], textarea[required]');

            inputs.forEach(input => {
                if (input.name === 'customerPhone') {
                    if (!this.validatePhoneField(input)) isValid = false;
                } else {
                    if (!this.validateField(input)) isValid = false;
                }
            });

            // Validate contact preference
            const contactPref = document.querySelector('input[name="contactPreference"]:checked');
            if (!contactPref) {
                const errorEl = document.getElementById('contactPref-error');
                if (errorEl) {
                    errorEl.textContent = 'يرجى اختيار طريقة التواصل المفضلة';
                    errorEl.classList.add('active');
                }
                isValid = false;
            }

            if (!isValid) {
                this.showNotification('يرجى ملء جميع الحقول المطلوبة بشكل صحيح', 'error');
                return;
            }

            // Collect form data
            const formData = {
                customerName: document.getElementById('customer-name').value.trim(),
                customerEmail: document.getElementById('customer-email').value.trim(),
                customerPhone: document.getElementById('customer-phone').value.trim().replace(/\s+/g, ''),
                message: document.getElementById('inquiry-message').value.trim(),
                inquiryType: 'استفسار_عام',
                contactPreference: contactPref ? contactPref.value : 'phone',
                preferredTime: document.getElementById('preferredTime')?.value || null
            };

            submitBtn.disabled = true;
            loadingEl.style.display = 'flex';

            try {
                const response = await fetch(`${this.apiBaseUrl}/project-details/${this.projectId}/inquiry`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'فشل في إرسال الاستفسار');
                }

                if (data.success) {
                    this.showInquirySuccess();
                    this.resetInquiryForm();
                    this.showNotification('✅ تم إرسال استفسارك بنجاح. سيتواصل معك فريقنا قريباً.', 'success');
                } else {
                    throw new Error(data.message || 'فشل غير معروف');
                }

            } catch (error) {
                console.error('❌ Error submitting inquiry:', error);

                // Fallback attempt
                try {
                    const testResponse = await fetch(`${this.apiBaseUrl}/project-details/test-inquiry`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({ ...formData, projectId: this.projectId, testMode: true })
                    });

                    if (testResponse.ok) {
                        this.showInquirySuccess();
                        this.resetInquiryForm();
                        this.showNotification('✅ تم إرسال استفسارك بنجاح (وضع الاختبار).', 'success');
                    } else {
                        throw error;
                    }
                } catch (testError) {
                    this.showNotification(error.message || 'حدث خطأ أثناء إرسال الاستفسار. يرجى المحاولة مرة أخرى.', 'error');
                }
            } finally {
                submitBtn.disabled = false;
                loadingEl.style.display = 'none';
            }
        }

        /**
         * Reset Inquiry Form
         */
        resetInquiryForm() {
            const form = document.getElementById('inquiry-form');
            if (!form) return;

            form.reset();

            // Clear error messages
            document.querySelectorAll('.form-error').forEach(el => {
                el.textContent = '';
                el.classList.remove('active');
            });

            // Clear validation classes
            form.querySelectorAll('input, textarea').forEach(input => {
                input.classList.remove('valid', 'invalid');
            });

            // Reset radio buttons
            document.querySelectorAll('input[name="contactPreference"]').forEach(radio => {
                radio.checked = false;
            });

            const preferredTime = document.getElementById('preferredTime');
            if (preferredTime) preferredTime.value = '';
        }

        /**
         * Show Inquiry Success
         */
        showInquirySuccess() {
            const form = document.getElementById('inquiry-form');
            const success = document.getElementById('inquiry-success');

            if (form) form.style.display = 'none';
            if (success) success.style.display = 'block';
        }

        /**
         * Show Inquiry Form
         */
        showInquiryForm() {
            const form = document.getElementById('inquiry-form');
            const success = document.getElementById('inquiry-success');

            if (success) success.style.display = 'none';
            if (form) {
                form.style.display = 'block';
                form.reset();
            }
        }

        /**
         * Show Notification
         */
        showNotification(message, type = 'info') {
            let notification = document.getElementById('custom-notification');

            if (!notification) {
                notification = document.createElement('div');
                notification.id = 'custom-notification';
                notification.style.cssText = `
                    position: fixed;
                    top: 100px;
                    right: 20px;
                    padding: 16px 24px;
                    border-radius: 12px;
                    color: white;
                    font-weight: 600;
                    z-index: 9999;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                    animation: notificationSlide 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    font-family: 'Tajawal', sans-serif;
                    direction: rtl;
                    text-align: right;
                    max-width: 400px;
                    backdrop-filter: blur(10px);
                `;
                document.body.appendChild(notification);
            }

            const colors = {
                success: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                info: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
            };

            notification.style.background = colors[type] || colors.info;
            notification.textContent = message;
            notification.style.display = 'block';

            setTimeout(() => {
                notification.style.display = 'none';
            }, 5000);

            // Add animation styles
            if (!document.getElementById('notification-styles')) {
                const style = document.createElement('style');
                style.id = 'notification-styles';
                style.textContent = `
                    @keyframes notificationSlide {
                        from {
                            transform: translateX(100%);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }
                `;
                document.head.appendChild(style);
            }
        }

        /**
         * Show Loading State
         */
        showLoadingState() {
            const titleElement = document.getElementById('project-title');
            if (titleElement) {
                titleElement.textContent = 'جاري تحميل العقار...';
            }
        }

        /**
         * Render Project Details
         */
        renderProjectDetails() {
            if (!this.projectData) return;

            const project = this.projectData;

            // Update page title
            const titleElement = document.getElementById('project-title');
            if (titleElement) {
                titleElement.textContent = project.projectName;
            }

            // Update document title
            document.title = `${project.projectName} | نظام إدارة العقارات`;

            // Update breadcrumb
            const breadcrumb = document.getElementById('project-name-breadcrumb');
            if (breadcrumb) {
                breadcrumb.textContent = project.projectName;
            }

            // Update sections
            this.updateQuickInfo(project);
            this.updatePropertyBadges(project);
            this.updateDescription(project);
            this.updateFeatures(project);
            this.updateSpecifications(project);
            this.updateLocation(project);
            this.updateInquiryForm(project);
            this.hideLoadingStates();
        }

        /**
         * Update Quick Info
         */
        updateQuickInfo(project) {
            const elements = {
                price: document.getElementById('quick-price'),
                area: document.getElementById('quick-area'),
                location: document.getElementById('quick-location'),
                status: document.getElementById('quick-status')
            };

            if (elements.price) elements.price.textContent = this.formatPrice(project.price, project.priceType);
            if (elements.area) elements.area.textContent = `${project.area} ${project.areaUnit || 'م²'}`;
            if (elements.location) elements.location.textContent = project.city || 'غير محدد';
            if (elements.status) elements.status.textContent = project.status || 'نشط';
        }

        /**
         * Update Property Badges
         */
        updatePropertyBadges(project) {
            const container = document.getElementById('property-badges');
            if (!container) return;

            let html = '';

            if (project.isFeatured) {
                html += `
                    <span class="property-badge featured">
                        <i class="fas fa-star"></i>
                        <span>مميز</span>
                    </span>
                `;
            }

            const status = project.status?.toLowerCase();
            if (status === 'مباع' || status === 'sold') {
                html += `
                    <span class="property-badge sold">
                        <i class="fas fa-tag"></i>
                        <span>مباع</span>
                    </span>
                `;
            } else if (status === 'جاهز' || status === 'جاهز_للتسليم') {
                html += `
                    <span class="property-badge available">
                        <i class="fas fa-check"></i>
                        <span>جاهز للتسليم</span>
                    </span>
                `;
            } else {
                html += `
                    <span class="property-badge available">
                        <i class="fas fa-check-circle"></i>
                        <span>متاح</span>
                    </span>
                `;
            }

            html += `
                <span class="property-badge">
                    <i class="fas fa-building"></i>
                    <span>${project.projectType || 'عقار'}</span>
                </span>
            `;

            container.innerHTML = html;
        }

        /**
         * Update Description
         */
        updateDescription(project) {
            const container = document.getElementById('project-description');
            if (!container) return;

            if (project.description && project.description.trim()) {
                container.innerHTML = `<p>${project.description.replace(/\n/g, '</p><p>')}</p>`;
            } else {
                container.innerHTML = `
                    <p>لا يوجد وصف متوفر لهذا العقار حالياً.</p>
                    <p>للحصول على مزيد من المعلومات، يرجى التواصل مع فريق المبيعات.</p>
                `;
            }
        }

        /**
         * Update Features
         */
        updateFeatures(project) {
            const container = document.getElementById('features-grid');
            if (!container) return;

            if (project.features && project.features.length > 0) {
                container.innerHTML = project.features.map(feature => `
                    <div class="feature-item">
                        <div class="feature-icon">
                            <i class="${feature.icon || 'fas fa-check'}"></i>
                        </div>
                        <div class="feature-content">
                            <span class="feature-name">${feature.name}</span>
                            <span class="feature-value">${feature.value || ''}</span>
                        </div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = `
                    <div class="no-features">
                        <i class="fas fa-info-circle"></i>
                        <p>لا توجد مميزات مسجلة لهذا العقار حالياً.</p>
                    </div>
                `;
            }
        }

        /**
         * Update Specifications
         */
        updateSpecifications(project) {
            const container = document.getElementById('specs-grid');
            if (!container) return;

            const specs = [
                { label: 'نوع العقار', value: project.projectType, icon: 'fas fa-home' },
                { label: 'المساحة', value: `${project.area} ${project.areaUnit || 'م²'}`, icon: 'fas fa-expand-arrows-alt' },
                { label: 'الغرف', value: project.bedrooms > 0 ? `${project.bedrooms} غرفة` : null, icon: 'fas fa-bed' },
                { label: 'الحمامات', value: project.bathrooms > 0 ? `${project.bathrooms} حمام` : null, icon: 'fas fa-bath' },
                { label: 'نوع المعاملة', value: this.getPriceTypeText(project.priceType), icon: 'fas fa-exchange-alt' },
                { label: 'الكود', value: project.projectCode || `PJ-${project.id}`, icon: 'fas fa-hashtag' },
                { label: 'تاريخ الإضافة', value: this.formatDate(project.createdAt), icon: 'fas fa-calendar-plus' },
                { label: 'الوحدات المتاحة', value: `${project.availableUnits || 0} من ${project.totalUnits || 0}`, icon: 'fas fa-building' }
            ].filter(spec => spec.value);

            container.innerHTML = specs.map(spec => `
                <div class="spec-item">
                    <span class="spec-label">
                        <i class="${spec.icon}"></i>
                        <span>${spec.label}</span>
                    </span>
                    <span class="spec-value">${spec.value}</span>
                </div>
            `).join('');
        }

        /**
         * Update Location
         */
        updateLocation(project) {
            const container = document.getElementById('location-details');
            if (!container) return;

            container.innerHTML = `
                <div class="location-address">
                    <div class="address-item">
                        <div class="address-icon">
                            <i class="fas fa-map-marker-alt"></i>
                        </div>
                        <div class="address-content">
                            <span class="address-label">العنوان الكامل</span>
                            <span class="address-value">${project.fullAddress || project.location || 'غير محدد'}</span>
                        </div>
                    </div>

                    <div class="address-item">
                        <div class="address-icon">
                            <i class="fas fa-city"></i>
                        </div>
                        <div class="address-content">
                            <span class="address-label">المدينة</span>
                            <span class="address-value">${project.city || 'غير محدد'}</span>
                        </div>
                    </div>

                    ${project.district ? `
                    <div class="address-item">
                        <div class="address-icon">
                            <i class="fas fa-location-arrow"></i>
                        </div>
                        <div class="address-content">
                            <span class="address-label">الحي</span>
                            <span class="address-value">${project.district}</span>
                        </div>
                    </div>
                    ` : ''}
                </div>
            `;

            this.updateMap(project);
        }

        /**
         * Update Map
         */
        updateMap(project) {
            const mapContainer = document.getElementById('location-map');
            if (!mapContainer) return;

            if (project.locationLink) {
                mapContainer.innerHTML = `
                    <div class="map-placeholder">
                        <i class="fas fa-map-marked-alt"></i>
                        <span>الموقع متاح</span>
                        <p>انقر على الزر لفتح الموقع على الخريطة</p>
                        <a href="${project.locationLink}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="margin-top: 1rem;">
                            <i class="fas fa-external-link-alt"></i>
                            <span>عرض على الخريطة</span>
                        </a>
                    </div>
                `;
            } else {
                mapContainer.innerHTML = `
                    <div class="map-placeholder">
                        <i class="fas fa-map"></i>
                        <span>الموقع غير متوفر</span>
                        <p>لم يقم المالك بإضافة رابط الموقع بعد. يمكنك التواصل معنا للاستفسار عن العنوان الدقيق.</p>
                        <button class="btn btn-outline btn-sm" onclick="document.getElementById('inquiry-form').scrollIntoView({behavior: 'smooth'});" style="margin-top: 1rem;">
                            <i class="fas fa-question-circle"></i>
                            <span>استفسر عن الموقع</span>
                        </button>
                    </div>
                `;
            }
        }

        /**
         * Update Inquiry Form with Project Data
         */
        updateInquiryForm(project) {
            const projectIdInput = document.getElementById('project-id');
            const projectNameInput = document.getElementById('project-name-input');

            if (projectIdInput) projectIdInput.value = project.id;
            if (projectNameInput) projectNameInput.value = project.projectName;
        }

        /**
         * Initialize Gallery - مع تطبيق getFullImageUrl على مسارات الصور
         */
        initializeGallery() {
            const project = this.projectData;
            if (!project) return;

            const noImagesElement = document.getElementById('no-images');
            const mainImageContainer = document.getElementById('main-image-container');
            const imageCountElement = document.getElementById('image-count');

            if (!project.images || project.images.length === 0) {
                if (noImagesElement) noImagesElement.style.display = 'block';
                if (mainImageContainer) mainImageContainer.style.display = 'none';
                if (imageCountElement) imageCountElement.textContent = '0 صورة';
                return;
            }

            if (imageCountElement) {
                imageCountElement.textContent = `${project.images.length} صورة`;
            }

            const mainImage = document.getElementById('main-image');
            if (mainImage && project.images[0].url) {
                mainImage.src = this.getFullImageUrl(project.images[0].url);
                mainImage.alt = project.projectName;
            } else if (mainImage) {
                mainImage.src = '/global/assets/images/project-placeholder.jpg';
            }

            if (mainImageContainer) {
                mainImageContainer.style.display = 'block';
            }

            // Populate gallery modal
            const galleryImages = document.getElementById('gallery-images');
            if (galleryImages) {
                galleryImages.innerHTML = project.images.map((image, index) => `
                    <img src="${this.getFullImageUrl(image.url)}" 
                         alt="${project.projectName} - صورة ${index + 1}" 
                         loading="lazy">
                `).join('');
            }
        }

        /**
         * Setup Gallery Modal
         */
        setupGalleryModal() {
            const modal = document.getElementById('gallery-modal');
            const openBtn = document.getElementById('view-gallery-btn');
            const closeBtn = document.getElementById('close-modal');

            if (openBtn && modal) {
                openBtn.addEventListener('click', () => {
                    modal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                });
            }

            if (closeBtn && modal) {
                closeBtn.addEventListener('click', () => {
                    modal.classList.remove('active');
                    document.body.style.overflow = '';
                });
            }

            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.classList.remove('active');
                        document.body.style.overflow = '';
                    }
                });

                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && modal.classList.contains('active')) {
                        modal.classList.remove('active');
                        document.body.style.overflow = '';
                    }
                });
            }
        }

        /**
         * Hide Loading States
         */
        hideLoadingStates() {
            document.querySelectorAll('.loading-line, .loading-features, .loading-specs, .loading-location, .loading-projects').forEach(el => {
                el.style.display = 'none';
            });
        }

        /**
         * Render Related Projects - now uses 3D Carousel
         */
        renderRelatedProjects() {
            const noRelatedContainer = document.getElementById('no-related-projects');

            if (!this.relatedProjects || this.relatedProjects.length === 0) {
                if (noRelatedContainer) noRelatedContainer.style.display = 'block';
                // Still load sample projects for the carousel
                if (this.carousel3D) {
                    this.carousel3D.loadProjects(SAMPLE_PROJECTS);
                }
                return;
            }

            if (noRelatedContainer) noRelatedContainer.style.display = 'none';

            // Load into 3D Carousel
            if (this.carousel3D) {
                this.carousel3D.loadProjects(this.relatedProjects);
            }
        }

        /**
         * Share Project
         */
        shareProject() {
            const project = this.projectData;
            const url = window.location.href;
            const title = project?.projectName || 'تفاصيل العقار';
            const text = `تفاصيل العقار: ${title}`;

            if (navigator.share) {
                navigator.share({ title, text, url })
                    .then(() => console.log('✅ تمت المشاركة بنجاح'))
                    .catch((error) => console.log('❌ خطأ في المشاركة:', error));
            } else {
                navigator.clipboard.writeText(url)
                    .then(() => this.showNotification('تم نسخ رابط العقار إلى الحافظة', 'success'))
                    .catch(() => {
                        // Fallback for older browsers
                        const tempInput = document.createElement('input');
                        tempInput.value = url;
                        document.body.appendChild(tempInput);
                        tempInput.select();
                        document.execCommand('copy');
                        document.body.removeChild(tempInput);
                        this.showNotification('تم نسخ رابط العقار إلى الحافظة', 'success');
                    });
            }
        }

        /**
         * Print Project Details
         */
        printProjectDetails() {
            const project = this.projectData;
            if (!project) return;

            const printContent = `
                <!DOCTYPE html>
                <html dir="rtl" lang="ar">
                <head>
                    <meta charset="UTF-8">
                    <title>${project.projectName} - طباعة التفاصيل</title>
                    <style>
                        body { font-family: 'Tajawal', sans-serif; padding: 20px; color: #333; }
                        .print-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                        .print-title { font-size: 24px; margin-bottom: 10px; }
                        .print-section { margin-bottom: 20px; }
                        .print-section h3 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                        .print-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
                        .print-item { margin-bottom: 10px; }
                        .print-label { font-weight: bold; color: #555; }
                        .print-footer { margin-top: 40px; text-align: center; color: #666; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="print-header">
                        <h1 class="print-title">${project.projectName}</h1>
                        <p>كود العقار: ${project.projectCode || `PJ-${project.id}`}</p>
                        <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</p>
                    </div>

                    <div class="print-section">
                        <h3>المعلومات الأساسية</h3>
                        <div class="print-grid">
                            <div class="print-item"><span class="print-label">نوع العقار:</span> ${project.projectType}</div>
                            <div class="print-item"><span class="print-label">المساحة:</span> ${project.area} ${project.areaUnit || 'م²'}</div>
                            <div class="print-item"><span class="print-label">السعر:</span> ${this.formatPrice(project.price, project.priceType)}</div>
                            <div class="print-item"><span class="print-label">الحالة:</span> ${project.status}</div>
                            <div class="print-item"><span class="print-label">الموقع:</span> ${project.fullAddress || project.city}</div>
                            <div class="print-item"><span class="print-label">تاريخ الإضافة:</span> ${this.formatDate(project.createdAt)}</div>
                        </div>
                    </div>

                    ${project.description ? `
                    <div class="print-section">
                        <h3>الوصف</h3>
                        <p>${project.description}</p>
                    </div>
                    ` : ''}

                    ${project.features?.length > 0 ? `
                    <div class="print-section">
                        <h3>المميزات</h3>
                        <div class="print-grid">
                            ${project.features.map(f => `<div class="print-item"><span class="print-label">${f.name}:</span> ${f.value || ''}</div>`).join('')}
                        </div>
                    </div>
                    ` : ''}

                    <div class="print-footer">
                        <p>© ${new Date().getFullYear()} إيواء العقارية - جميع الحقوق محفوظة</p>
                        <p>تمت الطباعة من: ${window.location.href}</p>
                    </div>
                </body>
                </html>
            `;

            const printWindow = window.open('', '_blank');
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.focus();

            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        }

        /**
         * Download Project Details
         */
        downloadProjectDetails() {
            const project = this.projectData;
            if (!project) return;

            const content = `
تفاصيل العقار: ${project.projectName}
=================================

الكود: ${project.projectCode || `PJ-${project.id}`}
النوع: ${project.projectType}
المساحة: ${project.area} ${project.areaUnit || 'م²'}
السعر: ${this.formatPrice(project.price, project.priceType)}
الحالة: ${project.status}
الموقع: ${project.fullAddress || project.city}

${project.description ? `
الوصف:
${project.description}
` : ''}

${project.features?.length > 0 ? `
المميزات:
${project.features.map(f => `• ${f.name}: ${f.value || ''}`).join('\n')}
` : ''}

---
تم التحميل من: ${window.location.href}
تاريخ التحميل: ${new Date().toLocaleString('ar-SA')}
© ${new Date().getFullYear()} إيواء العقارية
            `;

            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${project.projectName.replace(/\s+/g, '_')}_details.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showNotification('تم تحميل التفاصيل بنجاح', 'success');
        }

        /**
         * Show Fallback Project Details
         */
        showFallbackProjectDetails() {
            console.log('🔄 Using fallback project details');

            this.projectData = {
                id: this.projectId,
                projectName: 'فيلات النخيل الراقية',
                projectType: 'سكني',
                description: 'مجمع فيلات فاخرة بمواصفات عالمية، موقع مميز مع إطلالة على الواجهة البحرية',
                city: 'الرياض',
                district: 'النخيل',
                fullAddress: 'الرياض، حي النخيل، شارع الأمير محمد بن سلمان',
                area: 450,
                areaUnit: 'م²',
                bedrooms: 5,
                bathrooms: 4,
                price: 3500000,
                priceType: 'شراء',
                isFeatured: true,
                status: 'جاهز',
                projectCode: 'PJ-2024-001',
                createdAt: '2024-01-15',
                locationLink: null,
                images: [
                    { url: '/global/assets/images/project-placeholder.jpg', type: 'صورة رئيسية' }
                ],
                features: [
                    { name: 'المساحة', value: '450 م²', icon: 'fas fa-expand' },
                    { name: 'الغرف', value: '5 غرف نوم', icon: 'fas fa-bed' },
                    { name: 'الحمامات', value: '4 حمامات', icon: 'fas fa-bath' },
                    { name: 'مواقف السيارات', value: '4 مواقف مغطاة', icon: 'fas fa-parking' }
                ]
            };

            this.renderProjectDetails();
            this.initializeGallery();

            setTimeout(() => {
                if (typeof AOS !== 'undefined') AOS.refresh();
            }, 100);
        }

        /**
         * Format Price
         */
        formatPrice(price, priceType) {
            if (!price) return '---';

            const num = parseFloat(price);
            if (isNaN(num)) return '---';

            if (num >= 1000000) {
                return (num / 1000000).toFixed(1).replace('.0', '') + ' مليون ر.س';
            }
            if (num >= 1000) {
                return (num / 1000).toFixed(0) + ' ألف ر.س';
            }

            return num.toLocaleString('ar-SA') + ' ر.س';
        }

        /**
         * Get Price Type Text
         */
        getPriceTypeText(type) {
            if (!type) return 'شراء';

            const typeLower = type.toString().toLowerCase();
            if (typeLower.includes('إيجار') || typeLower.includes('تأجير') || typeLower === 'rent') {
                return 'إيجار';
            }
            return 'شراء';
        }

        /**
         * Format Date
         */
        formatDate(dateString) {
            if (!dateString) return 'غير محدد';

            try {
                const date = new Date(dateString);
                return date.toLocaleDateString('ar-SA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            } catch (error) {
                return 'غير محدد';
            }
        }
    }

    /**
     * Initialize Application
     */
    async function initialize() {
        try {
            window.projectDetailsPage = new ProjectDetailsPage();
            console.log('✅ ProjectDetailsPage initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize ProjectDetailsPage:', error);
        }
    }

    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();