// stats.js - صفحة إدارة الأقسام والموظفين (متكاملة مع APIs وفلتر التاريخ)
// تم إصلاح التقييم ليعتمد على الفترة ويعرض "-" إذا لم توجد تقييمات
// تم إضافة عرض الجزاءات اليدوية ونسبة الخصم مع ربطها بفلتر التاريخ
// تم تعديل ألوان الجزاءات: أحمر للجزاءات > 0، أخضر لعدم وجود جزاءات
// تم تحسين عرض الجزاءات في المودال بشكل احترافي (بطاقات منفصلة)
(function() {
    'use strict';

    console.log('✅ stats.js loaded - Rating depends on date range, shows "-" if no ratings');
    console.log('✅ Manual penalties and discount percentage integrated with date filter');
    console.log('✅ Penalty colors: red for >0 penalties, green for none');
    console.log('✅ Modal penalties display professional cards');

    // ========== نظام الترجمة (i18n) ==========
    const translations = {
        ar: {
            appName: "الأقسام والموظفين | نظام إدارة العقارات",
            totalEmployees: "إجمالي الموظفين",
            tasksOntime: "مهام في موعدها",
            tasksProgress: "قيد التنفيذ",
            tasksOverdue: "مهام متأخرة",
            viewEmployees: "عرض الموظفين",
            close: "إغلاق",
            employeeDetails: "تفاصيل الموظف",
            editData: "تعديل البيانات",
            printReport: "طباعة التقرير",
            noTasks: "لا توجد مهام لهذا الموظف",
            taskTitle: "المهمة",
            status: "الحالة",
            dueDate: "تاريخ الاستحقاق",
            completionDate: "تاريخ الإنجاز",
            completed: "مكتملة",
            inProgress: "قيد التنفيذ",
            overdue: "متأخرة",
            review: "مراجعة",
            todo: "معلقة",
            penalties: "جزاءات",
            manualPenalties: "جزاءات يدوية",
            discountPercentage: "نسبة الخصم",
            rating: "التقييم",
            position: "المسمى الوظيفي",
            department: "القسم",
            phone: "الهاتف",
            email: "البريد الإلكتروني"
        },
        en: {
            appName: "Departments & Employees | Real Estate Management System",
            totalEmployees: "Total Employees",
            tasksOntime: "Tasks On Time",
            tasksProgress: "In Progress",
            tasksOverdue: "Overdue Tasks",
            viewEmployees: "View Employees",
            close: "Close",
            employeeDetails: "Employee Details",
            editData: "Edit Data",
            printReport: "Print Report",
            noTasks: "No tasks for this employee",
            taskTitle: "Task",
            status: "Status",
            dueDate: "Due Date",
            completionDate: "Completion Date",
            completed: "Completed",
            inProgress: "In Progress",
            overdue: "Overdue",
            review: "Review",
            todo: "Todo",
            penalties: "Penalties",
            manualPenalties: "Manual Penalties",
            discountPercentage: "Discount %",
            rating: "Rating",
            position: "Position",
            department: "Department",
            phone: "Phone",
            email: "Email"
        }
    };

    let currentLang = 'ar';

    function getCurrentLanguage() {
        try {
            const taskflowLang = localStorage.getItem('taskflow_lang');
            if (taskflowLang && (taskflowLang === 'ar' || taskflowLang === 'en')) {
                return taskflowLang;
            }
            const userData = localStorage.getItem('user_data');
            if (userData) {
                const user = JSON.parse(userData);
                if (user.language && (user.language === 'ar' || user.language === 'en')) {
                    return user.language;
                }
            }
            const appLang = localStorage.getItem('app_lang');
            if (appLang && (appLang === 'ar' || appLang === 'en')) {
                return appLang;
            }
        } catch(e) {}
        return 'ar';
    }

    function setLanguage(lang) {
        if (lang !== 'ar' && lang !== 'en') return;
        currentLang = lang;
        localStorage.setItem('taskflow_lang', lang);
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        translatePage();
    }

    function translatePage() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[currentLang][key]) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    if (el.getAttribute('placeholder') !== undefined) {
                        el.setAttribute('placeholder', translations[currentLang][key]);
                    } else {
                        el.value = translations[currentLang][key];
                    }
                } else {
                    el.textContent = translations[currentLang][key];
                }
            }
        });
    }

    // دالة لعرض التقييم: إذا كان null أو undefined تعرض "-" وإلا تعرض القيمة مقربة
    function formatRating(rating) {
        if (rating === null || rating === undefined || isNaN(rating)) return '-';
        return rating.toFixed(1);
    }

    // دالة لعرض نسبة الخصم
    function formatDiscountPercentage(percentage) {
        if (percentage === null || percentage === undefined || isNaN(percentage)) return '0%';
        return `${percentage}%`;
    }

    // ========== مدير الصفحة ==========
    class StatsManager {
        constructor() {
            this.baseURL = 'http://localhost:3001';
            this.currentUser = null;
            this.selectedDepartmentId = null;
            this.chartInstance = null;
            this.dateRange = {
                start: '',
                end: ''
            };
            this.init();
        }

        getAuthToken() {
            try {
                let token = localStorage.getItem('auth_token');
                if (token && token !== 'undefined' && token !== 'null') {
                    return token;
                }
                const userData = localStorage.getItem('user_data');
                if (userData) {
                    const user = JSON.parse(userData);
                    if (user.token && user.token !== 'undefined') {
                        return user.token;
                    }
                }
                if (window.AuthManager && typeof window.AuthManager.getToken === 'function') {
                    return window.AuthManager.getToken();
                }
                return null;
            } catch (error) {
                console.error('❌ Error reading token:', error);
                return null;
            }
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
                console.error('❌ Error reading user data:', error);
            }
            return null;
        }

        async request(endpoint, options = {}) {
            const token = this.getAuthToken();
            const url = `${this.baseURL}${endpoint}`;
            const headers = {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const config = {
                method: options.method || 'GET',
                headers,
                mode: 'cors',
                credentials: 'omit'
            };
            if (options.body) {
                config.body = JSON.stringify(options.body);
            }

            console.log(`📡 Request: ${config.method} ${endpoint}`);
            const response = await fetch(url, config);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }
            return data;
        }

        async init() {
            await this.checkAuth();
            this.setupDateFilter();
            this.setupEventListeners();
            this.setupMobileMenu();
            this.updateSystemTime();
            setInterval(() => this.updateSystemTime(), 60000);
            await this.loadAllData();
            currentLang = getCurrentLanguage();
            setLanguage(currentLang);
        }

        async checkAuth() {
            try {
                const user = this.getCurrentUser();
                if (user && user.id) {
                    this.currentUser = user;
                    this.updateUserInfo();
                } else {
                    window.location.href = '../login/index.html';
                    return;
                }
            } catch (error) {
                console.error('❌ Auth check failed:', error);
                window.location.href = '../login/index.html';
            }
        }

        updateUserInfo() {
            const nameEl = document.getElementById('current-user-name');
            const roleEl = document.getElementById('current-user-role');
            if (nameEl && this.currentUser) {
                nameEl.textContent = this.currentUser.fullName || this.currentUser.username || 'مستخدم';
            }
            if (roleEl && this.currentUser) {
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
                roleEl.textContent = roleMap[this.currentUser.role] || this.currentUser.role;
            }
        }

        setupDateFilter() {
            const startInput = document.getElementById('start-date');
            const endInput = document.getElementById('end-date');
            const applyBtn = document.getElementById('apply-date-filter');
            const clearBtn = document.getElementById('clear-date-filter');

            if (startInput) startInput.value = '';
            if (endInput) endInput.value = '';

            if (applyBtn) {
                applyBtn.addEventListener('click', () => {
                    const startVal = startInput.value;
                    const endVal = endInput.value;
                    if (startVal && endVal) {
                        this.dateRange.start = startVal;
                        this.dateRange.end = endVal;
                    } else {
                        if (startVal || endVal) {
                            this.showNotification('warning', 'تنبيه', 'يرجى إدخال تاريخ البداية والنهاية معاً');
                            return;
                        }
                        this.dateRange.start = '';
                        this.dateRange.end = '';
                    }
                    this.loadAllData();
                    if (this.dateRange.start && this.dateRange.end) {
                        this.showNotification('info', 'تم التصفية', `الفترة: ${this.dateRange.start} إلى ${this.dateRange.end}`);
                    } else {
                        this.showNotification('info', 'تم إلغاء الفلتر', 'تم عرض جميع البيانات');
                    }
                });
            }

            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    if (startInput) startInput.value = '';
                    if (endInput) endInput.value = '';
                    this.dateRange.start = '';
                    this.dateRange.end = '';
                    this.loadAllData();
                    this.showNotification('info', 'تم المسح', 'تم إلغاء فلتر التاريخ');
                });
            }
        }

        async loadAllData() {
            try {
                this.showLoading();
                await Promise.all([
                    this.loadOverallStats(),
                    this.loadDepartmentsStats(),
                    this.loadTopEmployees(),
                    this.updateChart()
                ]);
                if (this.selectedDepartmentId) {
                    await this.loadDepartmentEmployees(this.selectedDepartmentId);
                }
                this.hideLoading();
            } catch (error) {
                console.error('❌ Error loading data:', error);
                this.showNotification('error', 'خطأ', 'فشل تحميل البيانات');
                this.hideLoading();
            }
        }

        async loadOverallStats() {
            try {
                const params = new URLSearchParams();
                if (this.dateRange.start && this.dateRange.end) {
                    params.append('startDate', this.dateRange.start);
                    params.append('endDate', this.dateRange.end);
                }
                const response = await this.request(`/api/admin/stats/overall-stats?${params.toString()}`);
                if (response.success && response.data) {
                    document.getElementById('total-employees').textContent = response.data.totalEmployees || 0;
                    document.getElementById('total-tasks-ontime').textContent = response.data.totalTasksOntime || 0;
                    document.getElementById('total-tasks-progress').textContent = response.data.totalTasksProgress || 0;
                    document.getElementById('total-tasks-overdue').textContent = response.data.totalTasksOverdue || 0;
                }
            } catch (error) {
                console.error('❌ loadOverallStats error:', error);
            }
        }

        async loadDepartmentsStats() {
            try {
                const params = new URLSearchParams();
                if (this.dateRange.start && this.dateRange.end) {
                    params.append('startDate', this.dateRange.start);
                    params.append('endDate', this.dateRange.end);
                }
                const response = await this.request(`/api/admin/stats/departments-stats?${params.toString()}`);
                if (response.success && response.data) {
                    this.renderDepartmentsGrid(response.data);
                    this.populateDepartmentSelect(response.data);
                }
            } catch (error) {
                console.error('❌ loadDepartmentsStats error:', error);
            }
        }

        renderDepartmentsGrid(departments) {
            const grid = document.getElementById('departments-grid');
            if (!grid) return;

            if (!departments || departments.length === 0) {
                grid.innerHTML = '<div class="empty-state">لا توجد أقسام</div>';
                return;
            }

            let html = '';
            departments.forEach(dept => {
                const icon = this.getDepartmentIcon(dept.name);
                html += `
                    <div class="department-card" data-department-id="${dept.id}">
                        <div class="department-header">
                            <div class="department-icon">
                                <i class="fas ${icon}"></i>
                            </div>
                            <div class="department-title">
                                <h3>${this.escapeHtml(dept.name)}</h3>
                                <div class="department-employees-count">
                                    <i class="fas fa-user-friends"></i>
                                    <span>${dept.employeeCount || 0} موظف</span>
                                </div>
                            </div>
                        </div>
                        <div class="department-stats">
                            <div class="stat-item stat-ontime">
                                <div class="stat-value">${dept.tasksOnTime || 0}</div>
                                <div class="stat-label">في موعدها</div>
                            </div>
                            <div class="stat-item stat-progress">
                                <div class="stat-value">${dept.tasksInProgress || 0}</div>
                                <div class="stat-label">قيد التنفيذ</div>
                            </div>
                            <div class="stat-item stat-overdue">
                                <div class="stat-value">${dept.tasksOverdue || 0}</div>
                                <div class="stat-label">متأخرة</div>
                            </div>
                        </div>
                        <div class="department-footer">
                            <button class="view-details-btn view-department-btn" data-department-id="${dept.id}">
                                <span>عرض الموظفين</span>
                                <i class="fas fa-arrow-left"></i>
                            </button>
                        </div>
                    </div>
                `;
            });

            grid.innerHTML = html;

            document.querySelectorAll('.view-department-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const deptId = parseInt(e.currentTarget.dataset.departmentId);
                    this.loadDepartmentEmployees(deptId);
                });
            });
        }

        getDepartmentIcon(name) {
            const icons = {
                'تطوير البرمجيات': 'fa-code',
                'المبيعات والتسويق': 'fa-chart-line',
                'الموارد البشرية': 'fa-users',
                'المالية والمحاسبة': 'fa-coins'
            };
            return icons[name] || 'fa-building';
        }

        async loadDepartmentEmployees(departmentId) {
            try {
                this.selectedDepartmentId = departmentId;
                const params = new URLSearchParams();
                if (this.dateRange.start && this.dateRange.end) {
                    params.append('startDate', this.dateRange.start);
                    params.append('endDate', this.dateRange.end);
                }
                const response = await this.request(`/api/admin/stats/departments/${departmentId}/employees?${params.toString()}`);
                if (response.success && response.data) {
                    this.renderEmployeesTable(response.data, departmentId);
                }
            } catch (error) {
                console.error('❌ loadDepartmentEmployees error:', error);
                this.showNotification('error', 'خطأ', 'فشل تحميل موظفي القسم');
            }
        }

        async renderEmployeesTable(employees, departmentId) {
            const card = document.getElementById('department-details-card');
            const titleEl = document.getElementById('selected-department-title');
            
            let deptName = '';
            try {
                const deptResponse = await this.request(`/api/admin/stats/departments/${departmentId}`);
                if (deptResponse.success && deptResponse.data) {
                    deptName = deptResponse.data.name;
                }
            } catch(e) {}
            
            titleEl.innerHTML = `<i class="fas fa-users card-title-icon"></i> موظفو قسم ${deptName || departmentId}`;
            
            const tbody = document.getElementById('employees-table-body');
            if (!employees || employees.length === 0) {
                tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">لا يوجد موظفون في هذا القسم</td></tr>';
                card.style.display = 'block';
                return;
            }

            let html = '';
            employees.forEach(emp => {
                const ratingDisplay = formatRating(emp.rating);
                const discountPercentage = formatDiscountPercentage(emp.manualPenaltiesTotalPercentage || 0);
                
                // تحديد class للجزاءات: danger إذا كان هناك جزاءات (عدد > 0)، success إذا لم يكن هناك جزاءات
                const penaltiesCount = emp.penaltiesCount || 0;
                const penaltyClass = penaltiesCount > 0 ? 'danger' : 'success';
                
                // نفس الشيء لنسبة الخصم اليدوية
                const discountClass = (emp.manualPenaltiesTotalPercentage || 0) > 0 ? 'danger' : 'success';
                
                html += `
                    <tr>
                        <td>
                            <div class="employee-info">
                                <div class="employee-avatar"><i class="fas fa-user"></i></div>
                                <div>
                                    <div class="employee-name">${this.escapeHtml(emp.fullName)}</div>
                                    <div class="employee-email">${this.escapeHtml(emp.email || '')}</div>
                                </div>
                            </div>
                        </td>
                        <td>${this.escapeHtml(this.getRoleName(emp.role))}</td>
                        <td>
                            <span class="rating-value" title="التقييم ${ratingDisplay} من 10">
                                <i class="fas fa-star" style="color: #FFD700;"></i>
                                ${ratingDisplay}
                            </span>
                        </td>
                        <td>
                            <span class="penalty-badge ${penaltyClass}">
                                <i class="fas fa-exclamation-triangle"></i>
                                <span>${penaltiesCount}</span>
                            </span>
                        </td>
                        <td>
                            <span class="penalty-badge ${discountClass}" title="نسبة الخصم من الراتب">
                                <i class="fas fa-percent"></i>
                                <span>${discountPercentage}</span>
                            </span>
                        </td>
                        <td><span class="task-badge">${emp.tasksOnTime || 0}</span></td>
                        <td><span class="task-badge overdue">${emp.tasksOverdue || 0}</span></td>
                        <td><span class="task-badge progress">${emp.tasksInProgress || 0}</span></td>
                        <td>
                            <button class="action-btn btn-view view-employee-btn" data-employee-id="${emp.id}" title="عرض التفاصيل">
                                <i class="fas fa-eye"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });

            tbody.innerHTML = html;
            card.style.display = 'block';

            document.querySelectorAll('.view-employee-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const empId = parseInt(e.currentTarget.dataset.employeeId);
                    this.showEmployeeDetails(empId);
                });
            });
        }

        getRoleName(role) {
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
            return roleMap[role] || role || 'موظف';
        }

        async showEmployeeDetails(employeeId) {
            try {
                const params = new URLSearchParams();
                if (this.dateRange.start && this.dateRange.end) {
                    params.append('startDate', this.dateRange.start);
                    params.append('endDate', this.dateRange.end);
                }
                const response = await this.request(`/api/admin/stats/employees/${employeeId}?${params.toString()}`);
                if (!response.success || !response.data) {
                    throw new Error('فشل تحميل بيانات الموظف');
                }
                
                const employee = response.data;
                const ratingDisplay = formatRating(employee.rating);
                const discountPercentage = formatDiscountPercentage(employee.manualPenaltiesTotalPercentage || 0);
                
                const modal = document.getElementById('employee-detail-modal');
                const modalTitle = document.getElementById('modal-employee-name');
                const modalBody = document.getElementById('modal-employee-body');

                modalTitle.textContent = `ملف الموظف: ${employee.fullName}`;

                let tasksRows = '';
                const tasksList = employee.tasksList || [];
                if (tasksList.length > 0) {
                    tasksList.forEach(task => {
                        const statusClass = task.statusKey === 'ontime' ? 'completed' : 
                                          (task.statusKey === 'overdue' ? 'overdue' : 'inProgress');
                        const statusText = task.statusText || this.getStatusText(task.status);
                        tasksRows += `
                            <tr>
                                <td>${this.escapeHtml(task.title)}</td>
                                <td><span class="task-status-badge ${statusClass}">${statusText}</span></td>
                                <td>${task.dueDate ? new Date(task.dueDate).toLocaleDateString('ar-SA') : '--'}</td>
                                <td>${task.completedAt ? new Date(task.completedAt).toLocaleDateString('ar-SA') : '--'}</td>
                            </tr>
                        `;
                    });
                } else {
                    tasksRows = '<tr><td colspan="4" style="text-align:center; padding:2rem;">لا توجد مهام لهذا الموظف</td></tr>';
                }

                // عرض الجزاءات العادية بشكل احترافي (بطاقات)
                let penaltiesHtml = '';
                const penalties = employee.penalties || [];
                if (penalties.length > 0) {
                    penaltiesHtml = '<div class="penalties-section"><div class="penalties-title"><i class="fas fa-gavel"></i> الجزاءات العادية</div><div class="penalties-list-cards">';
                    penalties.forEach(p => {
                        penaltiesHtml += `
                            <div class="penalty-card">
                                <div class="penalty-info">
                                    <div class="penalty-date"><i class="far fa-calendar-alt"></i> ${new Date(p.issuedAt).toLocaleDateString('ar-SA')}</div>
                                    <div class="penalty-reason">${this.escapeHtml(p.reason)}</div>
                                </div>
                                <div class="penalty-amount">${p.amount ? `${p.amount} جنيه` : 'بدون مبلغ'}</div>
                            </div>
                        `;
                    });
                    penaltiesHtml += '</div></div>';
                } else {
                    penaltiesHtml = '<div class="penalties-section"><div class="penalties-title"><i class="fas fa-gavel"></i> الجزاءات العادية</div><div class="empty-penalties">لا توجد جزاءات عادية خلال الفترة المحددة</div></div>';
                }

                // عرض الجزاءات اليدوية بشكل احترافي (بطاقات)
                let manualPenaltiesHtml = '';
                const manualPenalties = employee.manualPenalties || [];
                if (manualPenalties.length > 0) {
                    manualPenaltiesHtml = '<div class="penalties-section"><div class="penalties-title"><i class="fas fa-hand-paper"></i> الجزاءات اليدوية (نسبة الخصم)</div><div class="penalties-list-cards">';
                    manualPenalties.forEach(mp => {
                        manualPenaltiesHtml += `
                            <div class="penalty-card">
                                <div class="penalty-info">
                                    <div class="penalty-date"><i class="far fa-calendar-alt"></i> ${new Date(mp.createdAt).toLocaleDateString('ar-SA')}</div>
                                    <div class="penalty-reason">${this.escapeHtml(mp.reason)}</div>
                                </div>
                                <div class="penalty-percentage">${mp.percentage}% ${mp.status === 'removed' ? '(ملغى)' : ''}</div>
                            </div>
                        `;
                    });
                    manualPenaltiesHtml += '</div></div>';
                } else {
                    manualPenaltiesHtml = '<div class="penalties-section"><div class="penalties-title"><i class="fas fa-hand-paper"></i> الجزاءات اليدوية</div><div class="empty-penalties">لا توجد جزاءات يدوية خلال الفترة المحددة</div></div>';
                }

                modalBody.innerHTML = `
                    <div class="employee-detail-container">
                        <div class="employee-profile-card">
                            <div class="employee-avatar-large">
                                <i class="fas fa-user-circle"></i>
                            </div>
                            <div class="employee-summary">
                                <h2>${this.escapeHtml(employee.fullName)}</h2>
                                <div class="job-title">
                                    <i class="fas fa-briefcase"></i>
                                    ${this.getRoleName(employee.role)} · ${this.escapeHtml(employee.departmentName || '')}
                                </div>
                                <div class="employee-stats-grid">
                                    <div class="emp-stat-item emp-stat-ontime">
                                        <div class="emp-stat-value">${employee.tasks?.tasksOnTime || 0}</div>
                                        <div class="emp-stat-label">مهام في موعدها</div>
                                    </div>
                                    <div class="emp-stat-item emp-stat-progress">
                                        <div class="emp-stat-value">${employee.tasks?.tasksInProgress || 0}</div>
                                        <div class="emp-stat-label">قيد التنفيذ</div>
                                    </div>
                                    <div class="emp-stat-item emp-stat-overdue">
                                        <div class="emp-stat-value">${employee.tasks?.tasksOverdue || 0}</div>
                                        <div class="emp-stat-label">متأخرة</div>
                                    </div>
                                </div>
                                <div style="display: flex; gap: 1rem; align-items: center; margin-top: 0.5rem; flex-wrap: wrap;">
                                    <div class="employee-rating-large">
                                        <i class="fas fa-star"></i>
                                        <span>${ratingDisplay} / 10</span>
                                    </div>
                                    <div class="employee-penalties-large">
                                        <i class="fas fa-exclamation-triangle"></i>
                                        <span>${employee.penaltiesCount || 0} جزاء</span>
                                    </div>
                                    <div class="employee-penalties-large" style="background: rgba(231, 76, 60, 0.1); border-color: #e74c3c;">
                                        <i class="fas fa-percent"></i>
                                        <span>نسبة الخصم الإجمالية: ${discountPercentage}</span>
                                    </div>
                                </div>
                                ${penaltiesHtml}
                                ${manualPenaltiesHtml}
                            </div>
                        </div>
                        <div class="tasks-section-card">
                            <div class="tasks-section-header">
                                <i class="fas fa-tasks"></i>
                                <h4>قائمة المهام</h4>
                            </div>
                            <div style="overflow-x: auto;">
                                <table class="employee-tasks-table">
                                    <thead>
                                        <tr>
                                            <th>المهمة</th>
                                            <th>الحالة</th>
                                            <th>تاريخ الاستحقاق</th>
                                            <th>تاريخ الإنجاز</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${tasksRows}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                `;

                modal.classList.add('active');

                const closeModal = () => modal.classList.remove('active');
                document.getElementById('modal-close-btn').onclick = closeModal;
                document.getElementById('modal-close-btn-2').onclick = closeModal;
                const editBtn = document.getElementById('modal-edit-employee-btn');
                if (editBtn) editBtn.style.display = 'none';
                document.getElementById('modal-print-employee-btn').onclick = () => {
                    this.printEmployeeReport(employee);
                };
            } catch (error) {
                console.error('❌ showEmployeeDetails error:', error);
                this.showNotification('error', 'خطأ', 'فشل تحميل تفاصيل الموظف');
            }
        }

        getStatusText(status) {
            const map = {
                'done': 'مكتملة',
                'archived': 'مؤرشفة',
                'in-progress': 'قيد التنفيذ',
                'todo': 'معلقة',
                'review': 'مراجعة',
                'overdue': 'متأخرة'
            };
            return map[status] || status;
        }

        printEmployeeReport(employee) {
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                alert('الرجاء السماح بفتح النوافذ المنبثقة لطباعة التقرير');
                return;
            }

            const ratingDisplay = formatRating(employee.rating);
            const discountPercentage = formatDiscountPercentage(employee.manualPenaltiesTotalPercentage || 0);
            
            let tasksRows = '';
            const tasksList = employee.tasksList || [];
            tasksList.forEach(task => {
                const statusText = this.getStatusText(task.status);
                tasksRows += `
                    <tr>
                        <td>${this.escapeHtml(task.title)}</td>
                        <td>${statusText}</td>
                        <td>${task.dueDate ? new Date(task.dueDate).toLocaleDateString('ar-SA') : '--'}</td>
                        <td>${task.completedAt ? new Date(task.completedAt).toLocaleDateString('ar-SA') : '--'}</td>
                    </tr>
                `;
            });
            if (tasksList.length === 0) {
                tasksRows = '<tr><td colspan="4" style="text-align:center;">لا توجد مهام</td></tr>';
            }

            let manualPenaltiesRows = '';
            const manualPenalties = employee.manualPenalties || [];
            if (manualPenalties.length > 0) {
                manualPenalties.forEach(mp => {
                    manualPenaltiesRows += `<li>${new Date(mp.createdAt).toLocaleDateString('ar-SA')}: ${this.escapeHtml(mp.reason)} - نسبة الخصم ${mp.percentage}%</li>`;
                });
            } else {
                manualPenaltiesRows = '<li>لا توجد جزاءات يدوية خلال الفترة</li>';
            }

            let regularPenaltiesRows = '';
            const regularPenalties = employee.penalties || [];
            if (regularPenalties.length > 0) {
                regularPenalties.forEach(p => {
                    regularPenaltiesRows += `<li>${new Date(p.issuedAt).toLocaleDateString('ar-SA')}: ${this.escapeHtml(p.reason)} ${p.amount ? `(${p.amount} جنيه)` : ''}</li>`;
                });
            } else {
                regularPenaltiesRows = '<li>لا توجد جزاءات عادية خلال الفترة</li>';
            }

            const html = `
                <!DOCTYPE html>
                <html dir="rtl">
                <head>
                    <meta charset="UTF-8">
                    <title>تقرير الموظف - ${employee.fullName}</title>
                    <style>
                        body { font-family: 'Tajawal', sans-serif; background: #fff; color: #000; padding: 20px; }
                        .report-header { text-align: center; margin-bottom: 30px; }
                        .report-header h1 { font-size: 24px; color: #333; }
                        .employee-info { display: flex; gap: 20px; background: #f5f5f5; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
                        .employee-details { flex: 1; }
                        .employee-details h2 { margin: 0 0 10px; }
                        .stats { display: flex; gap: 15px; margin: 15px 0; }
                        .stat { background: #e9e9e9; padding: 10px; border-radius: 8px; text-align: center; flex: 1; }
                        .stat-value { font-size: 22px; font-weight: bold; }
                        .penalties { background: #ffe6e6; color: #c00; padding: 10px 20px; border-radius: 30px; display: inline-block; margin-left: 10px; }
                        .manual-penalties { background: #fff3e0; color: #e67e22; padding: 10px 20px; border-radius: 30px; display: inline-block; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background: #333; color: #fff; padding: 12px; }
                        td { padding: 10px; border-bottom: 1px solid #ddd; text-align: center; }
                        .footer { margin-top: 30px; text-align: center; color: #777; }
                        ul { margin: 10px 0; }
                        .section-title { font-size: 18px; font-weight: bold; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                    </style>
                </head>
                <body>
                    <div class="report-header">
                        <h1>تقرير أداء الموظف</h1>
                        <p>تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</p>
                    </div>
                    <div class="employee-info">
                        <div class="employee-details">
                            <h2>${this.escapeHtml(employee.fullName)}</h2>
                            <p><strong>المسمى:</strong> ${this.getRoleName(employee.role)} | <strong>القسم:</strong> ${this.escapeHtml(employee.departmentName || '')}</p>
                            <p><strong>البريد:</strong> ${this.escapeHtml(employee.email || '')}</p>
                            <div class="stats">
                                <div class="stat"><div class="stat-value">${employee.tasks?.tasksOnTime || 0}</div><div>مهام في موعدها</div></div>
                                <div class="stat"><div class="stat-value">${employee.tasks?.tasksInProgress || 0}</div><div>قيد التنفيذ</div></div>
                                <div class="stat"><div class="stat-value">${employee.tasks?.tasksOverdue || 0}</div><div>متأخرة</div></div>
                            </div>
                            <div>
                                <span class="penalties">⚠️ ${employee.penaltiesCount || 0} جزاء عادي</span>
                                <span class="manual-penalties">📉 نسبة الخصم الإجمالية: ${discountPercentage}</span>
                                <span style="background: #ffd700; padding: 8px 15px; border-radius: 30px; margin-right: 10px;">⭐ ${ratingDisplay} / 10</span>
                            </div>
                            <div class="section-title">الجزاءات العادية</div>
                            <ul>${regularPenaltiesRows}</ul>
                            <div class="section-title">الجزاءات اليدوية</div>
                            <ul>${manualPenaltiesRows}</ul>
                        </div>
                    </div>
                    <h3>قائمة المهام</h3>
                    <table>
                        <thead><tr><th>المهمة</th><th>الحالة</th><th>تاريخ الاستحقاق</th><th>تاريخ الإنجاز</th></tr></thead>
                        <tbody>${tasksRows}</tbody>
                    </table>
                    <div class="footer">تم إنشاء هذا التقرير بواسطة نظام إدارة المؤسسة</div>
                </body>
                </html>
            `;

            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        }

        async loadTopEmployees() {
            try {
                const params = new URLSearchParams();
                params.append('limit', '5');
                if (this.dateRange.start && this.dateRange.end) {
                    params.append('startDate', this.dateRange.start);
                    params.append('endDate', this.dateRange.end);
                }
                const response = await this.request(`/api/admin/stats/top-employees?${params.toString()}`);
                if (response.success && response.data) {
                    this.renderTopEmployees(response.data);
                }
            } catch (error) {
                console.error('❌ loadTopEmployees error:', error);
            }
        }

        renderTopEmployees(employees) {
            const container = document.getElementById('top-employees-list');
            if (!container) return;

            if (!employees || employees.length === 0) {
                container.innerHTML = '<div class="empty-state">لا توجد بيانات</div>';
                return;
            }

            let html = '';
            employees.forEach((emp, index) => {
                const ratingDisplay = formatRating(emp.rating);
                html += `
                    <div class="top-employee-item">
                        <div class="top-employee-rank">${index + 1}</div>
                        <div class="top-employee-info">
                            <div class="top-employee-name">${this.escapeHtml(emp.fullName)}</div>
                            <div class="top-employee-dept">${this.escapeHtml(emp.departmentName || '')}</div>
                        </div>
                        <div class="top-employee-rating">⭐ ${ratingDisplay}</div>
                    </div>
                `;
            });
            container.innerHTML = html;
        }

        populateDepartmentSelect(departments) {
            const select = document.getElementById('chart-department-select');
            if (!select) return;
            
            select.innerHTML = '<option value="all">جميع الأقسام</option>';
            if (departments) {
                departments.forEach(dept => {
                    select.innerHTML += `<option value="${dept.id}">${this.escapeHtml(dept.name)}</option>`;
                });
            }
            
            if (select.getAttribute('data-listener') !== 'true') {
                select.addEventListener('change', () => this.updateChart());
                select.setAttribute('data-listener', 'true');
            }
        }

        async updateChart() {
            try {
                const select = document.getElementById('chart-department-select');
                const departmentId = select ? select.value : 'all';
                
                const params = new URLSearchParams();
                params.append('departmentId', departmentId);
                if (this.dateRange.start && this.dateRange.end) {
                    params.append('startDate', this.dateRange.start);
                    params.append('endDate', this.dateRange.end);
                }
                const response = await this.request(`/api/admin/stats/tasks-chart?${params.toString()}`);
                if (response.success && response.data) {
                    const data = response.data;
                    this.renderChart(data.completed || 0, data.inProgress || 0, data.overdue || 0);
                }
            } catch (error) {
                console.error('❌ updateChart error:', error);
            }
        }

        renderChart(completed, inProgress, overdue) {
            const canvas = document.getElementById('tasks-chart');
            if (!canvas) return;

            if (this.chartInstance) {
                this.chartInstance.destroy();
            }

            const ctx = canvas.getContext('2d');
            this.chartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['في موعدها', 'قيد التنفيذ', 'متأخرة'],
                    datasets: [{
                        data: [completed, inProgress, overdue],
                        backgroundColor: ['#2C2C2C', '#4A4A4A', '#6B6B6B'],
                        borderColor: ['#1E1E1E', '#2C2C2C', '#3A3A3A'],
                        borderWidth: 2
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
                                font: { family: 'Tajawal', size: 12 } 
                            } 
                        },
                        tooltip: { 
                            backgroundColor: '#111', 
                            titleColor: '#fff', 
                            bodyColor: '#ccc' 
                        }
                    }
                }
            });
        }

        setupEventListeners() {
            const closeDeptBtn = document.getElementById('close-department-details');
            if (closeDeptBtn) {
                closeDeptBtn.addEventListener('click', () => {
                    document.getElementById('department-details-card').style.display = 'none';
                    this.selectedDepartmentId = null;
                });
            }

            const refreshBtn = document.getElementById('refresh-btn');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => {
                    this.loadAllData();
                    this.showNotification('success', 'تم التحديث', 'تم تحديث البيانات');
                });
            }

            const viewTopLink = document.getElementById('view-top-employees');
            if (viewTopLink) {
                viewTopLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showNotification('info', 'قريباً', 'سيتم عرض جميع الموظفين المتميزين');
                });
            }

            window.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal')) {
                    e.target.classList.remove('active');
                }
            });
        }

        setupMobileMenu() {
            const menuToggle = document.getElementById('menu-toggle');
            const sidebar = document.getElementById('dashboard-sidebar');
            const sidebarClose = document.getElementById('sidebar-close');
            const backdrop = document.getElementById('sidebar-backdrop');
            const body = document.body;

            if (!menuToggle || !sidebar) return;

            const toggleSidebar = (open) => {
                if (open) {
                    sidebar.classList.add('active');
                    backdrop.classList.add('active');
                    body.style.overflow = 'hidden';
                    body.classList.add('sidebar-open');
                } else {
                    sidebar.classList.remove('active');
                    backdrop.classList.remove('active');
                    body.style.overflow = '';
                    body.classList.remove('sidebar-open');
                }
            };

            menuToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleSidebar(!sidebar.classList.contains('active'));
            });

            if (sidebarClose) {
                sidebarClose.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleSidebar(false);
                });
            }

            if (backdrop) {
                backdrop.addEventListener('click', (e) => {
                    e.preventDefault();
                    toggleSidebar(false);
                });
            }

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && sidebar.classList.contains('active')) {
                    toggleSidebar(false);
                }
            });
        }

        updateSystemTime() {
            const timeEl = document.getElementById('system-time');
            if (timeEl) {
                const now = new Date();
                const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
                const dateStr = now.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                timeEl.textContent = `${timeStr} - ${dateStr}`;
            }
        }

        showLoading() {
            const grid = document.getElementById('departments-grid');
            if (grid && grid.children.length === 0) {
                grid.innerHTML = '<div class="loading-spinner" style="text-align:center; padding:2rem;"><i class="fas fa-spinner fa-spin"></i> جاري التحميل...</div>';
            }
        }

        hideLoading() {
            // سيتم استبدال المحتوى لاحقاً
        }

        showNotification(type, title, message) {
            const area = document.getElementById('notification-area');
            if (!area) return;
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = `
                <div class="notification-icon"><i class="fas ${this.getNotificationIcon(type)}"></i></div>
                <div class="notification-content"><h4>${title}</h4><p>${message}</p></div>
                <button class="notification-close"><i class="fas fa-times"></i></button>
            `;
            area.appendChild(notification);
            setTimeout(() => notification.classList.add('show'), 10);
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 5000);
            notification.querySelector('.notification-close').addEventListener('click', () => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            });
        }

        getNotificationIcon(type) {
            const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
            return icons[type] || 'fa-info-circle';
        }

        escapeHtml(str) {
            if (!str) return '';
            return str.replace(/[&<>]/g, function(m) {
                if (m === '&') return '&amp;';
                if (m === '<') return '&lt;';
                if (m === '>') return '&gt;';
                return m;
            });
        }
    }

    // بدء التطبيق
    new StatsManager();
})();