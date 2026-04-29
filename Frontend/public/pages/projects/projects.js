/**
 * Projects Page - Premium Real Estate Listing
 * Optimized JavaScript with Performance Focus
 * 
 * Features:
 * - Efficient DOM manipulation
 * - Debounced filters
 * - RequestAnimationFrame for smooth animations
 * - AOS integration
 * - Mobile menu with outside click handling
 */

(function() {
    'use strict';
    
    class ProjectsPage {
        constructor() {
            // Core data
            this.apiClient = window.API || null;
            this.baseURL = ''; // رابط الخادم الخلفي
            this.allProjects = [];
            this.filteredProjects = [];
            
            // Pagination
            this.currentPage = 1;
            this.projectsPerPage = 9;
            this.totalPages = 1;
            
            // View & Sort
            this.currentView = 'grid';
            this.sortBy = 'newest';
            
            // Filters
            this.filters = {
                type: 'all',
                city: 'all',
                transaction: 'all',
                minPrice: null,
                maxPrice: null,
                search: ''
            };
            
            // UI State
            this.isMenuOpen = false;
            this.citiesList = ['الرياض'];
            
            // Debounce timers
            this.searchDebounceTimer = null;
            
            this.init();
        }
        
        /**
         * تحويل مسار الصورة إلى رابط كامل مع الخادم
         */
        getFullImageUrl(imageUrl) {
            if (!imageUrl) return '/global/assets/images/project-placeholder.jpg';
            if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                return imageUrl; // بالفعل رابط كامل
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
        
        async setupPage() {
            // Initialize AOS
            this.initAOS();
            
            // Setup UI components
            this.setupNavbar();
            this.setupMobileMenu();
            
            // Load cities first
            await this.loadCities();
            
            // Setup interactive elements
            this.setupFilters();
            this.setupPagination();
            this.setupViewToggle();
            this.setupSorting();
            
            // Load projects with slight delay for smoother UX
            requestAnimationFrame(() => {
                setTimeout(() => this.loadProjects(), 300);
            });
        }
        
        /**
         * Initialize AOS Animation Library
         */
        initAOS() {
            if (typeof AOS !== 'undefined') {
                AOS.init({
                    duration: 400,
                    easing: 'ease-out',
                    once: true,
                    mirror: false,
                    offset: 50,
                    disable: window.innerWidth < 768
                });
            }
        }
        
        /**
         * Setup Navbar Scroll Effect
         */
        setupNavbar() {
            const navbar = document.querySelector('.navbar');
            if (!navbar) return;
            
            let lastScroll = 0;
            let ticking = false;
            
            const updateNavbar = () => {
                const scrollY = window.scrollY;
                
                if (scrollY > 50) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
                
                lastScroll = scrollY;
                ticking = false;
            };
            
            window.addEventListener('scroll', () => {
                if (!ticking) {
                    requestAnimationFrame(updateNavbar);
                    ticking = true;
                }
            }, { passive: true });
        }
        
        /**
         * Setup Mobile Menu
         */
        setupMobileMenu() {
            const toggle = document.getElementById('mobile-toggle');
            const navMenu = document.querySelector('.nav-menu');
            
            if (!toggle || !navMenu) return;
            
            const openMenu = () => {
                navMenu.classList.add('active');
                toggle.classList.add('active');
                this.isMenuOpen = true;
                document.body.style.overflow = 'hidden';
                
                setTimeout(() => {
                    document.addEventListener('click', closeMenuOnClickOutside);
                }, 10);
            };
            
            const closeMenu = () => {
                navMenu.classList.remove('active');
                toggle.classList.remove('active');
                this.isMenuOpen = false;
                document.body.style.overflow = '';
                document.removeEventListener('click', closeMenuOnClickOutside);
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
        
        
        /**
         * Add Mobile Admin Button Styles
         */
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
                    }
                    .mobile-admin-btn .nav-link {
                        background: rgba(203, 205, 205, 0.05);
                        border: 1px solid rgba(203, 205, 205, 0.1);
                    }
                }
                @media (min-width: 769px) {
                    .mobile-admin-btn { display: none !important; }
                }
            `;
            document.head.appendChild(style);
        }
        
        /**
         * Setup City Filter Dropdown
         */
        setupCityFilter() {
            const cityFilter = document.getElementById('city-filter');
            if (!cityFilter) return;
            
            cityFilter.innerHTML = '<option value="all">كل المدن</option>';
            
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
        
        /**
         * Setup All Filters
         */
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
                
                // Debounced search on input
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
        
        /**
         * Setup Pagination
         */
        setupPagination() {
            const prevBtn = document.getElementById('prev-page');
            const nextBtn = document.getElementById('next-page');
            
            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    if (this.currentPage > 1) {
                        this.currentPage--;
                        this.displayProjects();
                        this.scrollToProjects();
                    }
                });
            }
            
            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    if (this.currentPage < this.totalPages) {
                        this.currentPage++;
                        this.displayProjects();
                        this.scrollToProjects();
                    }
                });
            }
        }
        
        /**
         * Scroll to Projects Section
         */
        scrollToProjects() {
            const projectsSection = document.querySelector('.projects-section');
            if (projectsSection) {
                const offset = 100;
                const top = projectsSection.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        }
        
        /**
         * Setup View Toggle
         */
        setupViewToggle() {
            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.currentView = btn.dataset.view;
                    this.toggleView();
                });
            });
        }
        
        /**
         * Setup Sorting
         */
        setupSorting() {
            const sortSelect = document.getElementById('sort-select');
            if (sortSelect) {
                sortSelect.addEventListener('change', (e) => {
                    this.sortBy = e.target.value;
                    this.sortProjects();
                    this.displayProjects();
                });
            }
        }
        
        /**
         * Toggle View Mode
         */
        toggleView() {
            const gridView = document.getElementById('projects-grid');
            const listView = document.getElementById('projects-list');
            
            if (this.currentView === 'grid') {
                if (gridView) gridView.style.display = 'grid';
                if (listView) listView.style.display = 'none';
            } else {
                if (gridView) gridView.style.display = 'none';
                if (listView) listView.style.display = 'flex';
            }
            
            // Refresh AOS
            if (typeof AOS !== 'undefined') {
                requestAnimationFrame(() => AOS.refresh());
            }
        }
        
        /**
         * Load Cities from API
         */
        async loadCities() {
            try {
                const response = await fetch('/api/public/projects/cities/list');
                if (!response.ok) throw new Error('Failed to load cities');
                
                const data = await response.json();
                
                if (data.success && data.data?.cities?.length > 0) {
                    this.citiesList = data.data.cities;
                }
            } catch (error) {
                console.warn('Cities API unavailable, using default');
                this.citiesList = ['الرياض'];
            }
        }
        
        /**
         * Load Projects from API
         */
        async loadProjects() {
            try {
                this.showLoadingState();
                
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
                console.warn('Using fallback projects');
                this.showFallbackProjects();
            }
        }
        
        /**
         * Show Loading State
         */
        showLoadingState() {
            const loadingState = document.getElementById('loading-state');
            const emptyState = document.getElementById('empty-state');
            const gridContainer = document.getElementById('projects-grid');
            const listContainer = document.getElementById('projects-list');
            const paginationSection = document.getElementById('pagination-section');
            
            if (loadingState) loadingState.style.display = 'flex';
            if (emptyState) emptyState.style.display = 'none';
            if (gridContainer) gridContainer.innerHTML = '';
            if (listContainer) listContainer.innerHTML = '';
            if (paginationSection) paginationSection.style.display = 'none';
        }
        
        /**
         * Apply Filters
         */
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
            
            // Reset to first page
            this.currentPage = 1;
            
            // Update count
            this.updateProjectsCount();
            
            // Sort projects
            this.sortProjects();
            
            // Display projects
            this.displayProjects();
        }
        
        /**
         * Reset Filters
         */
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
            
            if (minPriceInput) minPriceInput.value = '';
            if (maxPriceInput) maxPriceInput.value = '';
            if (searchInput) searchInput.value = '';
            
            this.applyFilters();
        }
        
        /**
         * Sort Projects
         */
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
        
        /**
         * Display Projects
         */
        displayProjects() {
            const loadingState = document.getElementById('loading-state');
            const emptyState = document.getElementById('empty-state');
            const descriptionEl = document.getElementById('projects-description');
            
            // Hide loading
            if (loadingState) loadingState.style.display = 'none';
            
            // Calculate pagination
            const startIndex = (this.currentPage - 1) * this.projectsPerPage;
            const endIndex = startIndex + this.projectsPerPage;
            const paginatedProjects = this.filteredProjects.slice(startIndex, endIndex);
            this.totalPages = Math.ceil(this.filteredProjects.length / this.projectsPerPage);
            
            // Check for empty results
            if (this.filteredProjects.length === 0) {
                if (emptyState) emptyState.style.display = 'flex';
                const paginationSection = document.getElementById('pagination-section');
                if (paginationSection) paginationSection.style.display = 'none';
                
                const gridContainer = document.getElementById('projects-grid');
                const listContainer = document.getElementById('projects-list');
                if (gridContainer) gridContainer.innerHTML = '';
                if (listContainer) listContainer.innerHTML = '';
                
                if (descriptionEl) {
                    descriptionEl.textContent = 'لم نعثر على عقارات تطابق معايير البحث الخاصة بك.';
                }
                return;
            }
            
            // Hide empty state
            if (emptyState) emptyState.style.display = 'none';
            
            // Update description
            if (descriptionEl) {
                descriptionEl.textContent = `عرض ${this.filteredProjects.length} عقار متاح`;
            }
            
            // Render projects
            this.renderProjects(paginatedProjects);
            
            // Update pagination
            this.updatePagination();
        }
        
        /**
         * Render Projects to DOM
         */
        renderProjects(projects) {
            const gridContainer = document.getElementById('projects-grid');
            const listContainer = document.getElementById('projects-list');
            
            if (!gridContainer || !listContainer) return;
            
            let gridHtml = '';
            let listHtml = '';
            
            projects.forEach((project, index) => {
                const cardData = this.prepareCardData(project, index);
                gridHtml += this.renderGridCard(cardData);
                listHtml += this.renderListCard(cardData);
            });
            
            gridContainer.innerHTML = gridHtml;
            listContainer.innerHTML = listHtml;
            
            // Refresh AOS
            if (typeof AOS !== 'undefined') {
                requestAnimationFrame(() => AOS.refresh());
            }
        }
        
        /**
         * Prepare Card Data - مع استخدام getFullImageUrl للصورة
         */
        prepareCardData(project, index) {
            const id = project.id || 0;
            const name = project.projectName || 'عقار';
            const type = this.getPropertyType(project.projectType);
            const city = project.city || 'الرياض';
            const district = project.district || '';
            const area = project.area || 0;
            const bedrooms = project.bedrooms || 0;
            const bathrooms = project.bathrooms || 0;
            const price = project.price || 0;
            const priceType = this.getPriceType(project.priceType);
            // ✅ استخدام getFullImageUrl للحصول على المسار الكامل للصورة
            const image = this.getFullImageUrl(project.mainImage);
            const isFeatured = Boolean(project.isFeatured);
            const status = this.getStatus(project.status);
            const isAvailable = status !== 'مباع';
            const formattedPrice = this.formatPrice(price);
            const priceText = priceType === 'إيجار' ? 'ريال/شهري' : 'ريال';
            const location = district ? `${city}، ${district}` : city;
            const aosDelay = 50 + (index * 30);
            
            return {
                id, name, type, city, district, area, bedrooms, bathrooms,
                price, priceType, image, isFeatured, status, isAvailable,
                formattedPrice, priceText, location, aosDelay
            };
        }
        
        /**
         * Render Grid Card HTML
         */
        renderGridCard(data) {
            return `
                <div class="project-card" data-project-id="${data.id}" data-aos="fade-up" data-aos-delay="${data.aosDelay}">
                    <div class="project-image">
                        <img src="${data.image}" alt="${data.name}" loading="lazy">
                        <div class="project-overlay">
                            <div class="project-badges">
                                ${data.isFeatured ? `
                                    <span class="project-badge featured">
                                        <i class="fas fa-star"></i>
                                        <span>مميز</span>
                                    </span>
                                ` : ''}
                                <span class="project-badge ${data.isAvailable ? 'available' : 'sold'}">
                                    <i class="fas ${data.isAvailable ? 'fa-check' : 'fa-times'}"></i>
                                    <span>${data.isAvailable ? 'متاح' : 'مباع'}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="project-content">
                        <div class="project-header">
                            <h3 class="project-title">${data.name}</h3>
                            <span class="project-type">${data.type}</span>
                        </div>
                        
                        <div class="project-location">
                            <i class="fas fa-map-marker-alt location-icon"></i>
                            <span class="location-text">${data.location}</span>
                        </div>
                        
                        <div class="project-details">
                            <div class="detail-item">
                                <i class="fas fa-expand-arrows-alt detail-icon"></i>
                                <span>${data.area} م²</span>
                            </div>
                            ${data.bedrooms > 0 ? `
                                <div class="detail-item">
                                    <i class="fas fa-bed detail-icon"></i>
                                    <span>${data.bedrooms} غرف</span>
                                </div>
                            ` : ''}
                            ${data.bathrooms > 0 ? `
                                <div class="detail-item">
                                    <i class="fas fa-bath detail-icon"></i>
                                    <span>${data.bathrooms} حمام</span>
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="project-footer">
                            <div class="project-price">
                                <span class="price-value">${data.formattedPrice}</span>
                                <span class="price-period">${data.priceText}</span>
                            </div>
                            <div class="project-actions">
                                <a href="../project-details/index.html?id=${data.id}" class="btn btn-primary btn-sm">
                                    <i class="fas fa-eye"></i>
                                    <span>تفاصيل</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        /**
         * Render List Card HTML
         */
        renderListCard(data) {
            return `
                <div class="project-list-item" data-project-id="${data.id}" data-aos="fade-up" data-aos-delay="${data.aosDelay}">
                    <div class="list-image">
                        <img src="${data.image}" alt="${data.name}" loading="lazy">
                        <div class="list-overlay"></div>
                    </div>
                    <div class="list-content">
                        <div class="list-header">
                            <h3 class="list-title">${data.name}</h3>
                            <span class="project-type">${data.type}</span>
                        </div>
                        
                        <div class="list-location">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${data.location}</span>
                        </div>
                        
                        <div class="list-details">
                            <div class="detail-item">
                                <i class="fas fa-expand-arrows-alt"></i>
                                <span>${data.area} م²</span>
                            </div>
                            ${data.bedrooms > 0 ? `
                                <div class="detail-item">
                                    <i class="fas fa-bed"></i>
                                    <span>${data.bedrooms} غرف</span>
                                </div>
                            ` : ''}
                            ${data.bathrooms > 0 ? `
                                <div class="detail-item">
                                    <i class="fas fa-bath"></i>
                                    <span>${data.bathrooms} حمام</span>
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="list-footer">
                            <div class="list-price">
                                <span class="price-value">${data.formattedPrice}</span>
                                <span class="price-period">${data.priceText}</span>
                            </div>
                            <div class="project-actions">
                                <a href="../project-details/index.html?id=${data.id}" class="btn btn-primary btn-sm">
                                    <i class="fas fa-eye"></i>
                                    <span>تفاصيل</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        /**
         * Update Projects Count
         */
        updateProjectsCount() {
            const countElement = document.getElementById('projects-count');
            if (countElement) {
                countElement.textContent = this.filteredProjects.length.toLocaleString('ar-SA');
            }
        }
        
        /**
         * Update Pagination UI
         */
        updatePagination() {
            const paginationSection = document.getElementById('pagination-section');
            
            if (this.filteredProjects.length > this.projectsPerPage) {
                if (paginationSection) paginationSection.style.display = 'block';
            } else {
                if (paginationSection) paginationSection.style.display = 'none';
                return;
            }
            
            // Update buttons
            const prevBtn = document.getElementById('prev-page');
            const nextBtn = document.getElementById('next-page');
            
            if (prevBtn) prevBtn.disabled = this.currentPage === 1;
            if (nextBtn) nextBtn.disabled = this.currentPage === this.totalPages;
            
            // Update page numbers
            const pageNumbersContainer = document.getElementById('page-numbers');
            if (pageNumbersContainer) {
                let pageNumbersHtml = '';
                
                const startPage = Math.max(1, this.currentPage - 2);
                const endPage = Math.min(this.totalPages, startPage + 4);
                
                for (let i = startPage; i <= endPage; i++) {
                    pageNumbersHtml += `
                        <button class="page-number ${i === this.currentPage ? 'active' : ''}" data-page="${i}">
                            ${i}
                        </button>
                    `;
                }
                
                pageNumbersContainer.innerHTML = pageNumbersHtml;
                
                // Add event listeners
                pageNumbersContainer.querySelectorAll('.page-number').forEach(btn => {
                    btn.addEventListener('click', () => {
                        this.currentPage = parseInt(btn.dataset.page);
                        this.displayProjects();
                        this.scrollToProjects();
                    });
                });
            }
            
            // Update pagination info
            const startIndex = (this.currentPage - 1) * this.projectsPerPage + 1;
            const endIndex = Math.min(startIndex + this.projectsPerPage - 1, this.filteredProjects.length);
            
            const currentRangeEl = document.getElementById('current-range');
            const totalProjectsEl = document.getElementById('total-projects');
            
            if (currentRangeEl) {
                currentRangeEl.textContent = `${startIndex.toLocaleString('ar-SA')}-${endIndex.toLocaleString('ar-SA')}`;
            }
            if (totalProjectsEl) {
                totalProjectsEl.textContent = this.filteredProjects.length.toLocaleString('ar-SA');
            }
        }
        
        /**
         * Show Fallback Projects - مع استخدام getFullImageUrl أيضاً
         */
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
            
            // Update cities from fallback data
            const citiesFromProjects = [...new Set(this.allProjects.map(p => p.city).filter(Boolean))];
            if (citiesFromProjects.length > 0) {
                this.citiesList = citiesFromProjects;
                this.setupCityFilter();
            }
            
            this.applyFilters();
        }
        
        /**
         * Helper: Get Property Type Label
         */
        getPropertyType(type) {
            const types = {
                'سكني': 'سكني',
                'تجاري': 'تجاري',
                'صناعي': 'صناعي',
                'فندقي': 'فندقي',
                'فندق': 'فندق',
                'residential': 'سكني',
                'commercial': 'تجاري'
            };
            return types[type] || type || 'عقار';
        }
        
        /**
         * Helper: Get Price Type
         */
        getPriceType(type) {
            if (type === 'تأجير' || type === 'إيجار' || type === 'إيجار_تشغيلي' || type === 'rent') {
                return 'إيجار';
            }
            return 'شراء';
        }
        
        /**
         * Helper: Get Status Label
         */
        getStatus(status) {
            const statuses = {
                'نشط': 'نشط',
                'جاهز': 'جاهز',
                'مكتمل': 'مكتمل',
                'مباع': 'مباع',
                'قيد_الإنشاء': 'قيد الإنشاء',
                'جاهز_للتسليم': 'جاهز'
            };
            return statuses[status] || status || 'نشط';
        }
        
        /**
         * Helper: Format Price
         */
        formatPrice(price) {
            if (!price) return '---';
            
            const num = parseFloat(price);
            if (isNaN(num)) return '---';
            
            if (num >= 1000000) {
                return (num / 1000000).toFixed(1).replace('.0', '') + ' مليون';
            }
            if (num >= 1000) {
                return (num / 1000).toFixed(0) + ' ألف';
            }
            
            return num.toLocaleString('ar-SA');
        }
    }
    
    // Initialize
    function initialize() {
        try {
            window.projectsPage = new ProjectsPage();
        } catch (error) {
            console.error('Failed to initialize ProjectsPage:', error);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();