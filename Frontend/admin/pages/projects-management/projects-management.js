// ===== صفحة إدارة المشاريع - نظام إدارة العقارات =====
// 📁 المسار: Frontend/admin/pages/projects-management/projects-management.js
// 🧠 الغرض: إدارة المشاريع مع اتصال حقيقي بقاعدة البيانات
// 📱 إصدار محسن للجوال - تم إزالة كل ما يتعلق بالعقود

(function() {
    'use strict';
    
    console.log('✅ projects-management.js loaded - REAL DATABASE CONNECTION');
    
    class ProjectsManager {
        constructor() {
            this.baseURL = '';
            this.apiClient = this.createApiClient();
            this.currentUser = null;
            this.projects = [];
            this.filteredProjects = [];
            this.currentPage = 1;
            this.pageSize = 25;
            this.totalPages = 1;
            this.totalItems = 0;
            
            // ✅ إصلاح الفلاتر - حالة أولية صحيحة
            this.filters = {
                search: '',
                status: [],
                type: [],
                featured: false,
                available: false
            };
            
            this.sortOrder = 'newest';
            this.chartInstance = null;
            this.projectFeatures = [];
            this.projectImages = [];
            this.currentProjectId = null;
            this.draggedImage = null;
            this.isLoading = false;
            
            this.init();
        }
        
        createApiClient() {
            return {
                request: async (endpoint, options = {}) => {
                    const url = `${this.baseURL}${endpoint}`;
                    const defaultOptions = {
                        method: options.method || 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        mode: 'cors',
                        credentials: 'omit'
                    };
                    
                    // إذا كانت POST أو PUT، نضيف body
                    if (options.body) {
                        defaultOptions.body = options.body;
                    }
                    
                    const finalOptions = { ...defaultOptions, ...options };
                    
                    console.log(`🌐 API Request: ${finalOptions.method} ${url}`);
                    if (options.body) {
                        console.log('📦 Request Body:', options.body);
                    }
                    
                    try {
                        const response = await fetch(url, finalOptions);
                        
                        if (!response.ok) {
                            let errorMessage = `HTTP error! status: ${response.status}`;
                            try {
                                const errorData = await response.json();
                                errorMessage = errorData.message || errorMessage;
                            } catch (e) {
                                // لا توجد بيانات JSON في الاستجابة
                            }
                            throw new Error(errorMessage);
                        }
                        
                        const data = await response.json();
                        
                        if (!data.success) {
                            console.warn(`⚠️ API Warning: ${data.message || 'Unknown error'}`);
                        }
                        
                        return data;
                    } catch (error) {
                        console.error('❌ API Error:', error.message);
                        throw error;
                    }
                }
            };
        }
        
        async init() {
            console.log('🚀 ProjectsManager initializing with real database...');
            
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setupPage());
            } else {
                this.setupPage();
            }
        }
        
        async setupPage() {
            console.log('🔧 Setting up projects management page with real data...');
            
            // التحقق من صحة API أولاً
            await this.checkApiHealth();
            
            // تحميل البيانات من قاعدة البيانات الحقيقية
            await this.loadProjects();
            
            // إعداد واجهة المستخدم
            this.setupUI();
            
            // تحديث الإحصائيات
            this.updateStatistics();
            
            // إعداد مخطط الإحصائيات
            this.setupChart();
            
            // ✅ إعداد تحسينات الجوال
            this.setupMobileEnhancements();
            
            // ✅ إصلاح: إعداد ساعة النظام
            this.updateSystemTime();
            setInterval(() => this.updateSystemTime(), 60000);
        }
        
        updateSystemTime() {
            const systemTimeElement = document.getElementById('system-time');
            if (systemTimeElement) {
                const now = new Date();
                const timeString = now.toLocaleTimeString('ar-SA', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
                const dateString = now.toLocaleDateString('ar-SA', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                systemTimeElement.textContent = `${timeString} - ${dateString}`;
            }
        }
        
        // ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅
        // ✅ تحسينات احترافية للجوال
        setupMobileEnhancements() {
            console.log('📱 Setting up mobile enhancements...');
            
            // إعداد زر القائمة للجوال
            this.setupMobileMenu();
            
            // إعداد البحث المتحرك للجوال
            this.setupMobileSearch();
            
            // إعداد السحب والإفلات المحسّن للجوال
            this.setupMobileDragAndDrop();
            
            // إضافة تأثير الاهتزاز للأزرار على الجوال
            this.setupMobileButtonEffects();
            
            // إعداد الفلترات المحسنة للجوال
            this.setupMobileFilters();
            
            // إعداد التفاعلات المحسنة للجوال
            this.setupMobileInteractions();
            
            // اكتشاف الشاشات الصغيرة
            this.detectMobile();
            
            // ✅ إضافة تحسينات للعرض على الجوال
            this.optimizeMobileLayout();
        }
        
        setupMobileMenu() {
            const menuToggle = document.getElementById('menu-toggle');
            const sidebar = document.getElementById('dashboard-sidebar');
            const sidebarClose = document.getElementById('sidebar-close');
            const body = document.body;
            
            if (menuToggle && sidebar) {
                // ✅ إصلاح: زر التوجل في أقصى اليمين ومغلق افتراضياً
                menuToggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    sidebar.classList.toggle('active');
                    menuToggle.classList.toggle('active');
                    
                    // إضافة/إزالة backdrop
                    this.toggleSidebarBackdrop();
                    
                    // منع التمرير عند فتح القائمة
                    if (sidebar.classList.contains('active')) {
                        body.style.overflow = 'hidden';
                        body.classList.add('sidebar-open');
                    } else {
                        body.style.overflow = '';
                        body.classList.remove('sidebar-open');
                    }
                });
                
                // إغلاق السايدبار عند النقر على الزر
                if (sidebarClose) {
                    sidebarClose.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        sidebar.classList.remove('active');
                        menuToggle.classList.remove('active');
                        body.style.overflow = '';
                        body.classList.remove('sidebar-open');
                        this.removeSidebarBackdrop();
                    });
                }
                
                // إغلاق السايدبار عند النقر خارجها (على backdrop)
                document.addEventListener('click', (e) => {
                    const backdrop = document.querySelector('.sidebar-backdrop');
                    if (backdrop && backdrop.contains(e.target) && 
                        sidebar.classList.contains('active')) {
                        sidebar.classList.remove('active');
                        menuToggle.classList.remove('active');
                        body.style.overflow = '';
                        body.classList.remove('sidebar-open');
                        this.removeSidebarBackdrop();
                    }
                });
                
                // إغلاق السايدبار عند الضغط على زر الهروب
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && sidebar.classList.contains('active')) {
                        sidebar.classList.remove('active');
                        menuToggle.classList.remove('active');
                        body.style.overflow = '';
                        body.classList.remove('sidebar-open');
                        this.removeSidebarBackdrop();
                    }
                });
            }
            
            // إغلاق القوائم المنسدلة الأخرى عند فتح القائمة
            this.closeAllDropdownsOnMenuOpen();
        }
        
        toggleSidebarBackdrop() {
            let backdrop = document.querySelector('.sidebar-backdrop');
            
            if (!backdrop) {
                backdrop = document.createElement('div');
                backdrop.className = 'sidebar-backdrop';
                document.body.appendChild(backdrop);
                
                // إضافة تأثير الظهور
                setTimeout(() => {
                    backdrop.classList.add('active');
                }, 10);
            } else {
                backdrop.classList.toggle('active');
            }
        }
        
        removeSidebarBackdrop() {
            const backdrop = document.querySelector('.sidebar-backdrop');
            if (backdrop) {
                backdrop.classList.remove('active');
                setTimeout(() => {
                    if (backdrop.parentNode) {
                        backdrop.parentNode.removeChild(backdrop);
                    }
                }, 300);
            }
        }
        
        closeAllDropdownsOnMenuOpen() {
            const menuToggle = document.getElementById('menu-toggle');
            const sidebar = document.getElementById('dashboard-sidebar');
            
            if (menuToggle && sidebar) {
                menuToggle.addEventListener('click', () => {
                    // إغلاق جميع القوائم المنسدلة
                    document.querySelectorAll('.filter-dropdown-content-table.show, .sort-dropdown-content-table.show').forEach(dropdown => {
                        dropdown.classList.remove('show');
                    });
                    
                    // إغلاق البحث في الهيدر إذا كان مفتوحاً
                    const headerSearch = document.querySelector('.admin-search');
                    if (headerSearch && headerSearch.classList.contains('active')) {
                        headerSearch.classList.remove('active');
                    }
                });
            }
        }
        
        setupMobileSearch() {
            const searchIcon = document.querySelector('.search-btn-header');
            const headerSearch = document.querySelector('.admin-search');
            
            if (searchIcon && headerSearch) {
                searchIcon.addEventListener('click', (e) => {
                    if (window.innerWidth <= 992) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        headerSearch.classList.toggle('active');
                        
                        if (headerSearch.classList.contains('active')) {
                            const searchInput = headerSearch.querySelector('.search-input-header');
                            if (searchInput) {
                                setTimeout(() => {
                                    searchInput.focus();
                                }, 100);
                            }
                        }
                    }
                });
                
                // إغلاق البحث عند النقر خارجها
                document.addEventListener('click', (e) => {
                    if (headerSearch.classList.contains('active') && 
                        !headerSearch.contains(e.target) && 
                        !searchIcon.contains(e.target)) {
                        headerSearch.classList.remove('active');
                    }
                });
            }
            
            // تحسين تجربة البحث على الجوال
            this.enhanceMobileSearch();
        }
        
        enhanceMobileSearch() {
            const searchInputs = document.querySelectorAll('.search-input-header, .table-search-input');
            
            searchInputs.forEach(input => {
                // إضافة زر مسح للبحث على الجوال
                if (window.innerWidth <= 768) {
                    const clearBtn = document.createElement('button');
                    clearBtn.type = 'button';
                    clearBtn.className = 'search-clear-btn';
                    clearBtn.innerHTML = '<i class="fas fa-times"></i>';
                    clearBtn.style.cssText = `
                        position: absolute;
                        left: 8px;
                        top: 50%;
                        transform: translateY(-50%);
                        background: none;
                        border: none;
                        color: #B3B3B3;
                        font-size: 0.9rem;
                        cursor: pointer;
                        display: none;
                        z-index: 10;
                        width: 30px;
                        height: 30px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    `;
                    
                    input.parentNode.style.position = 'relative';
                    input.parentNode.appendChild(clearBtn);
                    
                    // إظهار/إخفاء زر المسح
                    input.addEventListener('input', function() {
                        clearBtn.style.display = this.value ? 'flex' : 'none';
                    });
                    
                    // مسح البحث
                    clearBtn.addEventListener('click', function() {
                        input.value = '';
                        input.focus();
                        clearBtn.style.display = 'none';
                        
                        // إطلاق حدث البحث إذا كان في جدول
                        if (input.classList.contains('table-search-input')) {
                            const searchEvent = new Event('input', { bubbles: true });
                            input.dispatchEvent(searchEvent);
                        }
                    });
                    
                    // تحسين تجربة اللمس
                    clearBtn.addEventListener('touchstart', function(e) {
                        e.stopPropagation();
                    }, { passive: true });
                }
            });
        }
        
        setupMobileDragAndDrop() {
            // تحسين تجربة السحب والإفلات للجوال
            if ('ontouchstart' in window) {
                document.addEventListener('touchstart', (e) => {
                    const imageItem = e.target.closest('.image-item[draggable="true"]');
                    if (imageItem) {
                        imageItem.classList.add('dragging');
                        this.draggedImage = imageItem;
                    }
                }, { passive: true });
                
                document.addEventListener('touchend', (e) => {
                    if (this.draggedImage) {
                        this.draggedImage.classList.remove('dragging');
                        this.draggedImage = null;
                        this.updateImageDisplayOrders();
                    }
                }, { passive: true });
                
                document.addEventListener('touchmove', (e) => {
                    if (this.draggedImage) {
                        e.preventDefault();
                    }
                }, { passive: false });
            }
        }
        
        setupMobileButtonEffects() {
            // إضافة تأثيرات الاهتزاز للأزرار على الجوال
            if ('ontouchstart' in window) {
                document.addEventListener('touchstart', (e) => {
                    const button = e.target.closest('.btn, .action-btn, .pagination-btn');
                    if (button && !button.disabled) {
                        button.style.transform = 'scale(0.95)';
                        button.style.transition = 'transform 0.1s ease';
                    }
                }, { passive: true });
                
                document.addEventListener('touchend', (e) => {
                    const button = e.target.closest('.btn, .action-btn, .pagination-btn');
                    if (button && !button.disabled) {
                        setTimeout(() => {
                            button.style.transform = '';
                        }, 150);
                    }
                }, { passive: true });
                
                document.addEventListener('touchcancel', (e) => {
                    const button = e.target.closest('.btn, .action-btn, .pagination-btn');
                    if (button && !button.disabled) {
                        button.style.transform = '';
                    }
                }, { passive: true });
            }
        }
        
        setupMobileFilters() {
            // تحسين تجربة الفلترة على الجوال
            const filterBtn = document.getElementById('filter-table-btn');
            const filterDropdown = document.getElementById('filter-dropdown-table');
            
            if (filterBtn && filterDropdown && window.innerWidth <= 992) {
                // جعل الفلترات تنبثق من الأسفل على الجوال
                filterDropdown.style.position = 'fixed';
                filterDropdown.style.bottom = '0';
                filterDropdown.style.left = '0';
                filterDropdown.style.width = '100%';
                filterDropdown.style.maxHeight = '80vh';
                filterDropdown.style.borderRadius = '16px 16px 0 0';
                filterDropdown.style.transform = 'translateY(100%)';
                filterDropdown.style.transition = 'transform 0.3s ease';
                filterDropdown.style.zIndex = '2000';
                
                const toggleFilter = (e) => {
                    e.stopPropagation();
                    filterDropdown.classList.toggle('show');
                    
                    if (filterDropdown.classList.contains('show')) {
                        filterDropdown.style.transform = 'translateY(0)';
                        document.body.style.overflow = 'hidden';
                    } else {
                        filterDropdown.style.transform = 'translateY(100%)';
                        document.body.style.overflow = '';
                    }
                };
                
                filterBtn.addEventListener('click', toggleFilter);
                
                // إغلاق الفلترات عند النقر خارجها
                document.addEventListener('click', (e) => {
                    if (!filterBtn.contains(e.target) && !filterDropdown.contains(e.target)) {
                        filterDropdown.classList.remove('show');
                        filterDropdown.style.transform = 'translateY(100%)';
                        document.body.style.overflow = '';
                    }
                });
                
                // إغلاق الفلترات عند النقر على تطبيق أو إعادة تعيين
                const applyBtn = document.getElementById('apply-filter-table');
                const resetBtn = document.getElementById('reset-filter-table');
                
                if (applyBtn) {
                    applyBtn.addEventListener('click', () => {
                        filterDropdown.classList.remove('show');
                        filterDropdown.style.transform = 'translateY(100%)';
                        document.body.style.overflow = '';
                    });
                }
                
                if (resetBtn) {
                    resetBtn.addEventListener('click', () => {
                        setTimeout(() => {
                            filterDropdown.classList.remove('show');
                            filterDropdown.style.transform = 'translateY(100%)';
                            document.body.style.overflow = '';
                        }, 300);
                    });
                }
            }
        }
        
        setupMobileInteractions() {
            // تحسين التفاعلات للجوال
            if ('ontouchstart' in window) {
                // زيادة مساحة النقر لعناصر الجدول
                document.querySelectorAll('.action-btn').forEach(btn => {
                    btn.style.minWidth = '44px';
                    btn.style.minHeight = '44px';
                });
                
                // زيادة مساحة النقر لروابط التنقل
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.style.minHeight = '44px';
                    link.style.padding = '0.75rem 1rem';
                });
                
                // تحسين تجربة التمرير للجدول
                const tableContainer = document.querySelector('.table-container');
                if (tableContainer) {
                    tableContainer.style.webkitOverflowScrolling = 'touch';
                }
                
                // منع الزوم المزدوج على العناصر التفاعلية
                let lastTouchEnd = 0;
                document.addEventListener('touchend', (e) => {
                    const now = Date.now();
                    if (now - lastTouchEnd <= 300) {
                        e.preventDefault();
                    }
                    lastTouchEnd = now;
                }, false);
                
                // تحسين تجربة النقر على الروابط
                document.querySelectorAll('a').forEach(link => {
                    link.addEventListener('touchstart', () => {
                        link.style.opacity = '0.7';
                    });
                    link.addEventListener('touchend', () => {
                        link.style.opacity = '1';
                    });
                });
            }
        }
        
        detectMobile() {
            // اكتشاف إذا كان المستخدم على جهاز محمول
            const isMobile = window.innerWidth <= 768;
            
            if (isMobile) {
                document.body.classList.add('mobile-view');
                
                // تحسين عرض البيانات للجوال
                this.optimizeForMobile();
                
                // إضافة تأثيرات خاصة للجوال
                this.addMobileSpecificEffects();
                
                // إصلاح: إخفاء الشريط الجانبي افتراضياً
                const sidebar = document.getElementById('dashboard-sidebar');
                if (sidebar) {
                    sidebar.style.right = '-280px';
                }
            }
            
            // تحديث عند تغيير حجم النافذة
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    const currentIsMobile = window.innerWidth <= 768;
                    if (currentIsMobile !== document.body.classList.contains('mobile-view')) {
                        if (currentIsMobile) {
                            document.body.classList.add('mobile-view');
                            this.optimizeForMobile();
                            this.addMobileSpecificEffects();
                        } else {
                            document.body.classList.remove('mobile-view');
                        }
                    }
                }, 250);
            });
        }
        
        optimizeForMobile() {
            // تحسين عرض البيانات للجوال
            const tableCells = document.querySelectorAll('.data-table td, .data-table th');
            
            tableCells.forEach(cell => {
                // تقليل الحشوات على الجوال
                if (window.innerWidth <= 480) {
                    cell.style.padding = '0.4rem 0.2rem';
                    cell.style.fontSize = '0.75rem';
                }
            });
            
            // تحسين عرض بطاقات النظرة العامة
            const overviewCards = document.querySelectorAll('.overview-card');
            overviewCards.forEach(card => {
                if (window.innerWidth <= 480) {
                    card.style.flexDirection = 'column';
                    card.style.textAlign = 'center';
                    card.style.gap = '0.5rem';
                    card.style.height = 'auto';
                    card.style.minHeight = '100px';
                }
            });
            
            // تحسين عرض أزرار الإجراءات
            const actionButtons = document.querySelectorAll('.action-buttons');
            actionButtons.forEach(container => {
                if (window.innerWidth <= 480) {
                    container.style.flexDirection = 'row';
                    container.style.justifyContent = 'center';
                    container.style.gap = '0.25rem';
                }
            });
            
            // إخفاء النص الطويل وإظهار نقاط
            document.querySelectorAll('.project-name').forEach(name => {
                if (window.innerWidth <= 480) {
                    name.style.maxWidth = '120px';
                    name.style.overflow = 'hidden';
                    name.style.textOverflow = 'ellipsis';
                    name.style.whiteSpace = 'nowrap';
                }
            });
        }
        
        addMobileSpecificEffects() {
            // إضافة تأثيرات خاصة للجوال
            const style = document.createElement('style');
            style.textContent = `
                /* تحسينات عامة للجوال */
                .mobile-view .admin-header {
                    position: fixed;
                    top: 0;
                    width: 100%;
                    z-index: 1000;
                }
                
                .mobile-view .admin-main {
                    padding-top: 80px;
                    width: 100%;
                    overflow-x: hidden;
                }
                
                .mobile-view .container {
                    padding: 0 0.75rem;
                }
                
                /* تحسينات للجدول على الجوال */
                .mobile-view .table-container {
                    -webkit-overflow-scrolling: touch;
                    scroll-behavior: smooth;
                    margin: 0 -0.75rem;
                    width: calc(100% + 1.5rem);
                }
                
                .mobile-view .data-table {
                    min-width: 1400px;
                }
                
                .mobile-view .data-table tr {
                    border-bottom: 2px solid rgba(203, 205, 205, 0.1);
                }
                
                /* تحسينات للأزرار على الجوال */
                .mobile-view .btn {
                    min-height: 44px;
                    font-size: 0.85rem;
                }
                
                .mobile-view .action-btn {
                    min-width: 44px;
                    min-height: 44px;
                }
                
                /* تحسينات للبطاقات على الجوال */
                .mobile-view .overview-cards {
                    gap: 0.75rem;
                }
                
                .mobile-view .overview-card {
                    border-radius: 12px;
                }
                
                /* تحسينات للبحث على الجوال */
                .mobile-view .admin-search.active {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    width: 100%;
                    background: rgba(15, 15, 15, 0.98);
                    padding: 1rem;
                    z-index: 1001;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
                }
                
                /* تحسينات للفلترات على الجوال */
                .mobile-view .filter-dropdown-content-table.show {
                    z-index: 2001;
                }
                
                /* تحسينات للـ modals على الجوال */
                .mobile-view .modal-content {
                    border-radius: 0;
                    max-height: 100vh;
                    margin: 0;
                }
                
                .mobile-view .modal {
                    padding: 0;
                }
                
                /* تحسينات للشريط الجانبي على الجوال */
                .mobile-view .dashboard-sidebar {
                    width: 85%;
                    max-width: 300px;
                    box-shadow: 5px 0 30px rgba(0, 0, 0, 0.7);
                }
                
                /* إخفاء بعض العناصر غير الضرورية على الجوال */
                .mobile-view .admin-logo-text,
                .mobile-view .user-info,
                .mobile-view .quick-stat-label,
                .mobile-view .page-description {
                    display: none !important;
                }
                
                /* تحسينات للأحجام على الجوال */
                @media (max-width: 480px) {
                    .mobile-view .page-title {
                        font-size: 1.3rem;
                    }
                    
                    .mobile-view .overview-card-value {
                        font-size: 1.5rem;
                    }
                    
                    .mobile-view .status-badge {
                        min-width: 80px;
                        font-size: 0.7rem;
                        padding: 0.25rem 0.5rem;
                    }
                    
                    .mobile-view .images-grid,
                    .mobile-view .images-list {
                        grid-template-columns: 1fr;
                    }
                }
                
                @media (max-width: 360px) {
                    .mobile-view .page-title {
                        font-size: 1.2rem;
                    }
                    
                    .mobile-view .overview-card {
                        flex-direction: column;
                        text-align: center;
                    }
                    
                    .mobile-view .action-buttons {
                        flex-direction: column;
                        gap: 0.25rem;
                    }
                    
                    .mobile-view .btn {
                        width: 100%;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        optimizeMobileLayout() {
            // تحسين التخطيط العام للجوال
            if (window.innerWidth <= 768) {
                // إعادة ترتيب عناصر الهيدر للجوال
                const header = document.querySelector('.admin-header');
                if (header) {
                    header.style.position = 'fixed';
                    header.style.width = '100%';
                    header.style.top = '0';
                    header.style.zIndex = '1000';
                }
                
                // تعديل الهيدر الرئيسي
                const main = document.querySelector('.admin-main');
                if (main) {
                    main.style.paddingTop = '80px';
                }
                
                // تحسين عرض الجدول
                const tableContainer = document.querySelector('.table-container');
                if (tableContainer) {
                    tableContainer.style.margin = '0 -0.75rem';
                    tableContainer.style.width = 'calc(100% + 1.5rem)';
                }
                
                // إخفاء النص الطويل
                document.querySelectorAll('.project-name').forEach(el => {
                    el.style.maxWidth = '150px';
                    el.style.overflow = 'hidden';
                    el.style.textOverflow = 'ellipsis';
                    el.style.whiteSpace = 'nowrap';
                });
            }
        }
        
        async checkApiHealth() {
            try {
                console.log('🏥 Checking API health...');
                const response = await this.apiClient.request('/api/health');
                
                if (response.success) {
                    console.log('✅ API is healthy:', response.message);
                    this.showNotification('success', 'API متصل', 'تم الاتصال بخادم البيانات بنجاح');
                } else {
                    throw new Error('API returned unsuccessful response');
                }
            } catch (error) {
                console.error('❌ API Health Check Failed:', error);
                this.showNotification('warning', 'تنبيه', 'لا يمكن الاتصال بخادم البيانات، سيتم استخدام بيانات محلية');
                
                // استخدام بيانات محلية كبديل
                this.useLocalData = true;
            }
        }
        
        async loadProjects() {
            try {
                console.log('📥 Loading projects from real database...');
                
                // إظهار حالة التحميل
                this.showLoading();
                this.isLoading = true;
                
                // ✅ بناء معاملات البحث بشكل صحيح ومبسط
                const queryParams = new URLSearchParams({
                    page: this.currentPage,
                    limit: this.pageSize,
                    sort: this.sortOrder
                });
                
                // ✅ إضافة البحث النصي
                if (this.filters.search && this.filters.search.trim() !== '') {
                    queryParams.append('search', this.filters.search);
                }
                
                // ✅ إضافة فلتر الحالة
                if (this.filters.status.length > 0) {
                    queryParams.append('status', this.filters.status.join(','));
                }
                
                // ✅ إضافة فلتر النوع
                if (this.filters.type.length > 0) {
                    queryParams.append('type', this.filters.type.join(','));
                }
                
                // ✅ إضافة فلتر المميز
                if (this.filters.featured) {
                    queryParams.append('featured', 'true');
                }
                
                // ✅ إضافة فلتر المتاح
                if (this.filters.available) {
                    queryParams.append('available', 'true');
                }
                
                const endpoint = `/api/admin/projects?${queryParams.toString()}`;
                console.log('🔍 Endpoint with filters:', endpoint);
                
                const response = await this.apiClient.request(endpoint);
                
                if (response.success) {
                    this.projects = response.data || [];
                    this.totalItems = response.pagination?.totalItems || this.projects.length;
                    this.totalPages = response.pagination?.totalPages || 1;
                    
                    console.log(`✅ Loaded ${this.projects.length} projects from database`);
                    
                    // عرض البيانات مباشرة
                    this.filteredProjects = [...this.projects];
                    this.renderTable();
                } else {
                    throw new Error(response.message || 'API response failed');
                }
                
            } catch (error) {
                console.error('❌ Error loading projects:', error.message);
                this.showNotification('error', 'خطأ', 'فشل في تحميل المشاريع: ' + error.message);
                
                // استخدام البيانات المحلية مع الفلترة
                this.loadMockData();
                this.applyFiltersAndSort();
                this.renderTable();
            } finally {
                this.isLoading = false;
            }
        }
        
        loadMockData() {
            console.log('🔄 Using mock projects data as fallback...');
            
            // البيانات الافتراضية من قاعدة البيانات - تم إزالة contractPdfUrl
            this.projects = [
                {
                    id: 1,
                    projectCode: 'PJ-2024-001',
                    projectName: 'فيلات النخيل الراقية',
                    projectType: 'سكني',
                    location: 'شارع الأمير محمد بن سلمان، حي النخيل',
                    city: 'الرياض',
                    district: 'النخيل',
                    locationLink: 'https://maps.google.com/?q=24.7136,46.6753',
                    price: 3500000,
                    priceType: 'شراء',
                    area: 450,
                    areaUnit: 'متر_مربع',
                    totalUnits: 20,
                    availableUnits: 15,
                    bedrooms: 5,
                    bathrooms: 4,
                    isFeatured: true,
                    status: 'جاهز_للتسليم',
                    completionDate: '2024-06-01',
                    description: 'مجمع فيلات فاخرة بمواصفات عالمية، موقع مميز مع إطلالة على الواجهة البحرية',
                    createdAt: '2024-05-01T10:30:00.000Z',
                    createdBy: 1,
                    imagesCount: 4,
                    featuresCount: 6,
                    contractsCount: 1,
                    inquiriesCount: 1
                },
                {
                    id: 2,
                    projectCode: 'PJ-2024-002',
                    projectName: 'أبراج الأعمال التجارية',
                    projectType: 'تجاري',
                    location: 'طريق الملك فهد، المنطقة المركزية',
                    city: 'الرياض',
                    district: 'المركز',
                    locationLink: 'https://maps.google.com/?q=24.6880,46.7224',
                    price: 12000,
                    priceType: 'تأجير',
                    area: 200,
                    areaUnit: 'متر_مربع',
                    totalUnits: 50,
                    availableUnits: 28,
                    bedrooms: null,
                    bathrooms: null,
                    isFeatured: true,
                    status: 'مكتمل',
                    completionDate: '2024-01-15',
                    description: 'أبراج مكتبية عصرية في قلب المنطقة التجارية، مجهزة بأحدث التقنيات',
                    createdAt: '2024-03-15T14:20:00.000Z',
                    createdBy: 1,
                    imagesCount: 2,
                    featuresCount: 4,
                    contractsCount: 1,
                    inquiriesCount: 1
                },
                {
                    id: 3,
                    projectCode: 'PJ-2024-003',
                    projectName: 'شقق السفير المتميزة',
                    projectType: 'سكني',
                    location: 'حي السفارات، طريق العليا',
                    city: 'الرياض',
                    district: 'العليا',
                    locationLink: 'https://maps.google.com/?q=24.7743,46.7071',
                    price: 8000,
                    priceType: 'إيجار_تشغيلي',
                    area: 120,
                    areaUnit: 'متر_مربع',
                    totalUnits: 40,
                    availableUnits: 12,
                    bedrooms: 2,
                    bathrooms: 2,
                    isFeatured: true,
                    status: 'نشط',
                    completionDate: '2023-11-30',
                    description: 'شقق مفروشة فاخرة للإيجار اليومي والشهري، خدمة 24 ساعة',
                    createdAt: '2024-02-10T09:15:00.000Z',
                    createdBy: 1,
                    imagesCount: 1,
                    featuresCount: 4,
                    contractsCount: 0,
                    inquiriesCount: 1
                },
                {
                    id: 4,
                    projectCode: 'PJ-2024-004',
                    projectName: 'مخازن اللوجستية الحديثة',
                    projectType: 'صناعي',
                    location: 'المنطقة الصناعية الثانية',
                    city: 'الرياض',
                    district: 'الصناعية',
                    locationLink: 'https://maps.google.com/?q=24.6290,46.7155',
                    price: 5000000,
                    priceType: 'شراء',
                    area: 1200,
                    areaUnit: 'متر_مربع',
                    totalUnits: 15,
                    availableUnits: 5,
                    bedrooms: null,
                    bathrooms: null,
                    isFeatured: false,
                    status: 'قيد_الإنشاء',
                    completionDate: '2024-12-01',
                    description: 'مخازن مجهزة للشركات اللوجستية بمساحات كبيرة ومواقف للشاحنات',
                    createdAt: '2024-04-05T11:45:00.000Z',
                    createdBy: 1,
                    imagesCount: 0,
                    featuresCount: 0,
                    contractsCount: 0,
                    inquiriesCount: 0
                },
                {
                    id: 5,
                    projectCode: 'PJ-2024-005',
                    projectName: 'فندق ومنتجع الضيافة',
                    projectType: 'فندقي',
                    location: 'الكورنيش الشمالي',
                    city: 'الرياض',
                    district: 'الملك_عبدالله',
                    locationLink: 'https://maps.google.com/?q=24.7922,46.6921',
                    price: 25000000,
                    priceType: 'شراء',
                    area: 5000,
                    areaUnit: 'متر_مربع',
                    totalUnits: 1,
                    availableUnits: 0,
                    bedrooms: null,
                    bathrooms: null,
                    isFeatured: true,
                    status: 'مباع',
                    completionDate: '2024-03-20',
                    description: 'فندق 5 نجوم مع منتجع صحي ومرافق ترفيهية متكاملة',
                    createdAt: '2024-01-25T08:30:00.000Z',
                    createdBy: 1,
                    imagesCount: 0,
                    featuresCount: 0,
                    contractsCount: 0,
                    inquiriesCount: 0
                }
            ];
            
            this.totalItems = this.projects.length;
            this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        }
        
        applyFiltersAndSort() {
            // ✅ تطبيق الفلترات على البيانات المحلية فقط
            this.filteredProjects = this.projects.filter(project => {
                // ✅ فلترة البحث النصي
                if (this.filters.search && this.filters.search.trim() !== '') {
                    const searchTerm = this.filters.search.toLowerCase();
                    const matchesSearch = 
                        project.projectName.toLowerCase().includes(searchTerm) ||
                        (project.projectCode && project.projectCode.toLowerCase().includes(searchTerm)) ||
                        (project.location && project.location.toLowerCase().includes(searchTerm)) ||
                        (project.city && project.city.toLowerCase().includes(searchTerm)) ||
                        (project.district && project.district.toLowerCase().includes(searchTerm)) ||
                        (project.description && project.description.toLowerCase().includes(searchTerm));
                    
                    if (!matchesSearch) return false;
                }
                
                // ✅ فلترة الحالة - مصحح ليتوافق مع قيم قاعدة البيانات
                if (this.filters.status.length > 0) {
                    const projectStatus = project.status || '';
                    if (!this.filters.status.includes(projectStatus)) {
                        return false;
                    }
                }
                
                // ✅ فلترة النوع
                if (this.filters.type.length > 0) {
                    if (!this.filters.type.includes(project.projectType)) {
                        return false;
                    }
                }
                
                // ✅ فلترة المميز
                if (this.filters.featured) {
                    if (!project.isFeatured) {
                        return false;
                    }
                }
                
                // ✅ فلترة المتاح
                if (this.filters.available) {
                    if (!project.availableUnits || project.availableUnits <= 0) {
                        return false;
                    }
                }
                
                return true;
            });
            
            // تطبيق الفرز
            this.sortProjects();
            
            // تحديث العدد الإجمالي
            this.totalItems = this.filteredProjects.length;
            this.totalPages = Math.ceil(this.totalItems / this.pageSize);
            
            console.log(`🔍 تم تطبيق الفلترات: ${this.filteredProjects.length} مشروع`);
        }
        
        sortProjects() {
            switch (this.sortOrder) {
                case 'newest':
                    this.filteredProjects.sort((a, b) => 
                        new Date(b.createdAt) - new Date(a.createdAt));
                    break;
                    
                case 'oldest':
                    this.filteredProjects.sort((a, b) => 
                        new Date(a.createdAt) - new Date(b.createdAt));
                    break;
                    
                case 'name':
                    this.filteredProjects.sort((a, b) => 
                        a.projectName.localeCompare(b.projectName, 'ar'));
                    break;
                    
                case 'price-high':
                    this.filteredProjects.sort((a, b) => (b.price || 0) - (a.price || 0));
                    break;
                    
                case 'price-low':
                    this.filteredProjects.sort((a, b) => (a.price || 0) - (b.price || 0));
                    break;
                    
                default:
                    this.filteredProjects.sort((a, b) => 
                        new Date(b.createdAt) - new Date(a.createdAt));
            }
        }
        
        renderTable() {
            const tableBody = document.getElementById('projects-table-body');
            if (!tableBody) return;
            
            // حساب البيانات للصفحة الحالية
            const startIndex = (this.currentPage - 1) * this.pageSize;
            const endIndex = Math.min(startIndex + this.pageSize, this.filteredProjects.length);
            const pageData = this.filteredProjects.slice(startIndex, endIndex);
            
            let html = '';
            
            if (pageData.length === 0) {
                html = `
                    <tr class="empty-row">
                        <td colspan="12">
                            <div class="empty-state">
                                <i class="fas fa-building"></i>
                                <h4>لا توجد مشاريع</h4>
                                <p>لا توجد مشاريع تطابق معايير البحث</p>
                                ${this.isLoading ? '' : '<button class="btn btn-primary mt-3" id="add-first-project">إضافة أول مشروع</button>'}
                            </div>
                        </td>
                    </tr>
                `;
            } else {
                pageData.forEach((project, index) => {
                    const statusClass = this.getStatusClass(project.status);
                    const dateFormatted = this.formatDate(project.createdAt);
                    const priceFormatted = this.formatPrice(project.price, project.priceType);
                    const areaFormatted = this.formatArea(project.area, project.areaUnit);
                    
                    // إضافة كلاس للمشاريع المميزة
                    const featuredClass = project.isFeatured ? 'featured-project' : '';
                    
                    // معالجة القيم NULL
                    const bedrooms = project.bedrooms !== null && project.bedrooms !== undefined ? project.bedrooms : '--';
                    const availableUnits = project.availableUnits || 0;
                    const totalUnits = project.totalUnits || 0;
                    
                    html += `
                        <tr class="${featuredClass}" data-project-id="${project.id}">
                            <td>
                                <label class="checkbox-cell">
                                    <input type="checkbox" class="project-checkbox" data-id="${project.id}">
                                    <span class="checkmark"></span>
                                </label>
                            </td>
                            <td>
                                <span class="project-code">${project.projectCode}</span>
                            </td>
                            <td>
                                <div class="project-info">
                                    <div class="project-name">${project.projectName}</div>
                                    ${project.isFeatured ? '<span class="featured-badge"><i class="fas fa-star"></i> مميز</span>' : ''}
                                </div>
                            </td>
                            <td>
                                <span class="project-type">${project.projectType}</span>
                            </td>
                            <td>
                                <div class="project-location">
                                    <div class="city">${project.city}</div>
                                    <div class="district">${project.district || ''}</div>
                                </div>
                            </td>
                            <td>
                                <span class="currency">${priceFormatted}</span>
                            </td>
                            <td>
                                <span class="area">${areaFormatted}</span>
                            </td>
                            <td>
                                <div class="units-display">
                                    <span class="units-total">${totalUnits}</span>
                                    <div class="units-available-container">
                                        <span class="units-available-value">${availableUnits}</span>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <span class="rooms">${bedrooms}</span>
                            </td>
                            <td>
                                <span class="status-badge ${statusClass}">${this.getStatusText(project.status)}</span>
                            </td>
                            <td>
                                <span class="project-date">${dateFormatted}</span>
                            </td>
                            <td>
                                <div class="action-buttons">
                                    <button class="action-btn btn-view view-project" data-id="${project.id}" title="عرض التفاصيل">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="action-btn btn-edit edit-project" data-id="${project.id}" title="تعديل">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="action-btn btn-delete delete-project" data-id="${project.id}" title="حذف">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                });
            }
            
            tableBody.innerHTML = html;
            
            // تحديث التذييل
            this.updatePagination();
            
            // إضافة مستمعي الأحداث
            this.attachTableEvents();
            
            // إذا كان هناك زر إضافة أول مشروع
            const addFirstBtn = document.getElementById('add-first-project');
            if (addFirstBtn) {
                addFirstBtn.addEventListener('click', () => {
                    this.showAddProjectModal();
                });
            }
        }
        
        getStatusText(status) {
            const statusMap = {
                'نشط': 'نشط',
                'جاهز_للتسليم': 'جاهز للتسليم',
                'مكتمل': 'مكتمل',
                'قيد_الإنشاء': 'قيد الإنشاء',
                'مباع': 'مباع',
                'معلق': 'معلق'
            };
            return statusMap[status] || status;
        }
        
        getStatusClass(status) {
            const statusMap = {
                'نشط': 'status-active',
                'جاهز_للتسليم': 'status-ready',
                'مكتمل': 'status-completed',
                'قيد_الإنشاء': 'status-under-construction',
                'مباع': 'status-sold',
                'معلق': 'status-pending'
            };
            return statusMap[status] || 'status-active';
        }
        
        formatPrice(price, priceType) {
            if (!price) return '--';
            const formatter = new Intl.NumberFormat('ar-SA');
            const formattedPrice = formatter.format(price);
            
            switch (priceType) {
                case 'تأجير':
                    return `${formattedPrice} ر.س/شهرياً`;
                case 'إيجار_تشغيلي':
                    return `${formattedPrice} ر.س/شهرياً`;
                default:
                    return `${formattedPrice} ر.س`;
            }
        }
        
        formatArea(area, areaUnit) {
            if (!area) return '--';
            const formatter = new Intl.NumberFormat('ar-SA');
            const unit = areaUnit === 'قدم_مربع' ? 'قدم²' : 'م²';
            return `${formatter.format(area)} ${unit}`;
        }
        
        formatDate(dateString) {
            if (!dateString) return '--';
            
            try {
                const date = new Date(dateString);
                return date.toLocaleDateString('ar-SA', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });
            } catch (error) {
                return dateString;
            }
        }
        
        updatePagination() {
            const paginationContainer = document.getElementById('table-pagination');
            if (!paginationContainer) return;
            
            const totalItemsElement = document.getElementById('total-items');
            if (totalItemsElement) {
                totalItemsElement.textContent = this.totalItems;
            }
            
            if (this.totalPages <= 1) {
                paginationContainer.innerHTML = '';
                return;
            }
            
            let html = '';
            
            // زر السابق
            html += `
                <button class="pagination-btn prev-btn" ${this.currentPage === 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-right"></i>
                </button>
            `;
            
            // أرقام الصفحات
            html += `<div class="pagination-pages">`;
            
            const maxPagesToShow = window.innerWidth <= 768 ? 3 : 5;
            let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
            let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);
            
            if (endPage - startPage + 1 < maxPagesToShow) {
                startPage = Math.max(1, endPage - maxPagesToShow + 1);
            }
            
            for (let i = startPage; i <= endPage; i++) {
                html += `
                    <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" data-page="${i}">
                        ${i}
                    </button>
                `;
            }
            
            html += `</div>`;
            
            // زر التالي
            html += `
                <button class="pagination-btn next-btn" ${this.currentPage === this.totalPages ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i>
                </button>
            `;
            
            paginationContainer.innerHTML = html;
            
            // إضافة مستمعي الأحداث
            this.attachPaginationEvents();
        }
        
        setupUI() {
            // إعداد البحث في الهيدر
            this.setupHeaderSearch();
            
            // إعداد القوائم المنسدلة
            this.setupDropdowns();
            
            // ✅ إعداد البحث في الجدول - مصحح
            this.setupTableSearch();
            
            // ✅ إعداد الفلترات في الجدول - مصحح
            this.setupTableFilters();
            
            // إعداد الفرز
            this.setupSorting();
            
            // إعداد الأزرار
            this.setupButtons();
            
            // إعداد الـ Modals
            this.setupModals();
            
            // إعداد تحديد حجم الصفحة
            this.setupPageSize();
            
            // ✅ إعداد إدارة الصور
            this.setupImageManagement();
        }
        
        setupImageManagement() {
            // زر استعراض الصور
            const browseBtn = document.getElementById('browse-images-btn');
            const uploadInput = document.getElementById('image-upload-input');
            const uploadBox = document.getElementById('image-upload-box');
            
            if (browseBtn && uploadInput) {
                browseBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    uploadInput.click();
                });
            }
            
            // اختيار الملفات
            if (uploadInput) {
                uploadInput.addEventListener('change', (e) => {
                    this.handleImageUpload(e.target.files);
                    // ✅ إعادة تعيين المدخل ليسمح باختيار نفس الملف مرة أخرى
                    e.target.value = '';
                });
            }
            
            // Drag and Drop
            if (uploadBox) {
                ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                    uploadBox.addEventListener(eventName, (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    });
                });
                
                ['dragenter', 'dragover'].forEach(eventName => {
                    uploadBox.addEventListener(eventName, () => {
                        uploadBox.classList.add('drag-over');
                    });
                });
                
                ['dragleave', 'drop'].forEach(eventName => {
                    uploadBox.addEventListener(eventName, () => {
                        uploadBox.classList.remove('drag-over');
                    });
                });
                
                uploadBox.addEventListener('drop', (e) => {
                    const files = e.dataTransfer.files;
                    this.handleImageUpload(files);
                });
                
                // ✅ تحسين للنقر على الجوال
                let touchTimer;
                uploadBox.addEventListener('touchstart', (e) => {
                    touchTimer = setTimeout(() => {
                        uploadInput.click();
                    }, 500);
                });
                
                uploadBox.addEventListener('touchend', () => {
                    clearTimeout(touchTimer);
                });
                
                uploadBox.addEventListener('touchmove', () => {
                    clearTimeout(touchTimer);
                });
            }
        }
        
        handleImageUpload(files) {
            if (!files || files.length === 0) return;
            
            const maxSize = 5 * 1024 * 1024; // 5MB
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            const uploadProgress = document.getElementById('upload-progress-container');
            
            let uploadedCount = 0;
            let totalFiles = files.length;
            
            // إظهار شريط التقدم
            uploadProgress.innerHTML = `
                <div class="upload-progress">
                    <div class="progress-bar" id="upload-progress-bar" style="width: 0%"></div>
                </div>
                <div class="upload-progress-info">
                    <span>جاري الرفع...</span>
                    <span id="upload-count">0/${totalFiles}</span>
                </div>
            `;
            
            Array.from(files).forEach((file, index) => {
                if (!allowedTypes.includes(file.type)) {
                    this.showNotification('error', 'خطأ', `نوع الملف ${file.name} غير مدعوم`);
                    totalFiles--;
                    return;
                }
                
                if (file.size > maxSize) {
                    this.showNotification('error', 'خطأ', `حجم الملف ${file.name} أكبر من 5MB`);
                    totalFiles--;
                    return;
                }
                
                // محاكاة الرفع
                setTimeout(() => {
                    uploadedCount++;
                    
                    const progress = Math.round((uploadedCount / totalFiles) * 100);
                    const progressBar = document.getElementById('upload-progress-bar');
                    const uploadCount = document.getElementById('upload-count');
                    
                    if (progressBar) progressBar.style.width = `${progress}%`;
                    if (uploadCount) uploadCount.textContent = `${uploadedCount}/${totalFiles}`;
                    
                    this.addImageToList(file);
                    
                    if (uploadedCount === totalFiles) {
                        setTimeout(() => {
                            uploadProgress.innerHTML = '';
                        }, 1000);
                    }
                }, 500 * index);
            });
        }
        
        addImageToList(file) {
            const imageId = Date.now() + Math.random().toString(36).substr(2, 9);
            const imageUrl = URL.createObjectURL(file);
            
            this.projectImages.push({
                id: imageId,
                file: file,
                previewUrl: imageUrl,
                name: file.name,
                size: this.formatFileSize(file.size),
                displayOrder: this.projectImages.length + 1,
                isMain: this.projectImages.length === 0
            });
            
            this.renderImagesList();
        }
        
        formatFileSize(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
        }
        
        renderImagesList() {
            const imagesList = document.getElementById('images-list');
            const imagesCount = document.getElementById('images-count');
            
            if (imagesCount) {
                imagesCount.textContent = this.projectImages.length;
            }
            
            if (this.projectImages.length === 0) {
                imagesList.innerHTML = `
                    <div class="empty-images">
                        <i class="fas fa-image"></i>
                        <p>لم يتم تحميل أي صور بعد</p>
                    </div>
                `;
                return;
            }
            
            let html = '';
            
            const sortedImages = [...this.projectImages].sort((a, b) => a.displayOrder - b.displayOrder);
            
            sortedImages.forEach((image, index) => {
                const isMain = image.isMain ? 'main-image' : '';
                const imageName = image.name || `صورة-${index + 1}`;
                const truncatedName = this.truncateText(imageName, 15);
                
                html += `
                    <div class="image-item ${isMain}" data-image-id="${image.id}" draggable="true">
                        <div class="image-preview">
                            <img src="${image.previewUrl}" alt="${imageName}" loading="lazy">
                            <div class="image-overlay"></div>
                            <div class="image-actions">
                                <button class="image-action-btn view" title="معاينة">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="image-action-btn set-main" title="تعيين كصورة رئيسية">
                                    <i class="fas fa-star"></i>
                                </button>
                                <button class="image-action-btn delete" title="حذف">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="image-info">
                            <div class="image-name" title="${imageName}">${truncatedName}</div>
                            <div class="image-meta">
                                <span class="image-size">${image.size}</span>
                                <span class="image-order">#${image.displayOrder}</span>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            imagesList.innerHTML = html;
            
            this.attachImageEvents();
            this.setupImageDragAndDrop();
        }
        
        truncateText(text, maxLength) {
            if (!text || typeof text !== 'string') return '';
            if (text.length <= maxLength) return text;
            return text.substr(0, maxLength) + '...';
        }
        
        attachImageEvents() {
            document.querySelectorAll('.image-action-btn.view').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const imageItem = e.target.closest('.image-item');
                    const imageId = imageItem.dataset.imageId;
                    this.previewImage(imageId);
                });
            });
            
            document.querySelectorAll('.image-action-btn.set-main').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const imageItem = e.target.closest('.image-item');
                    const imageId = imageItem.dataset.imageId;
                    this.setAsMainImage(imageId);
                });
            });
            
            document.querySelectorAll('.image-action-btn.delete').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const imageItem = e.target.closest('.image-item');
                    const imageId = imageItem.dataset.imageId;
                    this.removeImage(imageId);
                });
            });
        }
        
        setupImageDragAndDrop() {
            const imageItems = document.querySelectorAll('.image-item[draggable="true"]');
            
            imageItems.forEach(item => {
                item.addEventListener('dragstart', (e) => {
                    this.draggedImage = item;
                    item.classList.add('dragging');
                });
                
                item.addEventListener('dragend', () => {
                    item.classList.remove('dragging');
                    this.draggedImage = null;
                    this.updateImageDisplayOrders();
                });
                
                item.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    const afterElement = this.getDragAfterElement(item, e.clientX);
                    const container = document.getElementById('images-list');
                    
                    if (afterElement == null) {
                        container.appendChild(this.draggedImage);
                    } else {
                        container.insertBefore(this.draggedImage, afterElement);
                    }
                });
            });
        }
        
        getDragAfterElement(container, x) {
            const draggableElements = [...container.parentNode.querySelectorAll('.image-item:not(.dragging)')];
            
            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = x - box.right;
                
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }
        
        updateImageDisplayOrders() {
            const imagesList = document.getElementById('images-list');
            const imageItems = imagesList.querySelectorAll('.image-item');
            
            imageItems.forEach((item, index) => {
                const imageId = item.dataset.imageId;
                const image = this.projectImages.find(img => img.id === imageId);
                
                if (image) {
                    image.displayOrder = index + 1;
                    const orderSpan = item.querySelector('.image-order');
                    if (orderSpan) {
                        orderSpan.textContent = `#${image.displayOrder}`;
                    }
                }
            });
        }
        
        previewImage(imageId) {
            const image = this.projectImages.find(img => img.id === imageId);
            if (!image) return;
            
            const modal = document.getElementById('image-view-modal');
            const modalImage = document.getElementById('modal-view-image');
            const imageInfo = document.getElementById('image-view-info');
            
            modalImage.src = image.previewUrl;
            modalImage.alt = image.name || 'صورة المشروع';
            
            const imageType = image.isMain ? 'صورة رئيسية' : 'صورة عادية';
            
            imageInfo.innerHTML = `
                <h4>معلومات الصورة</h4>
                <div class="image-view-details">
                    <div class="image-detail-item">
                        <span class="image-detail-label">اسم الملف:</span>
                        <span class="image-detail-value">${image.name || 'غير معروف'}</span>
                    </div>
                    <div class="image-detail-item">
                        <span class="image-detail-label">الحجم:</span>
                        <span class="image-detail-value">${image.size}</span>
                    </div>
                    <div class="image-detail-item">
                        <span class="image-detail-label">النوع:</span>
                        <span class="image-detail-value">${imageType}</span>
                    </div>
                    <div class="image-detail-item">
                        <span class="image-detail-label">الترتيب:</span>
                        <span class="image-detail-value">${image.displayOrder}</span>
                    </div>
                </div>
            `;
            
            modal.classList.add('active');
        }
        
        setAsMainImage(imageId) {
            this.projectImages.forEach(img => {
                img.isMain = false;
            });
            
            const image = this.projectImages.find(img => img.id === imageId);
            if (image) {
                image.isMain = true;
                image.displayOrder = 1;
                
                let order = 2;
                this.projectImages
                    .filter(img => img.id !== imageId)
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .forEach(img => {
                        img.displayOrder = order++;
                    });
                
                this.renderImagesList();
                this.showNotification('success', 'تم', 'تم تعيين الصورة كصورة رئيسية');
            }
        }
        
        removeImage(imageId) {
            // استخدام swal بدلاً من confirm على الجوال
            const isMobile = window.innerWidth <= 768;
            
            if (isMobile) {
                // على الجوال، نستخدم تأكيد أكثر وضوحاً
                const modal = document.getElementById('delete-confirm-modal');
                const modalBody = modal.querySelector('.modal-body');
                const confirmBtn = document.getElementById('delete-confirm-btn');
                const cancelBtn = document.getElementById('delete-cancel-btn');
                
                modalBody.innerHTML = `
                    <p>هل أنت متأكد من حذف هذه الصورة؟</p>
                    <p class="text-danger"><small>هذا الإجراء لا يمكن التراجع عنه.</small></p>
                `;
                
                modal.classList.add('active');
                
                const originalConfirm = confirmBtn.onclick;
                const originalCancel = cancelBtn.onclick;
                
                confirmBtn.onclick = () => {
                    this.confirmRemoveImage(imageId);
                    modal.classList.remove('active');
                    confirmBtn.onclick = originalConfirm;
                    cancelBtn.onclick = originalCancel;
                };
                
                cancelBtn.onclick = () => {
                    modal.classList.remove('active');
                    confirmBtn.onclick = originalConfirm;
                    cancelBtn.onclick = originalCancel;
                };
            } else {
                if (confirm('هل أنت متأكد من حذف هذه الصورة؟')) {
                    this.confirmRemoveImage(imageId);
                }
            }
        }
        
        confirmRemoveImage(imageId) {
            const imageIndex = this.projectImages.findIndex(img => img.id === imageId);
            if (imageIndex !== -1) {
                const image = this.projectImages[imageIndex];
                
                if (image.previewUrl) {
                    URL.revokeObjectURL(image.previewUrl);
                }
                
                this.projectImages.splice(imageIndex, 1);
                
                if (image.isMain && this.projectImages.length > 0) {
                    this.projectImages[0].isMain = true;
                }
                
                this.projectImages.forEach((img, index) => {
                    img.displayOrder = index + 1;
                });
                
                this.renderImagesList();
                this.showNotification('success', 'تم الحذف', 'تم حذف الصورة بنجاح');
            }
        }
        
        setupHeaderSearch() {
            const searchInput = document.querySelector('.search-input-header');
            const searchBtn = document.querySelector('.search-btn-header');
            
            const performSearch = () => {
                const searchTerm = searchInput.value.trim().toLowerCase();
                
                if (searchTerm) {
                    this.filteredProjects = this.projects.filter(project => 
                        project.projectName.toLowerCase().includes(searchTerm) ||
                        (project.projectCode && project.projectCode.toLowerCase().includes(searchTerm)) ||
                        (project.location && project.location.toLowerCase().includes(searchTerm)) ||
                        (project.city && project.city.toLowerCase().includes(searchTerm)) ||
                        (project.district && project.district.toLowerCase().includes(searchTerm)) ||
                        (project.description && project.description.toLowerCase().includes(searchTerm))
                    );
                    this.currentPage = 1;
                    this.renderTable();
                    this.updateStatistics();
                } else {
                    this.applyFiltersAndSort();
                    this.renderTable();
                    this.updateStatistics();
                }
            };
            
            if (searchInput) {
                searchInput.addEventListener('keyup', (e) => {
                    if (e.key === 'Enter') {
                        performSearch();
                    }
                });
                
                let searchTimeout;
                searchInput.addEventListener('input', () => {
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(performSearch, 500);
                });
            }
            
            if (searchBtn) {
                searchBtn.addEventListener('click', performSearch);
            }
        }
        
        setupDropdowns() {
            const userBtn = document.getElementById('user-profile-btn');
            const userDropdown = document.getElementById('user-dropdown');
            
            if (userBtn && userDropdown) {
                userBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    userDropdown.classList.toggle('show');
                });
                
                document.addEventListener('click', () => {
                    userDropdown.classList.remove('show');
                });
            }
        }
        
        setupTableSearch() {
            const searchInput = document.getElementById('table-search');
            const searchBtn = document.getElementById('table-search-btn');
            
            const performSearch = () => {
                const searchTerm = searchInput.value.trim();
                
                if (searchTerm) {
                    this.filters.search = searchTerm;
                } else {
                    this.filters.search = '';
                }
                
                this.currentPage = 1;
                this.loadProjects();
            };
            
            if (searchInput) {
                searchInput.addEventListener('keyup', (e) => {
                    if (e.key === 'Enter') {
                        performSearch();
                    }
                });
                
                let searchTimeout;
                searchInput.addEventListener('input', () => {
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(performSearch, 800);
                });
            }
            
            if (searchBtn) {
                searchBtn.addEventListener('click', performSearch);
            }
        }
        
        setupTableFilters() {
            const filterBtn = document.getElementById('filter-table-btn');
            const filterDropdown = document.getElementById('filter-dropdown-table');
            const applyFilterBtn = document.getElementById('apply-filter-table');
            const resetFilterBtn = document.getElementById('reset-filter-table');
            
            if (filterBtn && filterDropdown) {
                filterBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    filterDropdown.classList.toggle('show');
                });
                
                document.addEventListener('click', () => {
                    filterDropdown.classList.remove('show');
                });
            }
            
            if (applyFilterBtn) {
                applyFilterBtn.addEventListener('click', () => {
                    this.updateFiltersFromUI();
                    this.currentPage = 1;
                    this.loadProjects();
                    filterDropdown.classList.remove('show');
                });
            }
            
            if (resetFilterBtn) {
                resetFilterBtn.addEventListener('click', () => {
                    this.resetFilters();
                    this.updateFiltersUI();
                    this.currentPage = 1;
                    this.loadProjects();
                    filterDropdown.classList.remove('show');
                });
            }
        }
        
        updateFiltersFromUI() {
            const statusCheckboxes = document.querySelectorAll('input[name="status"]:checked');
            const typeCheckboxes = document.querySelectorAll('input[name="type"]:checked');
            const featuredCheckbox = document.querySelector('input[name="featured"]');
            const availableCheckbox = document.querySelector('input[name="available"]');
            
            // ✅ تحديث الفلاتر كصفائف - مصحح
            this.filters.status = Array.from(statusCheckboxes).map(cb => cb.value);
            this.filters.type = Array.from(typeCheckboxes).map(cb => cb.value);
            this.filters.featured = featuredCheckbox ? featuredCheckbox.checked : false;
            this.filters.available = availableCheckbox ? availableCheckbox.checked : false;
            
            console.log('🔄 الفلترات المحددة:', this.filters);
        }
        
        resetFilters() {
            // ✅ إعادة تعيين جميع الفلاتر
            this.filters = {
                search: '',
                status: [],
                type: [],
                featured: false,
                available: false
            };
            
            // ✅ إعادة تعيين واجهة المستخدم
            document.querySelectorAll('input[name="status"]').forEach(cb => cb.checked = false);
            document.querySelectorAll('input[name="type"]').forEach(cb => cb.checked = false);
            
            const featuredCheckbox = document.querySelector('input[name="featured"]');
            const availableCheckbox = document.querySelector('input[name="available"]');
            
            if (featuredCheckbox) featuredCheckbox.checked = false;
            if (availableCheckbox) availableCheckbox.checked = false;
            
            const searchInput = document.getElementById('table-search');
            if (searchInput) searchInput.value = '';
            
            console.log('🗑️ تم إعادة تعيين جميع الفلترات');
        }
        
        updateFiltersUI() {
            document.querySelectorAll('input[name="status"]').forEach(cb => {
                cb.checked = this.filters.status.includes(cb.value);
            });
            
            document.querySelectorAll('input[name="type"]').forEach(cb => {
                cb.checked = this.filters.type.includes(cb.value);
            });
            
            const featuredCheckbox = document.querySelector('input[name="featured"]');
            const availableCheckbox = document.querySelector('input[name="available"]');
            
            if (featuredCheckbox) {
                featuredCheckbox.checked = this.filters.featured;
            }
            
            if (availableCheckbox) {
                availableCheckbox.checked = this.filters.available;
            }
        }
        
        setupSorting() {
            const sortBtn = document.getElementById('sort-table-btn');
            const sortDropdown = document.getElementById('sort-dropdown-table');
            const sortOptions = sortDropdown?.querySelectorAll('.sort-option');
            
            if (sortBtn && sortDropdown) {
                sortBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    sortDropdown.classList.toggle('show');
                });
                
                document.addEventListener('click', () => {
                    sortDropdown.classList.remove('show');
                });
            }
            
            if (sortOptions) {
                sortOptions.forEach(option => {
                    option.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.sortOrder = option.dataset.sort;
                        this.currentPage = 1;
                        this.loadProjects();
                        sortDropdown.classList.remove('show');
                    });
                });
            }
        }
        
        setupButtons() {
            const refreshBtn = document.getElementById('refresh-btn');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => {
                    this.loadProjects();
                    this.showNotification('success', 'تم التحديث', 'تم تحديث قائمة المشاريع بنجاح');
                });
            }
            
            const addProjectBtn = document.getElementById('add-project-btn');
            if (addProjectBtn) {
                addProjectBtn.addEventListener('click', () => {
                    this.showAddProjectModal();
                });
            }
            
            const selectAll = document.getElementById('select-all');
            if (selectAll) {
                selectAll.addEventListener('change', (e) => {
                    const checkboxes = document.querySelectorAll('.project-checkbox');
                    checkboxes.forEach(cb => {
                        cb.checked = e.target.checked;
                    });
                });
            }
            
            const exportBtn = document.getElementById('export-btn');
            if (exportBtn) {
                exportBtn.addEventListener('click', () => {
                    this.exportProjects();
                });
            }
        }
        
        setupPageSize() {
            const pageSizeSelect = document.getElementById('page-size');
            if (pageSizeSelect) {
                pageSizeSelect.addEventListener('change', (e) => {
                    this.pageSize = parseInt(e.target.value);
                    this.currentPage = 1;
                    this.loadProjects();
                });
            }
        }
        
        setupModals() {
            // Modal تفاصيل المشروع
            const detailModal = document.getElementById('project-detail-modal');
            const closeModalBtns = document.querySelectorAll('#modal-close-btn, #modal-close-btn-2');
            
            closeModalBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    detailModal.classList.remove('active');
                });
            });
            
            // Modal إضافة/تعديل المشروع
            const formModal = document.getElementById('project-form-modal');
            const formCloseBtns = document.querySelectorAll('#project-form-close, #project-form-cancel-btn');
            
            formCloseBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    formModal.classList.remove('active');
                    this.resetProjectForm();
                });
            });
            
            // Modal تأكيد الحذف
            const deleteModal = document.getElementById('delete-confirm-modal');
            const deleteCloseBtns = document.querySelectorAll('#delete-modal-close, #delete-cancel-btn');
            
            deleteCloseBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    deleteModal.classList.remove('active');
                    this.currentProjectId = null;
                });
            });
            
            // Modal عرض الصورة
            const imageModal = document.getElementById('image-view-modal');
            const imageCloseBtns = document.querySelectorAll('#image-view-close, #image-view-close-btn');
            
            imageCloseBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    imageModal.classList.remove('active');
                });
            });
            
            window.addEventListener('click', (e) => {
                if (e.target === detailModal) detailModal.classList.remove('active');
                if (e.target === formModal) {
                    formModal.classList.remove('active');
                    this.resetProjectForm();
                }
                if (e.target === deleteModal) {
                    deleteModal.classList.remove('active');
                    this.currentProjectId = null;
                }
                if (e.target === imageModal) imageModal.classList.remove('active');
            });
            
            const addFeatureBtn = document.getElementById('add-feature-btn');
            if (addFeatureBtn) {
                addFeatureBtn.addEventListener('click', () => {
                    this.addFeature();
                });
            }
            
            const submitBtn = document.getElementById('project-form-submit-btn');
            if (submitBtn) {
                submitBtn.addEventListener('click', () => {
                    this.submitProjectForm();
                });
            }
            
            const confirmDeleteBtn = document.getElementById('delete-confirm-btn');
            if (confirmDeleteBtn) {
                confirmDeleteBtn.addEventListener('click', () => {
                    this.deleteProject();
                });
            }
        }
        
        attachTableEvents() {
            document.querySelectorAll('.view-project').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const projectId = e.target.closest('.view-project').dataset.id;
                    this.showProjectDetail(projectId);
                });
            });
            
            document.querySelectorAll('.edit-project').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const projectId = e.target.closest('.edit-project').dataset.id;
                    this.showEditProjectModal(projectId);
                });
            });
            
            document.querySelectorAll('.delete-project').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const projectId = e.target.closest('.delete-project').dataset.id;
                    this.showDeleteConfirmModal(projectId);
                });
            });
        }
        
        attachPaginationEvents() {
            document.querySelectorAll('.pagination-btn[data-page]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const page = parseInt(e.target.dataset.page);
                    if (page !== this.currentPage) {
                        this.currentPage = page;
                        this.renderTable();
                    }
                });
            });
            
            const prevBtn = document.querySelector('.prev-btn');
            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    if (this.currentPage > 1) {
                        this.currentPage--;
                        this.renderTable();
                    }
                });
            }
            
            const nextBtn = document.querySelector('.next-btn');
            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    if (this.currentPage < this.totalPages) {
                        this.currentPage++;
                        this.renderTable();
                    }
                });
            }
        }
        
        async showProjectDetail(projectId) {
            try {
                console.log(`📄 جلب تفاصيل المشروع ${projectId} من قاعدة البيانات...`);
                
                const response = await this.apiClient.request(`/api/admin/projects/${projectId}`);
                
                if (response.success) {
                    const project = response.data;
                    
                    const modal = document.getElementById('project-detail-modal');
                    const modalBody = document.getElementById('modal-project-body');
                    const editBtn = document.getElementById('modal-edit-btn');
                    
                    editBtn.dataset.projectId = projectId;
                    
                    const statusClass = this.getStatusClass(project.status);
                    const createdAt = this.formatDate(project.createdAt);
                    const completionDate = project.completionDate ? this.formatDate(project.completionDate) : '--';
                    const priceFormatted = this.formatPrice(project.price, project.priceType);
                    const areaFormatted = this.formatArea(project.area, project.areaUnit);
                    const createdBy = project.createdByName || 'أحمد محمد';
                    
                    // تم إزالة قسم ملف العقد
                    
                    let imagesHTML = '';
                    if (project.images && project.images.length > 0) {
                        const sortedImages = [...project.images].sort((a, b) => a.displayOrder - b.displayOrder);
                        
                        imagesHTML = `
                            <div class="project-images-gallery">
                                <h4 class="gallery-title"><i class="fas fa-images"></i> معرض الصور (${sortedImages.length})</h4>
                                <div class="images-grid">
                                    ${sortedImages.map((image, index) => `
                                        <div class="gallery-image-item ${index === 0 ? 'main' : ''}" data-image-index="${index}">
                                            <div class="gallery-image-preview">
                                                <img src="${image.imageUrl || '/global/assets/images/project-placeholder.jpg'}" alt="صورة المشروع" loading="lazy">
                                            </div>
                                            <div class="gallery-image-type">${image.imageType || 'صورة'}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                    }
                    
                    const locationLinkHtml = project.locationLink 
                        ? `<div class="detail-item">
                                <span class="detail-label">رابط الموقع:</span>
                                <span class="detail-value"><a href="${project.locationLink}" target="_blank" class="location-link">عرض على الخريطة <i class="fas fa-map-marker-alt"></i></a></span>
                           </div>`
                        : '';
                    
                    const html = `
                        <div class="project-detail">
                            <div class="detail-section">
                                <h4><i class="fas fa-info-circle"></i> معلومات عامة</h4>
                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <span class="detail-label">رمز المشروع:</span>
                                        <span class="detail-value">${project.projectCode}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">نوع المشروع:</span>
                                        <span class="detail-value">${project.projectType}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">الحالة:</span>
                                        <span class="status-badge ${statusClass}">${this.getStatusText(project.status)}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">مشروع مميز:</span>
                                        <span class="detail-value">${project.isFeatured ? 'نعم' : 'لا'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="detail-section">
                                <h4><i class="fas fa-map-marker-alt"></i> الموقع</h4>
                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <span class="detail-label">الموقع:</span>
                                        <span class="detail-value">${project.location}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">المدينة:</span>
                                        <span class="detail-value">${project.city}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">الحي:</span>
                                        <span class="detail-value">${project.district || '--'}</span>
                                    </div>
                                    ${locationLinkHtml}
                                </div>
                            </div>
                            
                            <div class="detail-section">
                                <h4><i class="fas fa-chart-bar"></i> التفاصيل الفنية</h4>
                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <span class="detail-label">السعر:</span>
                                        <span class="detail-value">${priceFormatted}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">نوع السعر:</span>
                                        <span class="detail-value">${project.priceType}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">المساحة:</span>
                                        <span class="detail-value">${areaFormatted}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">الوحدات:</span>
                                        <span class="detail-value">${project.totalUnits || 0} (${project.availableUnits || 0} متاحة)</span>
                                    </div>
                                    ${project.bedrooms ? `
                                    <div class="detail-item">
                                        <span class="detail-label">الغرف:</span>
                                        <span class="detail-value">${project.bedrooms}</span>
                                    </div>
                                    ` : ''}
                                    ${project.bathrooms ? `
                                    <div class="detail-item">
                                        <span class="detail-label">الحمامات:</span>
                                        <span class="detail-value">${project.bathrooms}</span>
                                    </div>
                                    ` : ''}
                                </div>
                            </div>
                            
                            ${imagesHTML}
                            
                            <div class="detail-section">
                                <h4><i class="fas fa-clock"></i> التواريخ</h4>
                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <span class="detail-label">تاريخ الإنشاء:</span>
                                        <span class="detail-value">${createdAt}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">تاريخ الإكمال:</span>
                                        <span class="detail-value">${completionDate}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">أنشئ بواسطة:</span>
                                        <span class="detail-value">${createdBy}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="detail-section">
                                <h4><i class="fas fa-file-alt"></i> الوصف</h4>
                                <div class="description-content">
                                    ${project.description || 'لا يوجد وصف'}
                                </div>
                            </div>
                            
                            ${project.features && project.features.length > 0 ? `
                                <div class="detail-section">
                                    <h4><i class="fas fa-star"></i> الميزات (${project.features.length})</h4>
                                    <div class="features-list">
                                        ${project.features.map(feature => `
                                            <div class="feature-tag">
                                                <span>${feature.featureName || feature.name}: ${feature.featureValue || feature.value}</span>
                                            </div>
                                        `).join('')}
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    `;
                    
                    modalBody.innerHTML = html;
                    modal.classList.add('active');
                    
                    editBtn.onclick = () => {
                        modal.classList.remove('active');
                        this.showEditProjectModal(projectId);
                    };
                    
                    this.attachGalleryEvents(project);
                    
                } else {
                    throw new Error(response.message || 'فشل في جلب التفاصيل');
                }
                
            } catch (error) {
                console.error('❌ Error showing project detail:', error);
                this.showNotification('error', 'خطأ', 'فشل في تحميل تفاصيل المشروع');
            }
        }
        
        attachGalleryEvents(project) {
            document.querySelectorAll('.gallery-image-item').forEach(item => {
                item.addEventListener('click', () => {
                    const imageIndex = parseInt(item.dataset.imageIndex);
                    const image = project.images[imageIndex];
                    
                    if (image) {
                        this.previewGalleryImage(image);
                    }
                });
            });
        }
        
        previewGalleryImage(image) {
            const modal = document.getElementById('image-view-modal');
            const modalImage = document.getElementById('modal-view-image');
            const imageInfo = document.getElementById('image-view-info');
            
            modalImage.src = image.imageUrl || '/global/assets/images/project-placeholder.jpg';
            modalImage.alt = 'صورة المشروع';
            
            const imageType = image.imageType || 'صورة';
            
            imageInfo.innerHTML = `
                <h4>معلومات الصورة</h4>
                <div class="image-view-details">
                    <div class="image-detail-item">
                        <span class="image-detail-label">نوع الصورة:</span>
                        <span class="image-detail-value">${imageType}</span>
                    </div>
                    <div class="image-detail-item">
                        <span class="image-detail-label">الترتيب:</span>
                        <span class="image-detail-value">${image.displayOrder || 1}</span>
                    </div>
                    <div class="image-detail-item">
                        <span class="image-detail-label">الحالة:</span>
                        <span class="image-detail-value">${image.isActive ? 'نشطة' : 'غير نشطة'}</span>
                    </div>
                </div>
            `;
            
            modal.classList.add('active');
        }
        
        showAddProjectModal() {
            const formModal = document.getElementById('project-form-modal');
            const formTitle = document.getElementById('project-form-title');
            const submitBtn = document.getElementById('project-form-submit-btn');
            
            this.resetProjectForm();
            
            formTitle.textContent = 'إضافة مشروع جديد';
            submitBtn.dataset.action = 'add';
            submitBtn.textContent = 'إضافة المشروع';
            
            formModal.classList.add('active');
        }
        
        async showEditProjectModal(projectId) {
            try {
                console.log(`✏️ جلب بيانات المشروع ${projectId} للتعديل...`);
                
                const response = await this.apiClient.request(`/api/admin/projects/${projectId}`);
                
                if (response.success) {
                    const project = response.data;
                    
                    const formModal = document.getElementById('project-form-modal');
                    const formTitle = document.getElementById('project-form-title');
                    const submitBtn = document.getElementById('project-form-submit-btn');
                    
                    formTitle.textContent = 'تعديل المشروع';
                    submitBtn.dataset.action = 'edit';
                    submitBtn.dataset.projectId = projectId;
                    submitBtn.textContent = 'تحديث المشروع';
                    
                    this.fillProjectForm(project);
                    
                    // ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅
                    // ✅ إصلاح: تحميل الميزات بشكل صحيح
                    this.projectFeatures = project.features || [];
                    this.renderFeaturesList();
                    
                    // ✅ إصلاح: تحميل الصور بشكل صحيح
                    this.projectImages = [];
                    if (project.images && Array.isArray(project.images)) {
                        this.projectImages = project.images.map((img, index) => ({
                            id: `img-${img.id || Date.now() + index}`,
                            previewUrl: img.imageUrl || '/global/assets/images/project-placeholder.jpg',
                            name: `صورة ${index + 1}`,
                            size: '2.5 MB',
                            displayOrder: img.displayOrder || index + 1,
                            isMain: img.isMain || (img.imageType === 'صورة_رئيسية') || index === 0
                        }));
                    }
                    this.renderImagesList();
                    
                    formModal.classList.add('active');
                    
                } else {
                    throw new Error(response.message || 'فشل في جلب بيانات المشروع');
                }
                
            } catch (error) {
                console.error('❌ Error showing edit modal:', error);
                this.showNotification('error', 'خطأ', 'فشل في تحميل بيانات المشروع للتعديل');
            }
        }
        
        fillProjectForm(project) {
            document.getElementById('project-name').value = project.projectName || '';
            document.getElementById('project-code').value = project.projectCode || '';
            document.getElementById('project-type').value = project.projectType || '';
            document.getElementById('project-status').value = project.status || 'نشط';
            document.getElementById('completion-date').value = project.completionDate ? project.completionDate.split('T')[0] : '';
            document.getElementById('location').value = project.location || '';
            document.getElementById('city').value = project.city || '';
            document.getElementById('district').value = project.district || '';
            document.getElementById('locationLink').value = project.locationLink || '';
            document.getElementById('total-units').value = project.totalUnits || '';
            document.getElementById('available-units').value = project.availableUnits || '';
            document.getElementById('price').value = project.price || '';
            document.getElementById('price-type').value = project.priceType || 'شراء';
            document.getElementById('area').value = project.area || '';
            document.getElementById('area-unit').value = project.areaUnit || 'متر_مربع';
            document.getElementById('bedrooms').value = project.bedrooms !== null && project.bedrooms !== undefined ? project.bedrooms : '';
            document.getElementById('bathrooms').value = project.bathrooms !== null && project.bathrooms !== undefined ? project.bathrooms : '';
            document.getElementById('description').value = project.description || '';
            document.getElementById('is-featured').checked = project.isFeatured || false;
            
            // تم إزالة تعبئة contractPdfUrl
        }
        
        addFeature() {
            const nameInput = document.getElementById('feature-name');
            const valueInput = document.getElementById('feature-value');
            
            const name = nameInput.value.trim();
            const value = valueInput.value.trim();
            
            if (!name || !value) {
                this.showNotification('error', 'خطأ', 'يرجى إدخال اسم الميزة وقيمتها');
                return;
            }
            
            this.projectFeatures.push({ 
                name: name, 
                value: value,
                featureName: name, // ✅ إضافة لتجنب undefined
                featureValue: value // ✅ إضافة لتجنب undefined
            });
            this.renderFeaturesList();
            
            nameInput.value = '';
            valueInput.value = '';
            nameInput.focus();
        }
        
        removeFeature(index) {
            this.projectFeatures.splice(index, 1);
            this.renderFeaturesList();
        }
        
        renderFeaturesList() {
            const featuresList = document.getElementById('features-list');
            if (!featuresList) return;
            
            if (this.projectFeatures.length === 0) {
                featuresList.innerHTML = '<div class="text-muted">لا توجد ميزات مضافة</div>';
                return;
            }
            
            const html = this.projectFeatures.map((feature, index) => `
                <div class="feature-tag">
                    <span>${feature.featureName || feature.name}: ${feature.featureValue || feature.value}</span>
                    <i class="fas fa-times" data-index="${index}" title="إزالة"></i>
                </div>
            `).join('');
            
            featuresList.innerHTML = html;
            
            featuresList.querySelectorAll('.fa-times').forEach(icon => {
                icon.addEventListener('click', (e) => {
                    const index = parseInt(e.target.dataset.index);
                    this.removeFeature(index);
                });
            });
        }
        
        resetProjectForm() {
            document.getElementById('project-form').reset();
            this.projectFeatures = [];
            this.projectImages = [];
            this.renderFeaturesList();
            this.renderImagesList();
            // تم إزالة reset للعقد
        }
        
        async submitProjectForm() {
            try {
                const submitBtn = document.getElementById('project-form-submit-btn');
                const action = submitBtn.dataset.action;
                const projectId = submitBtn.dataset.projectId;
                
                if (!this.validateProjectForm()) {
                    return;
                }
                
                // جمع بيانات النموذج
                const projectData = {
                    projectName: document.getElementById('project-name').value.trim(),
                    projectCode: document.getElementById('project-code').value.trim(),
                    projectType: document.getElementById('project-type').value,
                    status: document.getElementById('project-status').value,
                    completionDate: document.getElementById('completion-date').value || null,
                    location: document.getElementById('location').value.trim(),
                    city: document.getElementById('city').value.trim(),
                    district: document.getElementById('district').value.trim(),
                    locationLink: document.getElementById('locationLink').value.trim() || null,
                    totalUnits: parseInt(document.getElementById('total-units').value),
                    availableUnits: parseInt(document.getElementById('available-units').value),
                    price: parseFloat(document.getElementById('price').value),
                    priceType: document.getElementById('price-type').value,
                    area: parseFloat(document.getElementById('area').value),
                    areaUnit: document.getElementById('area-unit').value,
                    bedrooms: document.getElementById('bedrooms').value ? parseInt(document.getElementById('bedrooms').value) : null,
                    bathrooms: document.getElementById('bathrooms').value ? parseInt(document.getElementById('bathrooms').value) : null,
                    description: document.getElementById('description').value.trim(),
                    isFeatured: document.getElementById('is-featured').checked,
                    createdBy: 1, // إضافة createdBy افتراضياً
                    features: this.projectFeatures, // ✅ إضافة الميزات
                    images: this.prepareImagesData() // ✅ إضافة الصور
                };
                
                console.log('📦 بيانات المشروع المرسلة:', projectData);
                
                let response;
                if (action === 'add') {
                    console.log('➕ جاري إضافة مشروع جديد...');
                    response = await this.addProject(projectData);
                } else if (action === 'edit' && projectId) {
                    console.log(`✏️ جاري تحديث مشروع ${projectId}...`);
                    response = await this.updateProject(projectId, projectData);
                }
                
                console.log('✅ استجابة الـ API:', response);
                
                if (response && response.success) {
                    document.getElementById('project-form-modal').classList.remove('active');
                    this.resetProjectForm();
                    
                    // إعادة تحميل البيانات من قاعدة البيانات الحقيقية
                    await this.loadProjects();
                    
                    // تحديث الإحصائيات
                    this.updateStatistics();
                    
                    this.showNotification('success', 'تم بنجاح', 
                        action === 'add' ? 'تم إضافة المشروع بنجاح في قاعدة البيانات' : 'تم تحديث المشروع بنجاح');
                } else {
                    throw new Error(response?.message || 'فشل في حفظ المشروع');
                }
                
            } catch (error) {
                console.error('❌ Error submitting project form:', error);
                this.showNotification('error', 'خطأ', 'فشل في حفظ المشروع: ' + error.message);
            }
        }
        
        prepareImagesData() {
            // ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅
            // ✅ إصلاح: تحضير بيانات الصور بشكل صحيح
            return this.projectImages.map((img, index) => ({
                imageUrl: `/uploads/projects/${Date.now()}-${img.name || `project-${index + 1}`}.jpg`,
                imageType: img.isMain ? 'صورة_رئيسية' : this.getImageType(img),
                displayOrder: img.displayOrder || index + 1,
                isActive: true,
                isMain: img.isMain || false
            }));
        }
        
        getImageType(image) {
            if (image.isMain) return 'صورة_رئيسية';
            
            const name = (image.name || '').toLowerCase();
            if (name.includes('living') || name.includes('room') || name.includes('internal')) {
                return 'صورة_داخلية';
            } else if (name.includes('location') || name.includes('map')) {
                return 'صورة_الموقع';
            } else if (name.includes('plan') || name.includes('design')) {
                return 'مخطط';
            } else {
                return 'صورة_عامة';
            }
        }
        
        validateProjectForm() {
            const requiredFields = [
                'project-name', 'project-code', 'project-type', 'project-status',
                'location', 'city', 'total-units', 'available-units', 'price', 'area'
            ];
            
            for (const fieldId of requiredFields) {
                const field = document.getElementById(fieldId);
                if (!field || !field.value.trim()) {
                    const fieldName = this.getFieldName(fieldId);
                    this.showNotification('error', 'خطأ', `يرجى تعبئة حقل ${fieldName}`);
                    field?.focus();
                    return false;
                }
            }
            
            // التحقق من أن القيم رقمية
            const price = parseFloat(document.getElementById('price').value);
            const area = parseFloat(document.getElementById('area').value);
            const totalUnits = parseInt(document.getElementById('total-units').value);
            const availableUnits = parseInt(document.getElementById('available-units').value);
            
            if (isNaN(price) || price <= 0) {
                this.showNotification('error', 'خطأ', 'يرجى إدخال سعر صحيح أكبر من الصفر');
                document.getElementById('price').focus();
                return false;
            }
            
            if (isNaN(area) || area <= 0) {
                this.showNotification('error', 'خطأ', 'يرجى إدخال مساحة صحيحة أكبر من الصفر');
                document.getElementById('area').focus();
                return false;
            }
            
            if (isNaN(totalUnits) || totalUnits <= 0) {
                this.showNotification('error', 'خطأ', 'يرجى إدخال عدد وحدات صحيح أكبر من الصفر');
                document.getElementById('total-units').focus();
                return false;
            }
            
            if (isNaN(availableUnits) || availableUnits < 0) {
                this.showNotification('error', 'خطأ', 'يرجى إدخال عدد وحدات متاحة صحيح');
                document.getElementById('available-units').focus();
                return false;
            }
            
            if (availableUnits > totalUnits) {
                this.showNotification('error', 'خطأ', 'الوحدات المتاحة لا يمكن أن تكون أكثر من إجمالي الوحدات');
                document.getElementById('available-units').focus();
                return false;
            }
            
            // التحقق من أن التاريخ ليس في الماضي إذا كان مطلوباً
            const completionDate = document.getElementById('completion-date').value;
            if (completionDate) {
                const selectedDate = new Date(completionDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (selectedDate < today) {
                    this.showNotification('error', 'خطأ', 'تاريخ الإكمال لا يمكن أن يكون في الماضي');
                    document.getElementById('completion-date').focus();
                    return false;
                }
            }
            
            // التحقق من صحة رابط الموقع (اختياري)
            const locationLink = document.getElementById('locationLink').value;
            if (locationLink) {
                try {
                    new URL(locationLink);
                } catch (e) {
                    this.showNotification('error', 'خطأ', 'رابط الموقع غير صحيح، يرجى إدخال رابط صحيح');
                    document.getElementById('locationLink').focus();
                    return false;
                }
            }
            
            return true;
        }
        
        getFieldName(fieldId) {
            const fieldNames = {
                'project-name': 'اسم المشروع',
                'project-code': 'رمز المشروع',
                'project-type': 'نوع المشروع',
                'project-status': 'حالة المشروع',
                'location': 'الموقع',
                'city': 'المدينة',
                'total-units': 'إجمالي الوحدات',
                'available-units': 'الوحدات المتاحة',
                'price': 'السعر',
                'area': 'المساحة'
            };
            
            return fieldNames[fieldId] || fieldId.replace('-', ' ');
        }
        
        async addProject(projectData) {
            try {
                console.log('➕ إضافة مشروع جديد عبر API...');
                
                // تحويل القيم المنطقية
                projectData.isFeatured = Boolean(projectData.isFeatured);
                
                console.log('📦 بيانات المشروع المرسلة:', JSON.stringify(projectData, null, 2));
                
                const response = await this.apiClient.request('/api/admin/projects', {
                    method: 'POST',
                    body: JSON.stringify(projectData)
                });
                
                console.log('✅ استجابة إضافة المشروع:', response);
                
                if (response.success) {
                    return response;
                } else {
                    throw new Error(response.message || 'فشل في إضافة المشروع');
                }
                
            } catch (error) {
                console.error('❌ Error adding project:', error);
                throw new Error('فشل في الاتصال بالخادم: ' + error.message);
            }
        }
        
        async updateProject(projectId, projectData) {
            try {
                console.log(`✏️ تحديث مشروع ${projectId} عبر API...`);
                
                const response = await this.apiClient.request(`/api/admin/projects/${projectId}`, {
                    method: 'PUT',
                    body: JSON.stringify(projectData)
                });
                
                return response;
                
            } catch (error) {
                console.error('❌ Error updating project:', error);
                throw error;
            }
        }
        
        showDeleteConfirmModal(projectId) {
            this.currentProjectId = projectId;
            document.getElementById('delete-confirm-modal').classList.add('active');
        }
        
        async deleteProject() {
            if (!this.currentProjectId) return;
            
            try {
                console.log(`🗑️ حذف مشروع ${this.currentProjectId} عبر API...`);
                
                const response = await this.apiClient.request(`/api/admin/projects/${this.currentProjectId}`, {
                    method: 'DELETE'
                });
                
                if (response.success) {
                    document.getElementById('delete-confirm-modal').classList.remove('active');
                    this.currentProjectId = null;
                    
                    await this.loadProjects();
                    this.showNotification('success', 'تم الحذف', 'تم حذف المشروع بنجاح');
                } else {
                    throw new Error(response.message || 'فشل في الحذف');
                }
                
            } catch (error) {
                console.error('❌ Error deleting project:', error);
                this.showNotification('error', 'خطأ', 'فشل في حذف المشروع');
            }
        }
        
        async exportProjects() {
            try {
                console.log('📊 تصدير المشاريع...');
                
                const response = await this.apiClient.request('/api/admin/projects/export/export-data');
                
                if (response.success && response.data) {
                    const exportData = response.data;
                    const headers = Object.keys(exportData[0] || {});
                    const csvRows = [
                        headers.join(','),
                        ...exportData.map(row => 
                            headers.map(header => 
                                `"${row[header] || ''}"`
                            ).join(',')
                        )
                    ];
                    
                    const csvContent = csvRows.join('\n');
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `مشاريع_${new Date().toISOString().split('T')[0]}.csv`;
                    link.click();
                    
                    URL.revokeObjectURL(url);
                    
                    this.showNotification('success', 'تم التصدير', 'تم تصدير المشاريع بنجاح');
                }
                
            } catch (error) {
                console.error('❌ Error exporting projects:', error);
                this.showNotification('error', 'خطأ', 'فشل في تصدير المشاريع');
            }
        }
        
        async updateStatistics() {
            try {
                console.log('📈 تحديث الإحصائيات من قاعدة البيانات...');
                
                const response = await this.apiClient.request('/api/admin/projects/stats');
                
                if (response.success) {
                    const stats = response.data;
                    
                    // تحديث البطاقات
                    document.getElementById('overview-total').textContent = stats.totalProjects || 0;
                    document.getElementById('overview-units').textContent = stats.totalUnits || 0;
                    document.getElementById('overview-featured').textContent = stats.featuredProjects || 0;
                    document.getElementById('overview-rented').textContent = stats.rentedUnits || 0;
                    
                    // تحديث المخطط
                    if (this.chartInstance) {
                        this.updateChartData(stats);
                    }
                    
                    // تحديث أحدث المشاريع
                    await this.updateRecentProjects();
                }
            } catch (error) {
                console.error('❌ Error updating statistics:', error);
                // استخدام بيانات افتراضية
                this.updateStatisticsFallback();
            }
        }
        
        updateStatisticsFallback() {
            const total = this.projects.length;
            const totalUnits = this.projects.reduce((sum, p) => sum + (p.totalUnits || 0), 0);
            const featured = this.projects.filter(p => p.isFeatured).length;
            const rentedUnits = this.projects.reduce((sum, p) => sum + ((p.totalUnits || 0) - (p.availableUnits || 0)), 0);
            
            document.getElementById('overview-total').textContent = total;
            document.getElementById('overview-units').textContent = totalUnits;
            document.getElementById('overview-featured').textContent = featured;
            document.getElementById('overview-rented').textContent = rentedUnits;
            
            console.log(`📊 الإحصائيات المحلية: ${total} مشروع, ${featured} مميز`);
        }
        
        setupChart() {
            const chartCanvas = document.getElementById('projects-chart');
            if (!chartCanvas) return;
            
            if (this.chartInstance) {
                this.chartInstance.destroy();
            }
            
            const ctx = chartCanvas.getContext('2d');
            
            // ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅
            // ✅ تحديث ألوان المخطط لتكون داكنة (أسود، فضي، درجات رمادية)
            const darkColors = [
                '#121212', // أسود داكن جداً
                '#1E1E1E', // أسود داكن
                '#2C2C2C', // رمادي داكن جداً
                '#3A3A3A', // رمادي داكن
                '#4A4A4A', // رمادي متوسط داكن
                '#5A5A5A', // رمادي متوسط
                '#6A6A6A', // رمادي فاتح
                '#C0C0C0'  // فضي
            ];
            
            const borderColors = [
                '#000000', // أسود
                '#1A1A1A', // أسود داكن
                '#282828', // رمادي داكن جداً
                '#363636', // رمادي داكن
                '#464646', // رمادي متوسط داكن
                '#565656', // رمادي متوسط
                '#666666', // رمادي فاتح
                '#B0B0B0'  // فضي داكن
            ];
            
            const hoverColors = [
                '#1A1A1A', // أسود داكن عند التحويم
                '#282828', // رمادي داكن جداً عند التحويم
                '#363636', // رمادي داكن عند التحويم
                '#464646', // رمادي متوسط داكن عند التحويم
                '#565656', // رمادي متوسط عند التحويم
                '#666666', // رمادي فاتح عند التحويم
                '#767676', // رمادي فاتح جداً عند التحويم
                '#D0D0D0'  // فضي فاتح عند التحويم
            ];
            
            // بيانات افتراضية أولية
            const data = {
                labels: ['سكني', 'تجاري', 'صناعي', 'فندقي'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: [
                        darkColors[0],
                        darkColors[2],
                        darkColors[4],
                        darkColors[6]
                    ],
                    borderColor: [
                        borderColors[0],
                        borderColors[2],
                        borderColors[4],
                        borderColors[6]
                    ],
                    borderWidth: 2,
                    hoverBackgroundColor: [
                        hoverColors[0],
                        hoverColors[2],
                        hoverColors[4],
                        hoverColors[6]
                    ],
                    hoverBorderColor: 'rgba(255, 255, 255, 0.3)',
                    hoverBorderWidth: 3
                }]
            };
            
            this.chartInstance = new Chart(ctx, {
                type: 'pie',
                data: data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: '#F5F5F5',
                                font: {
                                    family: 'Tajawal',
                                    size: 12,
                                    weight: '500'
                                },
                                padding: 20,
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(25, 25, 25, 0.95)',
                            titleColor: '#F5F5F5',
                            bodyColor: '#F5F5F5',
                            borderColor: 'rgba(203, 205, 205, 0.3)',
                            borderWidth: 1,
                            cornerRadius: 8,
                            padding: 12,
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                    return `${label}: ${value} مشروع (${percentage}%)`;
                                }
                            }
                        }
                    },
                    animation: {
                        animateScale: true,
                        animateRotate: true,
                        duration: 1000,
                        easing: 'easeOutQuart'
                    }
                }
            });
            
            const periodSelect = document.getElementById('chart-period');
            if (periodSelect) {
                periodSelect.addEventListener('change', () => {
                    this.updateChartData();
                });
            }
            
            // تحديث المخطط بالبيانات الحالية
            setTimeout(() => {
                this.updateChartData();
            }, 1000);
        }
        
        updateChartData(stats = null) {
            if (!this.chartInstance) return;
            
            let typeCounts = {
                'سكني': 0,
                'تجاري': 0,
                'صناعي': 0,
                'فندقي': 0
            };
            
            if (stats && stats.typeDistribution) {
                typeCounts = stats.typeDistribution;
            } else {
                // حساب من البيانات المحلية
                this.projects.forEach(project => {
                    if (typeCounts.hasOwnProperty(project.projectType)) {
                        typeCounts[project.projectType]++;
                    }
                });
            }
            
            this.chartInstance.data.datasets[0].data = [
                typeCounts['سكني'],
                typeCounts['تجاري'],
                typeCounts['صناعي'],
                typeCounts['فندقي']
            ];
            
            this.chartInstance.update();
        }
        
        async updateRecentProjects() {
            try {
                const recentContainer = document.getElementById('recent-projects');
                if (!recentContainer) return;
                
                const response = await this.apiClient.request('/api/admin/projects/recent?limit=4');
                
                if (response.success) {
                    const recent = response.data || [];
                    
                    let html = '';
                    
                    if (recent.length === 0) {
                        html = `
                            <div class="empty-state">
                                <i class="fas fa-building"></i>
                                <p>لا توجد مشاريع حديثة</p>
                            </div>
                        `;
                    } else {
                        recent.forEach(project => {
                            const timeAgo = project.timeAgo || this.getTimeAgo(project.createdAt);
                            const statusClass = this.getStatusClass(project.status).replace('status-', '');
                            
                            html += `
                                <div class="recent-item">
                                    <div class="recent-item-icon">
                                        <i class="fas fa-building"></i>
                                    </div>
                                    <div class="recent-item-content">
                                        <div class="recent-item-header">
                                            <h5 class="recent-item-title">${project.projectName}</h5>
                                            <span class="recent-item-time">${timeAgo}</span>
                                        </div>
                                        <p class="recent-item-message">${project.city} - ${project.district || ''} | ${project.totalUnits || 0} وحدة</p>
                                        <span class="recent-item-status ${statusClass}">${this.getStatusText(project.status)}</span>
                                    </div>
                                </div>
                            `;
                        });
                    }
                    
                    recentContainer.innerHTML = html;
                }
            } catch (error) {
                console.error('❌ Error updating recent projects:', error);
                // تحديث من البيانات المحلية
                this.updateRecentProjectsFallback();
            }
        }
        
        updateRecentProjectsFallback() {
            const recentContainer = document.getElementById('recent-projects');
            if (!recentContainer) return;
            
            const recent = [...this.projects]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 4);
            
            let html = '';
            
            if (recent.length === 0) {
                html = `
                    <div class="empty-state">
                        <i class="fas fa-building"></i>
                        <p>لا توجد مشاريع حديثة</p>
                    </div>
                `;
            } else {
                recent.forEach(project => {
                    const timeAgo = this.getTimeAgo(project.createdAt);
                    const statusClass = this.getStatusClass(project.status).replace('status-', '');
                    
                    html += `
                        <div class="recent-item">
                            <div class="recent-item-icon">
                                <i class="fas fa-building"></i>
                            </div>
                            <div class="recent-item-content">
                                <div class="recent-item-header">
                                    <h5 class="recent-item-title">${project.projectName}</h5>
                                    <span class="recent-item-time">${timeAgo}</span>
                                </div>
                                <p class="recent-item-message">${project.city} - ${project.district || ''} | ${project.totalUnits || 0} وحدة</p>
                                <span class="recent-item-status ${statusClass}">${this.getStatusText(project.status)}</span>
                            </div>
                        </div>
                    `;
                });
            }
            
            recentContainer.innerHTML = html;
        }
        
        getTimeAgo(dateString) {
            if (!dateString) return '--';
            
            try {
                const date = new Date(dateString);
                const now = new Date();
                const diffMs = now - date;
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMs / 3600000);
                const diffDays = Math.floor(diffMs / 86400000);
                const diffMonths = Math.floor(diffDays / 30);
                const diffYears = Math.floor(diffDays / 365);
                
                if (diffMins < 1) {
                    return 'الآن';
                } else if (diffMins < 60) {
                    return `قبل ${diffMins} دقيقة`;
                } else if (diffHours < 24) {
                    return `قبل ${diffHours} ساعة`;
                } else if (diffDays < 30) {
                    return `قبل ${diffDays} يوم`;
                } else if (diffMonths < 12) {
                    return `قبل ${diffMonths} شهر`;
                } else {
                    return `قبل ${diffYears} سنة`;
                }
            } catch (error) {
                return dateString;
            }
        }
        
        showNotification(type, title, message) {
            // استخدام نظام الإشعارات الموجود
            if (window.Notifications && typeof window.Notifications.show === 'function') {
                window.Notifications.show({
                    type: type,
                    title: title,
                    message: message,
                    duration: 3000
                });
            } else {
                // بديل بسيط
                console.log(`${type.toUpperCase()}: ${title} - ${message}`);
                
                const notificationArea = document.getElementById('notification-area');
                if (notificationArea) {
                    const notification = document.createElement('div');
                    notification.className = `notification notification-${type}`;
                    notification.innerHTML = `
                        <div class="notification-icon">
                            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                        </div>
                        <div class="notification-content">
                            <h4 class="notification-title">${title}</h4>
                            <p class="notification-message">${message}</p>
                        </div>
                        <button class="notification-close">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                    
                    notificationArea.appendChild(notification);
                    
                    // إخفاء بعد 5 ثواني
                    setTimeout(() => {
                        notification.style.opacity = '0';
                        setTimeout(() => {
                            if (notification.parentNode) {
                                notification.parentNode.removeChild(notification);
                            }
                        }, 300);
                    }, 5000);
                    
                    // زر الإغلاق
                    notification.querySelector('.notification-close').addEventListener('click', () => {
                        notification.style.opacity = '0';
                        setTimeout(() => {
                            if (notification.parentNode) {
                                notification.parentNode.removeChild(notification);
                            }
                        }, 300);
                    });
                }
            }
        }
        
        showLoading() {
            const tableBody = document.getElementById('projects-table-body');
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr class="loading-row">
                        <td colspan="12">
                            <div class="loading-content">
                                <div class="loading-spinner"></div>
                                <span>جاري تحميل المشاريع من قاعدة البيانات...</span>
                            </div>
                        </td>
                    </tr>
                `;
            }
        }
    }
    
    // تهيئة الصفحة
    function initialize() {
        try {
            window.projectsManager = new ProjectsManager();
            console.log('✅ ProjectsManager initialized with real database connection');
            
            // اختبار API عند التحميل
            setTimeout(() => {
                console.log('🔧 النظام جاهز للاستخدام مع قاعدة البيانات الحقيقية');
            }, 1000);
            
        } catch (error) {
            console.error('❌ Failed to initialize ProjectsManager:', error);
        }
    }
    
    // تشغيل عند تحميل الصفحة
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();