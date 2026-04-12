// ===== منشئ القائمة الجانبية الديناميكي =====
(function() {
    'use strict';
    
    console.log('✅ sidebar.js loaded');
    
    const SidebarBuilder = {
        /**
         * بناء القائمة الجانبية بناءً على الصلاحيات المخزنة
         * @param {string} containerId - id العنصر الذي ستوضع فيه القائمة
         */
        buildSidebar: function(containerId) {
            const container = document.getElementById(containerId);
            if (!container) {
                console.error('❌ Sidebar container not found:', containerId);
                return;
            }
            
            // جلب الصلاحيات من localStorage
            let permissions = [];
            try {
                const perms = localStorage.getItem('user_permissions');
                if (perms) {
                    permissions = JSON.parse(perms);
                }
            } catch (e) {
                console.error('❌ خطأ في قراءة الصلاحيات:', e);
            }
            
            console.log('🔑 بناء القائمة الجانبية بالصلاحيات:', permissions);
            
            // تعريف هيكل القائمة الكامل (جميع العناصر الممكنة)
            const allMenuItems = [
                {
                    section: 'الرئيسية',
                    items: [
                        { id: 'dashboard', title: 'لوحة التحكم', icon: 'fas fa-tachometer-alt', link: '/dashboard/index.html', permission: 'dashboard' }
                    ]
                },
                {
                    section: 'إدارة العقارات',
                    items: [
                        { id: 'projects', title: 'المشاريع', icon: 'fas fa-building', link: '/projects-management/index.html', permission: 'projects' },
                        { id: 'contracts', title: 'العقود', icon: 'fas fa-file-contract', link: '/contracts/index.html', permission: 'contracts' },
                        { id: 'payments', title: 'المدفوعات', icon: 'fas fa-money-bill-wave', link: '/payments/index.html', permission: 'payments' },
                        { id: 'invoices', title: 'الفواتير', icon: 'fas fa-file-invoice', link: '/bills/index.html', permission: 'invoices' }
                    ]
                },
                {
                    section: 'إدارة العملاء',
                    items: [
                        { id: 'inquiries', title: 'الاستفسارات', icon: 'fas fa-headset', link: '/inquiries/index.html', permission: 'inquiries' },
                        { id: 'clients', title: 'العملاء', icon: 'fas fa-users', link: '/leeds/index.html', permission: 'clients' }
                    ]
                },
                {
                    section: 'الإدارة',
                    items: [
                        { id: 'users', title: 'المستخدمين', icon: 'fas fa-user-cog', link: '/users/index.html', permission: 'users' },
                        { id: 'recruitment', title: 'التوظيف', icon: 'fas fa-user-plus', link: '/job-management/index.html', permission: 'recruitment' },
                        { id: 'tasks', title: 'المهمات', icon: 'fas fa-plus-circle', link: '/tasks/index.html', permission: 'tasks' }
                    ]
                }
            ];
            
            // تصفية العناصر المسموح بها
            const filteredSections = allMenuItems.map(section => {
                const filteredItems = section.items.filter(item => permissions.includes(item.permission));
                return { ...section, items: filteredItems };
            }).filter(section => section.items.length > 0);
            
            // بناء HTML
            let html = '';
            filteredSections.forEach(section => {
                html += `
                    <div class="nav-section">
                        <h3 class="section-title">${section.section}</h3>
                        <ul class="nav-links">
                `;
                
                section.items.forEach(item => {
                    // تحديد ما إذا كان العنصر هو الصفحة الحالية
                    const isActive = window.location.pathname.includes(item.link) ? 'active' : '';
                    html += `
                        <li class="nav-item ${isActive}">
                            <a href="${item.link}" class="nav-link">
                                <div class="nav-icon">
                                    <i class="${item.icon}"></i>
                                </div>
                                <span class="nav-text">${item.title}</span>
                            </a>
                        </li>
                    `;
                });
                
                html += `
                        </ul>
                    </div>
                `;
            });
            
            container.innerHTML = html;
            
            // إضافة مستمعات للروابط (اختياري)
            container.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    // إغلاق القائمة في الموبايل بعد النقر
                    const sidebar = document.getElementById('dashboard-sidebar');
                    if (sidebar && window.innerWidth <= 1200) {
                        sidebar.classList.remove('active');
                        const overlay = document.querySelector('.overlay');
                        if (overlay) {
                            overlay.classList.remove('active');
                            setTimeout(() => overlay.style.display = 'none', 300);
                        }
                        document.body.style.overflow = '';
                    }
                });
            });
            
            console.log('✅ Sidebar built successfully with', filteredSections.length, 'sections');
        }
    };
    
    // تعريف الكائن عمومياً
    window.SidebarBuilder = SidebarBuilder;
})();