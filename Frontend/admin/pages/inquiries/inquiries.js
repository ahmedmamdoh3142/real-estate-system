// ===== صفحة إدارة الاستفسارات - نظام إدارة العقارات =====
// معتمد بالكامل على API حقيقي (بدون بيانات ثابتة)

(function() {
    'use strict';
    
    console.log('✅ inquiries.js loaded - REAL API CONNECTION');
    
    class InquiriesManager {
        constructor() {
            this.baseURL = 'http://localhost:3001';
            this.apiClient = this.createApiClient();
            this.currentUser = null;
            this.inquiries = [];
            this.filteredInquiries = [];
            this.currentPage = 1;
            this.pageSize = 25;
            this.totalPages = 1;
            this.totalItems = 0;
            this.types = []; // أنواع الاستفسارات الديناميكية
            
            // الفلاتر (قيم افتراضية)
            this.filters = {
                search: '',
                status: ['جديد', 'تحت_المراجعة', 'تم_الرد', 'ملغي', 'متحول_لعميل'],
                type: [] // سيتم ملؤها بعد تحميل الأنواع
            };
            
            this.sortOrder = 'newest';
            this.chartInstance = null;
            this.projects = [];
            this.users = [];
            this.currentInquiryId = null;
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
            console.log('🚀 InquiriesManager initializing with real API...');
            
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setupPage());
            } else {
                this.setupPage();
            }
        }
        
        async setupPage() {
            console.log('🔧 Setting up inquiries management page with real data...');
            
            await this.checkAuth();
            await this.checkApiHealth();
            
            // تحميل البيانات المطلوبة بالتوازي
            await Promise.all([
                this.loadProjects(),
                this.loadUsers(),
                this.loadTypes()  // تحميل الأنواع أولاً
            ]);
            
            // بعد تحميل الأنواع، نضبط الفلتر ليشمل الكل
            this.filters.type = [...this.types];
            
            await this.loadInquiries();
            
            this.setupUI();
            this.updateStatistics();
            this.setupChart();
            this.setupMobileEnhancements();
            this.updateSystemTime();
            setInterval(() => this.updateSystemTime(), 60000);
        }
        
        // ---------- تحميل أنواع الاستفسارات من قاعدة البيانات ----------
        async loadTypes() {
            try {
                const response = await this.apiClient.request('/api/admin/inquiries/types');
                if (response.success) {
                    this.types = response.data || [];
                    console.log(`✅ Loaded ${this.types.length} inquiry types from DB`);
                } else {
                    throw new Error('فشل تحميل الأنواع');
                }
            } catch (error) {
                console.warn('⚠️ Could not load inquiry types from API, using defaults');
                this.types = ['استفسار_عام', 'طلب_عرض_سعر', 'طلب_زيارة', 'تفاصيل_إضافية'];
            }
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
                const response = await this.apiClient.request('/api/admin/inquiries/projects');
                if (response.success) {
                    this.projects = response.data || [];
                    console.log(`✅ Loaded ${this.projects.length} projects`);
                }
            } catch (error) {
                console.warn('⚠️ Could not load projects from API');
                this.projects = [];
            }
        }
        
        // ---------- تحميل المستخدمين (للإطلاع فقط) ----------
        async loadUsers() {
            try {
                const response = await this.apiClient.request('/api/admin/inquiries/search/users?q=');
                if (response.success) {
                    this.users = response.data || [];
                    console.log(`✅ Loaded ${this.users.length} users`);
                }
            } catch (error) {
                console.warn('⚠️ Could not load users from API');
                this.users = [];
            }
        }
        
        // ---------- تحميل الاستفسارات ----------
        async loadInquiries() {
            try {
                console.log('📥 Loading inquiries from database...');
                this.showLoading();
                this.isLoading = true;
                
                const params = new URLSearchParams({
                    page: this.currentPage,
                    limit: this.pageSize,
                    sort: this.sortOrder,
                    search: this.filters.search,
                    status: this.filters.status.join(','),
                    type: this.filters.type.join(',')
                });
                
                const response = await this.apiClient.request(`/api/admin/inquiries?${params}`);
                
                if (response.success) {
                    this.inquiries = response.data || [];
                    this.totalItems = response.pagination?.totalItems || this.inquiries.length;
                    this.totalPages = response.pagination?.totalPages || 1;
                    this.filteredInquiries = [...this.inquiries];
                    console.log(`✅ Loaded ${this.inquiries.length} inquiries`);
                    this.renderTable();
                    this.updateStatistics();
                }
            } catch (error) {
                console.error('❌ Error loading inquiries:', error);
                this.showNotification('error', 'خطأ', 'فشل تحميل الاستفسارات');
                this.inquiries = [];
                this.totalItems = 0;
                this.totalPages = 1;
                this.filteredInquiries = [];
                this.renderTable();
                this.updateStatistics();
            } finally {
                this.isLoading = false;
            }
        }
        
        // ---------- عرض الجدول ----------
        renderTable() {
            const tableBody = document.getElementById('inquiries-table-body');
            if (!tableBody) return;
            
            const startIndex = (this.currentPage - 1) * this.pageSize;
            const endIndex = Math.min(startIndex + this.pageSize, this.filteredInquiries.length);
            const pageData = this.filteredInquiries.slice(startIndex, endIndex);
            
            let html = '';
            if (pageData.length === 0) {
                html = `
                    <tr class="empty-row">
                        <td colspan="11">
                            <div class="empty-state">
                                <i class="fas fa-headset"></i>
                                <h4>لا توجد استفسارات</h4>
                                <p>لا توجد استفسارات تطابق معايير البحث</p>
                            </div>
                        </td>
                    </tr>
                `;
            } else {
                pageData.forEach(inquiry => {
                    const statusClass = this.getStatusClass(inquiry.status);
                    const typeText = this.getTypeText(inquiry.inquiryType);
                    const contactMethod = this.getContactMethodFromPreferences(inquiry.contactPreferences);
                    
                    html += `
                        <tr data-inquiry-id="${inquiry.id}">
                            <td>
                                <label class="checkbox-cell">
                                    <input type="checkbox" class="inquiry-checkbox" data-id="${inquiry.id}">
                                    <span class="checkmark"></span>
                                </label>
                            </td>
                            <td><span class="inquiry-code">${inquiry.inquiryCode || `INQ-${inquiry.id}`}</span></td>
                            <td>
                                <div class="customer-info">
                                    <div class="customer-name">${inquiry.customerName || 'غير محدد'}</div>
                                </div>
                            </td>
                            <td>
                                <div class="contact-info">
                                    <div class="contact-email"><i class="fas fa-envelope"></i> ${inquiry.customerEmail || '--'}</div>
                                    <div class="contact-phone"><i class="fas fa-phone"></i> ${inquiry.customerPhone || '--'}</div>
                                </div>
                            </td>
                            <td>
                                <span class="contact-method ${contactMethod.class}">
                                    <i class="${contactMethod.icon}"></i> ${contactMethod.text}
                                </span>
                            </td>
                            <td><span class="contact-time">${inquiry.preferredTime || '--'}</span></td>
                            <td><span class="project-name">${this.getProjectName(inquiry.projectId) || '--'}</span></td>
                            <td><span class="inquiry-type">${typeText}</span></td>
                            <td><span class="status-badge ${statusClass}">${this.getStatusText(inquiry.status)}</span></td>
                            <td><span class="inquiry-date">${this.formatDate(inquiry.createdAt)}</span></td>
                            <td>
                                <div class="action-buttons">
                                    <button class="action-btn btn-view view-inquiry" data-id="${inquiry.id}" title="عرض التفاصيل">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="action-btn btn-reply reply-inquiry" data-id="${inquiry.id}" title="الرد">
                                        <i class="fas fa-reply"></i>
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
        }
        
        getStatusClass(status) {
            const map = {
                'جديد': 'status-new',
                'تحت_المراجعة': 'status-review',
                'تم_الرد': 'status-replied',
                'ملغي': 'status-closed',
                'متحول_لعميل': 'status-converted'
            };
            return map[status] || 'status-new';
        }
        
        getStatusText(status) {
            const map = {
                'جديد': 'جديد',
                'تحت_المراجعة': 'تحت المراجعة',
                'تم_الرد': 'تم الرد',
                'ملغي': 'ملغي',
                'متحول_لعميل': 'متحول لعميل'
            };
            return map[status] || status;
        }
        
        // عرض نوع الاستفسار بشكل مقروء (مع دعم القيم الديناميكية)
        getTypeText(type) {
            const map = {
                'استفسار_عام': 'استفسار عام',
                'طلب_عرض_سعر': 'طلب عرض سعر',
                'طلب_زيارة': 'طلب زيارة',
                'تفاصيل_إضافية': 'تفاصيل إضافية'
            };
            return map[type] || this.getTypeDisplay(type);
        }
        
        // تحويل النوع الخام إلى نص مقروء (استبدال underscores بمسافات)
        getTypeDisplay(type) {
            if (!type) return '';
            return type.replace(/_/g, ' ');
        }
        
        getContactMethodFromPreferences(pref) {
            const method = pref || 'phone';
            const icons = {
                'whatsapp': { class: 'whatsapp', icon: 'fab fa-whatsapp', text: 'واتساب' },
                'email': { class: 'email', icon: 'fas fa-envelope', text: 'بريد إلكتروني' },
                'phone': { class: 'phone', icon: 'fas fa-phone', text: 'اتصال هاتفي' }
            };
            return icons[method] || icons.phone;
        }
        
        getProjectName(projectId) {
            if (!projectId) return '--';
            const project = this.projects.find(p => p.id == projectId);
            return project ? project.projectName : '--';
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
                        this.loadInquiries();
                    }
                });
            });
            
            const prevBtn = document.querySelector('.prev-btn');
            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    if (this.currentPage > 1) {
                        this.currentPage--;
                        this.loadInquiries();
                    }
                });
            }
            
            const nextBtn = document.querySelector('.next-btn');
            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    if (this.currentPage < this.totalPages) {
                        this.currentPage++;
                        this.loadInquiries();
                    }
                });
            }
        }
        
        // ---------- أحداث الجدول ----------
        attachTableEvents() {
            document.querySelectorAll('.view-inquiry').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    this.showInquiryDetail(id);
                });
            });
            
            document.querySelectorAll('.reply-inquiry').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    this.showReplyModal(id);
                });
            });
            
            document.querySelectorAll('.delete-inquiry').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    this.showDeleteConfirmModal(id);
                });
            });
            
            const selectAll = document.getElementById('select-all');
            if (selectAll) {
                selectAll.addEventListener('change', (e) => {
                    document.querySelectorAll('.inquiry-checkbox').forEach(cb => cb.checked = e.target.checked);
                });
            }
        }
        
        // ---------- عرض تفاصيل الاستفسار ----------
        async showInquiryDetail(inquiryId) {
            try {
                const response = await this.apiClient.request(`/api/admin/inquiries/${inquiryId}`);
                if (!response.success) throw new Error(response.message);
                
                const inquiry = response.data;
                const modal = document.getElementById('inquiry-detail-modal');
                const modalBody = document.getElementById('modal-inquiry-body');
                
                const statusClass = this.getStatusClass(inquiry.status);
                const typeText = this.getTypeText(inquiry.inquiryType);
                const contactMethod = this.getContactMethodFromPreferences(inquiry.contactPreferences);
                
                const respondedByName = inquiry.respondedByName ? inquiry.respondedByName : 'لم يرد بعد';
                
                let html = `
                    <div class="inquiry-detail">
                        <div class="detail-section">
                            <h4><i class="fas fa-info-circle"></i> معلومات عامة</h4>
                            <div class="detail-grid">
                                <div class="detail-item"><span class="detail-label">رقم الاستفسار:</span> <span class="detail-value">${inquiry.inquiryCode}</span></div>
                                <div class="detail-item"><span class="detail-label">نوع الاستفسار:</span> <span class="detail-value">${typeText}</span></div>
                                <div class="detail-item"><span class="detail-label">الحالة:</span> <span class="status-badge ${statusClass}">${this.getStatusText(inquiry.status)}</span></div>
                                <div class="detail-item"><span class="detail-label">معين إلى:</span> <span class="detail-value">${inquiry.assignedToName || 'غير معين'}</span></div>
                                ${inquiry.respondedByName ? `
                                <div class="detail-item"><span class="detail-label">تم الرد بواسطة:</span> <span class="detail-value">${inquiry.respondedByName}</span></div>
                                ` : ''}
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h4><i class="fas fa-user"></i> معلومات العميل</h4>
                            <div class="detail-grid">
                                <div class="detail-item"><span class="detail-label">الاسم:</span> <span class="detail-value">${inquiry.customerName}</span></div>
                                <div class="detail-item"><span class="detail-label">البريد الإلكتروني:</span> <span class="detail-value">${inquiry.customerEmail}</span></div>
                                <div class="detail-item"><span class="detail-label">الهاتف:</span> <span class="detail-value">${inquiry.customerPhone}</span></div>
                                <div class="detail-item"><span class="detail-label">طريقة التواصل:</span> <span class="contact-method ${contactMethod.class}"><i class="${contactMethod.icon}"></i> ${contactMethod.text}</span></div>
                                <div class="detail-item"><span class="detail-label">ميعاد التواصل:</span> <span class="detail-value">${inquiry.preferredTime || '--'}</span></div>
                                <div class="detail-item"><span class="detail-label">المشروع:</span> <span class="detail-value">${this.getProjectName(inquiry.projectId)}</span></div>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h4><i class="fas fa-clock"></i> التواريخ</h4>
                            <div class="detail-grid">
                                <div class="detail-item"><span class="detail-label">تاريخ الإرسال:</span> <span class="detail-value">${this.formatDate(inquiry.createdAt)}</span></div>
                                <div class="detail-item"><span class="detail-label">تاريخ الرد:</span> <span class="detail-value">${inquiry.respondedAt ? this.formatDate(inquiry.respondedAt) : '--'}</span></div>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h4><i class="fas fa-envelope"></i> محتوى الاستفسار</h4>
                            <div class="message-content">${inquiry.message || 'لا يوجد محتوى'}</div>
                        </div>
                        
                        ${inquiry.response ? `
                            <div class="detail-section">
                                <h4><i class="fas fa-reply"></i> الرد</h4>
                                <div class="message-content">${inquiry.response}</div>
                            </div>
                        ` : ''}
                    </div>
                `;
                
                modalBody.innerHTML = html;
                modal.classList.add('active');
                
                const closeButtons = modal.querySelectorAll('.modal-close, #modal-close-btn-2, [data-dismiss="modal"]');
                closeButtons.forEach(btn => {
                    btn.addEventListener('click', () => {
                        modal.classList.remove('active');
                    });
                });
                
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.classList.remove('active');
                    }
                });
                
                const replyBtn = document.getElementById('modal-reply-btn');
                replyBtn.onclick = () => {
                    modal.classList.remove('active');
                    this.showReplyModal(inquiryId);
                };
                
            } catch (error) {
                console.error('❌ Error showing inquiry detail:', error);
                this.showNotification('error', 'خطأ', 'فشل في تحميل تفاصيل الاستفسار');
            }
        }
        
        // ---------- الرد على الاستفسار ----------
        showReplyModal(inquiryId) {
            const inquiry = this.inquiries.find(i => i.id == inquiryId);
            if (!inquiry) return;
            
            const modal = document.getElementById('reply-modal');
            document.getElementById('reply-message').value = '';
            document.getElementById('reply-status').value = inquiry.status;
            modal.classList.add('active');
            
            const submitBtn = document.getElementById('reply-submit-btn');
            const handleSubmit = async () => {
                const message = document.getElementById('reply-message').value.trim();
                const status = document.getElementById('reply-status').value;
                
                if (!message) {
                    this.showNotification('error', 'خطأ', 'يرجى كتابة نص الرد');
                    return;
                }
                
                await this.submitReply(inquiryId, message, status, this.currentUser?.id);
                modal.classList.remove('active');
                submitBtn.removeEventListener('click', handleSubmit);
            };
            
            submitBtn.addEventListener('click', handleSubmit);
            
            const closeModal = () => {
                modal.classList.remove('active');
                submitBtn.removeEventListener('click', handleSubmit);
            };
            
            document.getElementById('reply-modal-close').onclick = closeModal;
            document.getElementById('reply-cancel-btn').onclick = closeModal;
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal();
                }
            });
        }
        
        async submitReply(inquiryId, message, status, respondedBy) {
            try {
                const response = await this.apiClient.request(`/api/admin/inquiries/${inquiryId}/reply`, {
                    method: 'POST',
                    body: JSON.stringify({
                        response: message,
                        status: status,
                        respondedBy: respondedBy ? parseInt(respondedBy) : null
                    })
                });
                
                if (response.success) {
                    this.showNotification('success', 'تم بنجاح', 'تم إرسال الرد بنجاح');
                    await this.loadInquiries();
                }
            } catch (error) {
                console.error('❌ Error submitting reply:', error);
                this.showNotification('error', 'خطأ', error.message || 'فشل في إرسال الرد');
            }
        }
        
        // ---------- حذف استفسار ----------
        showDeleteConfirmModal(inquiryId) {
            this.currentInquiryId = inquiryId;
            const modal = document.getElementById('delete-confirm-modal');
            modal.classList.add('active');
        }
        
        async deleteInquiry() {
            if (!this.currentInquiryId) return;
            
            try {
                const response = await this.apiClient.request(`/api/admin/inquiries/${this.currentInquiryId}`, {
                    method: 'DELETE'
                });
                
                if (response.success) {
                    this.showNotification('success', 'تم الحذف', 'تم حذف الاستفسار بنجاح');
                    document.getElementById('delete-confirm-modal').classList.remove('active');
                    this.currentInquiryId = null;
                    await this.loadInquiries();
                }
            } catch (error) {
                console.error('❌ Error deleting inquiry:', error);
                this.showNotification('error', 'خطأ', 'فشل في حذف الاستفسار');
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
            
            // تعبئة قائمة أنواع الاستفسارات ديناميكياً
            this.populateTypeFilters();
            
            // مزامنة واجهة الفلاتر مع القيم الحالية
            this.updateFiltersUI();
        }
        
        // تعبئة خيارات أنواع الاستفسارات من this.types
        populateTypeFilters() {
            const container = document.getElementById('filter-type-options');
            if (!container) return;
            
            let html = '';
            this.types.forEach(type => {
                const checked = this.filters.type.includes(type) ? 'checked' : '';
                const displayLabel = this.getTypeDisplay(type);
                html += `
                    <label class="filter-option">
                        <input type="checkbox" name="type" value="${type}" ${checked}>
                        <span class="checkmark"></span>
                        <span class="filter-label">${displayLabel}</span>
                    </label>
                `;
            });
            container.innerHTML = html;
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
                this.loadInquiries();
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
                    this.loadInquiries();
                    filterDropdown.classList.remove('active');
                    document.body.style.overflow = '';
                });
            }
            
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    this.resetFilters();
                    this.updateFiltersUI(); // لتحديث حالة الـ checkboxes
                    this.currentPage = 1;
                    this.loadInquiries();
                    filterDropdown.classList.remove('active');
                    document.body.style.overflow = '';
                });
            }
        }
        
        updateFiltersFromUI() {
            const statusCbs = document.querySelectorAll('input[name="status"]:checked');
            const typeCbs = document.querySelectorAll('input[name="type"]:checked');
            
            this.filters.status = Array.from(statusCbs).map(cb => cb.value);
            this.filters.type = Array.from(typeCbs).map(cb => cb.value);
        }
        
        resetFilters() {
            this.filters = {
                search: '',
                status: ['جديد', 'تحت_المراجعة', 'تم_الرد', 'ملغي', 'متحول_لعميل'],
                type: this.types.length ? [...this.types] : []  // كل الأنواع الموجودة
            };
            
            // تحديث الـ checkboxes بعد إعادة التعيين
            this.updateFiltersUI();
            
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
                        this.loadInquiries();
                        sortDropdown.classList.remove('show');
                    });
                });
            }
        }
        
        setupButtons() {
            const refreshBtn = document.getElementById('refresh-btn');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => {
                    this.loadInquiries();
                    this.updateStatistics();
                    this.showNotification('success', 'تم التحديث', 'تم تحديث قائمة الاستفسارات');
                });
            }
            
            const exportBtn = document.getElementById('export-btn');
            if (exportBtn) {
                exportBtn.addEventListener('click', () => this.exportInquiries());
            }
        }
        
        setupPageSize() {
            const pageSizeSelect = document.getElementById('page-size');
            if (pageSizeSelect) {
                pageSizeSelect.addEventListener('change', (e) => {
                    this.pageSize = parseInt(e.target.value);
                    this.currentPage = 1;
                    this.loadInquiries();
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
            
            const confirmDelete = document.getElementById('delete-confirm-btn');
            if (confirmDelete) confirmDelete.addEventListener('click', () => this.deleteInquiry());
            
            const cancelDelete = document.getElementById('delete-cancel-btn');
            if (cancelDelete) {
                cancelDelete.addEventListener('click', () => {
                    document.getElementById('delete-confirm-modal').classList.remove('active');
                    this.currentInquiryId = null;
                });
            }
            
            const deleteModalClose = document.getElementById('delete-modal-close');
            if (deleteModalClose) {
                deleteModalClose.addEventListener('click', () => {
                    document.getElementById('delete-confirm-modal').classList.remove('active');
                    this.currentInquiryId = null;
                });
            }
        }
        
        // ---------- تصدير الاستفسارات ----------
        async exportInquiries() {
            try {
                const response = await this.apiClient.request('/api/admin/inquiries/export/export-data');
                if (response.success && response.data) {
                    const headers = ['رقم الاستفسار', 'العميل', 'البريد', 'الهاتف', 'نوع الاستفسار', 'الحالة', 'تاريخ الإرسال', 'تاريخ الرد'];
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
                    a.download = `استفسارات_${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                    this.showNotification('success', 'تم التصدير', 'تم تصدير الاستفسارات بنجاح');
                }
            } catch (error) {
                console.error('❌ Error exporting inquiries:', error);
                this.showNotification('error', 'خطأ', 'فشل في تصدير الاستفسارات');
            }
        }
        
        // ---------- الإحصائيات والمخططات ----------
        async updateStatistics() {
            try {
                const response = await this.apiClient.request('/api/admin/inquiries/stats');
                if (response.success) {
                    const stats = response.data;
                    
                    document.getElementById('total-inquiries').textContent = stats.totalInquiries || 0;
                    document.getElementById('new-inquiries').textContent = stats.newInquiries || 0;
                    document.getElementById('pending-inquiries').textContent = stats.pendingInquiries || 0;
                    
                    document.getElementById('overview-total').textContent = stats.totalInquiries || 0;
                    document.getElementById('overview-new').textContent = stats.newInquiries || 0;
                    document.getElementById('overview-pending').textContent = stats.pendingInquiries || 0;
                    document.getElementById('overview-resolved').textContent = stats.resolvedInquiries || 0;
                    
                    this.updateChartData(stats);
                    this.updateRecentInquiries();
                }
            } catch (error) {
                console.warn('⚠️ Could not load stats from API');
            }
        }
        
        setupChart() {
            const canvas = document.getElementById('inquiries-chart');
            if (!canvas) return;
            
            if (this.chartInstance) this.chartInstance.destroy();
            
            const ctx = canvas.getContext('2d');
            
            const darkColors = ['#121212', '#1E1E1E', '#2C2C2C', '#3A3A3A', '#4A4A4A'];
            const borderColors = ['#000000', '#1A1A1A', '#282828', '#363636', '#464646'];
            const hoverColors = ['#1A1A1A', '#282828', '#363636', '#464646', '#565656'];
            
            this.chartInstance = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['جديد', 'تحت المراجعة', 'تم الرد', 'ملغي', 'متحول لعميل'],
                    datasets: [{
                        data: [0, 0, 0, 0, 0],
                        backgroundColor: darkColors,
                        borderColor: borderColors,
                        borderWidth: 2,
                        hoverBackgroundColor: hoverColors,
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
                                font: { family: 'Tajawal', size: 12, weight: '500' },
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
                                label: (context) => {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                    return `${label}: ${value} (${percentage}%)`;
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
            
            this.chartInstance.data.datasets[0].data = [
                stats.newInquiries || 0,
                stats.pendingInquiries || 0,
                stats.resolvedInquiries || 0,
                stats.closedInquiries || 0,
                stats.convertedInquiries || 0
            ];
            this.chartInstance.update();
        }
        
        async updateRecentInquiries() {
            const container = document.getElementById('recent-inquiries');
            if (!container) return;
            
            try {
                const response = await this.apiClient.request('/api/admin/inquiries/recent?limit=3');
                if (response.success) {
                    const inquiries = response.data;
                    let html = '';
                    if (inquiries.length === 0) {
                        html = '<div class="empty-state"><i class="fas fa-inbox"></i><p>لا توجد استفسارات حديثة</p></div>';
                    } else {
                        inquiries.forEach(inq => {
                            const timeAgo = this.getTimeAgo(inq.createdAt);
                            const statusClass = this.getStatusClass(inq.status).replace('status-', '');
                            html += `
                                <div class="recent-item">
                                    <div class="recent-item-icon"><i class="fas fa-user-circle"></i></div>
                                    <div class="recent-item-content">
                                        <div class="recent-item-header">
                                            <h5 class="recent-item-title">${inq.customerName}</h5>
                                            <span class="recent-item-time">${timeAgo}</span>
                                        </div>
                                        <p class="recent-item-message">${inq.message.substring(0, 50)}...</p>
                                        <span class="recent-item-status ${statusClass}">${this.getStatusText(inq.status)}</span>
                                    </div>
                                </div>
                            `;
                        });
                    }
                    container.innerHTML = html;
                }
            } catch (error) {
                console.warn('⚠️ Could not load recent inquiries');
                container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>تعذر تحميل الاستفسارات الحديثة</p></div>';
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
            const tableBody = document.getElementById('inquiries-table-body');
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr class="loading-row">
                        <td colspan="11">
                            <div class="loading-content">
                                <div class="loading-spinner"></div>
                                <span>جاري تحميل الاستفسارات من قاعدة البيانات...</span>
                            </div>
                        </td>
                    </tr>
                `;
            }
        }
    }
    
    function initialize() {
        try {
            window.inquiriesManager = new InquiriesManager();
            console.log('✅ InquiriesManager initialized with real API connection');
        } catch (error) {
            console.error('❌ Failed to initialize InquiriesManager:', error);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();