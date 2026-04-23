// ===== صفحة العقارات - منطق JS كامل مع AOS Animation =====
(function() {
    'use strict';
    
    console.log('✅ projects.js loaded - ULTIMATE VERSION WITH AOS ANIMATIONS');
    
    class ProjectsPage {
        constructor() {
            this.apiClient = window.API || null;
            this.allProjects = [];
            this.filteredProjects = [];
            this.currentPage = 1;
            this.projectsPerPage = 9;
            this.totalPages = 1;
            this.currentView = 'grid';
            this.filters = {
                type: 'all',
                city: 'all',
                transaction: 'all',
                minPrice: null,
                maxPrice: null,
                search: ''
            };
            this.sortBy = 'newest';
            this.isMenuOpen = false;
            
            // قائمة المدن الفعلية من API
            this.citiesList = ['الرياض']; // قيمة افتراضية
            
            this.init();
        }
        
        init() {
            console.log('🚀 ProjectsPage initializing...');
            
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setupPage());
            } else {
                this.setupPage();
            }
        }
        
        async setupPage() {
            console.log('🔧 Setting up projects page...');
            
            // تهيئة AOS للأنيميشن عند التمرير (مع تكرار الأنيميشن)
            this.initAOS();
            
            // إعداد القائمة المتنقلة وإضافة زر الإدارة
            this.setupMobileMenu();
            this.addAdminButtonToMobileMenu();
            
            // تحميل قائمة المدن أولاً
            await this.loadCities();
            
            // إعداد الفلاتر (بعد تحميل المدن)
            this.setupFilters();
            
            // إعداد الترحيف
            this.setupPagination();
            
            // إعداد عرض التبديل
            this.setupViewToggle();
            
            // إعداد الترتيب
            this.setupSorting();
            
            // تحميل العقارات
            
            setTimeout(() => {
                this.loadProjects();
            }, 800);
        }
        
        initAOS() {
            if (typeof AOS !== 'undefined') {
                AOS.init({
                    duration: 500,
                    easing: 'ease-out',
                    once: true,
                    mirror: false,
                    offset: 60,
                    disable: 'mobile'
                });
                console.log('✨ AOS initialized with mirror: true, once: false');
            } else {
                console.warn('⚠️ AOS library not loaded');
            }
        }
        
        setupMobileMenu() {
            const toggle = document.getElementById('mobile-toggle');
            const navMenu = document.querySelector('.nav-menu');
            
            if (toggle && navMenu) {
                // دالة لفتح القائمة
                const openMenu = () => {
                    navMenu.classList.add('active');
                    toggle.classList.add('active');
                    this.isMenuOpen = true;
                    
                    // إضافة حدث لإغلاق القائمة عند النقر خارجها
                    setTimeout(() => {
                        document.addEventListener('click', closeMenuOnClickOutside);
                    }, 10);
                };
                
                // دالة لإغلاق القائمة
                const closeMenu = () => {
                    navMenu.classList.remove('active');
                    toggle.classList.remove('active');
                    this.isMenuOpen = false;
                    
                    // إزالة حدث النقر خارج القائمة
                    document.removeEventListener('click', closeMenuOnClickOutside);
                };
                
                // دالة لإغلاق القائمة عند النقر خارجها
                const closeMenuOnClickOutside = (e) => {
                    // التحقق إذا كان النقر خارج القائمة وزر التبديل
                    if (!navMenu.contains(e.target) && !toggle.contains(e.target)) {
                        closeMenu();
                    }
                };
                
                // إضافة حدث النقر على زر التبديل
                toggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    
                    if (this.isMenuOpen) {
                        closeMenu();
                    } else {
                        openMenu();
                    }
                });
                
                // إغلاق القائمة عند النقر على رابط داخلي
                navMenu.addEventListener('click', (e) => {
                    if (e.target.closest('.nav-link')) {
                        closeMenu();
                    }
                });
                
                // إغلاق القائمة عند تغيير حجم النافذة (إذا فتحت على سطح المكتب)
                window.addEventListener('resize', () => {
                    if (window.innerWidth > 768 && this.isMenuOpen) {
                        closeMenu();
                    }
                });
            }
        }
        
        addAdminButtonToMobileMenu() {
            const navMenu = document.querySelector('.nav-menu');
            if (!navMenu) return;
            
            // التحقق إذا كان الزر موجود بالفعل (لتجنب التكرار)
            if (navMenu.querySelector('.mobile-admin-btn')) return;
            
            // إنشاء زر الإدارة للجوال
            const adminButton = document.createElement('li');
            adminButton.className = 'nav-item mobile-admin-btn';
            adminButton.innerHTML = `
                <a href="../../../admin/pages/login/index.html" class="nav-link premium-link">
                    <div class="nav-icon-wrapper">
                        <i class="fas fa-sign-in-alt"></i>
                    </div>
                    <span class="nav-text">دخول الإدارة</span>
                    <span class="nav-underline"></span>
                </a>
            `;
            
            // إضافة زر الإدارة إلى القائمة
            navMenu.appendChild(adminButton);
            
            // إضافة أنماط CSS للزر في الجوال
            this.addMobileAdminButtonStyles();
        }
        
        addMobileAdminButtonStyles() {
            // إضافة أنماط CSS للزر في الجوال فقط
            const style = document.createElement('style');
            style.textContent = `
                /* زر الإدارة في القائمة الجانبية للجوال */
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
                        color: var(--color-text-primary) !important;
                        font-weight: 600 !important;
                    }
                    
                    .mobile-admin-btn .premium-link:hover {
                        background: rgba(203, 205, 205, 0.08) !important;
                        border-color: rgba(203, 205, 205, 0.2) !important;
                    }
                    
                    .mobile-admin-btn .nav-icon-wrapper {
                        background: rgba(203, 205, 205, 0.08) !important;
                    }
                }
                
                /* إخفاء زر الإدارة في القائمة الجانبية على سطح المكتب */
                @media (min-width: 769px) {
                    .mobile-admin-btn {
                        display: none !important;
                    }
                }
            `;
            
            document.head.appendChild(style);
        }
        
        setupFilters() {
            // فلتر النوع
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
            
            // فلتر المدينة - بعد تحميل المدن
            this.setupCityFilter();
            
            // فلتر المعاملة
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
            
            // فلتر السعر
            document.getElementById('apply-price').addEventListener('click', () => {
                const minPrice = document.getElementById('min-price').value;
                const maxPrice = document.getElementById('max-price').value;
                
                this.filters.minPrice = minPrice ? parseFloat(minPrice) : null;
                this.filters.maxPrice = maxPrice ? parseFloat(maxPrice) : null;
                
                this.applyFilters();
            });
            
            // فلتر البحث
            const searchInput = document.getElementById('search-input');
            const searchButton = document.getElementById('search-button');
            
            searchButton.addEventListener('click', () => {
                this.filters.search = searchInput.value.trim();
                this.applyFilters();
            });
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.filters.search = searchInput.value.trim();
                    this.applyFilters();
                }
            });
            
            // زر إعادة تعيين الفلاتر
            document.getElementById('reset-filters').addEventListener('click', () => {
                this.resetFilters();
            });
            
            // زر إعادة تعيين جميع الفلاتر
            document.getElementById('clear-all-filters').addEventListener('click', () => {
                this.resetFilters();
            });
        }
        
        setupCityFilter() {
            const cityFilter = document.getElementById('city-filter');
            
            // مسح الخيارات القديمة
            cityFilter.innerHTML = '<option value="all">كل المدن</option>';
            
            // إضافة المدن الفعلية
            this.citiesList.forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                option.textContent = city;
                cityFilter.appendChild(option);
            });
            
            // إضافة مستمع الحدث
            cityFilter.addEventListener('change', (e) => {
                this.filters.city = e.target.value;
                this.applyFilters();
            });
        }
        
        setupPagination() {
            document.getElementById('prev-page').addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.displayProjects();
                }
            });
            
            document.getElementById('next-page').addEventListener('click', () => {
                if (this.currentPage < this.totalPages) {
                    this.currentPage++;
                    this.displayProjects();
                }
            });
        }
        
        setupViewToggle() {
            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.view-btn').forEach(b => {
                        b.classList.remove('active');
                    });
                    btn.classList.add('active');
                    this.currentView = btn.dataset.view;
                    this.toggleView();
                });
            });
        }
        
        setupSorting() {
            document.getElementById('sort-select').addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.sortProjects();
                this.displayProjects();
            });
        }
        
        toggleView() {
            const gridView = document.getElementById('projects-grid');
            const listView = document.getElementById('projects-list');
            
            if (this.currentView === 'grid') {
                gridView.style.display = 'grid';
                listView.style.display = 'none';
            } else {
                gridView.style.display = 'none';
                listView.style.display = 'flex';
            }
            
            // تحديث AOS للعناصر الجديدة بعد تبديل العرض
            setTimeout(() => {
                if (typeof AOS !== 'undefined') {
                    AOS.refresh();
                }
            }, 100);
        }
        
        async loadCities() {
            try {
                console.log('🏙️ جلب قائمة المدن من API...');
                
                const response = await fetch('/api/public/projects/cities/list');
                if (!response.ok) throw new Error('Failed to load cities');
                
                const data = await response.json();
                console.log('✅ Cities API response:', data);
                
                if (data.success && data.data?.cities?.length > 0) {
                    this.citiesList = data.data.cities;
                    console.log('✅ تم تحميل المدن:', this.citiesList);
                } else {
                    console.log('⚠️ لا توجد مدن في الاستجابة، استخدام القيمة الافتراضية');
                    this.citiesList = ['الرياض'];
                }
                
            } catch (error) {
                console.error('❌ Error loading cities from API:', error);
                this.citiesList = ['الرياض']; // قيمة افتراضية في حالة الخطأ
            }
        }
        
        async loadProjects() {
            try {
                console.log('🏢 Loading all projects...');
                
                // إظهار حالة التحميل
                this.showLoadingState();
                
                // استخدام fetch مباشرة
                const response = await fetch('/api/public/projects/all');
                if (!response.ok) throw new Error('Failed to load projects');
                
                const data = await response.json();
                console.log('✅ Projects loaded:', data.data?.projects?.length || 0);
                
                if (data.success && data.data?.projects?.length > 0) {
                    this.allProjects = data.data.projects;
                    this.applyFilters();
                } else {
                    throw new Error('No projects found');
                }
                
            } catch (error) {
                console.error('❌ Error loading projects:', error);
                this.showFallbackProjects();
            }
        }
        
        showLoadingState() {
            document.getElementById('loading-state').style.display = 'flex';
            document.getElementById('empty-state').style.display = 'none';
            document.getElementById('projects-grid').innerHTML = '';
            document.getElementById('projects-list').innerHTML = '';
            document.getElementById('pagination-section').style.display = 'none';
        }
        
        applyFilters() {
            console.log('🔍 Applying filters:', this.filters);
            
            this.filteredProjects = this.allProjects.filter(project => {
                // فلتر النوع
                if (this.filters.type !== 'all' && project.projectType !== this.filters.type) {
                    return false;
                }
                
                // فلتر المدينة
                if (this.filters.city !== 'all' && project.city !== this.filters.city) {
                    return false;
                }
                
                // فلتر المعاملة
                if (this.filters.transaction !== 'all') {
                    const priceType = this.getPriceType(project.priceType);
                    if (priceType !== this.filters.transaction) {
                        return false;
                    }
                }
                
                // فلتر السعر
                if (this.filters.minPrice !== null && project.price < this.filters.minPrice) {
                    return false;
                }
                if (this.filters.maxPrice !== null && project.price > this.filters.maxPrice) {
                    return false;
                }
                
                // فلتر البحث
                if (this.filters.search) {
                    const searchTerm = this.filters.search.toLowerCase();
                    const searchFields = [
                        project.projectName,
                        project.city,
                        project.district,
                        project.description,
                        project.projectType
                    ].join(' ').toLowerCase();
                    
                    if (!searchFields.includes(searchTerm)) {
                        return false;
                    }
                }
                
                return true;
            });
            
            console.log(`✅ Filtered projects: ${this.filteredProjects.length} out of ${this.allProjects.length}`);
            
            // تحديث عدد العقارات
            this.updateProjectsCount();
            
            // ترتيب العقارات
            this.sortProjects();
            
            // عرض العقارات
            this.displayProjects();
        }
        
        resetFilters() {
            // إعادة تعيين الفلاتر
            this.filters = {
                type: 'all',
                city: 'all',
                transaction: 'all',
                minPrice: null,
                maxPrice: null,
                search: ''
            };
            
            // إعادة تعيين واجهة المستخدم
            document.querySelectorAll('#type-filters .filter-option').forEach(opt => {
                opt.classList.remove('active');
            });
            document.querySelector('#type-filters .filter-option[data-type="all"]').classList.add('active');
            
            document.getElementById('city-filter').value = 'all';
            
            document.querySelectorAll('#transaction-filters .filter-option').forEach(opt => {
                opt.classList.remove('active');
            });
            document.querySelector('#transaction-filters .filter-option[data-transaction="all"]').classList.add('active');
            
            document.getElementById('min-price').value = '';
            document.getElementById('max-price').value = '';
            document.getElementById('search-input').value = '';
            
            // تطبيق الفلاتر
            this.applyFilters();
        }
        
        sortProjects() {
            console.log(`📊 Sorting projects by: ${this.sortBy}`);
            
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
        
        displayProjects() {
            // إخفاء حالة التحميل
            document.getElementById('loading-state').style.display = 'none';
            
            // حساب الترحيف
            const startIndex = (this.currentPage - 1) * this.projectsPerPage;
            const endIndex = startIndex + this.projectsPerPage;
            const paginatedProjects = this.filteredProjects.slice(startIndex, endIndex);
            this.totalPages = Math.ceil(this.filteredProjects.length / this.projectsPerPage);
            
            // التحقق من وجود نتائج
            if (this.filteredProjects.length === 0) {
                document.getElementById('empty-state').style.display = 'flex';
                document.getElementById('pagination-section').style.display = 'none';
                
                // مسح المحتوى الموجود في الشبكة والقائمة
                document.getElementById('projects-grid').innerHTML = '';
                document.getElementById('projects-list').innerHTML = '';
                
                // تحديث وصف الصفحة
                document.getElementById('projects-description').textContent = 
                    'لم نعثر على عقارات تطابق معايير البحث الخاصة بك. حاول تغيير عوامل التصفية.';
                
                return;
            }
            
            // إخفاء حالة عدم وجود نتائج
            document.getElementById('empty-state').style.display = 'none';
            
            // تحديث وصف الصفحة
            document.getElementById('projects-description').textContent = 
                `عرض ${this.filteredProjects.length} عقار متاح`;
            
            // عرض العقارات
            this.renderProjects(paginatedProjects);
            
            // عرض الترحيف
            this.updatePagination();
        }
        
        renderProjects(projects) {
            const gridContainer = document.getElementById('projects-grid');
            const listContainer = document.getElementById('projects-list');
            
            // مسح المحتوى القديم
            gridContainer.innerHTML = '';
            listContainer.innerHTML = '';
            
            let gridHtml = '';
            let listHtml = '';
            
            projects.forEach((project, index) => {
                // معالجة البيانات
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
                const image = project.mainImage || '/global/assets/images/project-placeholder.jpg';
                const isFeatured = Boolean(project.isFeatured);
                const status = this.getStatus(project.status);
                const isAvailable = status !== 'مباع';
                
                // تنسيق السعر
                const formattedPrice = this.formatPrice(price);
                const priceText = priceType === 'إيجار' ? 'ريال/شهري' : 'ريال';
                
                // الموقع
                const location = district ? `${city}، ${district}` : city;
                
                // تأخير AOS للبطاقات (يتزايد مع الفهرس)
                const aosDelay = 100 + (index * 50);
                
                // البطاقة الشبكية
                gridHtml += `
                    <div class="project-card" data-project-id="${id}" data-aos="fade-up" data-aos-delay="${aosDelay}">
                        <div class="project-image">
                            <img src="${image}" alt="${name}" class="project-image">
                            <div class="project-overlay">
                                <div class="project-badges">
                                    ${isFeatured ? `
                                        <span class="project-badge featured">
                                            <i class="fas fa-star"></i>
                                            <span>مميز</span>
                                        </span>
                                    ` : ''}
                                    <span class="project-badge ${isAvailable ? 'available' : 'sold'}">
                                        <i class="fas ${isAvailable ? 'fa-check' : 'fa-times'}"></i>
                                        <span>${isAvailable ? 'متاح' : 'مباع'}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="project-content">
                            <div class="project-header">
                                <h3 class="project-title">${name}</h3>
                                <span class="project-type">${type}</span>
                            </div>
                            
                            <div class="project-location">
                                <i class="fas fa-map-marker-alt location-icon"></i>
                                <span class="location-text">${location}</span>
                            </div>
                            
                            <div class="project-details">
                                <div class="detail-item">
                                    <i class="fas fa-expand-arrows-alt detail-icon"></i>
                                    <span>${area} م²</span>
                                </div>
                                ${bedrooms > 0 ? `
                                    <div class="detail-item">
                                        <i class="fas fa-bed detail-icon"></i>
                                        <span>${bedrooms} غرف</span>
                                    </div>
                                ` : ''}
                                ${bathrooms > 0 ? `
                                    <div class="detail-item">
                                        <i class="fas fa-bath detail-icon"></i>
                                        <span>${bathrooms} حمام</span>
                                    </div>
                                ` : ''}
                            </div>
                            
                            <div class="project-footer">
                                <div class="project-price">
                                    <span class="price-value">${formattedPrice}</span>
                                    <span class="price-period">${priceText}</span>
                                </div>
                                <div class="project-actions">
                                    <a href="../project-details/index.html?id=${id}" class="btn btn-primary btn-sm">
                                        <i class="fas fa-eye"></i>
                                        <span>تفاصيل</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                // البطاقة القائمة
                listHtml += `
                    <div class="project-list-item" data-project-id="${id}" data-aos="fade-up" data-aos-delay="${aosDelay}">
                        <div class="list-image">
                            <img src="${image}" alt="${name}">
                            <div class="list-overlay"></div>
                        </div>
                        <div class="list-content">
                            <div class="list-header">
                                <h3 class="list-title">${name}</h3>
                                <span class="project-type">${type}</span>
                            </div>
                            
                            <div class="list-location">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>${location}</span>
                            </div>
                            
                            <div class="list-details">
                                <div class="detail-item">
                                    <i class="fas fa-expand-arrows-alt"></i>
                                    <span>${area} م²</span>
                                </div>
                                ${bedrooms > 0 ? `
                                    <div class="detail-item">
                                        <i class="fas fa-bed"></i>
                                        <span>${bedrooms} غرف</span>
                                    </div>
                                ` : ''}
                                ${bathrooms > 0 ? `
                                    <div class="detail-item">
                                        <i class="fas fa-bath"></i>
                                        <span>${bathrooms} حمام</span>
                                    </div>
                                ` : ''}
                            </div>
                            
                            <div class="list-footer">
                                <div class="list-price">
                                    <span class="price-value">${formattedPrice}</span>
                                    <span class="price-period">${priceText}</span>
                                </div>
                                <div class="project-actions">
                                    <a href="../project-details/index.html?id=${id}" class="btn btn-primary btn-sm">
                                        <i class="fas fa-eye"></i>
                                        <span>تفاصيل</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            // تعيين HTML
            gridContainer.innerHTML = gridHtml;
            listContainer.innerHTML = listHtml;
            
            // إعادة تهيئة AOS للعناصر الجديدة (لأنها أضيفت ديناميكياً)
            if (typeof AOS !== 'undefined') {
                setTimeout(() => {
                    AOS.refresh();
                }, 100);
            }
            
            // لا نحتاج إلى animateProjects اليدوية لأن AOS يتولى ذلك
        }
        
        updateProjectsCount() {
            const countElement = document.getElementById('projects-count');
            if (countElement) {
                countElement.textContent = this.filteredProjects.length.toLocaleString('ar-SA');
            }
        }
        
        updatePagination() {
            // إظهار/إخفاء الترحيف
            const paginationSection = document.getElementById('pagination-section');
            if (this.filteredProjects.length > this.projectsPerPage) {
                paginationSection.style.display = 'block';
            } else {
                paginationSection.style.display = 'none';
                return;
            }
            
            // تحديث أزرار الترحيف
            document.getElementById('prev-page').disabled = this.currentPage === 1;
            document.getElementById('next-page').disabled = this.currentPage === this.totalPages;
            
            // تحديث أرقام الصفحات
            const pageNumbersContainer = document.getElementById('page-numbers');
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
            
            // إضافة مستمعي الأحداث لأرقام الصفحات
            pageNumbersContainer.querySelectorAll('.page-number').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.currentPage = parseInt(btn.dataset.page);
                    this.displayProjects();
                });
            });
            
            // تحديث معلومات الترحيف
            const startIndex = (this.currentPage - 1) * this.projectsPerPage + 1;
            const endIndex = Math.min(startIndex + this.projectsPerPage - 1, this.filteredProjects.length);
            
            document.getElementById('current-range').textContent = 
                `${startIndex.toLocaleString('ar-SA')}-${endIndex.toLocaleString('ar-SA')}`;
            document.getElementById('total-projects').textContent = 
                this.filteredProjects.length.toLocaleString('ar-SA');
            
            // تحديث AOS لعناصر الترقيم
            if (typeof AOS !== 'undefined') {
                setTimeout(() => AOS.refresh(), 50);
            }
        }
        
        showFallbackProjects() {
            // بيانات احتياطية
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
                    description: 'مجمع فيلات فاخرة بمواصفات عالمية',
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
                    description: 'أبراج مكتبية عصرية في قلب المنطقة التجارية',
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
                    description: 'شقق مفروشة فاخرة للإيجار اليومي والشهري',
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
                    description: 'مخازن مجهزة للشركات اللوجستية',
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
                    description: 'فندق 5 نجوم مع منتجع صحي',
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
                    description: 'شقق سكنية مميزة في حي الملقا',
                    createdAt: '2023-12-10'
                },
                {
                    id: 7,
                    projectName: 'محلات تجارية - حي العليا',
                    projectType: 'تجاري',
                    city: 'الرياض',
                    district: 'العليا',
                    area: 80,
                    bedrooms: 0,
                    bathrooms: 1,
                    price: 15000,
                    priceType: 'تأجير',
                    isFeatured: true,
                    status: 'نشط',
                    mainImage: '/global/assets/images/project-placeholder.jpg',
                    description: 'محلات تجارية في أفضل مواقع حي العليا',
                    createdAt: '2023-12-05'
                },
                {
                    id: 8,
                    projectName: 'مكتب إداري - برج المملكة',
                    projectType: 'تجاري',
                    city: 'الرياض',
                    district: 'المركز',
                    area: 150,
                    bedrooms: 0,
                    bathrooms: 1,
                    price: 20000,
                    priceType: 'تأجير',
                    isFeatured: false,
                    status: 'نشط',
                    mainImage: '/global/assets/images/project-placeholder.jpg',
                    description: 'مكتب إداري فاخر في برج المملكة',
                    createdAt: '2023-11-30'
                },
                {
                    id: 9,
                    projectName: 'فيلا عائلية - حي الياسمين',
                    projectType: 'سكني',
                    city: 'الرياض',
                    district: 'الياسمين',
                    area: 380,
                    bedrooms: 4,
                    bathrooms: 3,
                    price: 2800000,
                    priceType: 'شراء',
                    isFeatured: true,
                    status: 'جاهز_للتسليم',
                    mainImage: '/global/assets/images/project-placeholder.jpg',
                    description: 'فيلا عائلية فاخرة في حي الياسمين',
                    createdAt: '2023-11-25'
                }
            ];
            
            console.log('🔄 Using fallback projects:', this.allProjects.length);
            
            // تحديث قائمة المدن من البيانات الاحتياطية
            const citiesFromProjects = [...new Set(this.allProjects.map(p => p.city).filter(c => c))];
            if (citiesFromProjects.length > 0) {
                this.citiesList = citiesFromProjects;
                this.setupCityFilter();
            }
            
            this.applyFilters();
        }
        
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
        
        getPriceType(type) {
            if (type === 'تأجير' || type === 'إيجار' || type === 'إيجار_تشغيلي' || type === 'rent') {
                return 'إيجار';
            }
            return 'شراء';
        }
        
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
    
    // تهيئة الصفحة
    async function initialize() {
        try {
            window.projectsPage = new ProjectsPage();
            console.log('✅ ProjectsPage initialized successfully');
            
            // اختبار الاتصال بالخادم
            setTimeout(async () => {
                try {
                    const response = await fetch('/api/public/projects/all');
                    const data = await response.json();
                    console.log('API Test:', data.success ? '✅ Connected' : '❌ Failed');
                    
                    // اختبار API المدن
                    const citiesResponse = await fetch('/api/public/projects/cities/list');
                    const citiesData = await citiesResponse.json();
                    console.log('Cities API Test:', citiesData.success ? '✅ Connected' : '❌ Failed');
                    console.log('Cities from API:', citiesData.data?.cities);
                } catch (error) {
                    console.log('❌ API Connection failed:', error.message);
                }
            }, 1000);
            
        } catch (error) {
            console.error('❌ Failed to initialize ProjectsPage:', error);
        }
    }
    
    // تشغيل عند تحميل الصفحة
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();