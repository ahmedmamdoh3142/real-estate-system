// ===== الصفحة الرئيسية - الإصدار المصحح نهائياً =====
(function() {
    'use strict';
    
    console.log('✅ home.js loaded - ULTIMATE SIMPLE FIX');
    
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
            
            // تحميل البيانات مباشرة
            this.loadStatistics();
            this.loadFeaturedProjects();
            
            // إعداد القائمة المتنقلة وإضافة زر الإدارة
            this.setupMobileMenu();
            this.addAdminButtonToMobileMenu();
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
        
        async loadStatistics() {
            try {
                console.log('📊 Loading statistics...');
                
                // استخدام fetch مباشرة
                const response = await fetch('/api/public/home/stats');
                if (!response.ok) throw new Error('Failed to load stats');
                
                const data = await response.json();
                
                if (data.success) {
                    this.displayStatistics(data.data);
                }
            } catch (error) {
                console.error('❌ Error loading stats:', error);
                this.showDefaultStats();
            }
        }
        
        displayStatistics(stats) {
            console.log('📊 Displaying stats:', stats);
            
            // تحديث الأرقام مباشرة
            document.getElementById('total-projects').querySelector('.counter').textContent = 
                (stats.totalProjects || 0).toLocaleString('ar-SA');
            document.getElementById('total-units').querySelector('.counter').textContent = 
                (stats.totalUnits || 0).toLocaleString('ar-SA');
            document.getElementById('total-clients').querySelector('.counter').textContent = 
                (stats.totalClients || 0).toLocaleString('ar-SA');
            document.getElementById('total-cities').querySelector('.counter').textContent = 
                (stats.totalCities || 0).toLocaleString('ar-SA');
        }
        
        showDefaultStats() {
            const defaults = [5, 66, 2, 1];
            const ids = ['total-projects', 'total-units', 'total-clients', 'total-cities'];
            
            ids.forEach((id, index) => {
                const element = document.getElementById(id);
                if (element) {
                    const counter = element.querySelector('.counter');
                    if (counter) {
                        counter.textContent = defaults[index].toLocaleString('ar-SA');
                    }
                }
            });
        }
        
        async loadFeaturedProjects() {
            const container = document.getElementById('featured-projects-grid');
            if (!container) {
                console.error('❌ Grid container not found');
                return;
            }
            
            try {
                console.log('🏢 Loading featured projects...');
                
                // إظهار حالة التحميل
                container.innerHTML = `
                    <div class="loading-projects">
                        <div class="loading-spinner"></div>
                        <p>جاري تحميل العقارات المميزة...</p>
                    </div>
                `;
                
                // جلب البيانات
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
            
            projects.forEach(project => {
                // معالجة البيانات
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
                
                // تنسيق السعر
                const formattedPrice = this.formatPrice(price);
                const priceText = priceType === 'إيجار' ? 'ريال/شهري' : 'ريال';
                
                // الموقع
                const location = district ? `${city}، ${district}` : city;
                
                html += `
                    <div class="project-card-grid" data-project-id="${id}">
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
            
            // تعيين HTML
            container.innerHTML = html;
            
            // إضافة تأثيرات
            setTimeout(() => this.animateProjects(), 100);
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
                }
            ];
            
            this.displayProjects(fallbackProjects);
        }
        
        animateProjects() {
            const projects = document.querySelectorAll('.project-card-grid');
            projects.forEach((project, index) => {
                project.style.opacity = '0';
                project.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    project.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    project.style.opacity = '1';
                    project.style.transform = 'translateY(0)';
                }, index * 100);
            });
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
            
            // اختبار الاتصال بالخادم
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
    
    // تشغيل عند تحميل الصفحة
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();