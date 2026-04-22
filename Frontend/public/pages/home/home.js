// ===== الصفحة الرئيسية - الإصدار المحسن مع AOS Animation =====
(function() {
    'use strict';
    
    console.log('✅ home.js loaded - Premium Visual Edition with AOS');
    
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
            
            // تهيئة AOS للأنيميشن عند التمرير
            this.initAOS();
            
            // تحميل البيانات مباشرة
            this.loadStatistics();
            this.loadFeaturedProjects();
            
            // إعداد القائمة المتنقلة وإضافة زر الإدارة
            this.setupMobileMenu();
            this.addAdminButtonToMobileMenu();
        }
        
        initAOS() {
            if (typeof AOS !== 'undefined') {
                AOS.init({
                    duration: 800,       // مدة الأنيميشن
                    easing: 'ease-in-out-cubic',
                    once: false,           // الأنيميشن يحدث مرة واحدة فقط
                    mirror: true,        // عدم عكس الأنيميشن عند التمرير لأعلى
                    offset: 120,          // المسافة قبل بدء الأنيميشن
                    delay: 100,           // تأخير افتراضي
                    anchorPlacement: 'top-bottom'
                });
                console.log('✨ AOS initialized');
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
        }
        
        async loadStatistics() {
            try {
                console.log('📊 Loading statistics...');
                
                // استخدام fetch مباشرة
                const response = await fetch('http://localhost:3001/api/public/home/stats');
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
            
            // تحديث الأرقام في قسم الإحصائيات الرفيع
            const statProjects = document.getElementById('stat-projects');
            const statUnits = document.getElementById('stat-units');
            const statClients = document.getElementById('stat-clients');
            const statCities = document.getElementById('stat-cities');
            
            if (statProjects) {
                this.animateCounter(statProjects, 0, stats.totalProjects || 0);
            }
            if (statUnits) {
                this.animateCounter(statUnits, 0, stats.totalUnits || 0);
            }
            if (statClients) {
                this.animateCounter(statClients, 0, stats.totalClients || 0);
            }
            if (statCities) {
                this.animateCounter(statCities, 0, stats.totalCities || 0);
            }
        }
        
        animateCounter(element, start, end) {
            if (!element) return;
            
            const duration = 2000;
            const stepTime = 20;
            const steps = duration / stepTime;
            const increment = (end - start) / steps;
            let current = start;
            let step = 0;
            
            const timer = setInterval(() => {
                step++;
                current += increment;
                if (step >= steps) {
                    element.textContent = end.toLocaleString('ar-SA');
                    clearInterval(timer);
                } else {
                    element.textContent = Math.floor(current).toLocaleString('ar-SA');
                }
            }, stepTime);
        }
        
        showDefaultStats() {
            const defaults = [5, 66, 2, 1];
            const ids = ['stat-projects', 'stat-units', 'stat-clients', 'stat-cities'];
            
            ids.forEach((id, index) => {
                const element = document.getElementById(id);
                if (element) {
                    this.animateCounter(element, 0, defaults[index]);
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
                    <div class="loading-projects" data-aos="fade-up">
                        <div class="loading-spinner premium-spinner"></div>
                        <p>جاري تحميل العقارات المميزة...</p>
                    </div>
                `;
                
                // جلب البيانات
                const response = await fetch('http://localhost:3001/api/public/home/featured-projects');
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
                
                // إضافة data-aos للبطاقة مع تأخير متزايد
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
            
            // تعيين HTML
            container.innerHTML = html;
            
            // إعادة تهيئة AOS للعناصر الجديدة (لأنها أضيفت ديناميكياً)
            if (typeof AOS !== 'undefined') {
                setTimeout(() => {
                    AOS.refresh();
                }, 100);
            }
            
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
        
        animateProjects() {
            const projects = document.querySelectorAll('.project-card-grid');
            projects.forEach((project, index) => {
                project.style.opacity = '0';
                project.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    project.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
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
            
            // اختبار الاتصال بالخادم (اختياري)
            setTimeout(() => {
                fetch('http://localhost:3001/api/public/home/featured-projects')
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