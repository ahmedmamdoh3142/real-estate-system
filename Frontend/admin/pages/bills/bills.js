// ===== صفحة إدارة الفواتير - نظام إدارة العقارات =====
// نسخة متكاملة مع API حقيقية (لا بيانات وهمية)

(function() {
    'use strict';
    
    console.log('✅ bills.js loaded - REAL DATABASE CONNECTION (msnodesqlv8)');
    
    class InvoicesManager {
        constructor() {
            this.baseURL = '';
            this.apiClient = this.createApiClient();
            this.currentUser = null;
            this.invoices = [];
            this.filteredInvoices = [];
            this.currentPage = 1;
            this.pageSize = 25;
            this.totalPages = 1;
            this.totalItems = 0;
            this.selectedInvoices = new Set();
            
            // الفلاتر الافتراضية
            this.filters = {
                search: '',
                paymentStatus: ['مدفوعة', 'غير مدفوعة', 'متأخرة'],
                invoiceType: ['كهرباء', 'مياه', 'غاز', 'صيانة', 'خدمات'],
                property: [] // سيتم ملؤها بكل IDs المشاريع عند التحميل
            };
            
            this.sortOrder = 'newest';
            this.chartInstance = null;
            this.properties = [];
            this.currentInvoiceId = null;
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
            console.log('🚀 InvoicesManager initializing with real database...');
            
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setupPage());
            } else {
                this.setupPage();
            }
        }
        
        async setupPage() {
            console.log('🔧 Setting up invoices management page with real data...');
            
            await this.checkAuth();
            await this.checkApiHealth();
            await this.loadProjects(); // تحميل المشاريع أولاً
            await this.loadInvoices(); // تحميل الفواتير
            
            this.setupUI();
            this.updateStatistics();
            this.setupChart();
            this.setupMobileEnhancements();
            this.updateSystemTime();
            setInterval(() => this.updateSystemTime(), 60000);
            
            // تحديث حالات التأخير مرة عند بدء التشغيل
            this.refreshOverdueStatuses();
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
                const response = await this.apiClient.request('/api/admin/bills/projects');
                if (response.success) {
                    this.properties = response.data || [];
                    console.log(`✅ Loaded ${this.properties.length} projects`);
                    // تعيين كل IDs المشاريع كقيمة افتراضية للفلتر
                    this.filters.property = this.properties.map(p => p.id);
                    this.populatePropertyFilters();
                    this.populatePropertySearch();
                }
            } catch (error) {
                console.error('❌ Could not load projects from API:', error);
                this.showNotification('error', 'خطأ', 'فشل تحميل قائمة المشاريع');
                this.properties = [];
            }
        }
        
        populatePropertyFilters() {
            const propertyFilterContainer = document.getElementById('property-filter-options');
            if (!propertyFilterContainer) return;
            
            let html = '';
            if (this.properties.length === 0) {
                html = '<div class="filter-option disabled">لا توجد مشاريع</div>';
            } else {
                this.properties.forEach(prop => {
                    html += `
                        <label class="filter-option">
                            <input type="checkbox" name="property" value="${prop.id}" checked>
                            <span class="checkmark"></span>
                            <span class="filter-label">${prop.projectName}</span>
                        </label>
                    `;
                });
            }
            propertyFilterContainer.innerHTML = html;
        }
        
        populatePropertySearch() {
            const dropdown = document.getElementById('property-search-dropdown');
            if (!dropdown) return;
            
            // سيتم ملؤها ديناميكياً عند البحث
        }
        
        // ---------- تحميل الفواتير ----------
        async loadInvoices() {
            try {
                console.log('📥 Loading invoices from database...');
                this.showLoading();
                this.isLoading = true;
                
                const params = new URLSearchParams({
                    page: this.currentPage,
                    limit: this.pageSize,
                    sort: this.sortOrder,
                    search: this.filters.search,
                    paymentStatus: this.filters.paymentStatus.join(','),
                    invoiceType: this.filters.invoiceType.join(','),
                    property: this.filters.property.join(',')
                });
                
                const response = await this.apiClient.request(`/api/admin/bills?${params}`);
                
                if (response.success) {
                    this.invoices = response.data || [];
                    this.totalItems = response.pagination?.totalItems || this.invoices.length;
                    this.totalPages = response.pagination?.totalPages || 1;
                    this.filteredInvoices = [...this.invoices];
                    console.log(`✅ Loaded ${this.invoices.length} invoices`);
                    this.renderTable();
                    this.updateStatistics();
                }
            } catch (error) {
                console.error('❌ Error loading invoices:', error);
                this.showNotification('error', 'خطأ', 'فشل تحميل الفواتير');
                this.renderEmptyTable();
            } finally {
                this.isLoading = false;
            }
        }
        
        showLoading() {
            const tableBody = document.getElementById('invoices-table-body');
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr class="loading-row">
                        <td colspan="11">
                            <div class="loading-content">
                                <div class="loading-spinner"></div>
                                <span>جاري تحميل الفواتير من قاعدة البيانات...</span>
                            </div>
                        </td>
                    </tr>
                `;
            }
        }
        
        renderEmptyTable() {
            const tableBody = document.getElementById('invoices-table-body');
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr class="empty-row">
                        <td colspan="11">
                            <div class="empty-state">
                                <i class="fas fa-file-invoice"></i>
                                <h4>لا توجد فواتير</h4>
                                <p>لم يتم العثور على فواتير</p>
                                <button class="btn btn-primary mt-3" id="add-first-invoice">إضافة أول فاتورة</button>
                            </div>
                        </td>
                    </tr>
                `;
                const addFirstBtn = document.getElementById('add-first-invoice');
                if (addFirstBtn) addFirstBtn.addEventListener('click', () => this.showCreateInvoiceModal());
            }
        }
        
        // ---------- عرض الجدول ----------
        renderTable() {
            const tableBody = document.getElementById('invoices-table-body');
            if (!tableBody) return;
            
            const startIndex = (this.currentPage - 1) * this.pageSize;
            const endIndex = Math.min(startIndex + this.pageSize, this.filteredInvoices.length);
            const pageData = this.filteredInvoices.slice(startIndex, endIndex);
            
            let html = '';
            if (pageData.length === 0) {
                html = `
                    <tr class="empty-row">
                        <td colspan="11">
                            <div class="empty-state">
                                <i class="fas fa-file-invoice"></i>
                                <h4>لا توجد فواتير</h4>
                                <p>لا توجد فواتير تطابق معايير البحث</p>
                                ${this.isLoading ? '' : '<button class="btn btn-primary mt-3" id="add-first-invoice">إضافة أول فاتورة</button>'}
                            </div>
                        </td>
                    </tr>
                `;
            } else {
                pageData.forEach(invoice => {
                    const statusClass = this.getStatusClass(invoice.status);
                    const isSelected = this.selectedInvoices.has(invoice.id);
                    html += `
                        <tr data-invoice-id="${invoice.id}" class="${isSelected ? 'selected' : ''}">
                            <td>
                                <label class="checkbox-cell">
                                    <input type="checkbox" class="invoice-checkbox" data-id="${invoice.id}" ${isSelected ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                </label>
                            </td>
                            <td><span class="invoice-code">${invoice.invoiceNumber}</span></td>
                            <td>${invoice.propertyName || '--'}</td>
                            <td>
                                <div class="invoice-type-badge">
                                    <span class="invoice-type-icon"><i class="fas ${this.getTypeIcon(invoice.invoiceType)}"></i></span>
                                    <span>${invoice.invoiceType}</span>
                                </div>
                            </td>
                            <td>${this.formatDate(invoice.issueDate)}</td>
                            <td>${this.formatDate(invoice.dueDate)}</td>
                            <td class="amount-cell amount-total">${this.formatCurrency(invoice.amount)}</td>
                            <td class="amount-cell amount-paid">${this.formatCurrency(invoice.paidAmount)}</td>
                            <td class="amount-cell ${invoice.remainingAmount > 0 ? (invoice.status === 'متأخرة' ? 'amount-overdue' : 'amount-remaining') : 'amount-paid'}">
                                ${this.formatCurrency(invoice.remainingAmount)}
                            </td>
                            <td><span class="status-badge ${statusClass}">${invoice.status}</span></td>
                            <td>
                                <div class="action-buttons">
                                    <button class="action-btn btn-view view-invoice" data-id="${invoice.id}" title="عرض التفاصيل">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="action-btn btn-payment pay-invoice" data-id="${invoice.id}" title="تسديد" ${invoice.status === 'مدفوعة' ? 'disabled' : ''}>
                                        <i class="fas fa-credit-card"></i>
                                    </button>
                                    <button class="action-btn btn-edit edit-invoice" data-id="${invoice.id}" title="تعديل">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="action-btn btn-delete delete-invoice" data-id="${invoice.id}" title="حذف">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                    <button class="action-btn btn-print print-invoice" data-id="${invoice.id}" title="طباعة">
                                        <i class="fas fa-print"></i>
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
            
            const addFirstBtn = document.getElementById('add-first-invoice');
            if (addFirstBtn) addFirstBtn.addEventListener('click', () => this.showCreateInvoiceModal());
        }
        
        // ---------- الترقيم ----------
        updatePagination() {
            const paginationContainer = document.getElementById('table-pagination');
            if (!paginationContainer) return;
            
            const totalItemsElement = document.getElementById('total-items');
            if (totalItemsElement) totalItemsElement.textContent = this.totalItems;
            
            this.totalPages = Math.ceil(this.filteredInvoices.length / this.pageSize);
            
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
                        this.loadInvoices();
                    }
                });
            });
            
            const prevBtn = document.querySelector('.prev-btn');
            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    if (this.currentPage > 1) {
                        this.currentPage--;
                        this.loadInvoices();
                    }
                });
            }
            
            const nextBtn = document.querySelector('.next-btn');
            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    if (this.currentPage < this.totalPages) {
                        this.currentPage++;
                        this.loadInvoices();
                    }
                });
            }
        }
        
        // ---------- أحداث الجدول ----------
        attachTableEvents() {
            document.querySelectorAll('.view-invoice').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = parseInt(e.currentTarget.dataset.id);
                    this.showInvoiceDetail(id);
                });
            });
            
            document.querySelectorAll('.edit-invoice').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = parseInt(e.currentTarget.dataset.id);
                    this.showEditInvoiceModal(id);
                });
            });
            
            document.querySelectorAll('.delete-invoice').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = parseInt(e.currentTarget.dataset.id);
                    this.showDeleteConfirmModal(id);
                });
            });
            
            document.querySelectorAll('.pay-invoice').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = parseInt(e.currentTarget.dataset.id);
                    this.showPaymentModal(id);
                });
            });
            
            document.querySelectorAll('.print-invoice').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = parseInt(e.currentTarget.dataset.id);
                    this.printInvoice(id);
                });
            });
            
            document.querySelectorAll('.invoice-checkbox').forEach(cb => {
                cb.addEventListener('change', (e) => {
                    const id = parseInt(e.target.dataset.id);
                    if (e.target.checked) {
                        this.selectedInvoices.add(id);
                    } else {
                        this.selectedInvoices.delete(id);
                    }
                    this.updateBulkPaymentButton();
                    const row = e.target.closest('tr');
                    if (row) row.classList.toggle('selected', e.target.checked);
                });
            });
            
            const selectAll = document.getElementById('select-all');
            if (selectAll) {
                selectAll.addEventListener('change', (e) => {
                    const checked = e.target.checked;
                    document.querySelectorAll('.invoice-checkbox').forEach(cb => {
                        cb.checked = checked;
                        const id = parseInt(cb.dataset.id);
                        if (checked) {
                            this.selectedInvoices.add(id);
                        } else {
                            this.selectedInvoices.delete(id);
                        }
                        const row = cb.closest('tr');
                        if (row) row.classList.toggle('selected', checked);
                    });
                    this.updateBulkPaymentButton();
                });
            }
        }
        
        updateBulkPaymentButton() {
            const bulkBtn = document.getElementById('bulk-payment-btn');
            if (bulkBtn) {
                const count = this.selectedInvoices.size;
                bulkBtn.disabled = count === 0;
                if (count > 0) {
                    bulkBtn.innerHTML = `<i class="fas fa-credit-card"></i><span>دفع المحدد (${count})</span>`;
                } else {
                    bulkBtn.innerHTML = `<i class="fas fa-credit-card"></i><span>دفع المحدد</span>`;
                }
            }
        }
        
        // ---------- عرض تفاصيل الفاتورة ----------
        async showInvoiceDetail(invoiceId) {
            try {
                const response = await this.apiClient.request(`/api/admin/bills/${invoiceId}`);
                if (!response.success) throw new Error(response.message);
                
                const invoice = response.data;
                const modal = document.getElementById('invoice-detail-modal');
                if (!modal) return;
                
                const modalBody = document.getElementById('invoice-detail-body');
                
                const payments = invoice.payments || [];
                const paymentsHtml = payments.length > 0 ? `
                    <div class="invoice-payments">
                        <h5>سجل المدفوعات</h5>
                        ${payments.map(p => `
                            <div class="payment-history-item">
                                <span class="date">${this.formatDate(p.date)}</span>
                                <span class="amount">${this.formatCurrency(p.amount)}</span>
                                <span class="method">${p.method}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : '';
                
                let html = `
                    <div class="invoice-detail-container">
                        <div class="invoice-header">
                            <div class="invoice-title">
                                <h3>${invoice.invoiceNumber}</h3>
                                <span class="status-badge ${this.getStatusClass(invoice.status)}">${invoice.status}</span>
                            </div>
                            <div class="invoice-dates">
                                <div class="date-item">
                                    <span class="date-label">تاريخ الإصدار</span>
                                    <span class="date-value">${this.formatDate(invoice.issueDate)}</span>
                                </div>
                                <div class="date-item">
                                    <span class="date-label">تاريخ الاستحقاق</span>
                                    <span class="date-value">${this.formatDate(invoice.dueDate)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="invoice-cards">
                            <div class="invoice-card">
                                <div class="card-header">
                                    <i class="fas fa-building"></i>
                                    <h4>بيانات العقار</h4>
                                </div>
                                <div class="card-body">
                                    <div class="info-item">
                                        <span class="info-label">العقار:</span>
                                        <span class="info-value">${invoice.propertyName}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">نوع الفاتورة:</span>
                                        <span class="info-value">${invoice.invoiceType}</span>
                                    </div>
                                    ${invoice.meterReading ? `
                                    <div class="info-item">
                                        <span class="info-label">قراءة العداد:</span>
                                        <span class="info-value">${invoice.meterReading}</span>
                                    </div>
                                    ` : ''}
                                </div>
                            </div>
                            
                            <div class="invoice-card">
                                <div class="card-header">
                                    <i class="fas fa-money-bill-wave"></i>
                                    <h4>التفاصيل المالية</h4>
                                </div>
                                <div class="card-body">
                                    <div class="info-item">
                                        <span class="info-label">المبلغ الإجمالي:</span>
                                        <span class="info-value amount-total">${this.formatCurrency(invoice.amount)}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">المبلغ المدفوع:</span>
                                        <span class="info-value amount-paid">${this.formatCurrency(invoice.paidAmount)}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">المتبقي:</span>
                                        <span class="info-value ${invoice.remainingAmount > 0 ? 'amount-overdue' : 'amount-paid'}">${this.formatCurrency(invoice.remainingAmount)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        ${paymentsHtml}
                        
                        ${invoice.notes ? `
                        <div class="invoice-notes">
                            <div class="notes-header">
                                <i class="fas fa-sticky-note"></i>
                                <h4>ملاحظات</h4>
                            </div>
                            <div class="notes-body">
                                <p>${invoice.notes}</p>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                `;
                
                modalBody.innerHTML = html;
                modal.classList.add('active');
                
                const editBtn = document.getElementById('detail-modal-edit-btn');
                if (editBtn) {
                    editBtn.onclick = () => {
                        modal.classList.remove('active');
                        this.showEditInvoiceModal(invoiceId);
                    };
                }
                
            } catch (error) {
                console.error('❌ Error showing invoice detail:', error);
                this.showNotification('error', 'خطأ', 'فشل في تحميل تفاصيل الفاتورة');
            }
        }
        
        // ---------- إنشاء/تعديل فاتورة ----------
        showCreateInvoiceModal() {
            this.resetInvoiceForm();
            document.getElementById('invoice-modal-title').textContent = 'إضافة فاتورة جديدة';
            document.getElementById('invoice-modal').classList.add('active');
        }
        
        async showEditInvoiceModal(invoiceId) {
            try {
                const response = await this.apiClient.request(`/api/admin/bills/${invoiceId}`);
                if (!response.success) throw new Error(response.message);
                
                const invoice = response.data;
                this.currentInvoiceId = invoiceId;
                
                document.getElementById('invoice-modal-title').textContent = 'تعديل الفاتورة';
                document.getElementById('invoice-id').value = invoice.id;
                
                // تعيين قيمة العقار في البحث
                const propertySearch = document.getElementById('invoice-property-search');
                const propertyHidden = document.getElementById('invoice-property');
                if (propertySearch && propertyHidden) {
                    propertySearch.value = invoice.propertyName;
                    propertyHidden.value = invoice.propertyId;
                }
                
                document.getElementById('invoice-type').value = invoice.invoiceType;
                document.getElementById('invoice-number').value = invoice.invoiceNumber;
                document.getElementById('invoice-issue-date').value = invoice.issueDate.split('T')[0];
                document.getElementById('invoice-due-date').value = invoice.dueDate.split('T')[0];
                document.getElementById('invoice-amount').value = invoice.amount;
                document.getElementById('invoice-paid-amount').value = invoice.paidAmount;
                document.getElementById('invoice-status').value = invoice.status;
                document.getElementById('invoice-notes').value = invoice.notes || '';
                
                const meterRow = document.getElementById('meter-reading-row');
                if (meterRow) {
                    const showMeter = ['كهرباء', 'مياه', 'غاز'].includes(invoice.invoiceType);
                    meterRow.style.display = showMeter ? 'block' : 'none';
                    if (showMeter && invoice.meterReading) {
                        const parts = invoice.meterReading.split(' ');
                        document.getElementById('meter-reading').value = parts[0] || '';
                        document.getElementById('meter-unit').value = parts[1] || 'kWh';
                    }
                }
                
                document.getElementById('invoice-modal').classList.add('active');
            } catch (error) {
                console.error('❌ Error loading invoice for edit:', error);
                this.showNotification('error', 'خطأ', 'فشل في تحميل بيانات الفاتورة');
            }
        }
        
        resetInvoiceForm() {
            document.getElementById('invoice-form').reset();
            document.getElementById('invoice-id').value = '';
            document.getElementById('invoice-paid-amount').value = '0';
            document.getElementById('meter-reading-row').style.display = 'none';
            
            // إعادة تعيين حقل البحث عن العقار
            const propertySearch = document.getElementById('invoice-property-search');
            const propertyHidden = document.getElementById('invoice-property');
            if (propertySearch) propertySearch.value = '';
            if (propertyHidden) propertyHidden.value = '';
            
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('invoice-issue-date').value = today;
            
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            document.getElementById('invoice-due-date').value = nextMonth.toISOString().split('T')[0];
        }
        
        async saveInvoice() {
            try {
                const propertyId = parseInt(document.getElementById('invoice-property').value);
                const invoiceType = document.getElementById('invoice-type').value;
                const invoiceNumber = document.getElementById('invoice-number').value.trim();
                const issueDate = document.getElementById('invoice-issue-date').value;
                const dueDate = document.getElementById('invoice-due-date').value;
                const amount = parseFloat(document.getElementById('invoice-amount').value);
                const paidAmount = parseFloat(document.getElementById('invoice-paid-amount').value) || 0;
                const status = document.getElementById('invoice-status').value;
                const notes = document.getElementById('invoice-notes').value.trim();
                
                if (!propertyId || !invoiceType || !invoiceNumber || !issueDate || !dueDate || !amount || amount <= 0) {
                    this.showNotification('error', 'خطأ', 'يرجى ملء جميع الحقول المطلوبة');
                    return;
                }
                
                let meterReading = '';
                if (['كهرباء', 'مياه', 'غاز'].includes(invoiceType)) {
                    const reading = document.getElementById('meter-reading').value;
                    const unit = document.getElementById('meter-unit').value;
                    if (reading) meterReading = `${reading} ${unit}`;
                }
                
                const invoiceData = {
                    propertyId,
                    invoiceType,
                    invoiceNumber,
                    issueDate,
                    dueDate,
                    amount,
                    paidAmount,
                    status,
                    meterReading,
                    notes
                };
                
                let url = '/api/admin/bills';
                let method = 'POST';
                if (this.currentInvoiceId) {
                    url = `/api/admin/bills/${this.currentInvoiceId}`;
                    method = 'PUT';
                }
                
                const response = await this.apiClient.request(url, {
                    method,
                    body: JSON.stringify(invoiceData)
                });
                
                if (response.success) {
                    this.showNotification('success', 'تم بنجاح', this.currentInvoiceId ? 'تم تحديث الفاتورة' : 'تم إنشاء الفاتورة');
                    document.getElementById('invoice-modal').classList.remove('active');
                    this.currentInvoiceId = null;
                    await this.loadInvoices();
                    await this.updateStatistics();
                    await this.updateRecentPayments();
                }
            } catch (error) {
                console.error('❌ Error saving invoice:', error);
                this.showNotification('error', 'خطأ', error.message || 'فشل في حفظ الفاتورة');
            }
        }
        
        // ---------- دفع فاتورة ----------
        showPaymentModal(invoiceId) {
            const invoice = this.invoices.find(i => i.id === invoiceId);
            if (!invoice || invoice.status === 'مدفوعة') return;
            
            this.currentInvoiceId = invoiceId;
            
            document.getElementById('payment-invoice-id').value = invoiceId;
            document.getElementById('payment-amount').value = invoice.remainingAmount.toFixed(2);
            document.getElementById('payment-date').value = new Date().toISOString().split('T')[0];
            document.getElementById('payment-method').value = 'تحويل بنكي';
            document.getElementById('payment-reference').value = '';
            document.getElementById('payment-notes').value = '';
            
            document.getElementById('payment-modal').classList.add('active');
        }
        
        async savePayment() {
            try {
                const invoiceId = parseInt(document.getElementById('payment-invoice-id').value);
                const amount = parseFloat(document.getElementById('payment-amount').value);
                const date = document.getElementById('payment-date').value;
                const method = document.getElementById('payment-method').value;
                const reference = document.getElementById('payment-reference').value;
                const notes = document.getElementById('payment-notes').value;
                
                if (!invoiceId || !amount || amount <= 0 || !date || !method) {
                    this.showNotification('error', 'خطأ', 'يرجى ملء جميع الحقول المطلوبة');
                    return;
                }
                
                const response = await this.apiClient.request(`/api/admin/bills/${invoiceId}/payments`, {
                    method: 'POST',
                    body: JSON.stringify({
                        amount,
                        paymentDate: date,
                        paymentMethod: method,
                        referenceNumber: reference,
                        notes
                    })
                });
                
                if (response.success) {
                    this.showNotification('success', 'تم الدفع', 'تم تسجيل الدفعة بنجاح');
                    document.getElementById('payment-modal').classList.remove('active');
                    await this.loadInvoices();
                    await this.updateStatistics();
                    await this.updateRecentPayments();
                }
            } catch (error) {
                console.error('❌ Error saving payment:', error);
                this.showNotification('error', 'خطأ', error.message || 'فشل في تسجيل الدفعة');
            }
        }
        
        // ---------- الدفع الجماعي ----------
        async showBulkPaymentModal() {
            if (this.selectedInvoices.size === 0) return;
            
            const selectedIds = Array.from(this.selectedInvoices);
            const selectedInvoices = this.invoices.filter(inv => selectedIds.includes(inv.id) && inv.status !== 'مدفوعة');
            
            if (selectedInvoices.length === 0) {
                this.showNotification('warning', 'تنبيه', 'جميع الفواتير المحددة مدفوعة بالفعل');
                return;
            }
            
            const totalAmount = selectedInvoices.reduce((sum, inv) => sum + inv.remainingAmount, 0);
            
            const listContainer = document.getElementById('bulk-invoices-list');
            let listHtml = '';
            selectedInvoices.forEach(inv => {
                listHtml += `
                    <div class="bulk-invoice-item">
                        <span class="bulk-invoice-number">${inv.invoiceNumber}</span>
                        <span class="bulk-invoice-amount">${this.formatCurrency(inv.remainingAmount)}</span>
                    </div>
                `;
            });
            listContainer.innerHTML = listHtml;
            
            document.getElementById('bulk-total-amount').textContent = this.formatCurrency(totalAmount);
            document.getElementById('bulk-payment-date').value = new Date().toISOString().split('T')[0];
            
            document.getElementById('bulk-payment-modal').classList.add('active');
        }
        
        async processBulkPayment() {
            try {
                const date = document.getElementById('bulk-payment-date').value;
                const method = document.getElementById('bulk-payment-method').value;
                const reference = document.getElementById('bulk-payment-reference').value;
                
                if (!date || !method) {
                    this.showNotification('error', 'خطأ', 'يرجى إدخال تاريخ وطريقة الدفع');
                    return;
                }
                
                const selectedIds = Array.from(this.selectedInvoices);
                const invoicesToPay = this.invoices.filter(inv => selectedIds.includes(inv.id) && inv.status !== 'مدفوعة');
                
                // تنفيذ الدفعات بشكل متسلسل
                for (let invoice of invoicesToPay) {
                    await this.apiClient.request(`/api/admin/bills/${invoice.id}/payments`, {
                        method: 'POST',
                        body: JSON.stringify({
                            amount: invoice.remainingAmount,
                            paymentDate: date,
                            paymentMethod: method,
                            referenceNumber: reference,
                            notes: 'دفعة جماعية'
                        })
                    });
                }
                
                this.selectedInvoices.clear();
                document.getElementById('select-all').checked = false;
                this.updateBulkPaymentButton();
                
                this.showNotification('success', 'تم الدفع الجماعي', `تم تسديد ${invoicesToPay.length} فاتورة بنجاح`);
                document.getElementById('bulk-payment-modal').classList.remove('active');
                await this.loadInvoices();
                await this.updateStatistics();
                await this.updateRecentPayments();
            } catch (error) {
                console.error('❌ Error processing bulk payment:', error);
                this.showNotification('error', 'خطأ', error.message || 'فشل في تنفيذ الدفع الجماعي');
            }
        }
        
        // ---------- حذف فاتورة ----------
        showDeleteConfirmModal(invoiceId) {
            this.currentInvoiceId = invoiceId;
            document.getElementById('delete-confirm-modal').classList.add('active');
        }
        
        async deleteInvoice() {
            if (!this.currentInvoiceId) return;
            
            try {
                const response = await this.apiClient.request(`/api/admin/bills/${this.currentInvoiceId}`, {
                    method: 'DELETE'
                });
                
                if (response.success) {
                    this.showNotification('success', 'تم الحذف', 'تم حذف الفاتورة بنجاح');
                    document.getElementById('delete-confirm-modal').classList.remove('active');
                    this.currentInvoiceId = null;
                    await this.loadInvoices();
                    await this.updateStatistics();
                    await this.updateRecentPayments();
                }
            } catch (error) {
                console.error('❌ Error deleting invoice:', error);
                this.showNotification('error', 'خطأ', 'فشل في حذف الفاتورة');
            }
        }
        
        // ---------- طباعة فاتورة ----------
        async printInvoice(invoiceId) {
            try {
                const response = await this.apiClient.request(`/api/admin/bills/${invoiceId}`);
                if (!response.success) throw new Error(response.message);
                
                const invoice = response.data;
                const printWindow = window.open('', '_blank');
                printWindow.document.write(`
                    <html dir="rtl">
                    <head>
                        <title>فاتورة ${invoice.invoiceNumber}</title>
                        <style>
                            body { font-family: 'Tajawal', sans-serif; padding: 2rem; }
                            .invoice-header { text-align: center; margin-bottom: 2rem; }
                            .invoice-details { border: 1px solid #ccc; padding: 1rem; }
                        </style>
                    </head>
                    <body>
                        <div class="invoice-header">
                            <h1>فاتورة ${invoice.invoiceNumber}</h1>
                            <p>تاريخ الإصدار: ${this.formatDate(invoice.issueDate)}</p>
                            <p>تاريخ الاستحقاق: ${this.formatDate(invoice.dueDate)}</p>
                        </div>
                        <div class="invoice-details">
                            <p><strong>العقار:</strong> ${invoice.propertyName}</p>
                            <p><strong>نوع الفاتورة:</strong> ${invoice.invoiceType}</p>
                            <p><strong>المبلغ:</strong> ${this.formatCurrency(invoice.amount)}</p>
                            <p><strong>المدفوع:</strong> ${this.formatCurrency(invoice.paidAmount)}</p>
                            <p><strong>المتبقي:</strong> ${this.formatCurrency(invoice.remainingAmount)}</p>
                            <p><strong>الحالة:</strong> ${invoice.status}</p>
                            ${invoice.notes ? `<p><strong>ملاحظات:</strong> ${invoice.notes}</p>` : ''}
                        </div>
                    </body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.print();
            } catch (error) {
                console.error('❌ Error printing invoice:', error);
                this.showNotification('error', 'خطأ', 'فشل في طباعة الفاتورة');
            }
        }
        
        // ---------- تصدير الفواتير ----------
        async exportInvoices() {
            try {
                const response = await this.apiClient.request('/api/admin/bills/export/export-data');
                if (response.success && response.data) {
                    const headers = ['رقم الفاتورة', 'العقار', 'النوع', 'تاريخ الإصدار', 'تاريخ الاستحقاق', 'المبلغ', 'المدفوع', 'المتبقي', 'الحالة'];
                    const csvRows = [
                        headers.join(','),
                        ...response.data.map(row => 
                            headers.map(h => `"${row[h] || ''}"`).join(',')
                        )
                    ];
                    const csv = csvRows.join('\n');
                    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `فواتير_${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                    this.showNotification('success', 'تم التصدير', 'تم تصدير الفواتير بنجاح');
                }
            } catch (error) {
                console.error('❌ Error exporting invoices:', error);
                this.showNotification('error', 'خطأ', 'فشل في تصدير الفواتير');
            }
        }
        
        // ---------- إعداد البحث عن العقار (في المودال) ----------
        setupSearchableProperty() {
            const searchInput = document.getElementById('invoice-property-search');
            const hiddenInput = document.getElementById('invoice-property');
            const dropdown = document.getElementById('property-search-dropdown');
            
            if (!searchInput || !hiddenInput || !dropdown) return;
            
            // عرض القائمة عند التركيز
            searchInput.addEventListener('focus', () => {
                this.filterProperties(searchInput.value, dropdown, hiddenInput, searchInput);
            });
            
            // التصفية أثناء الكتابة
            searchInput.addEventListener('input', () => {
                this.filterProperties(searchInput.value, dropdown, hiddenInput, searchInput);
            });
            
            // إخفاء القائمة عند النقر خارجاً
            document.addEventListener('click', (e) => {
                if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
                    dropdown.classList.remove('active');
                }
            });
            
            // اختيار عنصر من القائمة
            dropdown.addEventListener('click', (e) => {
                const item = e.target.closest('.searchable-dropdown-item');
                if (!item || item.classList.contains('no-results')) return;
                
                const id = item.dataset.id;
                const name = item.dataset.name;
                
                hiddenInput.value = id;
                searchInput.value = name;
                dropdown.classList.remove('active');
            });
            
            // منع إرسال النموذج عند الضغط على Enter في حقل البحث
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    // اختيار أول عنصر في القائمة إذا كانت مفتوحة
                    const firstItem = dropdown.querySelector('.searchable-dropdown-item:not(.no-results)');
                    if (firstItem) {
                        firstItem.click();
                    }
                }
            });
        }
        
        filterProperties(searchText, dropdown, hiddenInput, searchInput) {
            const filtered = this.properties.filter(p => 
                p.projectName.toLowerCase().includes(searchText.toLowerCase())
            );
            
            let html = '';
            if (filtered.length === 0) {
                html = '<div class="searchable-dropdown-item no-results">لا توجد نتائج</div>';
            } else {
                filtered.forEach(p => {
                    html += `<div class="searchable-dropdown-item" data-id="${p.id}" data-name="${p.projectName}">${p.projectName}</div>`;
                });
            }
            
            dropdown.innerHTML = html;
            dropdown.classList.add('active');
        }
        
        // ---------- الإحصائيات والمخططات ----------
        async updateStatistics() {
            try {
                const response = await this.apiClient.request('/api/admin/bills/stats');
                if (response.success) {
                    const stats = response.data;
                    
                    document.getElementById('total-invoices').textContent = stats.total || 0;
                    document.getElementById('unpaid-invoices').textContent = (stats.unpaid || 0) + (stats.overdue || 0);
                    document.getElementById('overdue-invoices').textContent = stats.overdue || 0;
                    
                    document.getElementById('overview-total').textContent = stats.total || 0;
                    document.getElementById('overview-paid').textContent = stats.paid || 0;
                    document.getElementById('overview-unpaid').textContent = stats.unpaid || 0;
                    document.getElementById('overview-overdue').textContent = stats.overdue || 0;
                    
                    this.updateChartData(stats);
                    await this.updateOverdueList();
                    await this.updateRecentPayments();
                }
            } catch (error) {
                console.warn('⚠️ Could not load stats from API, using local data');
                this.updateStatisticsFallback();
            }
        }
        
        updateStatisticsFallback() {
            // في حال فشل API، نعتمد على البيانات المحملة في this.invoices
            const total = this.invoices.length;
            const paid = this.invoices.filter(i => i.status === 'مدفوعة').length;
            const unpaid = this.invoices.filter(i => i.status === 'غير مدفوعة').length;
            const overdue = this.invoices.filter(i => i.status === 'متأخرة').length;
            
            document.getElementById('total-invoices').textContent = total;
            document.getElementById('unpaid-invoices').textContent = unpaid + overdue;
            document.getElementById('overdue-invoices').textContent = overdue;
            
            document.getElementById('overview-total').textContent = total;
            document.getElementById('overview-paid').textContent = paid;
            document.getElementById('overview-unpaid').textContent = unpaid;
            document.getElementById('overview-overdue').textContent = overdue;
        }
        
        async updateOverdueList() {
            const container = document.getElementById('overdue-invoices-list');
            if (!container) return;
            
            try {
                const response = await this.apiClient.request('/api/admin/bills/overdue?limit=5');
                let overdue = [];
                if (response.success && Array.isArray(response.data)) {
                    overdue = response.data;
                }
                
                let html = '';
                if (overdue.length === 0) {
                    html = '<div class="empty-state"><i class="fas fa-check-circle"></i><p>لا توجد فواتير متأخرة</p></div>';
                } else {
                    overdue.forEach(inv => {
                        html += `
                            <div class="overdue-item" data-id="${inv.id}">
                                <div class="overdue-item-icon"><i class="fas fa-exclamation-triangle"></i></div>
                                <div class="overdue-item-content">
                                    <div class="overdue-item-header">
                                        <h5 class="overdue-item-title">${inv.invoiceNumber}</h5>
                                        <span class="overdue-item-days">${inv.daysOverdue} يوم</span>
                                    </div>
                                    <div class="overdue-item-details">
                                        <span>${inv.propertyName}</span>
                                        <span class="overdue-item-amount">${this.formatCurrency(inv.remainingAmount)}</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                }
                container.innerHTML = html;
            } catch (error) {
                console.warn('⚠️ Could not load overdue list');
                container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>تعذر التحميل</p></div>';
            }
        }
        
        async updateRecentPayments() {
            const container = document.getElementById('recent-payments-list');
            if (!container) return;
            
            try {
                const response = await this.apiClient.request('/api/admin/bills/recent-payments?limit=5');
                let payments = [];
                if (response.success && Array.isArray(response.data)) {
                    payments = response.data;
                }
                
                let html = '';
                if (payments.length === 0) {
                    html = '<div class="empty-state"><i class="fas fa-credit-card"></i><p>لا توجد مدفوعات حديثة</p></div>';
                } else {
                    payments.forEach(p => {
                        html += `
                            <div class="payment-item">
                                <div class="payment-icon"><i class="fas fa-check"></i></div>
                                <div class="payment-content">
                                    <div class="payment-info">
                                        <span class="payment-invoice">فاتورة #${p.invoiceNumber || ''}</span>
                                        <span class="payment-details">${this.formatDate(p.date)} - ${p.method}</span>
                                    </div>
                                    <span class="payment-amount">${this.formatCurrency(p.amount)}</span>
                                </div>
                            </div>
                        `;
                    });
                }
                container.innerHTML = html;
            } catch (error) {
                console.warn('⚠️ Could not load recent payments');
                container.innerHTML = '<div class="empty-state"><i class="fas fa-credit-card"></i><p>تعذر التحميل</p></div>';
            }
        }
        
        setupChart() {
            const canvas = document.getElementById('invoice-chart');
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
            
            this.chartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['مدفوعة', 'غير مدفوعة', 'متأخرة'],
                    datasets: [{
                        data: [0, 0, 0],
                        backgroundColor: [darkColors[0], darkColors[2], darkColors[4]],
                        borderColor: [borderColors[0], borderColors[2], borderColors[4]],
                        borderWidth: 2,
                        hoverBackgroundColor: [darkColors[1], darkColors[3], darkColors[5]]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: '#F5F5F5', font: { family: 'Tajawal', size: 12 } }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(25,25,25,0.95)',
                            titleColor: '#F5F5F5',
                            bodyColor: '#F5F5F5',
                            borderColor: 'rgba(203,205,205,0.3)',
                            borderWidth: 1,
                            cornerRadius: 8,
                            callbacks: {
                                label: (context) => {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                    return `${label}: ${value} فاتورة (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }
        
        updateChartData(stats = null) {
            if (!this.chartInstance) return;
            
            let paid = 0, unpaid = 0, overdue = 0;
            if (stats) {
                paid = stats.paid || 0;
                unpaid = stats.unpaid || 0;
                overdue = stats.overdue || 0;
            } else {
                paid = this.invoices.filter(i => i.status === 'مدفوعة').length;
                unpaid = this.invoices.filter(i => i.status === 'غير مدفوعة').length;
                overdue = this.invoices.filter(i => i.status === 'متأخرة').length;
            }
            
            this.chartInstance.data.datasets[0].data = [paid, unpaid, overdue];
            this.chartInstance.update();
        }
        
        // ---------- تحديث حالات التأخير ----------
        async refreshOverdueStatuses() {
            try {
                await this.apiClient.request('/api/admin/bills/refresh-overdue', { method: 'POST' });
                console.log('✅ Overdue statuses refreshed');
            } catch (error) {
                console.warn('⚠️ Could not refresh overdue statuses:', error);
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
            this.setupSearchableProperty(); // البحث عن العقار
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
            
            const menuToggle = document.getElementById('menu-toggle');
            const sidebar = document.getElementById('dashboard-sidebar');
            const sidebarClose = document.getElementById('sidebar-close');
            const backdrop = document.getElementById('sidebar-backdrop');
            
            if (menuToggle && sidebar) {
                menuToggle.addEventListener('click', () => {
                    sidebar.classList.add('active');
                    if (backdrop) backdrop.classList.add('active');
                    document.body.style.overflow = 'hidden';
                });
                
                const closeSidebar = () => {
                    sidebar.classList.remove('active');
                    if (backdrop) backdrop.classList.remove('active');
                    document.body.style.overflow = '';
                };
                
                if (sidebarClose) sidebarClose.addEventListener('click', closeSidebar);
                if (backdrop) backdrop.addEventListener('click', closeSidebar);
            }
        }
        
        setupTableSearch() {
            const searchInput = document.getElementById('table-search');
            const searchBtn = document.getElementById('table-search-btn');
            
            const performSearch = () => {
                this.filters.search = searchInput.value.trim();
                this.currentPage = 1;
                this.loadInvoices();
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
                
                document.addEventListener('click', (e) => {
                    if (!filterBtn.contains(e.target) && !filterDropdown.contains(e.target)) {
                        filterDropdown.classList.remove('active');
                        document.body.style.overflow = '';
                    }
                });
            }
            
            if (applyBtn) {
                applyBtn.addEventListener('click', () => {
                    this.updateFiltersFromUI();
                    this.currentPage = 1;
                    this.loadInvoices();
                    filterDropdown.classList.remove('active');
                    document.body.style.overflow = '';
                });
            }
            
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    this.resetFilters();
                    this.updateFiltersUI();
                    this.currentPage = 1;
                    this.loadInvoices();
                    filterDropdown.classList.remove('active');
                    document.body.style.overflow = '';
                });
            }
        }
        
        updateFiltersFromUI() {
            const paymentCbs = document.querySelectorAll('input[name="payment-status"]:checked');
            this.filters.paymentStatus = Array.from(paymentCbs).map(cb => cb.value);
            
            const typeCbs = document.querySelectorAll('input[name="invoice-type"]:checked');
            this.filters.invoiceType = Array.from(typeCbs).map(cb => cb.value);
            
            const propertyCbs = document.querySelectorAll('input[name="property"]:checked');
            this.filters.property = Array.from(propertyCbs).map(cb => parseInt(cb.value));
        }
        
        resetFilters() {
            this.filters = {
                search: '',
                paymentStatus: ['مدفوعة', 'غير مدفوعة', 'متأخرة'],
                invoiceType: ['كهرباء', 'مياه', 'غاز', 'صيانة', 'خدمات'],
                property: this.properties.map(p => p.id)
            };
            
            document.querySelectorAll('input[name="payment-status"]').forEach(cb => cb.checked = true);
            document.querySelectorAll('input[name="invoice-type"]').forEach(cb => cb.checked = true);
            document.querySelectorAll('input[name="property"]').forEach(cb => cb.checked = true);
            
            const searchInput = document.getElementById('table-search');
            if (searchInput) searchInput.value = '';
        }
        
        updateFiltersUI() {
            document.querySelectorAll('input[name="payment-status"]').forEach(cb => {
                cb.checked = this.filters.paymentStatus.includes(cb.value);
            });
            document.querySelectorAll('input[name="invoice-type"]').forEach(cb => {
                cb.checked = this.filters.invoiceType.includes(cb.value);
            });
            document.querySelectorAll('input[name="property"]').forEach(cb => {
                cb.checked = this.filters.property.includes(parseInt(cb.value));
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
                        this.loadInvoices();
                        
                        const span = sortBtn.querySelector('span');
                        if (span) span.textContent = option.querySelector('span').textContent;
                        
                        sortDropdown.classList.remove('show');
                    });
                });
            }
        }
        
        setupButtons() {
            const createBtn = document.getElementById('create-invoice-btn');
            if (createBtn) {
                createBtn.addEventListener('click', () => this.showCreateInvoiceModal());
            }
            
            const refreshBtn = document.getElementById('refresh-btn');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => {
                    this.loadInvoices();
                    this.updateStatistics();
                    this.showNotification('success', 'تم التحديث', 'تم تحديث قائمة الفواتير');
                });
            }
            
            const selectAllBtn = document.getElementById('select-all-btn');
            if (selectAllBtn) {
                selectAllBtn.addEventListener('click', () => {
                    const checkboxes = document.querySelectorAll('.invoice-checkbox');
                    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                    checkboxes.forEach(cb => cb.checked = !allChecked);
                    this.updateSelectedInvoices();
                });
            }
            
            const bulkPaymentBtn = document.getElementById('bulk-payment-btn');
            if (bulkPaymentBtn) {
                bulkPaymentBtn.addEventListener('click', () => this.showBulkPaymentModal());
            }
            
            const exportBtn = document.getElementById('export-invoices-btn');
            if (exportBtn) {
                exportBtn.addEventListener('click', () => this.exportInvoices());
            }
            
            const printBtn = document.getElementById('print-invoices-btn');
            if (printBtn) {
                printBtn.addEventListener('click', () => window.print());
            }
            
            const viewOverdueLink = document.getElementById('view-overdue-link');
            if (viewOverdueLink) {
                viewOverdueLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.filters.paymentStatus = ['متأخرة'];
                    this.updateFiltersUI();
                    this.applyFilters();
                });
            }
        }
        
        setupPageSize() {
            const pageSizeSelect = document.getElementById('page-size');
            if (pageSizeSelect) {
                pageSizeSelect.addEventListener('change', (e) => {
                    this.pageSize = parseInt(e.target.value);
                    this.currentPage = 1;
                    this.loadInvoices();
                });
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
            
            const saveInvoiceBtn = document.getElementById('invoice-modal-save');
            if (saveInvoiceBtn) {
                saveInvoiceBtn.addEventListener('click', () => this.saveInvoice());
            }
            
            const cancelInvoiceBtn = document.getElementById('invoice-modal-cancel');
            if (cancelInvoiceBtn) {
                cancelInvoiceBtn.addEventListener('click', () => {
                    document.getElementById('invoice-modal').classList.remove('active');
                });
            }
            
            const closeInvoiceModal = document.getElementById('invoice-modal-close');
            if (closeInvoiceModal) {
                closeInvoiceModal.addEventListener('click', () => {
                    document.getElementById('invoice-modal').classList.remove('active');
                });
            }
            
            const detailCloseBtn = document.getElementById('detail-modal-close');
            const detailCloseBtn2 = document.getElementById('detail-modal-close-btn');
            const editDetailBtn = document.getElementById('detail-modal-edit-btn');
            const printDetailBtn = document.getElementById('detail-modal-print-btn');
            
            if (detailCloseBtn) detailCloseBtn.addEventListener('click', () => {
                document.getElementById('invoice-detail-modal').classList.remove('active');
            });
            if (detailCloseBtn2) detailCloseBtn2.addEventListener('click', () => {
                document.getElementById('invoice-detail-modal').classList.remove('active');
            });
            if (editDetailBtn) {
                editDetailBtn.addEventListener('click', () => {
                    const modal = document.getElementById('invoice-detail-modal');
                    modal.classList.remove('active');
                    if (this.currentInvoiceId) {
                        this.showEditInvoiceModal(this.currentInvoiceId);
                    }
                });
            }
            if (printDetailBtn) {
                printDetailBtn.addEventListener('click', () => {
                    window.print();
                });
            }
            
            const savePaymentBtn = document.getElementById('payment-save-btn');
            if (savePaymentBtn) {
                savePaymentBtn.addEventListener('click', () => this.savePayment());
            }
            
            const cancelPaymentBtn = document.getElementById('payment-cancel-btn');
            if (cancelPaymentBtn) {
                cancelPaymentBtn.addEventListener('click', () => {
                    document.getElementById('payment-modal').classList.remove('active');
                });
            }
            
            const closePaymentBtn = document.getElementById('payment-modal-close');
            if (closePaymentBtn) {
                closePaymentBtn.addEventListener('click', () => {
                    document.getElementById('payment-modal').classList.remove('active');
                });
            }
            
            const deleteConfirmBtn = document.getElementById('delete-confirm-btn');
            if (deleteConfirmBtn) {
                deleteConfirmBtn.addEventListener('click', () => this.deleteInvoice());
            }
            
            const deleteCancelBtn = document.getElementById('delete-cancel-btn');
            if (deleteCancelBtn) {
                deleteCancelBtn.addEventListener('click', () => {
                    document.getElementById('delete-confirm-modal').classList.remove('active');
                    this.currentInvoiceId = null;
                });
            }
            
            const deleteCloseBtn = document.getElementById('delete-modal-close');
            if (deleteCloseBtn) {
                deleteCloseBtn.addEventListener('click', () => {
                    document.getElementById('delete-confirm-modal').classList.remove('active');
                    this.currentInvoiceId = null;
                });
            }
            
            const bulkPaymentConfirm = document.getElementById('bulk-payment-confirm');
            if (bulkPaymentConfirm) {
                bulkPaymentConfirm.addEventListener('click', () => this.processBulkPayment());
            }
            
            const bulkPaymentCancel = document.getElementById('bulk-payment-cancel');
            if (bulkPaymentCancel) {
                bulkPaymentCancel.addEventListener('click', () => {
                    document.getElementById('bulk-payment-modal').classList.remove('active');
                });
            }
            
            const bulkPaymentClose = document.getElementById('bulk-payment-close');
            if (bulkPaymentClose) {
                bulkPaymentClose.addEventListener('click', () => {
                    document.getElementById('bulk-payment-modal').classList.remove('active');
                });
            }
        }
        
        updateSelectedInvoices() {
            this.selectedInvoices.clear();
            document.querySelectorAll('.invoice-checkbox:checked').forEach(cb => {
                this.selectedInvoices.add(parseInt(cb.dataset.id));
            });
            this.updateBulkPaymentButton();
        }
        
        // ---------- دوال مساعدة ----------
        getStatusClass(status) {
            const map = {
                'مدفوعة': 'status-paid',
                'غير مدفوعة': 'status-unpaid',
                'متأخرة': 'status-overdue',
                'مرفوضة': 'status-rejected'
            };
            return map[status] || 'status-unpaid';
        }
        
        getTypeIcon(type) {
            const map = {
                'كهرباء': 'fa-bolt',
                'مياه': 'fa-water',
                'غاز': 'fa-fire',
                'صيانة': 'fa-tools',
                'خدمات': 'fa-concierge-bell',
                'أخرى': 'fa-file-invoice'
            };
            return map[type] || 'fa-file-invoice';
        }
        
        formatCurrency(amount) {
            if (amount === undefined || amount === null) return '--';
            return new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) + ' ر.س';
        }
        
        formatDate(dateString) {
            if (!dateString) return '--';
            try {
                const date = new Date(dateString);
                return date.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', year: 'numeric' });
            } catch {
                return dateString;
            }
        }
        
        // ---------- تحسينات الجوال ----------
        setupMobileEnhancements() {
            this.setupMobileFilters();
            this.setupMobileButtonEffects();
            this.detectMobile();
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
            }
            
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    const currentIsMobile = window.innerWidth <= 768;
                    if (currentIsMobile) {
                        document.body.classList.add('mobile-view');
                    } else {
                        document.body.classList.remove('mobile-view');
                    }
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
    }
    
    function initialize() {
        try {
            window.invoicesManager = new InvoicesManager();
            console.log('✅ InvoicesManager initialized with real database connection');
        } catch (error) {
            console.error('❌ Failed to initialize InvoicesManager:', error);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();