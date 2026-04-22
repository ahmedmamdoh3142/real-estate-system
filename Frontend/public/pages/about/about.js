// ===== صفحة "من نحن" - منطق JS كامل مع AOS =====
(function() {
    'use strict';
    
    console.log('✅ about.js loaded - ABOUT PAGE WITH AOS ANIMATIONS');
    
    class AboutPage {
        constructor() {
            this.isMenuOpen = false;
            this.init();
        }
        
        init() {
            console.log('🚀 AboutPage initializing...');
            
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setupPage());
            } else {
                this.setupPage();
            }
        }
        
        setupPage() {
            console.log('🔧 Setting up about page...');
            
            // تهيئة AOS للأنيميشن عند التمرير (مع تكرار الأنيميشن)
            this.initAOS();
            
            // إعداد القائمة المتنقلة
            this.setupMobileMenu();
            
            // إضافة زر الإدارة للقائمة المتنقلة
            this.addAdminButtonToMobileMenu();
            
            // إعداد تأثيرات إضافية
            this.setupAdditionalEffects();
        }
        
        initAOS() {
            if (typeof AOS !== 'undefined') {
                AOS.init({
                    duration: 800,       // مدة الأنيميشن
                    easing: 'ease-in-out-cubic',
                    once: false,          // الأنيميشن يتكرر كلما ظهر العنصر
                    mirror: true,         // يعكس الأنيميشن عند التمرير لأعلى ولأسفل
                    offset: 100,          // المسافة قبل بدء الأنيميشن
                    delay: 100,           // تأخير افتراضي
                    anchorPlacement: 'top-bottom'
                });
                console.log('✨ AOS initialized with mirror: true, once: false');
                
                // إعادة تهيئة AOS بعد تحميل الصفحة بالكامل للتأكد من ظهور الأنيميشن المتسلسل
                window.addEventListener('load', () => {
                    setTimeout(() => {
                        AOS.refresh();
                    }, 200);
                });
            } else {
                console.warn('⚠️ AOS library not loaded');
            }
        }
        
        setupMobileMenu() {
            const toggle = document.getElementById('mobile-toggle');
            const navMenu = document.querySelector('.nav-menu');
            const body = document.body;
            
            if (toggle && navMenu) {
                // دالة لفتح القائمة
                const openMenu = () => {
                    navMenu.classList.add('active');
                    toggle.classList.add('active');
                    body.classList.add('menu-open');
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
                    body.classList.remove('menu-open');
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
                const navLinks = navMenu.querySelectorAll('a');
                navLinks.forEach(link => {
                    link.addEventListener('click', () => {
                        closeMenu();
                    });
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
        
        setupAdditionalEffects() {
            // تأثيرات إضافية عند تحميل الصفحة
            window.addEventListener('load', () => {
                // يمكن إضافة أي تأثيرات إضافية هنا
                console.log('📄 About page fully loaded');
            });
            
            // تحسين أداء اللمس للجوال
            const touchElements = document.querySelectorAll('button, a, .value-card, .mission-card, .goal');
            touchElements.forEach(el => {
                el.addEventListener('touchstart', function() {
                    this.classList.add('touch-active');
                }, { passive: true });
                
                el.addEventListener('touchend', function() {
                    this.classList.remove('touch-active');
                }, { passive: true });
            });
            
            // منع التكبير المزدوج على الروابط في الجوال
            const clickableElements = document.querySelectorAll('a, button');
            clickableElements.forEach(el => {
                el.addEventListener('touchstart', function(e) {
                    if (e.touches.length > 1) {
                        e.preventDefault();
                    }
                }, { passive: false });
            });
        }
    }
    
    // تهيئة الصفحة
    function initialize() {
        try {
            window.aboutPage = new AboutPage();
            console.log('✅ AboutPage initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize AboutPage:', error);
        }
    }
    
    // تشغيل عند تحميل الصفحة
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();