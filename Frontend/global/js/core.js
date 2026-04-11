// ===== الملف الأساسي للنظام العقاري - النسخة المعدلة =====
(function() {
    'use strict';
    
    console.log('✅ core.js loaded successfully - NO FALLBACK VERSION');
    
    // تعريف الكائن الأساسي
    window.Core = {
        // دالة لتهيئة النظام
        init: function() {
            console.log('🚀 System Core Initialized');
            this.setupTheme();
            this.setupGlobalEvents();
            this.checkAPIConnection();
        },
        
        // التحقق من اتصال API - لا ينشئ Fallback API
        checkAPIConnection: function() {
            if (!window.API) {
                console.warn('⚠️ API Client not found - Will use real API only');
                return false;
            }
            
            console.log('🔍 Testing API connection...');
            
            // استخدام testConnection مباشرة من API
            if (window.API.testConnection) {
                window.API.testConnection()
                    .then(isConnected => {
                        if (isConnected) {
                            console.log('✅ Server is running and connected');
                        } else {
                            console.warn('⚠️ Server is not reachable');
                        }
                    })
                    .catch(error => {
                        console.error('❌ Connection check error:', error);
                    });
            }
            
            return true;
        },
        
        // عرض إشعار للمستخدم
        showNotification: function(type, title, message) {
            const notificationArea = document.getElementById('notification-area');
            if (!notificationArea) return;
            
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            
            const icons = {
                success: 'fas fa-check-circle',
                error: 'fas fa-times-circle',
                warning: 'fas fa-exclamation-triangle',
                info: 'fas fa-info-circle'
            };
            
            notification.innerHTML = `
                <div class="notification-icon">
                    <i class="${icons[type] || icons.info}"></i>
                </div>
                <div class="notification-content">
                    <h4 class="notification-title">${title}</h4>
                    <p class="notification-message">${message}</p>
                </div>
                <button class="notification-close" onclick="this.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            notificationArea.appendChild(notification);
            
            // إزالة الإشعار تلقائياً بعد 5 ثوانٍ
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 5000);
        },
        
        // تهيئة الوضع الداكن
        setupTheme: function() {
            const savedTheme = localStorage.getItem('theme') || 'dark';
            const body = document.body;
            
            if (savedTheme === 'light') {
                body.classList.remove('dark-mode');
                body.classList.add('light-mode');
                this.updateThemeIcon('light');
            } else {
                body.classList.remove('light-mode');
                body.classList.add('dark-mode');
                this.updateThemeIcon('dark');
            }
        },
        
        // تحديث أيقونة الوضع
        updateThemeIcon: function(theme) {
            const themeToggle = document.getElementById('theme-toggle');
            if (!themeToggle) return;
            
            const icon = themeToggle.querySelector('i');
            if (theme === 'light') {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        },
        
        // إعداد الأحداث العالمية
        setupGlobalEvents: function() {
            // إعداد القائمة المتنقلة
            this.setupMobileMenu();
            
            // إعداد تبديل الوضع
            this.setupThemeToggle();
            
            // تحديث التنقل النشط
            this.updateActiveNav();
        },
        
        // إعداد القائمة المتنقلة
        setupMobileMenu: function() {
            const mobileToggle = document.getElementById('mobile-toggle');
            const navMenu = document.querySelector('.nav-menu');
            
            if (mobileToggle && navMenu) {
                mobileToggle.addEventListener('click', function(e) {
                    e.stopPropagation();
                    navMenu.classList.toggle('active');
                    this.classList.toggle('active');
                });
                
                // إغلاق القائمة عند النقر خارجها
                document.addEventListener('click', function(e) {
                    if (!navMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
                        navMenu.classList.remove('active');
                        mobileToggle.classList.remove('active');
                    }
                });
                
                // إغلاق القائمة عند النقر على رابط
                navMenu.querySelectorAll('.nav-link').forEach(link => {
                    link.addEventListener('click', function() {
                        navMenu.classList.remove('active');
                        mobileToggle.classList.remove('active');
                    });
                });
            }
        },
        
        // إعداد تبديل الوضع
        setupThemeToggle: function() {
            const themeToggle = document.getElementById('theme-toggle');
            if (!themeToggle) return;
            
            themeToggle.addEventListener('click', function() {
                const body = document.body;
                const icon = this.querySelector('i');
                
                if (body.classList.contains('dark-mode')) {
                    body.classList.remove('dark-mode');
                    body.classList.add('light-mode');
                    icon.classList.remove('fa-moon');
                    icon.classList.add('fa-sun');
                    localStorage.setItem('theme', 'light');
                } else {
                    body.classList.remove('light-mode');
                    body.classList.add('dark-mode');
                    icon.classList.remove('fa-sun');
                    icon.classList.add('fa-moon');
                    localStorage.setItem('theme', 'dark');
                }
            });
        },
        
        // تحديث رابط التنقل النشط
        updateActiveNav: function() {
            const currentPath = window.location.pathname;
            const navLinks = document.querySelectorAll('.nav-link');
            
            navLinks.forEach(link => {
                link.parentElement.classList.remove('active');
                
                const linkPath = link.getAttribute('href');
                if (currentPath === linkPath || 
                    (currentPath === '/' && linkPath === '/')) {
                    link.parentElement.classList.add('active');
                }
            });
        },
        
        // تنسيق الأرقام العربية
        formatNumber: function(num) {
            if (!num && num !== 0) return '0';
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        },
        
        // تحميل وتنفيذ CSS ديناميكي
        loadCSS: function(cssText) {
            const style = document.createElement('style');
            style.textContent = cssText;
            document.head.appendChild(style);
        }
    };
    
    // تهيئة النظام عند تحميل الصفحة
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            window.Core.init();
        });
    } else {
        window.Core.init();
    }
})();