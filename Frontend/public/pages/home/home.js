/**
 * ═══════════════════════════════════════════════════════════════
 * ABH HOLDING GROUP - Home Page JavaScript
 * Version: 7.1.0 - OPTIMIZED NAVBAR + CARDS + PERFORMANCE + DYNAMIC STATS
 * Includes: 3D Carousel, Timeline Reveals, Cinematic CTA, Dynamic Stats
 * ═══════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';

    // ─────────────────────────────────────────────
    // Configuration
    // ─────────────────────────────────────────────
    const CONFIG = {
        baseURL: '',
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
    // 3D Carousel Class — CINEMATIC V2
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
                                    <a href="../project-details/index.html?id=${project.id}" class="card-action">
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
    // Smooth Scroll Reveal Observer — ENHANCED
    // ─────────────────────────────────────────────
    class ScrollReveal {
        constructor() {
            this.sections = document.querySelectorAll('.section-reveal, .stagger-children');
            this.timelineItems = document.querySelectorAll('.timeline-item');
            this.init();
        }

        init() {
            if (!('IntersectionObserver' in window)) {
                // Fallback: show all immediately
                this.sections.forEach(section => section.classList.add('revealed'));
                this.timelineItems.forEach(item => item.classList.add('revealed'));
                return;
            }

            // Standard sections observer
            const sectionObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        sectionObserver.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            });

            this.sections.forEach(section => {
                sectionObserver.observe(section);
            });

            // Timeline items observer with stagger
            const timelineObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry, index) => {
                    if (entry.isIntersecting) {
                        setTimeout(() => {
                            entry.target.classList.add('revealed');
                        }, index * 150);
                        timelineObserver.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.2,
                rootMargin: '0px 0px -30px 0px'
            });

            this.timelineItems.forEach(item => {
                timelineObserver.observe(item);
            });
        }
    }

    // ─────────────────────────────────────────────
    // HomePage Class
    // ─────────────────────────────────────────────
    class HomePage {
        constructor() {
            this.apiClient = window.API || null;
            this.baseURL = '';
            this.featuredProjects = [];
            this.statsData = null;
            this.isMenuOpen = false;
            this.observers = [];
            this.rafIds = [];
            this.hasAnimatedHeroStats = false;
            this.ctaStatsAnimated = false;
            this.carousel3D = null;

            this.init();
        }

        getFullImageUrl(imageUrl) {
            if (!imageUrl) return '/global/assets/images/project-placeholder.jpg';
            if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                return imageUrl;
            }
            if (imageUrl.startsWith('/')) {
                return `${this.baseURL}${imageUrl}`;
            }
            return imageUrl;
        }

        init() {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setupPage());
            } else {
                this.setupPage();
            }
        }

        setupPage() {
            // Setup mobile menu
            this.setupMobileMenu();

            // Setup scroll effects
            this.setupScrollEffects();

            // Initialize smooth scroll reveals (includes timeline)
            new ScrollReveal();

            // Initialize 3D Carousel
            this.carousel3D = new Carousel3D('carousel3d', 'carouselIndicators');

            // Load featured projects & stats
            requestAnimationFrame(() => {
                setTimeout(() => {
                    this.loadFeaturedProjects();
                    this.loadStatistics();
                }, 200);
            });

            // Setup CTA stats observer (dynamic from API)
            this.setupCtaStatsObserver();

            // Setup hero stats observer
            this.setupHeroStatsObserver();
        }

        setupScrollEffects() {
            const navbar = document.querySelector('.navbar');
            if (!navbar) return;

            let ticking = false;

            const updateNavbar = () => {
                const scrollY = window.scrollY;
                if (scrollY > 50) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
                ticking = false;
            };

            window.addEventListener('scroll', () => {
                if (!ticking) {
                    requestAnimationFrame(updateNavbar);
                    ticking = true;
                }
            }, { passive: true });
        }

        setupMobileMenu() {
            const toggle = document.getElementById('mobile-toggle');
            const navMenu = document.querySelector('.nav-menu');

            if (!toggle || !navMenu) return;

            const openMenu = () => {
                navMenu.classList.add('active');
                toggle.classList.add('active');
                toggle.setAttribute('aria-expanded', 'true');
                this.isMenuOpen = true;
                document.body.style.overflow = 'hidden';

                setTimeout(() => {
                    document.addEventListener('click', closeMenuOnClickOutside);
                    document.addEventListener('keydown', closeMenuOnEscape);
                }, 10);
            };

            const closeMenu = () => {
                navMenu.classList.remove('active');
                toggle.classList.remove('active');
                toggle.setAttribute('aria-expanded', 'false');
                this.isMenuOpen = false;
                document.body.style.overflow = '';

                document.removeEventListener('click', closeMenuOnClickOutside);
                document.removeEventListener('keydown', closeMenuOnEscape);
            };

            const closeMenuOnClickOutside = (e) => {
                if (!navMenu.contains(e.target) && !toggle.contains(e.target)) {
                    closeMenu();
                }
            };

            const closeMenuOnEscape = (e) => {
                if (e.key === 'Escape') {
                    closeMenu();
                    toggle.focus();
                }
            };

            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.isMenuOpen ? closeMenu() : openMenu();
            });

            navMenu.addEventListener('click', (e) => {
                if (e.target.closest('.nav-link')) {
                    closeMenu();
                }
            });

            window.addEventListener('resize', () => {
                if (window.innerWidth > 768 && this.isMenuOpen) {
                    closeMenu();
                }
            });
        }

        setupHeroStatsObserver() {
            const heroStatsContainer = document.getElementById('hero-stats-container');
            if (!heroStatsContainer) return;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !this.hasAnimatedHeroStats) {
                        this.hasAnimatedHeroStats = true;
                        this.animateHeroStatsCounters();
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.3 });

            observer.observe(heroStatsContainer);
            this.observers.push(observer);
        }

        setupCtaStatsObserver() {
            const ctaStats = document.querySelector('.cta-stats-float');
            if (!ctaStats) return;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !this.ctaStatsAnimated) {
                        this.ctaStatsAnimated = true;
                        // If stats already loaded, animate immediately
                        if (this.statsData) {
                            this.updateCtaStats(this.statsData);
                        }
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.3 });

            observer.observe(ctaStats);
            this.observers.push(observer);
        }

        animateHeroStatsCounters() {
            const counters = document.querySelectorAll('#hero-stats-container .stat-number[data-target]');
            counters.forEach(counter => {
                const target = parseInt(counter.dataset.target) || 0;
                if (target > 0) {
                    this.animateCounter(counter, 0, target);
                }
            });
        }

        async loadStatistics() {
            try {
                const response = await fetch('/api/public/home/stats');
                if (!response.ok) throw new Error('Failed to load stats');

                const data = await response.json();

                if (data.success) {
                    this.statsData = data.data;
                    // If CTA already visible, animate immediately
                    if (this.ctaStatsAnimated) {
                        this.updateCtaStats(this.statsData);
                    }
                    // Also update hero stats if needed
                    this.displayStatistics(this.statsData);
                }
            } catch (error) {
                console.warn('Stats load error:', error.message);
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

        displayStatistics(stats) {
            // Hero stats mapping (if elements exist in future)
            const heroMapping = [
                { id: 'hero-stat-units', value: stats.totalProjects || 0 },
                { id: 'hero-stat-cities', value: stats.totalCities || 0 },
                { id: 'hero-stat-clients', value: stats.totalClients || 0 }
            ];

            let needsReanimation = false;

            heroMapping.forEach(({ id, value }) => {
                const element = document.getElementById(id);
                if (element) {
                    const currentTarget = parseInt(element.dataset.target) || 0;
                    if (currentTarget !== value) {
                        element.dataset.target = value;
                        needsReanimation = true;
                    }
                }
            });

            if (needsReanimation && this.hasAnimatedHeroStats) {
                heroMapping.forEach(({ id }) => {
                    const element = document.getElementById(id);
                    if (element && parseInt(element.dataset.target) > 0) {
                        this.animateSingleCounterFromCurrent(element);
                    }
                });
            }
        }

        animateSingleCounterFromCurrent(element) {
            const target = parseInt(element.dataset.target) || 0;
            const currentText = element.textContent.replace(/[^0-9]/g, '');
            const start = parseInt(currentText) || 0;

            if (start === target) return;
            this.animateCounter(element, start, target);
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

        async loadFeaturedProjects() {
            try {
                const response = await fetch('/api/public/home/featured-projects');
                if (!response.ok) throw new Error('Failed to load projects');

                const data = await response.json();

                if (data.success && data.data?.projects?.length > 0) {
                    this.featuredProjects = data.data.projects;
                } else {
                    this.featuredProjects = SAMPLE_PROJECTS;
                }
            } catch (error) {
                console.warn('Projects load error:', error.message);
                this.featuredProjects = SAMPLE_PROJECTS;
            }

            if (this.carousel3D) {
                this.carousel3D.loadProjects(this.featuredProjects);
            }
        }

        destroy() {
            this.observers.forEach(observer => observer.disconnect());
            this.observers = [];
            this.rafIds.forEach(id => cancelAnimationFrame(id));
            this.rafIds = [];
            if (this.carousel3D) {
                this.carousel3D.stopAutoPlay();
            }
        }
    }

    // ─────────────────────────────────────────────
    // Initialize
    // ─────────────────────────────────────────────
    function initialize() {
        try {
            window.homePage = new HomePage();
        } catch (error) {
            console.error('HomePage initialization failed:', error);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();