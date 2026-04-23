// ===== الصفحة الرئيسية - الإصدار المُحسَّن لأعلى أداء =====
(function() {
    'use strict';
    
    console.log('✅ home.js loaded - Optimized for performance');
    
    class HomePage {
        constructor() {
            this.apiClient = window.API || null;
            this.featuredProjects = [];
            this.stats = null;
            this.isMenuOpen = false;
            
            this.init();
        }
        
        init() {
            console.log('🚀 HomePage initializing...');
            
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setupPage());
            } else {
                this.setupPage();
            }
        }
        
        setupPage() {
            console.log('🔧 Setting up page...');
            this.setupMobileMenu();
            this.addAdminButtonToMobileMenu();
            
            // تهيئة AOS (سيتم تشغيلها بواسطة AOS نفسها)
            if (typeof AOS !== 'undefined') {
                AOS.init({
                    duration: 500,
                    easing: 'ease-out',
                    once: true,
                    mirror: false,
                    offset: 120,
                    disable: function () {
                        return window.innerWidth < 768;
                    }
                });
            }
            
            // تحميل البيانات بعد فترة بسيطة لضمان تجاوز مرحلة التحميل الأولية
            setTimeout(() => {
                this.loadStatistics();
                this.loadFeaturedProjects();
            }, 1200);
        }
        
        setupMobileMenu() {
            const toggle = document.getElementById('mobile-toggle');
            const navMenu = document.querySelector('.nav-menu');
            
            if (toggle && navMenu) {
                const openMenu = () => {
                    navMenu.classList.add('active');
                    toggle.classList.add('active');
                    this.isMenuOpen = true;
                    
                    setTimeout(() => {
                        document.addEventListener('click', closeMenuOnClickOutside);
                    }, 10);
                };
                
                const closeMenu = () => {
                    navMenu.classList.remove('active');
                    toggle.classList.remove('active');
                    this.isMenuOpen = false;
                    
                    document.removeEventListener('click', closeMenuOnClickOutside);
                };
                
                const closeMenuOnClickOutside = (e) => {
                    if (!navMenu.contains(e.target) && !toggle.contains(e.target)) {
                        closeMenu();
                    }
                };
                
                toggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    
                    if (this.isMenuOpen) {
                        closeMenu();
                    } else {
                        openMenu();
                    }
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
        }
        
        addAdminButtonToMobileMenu() {
            const navMenu = document.querySelector('.nav-menu');
            if (!navMenu) return;
            
            if (navMenu.querySelector('.mobile-admin-btn')) return;
            
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
            
            navMenu.appendChild(adminButton);
            // الأنماط موجودة في home.css، لا حاجة لحقنها مرة أخرى
        }
        
        async loadStatistics() {
            try {
                console.log('📊 Loading statistics...');
                
                const response = await fetch('/api/public/home/stats');
                if (!response.ok) throw new Error('Failed to load stats');
                
                const data = await response.json();
                
                if (data.success) {
                    this.displayStatistics(data.data);
                } else {
                    this.showDefaultStats();
                }
            } catch (error) {
                console.error('❌ Error loading stats:', error);
                this.showDefaultStats();
            }
        }
        
        displayStatistics(stats) {
            console.log('📊 Displaying stats:', stats);
            
            const elements = {
                'stat-projects': stats.totalProjects || 0,
                'stat-units': stats.totalUnits || 0,
                'stat-clients': stats.totalClients || 0,
                'stat-cities': stats.totalCities || 0
            };
            
            for (const [id, value] of Object.entries(elements)) {
                const element = document.getElementById(id);
                if (element) {
                    const counterElement = element.querySelector('.counter');
                    if (counterElement) {
                        this.animateCounter(counterElement, 0, value);
                    }
                }
            }
        }
        
        animateCounter(element, start, end) {
            if (!element) return;
            
            const duration = 2000;
            const startTime = performance.now();
            
            const step = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const currentValue = Math.floor(start + (end - start) * progress);
                
                element.textContent = currentValue.toLocaleString('ar-SA');
                
                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    element.textContent = end.toLocaleString('ar-SA');
                }
            };
            
            requestAnimationFrame(step);
        }
        
        showDefaultStats() {
            const defaults = [5, 66, 2, 1];
            const ids = ['stat-projects', 'stat-units', 'stat-clients', 'stat-cities'];
            
            ids.forEach((id, index) => {
                const element = document.getElementById(id);
                if (element) {
                    const counter = element.querySelector('.counter');
                    if (counter) {
                        this.animateCounter(counter, 0, defaults[index]);
                    }
                }
            });
        }
        
        async loadFeaturedProjects() {
            const container = document.getElementById('featured-projects-grid');
            if (!container) return;
            
            try {
                console.log('🏢 Loading featured projects...');
                
                container.innerHTML = `
                    <div class="loading-projects" data-aos="fade-up">
                        <div class="loading-spinner"></div>
                        <p>جاري تحميل العقارات المميزة...</p>
                    </div>
                `;
                
                const response = await fetch('/api/public/home/featured-projects');
                if (!response.ok) throw new Error('Failed to load projects');
                
                const data = await response.json();
                console.log('✅ Projects loaded:', data.data?.projects?.length || 0);
                
                if (data.success && data.data?.projects?.length > 0) {
                    this.displayProjects(data.data.projects);
                } else {
                    throw new Error('No projects found');
                }
                
            } catch (error) {
                console.error('❌ Error loading projects:', error);
                this.showFallbackProjects();
            }
        }
        
        displayProjects(projects) {
            const container = document.getElementById('featured-projects-grid');
            if (!container) return;
            
            console.log(`🎨 Displaying ${projects.length} projects`);
            
            let html = '';
            
            projects.forEach((project, index) => {
                const id = project.id || 0;
                const name = project.projectName || 'عقار مميز';
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
                
                const formattedPrice = this.formatPrice(price);
                const priceText = priceType === 'إيجار' ? 'ريال/شهري' : 'ريال';
                const location = district ? `${city}، ${district}` : city;
                
                const aosDelay = 100 + (index * 100);
                
                html += `
                    <div class="project-card-grid" data-project-id="${id}" data-aos="fade-up" data-aos-delay="${aosDelay}">
                        <div class="project-image-grid">
                            <img src="${image}" alt="${name}" class="project-image">
                            <div class="project-overlay-grid">
                                <span class="project-badge-grid ${isFeatured ? 'featured' : 'available'}">
                                    <i class="fas fa-star"></i>
                                    <span>${isFeatured ? 'مميز' : 'متاح'}</span>
                                </span>
                                <span class="project-status-grid">${status}</span>
                            </div>
                        </div>
                        
                        <div class="project-content-grid">
                            <div class="project-header-grid">
                                <h3 class="project-title-grid">${name}</h3>
                                <span class="project-type-grid">${type}</span>
                            </div>
                            
                            <div class="project-location-grid">
                                <i class="fas fa-map-marker-alt location-icon"></i>
                                <span class="location-text">${location}</span>
                            </div>
                            
                            <div class="project-details-grid">
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
                            
                            <div class="project-footer-grid">
                                <div class="project-price-grid">
                                    <span class="price-value">${formattedPrice}</span>
                                    <span class="price-period">${priceText}</span>
                                </div>
                                <div class="project-action-grid">
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
            
            container.innerHTML = html;
            
            // إعادة تهيئة AOS للعناصر الجديدة
            if (typeof AOS !== 'undefined') {
                setTimeout(() => {
                    AOS.refresh();
                }, 100);
            }
            
            // لا حاجة لاستدعاء animateProjects، الأنيميشن يتم عبر AOS
        }
        
        showFallbackProjects() {
            const container = document.getElementById('featured-projects-grid');
            if (!container) return;
            
            const fallbackProjects = [
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
                    status: 'جاهز',
                    mainImage: '/global/assets/images/project-placeholder.jpg'
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
                    priceType: 'إيجار',
                    isFeatured: true,
                    status: 'مكتمل',
                    mainImage: '/global/assets/images/project-placeholder.jpg'
                },
                {
                    id: 3,
                    projectName: 'شقق الريان السكنية',
                    projectType: 'سكني',
                    city: 'جدة',
                    district: 'الريان',
                    area: 180,
                    bedrooms: 3,
                    bathrooms: 2,
                    price: 4500,
                    priceType: 'إيجار',
                    isFeatured: true,
                    status: 'نشط',
                    mainImage: '/global/assets/images/project-placeholder.jpg'
                }
            ];
            
            this.displayProjects(fallbackProjects);
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
                'قيد_الإنشاء': 'قيد الإنشاء'
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
    function initialize() {
        try {
            window.homePage = new HomePage();
            console.log('✅ HomePage initialized successfully');
            
            setTimeout(() => {
                fetch('/api/public/home/featured-projects')
                    .then(r => r.json())
                    .then(data => console.log('API Test:', data.success ? '✅ Connected' : '❌ Failed'))
                    .catch(() => console.log('❌ API Connection failed'));
            }, 1000);
            
        } catch (error) {
            console.error('❌ Failed to initialize HomePage:', error);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();