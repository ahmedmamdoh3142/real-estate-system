// Frontend/admin/pages/payments/payments.js
(function() {
    'use strict';
    
    console.log('✅ payments.js loaded - REAL DATABASE CONNECTION (msnodesqlv8)');
    
    class PaymentsManager {
        constructor() {
            this.baseURL = '';
            this.apiClient = this.createApiClient();
            this.currentUser = null;
            this.payments = [];
            this.filteredPayments = [];
            this.currentPage = 1;
            this.pageSize = 25;
            this.totalPages = 1;
            this.totalItems = 0;
            
            // الفلاتر الافتراضية
            this.filters = {
                search: '',
                status: ['مؤكد', 'مستحق', 'متأخر', 'ملغي'],
                method: ['تحويل بنكي', 'شيك', 'نقدي', 'بطاقة ائتمان'],
                type: ['دفعة عقد', 'قسط شهري', 'دفعة أولى']
            };
            
            this.sortOrder = 'newest';
            this.chartInstance = null;
            this.currentPaymentId = null;
            this.paymentToDelete = null;
            this.financialForecastData = [];
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
            console.log('🚀 PaymentsManager initializing with real database...');
            
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setupPage());
            } else {
                this.setupPage();
            }
        }
        
        async setupPage() {
            console.log('🔧 Setting up payments management page with real data...');
            
            await this.checkAuth();
            await this.checkApiHealth();
            
            await this.loadPayments();
            
            this.setupUI();
            this.setupChart();
            this.updateStatistics();
            this.updateFinancialForecast();
            this.setupMobileEnhancements();
            this.updateSystemTime();
            setInterval(() => this.updateSystemTime(), 60000);
        }
        
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
        
        async loadPayments() {
            try {
                console.log('📥 Loading payments from database...');
                this.showLoading();
                this.isLoading = true;
                
                const now = new Date();
                const month = now.getMonth() + 1;
                const year = now.getFullYear();
                
                const params = new URLSearchParams({
                    page: this.currentPage,
                    limit: this.pageSize,
                    sort: this.sortOrder,
                    search: this.filters.search,
                    status: this.filters.status.join(','),
                    method: this.filters.method.join(','),
                    type: this.filters.type.join(','),
                    month: month,
                    year: year
                });
                
                const response = await this.apiClient.request(`/api/admin/payments?${params}`);
                
                if (response.success) {
                    this.payments = response.data || [];
                    this.totalItems = response.pagination?.totalItems || this.payments.length;
                    this.totalPages = response.pagination?.totalPages || 1;
                    this.filteredPayments = [...this.payments];
                    console.log(`✅ Loaded ${this.payments.length} payments`);
                    this.renderTable();
                }
            } catch (error) {
                console.error('❌ Error loading payments:', error);
                this.showNotification('error', 'خطأ', 'فشل تحميل المدفوعات');
                this.payments = [];
                this.totalItems = 0;
                this.totalPages = 1;
                this.filteredPayments = [];
                this.renderTable();
            } finally {
                this.isLoading = false;
            }
        }
        
        renderTable() {
            const tableBody = document.getElementById('payments-table-body');
            if (!tableBody) return;
            
            const startIndex = (this.currentPage - 1) * this.pageSize;
            const endIndex = Math.min(startIndex + this.pageSize, this.filteredPayments.length);
            const pageData = this.filteredPayments.slice(startIndex, endIndex);
            
            let html = '';
            
            if (pageData.length === 0) {
                html = `
                    <tr class="empty-row">
                        <td colspan="12">
                            <div class="empty-state">
                                <i class="fas fa-credit-card"></i>
                                <h4>لا توجد مدفوعات</h4>
                                <p>لا توجد مدفوعات تطابق معايير البحث</p>
                                ${this.isLoading ? '' : '<button class="btn btn-primary mt-3" id="add-first-payment">إضافة أول دفعة</button>'}
                            </div>
                        </td>
                    </tr>
                `;
            } else {
                pageData.forEach((payment) => {
                    const statusClass = this.getStatusClass(payment.status);
                    const methodClass = this.getMethodClass(payment.paymentMethod);
                    const dueDateFormatted = this.formatDate(payment.dueDate);
                    const paymentDateFormatted = payment.paymentDate ? this.formatDate(payment.paymentDate) : '--';
                    const updatedAtFormatted = this.formatDate(payment.updatedAt);
                    const amountFormatted = this.formatCurrency(payment.amount);
                    
                    // تحديد أيقونة الإجراء المناسبة
                    let actionButtons = '';
                    if (payment.status === 'مستحق' || payment.status === 'متأخر') {
                        // عرض أيقونة تسجيل الدفعة للمستحق والمتأخر (بدلاً من تعديل)
                        actionButtons = `
                            <button class="action-btn btn-payment record-payment" data-id="${payment.id}" title="تسجيل الدفعة">
                                <i class="fas fa-money-bill-wave"></i>
                            </button>
                        `;
                    } else if (payment.status === 'مؤكد') {
                        // عرض أيقونة تعديل فقط للحالات المؤكدة (اختياري)
                        actionButtons = `
                            <button class="action-btn btn-edit update-status" data-id="${payment.id}" title="تحديث الحالة">
                                <i class="fas fa-edit"></i>
                            </button>
                        `;
                    }
                    
                    html += `
                        <tr data-payment-id="${payment.id}" class="${payment.isScheduled ? 'scheduled-payment' : ''}">
                            <td>
                                <label class="checkbox-cell">
                                    <input type="checkbox" class="payment-checkbox" data-id="${payment.id}">
                                    <span class="checkmark"></span>
                                </label>
                            </td>
                            <td><span class="payment-code">${payment.paymentNumber || `PAY-${payment.id}`}</span></td>
                            <td>
                                <div class="contract-info">
                                    <div class="contract-number">${payment.contractNumber || `CON-${payment.contractId}`}</div>
                                    ${payment.isScheduled ? '<small>جدول أقساط</small>' : ''}
                                </div>
                            </td>
                            <td>
                                <div class="customer-info">
                                    <div class="customer-name">${payment.customerName}</div>
                                </div>
                            </td>
                            <td><span class="project-name">${payment.projectName || '--'}</span></td>
                            <td><span class="amount">${amountFormatted}</span></td>
                            <td><span class="due-date">${dueDateFormatted}</span></td>
                            <td><span class="payment-date">${paymentDateFormatted}</span></td>
                            <td>
                                ${payment.paymentMethod ? 
                                    `<span class="payment-method ${methodClass}">${this.getMethodText(payment.paymentMethod)}</span>` : 
                                    '<span class="text-muted">--</span>'
                                }
                            </td>
                            <td><span class="status-badge ${statusClass}">${payment.status}</span></td>
                            <td><span class="updated-at">${updatedAtFormatted}</span></td>
                            <td>
                                <div class="action-buttons">
                                    <button class="action-btn btn-view view-payment" data-id="${payment.id}" title="عرض التفاصيل">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    ${actionButtons}
                                </div>
                            </td>
                        </tr>
                    `;
                });
            }
            
            tableBody.innerHTML = html;
            this.updatePagination();
            this.attachTableEvents();
            
            const addFirstBtn = document.getElementById('add-first-payment');
            if (addFirstBtn) {
                addFirstBtn.addEventListener('click', () => this.showNewPaymentModal());
            }
        }
        
        getStatusClass(status) {
            const statusMap = {
                'مؤكد': 'status-confirmed',
                'مستحق': 'status-pending',
                'متأخر': 'status-overdue',
                'ملغي': 'status-cancelled'
            };
            return statusMap[status] || 'status-pending';
        }
        
        getMethodClass(method) {
            if (!method) return '';
            const methodMap = {
                'تحويل بنكي': 'method-bank',
                'شيك': 'method-check',
                'نقدي': 'method-cash',
                'بطاقة ائتمان': 'method-card'
            };
            return methodMap[method] || '';
        }
        
        getMethodText(method) {
            if (!method) return '--';
            const textMap = {
                'تحويل بنكي': 'تحويل',
                'شيك': 'شيك',
                'نقدي': 'نقدي',
                'بطاقة ائتمان': 'بطاقة'
            };
            return textMap[method] || method;
        }
        
        formatDate(dateString) {
            if (!dateString) return '--';
            try {
                const date = new Date(dateString);
                return date.toLocaleDateString('ar-SA', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                });
            } catch {
                return dateString;
            }
        }
        
        formatCurrency(amount) {
            if (!amount) return '0';
            return new Intl.NumberFormat('ar-SA').format(amount);
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
            
            let html = '';
            
            const prevDisabled = this.currentPage === 1 ? 'disabled' : '';
            html += `<button class="pagination-btn prev-btn" ${prevDisabled}><i class="fas fa-chevron-right"></i></button>`;
            html += `<div class="pagination-pages">`;
            
            const maxPagesToShow = window.innerWidth <= 768 ? 3 : 5;
            let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
            let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);
            
            if (endPage - startPage + 1 < maxPagesToShow) {
                startPage = Math.max(1, endPage - maxPagesToShow + 1);
            }
            
            for (let i = startPage; i <= endPage; i++) {
                html += `<button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
            }
            
            html += `</div>`;
            const nextDisabled = this.currentPage === this.totalPages ? 'disabled' : '';
            html += `<button class="pagination-btn next-btn" ${nextDisabled}><i class="fas fa-chevron-left"></i></button>`;
            
            paginationContainer.innerHTML = html;
            this.attachPaginationEvents();
        }
        
        attachPaginationEvents() {
            document.querySelectorAll('.pagination-btn[data-page]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const page = parseInt(e.target.dataset.page);
                    if (page !== this.currentPage) {
                        this.currentPage = page;
                        this.loadPayments();
                    }
                });
            });
            
            const prevBtn = document.querySelector('.prev-btn');
            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    if (this.currentPage > 1) {
                        this.currentPage--;
                        this.loadPayments();
                    }
                });
            }
            
            const nextBtn = document.querySelector('.next-btn');
            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    if (this.currentPage < this.totalPages) {
                        this.currentPage++;
                        this.loadPayments();
                    }
                });
            }
        }
        
        attachTableEvents() {
            document.querySelectorAll('.view-payment').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    this.showPaymentDetail(id);
                });
            });
            
            document.querySelectorAll('.record-payment').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    this.showRecordPaymentModal(id);
                });
            });
            
            document.querySelectorAll('.update-status').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    this.showUpdateStatusModal(id);
                });
            });
            
            document.querySelectorAll('.delete-payment').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    this.paymentToDelete = id;
                    document.getElementById('delete-confirm-modal').classList.add('active');
                });
            });
            
            const selectAll = document.getElementById('select-all');
            if (selectAll) {
                selectAll.addEventListener('change', (e) => {
                    document.querySelectorAll('.payment-checkbox').forEach(cb => cb.checked = e.target.checked);
                });
            }
        }
        
        async showPaymentDetail(paymentId) {
            try {
                const response = await this.apiClient.request(`/api/admin/payments/${paymentId}`);
                if (!response.success) throw new Error(response.message);
                
                const payment = response.data;
                const modal = document.getElementById('payment-detail-modal');
                const modalBody = document.getElementById('modal-payment-body');
                const modalTitle = document.getElementById('modal-payment-title');
                
                modalTitle.textContent = `تفاصيل الدفعة: ${payment.paymentNumber || `PAY-${payment.id}`}`;
                
                const statusClass = this.getStatusClass(payment.status);
                const createdAt = this.formatDate(payment.createdAt);
                const updatedAt = this.formatDate(payment.updatedAt);
                const dueDate = this.formatDate(payment.dueDate);
                const paymentDate = payment.paymentDate ? this.formatDate(payment.paymentDate) : '--';
                const amountFormatted = this.formatCurrency(payment.amount);
                const methodClass = this.getMethodClass(payment.paymentMethod);
                const methodText = this.getMethodText(payment.paymentMethod);
                
                const html = `
                    <div class="payment-detail">
                        <div class="detail-section">
                            <h4><i class="fas fa-info-circle"></i> معلومات عامة</h4>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <span class="detail-label">رقم الدفعة:</span>
                                    <span class="detail-value">${payment.paymentNumber || `PAY-${payment.id}`}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">نوع الدفعة:</span>
                                    <span class="detail-value">${payment.paymentType}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">الحالة:</span>
                                    <span class="status-badge ${statusClass}">${payment.status}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">تاريخ الإنشاء:</span>
                                    <span class="detail-value">${createdAt}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h4><i class="fas fa-file-contract"></i> معلومات العقد</h4>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <span class="detail-label">رقم العقد:</span>
                                    <span class="detail-value">${payment.contractNumber || `CON-${payment.contractId}`}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">العميل:</span>
                                    <span class="detail-value">${payment.customerName}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">المشروع:</span>
                                    <span class="detail-value">${payment.projectName || '--'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h4><i class="fas fa-money-bill-wave"></i> معلومات مالية</h4>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <span class="detail-label">المبلغ:</span>
                                    <span class="detail-value amount">${amountFormatted} ر.س</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">تاريخ الاستحقاق:</span>
                                    <span class="detail-value">${dueDate}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">تاريخ الدفع:</span>
                                    <span class="detail-value">${paymentDate}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">طريقة الدفع:</span>
                                    <span class="detail-value">
                                        ${payment.paymentMethod ? 
                                            `<span class="payment-method ${methodClass}">${methodText}</span>` : 
                                            '--'
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        ${payment.paymentMethod && (payment.paymentMethod === 'تحويل بنكي' || payment.paymentMethod === 'شيك') ? `
                            <div class="detail-section">
                                <h4><i class="fas fa-university"></i> معلومات البنك</h4>
                                <div class="detail-grid">
                                    ${payment.bankName ? `
                                        <div class="detail-item">
                                            <span class="detail-label">اسم البنك:</span>
                                            <span class="detail-value">${payment.bankName}</span>
                                        </div>
                                    ` : ''}
                                    ${payment.referenceNumber ? `
                                        <div class="detail-item">
                                            <span class="detail-label">رقم المرجع:</span>
                                            <span class="detail-value">${payment.referenceNumber}</span>
                                        </div>
                                    ` : ''}
                                    ${payment.receiptNumber ? `
                                        <div class="detail-item">
                                            <span class="detail-label">رقم الإيصال:</span>
                                            <span class="detail-value">${payment.receiptNumber}</span>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        ` : ''}
                        
                        ${payment.collectedByName ? `
                            <div class="detail-section">
                                <h4><i class="fas fa-user-tie"></i> معلومات المحصل</h4>
                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <span class="detail-label">المحصل:</span>
                                        <span class="detail-value">${payment.collectedByName}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">آخر تحديث:</span>
                                        <span class="detail-value">${updatedAt}</span>
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                        
                        ${payment.notes ? `
                            <div class="detail-section">
                                <h4><i class="fas fa-sticky-note"></i> ملاحظات</h4>
                                <div class="message-content">
                                    ${payment.notes}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                `;
                
                modalBody.innerHTML = html;
                modal.classList.add('active');
                
                const editBtn = document.getElementById('modal-edit-btn');
                if (editBtn) {
                    editBtn.dataset.paymentId = paymentId;
                    editBtn.onclick = () => {
                        modal.classList.remove('active');
                        if (payment.status === 'مستحق' || payment.status === 'متأخر') {
                            this.showRecordPaymentModal(paymentId);
                        } else {
                            this.showUpdateStatusModal(paymentId);
                        }
                    };
                }
                
            } catch (error) {
                console.error('❌ Error showing payment detail:', error);
                this.showNotification('error', 'خطأ', 'فشل في تحميل تفاصيل الدفعة');
            }
        }
        
        // ========== تحميل قائمة العقود النشطة للـ dropdown ==========
        async loadContractsForSelect() {
            try {
                // جلب العقود النشطة فقط
                const response = await this.apiClient.request('/api/admin/contracts?status=نشط&limit=100');
                if (response.success) {
                    const select = document.getElementById('contract-select');
                    select.innerHTML = '<option value="">-- اختر العقد --</option>';
                    response.data.forEach(contract => {
                        const option = document.createElement('option');
                        option.value = contract.id;
                        option.textContent = `${contract.contractNumber || `CON-${contract.id}`} - ${contract.customerName}`;
                        select.appendChild(option);
                    });
                }
            } catch (error) {
                console.warn('⚠️ Could not load contracts for select');
                // في حالة الفشل، نضيف خيارات وهمية للاختبار
                const select = document.getElementById('contract-select');
                select.innerHTML = '<option value="">-- اختر العقد --</option>';
                select.innerHTML += '<option value="1">CON-2024-0001 - محمد العتيبي</option>';
                select.innerHTML += '<option value="2">CON-2024-0002 - شركة التقنية</option>';
            }
        }
        
        // ========== عرض مودال إضافة دفعة جديدة ==========
        showNewPaymentModal() {
            const modal = document.getElementById('new-payment-modal');
            const paymentDateInput = document.getElementById('payment-date');
            
            if (paymentDateInput) {
                const today = new Date().toISOString().split('T')[0];
                paymentDateInput.value = today;
            }
            
            // تحميل قائمة العقود للاختيار
            this.loadContractsForSelect();
            
            // إعادة تعيين الحقول
            document.getElementById('new-payment-form').reset();
            
            modal.classList.add('active');
            
            const submitBtn = document.getElementById('new-payment-submit-btn');
            submitBtn.onclick = () => this.submitNewPayment();
        }
        
        // ========== إرسال دفعة جديدة (عامة) ==========
        async submitNewPayment() {
            try {
                const contractId = document.getElementById('contract-select').value;
                const amount = parseFloat(document.getElementById('payment-amount').value);
                const paymentDate = document.getElementById('payment-date').value;
                const paymentMethod = document.getElementById('payment-method').value;
                const bankName = document.getElementById('bank-name').value;
                const referenceNumber = document.getElementById('reference-number').value;
                const receiptNumber = document.getElementById('receipt-number').value;
                const notes = document.getElementById('payment-notes').value;
                
                if (!contractId || !amount || !paymentDate || !paymentMethod) {
                    this.showNotification('error', 'خطأ', 'يرجى ملء جميع الحقول المطلوبة');
                    return;
                }
                
                // استخدام المسار الجديد /api/admin/contracts/${contractId}/payments
                const response = await this.apiClient.request(`/api/admin/contracts/${contractId}/payments`, {
                    method: 'POST',
                    body: JSON.stringify({
                        amount,
                        paymentDate,
                        paymentMethod,
                        bankName,
                        referenceNumber,
                        receiptNumber,
                        notes,
                        collectedBy: this.currentUser?.id || 1
                    })
                });
                
                if (response.success) {
                    this.showNotification('success', 'تم بنجاح', 'تم تسجيل الدفعة الجديدة بنجاح');
                    document.getElementById('new-payment-modal').classList.remove('active');
                    document.getElementById('new-payment-form').reset();
                    await this.loadPayments();
                    await this.updateStatistics();
                    await this.updateFinancialForecast();
                }
            } catch (error) {
                console.error('❌ Error submitting new payment:', error);
                this.showNotification('error', 'خطأ', error.message || 'فشل في تسجيل الدفعة');
            }
        }
        
        // ========== عرض مودال تسجيل دفعة لقسط معين (من الجدول) ==========
        async showRecordPaymentModal(paymentId) {
            try {
                const response = await this.apiClient.request(`/api/admin/payments/${paymentId}`);
                if (!response.success) throw new Error(response.message);
                
                const payment = response.data;
                
                // تحديد ما إذا كان هذا العنصر هو قسط (scheduled) أم دفعة حقيقية
                if (payment.isScheduled) {
                    // إذا كان قسطاً، نستخدم endpoint خاص بدفع القسط
                    this.currentPaymentId = paymentId;
                    const modal = document.getElementById('new-payment-modal');
                    
                    // تعبئة الحقول بقيم القسط
                    // أولاً تأكد من تحميل قائمة العقود ثم حدد العقد
                    await this.loadContractsForSelect();
                    const contractSelect = document.getElementById('contract-select');
                    if (contractSelect) {
                        contractSelect.value = payment.contractId;
                        // قد نريد تعطيله لأنه محدد مسبقاً
                        contractSelect.disabled = true;
                    }
                    
                    document.getElementById('payment-amount').value = payment.amount;
                    document.getElementById('payment-date').value = new Date().toISOString().split('T')[0];
                    
                    modal.classList.add('active');
                    
                    const submitBtn = document.getElementById('new-payment-submit-btn');
                    submitBtn.onclick = () => this.submitPaySchedule(paymentId);
                    
                    // عند إغلاق المودال، نعيد تمكين الـ select
                    const closeHandler = () => {
                        if (contractSelect) contractSelect.disabled = false;
                    };
                    const closeBtns = document.querySelectorAll('#new-payment-modal-close, #new-payment-cancel-btn');
                    closeBtns.forEach(btn => btn.addEventListener('click', closeHandler, { once: true }));
                    
                } else {
                    // إذا كانت دفعة حقيقية، نفتح modal تحديث الحالة
                    this.showUpdateStatusModal(paymentId);
                }
            } catch (error) {
                console.error('❌ Error loading payment for record:', error);
                this.showNotification('error', 'خطأ', 'فشل في تحميل بيانات الدفعة');
            }
        }
        
        async submitPaySchedule(scheduleId) {
            try {
                const amount = parseFloat(document.getElementById('payment-amount').value);
                const paymentDate = document.getElementById('payment-date').value;
                const paymentMethod = document.getElementById('payment-method').value;
                const bankName = document.getElementById('bank-name').value;
                const referenceNumber = document.getElementById('reference-number').value;
                const receiptNumber = document.getElementById('receipt-number').value;
                const notes = document.getElementById('payment-notes').value;
                
                if (!amount || !paymentDate || !paymentMethod) {
                    this.showNotification('error', 'خطأ', 'يرجى ملء جميع الحقول المطلوبة');
                    return;
                }
                
                const response = await this.apiClient.request(`/api/admin/payments/schedule/${scheduleId}/pay`, {
                    method: 'POST',
                    body: JSON.stringify({
                        amount,
                        paymentDate,
                        paymentMethod,
                        bankName,
                        referenceNumber,
                        receiptNumber,
                        notes,
                        collectedBy: this.currentUser?.id || 1
                    })
                });
                
                if (response.success) {
                    this.showNotification('success', 'تم بنجاح', 'تم تسجيل الدفعة بنجاح');
                    document.getElementById('new-payment-modal').classList.remove('active');
                    document.getElementById('new-payment-form').reset();
                    // إعادة تمكين الـ select إذا كان معطلاً
                    const contractSelect = document.getElementById('contract-select');
                    if (contractSelect) contractSelect.disabled = false;
                    await this.loadPayments();
                    await this.updateStatistics();
                    await this.updateFinancialForecast();
                }
            } catch (error) {
                console.error('❌ Error paying schedule:', error);
                this.showNotification('error', 'خطأ', error.message || 'فشل في تسجيل الدفعة');
            }
        }
        
        showUpdateStatusModal(paymentId) {
            this.currentPaymentId = paymentId;
            const modal = document.getElementById('update-status-modal');
            modal.classList.add('active');
            
            const submitBtn = document.getElementById('update-status-submit-btn');
            submitBtn.onclick = () => this.submitUpdateStatus();
        }
        
        async submitUpdateStatus() {
            try {
                const newStatus = document.getElementById('update-status').value;
                const reason = document.getElementById('update-reason').value;
                
                if (!newStatus) {
                    this.showNotification('error', 'خطأ', 'يرجى اختيار الحالة الجديدة');
                    return;
                }
                
                const response = await this.apiClient.request(`/api/admin/payments/${this.currentPaymentId}/status`, {
                    method: 'PUT',
                    body: JSON.stringify({ status: newStatus, reason })
                });
                
                if (response.success) {
                    this.showNotification('success', 'تم بنجاح', 'تم تحديث حالة الدفعة بنجاح');
                    document.getElementById('update-status-modal').classList.remove('active');
                    document.getElementById('update-status-form').reset();
                    await this.loadPayments();
                    await this.updateStatistics();
                    await this.updateFinancialForecast();
                }
            } catch (error) {
                console.error('❌ Error updating status:', error);
                this.showNotification('error', 'خطأ', error.message || 'فشل في تحديث حالة الدفعة');
            }
        }
        
        async confirmDelete() {
            if (!this.paymentToDelete) return;
            
            try {
                const response = await this.apiClient.request(`/api/admin/payments/${this.paymentToDelete}`, {
                    method: 'DELETE'
                });
                
                if (response.success) {
                    this.showNotification('success', 'تم الحذف', 'تم حذف الدفعة بنجاح');
                    document.getElementById('delete-confirm-modal').classList.remove('active');
                    this.paymentToDelete = null;
                    await this.loadPayments();
                    await this.updateStatistics();
                    await this.updateFinancialForecast();
                }
            } catch (error) {
                console.error('❌ Error deleting payment:', error);
                this.showNotification('error', 'خطأ', error.message || 'فشل في حذف الدفعة');
            }
        }
        
        setupUI() {
            this.setupDropdowns();
            this.setupTableSearch();
            this.setupTableFilters();
            this.setupButtons();
            this.setupPageSize();
            this.setupPaymentMethodChange();
            this.setupFinancialForecast();
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
                this.loadPayments();
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
                    this.loadPayments();
                    filterDropdown.classList.remove('active');
                    document.body.style.overflow = '';
                });
            }
            
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    this.resetFilters();
                    this.updateFiltersUI();
                    this.currentPage = 1;
                    this.loadPayments();
                    filterDropdown.classList.remove('active');
                    document.body.style.overflow = '';
                });
            }
        }
        
        updateFiltersFromUI() {
            const statusCbs = document.querySelectorAll('input[name="status"]:checked');
            const methodCbs = document.querySelectorAll('input[name="method"]:checked');
            const typeCbs = document.querySelectorAll('input[name="type"]:checked');
            
            this.filters.status = Array.from(statusCbs).map(cb => cb.value);
            this.filters.method = Array.from(methodCbs).map(cb => cb.value);
            this.filters.type = Array.from(typeCbs).map(cb => cb.value);
        }
        
        resetFilters() {
            this.filters = {
                search: '',
                status: ['مؤكد', 'مستحق', 'متأخر', 'ملغي'],
                method: ['تحويل بنكي', 'شيك', 'نقدي', 'بطاقة ائتمان'],
                type: ['دفعة عقد', 'قسط شهري', 'دفعة أولى']
            };
            
            document.querySelectorAll('input[name="status"]').forEach(cb => cb.checked = true);
            document.querySelectorAll('input[name="method"]').forEach(cb => cb.checked = true);
            document.querySelectorAll('input[name="type"]').forEach(cb => cb.checked = true);
            
            const searchInput = document.getElementById('table-search');
            if (searchInput) searchInput.value = '';
        }
        
        updateFiltersUI() {
            document.querySelectorAll('input[name="status"]').forEach(cb => {
                cb.checked = this.filters.status.includes(cb.value);
            });
            document.querySelectorAll('input[name="method"]').forEach(cb => {
                cb.checked = this.filters.method.includes(cb.value);
            });
            document.querySelectorAll('input[name="type"]').forEach(cb => {
                cb.checked = this.filters.type.includes(cb.value);
            });
        }
        
        setupButtons() {
            const refreshBtn = document.getElementById('refresh-btn');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => {
                    this.loadPayments();
                    this.updateStatistics();
                    this.updateFinancialForecast();
                    this.showNotification('success', 'تم التحديث', 'تم تحديث قائمة المدفوعات بنجاح');
                });
            }
            
            const newPaymentBtn = document.getElementById('new-payment-btn');
            if (newPaymentBtn) {
                newPaymentBtn.addEventListener('click', () => this.showNewPaymentModal());
            }
            
            const exportBtn = document.getElementById('export-btn');
            if (exportBtn) {
                exportBtn.addEventListener('click', () => this.exportPayments());
            }
        }
        
        setupPageSize() {
            const pageSizeSelect = document.getElementById('page-size');
            if (pageSizeSelect) {
                pageSizeSelect.addEventListener('change', (e) => {
                    this.pageSize = parseInt(e.target.value);
                    this.currentPage = 1;
                    this.loadPayments();
                });
            }
        }
        
        setupPaymentMethodChange() {
            const paymentMethodSelect = document.getElementById('payment-method');
            const bankInfoGroup = document.getElementById('bank-info-group');
            
            if (paymentMethodSelect && bankInfoGroup) {
                paymentMethodSelect.addEventListener('change', (e) => {
                    if (e.target.value === 'تحويل بنكي' || e.target.value === 'شيك') {
                        bankInfoGroup.style.display = 'block';
                    } else {
                        bankInfoGroup.style.display = 'none';
                    }
                });
            }
        }
        
        setupFinancialForecast() {
            const periodSelect = document.getElementById('forecast-period');
            if (periodSelect) {
                periodSelect.addEventListener('change', () => this.updateFinancialForecast());
            }
        }
        
        setupModals() {
            const detailModal = document.getElementById('payment-detail-modal');
            const closeModalBtns = document.querySelectorAll('#modal-close-btn, #modal-close-btn-2');
            
            closeModalBtns.forEach(btn => {
                btn.addEventListener('click', () => detailModal?.classList.remove('active'));
            });
            
            const newPaymentModal = document.getElementById('new-payment-modal');
            const newPaymentCloseBtns = document.querySelectorAll('#new-payment-modal-close, #new-payment-cancel-btn');
            
            newPaymentCloseBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    newPaymentModal?.classList.remove('active');
                    // إعادة تمكين الـ select إذا كان معطلاً
                    const contractSelect = document.getElementById('contract-select');
                    if (contractSelect) contractSelect.disabled = false;
                });
            });
            
            const updateStatusModal = document.getElementById('update-status-modal');
            const updateStatusCloseBtns = document.querySelectorAll('#update-status-close, #update-status-cancel-btn');
            
            updateStatusCloseBtns.forEach(btn => {
                btn.addEventListener('click', () => updateStatusModal?.classList.remove('active'));
            });
            
            const forecastModal = document.getElementById('forecast-detail-modal');
            const forecastCloseBtns = document.querySelectorAll('#forecast-modal-close, #forecast-close-btn');
            
            forecastCloseBtns.forEach(btn => {
                btn.addEventListener('click', () => forecastModal?.classList.remove('active'));
            });
            
            const deleteModal = document.getElementById('delete-confirm-modal');
            const deleteCloseBtns = document.querySelectorAll('#delete-modal-close, #delete-cancel-btn');
            deleteCloseBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    deleteModal.classList.remove('active');
                    this.paymentToDelete = null;
                });
            });
            
            const confirmDeleteBtn = document.getElementById('delete-confirm-btn');
            if (confirmDeleteBtn) {
                confirmDeleteBtn.addEventListener('click', () => this.confirmDelete());
            }
            
            window.addEventListener('click', (e) => {
                if (e.target === detailModal) detailModal.classList.remove('active');
                if (e.target === newPaymentModal) {
                    newPaymentModal.classList.remove('active');
                    const contractSelect = document.getElementById('contract-select');
                    if (contractSelect) contractSelect.disabled = false;
                }
                if (e.target === updateStatusModal) updateStatusModal.classList.remove('active');
                if (e.target === forecastModal) forecastModal.classList.remove('active');
                if (e.target === deleteModal) {
                    deleteModal.classList.remove('active');
                    this.paymentToDelete = null;
                }
            });
        }
        
        async updateStatistics() {
            try {
                const response = await this.apiClient.request('/api/admin/payments/stats');
                if (response.success) {
                    const stats = response.data;
                    
                    // تحديث بطاقات النظرة العامة
                    document.getElementById('overview-total').textContent = this.formatNumber(stats.totalAmount);
                    document.getElementById('overview-paid').textContent = this.formatNumber(stats.paidAmount);
                    document.getElementById('overview-pending').textContent = this.formatNumber(stats.pendingAmount);
                    document.getElementById('overview-overdue').textContent = this.formatNumber(stats.overdueAmount);
                    
                    // تحديث المخطط الدائري باستخدام المبالغ
                    this.updateChartData(stats);
                }
            } catch (error) {
                console.warn('⚠️ Could not load stats from API');
            }
        }
        
        formatNumber(num) {
            if (!num) return '0';
            return new Intl.NumberFormat('ar-SA').format(Math.round(num));
        }
        
        setupChart() {
            const canvas = document.getElementById('payments-chart');
            if (!canvas) return;
            
            if (this.chartInstance) this.chartInstance.destroy();
            
            const ctx = canvas.getContext('2d');
            
            // ألوان داكنة للمخطط
            const darkColors = [
                '#1E1E1E', // أسود داكن للمسدد
                '#3A3A3A', // رمادي داكن للمستحق
                '#e74c3c'  // أحمر للمتأخر
            ];
            
            const borderColors = [
                '#1E1E1E', 
                '#3A3A3A',
                '#e74c3c'
            ];
            
            this.chartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['مسدد', 'مستحق', 'متأخر'],
                    datasets: [{
                        data: [0, 0, 0],
                        backgroundColor: darkColors,
                        borderColor: borderColors,
                        borderWidth: 2,
                        hoverOffset: 10
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
                                    return `${label}: ${value.toLocaleString('ar-SA')} ر.س (${percentage}%)`;
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
        
        updateChartData(stats) {
            if (!this.chartInstance) return;
            
            // تحديث بيانات المخطط: [مسدد, مستحق, متأخر]
            this.chartInstance.data.datasets[0].data = [
                stats.paidAmount || 0,
                stats.pendingAmount || 0,
                stats.overdueAmount || 0
            ];
            this.chartInstance.update();
        }
        
        // ========== دالة التوقعات المالية المعدلة ==========
        async updateFinancialForecast() {
            try {
                const periodSelect = document.getElementById('forecast-period');
                const months = periodSelect ? parseInt(periodSelect.value) : 6;
                
                const response = await this.apiClient.request(`/api/admin/payments/forecast?months=${months}`);
                if (response.success) {
                    this.financialForecastData = response.data;
                    this.renderForecastCards();
                }
            } catch (error) {
                console.warn('⚠️ Could not load forecast data');
                const forecastContainer = document.getElementById('forecast-monthly-cards');
                if (forecastContainer) {
                    forecastContainer.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h4>خطأ في تحميل التوقعات</h4>
                            <p>يرجى المحاولة لاحقاً</p>
                        </div>
                    `;
                }
            }
        }
        
        renderForecastCards() {
            const forecastContainer = document.getElementById('forecast-monthly-cards');
            if (!forecastContainer) return;
            
            const skeleton = document.querySelector('.forecast-skeleton');
            if (skeleton) skeleton.style.display = 'none';
            
            if (!this.financialForecastData || this.financialForecastData.length === 0) {
                forecastContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-chart-line"></i>
                        <h4>لا توجد توقعات مالية</h4>
                        <p>لا توجد أقساط مستقبلية متوقعة لعرضها</p>
                    </div>
                `;
                return;
            }
            
            let html = '';
            
            this.financialForecastData.forEach((forecast, index) => {
                const amountFormatted = this.formatCurrency(forecast.totalAmount);
                
                html += `
                    <div class="forecast-month-card" data-month-index="${index}">
                        <div class="card-header-gradient"></div>
                        
                        <div class="forecast-card-header">
                            <div class="forecast-month-info">
                                <div class="forecast-month-name">
                                    <div class="forecast-month-icon">
                                        <i class="fas fa-calendar-alt"></i>
                                    </div>
                                    ${forecast.month} ${forecast.year}
                                </div>
                            </div>
                        </div>
                        
                        <div class="forecast-card-body">
                            <div class="forecast-amount-section">
                                <div class="forecast-amount-value">${amountFormatted} ر.س</div>
                                <div class="forecast-amount-label">إجمالي المبالغ المتوقعة</div>
                            </div>
                            
                            <div class="forecast-stats-grid">
                                <div class="forecast-stat-item">
                                    <span class="forecast-stat-label">عدد الدفعات</span>
                                    <span class="forecast-stat-value">
                                        ${forecast.paymentsCount}
                                        <i class="fas fa-file-invoice-dollar forecast-stat-icon"></i>
                                    </span>
                                </div>
                                <div class="forecast-stat-item">
                                    <span class="forecast-stat-label">عدد العملاء</span>
                                    <span class="forecast-stat-value">
                                        ${forecast.uniqueCustomers}
                                        <i class="fas fa-users forecast-stat-icon"></i>
                                    </span>
                                </div>
                                <div class="forecast-stat-item">
                                    <span class="forecast-stat-label">عدد العقود</span>
                                    <span class="forecast-stat-value">
                                        ${forecast.uniqueContracts}
                                        <i class="fas fa-file-contract forecast-stat-icon"></i>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            forecastContainer.innerHTML = html;
            this.attachForecastCardEvents();
        }
        
        attachForecastCardEvents() {
            document.querySelectorAll('.forecast-month-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    const monthIndex = parseInt(e.currentTarget.dataset.monthIndex);
                    this.showForecastDetail(monthIndex);
                });
            });
        }
        
        async showForecastDetail(monthIndex) {
            try {
                const forecast = this.financialForecastData[monthIndex];
                if (!forecast) return;
                
                // نجلب التفاصيل من الـ API (يمكننا استخدام forecast الموجود مباشرة لأنه يحتوي على customerPayments)
                // لكن للتأكد نستخدم API
                const response = await this.apiClient.request(`/api/admin/payments/forecast/${monthIndex}`);
                if (response.success) {
                    const detail = response.data;
                    
                    const modal = document.getElementById('forecast-detail-modal');
                    const modalBody = document.getElementById('modal-forecast-body');
                    const modalTitle = document.getElementById('modal-forecast-title');
                    
                    modalTitle.textContent = `تفاصيل التوقعات المالية: ${detail.month} ${detail.year}`;
                    
                    let customersHtml = '';
                    if (detail.customerPayments && detail.customerPayments.length > 0) {
                        detail.customerPayments.forEach(payment => {
                            customersHtml += `
                                <div class="forecast-customer-card">
                                    <div class="customer-card-header">
                                        <div class="customer-info">
                                            <div class="customer-avatar">
                                                ${payment.customerName ? payment.customerName.charAt(0) : '?'}
                                            </div>
                                            <div class="customer-details">
                                                <div class="customer-name">${payment.customerName || 'غير معروف'}</div>
                                                <div class="customer-company">${payment.projectName || ''}</div>
                                            </div>
                                        </div>
                                        <span class="customer-payment-status">${payment.status}</span>
                                    </div>
                                    
                                    <div class="customer-payment-details">
                                        <div class="customer-payment-detail">
                                            <span class="customer-payment-label">رقم العقد</span>
                                            <span class="customer-payment-value">${payment.contractNumber || '--'}</span>
                                        </div>
                                        <div class="customer-payment-detail">
                                            <span class="customer-payment-label">الهاتف</span>
                                            <span class="customer-payment-value">${payment.customerPhone || '--'}</span>
                                        </div>
                                        <div class="customer-payment-detail">
                                            <span class="customer-payment-label">البريد</span>
                                            <span class="customer-payment-value">${payment.customerEmail || '--'}</span>
                                        </div>
                                        <div class="customer-payment-detail">
                                            <span class="customer-payment-label">الوحدة</span>
                                            <span class="customer-payment-value">${payment.unitDetails || '--'}</span>
                                        </div>
                                    </div>
                                    
                                    <div class="customer-payment-detail">
                                        <span class="customer-payment-label">المبلغ المتوقع</span>
                                        <span class="customer-payment-amount">${this.formatCurrency(payment.amount)} ر.س</span>
                                    </div>
                                    
                                    <div class="customer-contracts">
                                        <div class="contracts-title">
                                            <i class="fas fa-info-circle"></i>
                                            تاريخ الاستحقاق: ${this.formatDate(payment.dueDate)}
                                        </div>
                                    </div>
                                </div>
                            `;
                        });
                    } else {
                        customersHtml = '<div class="empty-state">لا توجد دفعات لهذا الشهر</div>';
                    }
                    
                    const html = `
                        <div class="forecast-detail">
                            <div class="forecast-summary-section">
                                <div class="forecast-summary-header">
                                    <h4 class="forecast-summary-title">
                                        <i class="fas fa-chart-pie"></i>
                                        ملخص التوقعات الشهرية
                                    </h4>
                                </div>
                                
                                <div class="forecast-summary-stats">
                                    <div class="forecast-summary-stat">
                                        <div class="forecast-summary-stat-icon">
                                            <i class="fas fa-money-bill-wave"></i>
                                        </div>
                                        <div class="forecast-summary-stat-value">${this.formatCurrency(detail.totalAmount)} ر.س</div>
                                        <div class="forecast-summary-stat-label">إجمالي المبالغ</div>
                                    </div>
                                    
                                    <div class="forecast-summary-stat">
                                        <div class="forecast-summary-stat-icon">
                                            <i class="fas fa-file-invoice-dollar"></i>
                                        </div>
                                        <div class="forecast-summary-stat-value">${detail.paymentsCount || 0}</div>
                                        <div class="forecast-summary-stat-label">عدد الدفعات</div>
                                    </div>
                                    
                                    <div class="forecast-summary-stat">
                                        <div class="forecast-summary-stat-icon">
                                            <i class="fas fa-users"></i>
                                        </div>
                                        <div class="forecast-summary-stat-value">${detail.uniqueCustomers || 0}</div>
                                        <div class="forecast-summary-stat-label">عدد العملاء</div>
                                    </div>
                                    
                                    <div class="forecast-summary-stat">
                                        <div class="forecast-summary-stat-icon">
                                            <i class="fas fa-file-contract"></i>
                                        </div>
                                        <div class="forecast-summary-stat-value">${detail.uniqueContracts || 0}</div>
                                        <div class="forecast-summary-stat-label">عدد العقود</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="forecast-customers-section">
                                <div class="forecast-customers-header">
                                    <h4 class="forecast-customers-title">
                                        <i class="fas fa-user-tie"></i>
                                        تفاصيل دفعات العملاء
                                    </h4>
                                    <span class="forecast-customers-count">${detail.customerPayments ? detail.customerPayments.length : 0} دفعة</span>
                                </div>
                                
                                <div class="forecast-customers-grid">
                                    ${customersHtml}
                                </div>
                            </div>
                        </div>
                    `;
                    
                    modalBody.innerHTML = html;
                    modal.classList.add('active');
                }
            } catch (error) {
                console.error('❌ Error showing forecast detail:', error);
                this.showNotification('error', 'خطأ', 'فشل في تحميل تفاصيل التوقعات');
            }
        }
        
        async exportPayments() {
            try {
                const response = await this.apiClient.request('/api/admin/payments/export/export-data');
                if (response.success && response.data) {
                    const headers = ['رقم الدفعة', 'رقم العقد', 'العميل', 'المشروع', 'المبلغ', 'تاريخ الاستحقاق', 'تاريخ الدفع', 'طريقة الدفع', 'الحالة', 'نوع الدفعة', 'رقم الإيصال', 'رقم المرجع', 'البنك', 'المحصل', 'آخر تحديث'];
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
                    a.download = `مدفوعات_${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                    this.showNotification('success', 'تم التصدير', 'تم تصدير المدفوعات بنجاح');
                }
            } catch (error) {
                console.error('❌ Error exporting payments:', error);
                this.showNotification('error', 'خطأ', 'فشل في تصدير المدفوعات');
            }
        }
        
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
                        if (searchInput) setTimeout(() => searchInput.focus(), 100);
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
                    if (btn) setTimeout(() => btn.style.transform = '', 150);
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
            const tableBody = document.getElementById('payments-table-body');
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr class="loading-row">
                        <td colspan="12">
                            <div class="loading-content">
                                <div class="loading-spinner"></div>
                                <span>جاري تحميل المدفوعات من قاعدة البيانات...</span>
                            </div>
                        </td>
                    </tr>
                `;
            }
        }
    }
    
    function initialize() {
        try {
            window.paymentsManager = new PaymentsManager();
            console.log('✅ PaymentsManager initialized with real database connection');
        } catch (error) {
            console.error('❌ Failed to initialize PaymentsManager:', error);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();