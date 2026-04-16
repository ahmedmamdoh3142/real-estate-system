// Frontend/admin/pages/dashboard/dashboard.js - النسخة الديناميكية بالكامل معتمدة على API الصلاحيات
// تم التعديل: تحسين القائمة المنسدلة للمستخدم (تفتح وتغلق بالنقر فقط، وتبقى مفتوحة حتى النقر خارجها)
(function() {
    'use strict';
    
    console.log('✅ dashboard.js loaded - DYNAMIC PERMISSIONS VERSION');

    class Dashboard {
        constructor() {
            this.apiBaseUrl = '';
            this.charts = {};
            this.data = {
                stats: null,
                contracts: [],
                payments: [],
                inquiries: [],
                activities: [],
                notifications: []
            };
            
            this.isMobile = window.innerWidth <= 1200;
            
            // المستخدم الحالي والصلاحيات
            this.currentUser = this.getCurrentUser();
            this.permissions = this.getUserPermissions(); // مصفوفة أسماء الصلاحيات من localStorage
            
            if (!this.currentUser) {
                console.warn('⚠️ لا يوجد مستخدم مسجل الدخول، جاري التوجيه إلى صفحة تسجيل الدخول');
                window.location.href = '../login/index.html';
                return;
            }
            
            this.role = this.currentUser.role;
            console.log('👤 المستخدم الحالي:', this.currentUser);
            console.log('🎭 الدور:', this.role);
            console.log('📋 الصلاحيات المخزنة:', this.permissions);
            
            // تحديد ما إذا كان يسمح له برؤية الإحصائيات (صلاحية dashboard)
            this.canViewStats = this.permissions.includes('dashboard');
            
            this.init();
        }
        
        getCurrentUser() {
            try {
                const userData = localStorage.getItem('user_data');
                if (userData) {
                    return JSON.parse(userData);
                }
                if (window.AuthManager && window.AuthManager.getCurrentUser) {
                    return window.AuthManager.getCurrentUser();
                }
            } catch (error) {
                console.error('❌ خطأ في قراءة بيانات المستخدم:', error);
            }
            return null;
        }
        
        getUserPermissions() {
            try {
                const perms = localStorage.getItem('user_permissions');
                if (perms) {
                    return JSON.parse(perms);
                }
            } catch (e) {
                console.error('❌ خطأ في قراءة الصلاحيات:', e);
            }
            // إذا لم توجد صلاحيات، نعيد مصفوفة فارغة (لن يرى أي شيء)
            return [];
        }
        
        init() {
            console.log('🚀 Dashboard initializing with dynamic permissions...');
            
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setupDashboard());
            } else {
                this.setupDashboard();
            }
        }
        
        setupDashboard() {
            console.log('🔧 Setting up dashboard...');
            
            // تحديث معلومات المستخدم في الهيدر
            this.updateUserInfo();
            
            // بناء القائمة الجانبية بناءً على الصلاحيات
            this.buildSidebarFromPermissions();
            
            // تحديث الوقت والتاريخ
            this.updateDateTime();
            setInterval(() => this.updateDateTime(), 60000);
            
            // إعداد القائمة الجانبية (فتح/غلق)
            this.setupSidebar();
            
            // إعداد الإشعارات
            this.setupNotifications();
            
            // إعداد الأزرار
            this.setupButtons();
            
            // إظهار القسم المناسب (إحصائيات أو ترحيب)
            this.showAppropriateSection();
            
            // التحكم في الأزرار العائمة - تظهر فقط للمشرف العام (يمكن تغييرها لصلاحية معينة)
            const quickActions = document.querySelector('.quick-actions-floating');
            if (quickActions) {
                // نعرضها فقط إذا كان لديه صلاحية كاملة (يمكن تعديل الشرط حسب الحاجة)
                const hasFullAccess = this.permissions.includes('users') || this.permissions.includes('recruitment');
                if (!hasFullAccess) {
                    quickActions.style.display = 'none';
                } else {
                    quickActions.style.display = 'flex';
                }
            }
            
            // إذا كان يسمح له برؤية الإحصائيات (لديه صلاحية dashboard)، قم بتحميل البيانات
            if (this.canViewStats) {
                this.loadRealDataFromDatabase();
                this.setupTableTabs();
                this.setupChartFilters();
                
                // تحديث البيانات كل دقيقتين
                setInterval(() => this.refreshData(), 120000);
            }
            
            // إضافة حدث لتغيير الحجم
            window.addEventListener('resize', () => {
                this.handleResize();
            });
            
            // إعداد ميزات الجوال
            if (this.isMobile) {
                this.setupMobileFeatures();
            }
            
            // ===== إعداد القائمة المنسدلة للمستخدم (تحسين الإغلاق عند النقر خارجها) =====
            this.setupUserDropdown();
        }
        
        // ===== دالة جديدة لتحسين القائمة المنسدلة للمستخدم =====
        setupUserDropdown() {
            const userBtn = document.querySelector('.user-profile-btn');
            const dropdown = document.querySelector('.user-dropdown-content');
            
            if (!userBtn || !dropdown) return;
            
            // إزالة أي مستمعات سابقة (لضمان عدم تكرار)
            const newBtn = userBtn.cloneNode(true);
            userBtn.parentNode.replaceChild(newBtn, userBtn);
            const newDropdown = dropdown.cloneNode(true);
            dropdown.parentNode.replaceChild(newDropdown, dropdown);
            
            const finalBtn = document.querySelector('.user-profile-btn');
            const finalDropdown = document.querySelector('.user-dropdown-content');
            
            if (!finalBtn || !finalDropdown) return;
            
            // دالة فتح القائمة
            const openDropdown = () => {
                finalDropdown.classList.add('open');
            };
            
            // دالة إغلاق القائمة
            const closeDropdown = () => {
                finalDropdown.classList.remove('open');
            };
            
            // دالة تبديل الحالة
            const toggleDropdown = (e) => {
                e.stopPropagation();
                if (finalDropdown.classList.contains('open')) {
                    closeDropdown();
                } else {
                    openDropdown();
                }
            };
            
            // النقر على الزر يفتح/يغلق
            finalBtn.addEventListener('click', toggleDropdown);
            
            // النقر في أي مكان خارج القائمة والزر يغلقها
            document.addEventListener('click', function(event) {
                if (!finalBtn.contains(event.target) && !finalDropdown.contains(event.target)) {
                    closeDropdown();
                }
            });
            
            // منع إغلاق القائمة عند النقر داخلها (مثل اختيار عنصر)
            finalDropdown.addEventListener('click', function(e) {
                e.stopPropagation();
            });
            
            // عند النقر على أي عنصر داخل القائمة (مثل تسجيل الخروج أو الملف الشخصي)، نغلق القائمة
            const dropdownItems = finalDropdown.querySelectorAll('.dropdown-item');
            dropdownItems.forEach(item => {
                item.addEventListener('click', () => {
                    closeDropdown();
                });
            });
            
            console.log('✅ User dropdown configured with click-to-open and click-outside-to-close');
        }
        
        updateUserInfo() {
            const userNameElement = document.getElementById('user-name');
            const userRoleElement = document.getElementById('user-role');
            
            if (userNameElement && this.currentUser) {
                userNameElement.textContent = this.currentUser.fullName || this.currentUser.username || 'مستخدم';
            }
            
            if (userRoleElement && this.currentUser) {
                const roleMap = {
                    'مشرف_عام': 'مشرف عام',
                    'مدير_مشاريع': 'مدير مشاريع',
                    'محاسب': 'محاسب',
                    'خدمة_عملاء': 'خدمة عملاء',
                    'مبيعات': 'مبيعات',
                    'موارد_بشرية': 'موارد بشرية',
                    'موظف': 'موظف',
                    'موظف_استقبال': 'موظف استقبال'
                };
                userRoleElement.textContent = roleMap[this.currentUser.role] || this.currentUser.role;
            }
        }
        
        buildSidebarFromPermissions() {
            const sidebarNav = document.getElementById('sidebar-nav');
            if (!sidebarNav) return;
            
            sidebarNav.innerHTML = ''; // تفريغ المحتوى القديم
            
            // تعريف جميع عناصر القائمة الممكنة مع مفتاح الصلاحية المطلوب
            const allMenuItems = [
                {
                    section: 'الرئيسية',
                    items: [
                        { id: 'dashboard', title: 'لوحة التحكم', icon: 'fas fa-tachometer-alt', link: 'index.html', permission: 'dashboard' }
                    ]
                },
                {
                    section: 'إدارة العقارات',
                    items: [
                        { id: 'projects', title: 'المشاريع', icon: 'fas fa-building', link: '../projects-management/index.html', permission: 'projects' },
                        { id: 'contracts', title: 'العقود', icon: 'fas fa-file-contract', link: '../contracts/index.html', permission: 'contracts' },
                        { id: 'payments', title: 'المدفوعات', icon: 'fas fa-money-bill-wave', link: '../payments/index.html', permission: 'payments' },
                        { id: 'invoices', title: 'الفواتير', icon: 'fas fa-file-invoice', link: '../bills/index.html', permission: 'invoices' }
                    ]
                },
                {
                    section: 'إدارة العملاء',
                    items: [
                        { id: 'inquiries', title: 'الاستفسارات', icon: 'fas fa-headset', link: '../inquiries/index.html', permission: 'inquiries' },
                        { id: 'clients', title: 'العملاء', icon: 'fas fa-users', link: '../leeds/index.html', permission: 'clients' }
                    ]
                },
                {
                    section: 'الإدارة',
                    items: [
                        { id: 'users', title: 'المستخدمين', icon: 'fas fa-user-cog', link: '../users/index.html', permission: 'users' },
                        { id: 'recruitment', title: 'التوظيف', icon: 'fas fa-user-plus', link: '../job-management/index.html', permission: 'recruitment' },
                        { id: 'tasks', title: 'المهمات', icon: 'fas fa-plus-circle', link: '../tasks/index.html', permission: 'tasks' }
                    ]
                }
            ];
            
            // تصفية العناصر المسموح بها بناءً على this.permissions
            const filteredSections = allMenuItems.map(section => {
                const filteredItems = section.items.filter(item => this.permissions.includes(item.permission));
                return { ...section, items: filteredItems };
            }).filter(section => section.items.length > 0);
            
            // بناء HTML
            filteredSections.forEach(section => {
                const sectionDiv = document.createElement('div');
                sectionDiv.className = 'nav-section';
                
                const sectionTitle = document.createElement('h3');
                sectionTitle.className = 'section-title';
                sectionTitle.textContent = section.section;
                sectionDiv.appendChild(sectionTitle);
                
                const ul = document.createElement('ul');
                ul.className = 'nav-links';
                
                section.items.forEach(item => {
                    const li = document.createElement('li');
                    li.className = 'nav-item';
                    if (item.link === 'index.html' || window.location.pathname.includes(item.link)) {
                        li.classList.add('active');
                    }
                    
                    const a = document.createElement('a');
                    a.href = item.link;
                    a.className = 'nav-link';
                    a.innerHTML = `
                        <div class="nav-icon">
                            <i class="${item.icon}"></i>
                        </div>
                        <span class="nav-text">${item.title}</span>
                    `;
                    
                    li.appendChild(a);
                    ul.appendChild(li);
                });
                
                sectionDiv.appendChild(ul);
                sidebarNav.appendChild(sectionDiv);
            });
            
            console.log('✅ Sidebar built with sections:', filteredSections.length);
        }
        
        showAppropriateSection() {
            const statsSection = document.getElementById('stats-section');
            const welcomeSection = document.getElementById('welcome-section');
            
            if (!statsSection || !welcomeSection) return;
            
            if (this.canViewStats) {
                statsSection.style.display = 'block';
                welcomeSection.style.display = 'none';
            } else {
                statsSection.style.display = 'none';
                welcomeSection.style.display = 'block';
                // يمكن تخصيص رسالة الترحيب
                const welcomeMessage = welcomeSection.querySelector('h2');
                if (welcomeMessage) {
                    welcomeMessage.textContent = `مرحباً ${this.currentUser.fullName || ''}`;
                }
            }
        }
        
        updateDateTime() {
            const now = new Date();
            const dateElement = document.getElementById('date-display');
            const timeElement = document.getElementById('system-time');
            const lastUpdateElement = document.getElementById('last-update-time');
            
            if (dateElement) {
                const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                dateElement.textContent = now.toLocaleDateString('ar-SA', options);
            }
            
            if (timeElement) {
                timeElement.textContent = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            }
            
            if (lastUpdateElement) {
                lastUpdateElement.textContent = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
            }
        }
        
        setupSidebar() {
            const menuToggle = document.getElementById('menu-toggle');
            const sidebar = document.getElementById('dashboard-sidebar');
            const sidebarClose = document.getElementById('sidebar-close');
            
            this.createOverlay();
            
            if (menuToggle && sidebar) {
                menuToggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleSidebar();
                });
            }
            
            if (sidebarClose && sidebar) {
                sidebarClose.addEventListener('click', () => this.closeSidebar());
            }
            
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', () => { if (this.isMobile) this.closeSidebar(); });
            });
            
            const overlay = document.querySelector('.overlay');
            if (overlay) overlay.addEventListener('click', () => this.closeSidebar());
        }
        
        createOverlay() {
            let overlay = document.querySelector('.overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'overlay';
                overlay.style.display = 'none';
                overlay.style.position = 'fixed';
                overlay.style.top = '0';
                overlay.style.right = '0';
                overlay.style.bottom = '0';
                overlay.style.left = '0';
                overlay.style.background = 'rgba(0, 0, 0, 0.7)';
                overlay.style.backdropFilter = 'blur(5px)';
                overlay.style.zIndex = '1004';
                overlay.style.transition = 'opacity 0.3s ease';
                overlay.addEventListener('click', () => this.closeSidebar());
                document.body.appendChild(overlay);
            }
            return overlay;
        }
        
        toggleSidebar() {
            const sidebar = document.getElementById('dashboard-sidebar');
            const overlay = document.querySelector('.overlay');
            if (sidebar.classList.contains('active')) {
                this.closeSidebar();
            } else {
                this.openSidebar();
            }
        }
        
        openSidebar() {
            const sidebar = document.getElementById('dashboard-sidebar');
            const overlay = document.querySelector('.overlay');
            const body = document.body;
            sidebar.classList.add('active');
            if (overlay) {
                overlay.style.display = 'block';
                setTimeout(() => overlay.classList.add('active'), 10);
            }
            if (this.isMobile) body.style.overflow = 'hidden';
        }
        
        closeSidebar() {
            const sidebar = document.getElementById('dashboard-sidebar');
            const overlay = document.querySelector('.overlay');
            const body = document.body;
            sidebar.classList.remove('active');
            if (overlay) {
                overlay.classList.remove('active');
                setTimeout(() => overlay.style.display = 'none', 300);
            }
            body.style.overflow = '';
        }
        
        setupNotifications() {
            const notificationsBtn = document.getElementById('notifications-btn');
            const markAllReadBtn = document.querySelector('.mark-all-read');
            
            if (notificationsBtn) {
                notificationsBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const dropdown = notificationsBtn.nextElementSibling;
                    if (dropdown) dropdown.classList.toggle('show');
                });
            }
            
            if (markAllReadBtn) {
                markAllReadBtn.addEventListener('click', () => this.markAllNotificationsAsRead());
            }
            
            document.addEventListener('click', () => {
                const dropdowns = document.querySelectorAll('.notifications-dropdown-content.show, .user-dropdown-content.show');
                dropdowns.forEach(dropdown => dropdown.classList.remove('show'));
            });
        }
        
        setupButtons() {
            const refreshBtn = document.getElementById('refresh-btn');
            const quickActions = document.querySelectorAll('.quick-action-btn');
            
            if (refreshBtn) refreshBtn.addEventListener('click', () => this.refreshData());
            
            quickActions.forEach(btn => {
                btn.addEventListener('click', (e) => this.handleQuickAction(e.currentTarget.id));
            });
            
            // تم نقل إعداد قائمة المستخدم إلى دالة منفصلة setupUserDropdown
        }
        
        setupTableTabs() {
            const tabs = document.querySelectorAll('.table-tab');
            tabs.forEach(tab => {
                tab.addEventListener('click', (e) => {
                    const tableType = e.currentTarget.dataset.table;
                    tabs.forEach(t => t.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                    const tableContents = document.querySelectorAll('.table-content');
                    tableContents.forEach(content => content.classList.remove('active'));
                    const targetTable = document.getElementById(`${tableType}-table-content`);
                    if (targetTable) targetTable.classList.add('active');
                    this.updateViewAllLink(tableType);
                });
            });
            this.updateViewAllLink('contracts');
        }
        
        updateViewAllLink(tableType) {
            const viewAllLink = document.getElementById('view-all-link');
            if (!viewAllLink) return;
            const links = {
                contracts: '../contracts/index.html',
                payments: '../payments/index.html',
                inquiries: '../inquiries/index.html'
            };
            viewAllLink.href = links[tableType] || '#';
        }
        
        setupChartFilters() {
            const revenuePeriodSelect = document.getElementById('revenue-period');
            if (revenuePeriodSelect) {
                revenuePeriodSelect.addEventListener('change', (e) => {
                    const period = e.target.value;
                    this.loadRevenueChartData(period);
                });
            }
            
            const projectsFilterSelect = document.getElementById('projects-filter');
            if (projectsFilterSelect) {
                projectsFilterSelect.addEventListener('change', (e) => {
                    const filterBy = e.target.value;
                    this.loadProjectsChartData(filterBy);
                });
            }
        }
        
        refreshData() {
            console.log('🔄 Refreshing dashboard data from database...');
            const refreshBtn = document.getElementById('refresh-btn');
            if (refreshBtn) {
                refreshBtn.classList.add('loading');
                refreshBtn.disabled = true;
            }
            this.loadRealDataFromDatabase();
            setTimeout(() => {
                if (refreshBtn) {
                    refreshBtn.classList.remove('loading');
                    refreshBtn.disabled = false;
                }
                this.showSuccess('تم تحديث البيانات بنجاح');
            }, 2000);
        }
        
        async loadRealDataFromDatabase() {
            try {
                console.log('📊 Loading dashboard data from REAL DATABASE...');
                
                this.showLoading(true);
                
                const response = await fetch(`${this.apiBaseUrl}/all-data`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    cache: 'no-cache'
                });
                
                console.log('🔍 API Response Status:', response.status);
                
                if (!response.ok) throw new Error(`HTTP ${response.status} - ${response.statusText}`);
                
                const result = await response.json();
                
                if (result.success) {
                    const data = result.data;
                    console.log('✅ تم تحميل البيانات بنجاح من قاعدة البيانات:', data);
                    
                    this.data.stats = data.stats;
                    this.data.contracts = data.contracts || [];
                    this.data.payments = data.payments || [];
                    this.data.inquiries = data.inquiries || [];
                    this.data.activities = data.activities || [];
                    this.data.notifications = data.notifications || [];
                    
                    this.displayStats(data.stats);
                    this.displayRecentContracts(data.contracts || []);
                    this.displayRecentPayments(data.payments || []);
                    this.displayRecentInquiries(data.inquiries || []);
                    this.displayActivities(data.activities || []);
                    this.displayNotifications(data.notifications || []);
                    
                    this.updateSidebarBadges(data.stats);
                    this.updateTabBadges();
                    
                    if (data.charts) {
                        this.initChartsWithRealData(data.charts);
                    }
                    
                    this.showSuccess('تم تحميل البيانات من قاعدة البيانات بنجاح');
                } else {
                    throw new Error(result.message || 'فشل في جلب البيانات من قاعدة البيانات');
                }
                
            } catch (error) {
                console.error('❌ Error loading real data from database:', error);
                this.showError('فشل في تحميل البيانات من قاعدة البيانات: ' + error.message);
                await this.loadSeparateAPIs();
            } finally {
                this.showLoading(false);
            }
        }
        
        async loadSeparateAPIs() {
            try {
                console.log('🔄 محاولة جلب البيانات من APIs منفصلة...');
                
                const endpoints = [
                    { name: 'stats', url: `${this.apiBaseUrl}/stats`, fallback: () => this.data.stats = this.getDefaultStats() },
                    { name: 'contracts', url: `${this.apiBaseUrl}/recent-contracts?limit=5`, fallback: () => this.data.contracts = this.getDefaultContracts() },
                    { name: 'payments', url: `${this.apiBaseUrl}/recent-payments?limit=5`, fallback: () => this.data.payments = this.getDefaultPayments() },
                    { name: 'inquiries', url: `${this.apiBaseUrl}/recent-inquiries?limit=5`, fallback: () => this.data.inquiries = this.getDefaultInquiries() }
                ];
                
                const promises = endpoints.map(async (endpoint) => {
                    try {
                        console.log(`📡 جلب ${endpoint.name}...`);
                        const response = await fetch(endpoint.url);
                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                        const result = await response.json();
                        if (result.success) {
                            switch(endpoint.name) {
                                case 'stats':
                                    this.data.stats = result.data;
                                    this.displayStats(result.data);
                                    this.updateSidebarBadges(result.data);
                                    break;
                                case 'contracts':
                                    this.data.contracts = result.data;
                                    this.displayRecentContracts(result.data);
                                    break;
                                case 'payments':
                                    this.data.payments = result.data;
                                    this.displayRecentPayments(result.data);
                                    break;
                                case 'inquiries':
                                    this.data.inquiries = result.data;
                                    this.displayRecentInquiries(result.data);
                                    break;
                            }
                            console.log(`✅ تم تحميل ${endpoint.name} بنجاح`);
                        } else {
                            throw new Error(result.message || 'فشل في API');
                        }
                    } catch (error) {
                        console.warn(`⚠️ فشل تحميل ${endpoint.name}:`, error.message);
                        endpoint.fallback();
                    }
                });
                
                await Promise.all(promises);
                await this.loadChartsData();
                
            } catch (error) {
                console.error('❌ Error loading separate APIs:', error);
                this.showError('فشل في الاتصال بالخادم');
                this.loadStaticDataAsFallback();
            }
        }
        
        async loadChartsData() {
            try {
                console.log('📈 Loading charts data...');
                
                const revenueResponse = await fetch(`${this.apiBaseUrl}/monthly-revenue`);
                const revenueResult = await revenueResponse.json();
                
                const projectsResponse = await fetch(`${this.apiBaseUrl}/projects-by-type`);
                const projectsResult = await projectsResponse.json();
                
                if (revenueResult.success && projectsResult.success) {
                    this.initChartsWithRealData({
                        monthlyRevenue: revenueResult.data,
                        projectsByType: projectsResult.data
                    });
                } else {
                    throw new Error('فشل في جلب بيانات الرسوم البيانية');
                }
                
            } catch (error) {
                console.error('❌ Error loading charts data:', error);
                this.initChartsWithSeparateAPIs();
            }
        }
        
        async loadRevenueChartData(period) {
            try {
                console.log(`📈 جلب بيانات الإيرادات (${period})...`);
                const response = await fetch(`${this.apiBaseUrl}/monthly-revenue?period=${period}`);
                const result = await response.json();
                
                if (result.success) {
                    const { labels, data } = result.data;
                    this.updateRevenueChart(labels, data);
                    
                    const totalRevenue = data.reduce((a, b) => a + b, 0);
                    const averageRevenue = data.length > 0 ? Math.round(totalRevenue / data.length) : 0;
                    
                    const totalElement = document.getElementById('revenue-total');
                    const averageElement = document.getElementById('revenue-average');
                    
                    if (totalElement) totalElement.textContent = this.formatCurrency(totalRevenue);
                    if (averageElement) averageElement.textContent = this.formatCurrency(averageRevenue);
                }
            } catch (error) {
                console.error('❌ خطأ في تحميل بيانات الإيرادات:', error);
                this.updateRevenueChartWithDefault();
            }
        }
        
        async loadProjectsChartData(filterBy) {
            try {
                console.log(`📊 جلب توزيع المشاريع حسب ${filterBy === 'type' ? 'النوع' : 'المدينة'}...`);
                const response = await fetch(`${this.apiBaseUrl}/projects-by-type?filter=${filterBy}`);
                const result = await response.json();
                
                if (result.success) {
                    const { labels, data, colors } = result.data;
                    this.updateProjectsChart(labels, data, colors);
                }
            } catch (error) {
                console.error('❌ خطأ في تحميل توزيع المشاريع:', error);
                this.updateProjectsChartWithDefault();
            }
        }
        
        showLoading(show) {
            if (!this.canViewStats) return;
            
            const loadingElements = document.querySelectorAll('.loading-row, .loading-projects, .activity-item.loading');
            if (show) {
                const tableBodies = document.querySelectorAll('.data-table tbody');
                tableBodies.forEach(tbody => {
                    if (tbody.children.length === 0 || !tbody.querySelector('.loading-row')) {
                        tbody.innerHTML = `<tr class="loading-row"><td colspan="6"><div class="loading-spinner"></div><span>جاري تحميل البيانات من قاعدة البيانات...</span></tr></tr>`;
                    }
                });
            } else {
                loadingElements.forEach(element => { if (element.parentNode) element.parentNode.removeChild(element); });
            }
        }
        
        formatCurrency(amount) {
            if (!amount && amount !== 0) return '0 ر.س';
            const num = parseFloat(amount);
            if (isNaN(num)) return '0 ر.س';
            if (num >= 1000000) return (num / 1000000).toFixed(1).replace('.0', '') + ' مليون ر.س';
            if (num >= 1000) return (num / 1000).toFixed(0) + ' ألف ر.س';
            return num.toLocaleString('ar-SA') + ' ر.س';
        }
        
        formatDate(dateString) {
            if (!dateString) return '--/--/----';
            const date = new Date(dateString);
            return date.toLocaleDateString('ar-SA');
        }
        
        getTimeAgo(timestamp) {
            if (!timestamp) return 'قبل قليل';
            const now = new Date();
            const past = new Date(timestamp);
            const diff = now - past;
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(diff / 3600000);
            const days = Math.floor(diff / 86400000);
            if (minutes < 1) return 'الآن';
            if (minutes < 60) return `قبل ${minutes} دقيقة`;
            if (hours < 24) return `قبل ${hours} ساعة`;
            if (days < 7) return `قبل ${days} يوم`;
            return past.toLocaleDateString('ar-SA');
        }
        
        getContractStatusClass(status) {
            const statusMap = { 'نشط': 'status-active', 'معلق': 'status-pending', 'مكتمل': 'status-completed', 'ملغي': 'status-cancelled', 'جاهز': 'status-active' };
            return statusMap[status] || 'status-pending';
        }
        
        getContractStatusText(status) {
            const statusMap = { 'نشط': 'نشط', 'معلق': 'معلق', 'مكتمل': 'مكتمل', 'ملغي': 'ملغي', 'جاهز': 'نشط' };
            return statusMap[status] || status || 'معلق';
        }
        
        getInquiryStatusClass(status) {
            const statusMap = { 'جديد': 'status-new', 'تحت_المراجعة': 'status-pending', 'تم_الرد': 'status-active', 'مكتمل': 'status-completed' };
            return statusMap[status] || 'status-new';
        }
        
        getInquiryStatusText(status) {
            const statusMap = { 'جديد': 'جديد', 'تحت_المراجعة': 'قيد المراجعة', 'تم_الرد': 'تم الرد', 'مكتمل': 'مكتمل' };
            return statusMap[status] || status || 'جديد';
        }
        
        getActivityIcon(type) {
            const iconMap = { 'system': 'fas fa-cog', 'user': 'fas fa-user', 'contract': 'fas fa-file-contract', 'payment': 'fas fa-money-bill-wave', 'project': 'fas fa-building', 'notification': 'fas fa-bell', 'inquiry': 'fas fa-headset' };
            return iconMap[type] || 'fas fa-circle';
        }
        
        getNotificationIcon(type) {
            const iconMap = { 'دفعة': 'fas fa-money-bill-wave', 'تذكير': 'fas fa-clock', 'معلومات': 'fas fa-info-circle', 'تحذير': 'fas fa-exclamation-triangle', 'نجاح': 'fas fa-check-circle' };
            return iconMap[type] || 'fas fa-bell';
        }
        
        animateCounter(element, targetValue) {
            if (!element) return;
            if (typeof targetValue === 'string') { element.textContent = targetValue; return; }
            const current = parseInt(element.textContent.replace(/[^0-9]/g, '')) || 0;
            const target = targetValue;
            if (current === target) return;
            const duration = 1000;
            const steps = 60;
            const increment = (target - current) / steps;
            let currentStep = 0;
            const timer = setInterval(() => {
                currentStep++;
                const newValue = Math.floor(current + (increment * currentStep));
                if (currentStep >= steps || (increment > 0 && newValue >= target) || (increment < 0 && newValue <= target)) {
                    element.textContent = target.toLocaleString('ar-SA');
                    clearInterval(timer);
                } else {
                    element.textContent = newValue.toLocaleString('ar-SA');
                }
            }, duration / steps);
        }
        
        updateSidebarBadges(stats) {
            if (!stats) return;
            const badges = {
                'projects-badge': stats.totalProjects || 0,
                'contracts-badge': stats.totalContracts || 0,
                'payments-badge': stats.totalPayments || 0,
                'inquiries-badge': stats.totalInquiries || 0,
                'clients-badge': stats.totalClients || 0
            };
            Object.entries(badges).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) {
                    if (value > 0) {
                        element.textContent = value > 99 ? '99+' : value;
                        element.style.display = 'flex';
                    } else {
                        element.style.display = 'none';
                    }
                }
            });
        }
        
        updateTabBadges() {
            const badges = {
                'contracts-tab-badge': this.data.contracts.length || 0,
                'payments-tab-badge': this.data.payments.length || 0,
                'inquiries-tab-badge': this.data.inquiries.length || 0
            };
            Object.entries(badges).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) {
                    if (value > 0) {
                        element.textContent = value > 99 ? '99+' : value;
                        element.style.display = 'flex';
                    } else {
                        element.style.display = 'none';
                    }
                }
            });
        }
        
        handleQuickAction(actionId) {
            switch(actionId) {
                case 'quick-add-project': window.location.href = '../projects-management/index.html?action=add'; break;
                case 'quick-add-contract': window.location.href = '../contracts/index.html?action=add'; break;
                case 'quick-notification': window.location.href = '../payments/index.html?action=add'; break;
            }
        }
        
        markAllNotificationsAsRead() {
            this.data.notifications.forEach(notification => notification.isRead = true);
            const badge = document.getElementById('notifications-badge');
            if (badge) badge.style.display = 'none';
            this.displayNotifications(this.data.notifications);
            this.showSuccess('تم تحديد جميع الإشعارات كمقروءة');
        }
        
        showSuccess(message) { if (window.Notifications) window.Notifications.show({ type: 'success', title: 'تم بنجاح', message, duration: 3000 }); }
        showError(message) { if (window.Notifications) window.Notifications.show({ type: 'error', title: 'خطأ', message, duration: 5000 }); }
        showInfo(message) { if (window.Notifications) window.Notifications.show({ type: 'info', title: 'معلومة', message, duration: 3000 }); }
        
        getDefaultStats() {
            return {
                totalProjects: 5, availableUnits: 60, featuredProjects: 4, activeProjects: 5,
                totalContracts: 2, activeContracts: 2, completedContracts: 0,
                totalPayments: 2, totalRevenue: 47000, monthlyRevenue: 47000,
                totalClients: 2, newClients: 0, totalInquiries: 3, newInquiries: 0, totalUsers: 4
            };
        }
        
        getDefaultContracts() {
            return [
                { id: 1, contractNumber: 'CON-2024-001', customerName: 'محمد العتيبي', projectName: 'فيلات النخيل الراقية', totalAmount: 420000, paidAmount: 42000, remainingAmount: 378000, status: 'نشط', startDate: '2024-06-01', createdAt: '2024-05-20T14:00:00.000Z' },
                { id: 2, contractNumber: 'CON-2024-002', customerName: 'شركة التقنية المتطورة', projectName: 'أبراج الأعمال التجارية', totalAmount: 144000, paidAmount: 144000, remainingAmount: 0, status: 'نشط', startDate: '2024-01-01', createdAt: '2023-12-20T11:00:00.000Z' }
            ];
        }
        
        getDefaultPayments() {
            return [
                { id: 1, paymentNumber: 'PAY-2024-001', customerName: 'محمد العتيبي', amount: 35000, paymentMethod: 'تحويل بنكي', paymentDate: '2024-05-25', status: 'مؤكد', receiptNumber: 'RC-2024-0001' },
                { id: 2, paymentNumber: 'PAY-2024-002', customerName: 'شركة التقنية المتطورة', amount: 12000, paymentMethod: 'شيك', paymentDate: '2024-01-01', status: 'مؤكد', receiptNumber: 'RC-2024-0002' }
            ];
        }
        
        getDefaultInquiries() {
            return [
                { id: 3, inquiryCode: 'INQ-2024-003', customerName: 'عائشة القحطاني', projectName: 'شقق السفير المتميزة', inquiryType: 'استفسار عام', status: 'جديد', createdAt: '2024-05-18T09:15:00.000Z' }
            ];
        }
        
        loadStaticDataAsFallback() {
            console.log('📋 Loading static data as fallback...');
            this.data.stats = this.getDefaultStats();
            this.data.contracts = this.getDefaultContracts();
            this.data.payments = this.getDefaultPayments();
            this.data.inquiries = this.getDefaultInquiries();
            
            this.displayStats(this.data.stats);
            this.displayRecentContracts(this.data.contracts);
            this.displayRecentPayments(this.data.payments);
            this.displayRecentInquiries(this.data.inquiries);
            
            this.updateSidebarBadges(this.data.stats);
            this.updateTabBadges();
            
            this.initChartsWithSeparateAPIs();
            this.showError('يتم استخدام بيانات ثابتة بسبب مشكلة في الاتصال بالخادم');
        }
        
        displayStats(stats) {
            if (!stats || !this.canViewStats) return;
            console.log('📈 Displaying real stats:', stats);
            
            const totalProjectsElement = document.getElementById('total-projects-count');
            if (totalProjectsElement) this.animateCounter(totalProjectsElement, stats.totalProjects || 5);
            
            const availableProjectsElement = document.getElementById('available-projects-count');
            if (availableProjectsElement) availableProjectsElement.textContent = stats.availableUnits || 60;
            
            const totalContractsElement = document.getElementById('total-contracts-count');
            if (totalContractsElement) this.animateCounter(totalContractsElement, stats.totalContracts || 2);
            
            const activeContractsElement = document.getElementById('active-contracts-count');
            if (activeContractsElement) activeContractsElement.textContent = stats.activeContracts || 2;
            
            const totalRevenueElement = document.getElementById('total-revenue');
            if (totalRevenueElement) totalRevenueElement.innerHTML = `${this.formatCurrency(stats.totalRevenue || 47000)}`;
            
            const monthlyRevenueElement = document.getElementById('monthly-revenue');
            if (monthlyRevenueElement) monthlyRevenueElement.textContent = this.formatCurrency(stats.monthlyRevenue || 47000);
            
            const totalClientsElement = document.getElementById('total-clients-count');
            if (totalClientsElement) this.animateCounter(totalClientsElement, stats.totalClients || 2);
            
            const newClientsElement = document.getElementById('new-clients-count');
            if (newClientsElement) newClientsElement.textContent = stats.newClients || 0;
        }
        
        displayRecentContracts(contracts) {
            if (!this.canViewStats) return;
            const tbody = document.querySelector('#contracts-table-content tbody');
            if (!tbody) return;
            tbody.innerHTML = '';
            
            if (!contracts || contracts.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" class="no-data"><i class="fas fa-folder-open"></i><span>لا توجد عقود حديثة</span></td></tr>`;
                return;
            }
            
            contracts.forEach(contract => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${contract.contractNumber || 'غير محدد'}</td>
                    <td>${contract.customerName || 'غير محدد'}</td>
                    <td>${contract.projectName || 'غير محدد'}</td>
                    <td>${this.formatCurrency(contract.totalAmount || 0)}</td>
                    <td><span class="status-badge ${this.getContractStatusClass(contract.status)}">${this.getContractStatusText(contract.status)}</span></td>
                `;
                tbody.appendChild(row);
            });
        }
        
        displayRecentPayments(payments) {
            if (!this.canViewStats) return;
            const tbody = document.querySelector('#payments-table-content tbody');
            if (!tbody) return;
            tbody.innerHTML = '';
            
            if (!payments || payments.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="no-data"><i class="fas fa-money-bill-wave"></i><span>لا توجد مدفوعات حديثة</span></td></tr>`;
                return;
            }
            
            payments.forEach(payment => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${payment.receiptNumber || payment.paymentNumber || 'غير محدد'}</td>
                    <td>${payment.customerName || 'غير محدد'}</td>
                    <td>${this.formatCurrency(payment.amount || 0)}</td>
                    <td>${payment.paymentMethod || 'غير محدد'}</td>
                    <td>${this.formatDate(payment.paymentDate)}</td>
                    <td><span class="status-badge ${payment.status === 'مؤكد' ? 'status-active' : 'status-pending'}">${payment.status === 'مؤكد' ? 'مؤكد' : 'معلق'}</span></td>
                `;
                tbody.appendChild(row);
            });
        }
        
        displayRecentInquiries(inquiries) {
            if (!this.canViewStats) return;
            const tbody = document.querySelector('#inquiries-table-content tbody');
            if (!tbody) return;
            tbody.innerHTML = '';
            
            if (!inquiries || inquiries.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="no-data"><i class="fas fa-headset"></i><span>لا توجد استفسارات حديثة</span></td></tr>`;
                return;
            }
            
            inquiries.forEach(inquiry => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${inquiry.inquiryCode || 'غير محدد'}</td>
                    <td>${inquiry.customerName || 'غير محدد'}</td>
                    <td>${inquiry.projectName || 'غير محدد'}</td>
                    <td>${inquiry.inquiryType || 'استفسار عام'}</td>
                    <td>${this.formatDate(inquiry.createdAt)}</td>
                    <td><span class="status-badge ${this.getInquiryStatusClass(inquiry.status)}">${this.getInquiryStatusText(inquiry.status)}</span></td>
                `;
                tbody.appendChild(row);
            });
        }
        
        displayActivities(activities) {
            if (!this.canViewStats) return;
            const container = document.getElementById('activity-list');
            if (!container) return;
            container.innerHTML = '';
            if (!activities || activities.length === 0) {
                container.innerHTML = `<div class="activity-item"><div class="activity-icon"><i class="fas fa-info-circle"></i></div><div class="activity-content"><p>لا توجد نشاطات حديثة</p><span class="activity-time">الآن</span></div></div>`;
                return;
            }
            activities.forEach(activity => {
                const item = document.createElement('div');
                item.className = 'activity-item';
                item.dataset.type = activity.type || 'system';
                item.innerHTML = `<div class="activity-icon"><i class="${this.getActivityIcon(activity.type)}"></i></div><div class="activity-content"><p>${activity.message || 'نشاط جديد'}</p><span class="activity-time">${this.getTimeAgo(activity.timestamp)}</span></div>`;
                container.appendChild(item);
            });
        }
        
        displayNotifications(notifications) {
            const container = document.getElementById('notifications-list');
            const badge = document.getElementById('notifications-badge');
            if (!container) return;
            container.innerHTML = '';
            const unreadCount = notifications.filter(n => !n.isRead).length;
            if (badge) {
                if (unreadCount > 0) {
                    badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                    badge.style.display = 'flex';
                } else {
                    badge.style.display = 'none';
                }
            }
            if (!notifications || notifications.length === 0) {
                container.innerHTML = `<div class="notification-item"><div class="notification-icon"><i class="fas fa-bell-slash"></i></div><div class="notification-content"><p>لا توجد إشعارات جديدة</p><span class="notification-time">الآن</span></div></div>`;
                return;
            }
            notifications.slice(0, 5).forEach(notification => {
                const item = document.createElement('div');
                item.className = `notification-item ${notification.isRead ? 'read' : 'unread'}`;
                item.innerHTML = `<div class="notification-icon"><i class="${this.getNotificationIcon(notification.type)}"></i></div><div class="notification-content"><h4>${notification.title || 'إشعار جديد'}</h4><p>${notification.message || 'لا يوجد محتوى'}</p><span class="notification-time">${this.getTimeAgo(notification.createdAt)}</span></div>`;
                container.appendChild(item);
            });
        }
        
        initChartsWithRealData(chartsData) {
            if (!this.canViewStats) return;
            try {
                console.log('📈 Initializing charts with REAL DATABASE DATA...');
                
                const revenueCtx = document.getElementById('revenueChart');
                if (revenueCtx) {
                    let labels = chartsData.monthlyRevenue?.labels || [];
                    let data = chartsData.monthlyRevenue?.data || [];
                    
                    if (!labels.length || !data.length) {
                        const currentDate = new Date();
                        const months = [];
                        for (let i = 5; i >= 0; i--) {
                            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
                            months.push(date.toLocaleDateString('ar-SA', { month: 'long' }));
                        }
                        labels = months;
                        data = [15000, 18000, 22000, 19000, 25000, 47000];
                    }
                    
                    if (this.charts.revenue) this.charts.revenue.destroy();
                    
                    this.charts.revenue = new Chart(revenueCtx.getContext('2d'), {
                        type: 'line',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: 'الإيرادات',
                                data: data,
                                borderColor: 'rgba(203, 205, 205, 0.8)',
                                backgroundColor: 'rgba(203, 205, 205, 0.1)',
                                borderWidth: 2,
                                fill: true,
                                tension: 0.4,
                                pointBackgroundColor: 'rgba(203, 205, 205, 1)',
                                pointBorderColor: '#fff',
                                pointBorderWidth: 2,
                                pointRadius: this.isMobile ? 3 : 4,
                                pointHoverRadius: this.isMobile ? 4 : 6
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    rtl: true,
                                    backgroundColor: 'rgba(20, 20, 20, 0.9)',
                                    titleColor: '#fff',
                                    bodyColor: '#fff',
                                    borderColor: 'rgba(203, 205, 205, 0.2)',
                                    borderWidth: 1,
                                    callbacks: {
                                        label: (context) => `الإيرادات: ${this.formatCurrency(context.parsed.y)}`
                                    }
                                }
                            },
                            scales: {
                                x: {
                                    grid: { color: 'rgba(203, 205, 205, 0.05)', drawBorder: false },
                                    ticks: { color: 'rgba(203, 205, 205, 0.7)', font: { size: this.isMobile ? 10 : 12 } }
                                },
                                y: {
                                    beginAtZero: true,
                                    grid: { color: 'rgba(203, 205, 205, 0.05)', drawBorder: false },
                                    ticks: {
                                        color: 'rgba(203, 205, 205, 0.7)',
                                        font: { size: this.isMobile ? 10 : 12 },
                                        callback: (value) => value >= 1000 ? (value / 1000) + ' ألف' : value
                                    }
                                }
                            }
                        }
                    });
                    
                    const totalRevenue = data.reduce((a, b) => a + b, 0);
                    const averageRevenue = data.length > 0 ? Math.round(totalRevenue / data.length) : 0;
                    
                    const totalElement = document.getElementById('revenue-total');
                    const averageElement = document.getElementById('revenue-average');
                    
                    if (totalElement) totalElement.textContent = this.formatCurrency(totalRevenue);
                    if (averageElement) averageElement.textContent = this.formatCurrency(averageRevenue);
                }
                
                const projectsCtx = document.getElementById('projectsChart');
                if (projectsCtx) {
                    let labels = chartsData.projectsByType?.labels || [];
                    let data = chartsData.projectsByType?.data || [];
                    let colors = chartsData.projectsByType?.colors || this.generateChartColors(data.length);
                    
                    if (!labels.length || !data.length) {
                        labels = ["سكني", "تجاري", "صناعي", "فندقي"];
                        data = [2, 2, 1, 1];
                        colors = [
                            '#121212',
                            '#1E1E1E',
                            '#2C2C2C',
                            '#3A3A3A',
                            '#4A4A4A',
                            '#5A5A5A',
                            '#6A6A6A',
                            '#C0C0C0'
                        ];
                    }
                    
                    if (this.charts.projects) this.charts.projects.destroy();
                    
                    this.charts.projects = new Chart(projectsCtx.getContext('2d'), {
                        type: 'doughnut',
                        data: {
                            labels: labels,
                            datasets: [{
                                data: data,
                                backgroundColor: colors,
                                borderColor: 'rgba(20, 20, 20, 0.8)',
                                borderWidth: 2,
                                borderRadius: 10
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            cutout: this.isMobile ? '60%' : '70%',
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    rtl: true,
                                    backgroundColor: 'rgba(20, 20, 20, 0.9)',
                                    titleColor: '#fff',
                                    bodyColor: '#fff',
                                    borderColor: 'rgba(203, 205, 205, 0.2)',
                                    borderWidth: 1,
                                    callbacks: {
                                        label: (context) => {
                                            const value = context.parsed;
                                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                            const percentage = Math.round((value / total) * 100);
                                            return `${context.label}: ${value} مشروع (${percentage}%)`;
                                        }
                                    }
                                }
                            }
                        }
                    });
                    
                    this.createProjectsLegend(labels, data, colors);
                }
                
                console.log('✅ Charts initialized successfully with real database data');
                
            } catch (error) {
                console.error('❌ Error initializing charts with real data:', error);
            }
        }
        
        initChartsWithSeparateAPIs() {
            if (!this.canViewStats) return;
            try {
                console.log('📈 Loading charts data from separate APIs...');
                const currentDate = new Date();
                const months = [];
                for (let i = 5; i >= 0; i--) {
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
                    months.push(date.toLocaleDateString('ar-SA', { month: 'long' }));
                }
                const revenueData = { labels: months, data: [15000, 18000, 22000, 19000, 25000, 47000] };
                const projectsData = {
                    labels: ["سكني", "تجاري", "صناعي", "فندقي"],
                    data: [2, 2, 1, 1],
                    colors: ['#121212', '#1E1E1E', '#2C2C2C', '#3A3A3A']
                };
                this.initChartsWithRealData({ monthlyRevenue: revenueData, projectsByType: projectsData });
            } catch (error) {
                console.error('❌ Error in initChartsWithSeparateAPIs:', error);
            }
        }
        
        generateChartColors(count) {
            const baseColors = ['#121212', '#1E1E1E', '#2C2C2C', '#3A3A3A', '#4A4A4A', '#5A5A5A', '#6A6A6A', '#C0C0C0'];
            return baseColors.slice(0, count);
        }
        
        createProjectsLegend(labels, data, colors) {
            const legend = document.getElementById('projects-legend');
            if (!legend) return;
            const total = data.reduce((sum, value) => sum + value, 0);
            let html = '';
            labels.forEach((label, index) => {
                const value = data[index];
                const color = colors ? colors[index] : this.generateChartColors(1)[0];
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                html += `<div class="legend-item"><div class="legend-color" style="background-color: ${color};"></div><span class="legend-label">${label}: ${percentage}%</span></div>`;
            });
            legend.innerHTML = html;
        }
        
        updateRevenueChart(labels, data) {
            if (!this.canViewStats) return;
            const revenueCtx = document.getElementById('revenueChart');
            if (!revenueCtx) return;
            
            if (!labels || labels.length === 0) {
                this.updateRevenueChartWithDefault();
                return;
            }
            
            if (this.charts.revenue) {
                this.charts.revenue.destroy();
            }
            
            this.charts.revenue = new Chart(revenueCtx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'الإيرادات',
                        data: data,
                        borderColor: 'rgba(203, 205, 205, 0.8)',
                        backgroundColor: 'rgba(203, 205, 205, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: 'rgba(203, 205, 205, 1)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: this.isMobile ? 3 : 4,
                        pointHoverRadius: this.isMobile ? 4 : 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            rtl: true,
                            backgroundColor: 'rgba(20, 20, 20, 0.9)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            borderColor: 'rgba(203, 205, 205, 0.2)',
                            borderWidth: 1,
                            callbacks: {
                                label: (context) => `الإيرادات: ${this.formatCurrency(context.parsed.y)}`
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { color: 'rgba(203, 205, 205, 0.05)', drawBorder: false },
                            ticks: { color: 'rgba(203, 205, 205, 0.7)', font: { size: this.isMobile ? 10 : 12 } }
                        },
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(203, 205, 205, 0.05)', drawBorder: false },
                            ticks: {
                                color: 'rgba(203, 205, 205, 0.7)',
                                font: { size: this.isMobile ? 10 : 12 },
                                callback: (value) => value >= 1000 ? (value / 1000) + ' ألف' : value
                            }
                        }
                    }
                }
            });
        }
        
        updateRevenueChartWithDefault() {
            if (!this.canViewStats) return;
            const currentDate = new Date();
            const months = [];
            for (let i = 5; i >= 0; i--) {
                const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
                months.push(date.toLocaleDateString('ar-SA', { month: 'long' }));
            }
            const defaultData = [15000, 18000, 22000, 19000, 25000, 47000];
            this.updateRevenueChart(months, defaultData);
        }
        
        updateProjectsChart(labels, data, colors) {
            if (!this.canViewStats) return;
            const projectsCtx = document.getElementById('projectsChart');
            if (!projectsCtx) return;
            
            if (!labels || labels.length === 0) {
                this.updateProjectsChartWithDefault();
                return;
            }
            
            if (this.charts.projects) {
                this.charts.projects.destroy();
            }
            
            this.charts.projects = new Chart(projectsCtx.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: colors || this.generateChartColors(data.length),
                        borderColor: 'rgba(20, 20, 20, 0.8)',
                        borderWidth: 2,
                        borderRadius: 10
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: this.isMobile ? '60%' : '70%',
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            rtl: true,
                            backgroundColor: 'rgba(20, 20, 20, 0.9)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            borderColor: 'rgba(203, 205, 205, 0.2)',
                            borderWidth: 1,
                            callbacks: {
                                label: (context) => {
                                    const value = context.parsed;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((value / total) * 100);
                                    return `${context.label}: ${value} مشروع (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
            
            this.createProjectsLegend(labels, data, colors);
        }
        
        updateProjectsChartWithDefault() {
            const defaultLabels = ["سكني", "تجاري", "صناعي", "فندقي"];
            const defaultData = [2, 2, 1, 1];
            const defaultColors = [
                '#121212',
                '#1E1E1E',
                '#2C2C2C',
                '#3A3A3A',
                '#4A4A4A',
                '#5A5A5A',
                '#6A6A6A',
                '#C0C0C0'
            ];
            this.updateProjectsChart(defaultLabels, defaultData, defaultColors);
        }
        
        setupMobileFeatures() {
            console.log('📱 Setting up mobile features...');
            this.setupMobileSearch();
        }
        
        setupMobileSearch() {
            const searchToggle = document.getElementById('search-toggle');
            const searchBox = document.querySelector('.search-box');
            if (searchToggle && searchBox) {
                searchToggle.style.display = 'flex';
                searchToggle.addEventListener('click', () => {
                    searchBox.classList.toggle('active');
                    if (searchBox.classList.contains('active')) {
                        const searchInput = searchBox.querySelector('.search-input');
                        if (searchInput) searchInput.focus();
                    }
                });
                document.addEventListener('click', (e) => {
                    if (!searchBox.contains(e.target) && !searchToggle.contains(e.target)) {
                        searchBox.classList.remove('active');
                    }
                });
            }
        }
        
        handleResize() {
            const wasMobile = this.isMobile;
            this.isMobile = window.innerWidth <= 1200;
            if (wasMobile !== this.isMobile) {
                console.log('📱 Device type changed:', this.isMobile ? 'Mobile' : 'Desktop');
                if (this.isMobile) {
                    this.closeSidebar();
                    this.setupMobileFeatures();
                } else {
                    this.openSidebar();
                }
            }
        }
    }
    
    function initializeDashboard() {
        try {
            window.dashboard = new Dashboard();
            console.log('✅ Dashboard initialized successfully with dynamic permissions');
        } catch (error) {
            console.error('❌ Failed to initialize Dashboard:', error);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDashboard);
    } else {
        initializeDashboard();
    }
    
    window.addEventListener('resize', () => {
        if (window.dashboard) window.dashboard.handleResize();
    });
})();