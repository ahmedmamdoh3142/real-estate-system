// ===== صفحة إدارة المستخدمين - نظام إدارة العقارات =====
// تم التعديل: إضافة صلاحيات متعددة، دور نص حر، إظهار كلمة المرور كحقل قابل للتعديل

(function() {
    'use strict';
    
    console.log('✅ users.js loaded - with multi-permissions and free role');
    
    class UsersManager {
        constructor() {
            this.baseURL = '/api';
            this.apiClient = this.createApiClient();
            this.currentUser = null;
            this.users = [];
            this.filteredUsers = [];
            this.currentPage = 1;
            this.pageSize = 25;
            this.totalPages = 1;
            this.totalItems = 0;
            this.allPermissions = []; // قائمة جميع الصلاحيات المتاحة من الخادم
            
            // الفلاتر الافتراضية
            this.filters = {
                search: '',
                status: ['نشط', 'غير نشط'],
                role: [] // سيتم ملؤها بأسماء الأدوار الموجودة ديناميكياً
            };
            
            this.sortOrder = 'newest';
            this.chartInstance = null;
            this.currentUserId = null;
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
                    
                    if (options.body) {
                        defaultOptions.body = options.body;
                    }
                    
                    console.log(`🌐 API Request: ${defaultOptions.method} ${url}`);
                    
                    try {
                        const response = await fetch(url, defaultOptions);
                        const data = await response.json();
                        
                        if (!response.ok) {
                            throw new Error(data.message || `HTTP error ${response.status}`);
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
            console.log('🚀 UsersManager initializing with multi-permissions...');
            
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setupPage());
            } else {
                this.setupPage();
            }
        }
        
        async setupPage() {
            console.log('🔧 Setting up users management page with permissions...');
            
            await this.checkAuth();
            await this.checkApiHealth();
            await this.loadPermissions(); // تحميل الصلاحيات أولاً
            await this.loadRoles();       // تحميل الأدوار (المستخرجة من المستخدمين)
            await this.loadUsers();
            
            this.setupUI();
            this.updateStatistics();
            this.setupChart();
            this.setupMobileEnhancements();
            this.updateSystemTime();
            setInterval(() => this.updateSystemTime(), 60000);
        }
        
        // ---------- جلب جميع الصلاحيات من قاعدة البيانات ----------
        async loadPermissions() {
            try {
                // ✅ التعديل هنا: تغيير المسار ليتوافق مع باقي endpoints المستخدمين
                const response = await this.apiClient.request('/api/admin/users/permissions');
                if (response.success) {
                    this.allPermissions = response.data;
                    this.renderPermissionsGrid();
                } else {
                    throw new Error('Failed to load permissions');
                }
            } catch (error) {
                console.error('❌ Error loading permissions:', error);
                // بيانات صلاحيات احتياطية
                this.allPermissions = [
                    { id: 1, name: 'dashboard', displayName: 'لوحة التحكم', category: 'main', parentId: null },
                    { id: 2, name: 'projects', displayName: 'المشاريع', category: 'main', parentId: null },
                    { id: 3, name: 'contracts', displayName: 'العقود', category: 'main', parentId: null },
                    { id: 4, name: 'payments', displayName: 'المدفوعات', category: 'main', parentId: null },
                    { id: 5, name: 'invoices', displayName: 'الفواتير', category: 'main', parentId: null },
                    { id: 6, name: 'inquiries', displayName: 'الاستفسارات', category: 'main', parentId: null },
                    { id: 7, name: 'clients', displayName: 'العملاء', category: 'main', parentId: null },
                    { id: 8, name: 'users', displayName: 'المستخدمين', category: 'main', parentId: null },
                    { id: 9, name: 'recruitment', displayName: 'التوظيف', category: 'main', parentId: null },
                    { id: 10, name: 'tasks', displayName: 'المهمات', category: 'main', parentId: null },
                    { id: 11, name: 'task_requests', displayName: 'الطلبات', category: 'sub', parentId: 10 },
                    { id: 12, name: 'purchase_requests', displayName: 'طلبات الشراء', category: 'sub', parentId: 10 },
                    { id: 13, name: 'appointments', displayName: 'المواعيد', category: 'sub', parentId: 10 },
                    { id: 14, name: 'penalties', displayName: 'الجزاءات', category: 'sub', parentId: 10 },
                    { id: 15, name: 'statistics', displayName: 'الاحصائيات', category: 'sub', parentId: 10 }
                ];
                this.renderPermissionsGrid();
                this.showNotification('warning', 'تنبيه', 'تم استخدام الصلاحيات الاحتياطية بسبب خطأ في الاتصال');
            }
        }
        
        renderPermissionsGrid() {
            const container = document.getElementById('permissions-container');
            if (!container) return;
            
            // تجميع الصلاحيات حسب الفئة
            const mainPermissions = this.allPermissions.filter(p => p.category === 'main' || !p.parentId);
            const subPermissions = this.allPermissions.filter(p => p.category === 'sub' && p.parentId);
            
            let html = '';
            
            // الصلاحيات الرئيسية
            html += '<div class="permission-category">';
            html += '<div class="permission-category-title">الصلاحيات الرئيسية</div>';
            mainPermissions.forEach(perm => {
                html += `
                    <div class="permission-item">
                        <input type="checkbox" name="permission" value="${perm.id}" id="perm_${perm.id}">
                        <label for="perm_${perm.id}">${perm.displayName}</label>
                    </div>
                `;
            });
            html += '</div>';
            
            // الصلاحيات الفرعية (تحت المهمات)
            if (subPermissions.length > 0) {
                html += '<div class="permission-category">';
                html += '<div class="permission-category-title">الصلاحيات الفرعية (تحت المهمات)</div>';
                subPermissions.forEach(perm => {
                    html += `
                        <div class="permission-item">
                            <input type="checkbox" name="permission" value="${perm.id}" id="perm_${perm.id}">
                            <label for="perm_${perm.id}">${perm.displayName}</label>
                        </div>
                    `;
                });
                html += '</div>';
            }
            
            container.innerHTML = html;
        }
        
        getSelectedPermissions() {
            const checkboxes = document.querySelectorAll('input[name="permission"]:checked');
            return Array.from(checkboxes).map(cb => parseInt(cb.value));
        }
        
        setSelectedPermissions(permissionIds) {
            const checkboxes = document.querySelectorAll('input[name="permission"]');
            checkboxes.forEach(cb => {
                cb.checked = permissionIds.includes(parseInt(cb.value));
            });
        }
        
        // ---------- جلب الأدوار من قاعدة البيانات (أدوار فريدة من جدول Users) ----------
        async loadRoles() {
            try {
                const response = await this.apiClient.request('/api/admin/users/roles');
                if (response.success) {
                    this.filters.role = response.data;
                    this.renderRoleFilters();
                    // لا نحتاج لـ role select لأن الدور أصبح نصاً حراً
                } else {
                    throw new Error('Failed to load roles');
                }
            } catch (error) {
                console.error('❌ Error loading roles:', error);
                this.filters.role = [];
                this.renderRoleFilters();
            }
        }
        
        renderRoleFilters() {
            const roleOptionsContainer = document.getElementById('filter-role-options');
            if (!roleOptionsContainer) return;
            
            let html = '';
            if (this.filters.role.length === 0) {
                html = '<div class="filter-option">لا توجد أدوار مسجلة</div>';
            } else {
                this.filters.role.forEach(role => {
                    html += `
                        <label class="filter-option">
                            <input type="checkbox" name="role" value="${role}" checked>
                            <span class="checkmark"></span>
                            <span class="filter-label">${role}</span>
                        </label>
                    `;
                });
            }
            roleOptionsContainer.innerHTML = html;
        }
        
        // ---------- التحقق من المستخدم ----------
        async checkAuth() {
            try {
                const userData = JSON.parse(localStorage.getItem('currentUser'));
                if (userData) {
                    this.currentUser = userData;
                } else {
                    this.currentUser = {
                        id: 1,
                        fullName: 'أحمد محمد',
                        role: 'مشرف عام'
                    };
                }
                this.updateUserInfo();
            } catch (error) {
                console.warn('⚠️ No user in localStorage, using test user');
                this.currentUser = {
                    id: 1,
                    fullName: 'أحمد محمد',
                    role: 'مشرف عام'
                };
                this.updateUserInfo();
            }
        }
        
        updateUserInfo() {
            const userNameElement = document.getElementById('current-user-name');
            const userRoleElement = document.getElementById('current-user-role');
            if (userNameElement && this.currentUser) {
                userNameElement.textContent = this.currentUser.fullName || 'مستخدم';
            }
            if (userRoleElement && this.currentUser) {
                userRoleElement.textContent = this.currentUser.role || 'مستخدم';
            }
        }
        
        // ---------- تحميل المستخدمين ----------
        async loadUsers() {
            try {
                console.log('📥 Loading users from database...');
                this.showLoading();
                this.isLoading = true;
                
                const params = new URLSearchParams({
                    page: this.currentPage,
                    limit: this.pageSize,
                    sort: this.sortOrder,
                    search: this.filters.search,
                    status: this.filters.status.join(','),
                    role: this.filters.role.join(',')
                });
                
                const response = await this.apiClient.request(`/api/admin/users?${params}`);
                
                if (response.success) {
                    this.users = response.data || [];
                    this.totalItems = response.pagination?.totalItems || this.users.length;
                    this.totalPages = response.pagination?.totalPages || 1;
                    this.filteredUsers = [...this.users];
                    console.log(`✅ Loaded ${this.users.length} users`);
                    this.renderTable();
                    this.updateStatistics();
                }
            } catch (error) {
                console.error('❌ Error loading users:', error);
                this.showNotification('error', 'خطأ', 'فشل تحميل المستخدمين');
                this.loadMockData();
                this.renderTable();
                this.updateStatistics();
            } finally {
                this.isLoading = false;
            }
        }
        
        // ---------- بيانات احتياطية (إذا فشل الاتصال) ----------
        loadMockData() {
            console.log('🔄 Using mock users data (fallback)');
            this.users = [
                {
                    id: 1,
                    userId: 'USER-001',
                    fullName: 'أحمد محمد',
                    username: 'ahmed_admin',
                    email: 'ahmed@realestate.com',
                    phone: '0501112222',
                    role: 'مشرف عام',
                    department: 'الإدارة',
                    status: 'نشط',
                    lastLogin: '2024-05-15 08:30:00',
                    createdAt: '2024-01-15 10:00:00',
                    permissions: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]
                },
                {
                    id: 2,
                    userId: 'USER-002',
                    fullName: 'سالم العلي',
                    username: 'saleh_accountant',
                    email: 'saleh@realestate.com',
                    phone: '0502223333',
                    role: 'محاسب',
                    department: 'المالية',
                    status: 'نشط',
                    lastLogin: '2024-05-14 16:45:00',
                    createdAt: '2024-02-10 09:15:00',
                    permissions: [4,5]
                },
                {
                    id: 3,
                    userId: 'USER-003',
                    fullName: 'خالد الحربي',
                    username: 'khaled_manager',
                    email: 'khaled@realestate.com',
                    phone: '0503334444',
                    role: 'مدير مشاريع',
                    department: 'المشاريع',
                    status: 'نشط',
                    lastLogin: '2024-05-15 11:20:00',
                    createdAt: '2024-01-20 14:30:00',
                    permissions: [2,10,11,12,13,14,15]
                },
                {
                    id: 4,
                    userId: 'USER-004',
                    fullName: 'فاطمة السعد',
                    username: 'fatma_reception',
                    email: 'fatma@realestate.com',
                    phone: '0504445555',
                    role: 'موظف استقبال',
                    department: 'الدعم الفني',
                    status: 'نشط',
                    lastLogin: '2024-05-14 15:10:00',
                    createdAt: '2024-03-05 08:00:00',
                    permissions: [6,7]
                },
                {
                    id: 5,
                    userId: 'USER-005',
                    fullName: 'نورا الفهد',
                    username: 'noura_accountant',
                    email: 'noura@realestate.com',
                    phone: '0505556666',
                    role: 'محاسب',
                    department: 'المالية',
                    status: 'غير نشط',
                    lastLogin: '2024-05-13 12:30:00',
                    createdAt: '2024-04-12 11:45:00',
                    permissions: [4,5]
                }
            ];
            this.totalItems = this.users.length;
            this.totalPages = Math.ceil(this.totalItems / this.pageSize);
            this.filteredUsers = [...this.users];
        }
        
        // ---------- عرض الجدول ----------
        renderTable() {
            const tableBody = document.getElementById('users-table-body');
            if (!tableBody) return;
            
            const startIndex = (this.currentPage - 1) * this.pageSize;
            const endIndex = Math.min(startIndex + this.pageSize, this.filteredUsers.length);
            const pageData = this.filteredUsers.slice(startIndex, endIndex);
            
            let html = '';
            if (pageData.length === 0) {
                html = `
                    <tr class="empty-row">
                        <td colspan="12">
                            <div class="empty-state">
                                <i class="fas fa-users"></i>
                                <h4>لا يوجد مستخدمين</h4>
                                <p>لا يوجد مستخدمين تطابق معايير البحث</p>
                                ${this.isLoading ? '' : '<button class="btn btn-primary mt-3" id="add-first-user">إضافة أول مستخدم</button>'}
                            </div>
                         </td>
                    </tr>
                `;
            } else {
                pageData.forEach(user => {
                    const statusClass = this.getStatusClass(user.status);
                    const roleClass = 'role-badge'; // class عام للأدوار النصية
                    const dateFormatted = this.formatDate(user.createdAt);
                    const lastActivity = this.getTimeAgo(user.lastLogin || user.createdAt);
                    const department = user.department || 'غير محدد';
                    
                    // عرض الصلاحيات كوسوم
                    let permissionsHtml = '';
                    if (user.permissions && user.permissions.length) {
                        const permNames = user.permissions.map(p => {
                            const found = this.allPermissions.find(perm => perm.id === p);
                            return found ? found.displayName : '';
                        }).filter(n => n);
                        const limited = permNames.slice(0, 3);
                        permissionsHtml = `<div class="permissions-cell">${limited.map(p => `<span class="permission-tag">${p}</span>`).join('')}${permNames.length > 3 ? `<span class="permission-tag">+${permNames.length-3}</span>` : ''}</div>`;
                    } else {
                        permissionsHtml = '<span class="permission-tag">لا توجد صلاحيات</span>';
                    }
                    
                    html += `
                        <tr data-user-id="${user.id}">
                            <td>
                                <label class="checkbox-cell">
                                    <input type="checkbox" class="user-checkbox" data-id="${user.id}">
                                    <span class="checkmark"></span>
                                </label>
                            </td>
                            <td><span class="user-id">${user.userId || `USER-${String(user.id).padStart(3, '0')}`}</span></td>
                            <td>
                                <div class="user-info-cell">
                                    <div class="user-avatar-table">
                                        <i class="fas fa-user-circle"></i>
                                    </div>
                                    <div class="user-details">
                                        <div class="user-name-table">${user.fullName}</div>
                                        <div class="user-username">@${user.username}</div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class="contact-info-cell">
                                    <div class="contact-email"><i class="fas fa-envelope"></i><span>${user.email}</span></div>
                                    <div class="contact-phone"><i class="fas fa-phone"></i><span>${user.phone || '--'}</span></div>
                                </div>
                            </td>
                            <td><span class="${roleClass}">${user.role}</span></td>
                            <td>${permissionsHtml}</td>
                            <td><span class="department-badge">${department}</span></td>
                            <td><span class="status-badge ${statusClass}">${user.status}</span></td>
                            <td><span class="last-activity">${lastActivity}</span></td>
                            <td><span class="user-date">${dateFormatted}</span></td>
                            <td>
                                <div class="action-buttons">
                                    <button class="action-btn btn-view view-user" data-id="${user.id}" title="عرض التفاصيل">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="action-btn btn-edit edit-user" data-id="${user.id}" title="تعديل">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    ${user.status === 'نشط' ? 
                                        `<button class="action-btn btn-suspend suspend-user" data-id="${user.id}" title="تعطيل">
                                            <i class="fas fa-user-slash"></i>
                                        </button>` :
                                        `<button class="action-btn btn-activate activate-user" data-id="${user.id}" title="تفعيل">
                                            <i class="fas fa-user-check"></i>
                                        </button>`
                                    }
                                    <button class="action-btn btn-delete delete-user" data-id="${user.id}" title="حذف">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                });
            }
            
            tableBody.innerHTML = html;
            this.updatePagination();
            this.attachTableEvents();
            
            const addFirstBtn = document.getElementById('add-first-user');
            if (addFirstBtn) addFirstBtn.addEventListener('click', () => this.showAddUserModal());
        }
        
        getStatusClass(status) {
            const map = {
                'نشط': 'status-active',
                'غير نشط': 'status-inactive'
            };
            return map[status] || 'status-inactive';
        }
        
        formatDate(dateString) {
            if (!dateString) return '--';
            try {
                const date = new Date(dateString);
                return date.toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' });
            } catch {
                return dateString;
            }
        }
        
        getTimeAgo(dateString) {
            if (!dateString) return 'لم يسجل نشاط';
            try {
                const date = new Date(dateString);
                const now = new Date();
                const diffMs = now - date;
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMs / 3600000);
                const diffDays = Math.floor(diffMs / 86400000);
                
                if (diffMins < 60) return `قبل ${diffMins} دقيقة`;
                if (diffHours < 24) return `قبل ${diffHours} ساعة`;
                if (diffDays < 7) return `قبل ${diffDays} يوم`;
                return this.formatDate(dateString);
            } catch {
                return dateString;
            }
        }
        
        updatePagination() {
            const paginationContainer = document.getElementById('table-pagination');
            if (!paginationContainer) return;
            
            const totalItemsElement = document.getElementById('total-items');
            if (totalItemsElement) totalItemsElement.textContent = this.totalItems;
            
            if (this.totalPages <= 1) {
                paginationContainer.innerHTML = '';
                return;
            }
            
            let html = `
                <button class="pagination-btn prev-btn" ${this.currentPage === 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-right"></i>
                </button>
                <div class="pagination-pages">
            `;
            
            const maxPagesToShow = window.innerWidth <= 768 ? 3 : 5;
            let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
            let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);
            if (endPage - startPage + 1 < maxPagesToShow) {
                startPage = Math.max(1, endPage - maxPagesToShow + 1);
            }
            
            for (let i = startPage; i <= endPage; i++) {
                html += `<button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
            }
            
            html += `</div><button class="pagination-btn next-btn" ${this.currentPage === this.totalPages ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>`;
            paginationContainer.innerHTML = html;
            this.attachPaginationEvents();
        }
        
        attachPaginationEvents() {
            document.querySelectorAll('.pagination-btn[data-page]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const page = parseInt(e.target.dataset.page);
                    if (page !== this.currentPage) {
                        this.currentPage = page;
                        this.loadUsers();
                    }
                });
            });
            
            const prevBtn = document.querySelector('.prev-btn');
            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    if (this.currentPage > 1) {
                        this.currentPage--;
                        this.loadUsers();
                    }
                });
            }
            
            const nextBtn = document.querySelector('.next-btn');
            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    if (this.currentPage < this.totalPages) {
                        this.currentPage++;
                        this.loadUsers();
                    }
                });
            }
        }
        
        attachTableEvents() {
            document.querySelectorAll('.view-user').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const userId = e.currentTarget.dataset.id;
                    this.showUserDetail(userId);
                });
            });
            
            document.querySelectorAll('.edit-user').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const userId = e.currentTarget.dataset.id;
                    this.showEditUserModal(userId);
                });
            });
            
            document.querySelectorAll('.suspend-user').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const userId = e.currentTarget.dataset.id;
                    this.suspendUser(userId);
                });
            });
            
            document.querySelectorAll('.activate-user').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const userId = e.currentTarget.dataset.id;
                    this.activateUser(userId);
                });
            });
            
            document.querySelectorAll('.delete-user').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const userId = e.currentTarget.dataset.id;
                    this.deleteUser(userId);
                });
            });
            
            const selectAll = document.getElementById('select-all');
            if (selectAll) {
                selectAll.addEventListener('change', (e) => {
                    document.querySelectorAll('.user-checkbox').forEach(cb => cb.checked = e.target.checked);
                });
            }
        }
        
        // ---------- عرض تفاصيل المستخدم (مع الصلاحيات) ----------
        async showUserDetail(userId) {
            try {
                const response = await this.apiClient.request(`/api/admin/users/${userId}`);
                if (!response.success) throw new Error(response.message);
                
                const user = response.data;
                const modal = document.getElementById('user-detail-modal');
                if (!modal) return;
                const modalTitle = document.getElementById('modal-user-title');
                const modalBody = document.getElementById('modal-user-body');
                const modalEditBtn = document.getElementById('modal-edit-btn');
                const modalDeleteBtn = document.getElementById('modal-delete-btn');
                
                modalEditBtn.dataset.userId = userId;
                modalDeleteBtn.dataset.userId = userId;
                
                const statusClass = this.getStatusClass(user.status);
                const roleClass = 'role-badge';
                const createdAt = this.formatDate(user.createdAt);
                const lastActivity = this.getTimeAgo(user.lastLogin || user.createdAt);
                const department = user.department || 'غير محدد';
                
                // عرض الصلاحيات
                let permissionsHtml = '<div class="permissions-cell" style="justify-content: flex-start;">';
                if (user.permissions && user.permissions.length) {
                    user.permissions.forEach(p => {
                        const permObj = this.allPermissions.find(perm => perm.id === p);
                        if (permObj) {
                            permissionsHtml += `<span class="permission-tag ${permObj.category === 'main' ? 'main' : 'sub'}">${permObj.displayName}</span>`;
                        }
                    });
                } else {
                    permissionsHtml += '<span class="permission-tag">لا توجد صلاحيات</span>';
                }
                permissionsHtml += '</div>';
                
                const html = `
                    <div class="user-detail-professional">
                        <div class="user-profile-header-professional">
                            <div class="user-avatar-professional">
                                <i class="fas fa-user-circle"></i>
                            </div>
                            <div class="user-info-professional">
                                <h3>${user.fullName}</h3>
                                <p>@${user.username}</p>
                                <div class="user-badges">
                                    <span class="status-badge ${statusClass}">${user.status}</span>
                                    <span class="${roleClass}">${user.role}</span>
                                    <span class="department-badge">${department}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-card">
                            <div class="detail-card-header">
                                <i class="fas fa-id-card"></i>
                                <h4>معلومات الحساب</h4>
                            </div>
                            <div class="detail-card-body">
                                <div class="info-grid">
                                    <div class="info-item">
                                        <span class="info-label">معرف المستخدم:</span>
                                        <span class="info-value">${user.userId}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">اسم المستخدم:</span>
                                        <span class="info-value">@${user.username}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">تاريخ التسجيل:</span>
                                        <span class="info-value">${createdAt}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">آخر نشاط:</span>
                                        <span class="info-value">${lastActivity}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-card">
                            <div class="detail-card-header">
                                <i class="fas fa-user"></i>
                                <h4>معلومات شخصية</h4>
                            </div>
                            <div class="detail-card-body">
                                <div class="info-grid">
                                    <div class="info-item">
                                        <span class="info-label">الاسم الكامل:</span>
                                        <span class="info-value">${user.fullName}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">البريد الإلكتروني:</span>
                                        <span class="info-value">${user.email}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">رقم الهاتف:</span>
                                        <span class="info-value">${user.phone || '--'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-card">
                            <div class="detail-card-header">
                                <i class="fas fa-briefcase"></i>
                                <h4>المعلومات الوظيفية</h4>
                            </div>
                            <div class="detail-card-body">
                                <div class="info-grid">
                                    <div class="info-item">
                                        <span class="info-label">الدور/الصلاحية:</span>
                                        <span class="info-value">${user.role}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">القسم:</span>
                                        <span class="info-value">${department}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">الصلاحيات:</span>
                                        <span class="info-value">${permissionsHtml}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        ${user.notes ? `
                        <div class="detail-card">
                            <div class="detail-card-header">
                                <i class="fas fa-sticky-note"></i>
                                <h4>ملاحظات إضافية</h4>
                            </div>
                            <div class="detail-card-body">
                                <p class="notes-content">${user.notes}</p>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                `;
                
                modalTitle.textContent = `تفاصيل المستخدم: ${user.fullName}`;
                modalBody.innerHTML = html;
                modal.classList.add('active');
            } catch (error) {
                console.error('❌ Error showing user detail:', error);
                this.showNotification('error', 'خطأ', 'فشل في تحميل تفاصيل المستخدم');
            }
        }
        
        // ---------- إضافة / تعديل مستخدم (مع الصلاحيات وكلمة المرور) ----------
        showAddUserModal() {
            this.currentUserId = null;
            document.getElementById('user-form-title').textContent = 'إضافة مستخدم جديد';
            this.resetUserForm();
            // إلغاء تحديد جميع الصلاحيات
            this.setSelectedPermissions([]);
            // جعل كلمة المرور مطلوبة
            document.getElementById('user-password').required = true;
            document.getElementById('user-password-confirm').required = true;
            document.getElementById('password-required-star').style.display = 'inline';
            document.getElementById('confirm-required-star').style.display = 'inline';
            document.getElementById('user-form-modal').classList.add('active');
        }
        
        async showEditUserModal(userId) {
            try {
                const response = await this.apiClient.request(`/api/admin/users/${userId}`);
                if (!response.success) throw new Error(response.message);
                
                const user = response.data;
                this.currentUserId = userId;
                
                document.getElementById('user-form-title').textContent = `تعديل المستخدم: ${user.fullName}`;
                document.getElementById('user-fullname').value = user.fullName;
                document.getElementById('user-username').value = user.username;
                document.getElementById('user-email').value = user.email;
                document.getElementById('user-phone').value = user.phone || '';
                document.getElementById('user-role').value = user.role;
                document.getElementById('user-department').value = user.department || '';
                document.getElementById('user-status').value = user.status;
                document.getElementById('user-notes').value = user.notes || '';
                
                // تعيين الصلاحيات المحددة مسبقاً
                if (user.permissions) {
                    this.setSelectedPermissions(user.permissions);
                } else {
                    this.setSelectedPermissions([]);
                }
                
                // في وضع التعديل، كلمة المرور اختيارية
                document.getElementById('user-password').required = false;
                document.getElementById('user-password-confirm').required = false;
                document.getElementById('password-required-star').style.display = 'none';
                document.getElementById('confirm-required-star').style.display = 'none';
                document.getElementById('user-password').value = '';
                document.getElementById('user-password-confirm').value = '';
                
                document.getElementById('user-form-modal').classList.add('active');
            } catch (error) {
                console.error('❌ Error loading user for edit:', error);
                this.showNotification('error', 'خطأ', 'فشل في تحميل بيانات المستخدم');
            }
        }
        
        resetUserForm() {
            this.currentUserId = null;
            document.getElementById('user-form')?.reset();
            document.getElementById('user-password').required = true;
            document.getElementById('user-password-confirm').required = true;
            document.getElementById('password-required-star').style.display = 'inline';
            document.getElementById('confirm-required-star').style.display = 'inline';
            // إعادة تعيين الصلاحيات
            this.setSelectedPermissions([]);
        }
        
        async submitUserForm() {
            const fullName = document.getElementById('user-fullname').value.trim();
            const username = document.getElementById('user-username').value.trim();
            const email = document.getElementById('user-email').value.trim();
            const phone = document.getElementById('user-phone').value.trim();
            const password = document.getElementById('user-password').value;
            const passwordConfirm = document.getElementById('user-password-confirm').value;
            const role = document.getElementById('user-role').value.trim(); // نص حر
            const department = document.getElementById('user-department').value;
            const status = document.getElementById('user-status').value;
            const notes = document.getElementById('user-notes').value.trim();
            const permissions = this.getSelectedPermissions();
            
            if (!fullName || !username || !email || !role || !department) {
                this.showNotification('error', 'خطأ', 'يرجى ملء جميع الحقول المطلوبة');
                return;
            }
            
            if (this.currentUserId === null && (!password || !passwordConfirm)) {
                this.showNotification('error', 'خطأ', 'يرجى إدخال كلمة المرور وتأكيدها');
                return;
            }
            
            if (password && password !== passwordConfirm) {
                this.showNotification('error', 'خطأ', 'كلمتا المرور غير متطابقتين');
                return;
            }
            
            const isActive = (status === 'نشط');
            
            const userData = {
                fullName,
                username,
                email,
                phone: phone || null,
                role,
                department,
                isActive,
                notes,
                permissions
            };
            
            if (password) {
                userData.password = password;
            }
            
            try {
                if (this.currentUserId) {
                    await this.updateUser(this.currentUserId, userData);
                } else {
                    await this.addUser(userData);
                }
                
                document.getElementById('user-form-modal').classList.remove('active');
                this.resetUserForm();
            } catch (error) {
                console.error('❌ Error submitting user form:', error);
                this.showNotification('error', 'خطأ', error.message || 'فشل في حفظ المستخدم');
            }
        }
        
        async addUser(userData) {
            const response = await this.apiClient.request('/api/admin/users', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            
            if (response.success) {
                this.showNotification('success', 'تم بنجاح', 'تم إضافة المستخدم بنجاح');
                await this.loadUsers();
                this.updateStatistics();
            } else {
                throw new Error(response.message);
            }
        }
        
        async updateUser(userId, userData) {
            const response = await this.apiClient.request(`/api/admin/users/${userId}`, {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
            
            if (response.success) {
                this.showNotification('success', 'تم بنجاح', 'تم تحديث بيانات المستخدم بنجاح');
                await this.loadUsers();
                this.updateStatistics();
            } else {
                throw new Error(response.message);
            }
        }
        
        // ---------- تغيير الحالة ----------
        async suspendUser(userId) {
            if (!confirm('هل أنت متأكد من تعطيل هذا المستخدم؟')) return;
            
            try {
                const response = await this.apiClient.request(`/api/admin/users/${userId}/status`, {
                    method: 'PATCH',
                    body: JSON.stringify({ isActive: false })
                });
                
                if (response.success) {
                    this.showNotification('success', 'تم التعطيل', 'تم تعطيل المستخدم بنجاح');
                    await this.loadUsers();
                    this.updateStatistics();
                }
            } catch (error) {
                console.error('❌ Error suspending user:', error);
                this.showNotification('error', 'خطأ', 'فشل في تعطيل المستخدم');
            }
        }
        
        async activateUser(userId) {
            if (!confirm('هل أنت متأكد من تفعيل هذا المستخدم؟')) return;
            
            try {
                const response = await this.apiClient.request(`/api/admin/users/${userId}/status`, {
                    method: 'PATCH',
                    body: JSON.stringify({ isActive: true })
                });
                
                if (response.success) {
                    this.showNotification('success', 'تم التفعيل', 'تم تفعيل المستخدم بنجاح');
                    await this.loadUsers();
                    this.updateStatistics();
                }
            } catch (error) {
                console.error('❌ Error activating user:', error);
                this.showNotification('error', 'خطأ', 'فشل في تفعيل المستخدم');
            }
        }
        
        async deleteUser(userId) {
            this.currentUserId = userId;
            document.getElementById('delete-confirm-modal').classList.add('active');
        }
        
        async confirmDeleteUser() {
            if (!this.currentUserId) return;
            
            try {
                const response = await this.apiClient.request(`/api/admin/users/${this.currentUserId}`, {
                    method: 'DELETE'
                });
                
                if (response.success) {
                    this.showNotification('success', 'تم الحذف', 'تم حذف المستخدم بنجاح');
                    document.getElementById('delete-confirm-modal').classList.remove('active');
                    this.currentUserId = null;
                    await this.loadUsers();
                    this.updateStatistics();
                }
            } catch (error) {
                console.error('❌ Error deleting user:', error);
                this.showNotification('error', 'خطأ', 'فشل في حذف المستخدم');
            }
        }
        
        // ---------- تصدير المستخدمين ----------
        async exportUsers() {
            try {
                const response = await this.apiClient.request('/api/admin/users/export/export-data');
                if (response.success && response.data) {
                    const headers = ['معرف المستخدم', 'الاسم الكامل', 'اسم المستخدم', 'البريد الإلكتروني', 'رقم الهاتف', 'الدور', 'القسم', 'الحالة', 'آخر نشاط', 'تاريخ التسجيل'];
                    const csvRows = [
                        headers.join(','),
                        ...response.data.map(row => 
                            headers.map(h => `"${row[h] || ''}"`).join(',')
                        )
                    ];
                    const csv = csvRows.join('\n');
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `مستخدمين_${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                    this.showNotification('success', 'تم التصدير', 'تم تصدير بيانات المستخدمين بنجاح');
                }
            } catch (error) {
                console.error('❌ Error exporting users:', error);
                this.showNotification('error', 'خطأ', 'فشل في تصدير المستخدمين');
            }
        }
        
        // ---------- إعداد واجهة المستخدم ----------
        setupUI() {
            this.setupDropdowns();
            this.setupTableSearch();
            this.setupTableFilters();
            this.setupTableSorting();
            this.setupButtons();
            this.setupPageSize();
            this.setupModals();
            this.setupPasswordToggle();
            
            // تعبئة خيارات الحالة في الفلتر (ثابتة)
            this.renderStatusFilters();
        }
        
        setupPasswordToggle() {
            const toggleBtn = document.getElementById('toggle-password');
            const passwordInput = document.getElementById('user-password');
            if (toggleBtn && passwordInput) {
                toggleBtn.addEventListener('click', () => {
                    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                    passwordInput.setAttribute('type', type);
                    toggleBtn.querySelector('i').classList.toggle('fa-eye');
                    toggleBtn.querySelector('i').classList.toggle('fa-eye-slash');
                });
            }
        }
        
        renderStatusFilters() {
            const statusContainer = document.getElementById('filter-status-options');
            if (!statusContainer) return;
            
            const statuses = ['نشط', 'غير نشط'];
            let html = '';
            statuses.forEach(status => {
                html += `
                    <label class="filter-option">
                        <input type="checkbox" name="status" value="${status}" checked>
                        <span class="checkmark"></span>
                        <span class="filter-label">${status}</span>
                    </label>
                `;
            });
            statusContainer.innerHTML = html;
        }
        
        setupDropdowns() {
            const userBtn = document.getElementById('user-profile-btn');
            const userDropdown = document.getElementById('user-dropdown');
            if (userBtn && userDropdown) {
                userBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    userDropdown.classList.toggle('show');
                });
                document.addEventListener('click', () => userDropdown.classList.remove('show'));
            }
        }
        
        setupTableSearch() {
            const searchInput = document.getElementById('table-search');
            const searchBtn = document.getElementById('table-search-btn');
            
            const performSearch = () => {
                this.filters.search = searchInput.value.trim();
                this.currentPage = 1;
                this.loadUsers();
            };
            
            if (searchInput) {
                searchInput.addEventListener('keyup', (e) => e.key === 'Enter' && performSearch());
                let timeout;
                searchInput.addEventListener('input', () => {
                    clearTimeout(timeout);
                    timeout = setTimeout(performSearch, 800);
                });
            }
            if (searchBtn) searchBtn.addEventListener('click', performSearch);
        }
        
        setupTableFilters() {
            const filterBtn = document.getElementById('filter-table-btn');
            const filterDropdown = document.getElementById('filter-dropdown-table');
            const applyBtn = document.getElementById('apply-filter-table');
            const resetBtn = document.getElementById('reset-filter-table');
            
            if (filterBtn && filterDropdown) {
                filterBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    filterDropdown.classList.toggle('active');
                    
                    if (window.innerWidth <= 992 && filterDropdown.classList.contains('active')) {
                        document.body.style.overflow = 'hidden';
                    } else {
                        document.body.style.overflow = '';
                    }
                });
                
                if (window.innerWidth <= 992) {
                    document.addEventListener('click', (e) => {
                        if (!filterBtn.contains(e.target) && !filterDropdown.contains(e.target)) {
                            filterDropdown.classList.remove('active');
                            document.body.style.overflow = '';
                        }
                    });
                } else {
                    document.addEventListener('click', () => {
                        filterDropdown.classList.remove('active');
                    });
                }
            }
            
            if (applyBtn) {
                applyBtn.addEventListener('click', () => {
                    this.updateFiltersFromUI();
                    this.currentPage = 1;
                    this.loadUsers();
                    filterDropdown.classList.remove('active');
                    document.body.style.overflow = '';
                });
            }
            
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    this.resetFilters();
                    this.updateFiltersUI();
                    this.currentPage = 1;
                    this.loadUsers();
                    filterDropdown.classList.remove('active');
                    document.body.style.overflow = '';
                });
            }
        }
        
        updateFiltersFromUI() {
            const statusCbs = document.querySelectorAll('input[name="status"]:checked');
            const roleCbs = document.querySelectorAll('input[name="role"]:checked');
            
            this.filters.status = Array.from(statusCbs).map(cb => cb.value);
            this.filters.role = Array.from(roleCbs).map(cb => cb.value);
        }
        
        resetFilters() {
            this.filters = {
                search: '',
                status: ['نشط', 'غير نشط'],
                role: [] // سيتم إعادة تعبئتها من loadRoles
            };
            
            const searchInput = document.getElementById('table-search');
            if (searchInput) searchInput.value = '';
            
            // إعادة تعيين الـ checkboxes
            document.querySelectorAll('input[name="status"]').forEach(cb => cb.checked = true);
            document.querySelectorAll('input[name="role"]').forEach(cb => cb.checked = true);
        }
        
        updateFiltersUI() {
            document.querySelectorAll('input[name="status"]').forEach(cb => {
                cb.checked = this.filters.status.includes(cb.value);
            });
            document.querySelectorAll('input[name="role"]').forEach(cb => {
                cb.checked = this.filters.role.includes(cb.value);
            });
        }
        
        setupTableSorting() {
            const sortBtn = document.getElementById('sort-table-btn');
            const sortDropdown = document.getElementById('sort-dropdown-table');
            const sortOptions = sortDropdown?.querySelectorAll('.sort-option');
            
            if (sortBtn && sortDropdown) {
                sortBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    sortDropdown.classList.toggle('show');
                });
                document.addEventListener('click', () => sortDropdown.classList.remove('show'));
            }
            
            if (sortOptions) {
                sortOptions.forEach(option => {
                    option.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.sortOrder = option.dataset.sort;
                        this.currentPage = 1;
                        this.loadUsers();
                        sortDropdown.classList.remove('show');
                    });
                });
            }
        }
        
        setupButtons() {
            const addUserBtn = document.getElementById('add-user-btn');
            if (addUserBtn) addUserBtn.addEventListener('click', () => this.showAddUserModal());
            
            const refreshBtn = document.getElementById('refresh-btn');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => {
                    this.loadUsers();
                    this.updateStatistics();
                    this.showNotification('success', 'تم التحديث', 'تم تحديث قائمة المستخدمين');
                });
            }
            
            const exportBtn = document.getElementById('export-btn');
            if (exportBtn) {
                exportBtn.addEventListener('click', () => this.exportUsers());
            }
        }
        
        setupPageSize() {
            const pageSizeSelect = document.getElementById('page-size');
            if (pageSizeSelect) {
                pageSizeSelect.addEventListener('change', (e) => {
                    this.pageSize = parseInt(e.target.value);
                    this.currentPage = 1;
                    this.loadUsers();
                });
            }
        }
        
        setupModals() {
            const detailModal = document.getElementById('user-detail-modal');
            const closeModalBtns = document.querySelectorAll('#modal-close-btn, #modal-close-btn-2');
            closeModalBtns.forEach(btn => {
                btn.addEventListener('click', () => detailModal.classList.remove('active'));
            });
            
            const userFormModal = document.getElementById('user-form-modal');
            const userFormCloseBtns = document.querySelectorAll('#user-form-modal-close, #user-form-cancel-btn');
            userFormCloseBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    userFormModal.classList.remove('active');
                    this.resetUserForm();
                });
            });
            
            window.addEventListener('click', (e) => {
                if (e.target === detailModal) detailModal.classList.remove('active');
                if (e.target === userFormModal) {
                    userFormModal.classList.remove('active');
                    this.resetUserForm();
                }
            });
            
            const modalDeleteBtn = document.getElementById('modal-delete-btn');
            if (modalDeleteBtn) {
                modalDeleteBtn.addEventListener('click', () => {
                    const userId = modalDeleteBtn.dataset.userId;
                    if (userId) {
                        this.deleteUser(userId);
                        detailModal.classList.remove('active');
                    }
                });
            }
            
            const modalEditBtn = document.getElementById('modal-edit-btn');
            if (modalEditBtn) {
                modalEditBtn.addEventListener('click', () => {
                    const userId = modalEditBtn.dataset.userId;
                    if (userId) {
                        this.showEditUserModal(userId);
                        detailModal.classList.remove('active');
                    }
                });
            }
            
            const userFormSubmitBtn = document.getElementById('user-form-submit-btn');
            if (userFormSubmitBtn) {
                userFormSubmitBtn.addEventListener('click', () => this.submitUserForm());
            }
            
            const deleteConfirmModal = document.getElementById('delete-confirm-modal');
            const deleteCancelBtn = document.getElementById('delete-cancel-btn');
            const deleteConfirmBtn = document.getElementById('delete-confirm-btn');
            const deleteModalClose = document.getElementById('delete-modal-close');
            
            if (deleteCancelBtn) deleteCancelBtn.addEventListener('click', () => deleteConfirmModal.classList.remove('active'));
            if (deleteModalClose) deleteModalClose.addEventListener('click', () => deleteConfirmModal.classList.remove('active'));
            if (deleteConfirmBtn) {
                deleteConfirmBtn.addEventListener('click', () => {
                    this.confirmDeleteUser();
                });
            }
        }
        
        // ---------- الإحصائيات والمخططات ----------
        async updateStatistics() {
            try {
                const response = await this.apiClient.request('/api/admin/users/stats');
                if (response.success) {
                    const stats = response.data;
                    
                    const totalUsersEl = document.getElementById('total-users');
                    const activeUsersEl = document.getElementById('active-users');
                    const inactiveUsersEl = document.getElementById('inactive-users');
                    const overviewTotal = document.getElementById('overview-total');
                    const overviewActive = document.getElementById('overview-active');
                    const overviewInactive = document.getElementById('overview-inactive');
                    const overviewAdmins = document.getElementById('overview-admins');
                    
                    if (totalUsersEl) totalUsersEl.textContent = stats.totalUsers;
                    if (activeUsersEl) activeUsersEl.textContent = stats.activeUsers;
                    if (inactiveUsersEl) inactiveUsersEl.textContent = stats.inactiveUsers;
                    if (overviewTotal) overviewTotal.textContent = stats.totalUsers;
                    if (overviewActive) overviewActive.textContent = stats.activeUsers;
                    if (overviewInactive) overviewInactive.textContent = stats.inactiveUsers;
                    if (overviewAdmins) overviewAdmins.textContent = stats.admins;
                    
                    this.updateChartData(stats);
                    await this.updateRecentUsers();
                }
            } catch (error) {
                console.warn('⚠️ Could not load stats from API, using local data');
                this.updateStatisticsFallback();
            }
        }
        
        updateStatisticsFallback() {
            const total = this.users.length;
            const active = this.users.filter(u => u.status === 'نشط').length;
            const inactive = this.users.filter(u => u.status === 'غير نشط').length;
            const admins = this.users.filter(u => u.role === 'مشرف عام').length;
            
            document.getElementById('total-users').textContent = total;
            document.getElementById('active-users').textContent = active;
            document.getElementById('inactive-users').textContent = inactive;
            document.getElementById('overview-total').textContent = total;
            document.getElementById('overview-active').textContent = active;
            document.getElementById('overview-inactive').textContent = inactive;
            document.getElementById('overview-admins').textContent = admins;
        }
        
        setupChart() {
            const chartCanvas = document.getElementById('users-chart');
            if (!chartCanvas) return;
            
            const ctx = chartCanvas.getContext('2d');
            
            const darkColors = ['#121212', '#1E1E1E', '#2C2C2C', '#3A3A3A', '#4A4A4A', '#C0C0C0'];
            const borderColors = ['#000000', '#1A1A1A', '#282828', '#363636', '#464646', '#B0B0B0'];
            const hoverColors = ['#1A1A1A', '#282828', '#363636', '#464646', '#565656', '#D0D0D0'];
            
            this.chartInstance = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: darkColors,
                        borderColor: borderColors,
                        borderWidth: 2,
                        hoverBackgroundColor: hoverColors,
                        hoverBorderColor: 'rgba(255,255,255,0.3)',
                        hoverBorderWidth: 3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: '#F5F5F5',
                                font: { family: 'Tajawal', size: 12, weight: '500' },
                                padding: 20,
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(25,25,25,0.95)',
                            titleColor: '#F5F5F5',
                            bodyColor: '#F5F5F5',
                            borderColor: 'rgba(203,205,205,0.3)',
                            borderWidth: 1,
                            cornerRadius: 8,
                            padding: 12,
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a,b) => a + b, 0);
                                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                    return `${label}: ${value} مستخدم (${percentage}%)`;
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
                periodSelect.addEventListener('change', () => this.updateChartData());
            }
        }
        
        updateChartData(stats = null) {
            if (!this.chartInstance) return;
            
            const chartType = document.getElementById('chart-period').value;
            let labels, data;
            
            if (stats) {
                if (chartType === 'roles') {
                    labels = Object.keys(stats.roleDistribution);
                    data = Object.values(stats.roleDistribution);
                } else if (chartType === 'status') {
                    labels = Object.keys(stats.statusDistribution);
                    data = Object.values(stats.statusDistribution);
                } else {
                    labels = Object.keys(stats.roleDistribution);
                    data = Object.values(stats.roleDistribution);
                }
            } else {
                if (chartType === 'roles') {
                    const roleCount = {};
                    this.users.forEach(u => { roleCount[u.role] = (roleCount[u.role] || 0) + 1; });
                    labels = Object.keys(roleCount);
                    data = Object.values(roleCount);
                } else if (chartType === 'status') {
                    const active = this.users.filter(u => u.status === 'نشط').length;
                    const inactive = this.users.filter(u => u.status === 'غير نشط').length;
                    labels = ['نشط', 'غير نشط'];
                    data = [active, inactive];
                } else {
                    const roleCount = {};
                    this.users.forEach(u => { roleCount[u.role] = (roleCount[u.role] || 0) + 1; });
                    labels = Object.keys(roleCount);
                    data = Object.values(roleCount);
                }
            }
            
            this.chartInstance.data.labels = labels;
            this.chartInstance.data.datasets[0].data = data;
            this.chartInstance.update();
        }
        
        async updateRecentUsers() {
            try {
                const response = await this.apiClient.request('/api/admin/users/recent?limit=4');
                let users = response.success ? response.data : [];
                
                const container = document.getElementById('recent-users');
                if (!container) return;
                
                let html = '';
                if (users.length === 0) {
                    html = '<div class="empty-state"><i class="fas fa-users"></i><p>لا يوجد مستخدمين حديثين</p></div>';
                } else {
                    users.forEach(user => {
                        const timeAgo = this.getTimeAgo(user.createdAt);
                        const statusClass = this.getStatusClass(user.status).replace('status-', '');
                        html += `
                            <div class="recent-item">
                                <div class="recent-item-icon"><i class="fas fa-user-circle"></i></div>
                                <div class="recent-item-content">
                                    <div class="recent-item-header">
                                        <h5 class="recent-item-title">${user.fullName}</h5>
                                        <span class="recent-item-time">${timeAgo}</span>
                                    </div>
                                    <p class="recent-item-message">${user.role} • ${user.department || 'غير محدد'}</p>
                                    <span class="recent-item-status ${statusClass}">${user.status}</span>
                                </div>
                            </div>
                        `;
                    });
                }
                container.innerHTML = html;
            } catch (error) {
                console.warn('⚠️ Could not load recent users');
            }
        }
        
        // ---------- تحسينات الجوال ----------
        setupMobileEnhancements() {
            this.setupMobileMenu();
            this.setupMobileFilters();
            this.setupMobileButtonEffects();
            this.detectMobile();
        }
        
        setupMobileMenu() {
            const menuToggle = document.getElementById('menu-toggle');
            const sidebar = document.getElementById('dashboard-sidebar');
            const sidebarClose = document.getElementById('sidebar-close');
            const backdrop = document.getElementById('sidebar-backdrop');
            const body = document.body;
            
            if (menuToggle && sidebar) {
                menuToggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    sidebar.classList.toggle('active');
                    menuToggle.classList.toggle('active');
                    
                    if (backdrop) backdrop.classList.toggle('active');
                    
                    if (sidebar.classList.contains('active')) {
                        body.style.overflow = 'hidden';
                        body.classList.add('sidebar-open');
                    } else {
                        body.style.overflow = '';
                        body.classList.remove('sidebar-open');
                    }
                });
                
                if (sidebarClose) {
                    sidebarClose.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        sidebar.classList.remove('active');
                        menuToggle.classList.remove('active');
                        if (backdrop) backdrop.classList.remove('active');
                        body.style.overflow = '';
                        body.classList.remove('sidebar-open');
                    });
                }
                
                if (backdrop) {
                    backdrop.addEventListener('click', () => {
                        sidebar.classList.remove('active');
                        menuToggle.classList.remove('active');
                        backdrop.classList.remove('active');
                        body.style.overflow = '';
                        body.classList.remove('sidebar-open');
                    });
                }
                
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && sidebar.classList.contains('active')) {
                        sidebar.classList.remove('active');
                        menuToggle.classList.remove('active');
                        if (backdrop) backdrop.classList.remove('active');
                        body.style.overflow = '';
                        body.classList.remove('sidebar-open');
                    }
                });
            }
        }
        
        setupMobileFilters() {
            const filterBtn = document.getElementById('filter-table-btn');
            const filterDropdown = document.getElementById('filter-dropdown-table');
            
            if (filterBtn && filterDropdown && window.innerWidth <= 992) {
                filterDropdown.style.position = 'fixed';
                filterDropdown.style.bottom = '0';
                filterDropdown.style.left = '0';
                filterDropdown.style.width = '100%';
                filterDropdown.style.maxHeight = '80vh';
                filterDropdown.style.borderRadius = '16px 16px 0 0';
                filterDropdown.style.transform = 'translateY(100%)';
                filterDropdown.style.transition = 'transform 0.3s ease';
                filterDropdown.style.zIndex = '2000';
                filterDropdown.style.padding = '0';
                
                const toggleFilter = (e) => {
                    e.stopPropagation();
                    filterDropdown.classList.toggle('active');
                    
                    if (filterDropdown.classList.contains('active')) {
                        filterDropdown.style.transform = 'translateY(0)';
                        document.body.style.overflow = 'hidden';
                    } else {
                        filterDropdown.style.transform = 'translateY(100%)';
                        document.body.style.overflow = '';
                    }
                };
                
                filterBtn.addEventListener('click', toggleFilter);
                
                document.addEventListener('click', (e) => {
                    if (!filterBtn.contains(e.target) && !filterDropdown.contains(e.target)) {
                        filterDropdown.classList.remove('active');
                        filterDropdown.style.transform = 'translateY(100%)';
                        document.body.style.overflow = '';
                    }
                });
                
                const applyBtn = document.getElementById('apply-filter-table');
                const resetBtn = document.getElementById('reset-filter-table');
                
                if (applyBtn) {
                    applyBtn.addEventListener('click', () => {
                        filterDropdown.classList.remove('active');
                        filterDropdown.style.transform = 'translateY(100%)';
                        document.body.style.overflow = '';
                    });
                }
                
                if (resetBtn) {
                    resetBtn.addEventListener('click', () => {
                        setTimeout(() => {
                            filterDropdown.classList.remove('active');
                            filterDropdown.style.transform = 'translateY(100%)';
                            document.body.style.overflow = '';
                        }, 300);
                    });
                }
            }
        }
        
        setupMobileButtonEffects() {
            if ('ontouchstart' in window) {
                document.addEventListener('touchstart', (e) => {
                    const btn = e.target.closest('.btn, .action-btn, .pagination-btn');
                    if (btn && !btn.disabled) {
                        btn.style.transform = 'scale(0.95)';
                        btn.style.transition = 'transform 0.1s ease';
                    }
                }, { passive: true });
                
                document.addEventListener('touchend', (e) => {
                    const btn = e.target.closest('.btn, .action-btn, .pagination-btn');
                    if (btn) {
                        setTimeout(() => btn.style.transform = '', 150);
                    }
                }, { passive: true });
            }
        }
        
        detectMobile() {
            const isMobile = window.innerWidth <= 768;
            if (isMobile) document.body.classList.add('mobile-view');
            
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    const currentIsMobile = window.innerWidth <= 768;
                    document.body.classList.toggle('mobile-view', currentIsMobile);
                }, 250);
            });
        }
        
        async checkApiHealth() {
            try {
                const response = await this.apiClient.request('/api/health');
                if (response.success) {
                    console.log('✅ API is healthy');
                }
            } catch (error) {
                console.error('❌ API Health Check Failed:', error);
                this.showNotification('warning', 'تنبيه', 'لا يمكن الاتصال بخادم البيانات');
            }
        }
        
        updateSystemTime() {
            const systemTimeElement = document.getElementById('system-time');
            if (systemTimeElement) {
                const now = new Date();
                const timeString = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: true });
                const dateString = now.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                systemTimeElement.textContent = `${timeString} - ${dateString}`;
            }
        }
        
        showNotification(type, title, message) {
            if (window.Notifications && typeof window.Notifications.show === 'function') {
                window.Notifications.show({ type, title, message, duration: 3000 });
            } else {
                console.log(`${type.toUpperCase()}: ${title} - ${message}`);
                const area = document.getElementById('notification-area');
                if (area) {
                    const n = document.createElement('div');
                    n.className = `notification notification-${type}`;
                    n.innerHTML = `
                        <div class="notification-icon"><i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i></div>
                        <div class="notification-content"><h4>${title}</h4><p>${message}</p></div>
                        <button class="notification-close"><i class="fas fa-times"></i></button>
                    `;
                    area.appendChild(n);
                    setTimeout(() => { n.style.opacity = '0'; setTimeout(() => n.remove(), 300); }, 5000);
                    n.querySelector('.notification-close').onclick = () => n.remove();
                }
            }
        }
        
        showLoading() {
            const tableBody = document.getElementById('users-table-body');
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr class="loading-row">
                        <td colspan="12">
                            <div class="loading-content">
                                <div class="loading-spinner"></div>
                                <span>جاري تحميل المستخدمين من قاعدة البيانات...</span>
                            </div>
                         </td>
                    </tr>
                `;
            }
        }
    }
    
    function initialize() {
        try {
            window.usersManager = new UsersManager();
            console.log('✅ UsersManager initialized with multi-permissions and free role');
        } catch (error) {
            console.error('❌ Failed to initialize UsersManager:', error);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();