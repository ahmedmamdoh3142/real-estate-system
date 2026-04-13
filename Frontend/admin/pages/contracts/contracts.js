// ===== صفحة إدارة العقود - نظام إدارة العقارات =====
// تم التحديث: إضافة دعم رفع ملف PDF للعقد وعرضه + عمود عرض PDF في الجدول

(function() {
    'use strict';
    
    console.log('✅ contracts.js loaded - REAL DATABASE CONNECTION (msnodesqlv8)');
    
    class ContractsManager {
        constructor() {
            this.baseURL = '/api';
            this.apiClient = this.createApiClient();
            this.currentUser = null;
            this.contracts = [];
            this.filteredContracts = [];
            this.currentPage = 1;
            this.pageSize = 25;
            this.totalPages = 1;
            this.totalItems = 0;
            
            // الفلاتر الافتراضية
            this.filters = {
                search: '',
                status: ['نشط', 'معلق', 'منتهي', 'ملغي'],
                type: ['تأجير', 'بيع', 'إيجار_تشغيلي'],
                payment: ['مسدد', 'متأخر', 'غير مدفوع']
            };
            
            this.sortOrder = 'newest';
            this.chartInstance = null;
            this.projects = [];
            this.currentContractId = null;
            this.isLoading = false;
            
            this.init();
        }
        
        createApiClient() {
            return {
                request: async (endpoint, options = {}) => {
                    const url = `${this.baseURL}${endpoint}`;
                    
                    // إذا كان هناك body من نوع FormData، لا نضبط Content-Type
                    const headers = {};
                    if (!(options.body instanceof FormData)) {
                        headers['Content-Type'] = 'application/json';
                        headers['Accept'] = 'application/json';
                    }
                    
                    const defaultOptions = {
                        method: options.method || 'GET',
                        headers: headers,
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
            console.log('🚀 ContractsManager initializing with real database...');
            
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setupPage());
            } else {
                this.setupPage();
            }
        }
        
        async setupPage() {
            console.log('🔧 Setting up contracts management page with real data...');
            
            await this.checkAuth();
            await this.checkApiHealth();
            await this.loadProjects();
            await this.loadCustomers();
            await this.loadContracts();
            
            this.setupUI();
            this.updateStatistics();
            this.setupChart();
            this.setupMobileEnhancements();
            this.updateSystemTime();
            setInterval(() => this.updateSystemTime(), 60000);
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
        
        // ---------- تحميل المشاريع ----------
        async loadProjects() {
            try {
                const response = await this.apiClient.request('/api/admin/contracts/projects');
                if (response.success) {
                    this.projects = response.data || [];
                    console.log(`✅ Loaded ${this.projects.length} projects`);
                    this.populateProjectSelects();
                }
            } catch (error) {
                console.warn('⚠️ Could not load projects from API, using mock data');
                this.projects = [
                    { id: 1, projectName: 'فيلات النخيل الراقية' },
                    { id: 2, projectName: 'أبراج الأعمال التجارية' },
                    { id: 3, projectName: 'شقق السفير المتميزة' },
                    { id: 4, projectName: 'مخازن اللوجستية الحديثة' }
                ];
                this.populateProjectSelects();
            }
        }
        
        populateProjectSelects() {
            const createSelect = document.getElementById('contract-project');
            const editSelect = document.getElementById('edit-contract-project');
            
            if (createSelect) {
                createSelect.innerHTML = '<option value="">-- اختر مشروع --</option>';
                this.projects.forEach(p => {
                    const option = document.createElement('option');
                    option.value = p.id;
                    option.textContent = p.projectName;
                    createSelect.appendChild(option);
                });
            }
            
            if (editSelect) {
                editSelect.innerHTML = '<option value="">-- اختر مشروع --</option>';
                this.projects.forEach(p => {
                    const option = document.createElement('option');
                    option.value = p.id;
                    option.textContent = p.projectName;
                    editSelect.appendChild(option);
                });
            }
        }
        
        // ---------- تحميل العملاء ----------
        async loadCustomers() {
            try {
                const response = await this.apiClient.request('/api/admin/contracts/search/customers?q=');
                if (response.success) {
                    this.customers = response.data || [];
                    console.log(`✅ Loaded ${this.customers.length} customers`);
                }
            } catch (error) {
                console.warn('⚠️ Could not load customers from API, using mock data');
                this.customers = [
                    { id: 1, name: 'محمد العتيبي', phone: '0501112222', source: 'lead' },
                    { id: 2, name: 'شركة التقنية المتطورة', phone: '0113334444', source: 'lead' },
                    { id: 3, name: 'عائشة القحطاني', phone: '0556667777', source: 'lead' }
                ];
            }
        }
        
        // ---------- تحميل العقود ----------
        async loadContracts() {
            try {
                console.log('📥 Loading contracts from database...');
                this.showLoading();
                this.isLoading = true;
                
                const params = new URLSearchParams({
                    page: this.currentPage,
                    limit: this.pageSize,
                    sort: this.sortOrder,
                    search: this.filters.search,
                    status: this.filters.status.join(','),
                    type: this.filters.type.join(','),
                    payment: this.filters.payment.join(',')
                });
                
                const response = await this.apiClient.request(`/api/admin/contracts?${params}`);
                
                if (response.success) {
                    this.contracts = response.data || [];
                    this.totalItems = response.pagination?.totalItems || this.contracts.length;
                    this.totalPages = response.pagination?.totalPages || 1;
                    this.filteredContracts = [...this.contracts];
                    console.log(`✅ Loaded ${this.contracts.length} contracts`);
                    this.renderTable();
                    this.updateStatistics();
                }
            } catch (error) {
                console.error('❌ Error loading contracts:', error);
                this.showNotification('error', 'خطأ', 'فشل تحميل العقود');
                this.loadMockData();
                this.renderTable();
                this.updateStatistics();
            } finally {
                this.isLoading = false;
            }
        }
        
        // ---------- بيانات احتياطية (مطابقة لقيود قاعدة البيانات) ----------
        loadMockData() {
            console.log('🔄 Using mock contracts data (DB compatible)');
            this.contracts = [
                {
                    id: 1,
                    contractNumber: 'CON-2024-001',
                    customerName: 'محمد العتيبي',
                    customerPhone: '0501112222',
                    projectName: 'فيلات النخيل الراقية',
                    contractType: 'تأجير',
                    paymentFrequency: 'شهري',
                    totalAmount: 420000,
                    paidAmount: 35000,
                    remainingAmount: 385000,
                    contractStatus: 'نشط',
                    paymentStatus: 'غير مدفوع',
                    startDate: '2024-06-01',
                    endDate: '2025-05-31',
                    monthlyPayment: 35000,
                    notes: 'الدفعة الأولى مدفوعة',
                    createdAt: '2024-05-20T10:30:00',
                    leadId: 1,
                    contractFileUrl: null
                },
                {
                    id: 2,
                    contractNumber: 'CON-2024-002',
                    customerName: 'شركة التقنية المتطورة',
                    customerPhone: '0113334444',
                    projectName: 'أبراج الأعمال التجارية',
                    contractType: 'تأجير',
                    paymentFrequency: 'شهري',
                    totalAmount: 144000,
                    paidAmount: 144000,
                    remainingAmount: 0,
                    contractStatus: 'منتهي',
                    paymentStatus: 'مسدد',
                    startDate: '2024-01-01',
                    endDate: '2024-12-31',
                    monthlyPayment: 12000,
                    notes: 'مسدد بالكامل',
                    createdAt: '2023-12-20T11:00:00',
                    leadId: 2,
                    contractFileUrl: null
                }
            ];
            this.totalItems = this.contracts.length;
            this.totalPages = Math.ceil(this.totalItems / this.pageSize);
            this.filteredContracts = [...this.contracts];
        }
        
        // ---------- عرض الجدول مع عمود ملف العقد ----------
        renderTable() {
            const tableBody = document.getElementById('contracts-table-body');
            if (!tableBody) return;
            
            const startIndex = (this.currentPage - 1) * this.pageSize;
            const endIndex = Math.min(startIndex + this.pageSize, this.filteredContracts.length);
            const pageData = this.filteredContracts.slice(startIndex, endIndex);
            
            let html = '';
            if (pageData.length === 0) {
                html = `
                    <tr class="empty-row">
                        <td colspan="15">
                            <div class="empty-state">
                                <i class="fas fa-file-contract"></i>
                                <h4>لا توجد عقود</h4>
                                <p>لا توجد عقود تطابق معايير البحث</p>
                                ${this.isLoading ? '' : '<button class="btn btn-primary mt-3" id="add-first-contract">إضافة أول عقد</button>'}
                            </div>
                        </td>
                    </tr>
                `;
            } else {
                pageData.forEach(contract => {
                    // عرض رابط PDF أو شرطة
                    let pdfCell = '';
                    if (contract.contractFileUrl) {
                        pdfCell = `<a href="${this.baseURL}${contract.contractFileUrl}" target="_blank" class="pdf-link" title="عرض ملف PDF"><i class="fas fa-file-pdf"></i> عرض</a>`;
                    } else {
                        pdfCell = '<span class="pdf-placeholder">—</span>';
                    }
                    
                    html += `
                        <tr data-contract-id="${contract.id}">
                            <td>
                                <label class="checkbox-cell">
                                    <input type="checkbox" class="contract-checkbox" data-id="${contract.id}">
                                    <span class="checkmark"></span>
                                </label>
                            </td>
                            <td><span class="contract-code">${contract.contractNumber || `CON-${contract.id}`}</span></td>
                            <td>
                                <div class="customer-info">
                                    <div class="customer-name">${contract.customerName || 'غير محدد'}</div>
                                    <div class="customer-phone">${contract.customerPhone || '--'}</div>
                                </div>
                            </td>
                            <td>${contract.projectName || '--'}</td>
                            <td>${contract.contractType || '--'}</td>
                            <td>${contract.paymentFrequency || '--'}</td>
                            <td class="amount-cell amount-total">${this.formatCurrency(contract.totalAmount || 0)}</td>
                            <td class="amount-cell amount-paid">${this.formatCurrency(contract.paidAmount || 0)}</td>
                            <td class="amount-cell ${contract.remainingAmount > 0 ? (contract.paymentStatus === 'متأخر' ? 'amount-overdue' : 'amount-remaining') : 'amount-paid'}">
                                ${this.formatCurrency(contract.remainingAmount || 0)}
                            </td>
                            <td><span class="status-badge ${this.getStatusClass(contract.contractStatus)}">${contract.contractStatus}</span></td>
                            <td><span class="status-badge ${this.getPaymentStatusClass(contract.paymentStatus)}">${contract.paymentStatus}</span></td>
                            <td>${this.formatDate(contract.startDate)}</td>
                            <td>${this.formatDate(contract.endDate)}</td>
                            <td>${pdfCell}</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="action-btn btn-view view-contract" data-id="${contract.id}" title="عرض التفاصيل">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="action-btn btn-payment add-payment" data-id="${contract.id}" title="إضافة دفعة">
                                        <i class="fas fa-money-bill-wave"></i>
                                    </button>
                                    <button class="action-btn btn-edit edit-contract" data-id="${contract.id}" title="تعديل">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="action-btn btn-delete delete-contract" data-id="${contract.id}" title="حذف">
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
            
            const addFirstBtn = document.getElementById('add-first-contract');
            if (addFirstBtn) addFirstBtn.addEventListener('click', () => this.showCreateContractModal());
        }
        
        // ---------- دوال مساعدة للتنسيق ----------
        getStatusClass(status) {
            const map = {
                'نشط': 'status-active',
                'معلق': 'status-suspended',
                'منتهي': 'status-completed',
                'ملغي': 'status-cancelled'
            };
            return map[status] || 'status-active';
        }
        
        getPaymentStatusClass(status) {
            const map = {
                'مسدد': 'status-paid',
                'غير مدفوع': 'status-pending',
                'متأخر': 'status-overdue'
            };
            return map[status] || 'status-pending';
        }
        
        formatCurrency(amount) {
            if (!amount && amount !== 0) return '--';
            return new Intl.NumberFormat('ar-SA').format(amount);
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
        
        // ---------- الترقيم الصفحات ----------
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
                        this.loadContracts();
                    }
                });
            });
            
            const prevBtn = document.querySelector('.prev-btn');
            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    if (this.currentPage > 1) {
                        this.currentPage--;
                        this.loadContracts();
                    }
                });
            }
            
            const nextBtn = document.querySelector('.next-btn');
            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    if (this.currentPage < this.totalPages) {
                        this.currentPage++;
                        this.loadContracts();
                    }
                });
            }
        }
        
        // ---------- أحداث الجدول ----------
        attachTableEvents() {
            document.querySelectorAll('.view-contract').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    this.showContractDetail(id);
                });
            });
            
            document.querySelectorAll('.edit-contract').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    this.showEditContractModal(id);
                });
            });
            
            document.querySelectorAll('.delete-contract').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    this.showDeleteConfirmModal(id);
                });
            });
            
            document.querySelectorAll('.add-payment').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    this.showAddPaymentModal(id);
                });
            });
            
            const selectAll = document.getElementById('select-all');
            if (selectAll) {
                selectAll.addEventListener('change', (e) => {
                    document.querySelectorAll('.contract-checkbox').forEach(cb => cb.checked = e.target.checked);
                });
            }
        }
        
        // ---------- عرض تفاصيل العقد مع زر PDF ----------
        async showContractDetail(contractId) {
            try {
                const response = await this.apiClient.request(`/api/admin/contracts/${contractId}`);
                if (!response.success) throw new Error(response.message);
                
                const contract = response.data;
                const modal = document.getElementById('contract-detail-modal');
                if (!modal) return;
                const modalBody = document.getElementById('modal-contract-body');
                
                let pdfButton = '';
                if (contract.contractFileUrl) {
                    pdfButton = `
                        <a href="${this.baseURL}${contract.contractFileUrl}" target="_blank" class="btn btn-outline btn-sm" style="margin-right: 1rem;">
                            <i class="fas fa-file-pdf"></i>
                            <span>عرض العقد PDF</span>
                        </a>
                    `;
                }
                
                let html = `
                    <div class="contract-detail-container">
                        <div class="contract-header">
                            <div class="contract-title">
                                <h3>${contract.contractNumber}</h3>
                                <span class="status-badge ${this.getStatusClass(contract.contractStatus)}">${contract.contractStatus}</span>
                            </div>
                            <div class="contract-dates">
                                <div class="date-item">
                                    <span class="date-label">تاريخ البدء</span>
                                    <span class="date-value">${this.formatDate(contract.startDate)}</span>
                                </div>
                                <div class="date-item">
                                    <span class="date-label">تاريخ الانتهاء</span>
                                    <span class="date-value">${this.formatDate(contract.endDate)}</span>
                                </div>
                            </div>
                        </div>
                        <div class="contract-cards">
                            <div class="contract-card">
                                <div class="card-header">
                                    <i class="fas fa-user"></i>
                                    <h4>بيانات العميل</h4>
                                </div>
                                <div class="card-body">
                                    <div class="info-item"><span class="info-label">الاسم:</span><span class="info-value">${contract.customerName}</span></div>
                                    <div class="info-item"><span class="info-label">الهاتف:</span><span class="info-value">${contract.customerPhone}</span></div>
                                    <div class="info-item"><span class="info-label">البريد:</span><span class="info-value">${contract.customerEmail || '--'}</span></div>
                                    <div class="info-item"><span class="info-label">العنوان:</span><span class="info-value">${contract.customerAddress || '--'}</span></div>
                                    <div class="info-item"><span class="info-label">الرقم القومي:</span><span class="info-value">${contract.customerNationalId || '--'}</span></div>
                                </div>
                            </div>
                            <div class="contract-card">
                                <div class="card-header">
                                    <i class="fas fa-building"></i>
                                    <h4>بيانات المشروع</h4>
                                </div>
                                <div class="card-body">
                                    <div class="info-item"><span class="info-label">المشروع:</span><span class="info-value">${contract.projectName}</span></div>
                                    <div class="info-item"><span class="info-label">نوع العقد:</span><span class="info-value">${contract.contractType}</span></div>
                                    <div class="info-item"><span class="info-label">طريقة الدفع:</span><span class="info-value">${contract.paymentFrequency}</span></div>
                                    <div class="info-item"><span class="info-label">الوحدة:</span><span class="info-value">${contract.unitDetails || '--'}</span></div>
                                </div>
                            </div>
                            <div class="contract-card financial-card">
                                <div class="card-header">
                                    <i class="fas fa-money-bill-wave"></i>
                                    <h4>التفاصيل المالية</h4>
                                </div>
                                <div class="card-body">
                                    <div class="info-item"><span class="info-label">الإجمالي:</span><span class="info-value">${this.formatCurrency(contract.totalAmount)}</span></div>
                                    <div class="info-item"><span class="info-label">المدفوع:</span><span class="info-value">${this.formatCurrency(contract.paidAmount)}</span></div>
                                    <div class="info-item"><span class="info-label">المتبقي:</span><span class="info-value">${this.formatCurrency(contract.remainingAmount)}</span></div>
                                    <div class="info-item"><span class="info-label">القسط:</span><span class="info-value">${this.formatCurrency(contract.monthlyPayment)}</span></div>
                                </div>
                            </div>
                        </div>
                        ${contract.notes ? `
                        <div class="contract-notes">
                            <div class="notes-header">
                                <i class="fas fa-sticky-note"></i>
                                <h4>ملاحظات</h4>
                            </div>
                            <div class="notes-body">
                                <p>${contract.notes}</p>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                `;
                
                modalBody.innerHTML = html;
                modal.classList.add('active');
                
                // إضافة زر PDF في التذييل
                const footer = modal.querySelector('.modal-footer');
                if (footer && pdfButton) {
                    footer.insertAdjacentHTML('afterbegin', pdfButton);
                }
                
                const editBtn = document.getElementById('modal-edit-btn');
                if (editBtn) {
                    editBtn.onclick = () => {
                        modal.classList.remove('active');
                        this.showEditContractModal(contractId);
                    };
                }
                
            } catch (error) {
                console.error('❌ Error showing contract detail:', error);
                this.showNotification('error', 'خطأ', 'فشل في تحميل تفاصيل العقد');
            }
        }
        
        // ---------- إضافة دفعة ----------
        showAddPaymentModal(contractId) {
            const modal = document.getElementById('add-payment-modal');
            if (!modal) return;
            const paymentContractId = document.getElementById('payment-contract-id');
            const paymentDate = document.getElementById('payment-date');
            if (paymentContractId) paymentContractId.value = contractId;
            if (paymentDate) paymentDate.value = new Date().toISOString().split('T')[0];
            modal.classList.add('active');
        }
        
        async submitPayment() {
            try {
                const contractId = document.getElementById('payment-contract-id')?.value;
                const amount = parseFloat(document.getElementById('payment-amount')?.value);
                const paymentDate = document.getElementById('payment-date')?.value;
                const paymentMethod = document.getElementById('payment-method')?.value;
                const referenceNumber = document.getElementById('payment-reference')?.value;
                const notes = document.getElementById('payment-notes')?.value;
                
                if (!contractId || !amount || amount <= 0 || !paymentDate || !paymentMethod) {
                    this.showNotification('error', 'خطأ', 'يرجى ملء جميع الحقول المطلوبة');
                    return;
                }
                
                const response = await this.apiClient.request(`/api/admin/contracts/${contractId}/payments`, {
                    method: 'POST',
                    body: JSON.stringify({
                        amount,
                        paymentDate,
                        paymentMethod,
                        referenceNumber,
                        notes,
                        collectedBy: this.currentUser?.id || 1
                    })
                });
                
                if (response.success) {
                    this.showNotification('success', 'تم بنجاح', 'تم تسجيل الدفعة بنجاح');
                    const modal = document.getElementById('add-payment-modal');
                    if (modal) modal.classList.remove('active');
                    const amountInput = document.getElementById('payment-amount');
                    const refInput = document.getElementById('payment-reference');
                    const notesInput = document.getElementById('payment-notes');
                    if (amountInput) amountInput.value = '';
                    if (refInput) refInput.value = '';
                    if (notesInput) notesInput.value = '';
                    await this.loadContracts();
                    this.updateStatistics();
                }
            } catch (error) {
                console.error('❌ Error submitting payment:', error);
                this.showNotification('error', 'خطأ', error.message || 'فشل في تسجيل الدفعة');
            }
        }
        
        // ---------- إنشاء عقد جديد مع رفع ملف PDF ----------
        showCreateContractModal() {
            const modal = document.getElementById('create-contract-modal');
            if (!modal) {
                console.error('❌ Create contract modal not found');
                return;
            }
            this.resetCreateForm();
            modal.classList.add('active');
        }
        
        resetCreateForm() {
            const form = document.getElementById('create-contract-form');
            if (form) form.reset();
            
            const customerId = document.getElementById('contract-customer-id');
            const customerSource = document.getElementById('contract-customer-source');
            const selectedInfo = document.getElementById('selected-customer-info');
            const searchResults = document.getElementById('customer-search-results');
            const startDate = document.getElementById('contract-start');
            const endDate = document.getElementById('contract-end');
            const fileInput = document.getElementById('contract-file');
            
            if (customerId) customerId.value = '';
            if (customerSource) customerSource.value = '';
            if (selectedInfo) selectedInfo.style.display = 'none';
            if (searchResults) searchResults.classList.remove('active');
            if (fileInput) fileInput.value = ''; // تفريغ حقل الملف
            
            const today = new Date().toISOString().split('T')[0];
            if (startDate) startDate.value = today;
            
            const nextYear = new Date();
            nextYear.setFullYear(nextYear.getFullYear() + 1);
            if (endDate) endDate.value = nextYear.toISOString().split('T')[0];
        }
        
        async submitNewContract() {
            try {
                const customerId = document.getElementById('contract-customer-id')?.value;
                const customerSource = document.getElementById('contract-customer-source')?.value;
                if (!customerId) {
                    this.showNotification('error', 'خطأ', 'يرجى اختيار عميل');
                    return;
                }
                
                const customerName = document.getElementById('selected-customer-name')?.textContent || '';
                const customerPhone = document.getElementById('selected-customer-phone')?.textContent || '';
                
                if (!customerName) {
                    this.showNotification('error', 'خطأ', 'لم يتم العثور على بيانات العميل');
                    return;
                }
                
                const projectId = document.getElementById('contract-project')?.value;
                const contractType = document.getElementById('contract-type')?.value;
                const paymentFrequency = document.getElementById('payment-frequency')?.value;
                const startDate = document.getElementById('contract-start')?.value;
                const endDate = document.getElementById('contract-end')?.value;
                const totalAmount = parseFloat(document.getElementById('contract-amount')?.value);
                const notes = document.getElementById('contract-notes')?.value;
                const fileInput = document.getElementById('contract-file');
                const file = fileInput?.files[0];
                
                if (!projectId || !startDate || !endDate || !totalAmount || totalAmount <= 0) {
                    this.showNotification('error', 'خطأ', 'يرجى ملء جميع الحقول المطلوبة');
                    return;
                }
                
                // استخدام FormData لإرسال الملف مع البيانات
                const formData = new FormData();
                formData.append('customerId', customerId);
                formData.append('customerSource', customerSource);
                formData.append('projectId', projectId);
                formData.append('customerName', customerName);
                formData.append('customerPhone', customerPhone);
                formData.append('contractType', contractType);
                formData.append('paymentFrequency', paymentFrequency);
                formData.append('startDate', startDate);
                formData.append('endDate', endDate);
                formData.append('totalAmount', totalAmount);
                formData.append('notes', notes || '');
                formData.append('createdBy', this.currentUser?.id || 1);
                if (file) {
                    formData.append('contractFile', file);
                }
                
                const response = await this.apiClient.request('/api/admin/contracts', {
                    method: 'POST',
                    body: formData
                });
                
                if (response.success) {
                    this.showNotification('success', 'تم بنجاح', 'تم إنشاء العقد بنجاح');
                    const modal = document.getElementById('create-contract-modal');
                    if (modal) modal.classList.remove('active');
                    this.resetCreateForm();
                    await this.loadContracts();
                    this.updateStatistics();
                }
            } catch (error) {
                console.error('❌ Error creating contract:', error);
                this.showNotification('error', 'خطأ', error.message || 'فشل في إنشاء العقد');
            }
        }
        
        // ---------- تعديل عقد مع رفع ملف PDF جديد اختيارياً ----------
        async showEditContractModal(contractId) {
            try {
                const response = await this.apiClient.request(`/api/admin/contracts/${contractId}`);
                if (!response.success) throw new Error(response.message);
                
                const contract = response.data;
                const modal = document.getElementById('edit-contract-modal');
                if (!modal) return;
                
                const editId = document.getElementById('edit-contract-id');
                const editCustomerId = document.getElementById('edit-contract-customer-id');
                const editCustomerSource = document.getElementById('edit-contract-customer-source');
                const editCustomerSearch = document.getElementById('edit-customer-search');
                const editProject = document.getElementById('edit-contract-project');
                const editType = document.getElementById('edit-contract-type');
                const editPaymentFreq = document.getElementById('edit-payment-frequency');
                const editStart = document.getElementById('edit-contract-start');
                const editEnd = document.getElementById('edit-contract-end');
                const editAmount = document.getElementById('edit-contract-amount');
                const editStatus = document.getElementById('edit-contract-status');
                const editPaymentStatus = document.getElementById('edit-payment-status');
                const editNotes = document.getElementById('edit-contract-notes');
                const selectedInfo = document.getElementById('edit-selected-customer-info');
                const selectedName = document.getElementById('edit-selected-customer-name');
                const selectedPhone = document.getElementById('edit-selected-customer-phone');
                const fileInput = document.getElementById('edit-contract-file');
                
                if (editId) editId.value = contract.id;
                if (editCustomerId) editCustomerId.value = contract.customerId;
                const source = contract.leadId ? 'lead' : 'contract';
                if (editCustomerSource) editCustomerSource.value = source;
                if (editCustomerSearch) editCustomerSearch.value = contract.customerName;
                if (editProject) editProject.value = contract.projectId;
                if (editType) editType.value = contract.contractType;
                if (editPaymentFreq) editPaymentFreq.value = contract.paymentFrequency || 'شهري';
                if (editStart) editStart.value = contract.startDate?.split('T')[0] || '';
                if (editEnd) editEnd.value = contract.endDate?.split('T')[0] || '';
                if (editAmount) editAmount.value = contract.totalAmount;
                if (editStatus) editStatus.value = contract.contractStatus;
                if (editPaymentStatus) editPaymentStatus.value = contract.paymentStatus;
                if (editNotes) editNotes.value = contract.notes || '';
                if (fileInput) fileInput.value = ''; // تفريغ حقل الملف (لأنه لا يمكن تعيين قيمة افتراضية)
                
                if (selectedName) selectedName.textContent = contract.customerName;
                if (selectedPhone) selectedPhone.textContent = contract.customerPhone;
                if (selectedInfo) selectedInfo.style.display = 'block';
                
                modal.classList.add('active');
            } catch (error) {
                console.error('❌ Error loading contract for edit:', error);
                this.showNotification('error', 'خطأ', 'فشل في تحميل بيانات العقد');
            }
        }
        
        async updateContract() {
            try {
                const contractId = document.getElementById('edit-contract-id')?.value;
                const customerId = document.getElementById('edit-contract-customer-id')?.value;
                const customerSource = document.getElementById('edit-contract-customer-source')?.value;
                const projectId = document.getElementById('edit-contract-project')?.value;
                const contractType = document.getElementById('edit-contract-type')?.value;
                const paymentFrequency = document.getElementById('edit-payment-frequency')?.value;
                const startDate = document.getElementById('edit-contract-start')?.value;
                const endDate = document.getElementById('edit-contract-end')?.value;
                const totalAmount = parseFloat(document.getElementById('edit-contract-amount')?.value);
                const contractStatus = document.getElementById('edit-contract-status')?.value;
                const paymentStatus = document.getElementById('edit-payment-status')?.value;
                const notes = document.getElementById('edit-contract-notes')?.value;
                const fileInput = document.getElementById('edit-contract-file');
                const file = fileInput?.files[0];
                
                if (!contractId || !customerId || !projectId || !startDate || !endDate || !totalAmount || totalAmount <= 0) {
                    this.showNotification('error', 'خطأ', 'يرجى ملء جميع الحقول المطلوبة');
                    return;
                }
                
                const formData = new FormData();
                formData.append('customerId', customerId);
                formData.append('customerSource', customerSource);
                formData.append('projectId', projectId);
                formData.append('contractType', contractType);
                formData.append('paymentFrequency', paymentFrequency);
                formData.append('startDate', startDate);
                formData.append('endDate', endDate);
                formData.append('totalAmount', totalAmount);
                formData.append('contractStatus', contractStatus);
                formData.append('paymentStatus', paymentStatus);
                formData.append('notes', notes || '');
                if (file) {
                    formData.append('contractFile', file);
                }
                
                const response = await this.apiClient.request(`/api/admin/contracts/${contractId}`, {
                    method: 'PUT',
                    body: formData
                });
                
                if (response.success) {
                    this.showNotification('success', 'تم بنجاح', 'تم تحديث العقد بنجاح');
                    const modal = document.getElementById('edit-contract-modal');
                    if (modal) modal.classList.remove('active');
                    await this.loadContracts();
                    this.updateStatistics();
                }
            } catch (error) {
                console.error('❌ Error updating contract:', error);
                this.showNotification('error', 'خطأ', error.message || 'فشل في تحديث العقد');
            }
        }
        
        // ---------- حذف عقد ----------
        showDeleteConfirmModal(contractId) {
            this.currentContractId = contractId;
            const modal = document.getElementById('delete-confirm-modal');
            if (modal) modal.classList.add('active');
        }
        
        async deleteContract() {
            if (!this.currentContractId) return;
            
            try {
                const response = await this.apiClient.request(`/api/admin/contracts/${this.currentContractId}`, {
                    method: 'DELETE'
                });
                
                if (response.success) {
                    this.showNotification('success', 'تم الحذف', 'تم حذف العقد بنجاح');
                    const modal = document.getElementById('delete-confirm-modal');
                    if (modal) modal.classList.remove('active');
                    this.currentContractId = null;
                    await this.loadContracts();
                    this.updateStatistics();
                }
            } catch (error) {
                console.error('❌ Error deleting contract:', error);
                this.showNotification('error', 'خطأ', 'فشل في حذف العقد');
            }
        }
        
        // ---------- البحث عن العملاء ----------
        async searchCustomers(searchTerm, mode = 'create') {
            if (!searchTerm) {
                this.hideSearchResults(mode);
                return;
            }
            
            try {
                const response = await this.apiClient.request(`/api/admin/contracts/search/customers?q=${encodeURIComponent(searchTerm)}`);
                let customers = response.success ? response.data : [];
                
                const unique = new Map();
                customers.forEach(c => {
                    const key = `${c.name}_${c.phone}`;
                    if (!unique.has(key)) {
                        unique.set(key, c);
                    }
                });
                customers = Array.from(unique.values());
                
                this.displayCustomerSearchResults(customers, mode);
            } catch (error) {
                const results = this.customers.filter(c => 
                    c.name.includes(searchTerm) || c.phone.includes(searchTerm)
                );
                this.displayCustomerSearchResults(results, mode);
            }
        }
        
        displayCustomerSearchResults(results, mode) {
            const container = mode === 'create' 
                ? document.getElementById('customer-search-results') 
                : document.getElementById('edit-customer-search-results');
            
            if (!container) return;
            
            let html = '';
            if (results.length > 0) {
                results.forEach(customer => {
                    html += `
                        <div class="search-result-item" 
                             data-customer-id="${customer.id}" 
                             data-customer-name="${customer.name}" 
                             data-customer-phone="${customer.phone}"
                             data-customer-source="${customer.source || 'lead'}">
                            <div><strong>${customer.name}</strong><br><small>${customer.phone}</small></div>
                        </div>
                    `;
                });
            } else {
                html = '<div class="search-result-item" style="color:#777; text-align:center;">لا توجد نتائج</div>';
            }
            
            container.innerHTML = html;
            container.classList.add('active');
            
            container.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    const id = item.dataset.customerId;
                    const name = item.dataset.customerName;
                    const phone = item.dataset.customerPhone;
                    const source = item.dataset.customerSource;
                    this.selectCustomer(id, name, phone, source, mode);
                    container.classList.remove('active');
                });
            });
        }
        
        hideSearchResults(mode) {
            const container = mode === 'create' 
                ? document.getElementById('customer-search-results') 
                : document.getElementById('edit-customer-search-results');
            if (container) container.classList.remove('active');
        }
        
        selectCustomer(id, name, phone, source, mode) {
            if (mode === 'create') {
                const custId = document.getElementById('contract-customer-id');
                const custSource = document.getElementById('contract-customer-source');
                const searchInput = document.getElementById('contract-customer-search');
                const selectedName = document.getElementById('selected-customer-name');
                const selectedPhone = document.getElementById('selected-customer-phone');
                const selectedInfo = document.getElementById('selected-customer-info');
                
                if (custId) custId.value = id;
                if (custSource) custSource.value = source;
                if (searchInput) searchInput.value = name;
                if (selectedName) selectedName.textContent = name;
                if (selectedPhone) selectedPhone.textContent = phone;
                if (selectedInfo) selectedInfo.style.display = 'block';
            } else {
                const custId = document.getElementById('edit-contract-customer-id');
                const custSource = document.getElementById('edit-contract-customer-source');
                const searchInput = document.getElementById('edit-customer-search');
                const selectedName = document.getElementById('edit-selected-customer-name');
                const selectedPhone = document.getElementById('edit-selected-customer-phone');
                const selectedInfo = document.getElementById('edit-selected-customer-info');
                
                if (custId) custId.value = id;
                if (custSource) custSource.value = source;
                if (searchInput) searchInput.value = name;
                if (selectedName) selectedName.textContent = name;
                if (selectedPhone) selectedPhone.textContent = phone;
                if (selectedInfo) selectedInfo.style.display = 'block';
            }
        }
        
        clearSelectedCustomer(mode) {
            if (mode === 'create') {
                const custId = document.getElementById('contract-customer-id');
                const custSource = document.getElementById('contract-customer-source');
                const searchInput = document.getElementById('contract-customer-search');
                const selectedInfo = document.getElementById('selected-customer-info');
                
                if (custId) custId.value = '';
                if (custSource) custSource.value = '';
                if (searchInput) searchInput.value = '';
                if (selectedInfo) selectedInfo.style.display = 'none';
            } else {
                const custId = document.getElementById('edit-contract-customer-id');
                const custSource = document.getElementById('edit-contract-customer-source');
                const searchInput = document.getElementById('edit-customer-search');
                const selectedInfo = document.getElementById('edit-selected-customer-info');
                
                if (custId) custId.value = '';
                if (custSource) custSource.value = '';
                if (searchInput) searchInput.value = '';
                if (selectedInfo) selectedInfo.style.display = 'none';
            }
        }
        
        // ========== إضافة عميل جديد (Lead) ==========
        showAddCustomerModal() {
            const modal = document.getElementById('add-customer-modal');
            if (!modal) return;
            const nameInput = document.getElementById('customer-name');
            const emailInput = document.getElementById('customer-email');
            const phoneInput = document.getElementById('customer-phone');
            const nationalIdInput = document.getElementById('customer-national-id');
            const addressInput = document.getElementById('customer-address');
            if (nameInput) nameInput.value = '';
            if (emailInput) emailInput.value = '';
            if (phoneInput) phoneInput.value = '';
            if (nationalIdInput) nationalIdInput.value = '';
            if (addressInput) addressInput.value = '';
            modal.classList.add('active');
        }
        
        async submitNewCustomer() {
            try {
                const name = document.getElementById('customer-name')?.value.trim();
                const email = document.getElementById('customer-email')?.value.trim();
                const phone = document.getElementById('customer-phone')?.value.trim();
                const nationalId = document.getElementById('customer-national-id')?.value.trim();
                const address = document.getElementById('customer-address')?.value.trim();
                
                if (!name || !email || !phone) {
                    this.showNotification('error', 'خطأ', 'الاسم والبريد والهاتف حقول مطلوبة');
                    return;
                }
                
                const projectId = this.projects.length > 0 ? this.projects[0].id : 1;
                
                const response = await this.apiClient.request('/api/admin/leeds', {
                    method: 'POST',
                    body: JSON.stringify({
                        customerName: name,
                        customerEmail: email,
                        customerPhone: phone,
                        customerNationalId: nationalId || null,
                        customerAddress: address || null,
                        projectId: projectId,
                        status: 'جديد',
                        priority: 'متوسط',
                        leadSource: 'موقع_إلكتروني',
                        assignedTo: this.currentUser?.id || 1
                    })
                });
                
                if (response.success) {
                    this.showNotification('success', 'تم بنجاح', 'تم إضافة العميل الجديد');
                    const modal = document.getElementById('add-customer-modal');
                    if (modal) modal.classList.remove('active');
                    
                    await this.refreshCustomersAndSelect(name, phone);
                }
            } catch (error) {
                console.error('❌ Error adding customer:', error);
                this.showNotification('error', 'خطأ', error.message || 'فشل في إضافة العميل');
            }
        }
        
        async refreshCustomersAndSelect(customerName, customerPhone) {
            await this.loadCustomers();
            
            const newCustomer = this.customers.find(c => 
                c.name === customerName && c.phone === customerPhone
            );
            
            if (newCustomer) {
                this.selectCustomer(newCustomer.id, newCustomer.name, newCustomer.phone, newCustomer.source || 'lead', 'create');
                this.showNotification('info', 'تم', 'يمكنك الآن اختيار العميل من القائمة');
            } else {
                const searchInput = document.getElementById('contract-customer-search');
                if (searchInput) {
                    searchInput.value = customerName;
                    this.searchCustomers(customerName, 'create');
                }
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
            this.setupCustomerSearch();
            this.setupAddCustomerButton();
            this.setupModals();
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
                this.loadContracts();
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
                    this.loadContracts();
                    filterDropdown.classList.remove('active');
                    document.body.style.overflow = '';
                });
            }
            
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    this.resetFilters();
                    this.updateFiltersUI();
                    this.currentPage = 1;
                    this.loadContracts();
                    filterDropdown.classList.remove('active');
                    document.body.style.overflow = '';
                });
            }
        }
        
        updateFiltersFromUI() {
            const statusCbs = document.querySelectorAll('input[name="status"]:checked');
            const typeCbs = document.querySelectorAll('input[name="type"]:checked');
            const paymentCbs = document.querySelectorAll('input[name="payment"]:checked');
            
            this.filters.status = Array.from(statusCbs).map(cb => cb.value);
            this.filters.type = Array.from(typeCbs).map(cb => cb.value);
            this.filters.payment = Array.from(paymentCbs).map(cb => cb.value);
        }
        
        resetFilters() {
            this.filters = {
                search: '',
                status: ['نشط', 'معلق', 'منتهي', 'ملغي'],
                type: ['تأجير', 'بيع', 'إيجار_تشغيلي'],
                payment: ['مسدد', 'متأخر', 'غير مدفوع']
            };
            
            document.querySelectorAll('input[name="status"]').forEach(cb => cb.checked = true);
            document.querySelectorAll('input[name="type"]').forEach(cb => cb.checked = true);
            document.querySelectorAll('input[name="payment"]').forEach(cb => cb.checked = true);
            
            const searchInput = document.getElementById('table-search');
            if (searchInput) searchInput.value = '';
        }
        
        updateFiltersUI() {
            document.querySelectorAll('input[name="status"]').forEach(cb => {
                cb.checked = this.filters.status.includes(cb.value);
            });
            document.querySelectorAll('input[name="type"]').forEach(cb => {
                cb.checked = this.filters.type.includes(cb.value);
            });
            document.querySelectorAll('input[name="payment"]').forEach(cb => {
                cb.checked = this.filters.payment.includes(cb.value);
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
                        this.loadContracts();
                        sortDropdown.classList.remove('show');
                    });
                });
            }
        }
        
        setupButtons() {
            const refreshBtn = document.getElementById('refresh-btn');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => {
                    this.loadContracts();
                    this.updateStatistics();
                    this.showNotification('success', 'تم التحديث', 'تم تحديث قائمة العقود');
                });
            }
            
            const addBtn = document.getElementById('create-contract-btn');
            if (addBtn) {
                addBtn.addEventListener('click', () => this.showCreateContractModal());
            }
            
            const exportBtn = document.getElementById('export-btn');
            if (exportBtn) {
                exportBtn.addEventListener('click', () => this.exportContracts());
            }
        }
        
        setupPageSize() {
            const pageSizeSelect = document.getElementById('page-size');
            if (pageSizeSelect) {
                pageSizeSelect.addEventListener('change', (e) => {
                    this.pageSize = parseInt(e.target.value);
                    this.currentPage = 1;
                    this.loadContracts();
                });
            }
        }
        
        setupCustomerSearch() {
            const searchInput = document.getElementById('contract-customer-search');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    this.searchCustomers(e.target.value, 'create');
                });
            }
            
            const editSearchInput = document.getElementById('edit-customer-search');
            if (editSearchInput) {
                editSearchInput.addEventListener('input', (e) => {
                    this.searchCustomers(e.target.value, 'edit');
                });
            }
            
            const removeBtn = document.getElementById('btn-remove-customer');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => this.clearSelectedCustomer('create'));
            }
            
            const editRemoveBtn = document.getElementById('edit-btn-remove-customer');
            if (editRemoveBtn) {
                editRemoveBtn.addEventListener('click', () => this.clearSelectedCustomer('edit'));
            }
            
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.customer-search-container')) {
                    this.hideSearchResults('create');
                    this.hideSearchResults('edit');
                }
            });
        }
        
        setupAddCustomerButton() {
            const addCustomerBtn = document.getElementById('add-customer-btn');
            if (addCustomerBtn) {
                addCustomerBtn.addEventListener('click', () => this.showAddCustomerModal());
            }
        }
        
        setupModals() {
            const closeButtons = document.querySelectorAll('.modal-close, [data-dismiss="modal"]');
            closeButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const modal = e.target.closest('.modal');
                    if (modal) modal.classList.remove('active');
                });
            });
            
            window.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal')) {
                    e.target.classList.remove('active');
                }
            });
            
            const addCustomerSubmit = document.getElementById('add-customer-submit-btn');
            if (addCustomerSubmit) {
                addCustomerSubmit.addEventListener('click', () => this.submitNewCustomer());
            }
            
            const addCustomerCancel = document.getElementById('add-customer-cancel-btn');
            if (addCustomerCancel) {
                addCustomerCancel.addEventListener('click', () => {
                    document.getElementById('add-customer-modal')?.classList.remove('active');
                });
            }
            
            const addCustomerClose = document.getElementById('add-customer-modal-close');
            if (addCustomerClose) {
                addCustomerClose.addEventListener('click', () => {
                    document.getElementById('add-customer-modal')?.classList.remove('active');
                });
            }
            
            const submitCreate = document.getElementById('create-submit-btn');
            if (submitCreate) submitCreate.addEventListener('click', () => this.submitNewContract());
            
            const submitEdit = document.getElementById('edit-submit-btn');
            if (submitEdit) submitEdit.addEventListener('click', () => this.updateContract());
            
            const submitPayment = document.getElementById('payment-submit-btn');
            if (submitPayment) submitPayment.addEventListener('click', () => this.submitPayment());
            
            const confirmDelete = document.getElementById('delete-confirm-btn');
            if (confirmDelete) confirmDelete.addEventListener('click', () => this.deleteContract());
            
            const cancelDelete = document.getElementById('delete-cancel-btn');
            if (cancelDelete) {
                cancelDelete.addEventListener('click', () => {
                    document.getElementById('delete-confirm-modal')?.classList.remove('active');
                    this.currentContractId = null;
                });
            }
            
            const createCancel = document.getElementById('create-cancel-btn');
            if (createCancel) {
                createCancel.addEventListener('click', () => {
                    document.getElementById('create-contract-modal')?.classList.remove('active');
                    this.resetCreateForm();
                });
            }
            
            const editCancel = document.getElementById('edit-cancel-btn');
            if (editCancel) {
                editCancel.addEventListener('click', () => {
                    document.getElementById('edit-contract-modal')?.classList.remove('active');
                });
            }
            
            const paymentCancel = document.getElementById('payment-cancel-btn');
            if (paymentCancel) {
                paymentCancel.addEventListener('click', () => {
                    document.getElementById('add-payment-modal')?.classList.remove('active');
                });
            }
            
            const createModalClose = document.getElementById('create-modal-close');
            if (createModalClose) {
                createModalClose.addEventListener('click', () => {
                    document.getElementById('create-contract-modal')?.classList.remove('active');
                    this.resetCreateForm();
                });
            }
            
            const editModalClose = document.getElementById('edit-modal-close');
            if (editModalClose) {
                editModalClose.addEventListener('click', () => {
                    document.getElementById('edit-contract-modal')?.classList.remove('active');
                });
            }
            
            const paymentModalClose = document.getElementById('payment-modal-close');
            if (paymentModalClose) {
                paymentModalClose.addEventListener('click', () => {
                    document.getElementById('add-payment-modal')?.classList.remove('active');
                });
            }
            
            const deleteModalClose = document.getElementById('delete-modal-close');
            if (deleteModalClose) {
                deleteModalClose.addEventListener('click', () => {
                    document.getElementById('delete-confirm-modal')?.classList.remove('active');
                    this.currentContractId = null;
                });
            }
        }
        
        // ---------- تصدير العقود ----------
        async exportContracts() {
            try {
                const response = await this.apiClient.request('/api/admin/contracts/export/export-data');
                if (response.success && response.data) {
                    const headers = ['رقم العقد', 'العميل', 'الهاتف', 'المشروع', 'النوع', 'الإجمالي', 'المدفوع', 'المتبقي', 'حالة العقد', 'حالة الدفع', 'تاريخ البدء', 'تاريخ الانتهاء', 'ملف العقد'];
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
                    a.download = `عقود_${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                    this.showNotification('success', 'تم التصدير', 'تم تصدير العقود بنجاح');
                }
            } catch (error) {
                console.error('❌ Error exporting contracts:', error);
                this.showNotification('error', 'خطأ', 'فشل في تصدير العقود');
            }
        }
        
        // ---------- الإحصائيات والمخططات ----------
        async updateStatistics() {
            try {
                const response = await this.apiClient.request('/api/admin/contracts/stats');
                if (response.success) {
                    const stats = response.data;
                    
                    const totalContractsEl = document.getElementById('total-contracts');
                    const activeContractsEl = document.getElementById('active-contracts');
                    const overdueContractsEl = document.getElementById('overdue-contracts');
                    const overviewTotal = document.getElementById('overview-total');
                    const overviewActive = document.getElementById('overview-active');
                    const overviewRevenue = document.getElementById('overview-revenue');
                    const overviewPending = document.getElementById('overview-pending');
                    
                    if (totalContractsEl) totalContractsEl.textContent = stats.totalContracts || 0;
                    if (activeContractsEl) activeContractsEl.textContent = stats.activeContracts || 0;
                    if (overdueContractsEl) overdueContractsEl.textContent = stats.overduePayments || 0;
                    if (overviewTotal) overviewTotal.textContent = stats.totalContracts || 0;
                    if (overviewActive) overviewActive.textContent = stats.activeContracts || 0;
                    if (overviewRevenue) overviewRevenue.textContent = this.formatCurrency(stats.totalRevenue || 0);
                    if (overviewPending) overviewPending.textContent = this.formatCurrency(stats.totalPending || 0);
                    
                    this.updateChartData(stats);
                    await this.updateUpcomingContracts();
                }
            } catch (error) {
                console.warn('⚠️ Could not load stats from API, using local data');
                this.updateStatisticsFallback();
            }
        }
        
        updateStatisticsFallback() {
            const total = this.contracts.length;
            const active = this.contracts.filter(c => c.contractStatus === 'نشط').length;
            const overdue = this.contracts.filter(c => c.paymentStatus === 'متأخر').length;
            const revenue = this.contracts.reduce((sum, c) => sum + (c.paidAmount || 0), 0);
            const pending = this.contracts.reduce((sum, c) => sum + (c.remainingAmount || 0), 0);
            
            const totalContractsEl = document.getElementById('total-contracts');
            const activeContractsEl = document.getElementById('active-contracts');
            const overdueContractsEl = document.getElementById('overdue-contracts');
            const overviewTotal = document.getElementById('overview-total');
            const overviewActive = document.getElementById('overview-active');
            const overviewRevenue = document.getElementById('overview-revenue');
            const overviewPending = document.getElementById('overview-pending');
            
            if (totalContractsEl) totalContractsEl.textContent = total;
            if (activeContractsEl) activeContractsEl.textContent = active;
            if (overdueContractsEl) overdueContractsEl.textContent = overdue;
            if (overviewTotal) overviewTotal.textContent = total;
            if (overviewActive) overviewActive.textContent = active;
            if (overviewRevenue) overviewRevenue.textContent = this.formatCurrency(revenue);
            if (overviewPending) overviewPending.textContent = this.formatCurrency(pending);
        }
        
        setupChart() {
            const canvas = document.getElementById('revenue-chart');
            if (!canvas) return;
            
            if (this.chartInstance) this.chartInstance.destroy();
            
            const ctx = canvas.getContext('2d');
            
            const darkColors = [
                '#121212',
                '#1E1E1E',
                '#2C2C2C',
                '#3A3A3A',
                '#4A4A4A',
                '#5A5A5A',
                '#6A6A6A',
                '#C0C0C0'
            ];
            
            const borderColors = [
                '#000000',
                '#1A1A1A',
                '#282828',
                '#363636',
                '#464646',
                '#565656',
                '#666666',
                '#B0B0B0'
            ];
            
            const hoverColors = [
                '#1A1A1A',
                '#282828',
                '#363636',
                '#464646',
                '#565656',
                '#666666',
                '#767676',
                '#D0D0D0'
            ];
            
            this.chartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['نشط', 'منتهي', 'ملغي'],
                    datasets: [{
                        data: [0, 0, 0],
                        backgroundColor: [darkColors[0], darkColors[2], darkColors[4]],
                        borderColor: [borderColors[0], borderColors[2], borderColors[4]],
                        borderWidth: 2,
                        hoverBackgroundColor: [hoverColors[0], hoverColors[2], hoverColors[4]],
                        hoverBorderColor: 'rgba(255, 255, 255, 0.3)',
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
                                    return `${label}: ${value} عقد (${percentage}%)`;
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
        }
        
        updateChartData(stats = null) {
            if (!this.chartInstance) return;
            
            let active = 0, completed = 0, cancelled = 0;
            if (stats && stats.typeDistribution) {
                active = stats.typeDistribution['نشط'] || 0;
                completed = stats.typeDistribution['منتهي'] || 0;
                cancelled = stats.typeDistribution['ملغي'] || 0;
            } else {
                active = this.contracts.filter(c => c.contractStatus === 'نشط').length;
                completed = this.contracts.filter(c => c.contractStatus === 'منتهي').length;
                cancelled = this.contracts.filter(c => c.contractStatus === 'ملغي').length;
            }
            
            this.chartInstance.data.datasets[0].data = [active, completed, cancelled];
            this.chartInstance.update();
        }
        
        async updateUpcomingContracts() {
            const container = document.getElementById('upcoming-contracts');
            if (!container) return;
            
            try {
                const response = await this.apiClient.request('/api/admin/contracts/upcoming?limit=4');
                let contracts = [];
                if (response.success && Array.isArray(response.data)) {
                    contracts = response.data;
                } else if (Array.isArray(response)) {
                    contracts = response;
                }
                
                let html = '';
                if (contracts.length === 0) {
                    html = '<div class="empty-state"><i class="fas fa-check-circle"></i><p>لا توجد عقود تنتهي قريباً</p></div>';
                } else {
                    contracts.forEach(c => {
                        const daysRemaining = c.daysRemaining || 0;
                        const daysText = daysRemaining <= 0 ? 'منتهي' : `باقي ${daysRemaining} يوم`;
                        html += `
                            <div class="upcoming-item">
                                <div class="upcoming-item-icon"><i class="fas fa-file-contract"></i></div>
                                <div class="upcoming-item-content">
                                    <div class="upcoming-item-header">
                                        <h5 class="upcoming-item-title">${c.contractNumber || 'عقد'}</h5>
                                        <span class="upcoming-item-days">${daysText}</span>
                                    </div>
                                    <p class="upcoming-item-customer">${c.customerName || ''} - ${c.projectName || ''}</p>
                                    <div class="upcoming-item-progress">
                                        <div class="progress-bar">
                                            <div class="progress-fill" style="width: ${c.paymentPercentage || 0}%"></div>
                                        </div>
                                        <span class="progress-text">${c.paymentPercentage || 0}% مسدد</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                }
                container.innerHTML = html;
            } catch (error) {
                console.warn('⚠️ Could not load upcoming contracts');
                container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>تعذر تحميل العقود القادمة</p></div>';
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
                        const searchInput = headerSearch.querySelector('.search-input-header');
                        if (searchInput) {
                            setTimeout(() => searchInput.focus(), 100);
                        }
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
            if (tableContainer) {
                tableContainer.style.webkitOverflowScrolling = 'touch';
            }
            
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
        
        // ---------- الإشعارات والتحميل ----------
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
            const tableBody = document.getElementById('contracts-table-body');
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr class="loading-row">
                        <td colspan="15">
                            <div class="loading-content">
                                <div class="loading-spinner"></div>
                                <span>جاري تحميل العقود من قاعدة البيانات...</span>
                            </div>
                        </td>
                    </tr>
                `;
            }
        }
    }
    
    function initialize() {
        try {
            window.contractsManager = new ContractsManager();
            console.log('✅ ContractsManager initialized with real database connection');
        } catch (error) {
            console.error('❌ Failed to initialize ContractsManager:', error);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();