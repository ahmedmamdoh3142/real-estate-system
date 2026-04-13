// ===== صفحة إدارة التوظيف - نظام إدارة العقارات =====
// الإصدار: متصل بقاعدة البيانات عبر API (جدول job_applications + jobs)
// تم التعديل: إضافة وظيفة جديدة عبر API مع فتح كونتينر الإضافة

(function() {
    'use strict';
    
    console.log('✅ job-management.js loaded - REAL DATABASE CONNECTION (msnodesqlv8)');
    
    class JobApplicationsManager {
        constructor() {
            this.baseURL = '';
            this.apiClient = this.createApiClient();
            this.currentUser = null;
            this.applications = [];
            this.filteredApplications = [];
            this.currentPage = 1;
            this.pageSize = 25;
            this.totalPages = 1;
            this.totalItems = 0;
            
            // تخزين كل القيم الممكنة لكل فلتر (لإعادة التعيين)
            this.allFilterValues = {
                status: [],
                department: [],
                job_type: [],
                experience: [],
                education: [],
                nationality: [],
                city: [],
                gender: [],
                residence: [],
                region: [],
                marital: [],
                disability: [],
                employment_status: [],
                transferable: [],
                notice_period: [],
                previous_contact: [],
                date: ['اليوم', 'أخر 7 أيام', 'أخر 30 يوم', 'أقدم من 30 يوم']
            };
            
            // الفلاتر الحالية (المحددة)
            this.filters = {
                status: [],
                department: [],
                job_type: [],
                experience: [],
                education: [],
                nationality: [],
                city: [],
                gender: [],
                residence: [],
                region: [],
                marital: [],
                disability: [],
                employment_status: [],
                transferable: [],
                notice_period: [],
                previous_contact: [],
                date: []
            };
            
            this.sortOrder = 'newest';
            this.chartInstance = null;
            this.currentApplicationId = null;
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
            console.log('🚀 JobApplicationsManager initializing with real database...');
            
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setupPage());
            } else {
                this.setupPage();
            }
        }
        
        async setupPage() {
            console.log('🔧 Setting up jobs management page with real data...');
            
            await this.checkAuth();
            await this.checkApiHealth();
            await this.loadApplications();
            
            this.setupUI();
            this.updateStatistics();
            this.setupChart();
            this.setupMobileEnhancements();
            this.updateSystemTime();
            setInterval(() => this.updateSystemTime(), 60000);
            
            // إعداد مودال إضافة وظيفة جديدة
            this.setupAddJobModal();
        }
        
        // ---------- إعداد مودال إضافة وظيفة جديدة ----------
        setupAddJobModal() {
            const addJobBtn = document.getElementById('add-job-btn');
            const addJobModal = document.getElementById('add-job-modal');
            const closeModalBtn = document.getElementById('add-job-modal-close');
            const cancelBtn = document.getElementById('add-job-cancel-btn');
            const saveBtn = document.getElementById('add-job-save-btn');
            
            if (!addJobModal) {
                console.error('❌ add-job-modal not found');
                return;
            }
            
            // فتح المودال عند الضغط على زر وظيفة جديدة
            if (addJobBtn) {
                addJobBtn.addEventListener('click', () => {
                    this.resetAddJobForm();
                    addJobModal.classList.add('active');
                });
            }
            
            // إغلاق المودال
            const closeModal = () => {
                addJobModal.classList.remove('active');
                this.resetAddJobForm();
            };
            
            if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
            if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
            
            // حفظ الوظيفة
            if (saveBtn) {
                saveBtn.addEventListener('click', () => this.createNewJob());
            }
            
            // إغلاق عند الضغط خارج المودال
            window.addEventListener('click', (e) => {
                if (e.target === addJobModal) {
                    closeModal();
                }
            });
        }
        
        resetAddJobForm() {
            const form = document.getElementById('add-job-form');
            if (form) form.reset();
            document.getElementById('job-active').checked = true;
        }
        
        async createNewJob() {
            try {
                // جمع البيانات من النموذج
                const title = document.getElementById('job-title')?.value.trim();
                const department = document.getElementById('job-department')?.value;
                const location = document.getElementById('job-location')?.value.trim();
                const job_type = document.getElementById('job-type')?.value;
                const badge = document.getElementById('job-badge')?.value.trim() || null;
                const company_sector = document.getElementById('job-sector')?.value.trim() || null;
                const experience_years = document.getElementById('job-experience')?.value || null;
                const description = document.getElementById('job-description')?.value.trim();
                const tags = document.getElementById('job-tags')?.value.trim() || null;
                const is_active = document.getElementById('job-active')?.checked ? 1 : 0;
                
                // التحقق من الحقول المطلوبة
                if (!title) {
                    this.showNotification('error', 'خطأ', 'يرجى إدخال عنوان الوظيفة');
                    return;
                }
                if (!department) {
                    this.showNotification('error', 'خطأ', 'يرجى اختيار القسم');
                    return;
                }
                if (!location) {
                    this.showNotification('error', 'خطأ', 'يرجى إدخال الموقع');
                    return;
                }
                if (!job_type) {
                    this.showNotification('error', 'خطأ', 'يرجى اختيار نوع الوظيفة');
                    return;
                }
                if (!description) {
                    this.showNotification('error', 'خطأ', 'يرجى إدخال وصف الوظيفة');
                    return;
                }
                
                const jobData = {
                    title,
                    department,
                    location,
                    job_type,
                    badge,
                    company_sector,
                    experience_years,
                    description,
                    tags,
                    is_active
                };
                
                console.log('📤 Creating new job:', jobData);
                
                const response = await this.apiClient.request('/api/admin/jobs/create', {
                    method: 'POST',
                    body: JSON.stringify(jobData)
                });
                
                if (response.success) {
                    this.showNotification('success', 'تم بنجاح', 'تم إضافة الوظيفة الجديدة');
                    document.getElementById('add-job-modal').classList.remove('active');
                    this.resetAddJobForm();
                    // اختياري: تحديث قائمة الوظائف المعروضة (إذا كانت موجودة)
                } else {
                    throw new Error(response.message || 'فشل إضافة الوظيفة');
                }
                
            } catch (error) {
                console.error('❌ Error creating job:', error);
                this.showNotification('error', 'خطأ', error.message || 'فشل إضافة الوظيفة');
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
                        role: 'مدير_التوظيف'
                    };
                }
                this.updateUserInfo();
            } catch (error) {
                console.warn('⚠️ No user in localStorage, using test user');
                this.currentUser = {
                    id: 1,
                    fullName: 'أحمد محمد',
                    role: 'مدير_التوظيف'
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
                    'مدير_التوظيف': 'مدير التوظيف',
                    'مشرف_عام': 'مشرف عام',
                    'موظف_موارد_بشرية': 'موظف موارد بشرية'
                };
                userRoleElement.textContent = roleMap[this.currentUser.role] || this.currentUser.role;
            }
        }
        
        // ---------- تحميل الطلبات من API ----------
        async loadApplications() {
            try {
                console.log('📥 Loading applications from database...');
                this.showLoading();
                this.isLoading = true;
                
                // بناء معاملات URL مع الفلاتر الحالية
                const params = new URLSearchParams({
                    page: this.currentPage,
                    limit: this.pageSize,
                    sort: this.sortOrder
                });
                
                if (this.filters.search) params.append('search', this.filters.search);
                if (this.filters.status.length > 0) params.append('status', this.filters.status.join(','));
                if (this.filters.department.length > 0) params.append('department', this.filters.department.join(','));
                if (this.filters.job_type.length > 0) params.append('job_type', this.filters.job_type.join(','));
                if (this.filters.experience.length > 0) params.append('experience', this.filters.experience.join(','));
                if (this.filters.education.length > 0) params.append('education', this.filters.education.join(','));
                if (this.filters.nationality.length > 0) params.append('nationality', this.filters.nationality.join(','));
                if (this.filters.city.length > 0) params.append('city', this.filters.city.join(','));
                if (this.filters.gender.length > 0) params.append('gender', this.filters.gender.join(','));
                if (this.filters.residence.length > 0) params.append('residence', this.filters.residence.join(','));
                if (this.filters.region.length > 0) params.append('region', this.filters.region.join(','));
                if (this.filters.marital.length > 0) params.append('marital', this.filters.marital.join(','));
                if (this.filters.disability.length > 0) params.append('disability', this.filters.disability.join(','));
                if (this.filters.employment_status.length > 0) params.append('employment_status', this.filters.employment_status.join(','));
                if (this.filters.transferable.length > 0) params.append('transferable', this.filters.transferable.join(','));
                if (this.filters.notice_period.length > 0) params.append('notice_period', this.filters.notice_period.join(','));
                if (this.filters.previous_contact.length > 0) params.append('previous_contact', this.filters.previous_contact.join(','));
                if (this.filters.date.length > 0) params.append('date', this.filters.date.join(','));
                
                const response = await this.apiClient.request(`/api/admin/jobs?${params}`);
                
                if (response.success) {
                    // التأكد من أن البيانات هي مصفوفة
                    const rawData = Array.isArray(response.data) ? response.data : [];
                    console.log(`📊 Received ${rawData.length} raw applications from API`);
                    
                    // تحويل البيانات إلى الصيغة التي تتوقعها الواجهة
                    this.applications = rawData.map(app => this.mapApplicationFromDB(app));
                    this.totalItems = response.pagination?.totalItems || this.applications.length;
                    this.totalPages = response.pagination?.totalPages || 1;
                    
                    // تعيين filteredApplications للمصفوفة المحولة
                    this.filteredApplications = [...this.applications];
                    
                    console.log(`✅ Processed ${this.applications.length} applications, total items: ${this.totalItems}`);
                    
                    // تحديث قيم الفلاتر بالقيم الفعلية الموجودة في البيانات
                    this.updateAllFilterValuesFromData();
                    
                    // تحديث الجدول
                    this.renderTable();
                } else {
                    throw new Error(response.message || 'فشل تحميل البيانات');
                }
            } catch (error) {
                console.error('❌ Error loading applications:', error);
                this.showNotification('error', 'خطأ', 'فشل تحميل طلبات التوظيف');
                this.renderError();
            } finally {
                this.isLoading = false;
            }
        }
        
        // تحويل كائن من قاعدة البيانات إلى كائن متوافق مع الواجهة
        mapApplicationFromDB(dbApp) {
            if (!dbApp) return null;
            
            return {
                id: dbApp.id || 0,
                applicationCode: dbApp.id ? `APP-${dbApp.id.toString().padStart(6, '0')}` : 'APP-000000',
                candidateName: `${dbApp.first_name || ''} ${dbApp.last_name || ''}`.trim() || 'غير محدد',
                candidateEmail: dbApp.email || '',
                candidatePhone: dbApp.phone ? (dbApp.country_code ? dbApp.country_code + dbApp.phone : dbApp.phone) : '',
                department: dbApp.expertise || 'غير محدد',
                position: dbApp.current_position || 'غير محدد',
                experience: dbApp.experience_years || 'خريج جديد',
                education: dbApp.education || 'غير محدد',
                expectedSalary: dbApp.expected_salary || 0,
                nationality: dbApp.nationality || 'غير محدد',
                city: dbApp.city || 'غير محدد',
                status: dbApp.status || 'جديد',
                appliedDate: dbApp.created_at,
                cvUrl: dbApp.cv_path || '',
                profileImage: dbApp.profile_image_path || '',
                notes: dbApp.cover_letter || '',
                interviewDate: null,
                gender: dbApp.gender || 'ذكر',
                residence: dbApp.current_residence || 'داخل السعودية',
                region: dbApp.region || '',
                maritalStatus: dbApp.marital_status || 'أعزب',
                disability: dbApp.disability === 'نعم' ? 'نعم' : 'لا',
                employmentStatus: dbApp.employment_status || 'موظف',
                transferableResidence: dbApp.transferable_residence === 'نعم' ? 'نعم' : 'لا',
                noticePeriod: dbApp.notice_period || 'فوري',
                previousContact: dbApp.previous_contact === 'نعم' ? 'نعم' : 'لا',
                dependents: dbApp.dependents || 0,
                birthDate: dbApp.birth_date,
                currentSalary: dbApp.current_salary,
                specialization: dbApp.specialization,
                job_type: dbApp.job_type || 'دوام كامل'
            };
        }
        
        // تحديث القيم الممكنة لكل فلتر بناءً على البيانات الفعلية
        updateAllFilterValuesFromData() {
            // استخراج القيم الفريدة من البيانات
            this.allFilterValues.status = [...new Set(this.applications.map(a => a.status).filter(s => s))];
            this.allFilterValues.department = [...new Set(this.applications.map(a => a.department).filter(d => d && d !== 'غير محدد'))];
            this.allFilterValues.job_type = [...new Set(this.applications.map(a => a.job_type).filter(j => j))];
            this.allFilterValues.experience = [...new Set(this.applications.map(a => a.experience).filter(e => e))];
            this.allFilterValues.education = [...new Set(this.applications.map(a => a.education).filter(e => e && e !== 'غير محدد'))];
            this.allFilterValues.nationality = [...new Set(this.applications.map(a => a.nationality).filter(n => n && n !== 'غير محدد'))];
            this.allFilterValues.city = [...new Set(this.applications.map(a => a.city).filter(c => c && c !== 'غير محدد'))];
            this.allFilterValues.region = [...new Set(this.applications.map(a => a.region).filter(r => r))];
            this.allFilterValues.gender = [...new Set(this.applications.map(a => a.gender).filter(g => g))];
            this.allFilterValues.residence = [...new Set(this.applications.map(a => a.residence).filter(r => r))];
            this.allFilterValues.marital = [...new Set(this.applications.map(a => a.maritalStatus).filter(m => m))];
            this.allFilterValues.disability = [...new Set(this.applications.map(a => a.disability).filter(d => d))];
            this.allFilterValues.employment_status = [...new Set(this.applications.map(a => a.employmentStatus).filter(e => e))];
            this.allFilterValues.transferable = [...new Set(this.applications.map(a => a.transferableResidence).filter(t => t))];
            this.allFilterValues.notice_period = [...new Set(this.applications.map(a => a.noticePeriod).filter(n => n))];
            this.allFilterValues.previous_contact = [...new Set(this.applications.map(a => a.previousContact).filter(p => p))];
            
            // تحديث قوائم الفلاتر في DOM بالخيارات الجديدة
            this.populateFilterOptions();
            
            // تعيين الفلاتر الافتراضية إلى كل القيم (بحيث تظهر جميع الطلبات)
            this.resetFilters();
        }
        
        // إعادة بناء خيارات الفلاتر في HTML
        populateFilterOptions() {
            const filterMappings = [
                { name: 'status', container: 'status' },
                { name: 'department', container: 'department' },
                { name: 'job_type', container: 'job_type' },
                { name: 'experience', container: 'experience' },
                { name: 'education', container: 'education' },
                { name: 'nationality', container: 'nationality' },
                { name: 'city', container: 'city' },
                { name: 'gender', container: 'gender' },
                { name: 'residence', container: 'residence' },
                { name: 'region', container: 'region' },
                { name: 'marital', container: 'marital' },
                { name: 'disability', container: 'disability' },
                { name: 'employment_status', container: 'employment_status' },
                { name: 'transferable', container: 'transferable' },
                { name: 'notice_period', container: 'notice_period' },
                { name: 'previous_contact', container: 'previous_contact' },
                { name: 'date', container: 'date' }
            ];
            
            filterMappings.forEach(mapping => {
                const filterDiv = document.querySelector(`.filter-item[data-filter="${mapping.container}"] .filter-options`);
                if (!filterDiv) return;
                
                const values = this.allFilterValues[mapping.name];
                if (!values || values.length === 0) return;
                
                // إنشاء خيارات HTML جديدة
                let html = '';
                values.forEach(value => {
                    // حساب العدد (اختياري)
                    const count = this.applications.filter(a => {
                        if (mapping.name === 'status') return a.status === value;
                        if (mapping.name === 'department') return a.department === value;
                        if (mapping.name === 'job_type') return a.job_type === value;
                        if (mapping.name === 'experience') return a.experience === value;
                        if (mapping.name === 'education') return a.education === value;
                        if (mapping.name === 'nationality') return a.nationality === value;
                        if (mapping.name === 'city') return a.city === value;
                        if (mapping.name === 'gender') return a.gender === value;
                        if (mapping.name === 'residence') return a.residence === value;
                        if (mapping.name === 'region') return a.region === value;
                        if (mapping.name === 'marital') return a.maritalStatus === value;
                        if (mapping.name === 'disability') return a.disability === value;
                        if (mapping.name === 'employment_status') return a.employmentStatus === value;
                        if (mapping.name === 'transferable') return a.transferableResidence === value;
                        if (mapping.name === 'notice_period') return a.noticePeriod === value;
                        if (mapping.name === 'previous_contact') return a.previousContact === value;
                        return false;
                    }).length;
                    
                    html += `
                        <label class="filter-option">
                            <input type="checkbox" name="${mapping.name}" value="${value}" checked>
                            <span class="checkmark"></span>
                            <span class="filter-label">${value}</span>
                            <span class="filter-count">${count}</span>
                        </label>
                    `;
                });
                
                filterDiv.innerHTML = html;
            });
        }
        
        // عرض خطأ في الجدول
        renderError() {
            const tableBody = document.getElementById('applications-table-body');
            if (!tableBody) return;
            
            tableBody.innerHTML = `
                <tr class="error-row">
                    <td colspan="12">
                        <div class="empty-state error">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h4>حدث خطأ أثناء التحميل</h4>
                            <p>يرجى المحاولة مرة أخرى أو الاتصال بالدعم الفني</p>
                            <button class="btn btn-primary" id="retry-load-btn">
                                <i class="fas fa-sync-alt"></i> إعادة المحاولة
                            </button>
                        </div>
                    </tr>
            `;
            
            const retryBtn = document.getElementById('retry-load-btn');
            if (retryBtn) retryBtn.addEventListener('click', () => this.loadApplications());
        }
        
        // ---------- عرض الجدول ----------
        renderTable() {
            const tableBody = document.getElementById('applications-table-body');
            if (!tableBody) {
                console.error('❌ Table body not found');
                return;
            }
            
            // التأكد من أن filteredApplications مصفوفة
            if (!Array.isArray(this.filteredApplications)) {
                console.error('❌ filteredApplications is not an array');
                this.filteredApplications = [];
            }
            
            console.log(`📋 Rendering table with ${this.filteredApplications.length} filtered applications`);
            
            const startIndex = (this.currentPage - 1) * this.pageSize;
            const endIndex = Math.min(startIndex + this.pageSize, this.filteredApplications.length);
            const pageData = this.filteredApplications.slice(startIndex, endIndex);
            
            console.log(`📄 Page ${this.currentPage}: showing ${pageData.length} items (start ${startIndex}, end ${endIndex})`);
            
            let html = '';
            
            if (pageData.length === 0) {
                html = `
                    <tr class="empty-row">
                        <td colspan="12">
                            <div class="empty-state">
                                <i class="fas fa-file-alt"></i>
                                <h4>لا توجد طلبات</h4>
                                <p>لا توجد طلبات توظيف تطابق معايير البحث</p>
                                ${this.isLoading ? '' : ''}
                            </div>
                        </td>
                    </tr>
                `;
            } else {
                pageData.forEach((application) => {
                    // التأكد من أن الكائن موجود
                    if (!application) return;
                    
                    const statusClass = this.getStatusClass(application.status);
                    const dateFormatted = this.formatDate(application.appliedDate);
                    const salaryFormatted = this.formatCurrency(application.expectedSalary);
                    
                    html += `
                        <tr data-application-id="${application.id}">
                            <td>
                                <label class="checkbox-cell">
                                    <input type="checkbox" class="application-checkbox" data-id="${application.id}">
                                    <span class="checkmark"></span>
                                </label>
                            </td>
                            <td>
                                <span class="application-code">${application.applicationCode}</span>
                            </td>
                            <td>
                                <div class="candidate-info">
                                    <div class="candidate-avatar">
                                        ${application.profileImage ? 
                                            `<img src="${application.profileImage}" alt="${application.candidateName}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">` : 
                                            `<i class="fas fa-user"></i>`
                                        }
                                    </div>
                                    <div class="candidate-details">
                                        <div class="candidate-name">${this.escapeHtml(application.candidateName)}</div>
                                        <div class="candidate-email">${this.escapeHtml(application.candidateEmail)}</div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <span class="department">${this.escapeHtml(application.department)}</span>
                            </td>
                            <td>
                                <div class="position">${this.escapeHtml(application.position)}</div>
                            </td>
                            <td>
                                <span class="experience">${this.escapeHtml(application.experience)}</span>
                            </td>
                            <td>
                                <span class="education">${this.escapeHtml(application.education)}</span>
                            </td>
                            <td>
                                <span class="salary">${salaryFormatted}</span>
                            </td>
                            <td>
                                <span class="nationality">${this.escapeHtml(application.nationality)}</span>
                            </td>
                            <td>
                                <span class="status-badge ${statusClass}">${this.escapeHtml(application.status)}</span>
                            </td>
                            <td>
                                <span class="application-date">${dateFormatted}</span>
                            </td>
                            <td>
                                <div class="action-buttons">
                                    <button class="action-btn btn-view view-application" data-id="${application.id}" title="عرض التفاصيل">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="action-btn btn-edit edit-application" data-id="${application.id}" title="تعديل الحالة">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="action-btn btn-cv view-cv" data-id="${application.id}" title="عرض السيرة الذاتية" ${!application.cvUrl ? 'disabled' : ''}>
                                        <i class="fas fa-file-pdf"></i>
                                    </button>
                                    <button class="action-btn btn-delete delete-application" data-id="${application.id}" title="حذف">
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
        }
        
        // دالة مساعدة لترميز النصوص لتجنب XSS
        escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        getStatusClass(status) {
            const statusMap = {
                'جديد': 'status-new',
                'قيد المراجعة': 'status-review',
                'للمقابلة': 'status-interview',
                'مقابلة مجدولة': 'status-scheduled',
                'مقبولة': 'status-accepted',
                'مرفوضة': 'status-rejected',
                'مؤرشفة': 'status-archived'
            };
            return statusMap[status] || 'status-new';
        }
        
        formatCurrency(amount) {
            if (!amount && amount !== 0) return '--';
            const formatter = new Intl.NumberFormat('ar-SA');
            return `${formatter.format(amount)} ر.س`;
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
                        this.loadApplications();
                    }
                });
            });
            
            const prevBtn = document.querySelector('.prev-btn');
            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    if (this.currentPage > 1) {
                        this.currentPage--;
                        this.loadApplications();
                    }
                });
            }
            
            const nextBtn = document.querySelector('.next-btn');
            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    if (this.currentPage < this.totalPages) {
                        this.currentPage++;
                        this.loadApplications();
                    }
                });
            }
        }
        
        // ---------- أحداث الجدول ----------
        attachTableEvents() {
            document.querySelectorAll('.view-application').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    this.showApplicationDetail(id);
                });
            });
            
            document.querySelectorAll('.edit-application').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    this.showEditStatusModal(id);
                });
            });
            
            document.querySelectorAll('.delete-application').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    this.showDeleteConfirmModal(id);
                });
            });
            
            document.querySelectorAll('.view-cv').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    this.showCV(id);
                });
            });
            
            const selectAll = document.getElementById('select-all');
            if (selectAll) {
                selectAll.addEventListener('change', (e) => {
                    document.querySelectorAll('.application-checkbox').forEach(cb => cb.checked = e.target.checked);
                });
            }
        }
        
        // ---------- عرض تفاصيل الطلب ----------
        async showApplicationDetail(applicationId) {
            try {
                const response = await this.apiClient.request(`/api/admin/jobs/${applicationId}`);
                if (!response.success) throw new Error(response.message);
                
                const application = this.mapApplicationFromDB(response.data);
                
                const modal = document.getElementById('application-detail-modal');
                if (!modal) return;
                const modalBody = document.getElementById('modal-application-body');
                const editBtn = document.getElementById('modal-edit-btn');
                const downloadBtn = document.getElementById('modal-download-cv-btn');
                
                editBtn.dataset.applicationId = applicationId;
                downloadBtn.dataset.applicationId = applicationId;
                
                const statusClass = this.getStatusClass(application.status);
                const appliedDate = this.formatDate(application.appliedDate);
                const interviewDate = application.interviewDate ? this.formatDateTime(application.interviewDate) : '--';
                const salaryFormatted = this.formatCurrency(application.expectedSalary);
                const currentSalaryFormatted = this.formatCurrency(application.currentSalary);
                
                const html = `
                    <div class="application-detail">
                        <div class="detail-header">
                            <div class="candidate-profile-image">
                                ${application.profileImage ? 
                                    `<img src="${application.profileImage}" alt="${application.candidateName}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIxNTAiIHJ4PSIyMCIgZmlsbD0iIzJCMkIyQiIvPjxwYXRoIGQ9Ik03NSA0MEM5MC40NjQgNDAgMTAzIDUyLjUzNiAxMDMgNjhDMTAzIDgzLjQ2NCA5MC40NjQgOTYgNzUgOTZDNjAuNTM2IDk2IDQ4IDgzLjQ2NCA0OCA2OEM0OCA1Mi41MzYgNjAuNTM2IDQwIDc1IDQwWiIgZmlsbD0iI0NCQ0NDQyIvPjxwYXRoIGQ9Ik01MCAxMTBWMTAwQzUwIDg1LjUzNiA2MS41MzYgNzQgNzYgNzRINzRDNjg0IDc0IDEwMCA4NS41MzYgMTAwIDEwMFYxMTAiIGZpbGw9IiNDQkNDQ0MiLz48L3N2Zz4='>">` : 
                                    `<div class="candidate-profile-default"><i class="fas fa-user"></i></div>`
                                }
                            </div>
                            <div class="candidate-basic-info">
                                <h4>${this.escapeHtml(application.candidateName)}</h4>
                                <div class="status-badge ${statusClass}">${this.escapeHtml(application.status)}</div>
                                
                                <div class="candidate-contact">
                                    <div class="contact-item">
                                        <i class="fas fa-envelope"></i>
                                        <span>${this.escapeHtml(application.candidateEmail)}</span>
                                    </div>
                                    <div class="contact-item">
                                        <i class="fas fa-phone"></i>
                                        <span>${this.escapeHtml(application.candidatePhone)}</span>
                                    </div>
                                    <div class="contact-item">
                                        <i class="fas fa-map-marker-alt"></i>
                                        <span>${this.escapeHtml(application.city)} - ${this.escapeHtml(application.nationality)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h4><i class="fas fa-info-circle"></i> المعلومات الأساسية</h4>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <span class="detail-label">رقم الطلب:</span>
                                    <span class="detail-value">${this.escapeHtml(application.applicationCode)}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">الجنس:</span>
                                    <span class="detail-value">${this.escapeHtml(application.gender)}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">تاريخ الميلاد:</span>
                                    <span class="detail-value">${application.birthDate ? this.formatDate(application.birthDate) : '--'}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">الحالة الاجتماعية:</span>
                                    <span class="detail-value">${this.escapeHtml(application.maritalStatus)}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">عدد المعالين:</span>
                                    <span class="detail-value">${application.dependents || 0}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">ذوي إعاقة:</span>
                                    <span class="detail-value">${this.escapeHtml(application.disability)}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">مكان الإقامة:</span>
                                    <span class="detail-value">${this.escapeHtml(application.residence)}</span>
                                </div>
                                ${application.region ? `
                                <div class="detail-item">
                                    <span class="detail-label">المنطقة:</span>
                                    <span class="detail-value">${this.escapeHtml(application.region)}</span>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h4><i class="fas fa-briefcase"></i> المعلومات الوظيفية</h4>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <span class="detail-label">القسم:</span>
                                    <span class="detail-value">${this.escapeHtml(application.department)}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">الوظيفة المطلوبة:</span>
                                    <span class="detail-value">${this.escapeHtml(application.position)}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">الخبرة:</span>
                                    <span class="detail-value">${this.escapeHtml(application.experience)}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">المؤهل العلمي:</span>
                                    <span class="detail-value">${this.escapeHtml(application.education)}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">التخصص:</span>
                                    <span class="detail-value">${this.escapeHtml(application.specialization || '--')}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">الراتب المتوقع:</span>
                                    <span class="detail-value salary">${salaryFormatted}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">الراتب الحالي:</span>
                                    <span class="detail-value">${currentSalaryFormatted}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">حالة التوظيف الحالية:</span>
                                    <span class="detail-value">${this.escapeHtml(application.employmentStatus)}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">الإقامة قابلة للتحويل:</span>
                                    <span class="detail-value">${this.escapeHtml(application.transferableResidence)}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">فترة الإشعار:</span>
                                    <span class="detail-value">${this.escapeHtml(application.noticePeriod)}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">سبق التواصل:</span>
                                    <span class="detail-value">${this.escapeHtml(application.previousContact)}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">نوع الوظيفة:</span>
                                    <span class="detail-value">${this.escapeHtml(application.job_type || 'دوام كامل')}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h4><i class="fas fa-calendar-alt"></i> حالة الطلب</h4>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <span class="detail-label">تاريخ التقديم:</span>
                                    <span class="detail-value">${appliedDate}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">تاريخ المقابلة:</span>
                                    <span class="detail-value">${interviewDate}</span>
                                </div>
                            </div>
                        </div>
                        
                        ${application.notes ? `
                        <div class="detail-section">
                            <h4><i class="fas fa-sticky-note"></i> الرسالة / الملاحظات</h4>
                            <div class="notes-content">
                                ${this.escapeHtml(application.notes)}
                            </div>
                        </div>
                        ` : ''}
                        
                        <div class="detail-section">
                            <h4><i class="fas fa-paperclip"></i> الملفات المرفقة</h4>
                            <div class="files-grid">
                                ${application.cvUrl ? `
                                <div class="file-item">
                                    <div class="file-icon">
                                        <i class="fas fa-file-pdf"></i>
                                    </div>
                                    <div class="file-info">
                                        <div class="file-name">السيرة الذاتية</div>
                                        <div class="file-size">PDF</div>
                                    </div>
                                    <a href="${application.cvUrl}" target="_blank" class="file-download">
                                        <i class="fas fa-download"></i>
                                    </a>
                                </div>
                                ` : ''}
                                
                                ${application.profileImage ? `
                                <div class="file-item">
                                    <div class="file-icon">
                                        <i class="fas fa-image"></i>
                                    </div>
                                    <div class="file-info">
                                        <div class="file-name">الصورة الشخصية</div>
                                        <div class="file-size">JPG</div>
                                    </div>
                                    <a href="${application.profileImage}" target="_blank" class="file-download">
                                        <i class="fas fa-download"></i>
                                    </a>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `;
                
                modalBody.innerHTML = html;
                modal.classList.add('active');
                
                editBtn.onclick = () => {
                    modal.classList.remove('active');
                    this.showEditStatusModal(applicationId);
                };
                
                downloadBtn.onclick = () => {
                    if (application.cvUrl) {
                        this.downloadCV(application.cvUrl, application.candidateName);
                    } else {
                        this.showNotification('warning', 'تنبيه', 'لا توجد سيرة ذاتية لهذا المرشح');
                    }
                };
                
            } catch (error) {
                console.error('❌ Error showing application detail:', error);
                this.showNotification('error', 'خطأ', 'فشل في تحميل تفاصيل الطلب');
            }
        }
        
        formatDateTime(dateTimeString) {
            if (!dateTimeString) return '--';
            try {
                const date = new Date(dateTimeString);
                return date.toLocaleDateString('ar-SA', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric'
                });
            } catch {
                return dateTimeString;
            }
        }
        
        // ---------- تعديل حالة الطلب ----------
        showEditStatusModal(applicationId) {
            try {
                const application = this.applications.find(a => a.id == applicationId);
                if (!application) {
                    throw new Error('Application not found');
                }
                
                const modal = document.getElementById('application-status-modal');
                const statusSelect = document.getElementById('status-select');
                const statusNotes = document.getElementById('status-notes');
                const interviewDateGroup = document.getElementById('interview-date-group');
                const interviewDateInput = document.getElementById('interview-date');
                
                statusSelect.value = application.status;
                statusNotes.value = application.notes || '';
                
                if (application.status === 'مقابلة مجدولة') {
                    interviewDateGroup.style.display = 'block';
                    if (application.interviewDate) {
                        const date = new Date(application.interviewDate);
                        interviewDateInput.value = date.toISOString().slice(0, 16);
                    } else {
                        interviewDateInput.value = '';
                    }
                } else {
                    interviewDateGroup.style.display = 'none';
                }
                
                this.currentApplicationId = applicationId;
                modal.classList.add('active');
                
            } catch (error) {
                console.error('❌ Error showing edit modal:', error);
                this.showNotification('error', 'خطأ', 'فشل في تحميل بيانات الطلب للتعديل');
            }
        }
        
        async updateApplicationStatus() {
            try {
                const statusSelect = document.getElementById('status-select');
                const statusNotes = document.getElementById('status-notes');
                const interviewDateInput = document.getElementById('interview-date');
                
                const newStatus = statusSelect.value;
                const notes = statusNotes.value.trim();
                
                if (!newStatus) {
                    this.showNotification('error', 'خطأ', 'يرجى اختيار حالة جديدة');
                    return;
                }
                
                // إذا كانت الحالة الجديدة "مقابلة مجدولة" ولم يتم تحديد تاريخ، نطلب ذلك
                if (newStatus === 'مقابلة مجدولة' && !interviewDateInput.value) {
                    this.showNotification('error', 'خطأ', 'يرجى تحديد تاريخ المقابلة');
                    return;
                }
                
                // تحضير البيانات للتحديث
                const updateData = {
                    status: newStatus,
                    internal_notes: notes
                };
                
                if (newStatus === 'مقابلة مجدولة') {
                    updateData.interview_date = interviewDateInput.value;
                }
                
                const response = await this.apiClient.request(`/api/admin/jobs/${this.currentApplicationId}`, {
                    method: 'PUT',
                    body: JSON.stringify(updateData)
                });
                
                if (response.success) {
                    // تحديث البيانات المحلية
                    const appIndex = this.applications.findIndex(a => a.id == this.currentApplicationId);
                    if (appIndex !== -1) {
                        this.applications[appIndex].status = newStatus;
                        this.applications[appIndex].notes = notes;
                        if (newStatus === 'مقابلة مجدولة') {
                            this.applications[appIndex].interviewDate = interviewDateInput.value;
                        }
                    }
                    
                    this.showNotification('success', 'تم بنجاح', 'تم تحديث حالة الطلب بنجاح');
                    
                    document.getElementById('application-status-modal').classList.remove('active');
                    this.currentApplicationId = null;
                    
                    // إعادة تحميل البيانات لتحديث الجدول والإحصائيات
                    await this.loadApplications();
                    this.updateStatistics();
                }
                
            } catch (error) {
                console.error('❌ Error updating application status:', error);
                this.showNotification('error', 'خطأ', error.message || 'فشل في تحديث حالة الطلب');
            }
        }
        
        // ---------- حذف الطلب ----------
        showDeleteConfirmModal(applicationId) {
            this.currentApplicationId = applicationId;
            document.getElementById('delete-confirm-modal').classList.add('active');
        }
        
        async deleteApplication() {
            if (!this.currentApplicationId) return;
            
            try {
                const response = await this.apiClient.request(`/api/admin/jobs/${this.currentApplicationId}`, {
                    method: 'DELETE'
                });
                
                if (response.success) {
                    this.showNotification('success', 'تم الحذف', 'تم حذف الطلب بنجاح');
                    
                    document.getElementById('delete-confirm-modal').classList.remove('active');
                    this.currentApplicationId = null;
                    
                    await this.loadApplications();
                    this.updateStatistics();
                }
                
            } catch (error) {
                console.error('❌ Error deleting application:', error);
                this.showNotification('error', 'خطأ', error.message || 'فشل في حذف الطلب');
            }
        }
        
        // ---------- عرض السيرة الذاتية ----------
        showCV(applicationId) {
            const application = this.applications.find(a => a.id == applicationId);
            if (!application || !application.cvUrl) {
                this.showNotification('warning', 'تنبيه', 'لا توجد سيرة ذاتية لهذا المرشح');
                return;
            }
            
            const modal = document.getElementById('cv-view-modal');
            const cvPreview = document.getElementById('cv-preview');
            const downloadBtn = document.getElementById('cv-download-btn');
            
            cvPreview.src = application.cvUrl;
            
            downloadBtn.onclick = () => {
                this.downloadCV(application.cvUrl, application.candidateName);
            };
            
            modal.classList.add('active');
        }
        
        downloadCV(cvUrl, candidateName) {
            try {
                const link = document.createElement('a');
                link.href = cvUrl;
                link.download = `سيرة_ذاتية_${candidateName.replace(/\s+/g, '_')}.pdf`;
                link.click();
                
                this.showNotification('success', 'تم التحميل', 'جاري تحميل السيرة الذاتية');
                
            } catch (error) {
                console.error('❌ Error downloading CV:', error);
                this.showNotification('error', 'خطأ', 'فشل في تحميل السيرة الذاتية');
            }
        }
        
        // ---------- تصدير الطلبات ----------
        async exportApplications() {
            try {
                const response = await this.apiClient.request('/api/admin/jobs/export/export-data');
                if (response.success && response.data) {
                    // تحويل البيانات للتصدير
                    const exportData = response.data.map(app => ({
                        'رقم الطلب': `APP-${app.id}`,
                        'الاسم': `${app.first_name || ''} ${app.last_name || ''}`.trim(),
                        'البريد الإلكتروني': app.email,
                        'رقم الهاتف': app.phone,
                        'القسم': app.expertise,
                        'الوظيفة المطلوبة': app.current_position,
                        'الخبرة': app.experience_years,
                        'المؤهل': app.education,
                        'الراتب المتوقع': app.expected_salary,
                        'الجنسية': app.nationality,
                        'المدينة': app.city,
                        'الحالة': app.status,
                        'تاريخ التقديم': app.created_at,
                    }));
                    
                    const headers = Object.keys(exportData[0] || {});
                    const csvRows = [
                        headers.join(','),
                        ...exportData.map(row => 
                            headers.map(header => `"${row[header] || ''}"`).join(',')
                        )
                    ];
                    
                    const csv = csvRows.join('\n');
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `طلبات_توظيف_${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                    
                    this.showNotification('success', 'تم التصدير', 'تم تصدير طلبات التوظيف بنجاح');
                }
            } catch (error) {
                console.error('❌ Error exporting applications:', error);
                this.showNotification('error', 'خطأ', 'فشل في تصدير طلبات التوظيف');
            }
        }
        
        // ---------- الإحصائيات ----------
        async updateStatistics() {
            try {
                const response = await this.apiClient.request('/api/admin/jobs/stats');
                if (response.success) {
                    const stats = response.data;
                    
                    document.getElementById('overview-total').textContent = stats.total || 0;
                    document.getElementById('overview-new').textContent = stats.new || 0;
                    document.getElementById('overview-review').textContent = stats.review || 0;
                    document.getElementById('overview-interview').textContent = stats.scheduled || 0;
                    document.getElementById('overview-accepted').textContent = stats.accepted || 0;
                    document.getElementById('overview-rejected').textContent = stats.rejected || 0;
                    
                    this.updateChartData(stats);
                    this.updateRecentApplications();
                }
            } catch (error) {
                console.warn('⚠️ Could not load stats from API, using local data');
                this.updateStatisticsFallback();
            }
        }
        
        updateStatisticsFallback() {
            const total = this.applications.length;
            const newApps = this.applications.filter(a => a.status === 'جديد').length;
            const reviewApps = this.applications.filter(a => a.status === 'قيد المراجعة').length;
            const interviewApps = this.applications.filter(a => a.status === 'للمقابلة').length;
            const scheduledApps = this.applications.filter(a => a.status === 'مقابلة مجدولة').length;
            const acceptedApps = this.applications.filter(a => a.status === 'مقبولة').length;
            const rejectedApps = this.applications.filter(a => a.status === 'مرفوضة').length;
            
            document.getElementById('overview-total').textContent = total;
            document.getElementById('overview-new').textContent = newApps;
            document.getElementById('overview-review').textContent = reviewApps;
            document.getElementById('overview-interview').textContent = scheduledApps;
            document.getElementById('overview-accepted').textContent = acceptedApps;
            document.getElementById('overview-rejected').textContent = rejectedApps;
            
            this.updateChartData();
            this.updateRecentApplications();
        }
        
        setupChart() {
            const canvas = document.getElementById('applications-chart');
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
                '#6A6A6A'
            ];
            
            this.chartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: darkColors,
                        borderColor: darkColors.map(c => c.replace('12', '00')),
                        borderWidth: 2,
                        hoverBackgroundColor: darkColors.map(c => c.replace('12', '1A')),
                        hoverBorderColor: 'rgba(255, 255, 255, 0.3)',
                        hoverBorderWidth: 3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '60%',
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
            
            const periodSelect = document.getElementById('chart-period');
            if (periodSelect) {
                periodSelect.addEventListener('change', () => {
                    this.updateChartData(null, periodSelect.value);
                });
            }
        }
        
        updateChartData(stats = null, filter = 'all') {
            if (!this.chartInstance) return;
            
            let filteredApps = this.applications;
            if (filter === 'new') {
                filteredApps = this.applications.filter(a => a.status === 'جديد');
            } else if (filter === 'accepted') {
                filteredApps = this.applications.filter(a => a.status === 'مقبولة');
            } else if (filter === 'rejected') {
                filteredApps = this.applications.filter(a => a.status === 'مرفوضة');
            }
            
            // تجميع حسب القسم
            const deptCounts = {};
            filteredApps.forEach(app => {
                const dept = app.department || 'غير محدد';
                deptCounts[dept] = (deptCounts[dept] || 0) + 1;
            });
            
            const labels = Object.keys(deptCounts);
            const data = labels.map(l => deptCounts[l]);
            
            this.chartInstance.data.labels = labels;
            this.chartInstance.data.datasets[0].data = data;
            this.chartInstance.update();
        }
        
        updateRecentApplications() {
            const container = document.getElementById('recent-applications');
            if (!container) return;
            
            const recent = [...this.applications]
                .sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate))
                .slice(0, 5);
            
            let html = '';
            if (recent.length === 0) {
                html = '<div class="empty-state"><i class="fas fa-file-alt"></i><p>لا توجد طلبات حديثة</p></div>';
            } else {
                recent.forEach(app => {
                    const timeAgo = this.getTimeAgo(app.appliedDate);
                    const statusClass = this.getStatusClass(app.status).replace('status-', '');
                    
                    html += `
                        <div class="recent-item">
                            <div class="recent-item-icon"><i class="fas fa-user"></i></div>
                            <div class="recent-item-content">
                                <div class="recent-item-header">
                                    <h5 class="recent-item-title">${this.escapeHtml(app.candidateName)}</h5>
                                    <span class="recent-item-time">${timeAgo}</span>
                                </div>
                                <p class="recent-item-message">${this.escapeHtml(app.position)} | ${this.escapeHtml(app.department)}</p>
                                <span class="recent-item-status ${statusClass}">${this.escapeHtml(app.status)}</span>
                            </div>
                        </div>
                    `;
                });
            }
            
            container.innerHTML = html;
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
                if (diffDays < 30) return `قبل ${diffDays} يوم`;
                return this.formatDate(dateString);
            } catch {
                return dateString;
            }
        }
        
        // ---------- إعداد واجهة المستخدم ----------
        setupUI() {
            this.setupDropdowns();
            this.setupTableSearch();
            this.setupFilterBar();
            this.setupSorting();
            this.setupButtons();
            this.setupPageSize();
            this.setupQuickActions();
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
                this.loadApplications();
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
        
        setupFilterBar() {
            const filterItems = document.querySelectorAll('.filter-item');
            
            if (window.innerWidth <= 992) {
                filterItems.forEach(item => {
                    const btn = item.querySelector('.filter-btn');
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        filterItems.forEach(other => other.classList.remove('active'));
                        item.classList.toggle('active');
                    });
                });
                
                document.addEventListener('click', (e) => {
                    if (!e.target.closest('.filter-item')) {
                        filterItems.forEach(item => item.classList.remove('active'));
                    }
                });
            }
            
            const applyBtn = document.getElementById('apply-filters');
            if (applyBtn) {
                applyBtn.addEventListener('click', () => {
                    this.updateFiltersFromUI();
                    this.currentPage = 1;
                    this.loadApplications();
                    
                    if (window.innerWidth <= 992) {
                        filterItems.forEach(item => item.classList.remove('active'));
                    }
                    
                    this.showNotification('success', 'تم تطبيق الفلاتر', 'تم تحديث قائمة الطلبات حسب الفلاتر المحددة');
                });
            }
            
            const resetBtn = document.getElementById('reset-filters');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    this.resetFilters();
                    this.updateFiltersUI();
                    this.currentPage = 1;
                    this.loadApplications();
                    
                    if (window.innerWidth <= 992) {
                        filterItems.forEach(item => item.classList.remove('active'));
                    }
                    
                    this.showNotification('info', 'تم إعادة التعيين', 'تم إعادة ضبط جميع الفلاتر');
                });
            }
            
            this.updateFiltersUI();
        }
        
        updateFiltersFromUI() {
            const filterTypes = ['status', 'department', 'job_type', 'experience', 'education', 'nationality', 'city',
                               'gender', 'residence', 'region', 'marital', 'disability', 'employment_status',
                               'transferable', 'notice_period', 'previous_contact', 'date'];
            
            filterTypes.forEach(filterType => {
                const checkboxes = document.querySelectorAll(`input[name="${filterType}"]:checked`);
                this.filters[filterType] = Array.from(checkboxes).map(cb => cb.value);
            });
        }
        
        resetFilters() {
            // إعادة تعيين الفلاتر إلى كل القيم الممكنة (تحديد الكل)
            for (const key in this.allFilterValues) {
                if (this.filters.hasOwnProperty(key)) {
                    this.filters[key] = [...this.allFilterValues[key]];
                }
            }
        }
        
        updateFiltersUI() {
            // تحديث حالة checkboxes في DOM لتطابق this.filters
            for (const filterType in this.filters) {
                if (this.filters.hasOwnProperty(filterType)) {
                    document.querySelectorAll(`input[name="${filterType}"]`).forEach(cb => {
                        cb.checked = this.filters[filterType].includes(cb.value);
                    });
                }
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
                document.addEventListener('click', () => sortDropdown.classList.remove('show'));
            }
            
            if (sortOptions) {
                sortOptions.forEach(option => {
                    option.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.sortOrder = option.dataset.sort;
                        this.currentPage = 1;
                        this.loadApplications();
                        sortDropdown.classList.remove('show');
                    });
                });
            }
        }
        
        setupButtons() {
            const refreshBtn = document.getElementById('refresh-btn');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => {
                    this.loadApplications();
                    this.updateStatistics();
                    this.showNotification('success', 'تم التحديث', 'تم تحديث قائمة طلبات التوظيف');
                });
            }
            
            const exportBtn = document.getElementById('export-btn');
            if (exportBtn) {
                exportBtn.addEventListener('click', () => this.exportApplications());
            }
        }
        
        setupPageSize() {
            const pageSizeSelect = document.getElementById('page-size');
            if (pageSizeSelect) {
                pageSizeSelect.addEventListener('change', (e) => {
                    this.pageSize = parseInt(e.target.value);
                    this.currentPage = 1;
                    this.loadApplications();
                });
            }
        }
        
        setupQuickActions() {
            const quickActionsBtn = document.getElementById('quick-actions-btn');
            const quickActionsDropdown = document.getElementById('quick-actions-dropdown');
            
            if (quickActionsBtn && quickActionsDropdown) {
                quickActionsBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    quickActionsDropdown.classList.toggle('show');
                });
                document.addEventListener('click', () => quickActionsDropdown.classList.remove('show'));
            }
            
            document.getElementById('mark-reviewed')?.addEventListener('click', (e) => {
                e.preventDefault();
                this.markAsReviewed();
            });
            
            document.getElementById('schedule-interview')?.addEventListener('click', (e) => {
                e.preventDefault();
                this.showScheduleInterviewModal();
            });
            
            document.getElementById('send-rejection')?.addEventListener('click', (e) => {
                e.preventDefault();
                this.sendRejection();
            });
            
            document.getElementById('archive-selected')?.addEventListener('click', (e) => {
                e.preventDefault();
                this.archiveSelected();
            });
        }
        
        // الإجراءات السريعة
        async markAsReviewed() {
            const selected = document.querySelectorAll('.application-checkbox:checked');
            if (selected.length === 0) {
                this.showNotification('warning', 'تنبيه', 'يرجى تحديد طلب واحد على الأقل');
                return;
            }
            
            try {
                const ids = Array.from(selected).map(cb => cb.dataset.id);
                await Promise.all(ids.map(id => 
                    this.apiClient.request(`/api/admin/jobs/${id}`, {
                        method: 'PUT',
                        body: JSON.stringify({ status: 'قيد المراجعة' })
                    })
                ));
                
                this.showNotification('success', 'تم بنجاح', `تم تعيين ${ids.length} طلب كتمت المراجعة`);
                await this.loadApplications();
                this.updateStatistics();
                
            } catch (error) {
                console.error('❌ Error marking as reviewed:', error);
                this.showNotification('error', 'خطأ', 'فشل في تحديث الحالة');
            }
        }
        
        showScheduleInterviewModal() {
            const selected = document.querySelectorAll('.application-checkbox:checked');
            if (selected.length === 0) {
                this.showNotification('warning', 'تنبيه', 'يرجى تحديد طلب واحد على الأقل');
                return;
            }
            
            if (selected.length === 1) {
                this.currentApplicationId = selected[0].dataset.id;
                document.getElementById('schedule-interview-modal').classList.add('active');
            } else {
                this.showNotification('info', 'معلومة', 'يمكنك جدولة مقابلة لطلب واحد في كل مرة');
            }
        }
        
        async scheduleInterviewSave() {
            try {
                const interviewDatetime = document.getElementById('interview-datetime').value;
                const interviewType = document.getElementById('interview-type').value;
                const interviewLocation = document.getElementById('interview-location').value;
                const interviewInterviewers = document.getElementById('interview-interviewers').value;
                const interviewNotes = document.getElementById('interview-notes').value;
                
                if (!interviewDatetime) {
                    this.showNotification('error', 'خطأ', 'يرجى اختيار تاريخ ووقت المقابلة');
                    return;
                }
                
                // تحديث الحالة إلى "مقابلة مجدولة" مع حفظ بيانات المقابلة في الملاحظات أو حقل مخصص
                const notes = `مقابلة مجدولة: ${interviewDatetime}\nنوع: ${interviewType}\nالمكان: ${interviewLocation}\nالمحاورون: ${interviewInterviewers}\nملاحظات: ${interviewNotes}`;
                
                await this.apiClient.request(`/api/admin/jobs/${this.currentApplicationId}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        status: 'مقابلة مجدولة',
                        internal_notes: notes
                    })
                });
                
                this.showNotification('success', 'تم بنجاح', 'تم جدولة المقابلة بنجاح');
                document.getElementById('schedule-interview-modal').classList.remove('active');
                this.currentApplicationId = null;
                await this.loadApplications();
                this.updateStatistics();
                
            } catch (error) {
                console.error('❌ Error scheduling interview:', error);
                this.showNotification('error', 'خطأ', error.message || 'فشل في جدولة المقابلة');
            }
        }
        
        async sendRejection() {
            const selected = document.querySelectorAll('.application-checkbox:checked');
            if (selected.length === 0) {
                this.showNotification('warning', 'تنبيه', 'يرجى تحديد طلب واحد على الأقل');
                return;
            }
            
            if (!confirm(`هل أنت متأكد من رفض ${selected.length} طلب؟`)) return;
            
            try {
                const ids = Array.from(selected).map(cb => cb.dataset.id);
                await Promise.all(ids.map(id => 
                    this.apiClient.request(`/api/admin/jobs/${id}`, {
                        method: 'PUT',
                        body: JSON.stringify({ status: 'مرفوضة' })
                    })
                ));
                
                this.showNotification('success', 'تم بنجاح', `تم رفض ${ids.length} طلب`);
                await this.loadApplications();
                this.updateStatistics();
                
            } catch (error) {
                console.error('❌ Error rejecting applications:', error);
                this.showNotification('error', 'خطأ', 'فشل في رفض الطلبات');
            }
        }
        
        async archiveSelected() {
            const selected = document.querySelectorAll('.application-checkbox:checked');
            if (selected.length === 0) {
                this.showNotification('warning', 'تنبيه', 'يرجى تحديد طلب واحد على الأقل');
                return;
            }
            
            if (!confirm(`هل أنت متأكد من أرشفة ${selected.length} طلب؟`)) return;
            
            try {
                const ids = Array.from(selected).map(cb => cb.dataset.id);
                await Promise.all(ids.map(id => 
                    this.apiClient.request(`/api/admin/jobs/${id}`, {
                        method: 'PUT',
                        body: JSON.stringify({ status: 'مؤرشفة' })
                    })
                ));
                
                this.showNotification('success', 'تم بنجاح', `تم أرشفة ${ids.length} طلب`);
                await this.loadApplications();
                this.updateStatistics();
                
            } catch (error) {
                console.error('❌ Error archiving applications:', error);
                this.showNotification('error', 'خطأ', 'فشل في أرشفة الطلبات');
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
            
            const statusSave = document.getElementById('status-save-btn');
            if (statusSave) statusSave.addEventListener('click', () => this.updateApplicationStatus());
            
            const confirmDelete = document.getElementById('delete-confirm-btn');
            if (confirmDelete) confirmDelete.addEventListener('click', () => this.deleteApplication());
            
            const cancelDelete = document.getElementById('delete-cancel-btn');
            if (cancelDelete) {
                cancelDelete.addEventListener('click', () => {
                    document.getElementById('delete-confirm-modal').classList.remove('active');
                    this.currentApplicationId = null;
                });
            }
            
            const statusCancel = document.getElementById('status-cancel-btn');
            if (statusCancel) {
                statusCancel.addEventListener('click', () => {
                    document.getElementById('application-status-modal').classList.remove('active');
                    this.currentApplicationId = null;
                });
            }
            
            const scheduleSave = document.getElementById('schedule-save-btn');
            if (scheduleSave) scheduleSave.addEventListener('click', () => this.scheduleInterviewSave());
            
            const scheduleCancel = document.getElementById('schedule-cancel-btn');
            if (scheduleCancel) {
                scheduleCancel.addEventListener('click', () => {
                    document.getElementById('schedule-interview-modal').classList.remove('active');
                    this.currentApplicationId = null;
                });
            }
            
            const modalEditBtn = document.getElementById('modal-edit-btn');
            if (modalEditBtn) {
                modalEditBtn.addEventListener('click', () => {
                    document.getElementById('application-detail-modal').classList.remove('active');
                    if (modalEditBtn.dataset.applicationId) {
                        this.showEditStatusModal(modalEditBtn.dataset.applicationId);
                    }
                });
            }
            
            const modalCloseBtns = document.querySelectorAll('#modal-close-btn, #modal-close-btn-2');
            modalCloseBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    document.getElementById('application-detail-modal').classList.remove('active');
                });
            });
        }
        
        // ---------- تحسينات الجوال ----------
        setupMobileEnhancements() {
            this.setupMobileMenu();
            this.setupMobileSearch();
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
            const tableBody = document.getElementById('applications-table-body');
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr class="loading-row">
                        <td colspan="12">
                            <div class="loading-content">
                                <div class="loading-spinner"></div>
                                <span>جاري تحميل طلبات التوظيف من قاعدة البيانات...</span>
                            </div>
                        </td>
                    </tr>
                `;
            }
        }
    }
    
    function initialize() {
        try {
            window.jobManager = new JobApplicationsManager();
            console.log('✅ JobApplicationsManager initialized with real database connection');
        } catch (error) {
            console.error('❌ Failed to initialize JobApplicationsManager:', error);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();