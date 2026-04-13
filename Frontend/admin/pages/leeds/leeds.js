// ===== صفحة إدارة العملاء - نظام إدارة العقارات =====
// تم التحديث مع دمج كامل للعملاء وعرض العقود وحساب أعداد الفلاتر ديناميكياً

(function() {
    'use strict';
    
    console.log('✅ leeds.js loaded - FULL CLIENT MERGE WITH CONTRACTS DISPLAY + DYNAMIC FILTER COUNTS');
    
    class ClientsManager {
        constructor() {
            this.baseURL = 'http://localhost:3001';
            this.apiClient = this.createApiClient();
            this.currentUser = null;
            this.clients = [];
            this.filteredClients = [];
            this.currentPage = 1;
            this.pageSize = 25;
            this.totalPages = 1;
            this.totalItems = 0;
            this.filters = {
                search: '',
                clientType: [], // تغيير: مصفوفة فارغة لعرض الكل افتراضيًا
                status: [],     // تغيير: مصفوفة فارغة لعرض الكل افتراضيًا
                priority: [],   // تغيير: مصفوفة فارغة لعرض الكل افتراضيًا
                dateFrom: null,
                dateTo: null
            };
            this.sortOrder = 'newest';
            this.chartInstance = null;
            this.editingClientId = null;
            this.currentClientId = null;
            this.isLoading = false;
            this.allClientsRaw = []; // لحفظ كل العملاء بدون فلترة لحساب أعداد الفلاتر
            
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
            console.log('🚀 ClientsManager initializing with real API...');
            
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setupPage());
            } else {
                this.setupPage();
            }
        }
        
        async setupPage() {
            console.log('🔧 Setting up clients management page with real data...');
            
            await this.checkAuth();
            await this.checkApiHealth();
            await this.loadProjects();
            await this.loadAllClientsForFilters(); // تحميل كل العملاء لحساب أعداد الفلاتر
            await this.loadClients();
            
            this.setupUI();
            this.updateStatistics();
            this.setupChart();
            this.setupMobileEnhancements();
            this.updateSystemTime();
            setInterval(() => this.updateSystemTime(), 60000);
        }
        
        // تحميل كل العملاء (بدون فلترة) لحساب أعداد الفلاتر
        async loadAllClientsForFilters() {
            try {
                const response = await this.apiClient.request('/api/admin/leeds?limit=10000');
                if (response.success) {
                    this.allClientsRaw = response.data || [];
                }
            } catch (error) {
                console.warn('⚠️ Could not load all clients for filter counts');
                this.allClientsRaw = [];
            }
        }
        
        // تحديث أعداد الفلاتر في واجهة المستخدم
        updateFilterCountsFromData() {
            const counts = {
                clientType: { 'محتمل': 0, 'متعاقد': 0 },
                status: { 'مؤهل': 0, 'تحت المتابعة': 0, 'متعاقد': 0, 'مفقود': 0 },
                priority: { 'عالي': 0, 'متوسط': 0, 'منخفض': 0 }
            };
            
            this.allClientsRaw.forEach(client => {
                // clientType
                if (client.clientType) counts.clientType[client.clientType] = (counts.clientType[client.clientType] || 0) + 1;
                // status
                if (client.status) counts.status[client.status] = (counts.status[client.status] || 0) + 1;
                // priority
                if (client.priority) counts.priority[client.priority] = (counts.priority[client.priority] || 0) + 1;
            });
            
            // تحديث عناصر HTML
            document.querySelectorAll('input[name="clientType"]').forEach(cb => {
                const value = cb.value;
                const countSpan = cb.closest('.filter-option')?.querySelector('.filter-count');
                if (countSpan) countSpan.textContent = counts.clientType[value] || 0;
            });
            
            document.querySelectorAll('input[name="status"]').forEach(cb => {
                const value = cb.value;
                const countSpan = cb.closest('.filter-option')?.querySelector('.filter-count');
                if (countSpan) countSpan.textContent = counts.status[value] || 0;
            });
            
            document.querySelectorAll('input[name="priority"]').forEach(cb => {
                const value = cb.value;
                const countSpan = cb.closest('.filter-option')?.querySelector('.filter-count');
                if (countSpan) countSpan.textContent = counts.priority[value] || 0;
            });
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
                        role: 'مشرف_عام'
                    };
                }
                this.updateUserInfo();
            } catch (error) {
                console.warn('⚠️ No user in localStorage, using test user');
                this.currentUser = {
                    id: 1,
                    fullName: 'أحمد محمد',
                    role: 'مشرف_عام'
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
                const roleMap = {
                    'مشرف_عام': 'مشرف عام',
                    'مدير_مشاريع': 'مدير مشاريع',
                    'محاسب': 'محاسب',
                    'موظف_استقبال': 'موظف استقبال'
                };
                userRoleElement.textContent = roleMap[this.currentUser.role] || this.currentUser.role;
            }
        }
        
        // ---------- تحميل المشاريع للقوائم المنسدلة ----------
        async loadProjects() {
            try {
                const response = await this.apiClient.request('/api/admin/leeds/projects');
                if (response.success) {
                    this.projects = response.data || [];
                    console.log(`✅ Loaded ${this.projects.length} projects`);
                    this.populateProjectSelects();
                }
            } catch (error) {
                console.warn('⚠️ Could not load projects from API, using empty list');
                this.projects = [];
            }
        }
        
        populateProjectSelects() {
            const projectSelect = document.getElementById('client-project');
            if (!projectSelect) return;
            
            projectSelect.innerHTML = '<option value="">-- اختر مشروع --</option>';
            this.projects.forEach(p => {
                const option = document.createElement('option');
                option.value = p.id;
                option.textContent = p.projectName;
                projectSelect.appendChild(option);
            });
        }
        
        // ---------- تحميل العملاء ----------
        async loadClients() {
            try {
                console.log('📥 Loading clients from database...');
                this.showLoading();
                this.isLoading = true;
                
                const params = new URLSearchParams({
                    page: this.currentPage,
                    limit: this.pageSize,
                    sort: this.sortOrder,
                    search: this.filters.search,
                    clientType: this.filters.clientType.join(','),
                    status: this.filters.status.join(','),
                    priority: this.filters.priority.join(','),
                    dateFrom: this.filters.dateFrom || '',
                    dateTo: this.filters.dateTo || ''
                });
                
                const response = await this.apiClient.request(`/api/admin/leeds?${params}`);
                
                if (response.success) {
                    this.clients = response.data || [];
                    this.totalItems = response.pagination?.totalItems || this.clients.length;
                    this.totalPages = response.pagination?.totalPages || 1;
                    this.filteredClients = [...this.clients];
                    console.log(`✅ Loaded ${this.clients.length} clients`);
                    this.renderTable();
                    this.updateStatistics();
                }
            } catch (error) {
                console.error('❌ Error loading clients:', error);
                this.showNotification('error', 'خطأ', 'فشل تحميل العملاء');
                this.clients = [];
                this.filteredClients = [];
                this.renderTable();
                this.updateStatistics();
            } finally {
                this.isLoading = false;
            }
        }
        
        // ---------- عرض الجدول (محدث لعرض العقود بشكل أفضل) ----------
        renderTable() {
            const tableBody = document.getElementById('clients-table-body');
            if (!tableBody) return;
            
            const startIndex = (this.currentPage - 1) * this.pageSize;
            const endIndex = Math.min(startIndex + this.pageSize, this.filteredClients.length);
            const pageData = this.filteredClients.slice(startIndex, endIndex);
            
            let html = '';
            if (pageData.length === 0) {
                html = `
                    <tr class="empty-row">
                        <td colspan="11">
                            <div class="empty-state">
                                <i class="fas fa-users"></i>
                                <h4>لا توجد عملاء</h4>
                                <p>لا توجد عملاء تطابق معايير البحث</p>
                                ${this.isLoading ? '' : '<button class="btn btn-primary mt-3" id="add-first-client">إضافة أول عميل</button>'}
                            </div>
                        </td>
                    </tr>
                `;
            } else {
                pageData.forEach(client => {
                    const statusClass = this.getStatusClass(client.status);
                    const priorityClass = this.getPriorityClass(client.priority);
                    const clientTypeClass = client.clientType === 'متعاقد' ? 'status-contracted' : 'status-potential';
                    const dateFormatted = this.formatDate(client.createdAt);
                    
                    // بناء محتوى عمود "المعقود معه"
                    let contractsHtml = '';
                    if (client.contracts && client.contracts.length > 0) {
                        if (client.contracts.length === 1) {
                            // عقد واحد → نعرض رقم العقد
                            contractsHtml = `
                                <span class="contracts-info has-contracts" title="رقم العقد: ${client.contracts[0].contractNumber || ''}">
                                    ${client.contracts[0].contractNumber || 'عقد'}
                                </span>
                            `;
                        } else {
                            // عدة عقود → نعرض عدد العقود مع قائمة منبثقة
                            const contractNumbers = client.contracts.map(c => c.contractNumber).filter(Boolean).join('، ');
                            contractsHtml = `
                                <span class="contracts-info has-contracts" title="العقود: ${contractNumbers}">
                                    ${client.contracts.length} عقود
                                </span>
                            `;
                        }
                    } else {
                        contractsHtml = '<span class="contracts-info no-contracts">لا يوجد</span>';
                    }
                    
                    html += `
                        <tr data-client-id="${client.id}">
                            <td>
                                <label class="checkbox-cell">
                                    <input type="checkbox" class="client-checkbox" data-id="${client.id}">
                                    <span class="checkmark"></span>
                                </label>
                            </td>
                            <td>
                                <span class="client-code">${client.clientCode || `CLIENT-${client.id}`}</span>
                            </td>
                            <td>
                                <div class="client-info">
                                    <div class="client-name">${client.customerName}</div>
                                </div>
                            </td>
                            <td>
                                <div class="contact-info">
                                    <div class="contact-email">
                                        <i class="fas fa-envelope"></i>
                                        <span>${client.customerEmail}</span>
                                    </div>
                                    <div class="contact-phone">
                                        <i class="fas fa-phone"></i>
                                        <span>${client.customerPhone}</span>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <span class="project-name">${client.projectName || '--'}</span>
                            </td>
                            <td>
                                <span class="status-badge ${clientTypeClass}">${client.clientType}</span>
                            </td>
                            <td>
                                <span class="status-badge ${statusClass}">${client.status}</span>
                            </td>
                            <td>
                                <span class="priority-badge ${priorityClass}">${client.priority}</span>
                            </td>
                            <td>
                                <span class="client-date">${dateFormatted}</span>
                            </td>
                            <td>
                                ${contractsHtml}
                            </td>
                            <td>
                                <div class="action-buttons">
                                    <button class="action-btn btn-view view-client" data-id="${client.id}" title="عرض التفاصيل">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="action-btn btn-edit edit-client" data-id="${client.id}" title="تعديل">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="action-btn btn-delete delete-client" data-id="${client.id}" title="حذف">
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
            this.updateFilterCountsFromData(); // تحديث أعداد الفلاتر
            this.attachTableEvents();
            
            const addFirstBtn = document.getElementById('add-first-client');
            if (addFirstBtn) addFirstBtn.addEventListener('click', () => this.showAddClientForm());
        }
        
        getStatusClass(status) {
            const statusMap = {
                'مؤهل': 'status-qualified',
                'تحت المتابعة': 'status-follow-up',
                'متعاقد': 'status-contracted',
                'مفقود': 'status-lost'
            };
            return statusMap[status] || 'status-qualified';
        }
        
        getPriorityClass(priority) {
            const priorityMap = {
                'عالي': 'priority-high',
                'متوسط': 'priority-medium',
                'منخفض': 'priority-low'
            };
            return priorityMap[priority] || 'priority-medium';
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
            } catch {
                return dateString;
            }
        }
        
        formatCurrency(amount) {
            if (!amount && amount !== 0) return '0 ر.س';
            return new Intl.NumberFormat('ar-SA', {
                style: 'currency',
                currency: 'SAR',
                minimumFractionDigits: 0
            }).format(amount);
        }
        
        // ---------- الترقيم ----------
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
                        this.loadClients();
                    }
                });
            });
            
            const prevBtn = document.querySelector('.prev-btn');
            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    if (this.currentPage > 1) {
                        this.currentPage--;
                        this.loadClients();
                    }
                });
            }
            
            const nextBtn = document.querySelector('.next-btn');
            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    if (this.currentPage < this.totalPages) {
                        this.currentPage++;
                        this.loadClients();
                    }
                });
            }
        }
        
        // ---------- أحداث الجدول ----------
        attachTableEvents() {
            document.querySelectorAll('.view-client').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    this.showClientDetail(id);
                });
            });
            
            document.querySelectorAll('.edit-client').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    this.showEditClientForm(id);
                });
            });
            
            document.querySelectorAll('.delete-client').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    this.currentClientId = id;
                    document.getElementById('delete-confirm-modal').classList.add('active');
                });
            });
            
            const selectAll = document.getElementById('select-all');
            if (selectAll) {
                selectAll.addEventListener('change', (e) => {
                    document.querySelectorAll('.client-checkbox').forEach(cb => cb.checked = e.target.checked);
                });
            }
        }
        
        // ---------- عرض تفاصيل العميل (محدث لعرض العقود بشكل منظم مع حالة الدفع) ----------
        async showClientDetail(clientId) {
            try {
                const response = await this.apiClient.request(`/api/admin/leeds/${clientId}`);
                if (!response.success) throw new Error(response.message);
                
                const client = response.data;
                this.editingClientId = clientId;
                
                const modal = document.getElementById('client-detail-modal');
                const modalBody = document.getElementById('modal-client-body');
                const modalTitle = document.getElementById('modal-client-title');
                
                modalTitle.textContent = `تفاصيل العميل: ${client.customerName}`;
                
                const createdAt = this.formatDate(client.createdAt);
                const updatedAt = this.formatDate(client.updatedAt);
                const nextFollowUp = client.nextFollowUp ? this.formatDate(client.nextFollowUp) : '--';
                const statusClass = this.getStatusClass(client.status);
                const priorityClass = this.getPriorityClass(client.priority);
                const clientTypeClass = client.clientType === 'متعاقد' ? 'status-contracted' : 'status-potential';
                const assignedTo = client.assignedToName || 'غير معين';
                const budget = client.budget ? this.formatCurrency(client.budget) : '--';
                
                let contractsHtml = '';
                if (client.contracts && client.contracts.length > 0) {
                    contractsHtml = `
                        <div class="detail-section">
                            <h4><i class="fas fa-file-contract"></i> العقود (${client.contracts.length})</h4>
                            <div class="contracts-list">
                                ${client.contracts.map(contract => `
                                    <div class="contract-item">
                                        <div class="contract-header">
                                            <h5 class="contract-title">${contract.contractNumber || 'عقد'}</h5>
                                            <span class="contract-status">${contract.contractStatus}</span>
                                        </div>
                                        <div class="contract-details">
                                            <div>النوع: ${contract.contractType}</div>
                                            <div>من: ${this.formatDate(contract.startDate)}</div>
                                            <div>إلى: ${this.formatDate(contract.endDate)}</div>
                                            <div>القيمة: ${this.formatCurrency(contract.totalAmount)}</div>
                                            <div>المسدد: ${this.formatCurrency(contract.paidAmount)}</div>
                                            <div>حالة الدفع: ${contract.paymentStatus}</div>
                                            <div>حالة الدفع (شهر/آخر): <span class="payment-status-badge">${contract.paymentStatusForDisplay || 'غير معروف'}</span></div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                } else {
                    contractsHtml = `
                        <div class="detail-section">
                            <h4><i class="fas fa-file-contract"></i> العقود</h4>
                            <p class="text-muted">لا يوجد عقود لهذا العميل</p>
                        </div>
                    `;
                }
                
                const html = `
                    <div class="client-detail">
                        <div class="detail-section">
                            <h4><i class="fas fa-info-circle"></i> معلومات عامة</h4>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <span class="detail-label">كود العميل:</span>
                                    <span class="detail-value">${client.clientCode || `CLIENT-${client.id}`}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">نوع العميل:</span>
                                    <span class="status-badge ${clientTypeClass}">${client.clientType}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">الحالة:</span>
                                    <span class="status-badge ${statusClass}">${client.status}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">الأولوية:</span>
                                    <span class="priority-badge ${priorityClass}">${client.priority}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">معين إلى:</span>
                                    <span class="detail-value">${assignedTo}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">مصدر العميل:</span>
                                    <span class="detail-value">${client.leadSource || '--'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h4><i class="fas fa-user"></i> معلومات العميل</h4>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <span class="detail-label">الاسم:</span>
                                    <span class="detail-value">${client.customerName}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">الهوية الوطنية:</span>
                                    <span class="detail-value">${client.customerNationalId || '--'}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">البريد الإلكتروني:</span>
                                    <span class="detail-value">${client.customerEmail}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">الهاتف:</span>
                                    <span class="detail-value">${client.customerPhone}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">العنوان:</span>
                                    <span class="detail-value">${client.customerAddress || '--'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h4><i class="fas fa-building"></i> معلومات المشروع</h4>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <span class="detail-label">المشروع المهتم به:</span>
                                    <span class="detail-value">${client.projectName || '--'}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">نوع الوحدة:</span>
                                    <span class="detail-value">${client.unitType || '--'}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">الميزانية:</span>
                                    <span class="detail-value">${budget}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h4><i class="fas fa-clock"></i> التواريخ والمتابعة</h4>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <span class="detail-label">تاريخ التسجيل:</span>
                                    <span class="detail-value">${createdAt}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">آخر تحديث:</span>
                                    <span class="detail-value">${updatedAt}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">موعد المتابعة القادمة:</span>
                                    <span class="detail-value">${nextFollowUp}</span>
                                </div>
                            </div>
                        </div>
                        
                        ${contractsHtml}
                        
                        ${client.notes ? `
                            <div class="detail-section">
                                <h4><i class="fas fa-sticky-note"></i> ملاحظات</h4>
                                <div class="message-content">
                                    ${client.notes}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                `;
                
                modalBody.innerHTML = html;
                modal.classList.add('active');
                
                const editBtn = document.getElementById('modal-edit-btn');
                editBtn.onclick = () => {
                    modal.classList.remove('active');
                    this.showEditClientForm(clientId);
                };
                
            } catch (error) {
                console.error('❌ Error showing client detail:', error);
                this.showNotification('error', 'خطأ', 'فشل في تحميل تفاصيل العميل');
            }
        }
        
        // ---------- إضافة/تعديل عميل ----------
        showAddClientForm() {
            this.editingClientId = null;
            
            const formModal = document.getElementById('client-form-modal');
            const formTitle = document.getElementById('form-modal-title');
            const formSubmitBtn = document.getElementById('form-submit-btn');
            
            formTitle.textContent = 'إضافة عميل جديد';
            formSubmitBtn.textContent = 'إضافة العميل';
            
            this.resetClientForm();
            formModal.classList.add('active');
        }
        
        async showEditClientForm(clientId) {
            try {
                const response = await this.apiClient.request(`/api/admin/leeds/${clientId}`);
                if (!response.success) throw new Error(response.message);
                
                const client = response.data;
                this.editingClientId = clientId;
                
                const formModal = document.getElementById('client-form-modal');
                const formTitle = document.getElementById('form-modal-title');
                const formSubmitBtn = document.getElementById('form-submit-btn');
                
                formTitle.textContent = `تعديل العميل: ${client.customerName}`;
                formSubmitBtn.textContent = 'حفظ التعديلات';
                
                this.fillClientForm(client);
                formModal.classList.add('active');
            } catch (error) {
                console.error('❌ Error loading client for edit:', error);
                this.showNotification('error', 'خطأ', 'فشل في تحميل بيانات العميل');
            }
        }
        
        fillClientForm(client) {
            document.getElementById('client-name').value = client.customerName || '';
            document.getElementById('client-email').value = client.customerEmail || '';
            document.getElementById('client-phone').value = client.customerPhone || '';
            document.getElementById('client-national-id').value = client.customerNationalId || '';
            document.getElementById('client-address').value = client.customerAddress || '';
            document.getElementById('client-project').value = client.projectId || '';
            document.getElementById('client-type').value = client.clientType === 'متعاقد' ? 'متعاقد' : 'محتمل';
            document.getElementById('client-status').value = client.status || 'مؤهل';
            document.getElementById('client-budget').value = client.budget || '';
            document.getElementById('client-priority').value = client.priority || 'متوسط';
            document.getElementById('client-notes').value = client.notes || '';
            
            if (client.nextFollowUp) {
                const date = new Date(client.nextFollowUp);
                const formattedDate = date.toISOString().split('T')[0];
                document.getElementById('next-follow-up').value = formattedDate;
            } else {
                document.getElementById('next-follow-up').value = '';
            }
        }
        
        resetClientForm() {
            const form = document.getElementById('client-form');
            if (form) form.reset();
            this.editingClientId = null;
        }
        
        async saveClient() {
            try {
                const formData = {
                    customerName: document.getElementById('client-name').value.trim(),
                    customerEmail: document.getElementById('client-email').value.trim(),
                    customerPhone: document.getElementById('client-phone').value.trim(),
                    customerNationalId: document.getElementById('client-national-id').value.trim(),
                    customerAddress: document.getElementById('client-address').value.trim(),
                    projectId: document.getElementById('client-project').value,
                    clientType: document.getElementById('client-type').value,
                    status: document.getElementById('client-status').value,
                    budget: document.getElementById('client-budget').value ? parseFloat(document.getElementById('client-budget').value) : null,
                    priority: document.getElementById('client-priority').value,
                    notes: document.getElementById('client-notes').value.trim(),
                    nextFollowUp: document.getElementById('next-follow-up').value,
                    assignedTo: this.currentUser.id
                };
                
                if (!formData.customerName || !formData.customerEmail || !formData.customerPhone) {
                    this.showNotification('error', 'خطأ', 'يرجى ملء الحقول المطلوبة (الاسم، البريد، الهاتف)');
                    return;
                }
                
                let response;
                if (this.editingClientId) {
                    response = await this.apiClient.request(`/api/admin/leeds/${this.editingClientId}`, {
                        method: 'PUT',
                        body: JSON.stringify(formData)
                    });
                } else {
                    response = await this.apiClient.request('/api/admin/leeds', {
                        method: 'POST',
                        body: JSON.stringify(formData)
                    });
                }
                
                if (response.success) {
                    this.showNotification('success', 'تم بنجاح', this.editingClientId ? 'تم تحديث العميل' : 'تم إضافة العميل');
                    document.getElementById('client-form-modal').classList.remove('active');
                    this.resetClientForm();
                    await this.loadAllClientsForFilters();
                    await this.loadClients();
                    this.updateStatistics();
                }
            } catch (error) {
                console.error('❌ Error saving client:', error);
                this.showNotification('error', 'خطأ', error.message || 'فشل في حفظ بيانات العميل');
            }
        }
        
        // ---------- حذف عميل ----------
        async deleteClient() {
            if (!this.currentClientId) return;
            
            try {
                const response = await this.apiClient.request(`/api/admin/leeds/${this.currentClientId}`, {
                    method: 'DELETE'
                });
                
                if (response.success) {
                    this.showNotification('success', 'تم الحذف', 'تم حذف العميل بنجاح');
                    document.getElementById('delete-confirm-modal').classList.remove('active');
                    this.currentClientId = null;
                    await this.loadAllClientsForFilters();
                    await this.loadClients();
                    this.updateStatistics();
                }
            } catch (error) {
                console.error('❌ Error deleting client:', error);
                this.showNotification('error', 'خطأ', 'فشل في حذف العميل');
            }
        }
        
        // ---------- إعداد واجهة المستخدم ----------
        setupUI() {
            this.setupDropdowns();
            this.setupTableSearch();
            this.setupTableFilters();
            this.setupButtons();
            this.setupPageSize();
            this.setupModals();
            this.setupClientFormLayout();
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
                this.loadClients();
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
                    document.addEventListener('click', () => filterDropdown.classList.remove('active'));
                }
            }
            
            if (applyBtn) {
                applyBtn.addEventListener('click', () => {
                    this.updateFiltersFromUI();
                    this.currentPage = 1;
                    this.loadClients();
                    filterDropdown.classList.remove('active');
                    document.body.style.overflow = '';
                });
            }
            
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    this.resetFilters();
                    this.updateFiltersUI();
                    this.currentPage = 1;
                    this.loadClients();
                    filterDropdown.classList.remove('active');
                    document.body.style.overflow = '';
                });
            }
        }
        
        updateFiltersFromUI() {
            const clientTypeCbs = document.querySelectorAll('input[name="clientType"]:checked');
            const statusCbs = document.querySelectorAll('input[name="status"]:checked');
            const priorityCbs = document.querySelectorAll('input[name="priority"]:checked');
            const dateFrom = document.getElementById('filter-date-from');
            const dateTo = document.getElementById('filter-date-to');
            
            this.filters.clientType = Array.from(clientTypeCbs).map(cb => cb.value);
            this.filters.status = Array.from(statusCbs).map(cb => cb.value);
            this.filters.priority = Array.from(priorityCbs).map(cb => cb.value);
            this.filters.dateFrom = dateFrom.value || null;
            this.filters.dateTo = dateTo.value || null;
        }
        
        resetFilters() {
            this.filters = {
                search: '',
                clientType: [], // تغيير: مصفوفة فارغة
                status: [],     // تغيير: مصفوفة فارغة
                priority: [],   // تغيير: مصفوفة فارغة
                dateFrom: null,
                dateTo: null
            };
            
            // تحديث واجهة المستخدم: إلغاء تحديد كل الخانات
            document.querySelectorAll('input[name="clientType"]').forEach(cb => cb.checked = false);
            document.querySelectorAll('input[name="status"]').forEach(cb => cb.checked = false);
            document.querySelectorAll('input[name="priority"]').forEach(cb => cb.checked = false);
            document.getElementById('filter-date-from').value = '';
            document.getElementById('filter-date-to').value = '';
            document.getElementById('table-search').value = '';
        }
        
        updateFiltersUI() {
            document.querySelectorAll('input[name="clientType"]').forEach(cb => {
                cb.checked = this.filters.clientType.includes(cb.value);
            });
            document.querySelectorAll('input[name="status"]').forEach(cb => {
                cb.checked = this.filters.status.includes(cb.value);
            });
            document.querySelectorAll('input[name="priority"]').forEach(cb => {
                cb.checked = this.filters.priority.includes(cb.value);
            });
            document.getElementById('filter-date-from').value = this.filters.dateFrom || '';
            document.getElementById('filter-date-to').value = this.filters.dateTo || '';
        }
        
        setupButtons() {
            const refreshBtn = document.getElementById('refresh-btn');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => {
                    this.loadClients();
                    this.updateStatistics();
                    this.showNotification('success', 'تم التحديث', 'تم تحديث قائمة العملاء');
                });
            }
            
            const addBtn = document.getElementById('add-client-btn');
            if (addBtn) {
                addBtn.addEventListener('click', () => this.showAddClientForm());
            }
        }
        
        setupPageSize() {
            const pageSizeSelect = document.getElementById('page-size');
            if (pageSizeSelect) {
                pageSizeSelect.addEventListener('change', (e) => {
                    this.pageSize = parseInt(e.target.value);
                    this.currentPage = 1;
                    this.loadClients();
                });
            }
        }
        
        setupModals() {
            const closeButtons = document.querySelectorAll('.modal-close, [data-dismiss="modal"]');
            closeButtons.forEach(btn => {
                btn.removeEventListener('click', this.handleModalClose);
                btn.addEventListener('click', this.handleModalClose);
            });
            
            window.removeEventListener('click', this.handleWindowClick);
            window.addEventListener('click', this.handleWindowClick);
            
            const submitForm = document.getElementById('form-submit-btn');
            if (submitForm) {
                submitForm.removeEventListener('click', this.saveClientBound);
                this.saveClientBound = () => this.saveClient();
                submitForm.addEventListener('click', this.saveClientBound);
            }
            
            const cancelForm = document.getElementById('form-cancel-btn');
            if (cancelForm) {
                cancelForm.removeEventListener('click', this.handleCancelForm);
                this.handleCancelForm = () => {
                    document.getElementById('client-form-modal').classList.remove('active');
                    this.resetClientForm();
                };
                cancelForm.addEventListener('click', this.handleCancelForm);
            }
            
            const formModalClose = document.getElementById('form-modal-close');
            if (formModalClose) {
                formModalClose.removeEventListener('click', this.handleFormClose);
                this.handleFormClose = () => {
                    document.getElementById('client-form-modal').classList.remove('active');
                    this.resetClientForm();
                };
                formModalClose.addEventListener('click', this.handleFormClose);
            }
            
            const confirmDelete = document.getElementById('delete-confirm-btn');
            if (confirmDelete) {
                confirmDelete.removeEventListener('click', this.deleteClientBound);
                this.deleteClientBound = () => this.deleteClient();
                confirmDelete.addEventListener('click', this.deleteClientBound);
            }
            
            const cancelDelete = document.getElementById('delete-cancel-btn');
            if (cancelDelete) {
                cancelDelete.removeEventListener('click', this.handleCancelDelete);
                this.handleCancelDelete = () => {
                    document.getElementById('delete-confirm-modal').classList.remove('active');
                    this.currentClientId = null;
                };
                cancelDelete.addEventListener('click', this.handleCancelDelete);
            }
            
            const deleteModalClose = document.getElementById('delete-modal-close');
            if (deleteModalClose) {
                deleteModalClose.removeEventListener('click', this.handleDeleteClose);
                this.handleDeleteClose = () => {
                    document.getElementById('delete-confirm-modal').classList.remove('active');
                    this.currentClientId = null;
                };
                deleteModalClose.addEventListener('click', this.handleDeleteClose);
            }
        }
        
        handleModalClose(e) {
            const modal = e.target.closest('.modal');
            if (modal) modal.classList.remove('active');
        }
        
        handleWindowClick(e) {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('active');
            }
        }
        
        setupClientFormLayout() {
            // النموذج موجود بالفعل في HTML
        }
        
        // ---------- الإحصائيات والمخطط ----------
        async updateStatistics() {
            try {
                const response = await this.apiClient.request('/api/admin/leeds/stats');
                if (response.success) {
                    const stats = response.data;
                    
                    document.getElementById('total-clients').textContent = stats.totalClients || 0;
                    document.getElementById('potential-clients').textContent = stats.potentialClients || 0;
                    document.getElementById('contracted-clients').textContent = stats.contractedClients || 0;
                    
                    document.getElementById('overview-total').textContent = stats.totalClients || 0;
                    document.getElementById('overview-potential').textContent = stats.potentialClients || 0;
                    document.getElementById('overview-contracted').textContent = stats.contractedClients || 0;
                    document.getElementById('overview-active').textContent = stats.activeContracts || 0;
                    
                    this.updateChart(stats.potentialClients || 0, stats.contractedClients || 0);
                    this.updateRecentClients();
                }
            } catch (error) {
                console.warn('⚠️ Could not load stats from API');
            }
        }
        
        setupChart() {
            const canvas = document.getElementById('clients-chart');
            if (!canvas) return;
            
            if (this.chartInstance) this.chartInstance.destroy();
            
            const ctx = canvas.getContext('2d');
            
            const darkColors = ['#121212', '#C0C0C0'];
            const borderColors = ['#000000', '#B0B0B0'];
            const hoverColors = ['#1A1A1A', '#D0D0D0'];
            
            this.chartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['عملاء محتملون', 'عملاء متعاقدون'],
                    datasets: [{
                        data: [0, 0],
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
                                    const total = context.dataset.data.reduce((a,b) => a+b, 0);
                                    const percentage = total > 0 ? Math.round((value/total)*100) : 0;
                                    return `${label}: ${value} (${percentage}%)`;
                                }
                            }
                        }
                    },
                    animation: { animateScale: true, animateRotate: true, duration: 1000 }
                }
            });
        }
        
        updateChart(potential, contracted) {
            if (!this.chartInstance) return;
            this.chartInstance.data.datasets[0].data = [potential, contracted];
            this.chartInstance.update();
        }
        
        async updateRecentClients() {
            const container = document.getElementById('recent-clients');
            if (!container) return;
            
            try {
                const response = await this.apiClient.request('/api/admin/leeds?limit=3&sort=newest');
                if (response.success) {
                    const recent = response.data || [];
                    let html = '';
                    
                    if (recent.length === 0) {
                        html = '<div class="empty-state"><i class="fas fa-users"></i><p>لا توجد عملاء حديثة</p></div>';
                    } else {
                        recent.forEach(client => {
                            const timeAgo = this.getTimeAgo(client.createdAt);
                            const statusClass = client.clientType === 'متعاقد' ? 'status-contracted' : 'status-potential';
                            
                            html += `
                                <div class="recent-item">
                                    <div class="recent-item-icon"><i class="fas fa-user-circle"></i></div>
                                    <div class="recent-item-content">
                                        <div class="recent-item-header">
                                            <h5 class="recent-item-title">${client.customerName}</h5>
                                        </div>
                                        <p class="recent-item-message">${client.clientType === 'متعاقد' ? 'عميل متعاقد' : 'عميل محتمل'} - ${client.projectName ? 'مهتم بـ' + client.projectName.substring(0,20) + '...' : 'بدون مشروع محدد'}</p>
                                        <span class="recent-item-status ${statusClass}">${client.clientType}</span>
                                    </div>
                                </div>
                            `;
                        });
                    }
                    container.innerHTML = html;
                }
            } catch (error) {
                console.warn('⚠️ Could not load recent clients');
            }
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
                
                if (diffMins < 60) return `قبل ${diffMins} دقيقة`;
                if (diffHours < 24) return `قبل ${diffHours} ساعة`;
                if (diffDays < 7) return `قبل ${diffDays} يوم`;
                return this.formatDate(dateString);
            } catch {
                return dateString;
            }
        }
        
        // ---------- تحسينات الجوال ----------
        setupMobileEnhancements() {
            this.setupMobileMenu();
            this.setupMobileSearch();
            this.setupMobileFilters();
            this.setupMobileButtonEffects();
            this.detectMobile();
        }
        
        setupMobileMenu() {
            const menuToggle = document.getElementById('menu-toggle');
            const sidebar = document.getElementById('dashboard-sidebar');
            const sidebarClose = document.getElementById('sidebar-close');
            const body = document.body;
            
            if (menuToggle && sidebar) {
                menuToggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    sidebar.classList.toggle('active');
                    menuToggle.classList.toggle('active');
                    
                    this.toggleSidebarBackdrop();
                    
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
                        body.style.overflow = '';
                        body.classList.remove('sidebar-open');
                        this.removeSidebarBackdrop();
                    });
                }
                
                document.addEventListener('click', (e) => {
                    const backdrop = document.querySelector('.sidebar-backdrop');
                    if (backdrop && backdrop.contains(e.target) && sidebar.classList.contains('active')) {
                        sidebar.classList.remove('active');
                        menuToggle.classList.remove('active');
                        body.style.overflow = '';
                        body.classList.remove('sidebar-open');
                        this.removeSidebarBackdrop();
                    }
                });
                
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
        }
        
        toggleSidebarBackdrop() {
            let backdrop = document.querySelector('.sidebar-backdrop');
            if (!backdrop) {
                backdrop = document.createElement('div');
                backdrop.className = 'sidebar-backdrop';
                document.body.appendChild(backdrop);
                setTimeout(() => backdrop.classList.add('active'), 10);
            } else {
                backdrop.classList.toggle('active');
            }
        }
        
        removeSidebarBackdrop() {
            const backdrop = document.querySelector('.sidebar-backdrop');
            if (backdrop) {
                backdrop.classList.remove('active');
                setTimeout(() => backdrop.remove(), 300);
            }
        }
        
        setupMobileSearch() {
            const searchIcon = document.querySelector('.search-btn-header');
            const headerSearch = document.querySelector('.admin-search');
            
            if (searchIcon && headerSearch && window.innerWidth <= 992) {
                searchIcon.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    headerSearch.classList.toggle('active');
                    if (headerSearch.classList.contains('active')) {
                        setTimeout(() => headerSearch.querySelector('.search-input-header')?.focus(), 100);
                    }
                });
                
                document.addEventListener('click', (e) => {
                    if (headerSearch.classList.contains('active') && 
                        !headerSearch.contains(e.target) && 
                        !searchIcon.contains(e.target)) {
                        headerSearch.classList.remove('active');
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
                if (applyBtn) {
                    applyBtn.addEventListener('click', () => {
                        filterDropdown.classList.remove('active');
                        filterDropdown.style.transform = 'translateY(100%)';
                        document.body.style.overflow = '';
                    });
                }
                
                const resetBtn = document.getElementById('reset-filter-table');
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
            if (isMobile) {
                document.body.classList.add('mobile-view');
                this.optimizeForMobile();
            }
            
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    const currentIsMobile = window.innerWidth <= 768;
                    if (currentIsMobile !== document.body.classList.contains('mobile-view')) {
                        if (currentIsMobile) {
                            document.body.classList.add('mobile-view');
                            this.optimizeForMobile();
                        } else {
                            document.body.classList.remove('mobile-view');
                        }
                    }
                }, 250);
            });
        }
        
        optimizeForMobile() {
            const tableContainer = document.querySelector('.table-container');
            if (tableContainer) tableContainer.style.webkitOverflowScrolling = 'touch';
            
            document.querySelectorAll('.action-btn').forEach(btn => {
                btn.style.minWidth = '44px';
                btn.style.minHeight = '44px';
            });
            
            document.querySelectorAll('.nav-link').forEach(link => {
                link.style.minHeight = '44px';
            });
        }
        
        async checkApiHealth() {
            try {
                const response = await this.apiClient.request('/api/health');
                if (response.success) console.log('✅ API is healthy');
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
            const tableBody = document.getElementById('clients-table-body');
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr class="loading-row">
                        <td colspan="11">
                            <div class="loading-content">
                                <div class="loading-spinner"></div>
                                <span>جاري تحميل العملاء...</span>
                            </div>
                        </td>
                    </tr>
                `;
            }
        }
    }
    
    function initialize() {
        try {
            window.clientsManager = new ClientsManager();
            console.log('✅ ClientsManager initialized with real API');
        } catch (error) {
            console.error('❌ Failed to initialize ClientsManager:', error);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();