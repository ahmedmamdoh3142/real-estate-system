/**
 * ═══════════════════════════════════════════════════════════════
 * ABH HOLDING GROUP - Projects Page JavaScript
 * Version: 7.0.0 - 3D CAROUSEL + PRO HERO + FILTERS
 * Includes: 3D Carousel, Filter System, Professional Hero
 * Backend: Unaffected — uses same API endpoints
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
    // 3D Carousel Class — from Home
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
    // Smooth Scroll Reveal Observer — from Home
    // ─────────────────────────────────────────────
    class ScrollReveal {
        constructor() {
            this.sections = document.querySelectorAll('.section-reveal');
            this.init();
        }

        init() {
            if (!('IntersectionObserver' in window)) {
                this.sections.forEach(section => section.classList.add('revealed'));
                return;
            }

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
        }
    }

    // ─────────────────────────────────────────────
    // ProjectsPage Class
    // ─────────────────────────────────────────────
    class ProjectsPage {
        constructor() {
            this.apiClient = window.API || null;
            this.baseURL = '';
            this.allProjects = [];
            this.filteredProjects = [];
            this.sortBy = 'newest';
            this.filters = {
                type: 'all',
                city: 'all',
                transaction: 'all',
                minPrice: null,
                maxPrice: null,
                search: ''
            };
            this.isMenuOpen = false;
            this.citiesList = ['الرياض'];
            this.searchDebounceTimer = null;
            this.carousel3D = null;
            this.observers = [];

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

            // Initialize smooth scroll reveals
            new ScrollReveal();

            // Initialize 3D Carousel
            this.carousel3D = new Carousel3D('carousel3d', 'carouselIndicators');

            // Setup filters
            this.setupFilters();
            this.setupSorting();
            this.setupHeroSearch();

            // Load cities first
            this.loadCities();

            // Load projects with slight delay
            requestAnimationFrame(() => {
                setTimeout(() => this.loadProjects(), 300);
            });
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

        setupHeroSearch() {
            const heroInput = document.getElementById('hero-search-input');
            const heroBtn = document.getElementById('hero-search-btn');
            const mainSearchInput = document.getElementById('search-input');

            if (heroBtn) {
                heroBtn.addEventListener('click', () => {
                    const term = heroInput?.value.trim() || '';
                    if (mainSearchInput) mainSearchInput.value = term;
                    this.filters.search = term;
                    this.applyFilters();
                    // Scroll to carousel
                    const carouselSection = document.querySelector('.featured-section');
                    if (carouselSection) {
                        carouselSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
            }

            if (heroInput) {
                heroInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        heroBtn?.click();
                    }
                });
            }
        }

        setupCityFilter() {
            const cityFilter = document.getElementById('city-filter');
            if (!cityFilter) return;

            cityFilter.innerHTML = '<option value="all">جميع المدن</option>';

            this.citiesList.forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                option.textContent = city;
                cityFilter.appendChild(option);
            });

            cityFilter.addEventListener('change', (e) => {
                this.filters.city = e.target.value;
                this.applyFilters();
            });
        }

        setupFilters() {
            // Type filters
            document.querySelectorAll('#type-filters .filter-option').forEach(option => {
                option.addEventListener('click', () => {
                    document.querySelectorAll('#type-filters .filter-option').forEach(opt => {
                        opt.classList.remove('active');
                    });
                    option.classList.add('active');
                    this.filters.type = option.dataset.type;
                    this.applyFilters();
                });
            });

            // City filter
            this.setupCityFilter();

            // Transaction filters
            document.querySelectorAll('#transaction-filters .filter-option').forEach(option => {
                option.addEventListener('click', () => {
                    document.querySelectorAll('#transaction-filters .filter-option').forEach(opt => {
                        opt.classList.remove('active');
                    });
                    option.classList.add('active');
                    this.filters.transaction = option.dataset.transaction;
                    this.applyFilters();
                });
            });

            // Price filter
            const applyPriceBtn = document.getElementById('apply-price');
            if (applyPriceBtn) {
                applyPriceBtn.addEventListener('click', () => {
                    const minPrice = document.getElementById('min-price')?.value;
                    const maxPrice = document.getElementById('max-price')?.value;

                    this.filters.minPrice = minPrice ? parseFloat(minPrice) : null;
                    this.filters.maxPrice = maxPrice ? parseFloat(maxPrice) : null;

                    this.applyFilters();
                });
            }

            // Search filter with debounce
            const searchInput = document.getElementById('search-input');
            const searchButton = document.getElementById('search-button');

            if (searchButton) {
                searchButton.addEventListener('click', () => {
                    this.filters.search = searchInput?.value.trim() || '';
                    this.applyFilters();
                });
            }

            if (searchInput) {
                searchInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.filters.search = searchInput.value.trim();
                        this.applyFilters();
                    }
                });

                searchInput.addEventListener('input', () => {
                    clearTimeout(this.searchDebounceTimer);
                    this.searchDebounceTimer = setTimeout(() => {
                        this.filters.search = searchInput.value.trim();
                        this.applyFilters();
                    }, 500);
                });
            }

            // Reset buttons
            const resetBtn = document.getElementById('reset-filters');
            const clearAllBtn = document.getElementById('clear-all-filters');

            if (resetBtn) {
                resetBtn.addEventListener('click', () => this.resetFilters());
            }
            if (clearAllBtn) {
                clearAllBtn.addEventListener('click', () => this.resetFilters());
            }
        }

        setupSorting() {
            const sortSelect = document.getElementById('sort-select');
            if (sortSelect) {
                sortSelect.addEventListener('change', (e) => {
                    this.sortBy = e.target.value;
                    this.applyFilters();
                });
            }
        }

        async loadCities() {
            try {
                const response = await fetch('/api/public/projects/cities/list');
                if (!response.ok) throw new Error('Failed to load cities');

                const data = await response.json();

                if (data.success && data.data?.cities?.length > 0) {
                    this.citiesList = data.data.cities;
                    this.setupCityFilter();
                }
            } catch (error) {
                console.warn('Cities API unavailable, using default');
                this.citiesList = ['الرياض'];
            }
        }

        async loadProjects() {
            try {
                const response = await fetch('/api/public/projects/all');
                if (!response.ok) throw new Error('Failed to load projects');

                const data = await response.json();

                if (data.success && data.data?.projects?.length > 0) {
                    this.allProjects = data.data.projects;
                    this.applyFilters();
                } else {
                    throw new Error('No projects found');
                }
            } catch (error) {
                console.warn('Using fallback projects:', error.message);
                this.showFallbackProjects();
            }
        }

        applyFilters() {
            this.filteredProjects = this.allProjects.filter(project => {
                // Type filter
                if (this.filters.type !== 'all' && project.projectType !== this.filters.type) {
                    return false;
                }

                // City filter
                if (this.filters.city !== 'all' && project.city !== this.filters.city) {
                    return false;
                }

                // Transaction filter
                if (this.filters.transaction !== 'all') {
                    const priceType = this.getPriceType(project.priceType);
                    if (priceType !== this.filters.transaction) {
                        return false;
                    }
                }

                // Price filters
                if (this.filters.minPrice !== null && project.price < this.filters.minPrice) {
                    return false;
                }
                if (this.filters.maxPrice !== null && project.price > this.filters.maxPrice) {
                    return false;
                }

                // Search filter
                if (this.filters.search) {
                    const searchTerm = this.filters.search.toLowerCase();
                    const searchFields = [
                        project.projectName,
                        project.city,
                        project.district,
                        project.description,
                        project.projectType
                    ].filter(Boolean).join(' ').toLowerCase();

                    if (!searchFields.includes(searchTerm)) {
                        return false;
                    }
                }

                return true;
            });

            // Sort projects
            this.sortProjects();

            // Update count
            this.updateProjectsCount();

            // Update carousel
            if (this.carousel3D) {
                this.carousel3D.loadProjects(this.filteredProjects);
            }
        }

        resetFilters() {
            this.filters = {
                type: 'all',
                city: 'all',
                transaction: 'all',
                minPrice: null,
                maxPrice: null,
                search: ''
            };

            // Reset UI
            document.querySelectorAll('#type-filters .filter-option').forEach(opt => {
                opt.classList.remove('active');
            });
            document.querySelector('#type-filters .filter-option[data-type="all"]')?.classList.add('active');

            const cityFilter = document.getElementById('city-filter');
            if (cityFilter) cityFilter.value = 'all';

            document.querySelectorAll('#transaction-filters .filter-option').forEach(opt => {
                opt.classList.remove('active');
            });
            document.querySelector('#transaction-filters .filter-option[data-transaction="all"]')?.classList.add('active');

            const minPriceInput = document.getElementById('min-price');
            const maxPriceInput = document.getElementById('max-price');
            const searchInput = document.getElementById('search-input');
            const heroSearchInput = document.getElementById('hero-search-input');

            if (minPriceInput) minPriceInput.value = '';
            if (maxPriceInput) maxPriceInput.value = '';
            if (searchInput) searchInput.value = '';
            if (heroSearchInput) heroSearchInput.value = '';

            this.applyFilters();
        }

        sortProjects() {
            this.filteredProjects.sort((a, b) => {
                switch (this.sortBy) {
                    case 'newest':
                        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                    case 'price_low':
                        return (a.price || 0) - (b.price || 0);
                    case 'price_high':
                        return (b.price || 0) - (a.price || 0);
                    case 'area_low':
                        return (a.area || 0) - (b.area || 0);
                    case 'area_high':
                        return (b.area || 0) - (a.area || 0);
                    case 'featured':
                        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
                    default:
                        return 0;
                }
            });
        }

        updateProjectsCount() {
            const countElement = document.getElementById('projects-count');
            if (countElement) {
                countElement.textContent = this.filteredProjects.length.toLocaleString('ar-SA');
            }
        }

        showFallbackProjects() {
            this.allProjects = [
                {
                    id: 1,
                    projectName: 'فيلات النخيل الراقية',
                    projectType: 'سكني',
                    city: 'الرياض',
                    district: 'النخيل',
                    area: 450,
                    bedrooms: 5,
                    bathrooms: 4,
                    price: 3500000,
                    priceType: 'شراء',
                    isFeatured: true,
                    status: 'جاهز_للتسليم',
                    mainImage: '/global/assets/images/project-placeholder.jpg',
                    createdAt: '2024-01-15'
                },
                {
                    id: 2,
                    projectName: 'أبراج الأعمال التجارية',
                    projectType: 'تجاري',
                    city: 'الرياض',
                    district: 'المركز',
                    area: 200,
                    bedrooms: 0,
                    bathrooms: 0,
                    price: 12000,
                    priceType: 'تأجير',
                    isFeatured: true,
                    status: 'مكتمل',
                    mainImage: '/global/assets/images/project-placeholder.jpg',
                    createdAt: '2024-01-10'
                },
                {
                    id: 3,
                    projectName: 'شقق السفير المتميزة',
                    projectType: 'سكني',
                    city: 'الرياض',
                    district: 'العليا',
                    area: 120,
                    bedrooms: 2,
                    bathrooms: 2,
                    price: 8000,
                    priceType: 'إيجار_تشغيلي',
                    isFeatured: true,
                    status: 'نشط',
                    mainImage: '/global/assets/images/project-placeholder.jpg',
                    createdAt: '2024-01-05'
                },
                {
                    id: 4,
                    projectName: 'مخازن اللوجستية الحديثة',
                    projectType: 'صناعي',
                    city: 'الرياض',
                    district: 'الصناعية',
                    area: 1200,
                    bedrooms: 0,
                    bathrooms: 0,
                    price: 5000000,
                    priceType: 'شراء',
                    isFeatured: false,
                    status: 'قيد_الإنشاء',
                    mainImage: '/global/assets/images/project-placeholder.jpg',
                    createdAt: '2023-12-20'
                },
                {
                    id: 5,
                    projectName: 'فندق ومنتجع الضيافة',
                    projectType: 'فندقي',
                    city: 'الرياض',
                    district: 'الملك_عبدالله',
                    area: 5000,
                    bedrooms: 0,
                    bathrooms: 0,
                    price: 25000000,
                    priceType: 'شراء',
                    isFeatured: true,
                    status: 'مباع',
                    mainImage: '/global/assets/images/project-placeholder.jpg',
                    createdAt: '2023-12-15'
                },
                {
                    id: 6,
                    projectName: 'شقق الريان السكنية',
                    projectType: 'سكني',
                    city: 'الرياض',
                    district: 'الملقا',
                    area: 180,
                    bedrooms: 3,
                    bathrooms: 2,
                    price: 2500,
                    priceType: 'تأجير',
                    isFeatured: false,
                    status: 'نشط',
                    mainImage: '/global/assets/images/project-placeholder.jpg',
                    createdAt: '2023-12-10'
                }
            ];

            const citiesFromProjects = [...new Set(this.allProjects.map(p => p.city).filter(Boolean))];
            if (citiesFromProjects.length > 0) {
                this.citiesList = citiesFromProjects;
                this.setupCityFilter();
            }

            this.applyFilters();
        }

        getPriceType(type) {
            if (type === 'تأجير' || type === 'إيجار' || type === 'إيجار_تشغيلي' || type === 'rent') {
                return 'إيجار';
            }
            return 'شراء';
        }

        destroy() {
            this.observers.forEach(observer => observer.disconnect());
            this.observers = [];
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
            window.projectsPage = new ProjectsPage();
        } catch (error) {
            console.error('ProjectsPage initialization failed:', error);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();