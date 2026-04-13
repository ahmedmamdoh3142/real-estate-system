// TaskFlow Pro - نظام إدارة المهام المتقدم (نسخة معتمدة على API 100%)
// @version 16.1.0 (تم إزالة تعديل المهام، إظهار الجزاءات للمشرف العام)

(function() {
    'use strict';

    console.log('✅ tasks.js loaded - TASK MANAGEMENT MODULE v16.1.0');

    class TasksManager {
        constructor() {
            this.baseURL = '';
            this.currentUser = null;
            this.userPermissions = [];
            this.tasks = [];
            this.requestsReceived = [];
            this.requestsSent = [];
            this.purchasesReceived = [];
            this.purchasesSent = [];
            this.penalties = [];
            this.manualPenalties = [];
            this.appointments = [];
            this.filteredTasks = [];
            this.currentView = 'board';
            this.calendarMode = 'appointments';
            this.filters = {
                status: 'all',
                priority: 'all',
                assignee: 'all',
                dueDate: 'all',
                project: 'all'
            };
            this.savedFilters = ['كل المهام', 'مخصص لي', 'عالية الأولوية', 'المتأخرة', 'تتطلب مراجعة'];
            this.selectedTask = null;
            this.selectedPurchase = null;
            this.selectedPenalty = null;
            this.selectedManualPenalty = null;
            this.selectedAppointment = null;
            this.selectedRequest = null;
            this.isLoading = false;
            this.charts = {};
            this.calendarCurrentDate = new Date();
            
            this.users = {};
            this.projects = {};
            this.departments = {};

            // الترجمة الكاملة (العربية والإنجليزية) - نفس المحتوى السابق
            this.translations = {
                ar: {
                    appName: 'TaskFlow Pro',
                    searchPlaceholder: 'ابحث عن مهمة، مشروع، تعليق، أو شخص...',
                    searchResults: 'نتائج البحث',
                    searchEmpty: 'ابدأ الكتابة للبحث...',
                    advancedSearch: 'بحث متقدم',
                    notifications: 'الإشعارات',
                    markAllRead: 'تحديد الكل كمقروء',
                    viewAll: 'عرض كل الإشعارات',
                    profile: 'الملف الشخصي',
                    settings: 'الإعدادات',
                    logout: 'تسجيل الخروج',
                    main: 'الرئيسية',
                    dashboard: 'لوحة التحكم',
                    propertyManagement: 'إدارة العقارات',
                    projects: 'المشاريع',
                    contracts: 'العقود',
                    payments: 'المدفوعات',
                    taskManagement: 'إدارة المهام (جديد)',
                    tasksBoard: 'لوحة المهام',
                    new: 'جديد',
                    taskReports: 'تقارير المهام',
                    taskTemplates: 'قوالب المهام',
                    administration: 'الإدارة',
                    users: 'المستخدمين',
                    systemActive: 'النظام يعمل',
                    advancedTaskPlatform: 'منصة إدارة المهام المتقدمة',
                    platformDescription: 'نظام متكامل لإدارة مهام الفرق والمشاريع مع تتبع دقيق، إشعارات ذكية، وتحليلات أداء لحظية.',
                    newTask: 'مهمة جديدة',
                    newRequest: 'طلب جديد',
                    newPurchase: 'طلب شراء',
                    importTasks: 'استيراد مهام',
                    export: 'تصدير',
                    printBoard: 'طباعة اللوحة',
                    archiveAll: 'أرشفة الكل',
                    boardView: 'عرض اللوحة (كانبان)',
                    listView: 'عرض القائمة',
                    calendarView: 'عرض التقويم',
                    totalTasks: 'إجمالي المهام',
                    completed: 'مكتملة',
                    inProgress: 'قيد التنفيذ',
                    overdue: 'متأخرة',
                    totalAppointments: 'إجمالي المواعيد',
                    teamMembers: 'أعضاء الفريق',
                    requests: 'الطلبات',
                    purchases: 'طلبات شراء',
                    penalties: 'الجزاءات',
                    manualPenalties: 'الجزاءات اليدوية',
                    newManualPenalty: 'جزاء جديد',
                    addManualPenalty: 'إضافة جزاء يدوي',
                    manualPenaltyDetails: 'تفاصيل الجزاء اليدوي',
                    selectEmployee: 'اختر الموظف',
                    discountPercentage: 'نسبة الخصم (%)',
                    status: 'الحالة',
                    all: 'الكل',
                    todo: 'بانتظار',
                    review: 'مراجعة',
                    done: 'مكتمل',
                    priority: 'الأولوية',
                    urgent: 'عاجل',
                    high: 'مرتفع',
                    medium: 'متوسط',
                    low: 'منخفض',
                    assignee: 'المسؤول',
                    assignedToMe: 'مخصص لي',
                    dueDate: 'تاريخ الاستحقاق',
                    today: 'اليوم',
                    tomorrow: 'غداً',
                    noDate: 'بدون تاريخ',
                    project: 'المشروع',
                    allProjects: 'جميع المشاريع',
                    clear: 'مسح',
                    save: 'حفظ',
                    allTasks: 'كل المهام',
                    highPriority: 'عالية الأولوية',
                    overdueTasks: 'المتأخرة',
                    needsReview: 'تتطلب مراجعة',
                    saveFilter: 'حفظ الفلتر',
                    tasksSent: 'المهام المرسلة',
                    tasksReceived: 'المهام المستلمة',
                    subtasks: 'المهام الفرعية',
                    archivedTasks: 'المؤرشفة والمكتملة نهائياً',
                    overdueTasksShort: 'متأخرة: 0',
                    completedTasksShort: 'منجزة: 0',
                    addNewTask: 'إضافة مهمة جديدة',
                    urgentTasksShort: 'مستعجلة: 0',
                    newTasksShort: 'جديدة: 0',
                    newRequestShort: 'طلب جديد',
                    addNewPurchase: 'إضافة طلب شراء',
                    penaltiesAuto: 'الجزاءات تظهر تلقائياً',
                    clearAllPenalties: 'إزالة الكل',
                    edit: 'تعديل',
                    delete: 'حذف',
                    archive: 'أرشفة',
                    progress: 'التقدم',
                    escalatedAuto: 'تصعيد تلقائي',
                    escalated: 'متصاعدة',
                    escalatedLevel: 'متصاعدة (مستوى {level})',
                    escalatedToGM: 'متصاعدة للمدير العام',
                    quickAddTask: 'إضافة مهمة جديدة',
                    from: 'من: {name}',
                    to: 'إلى: {name}',
                    todayAt: 'اليوم {time}',
                    tomorrowAt: 'غداً {time}',
                    start: 'ابدأ',
                    completedBy: 'تمت بنجاح - موافقة {approver}',
                    completedByUser: 'مكتملة بواسطة: {name}',
                    deliveredForPrint: 'تم التسليم للطباعة.',
                    restoreArchivedTask: 'استعادة مهمة مؤرشفة',
                    taskTimeline: 'الجدول الزمني للمهام',
                    refresh: 'تحديث',
                    sun: 'الأحد',
                    mon: 'الإثنين',
                    tue: 'الثلاثاء',
                    wed: 'الأربعاء',
                    thu: 'الخميس',
                    fri: 'الجمعة',
                    sat: 'السبت',
                    analyticsReports: 'تحليلات الأداء والتقارير',
                    last7Days: 'آخر 7 أيام',
                    last30Days: 'آخر 30 يوم',
                    last3Months: 'آخر 3 شهور',
                    lastYear: 'آخر سنة',
                    tasksByStatus: 'توزيع المهام حسب الحالة',
                    tasksByPriority: 'توزيع المهام حسب الأولوية',
                    tasksByProject: 'توزيع المهام حسب المشروع',
                    teamPerformance: 'أداء الفريق (حمل العمل) - حسب الأقسام',
                    tasks: 'مهام',
                    active: '⚡نشط',
                    escalationIndicators: 'مؤشرات التصعيد',
                    escalatedThisWeek: 'مهام متصاعدة هذا الأسبوع',
                    avgEscalationTime: 'متوسط وقت التصعيد',
                    hour: 'ساعة',
                    realEstateSystem: 'نظام إدارة العقارات المتكامل',
                    lastUpdate: 'آخر تحديث: 1 مارس 2026 | جميع الحقوق محفوظة',
                    helpSupport: 'المساعدة والدعم',
                    guide: 'الدليل التعريفي',
                    privacy: 'سياسة الخصوصية',
                    terms: 'شروط الاستخدام',
                    taskDetails: 'تفاصيل المهمة',
                    loading: 'جاري تحميل التفاصيل...',
                    close: 'إغلاق',
                    editTask: 'تعديل المهمة',
                    addSubtask: 'إضافة مهمة فرعية',
                    createNewTask: 'إنشاء مهمة جديدة',
                    createNewRequest: 'إنشاء طلب جديد',
                    createNewPurchase: 'إنشاء طلب شراء جديد',
                    taskTitle: 'عنوان المهمة',
                    taskTitlePlaceholder: 'أدخل عنوان المهمة',
                    description: 'الوصف',
                    descriptionPlaceholder: 'تفاصيل المهمة...',
                    relatedProject: 'المشروع المرتبط',
                    noProject: 'بدون مشروع',
                    assignTo: 'تعيين إلى',
                    multiSelectHint: 'يمكنك اختيار أكثر من شخص (Ctrl+Click)',
                    none: 'لا شيء (مهمة رئيسية)',
                    recurring: 'تكرار المهمة',
                    noRepeat: 'لا تتكرر',
                    daily: 'يومي',
                    weekly: 'أسبوعي',
                    monthly: 'شهري',
                    checklist: 'قائمة تحقق (Checklist)',
                    addItem: 'إضافة بند',
                    cancel: 'إلغاء',
                    createTask: 'إنشاء مهمة',
                    create: 'إنشاء',
                    updateProgress: 'تحديث نسبة الإنجاز',
                    progressPercentage: 'نسبة الإنجاز %',
                    autoStatusUpdate: 'تحديث الحالة تلقائياً',
                    statusSuggestion: 'عند 0%: بانتظار، 100%: مكتمل',
                    noteOptional: 'ملاحظة (اختياري)',
                    progressNotePlaceholder: 'ماذا أنجزت؟',
                    attachFile: 'إرفاق صورة أو ملف',
                    update: 'تحديث',
                    commentsThread: 'المحادثة والتعليقات',
                    hoursAgo: 'منذ {count} ساعة',
                    writeComment: 'اكتب تعليقك...',
                    send: 'إرسال',
                    attachments: 'المرفقات',
                    uploadNewFile: 'رفع ملف جديد',
                    upcomingTasks: 'المهام القادمة',
                    clearFilters: 'مسح جميع الفلاتر',
                    saveFilterTitle: 'حفظ الفلتر الحالي',
                    parentOf: 'تابعة لـ: {title}',
                    department: '+قسم',
                    departmentProgress: 'تقدم القسم',
                    mainTaskWithTitle: 'مهمة رئيسية: {title}',
                    subtasksCount: '{count} مهام فرعية',
                    bookHall: 'حجز القاعة والضيافة',
                    printInvitations: 'طباعة وتصميم الدعوات',
                    prepareGifts: 'تجهيز الهدايا التذكارية',
                    escalatedAutoTitle: 'تم التصعيد تلقائياً - المهمة متأخرة 72 ساعة',
                    updateProgressTitle: 'تحديث النسبة',
                    clearArchiveTitle: 'تفريغ الأرشفة',
                    projectManager: 'مدير مشاريع',
                    appointments: 'المواعيد',
                    newAppointment: 'معاد جديد',
                    appointmentTitle: 'عنوان المعاد',
                    appointmentTitlePlaceholder: 'أدخل عنوان المعاد',
                    appointmentDate: 'التاريخ',
                    appointmentTime: 'الوقت',
                    appointmentLocation: 'المكان',
                    appointmentAttendees: 'الحضور',
                    appointmentType: 'نوع المعاد',
                    meeting: 'اجتماع',
                    call: 'مكالمة',
                    visit: 'زيارة',
                    other: 'أخرى',
                    appointmentsForDay: 'مواعيد هذا اليوم',
                    noAppointments: 'لا توجد مواعيد في هذا اليوم',
                    appointmentDetails: 'تفاصيل المعاد',
                    attendees: 'الحضور',
                    location: 'المكان',
                    notes: 'ملاحظات',
                    delegationHistory: 'سجل الإحالات',
                    comments: 'التعليقات',
                    activity: 'النشاط',
                    noDelegationHistory: 'لا يوجد سجل إحالات',
                    noSubtasks: 'لا توجد مهام فرعية',
                    noComments: 'لا توجد تعليقات',
                    noActivity: 'لا يوجد نشاط',
                    removePenalty: 'إزالة الجزاء',
                    confirmRemovePenalty: 'هل أنت متأكد من إزالة هذا الجزاء؟ (لن يؤثر على المهمة الأصلية)',
                    purchaseItem: 'العنصر المراد شراؤه',
                    purchaseItemPlaceholder: 'مثال: طابعة، كرسي مكتب، ...',
                    quantity: 'الكمية',
                    urgency: 'الأولوية',
                    normal: 'عادي',
                    purchaseDescriptionPlaceholder: 'مواصفات إضافية...',
                    assignees: 'المسؤولون',
                    basicInfo: 'المعلومات الأساسية',
                    stats: 'الإحصائيات',
                    dependencies: 'التبعيات',
                    created: 'تاريخ الإنشاء',
                    lastUpdated: 'آخر تحديث',
                    parentTask: 'المهمة الأم',
                    dependsOn: 'تعتمد على',
                    notSpecified: 'غير محدد',
                    yes: 'نعم',
                    no: 'لا',
                    escalatedToLevel: 'تم التصعيد للمستوى {level} - {to}',
                    createdBy: 'تم الإنشاء بواسطة {name}',
                    uploadedOn: 'تم الرفع في',
                    item: 'بند',
                    noChecklist: 'لا توجد بنود تحقق',
                    you: 'أنت',
                    now: 'الآن',
                    subtask: 'مهمة فرعية',
                    enterTaskTitle: 'الرجاء إدخال عنوان المهمة',
                    taskCreated: 'تم إنشاء المهمة بنجاح',
                    taskDeleted: 'تم حذف المهمة',
                    taskArchived: 'تم أرشفة المهمة',
                    taskRestored: 'تم استعادة المهمة',
                    taskUpdated: 'تم تحديث المهمة',
                    taskStarted: 'تم بدء المهمة',
                    subtasksCreated: 'تم إنشاء {count} مهام فرعية',
                    commentAdded: 'تم إضافة التعليق',
                    progressUpdated: 'تم تحديث التقدم إلى {progress}%',
                    checklistUpdated: 'تم تحديث قائمة التحقق',
                    allMarkedRead: 'تم تحديد الكل كمقروء',
                    reportExported: 'تم تصدير التقرير',
                    filtersCleared: 'تم مسح الفلاتر',
                    tasksFound: 'تم العثور على {count} مهمة',
                    filterSaved: 'تم حفظ الفلتر "{name}"',
                    noResults: 'لا توجد نتائج',
                    taskOrderUpdated: 'تم تحديث ترتيب المهام',
                    taskStatusUpdated: 'تم تحديث الحالة إلى {status}',
                    cannotUpdateProgress: 'لا يمكن تحديث تقدم هذه المهمة',
                    cannotStartTask: 'لا يمكن بدء هذه المهمة',
                    archiveConfirm: 'هل تريد أرشفة هذه المهمة؟',
                    deleteConfirm: 'هل أنت متأكد من حذف هذه المهمة؟',
                    enterFilterName: 'أدخل اسم الفلتر',
                    statusSuggestionAt0: 'بانتظار',
                    statusSuggestionAt100: 'مكتمل',
                    statusSuggestionStart: 'قيد التنفيذ',
                    statusSuggestionMid: 'قيد التنفيذ',
                    statusSuggestionReview: 'مراجعة',
                    directManager: 'المدير المباشر',
                    deptManager: 'مدير القسم',
                    generalManager: 'المدير العام',
                    taskEscalated: 'تم تصعيد المهمة "{title}"',
                    taskEscalatedLevel: 'تم تصعيد المهمة "{title}" إلى المستوى {level}',
                    timelineUpdated: 'تم تحديث الجدول الزمني',
                    chartsUpdated: 'تم تحديث الرسوم البيانية',
                    noArchivedTasks: 'لا توجد مهام مؤرشفة',
                    requestTitle: 'عنوان الطلب',
                    requestTitlePlaceholder: 'أدخل عنوان الطلب',
                    requestCreated: 'تم إنشاء الطلب بنجاح',
                    requestDeleted: 'تم حذف الطلب',
                    selectAssignee: 'اختر مسؤولاً',
                    subtaskHint: 'يمكنك إضافة عدة مهام فرعية، وسيتم تعيين كل منها لشخص محدد.',
                    addSubtaskRow: 'إضافة مهمة فرعية',
                    addNewRequest: 'إضافة طلب جديد',
                    purchaseCreated: 'تم إنشاء طلب الشراء بنجاح',
                    purchaseDeleted: 'تم حذف طلب الشراء',
                    penaltyRemoved: 'تم إزالة الجزاء',
                    allPenaltiesCleared: 'تم إزالة جميع الجزاءات',
                    voiceInputListening: 'تحدث الآن...',
                    voiceInputError: 'حدث خطأ في الإدخال الصوتي',
                    request: 'طلب',
                    purchase: 'شراء',
                    appointment: 'معاد',
                    saveDraft: 'حفظ كمسودة',
                    sendEmail: 'إرسال',
                    newItem: 'بند جديد',
                    reportCSVHeader: 'التقرير,القيمة',
                    noNotes: 'لا توجد ملاحظات',
                    noAssignees: 'لا يوجد مسؤولون',
                    requestsReceived: 'الطلبات المستلمة',
                    requestsSent: 'الطلبات المرسلة',
                    purchasesReceived: 'طلبات الشراء المستلمة',
                    purchasesSent: 'طلبات الشراء المرسلة',
                    viewDetails: 'عرض التفاصيل',
                    totalTasksSent: 'إجمالي المهام (مرسل)',
                    completedSent: 'مكتملة (مرسل)',
                    inProgressSent: 'قيد التنفيذ (مرسل)',
                    overdueSent: 'متأخرة (مرسل)',
                    totalTasksReceived: 'إجمالي المهام (مستلم)',
                    completedReceived: 'مكتملة (مستلم)',
                    inProgressReceived: 'قيد التنفيذ (مستلم)',
                    overdueReceived: 'متأخرة (مستلم)',
                    departmentName: 'القسم',
                    totalTasksDept: 'إجمالي المهام',
                    completedDept: 'مكتملة',
                    inProgressDept: 'قيد التنفيذ',
                    overdueDept: 'متأخرة',
                    rateTask: 'تقييم المهمة',
                    qualityScore: 'جودة التنفيذ (1-10)',
                    difficultyWeight: 'صعوبة المهمة',
                    submitRating: 'تقييم',
                    ratingSubmitted: 'تم إرسال التقييم بنجاح',
                    averageScore: 'متوسط التقييم',
                    timeScore: 'درجة الالتزام بالوقت',
                    finalScore: 'الدرجة النهائية',
                    statsSummary: 'ملخص الإحصائيات (المهام، الطلبات، الشراء، الجزاءات، الأرشفة)',
                    tasksCount: 'المهام',
                    requestsCount: 'الطلبات',
                    purchasesCount: 'طلبات الشراء',
                    penaltiesCount: 'الجزاءات',
                    archivedCount: 'المؤرشف',
                    reminderDateTime: 'تاريخ ووقت التذكير',
                    reminderSent: 'تم إرسال التذكير',
                    tasksDue: 'المهام المستحقة',
                    dueTasksForDay: 'المهام المستحقة لهذا اليوم',
                    noDueTasks: 'لا توجد مهام مستحقة في هذا اليوم',
                    reminderNotification: '🔔 تذكير: {title}',
                    reminderMessage: 'هذا تذكير بالعنوان "{title}" المقرر في {datetime}.',
                    penaltyCreated: 'تم إنشاء جزاء للمهمة المتأخرة "{title}"',
                    subtaskOf: 'مهمة فرعية من',
                    manualPenaltyAdded: 'تم إضافة الجزاء اليدوي بنجاح',
                    manualPenaltyDeleted: 'تم حذف الجزاء اليدوي',
                    fillAllFields: 'الرجاء ملء جميع الحقول',
                    invalidPercentage: 'نسبة الخصم يجب أن تكون بين 0 و 100',
                    reason: 'السبب',
                    overdueDays: 'متأخر {days} أيام',
                    unknown: 'غير معروف',
                    notAssigned: 'غير معين',
                    recipient: 'المستلم',
                    sentTo: 'مرسل إلى',
                    newTaskBadge: 'جديد',
                    subtaskBadge: 'مهمة فرعية',
                    progressPercent: '{percent}%',
                    escalatedIndicator: 'متصاعدة (المستوى {level})',
                    manualPenaltyCardTitle: '{name} (نسبة الخصم: {percentage}%)',
                    manualPenaltyReasonLabel: 'السبب:',
                    manualPenaltyCreatedByLabel: 'تم الإنشاء بواسطة:',
                    manualPenaltyDateLabel: 'التاريخ:'
                },
                en: {
                    appName: 'TaskFlow Pro',
                    searchPlaceholder: 'Search for tasks, projects, comments, or people...',
                    searchResults: 'Search Results',
                    searchEmpty: 'Start typing to search...',
                    advancedSearch: 'Advanced Search',
                    notifications: 'Notifications',
                    markAllRead: 'Mark all as read',
                    viewAll: 'View all notifications',
                    profile: 'Profile',
                    settings: 'Settings',
                    logout: 'Logout',
                    main: 'Main',
                    dashboard: 'Dashboard',
                    propertyManagement: 'Property Management',
                    projects: 'Projects',
                    contracts: 'Contracts',
                    payments: 'Payments',
                    taskManagement: 'Task Management (New)',
                    tasksBoard: 'Tasks Board',
                    new: 'New',
                    taskReports: 'Task Reports',
                    taskTemplates: 'Task Templates',
                    administration: 'Administration',
                    users: 'Users',
                    systemActive: 'System Active',
                    advancedTaskPlatform: 'Advanced Task Management Platform',
                    platformDescription: 'An integrated system for managing team and project tasks with accurate tracking, smart notifications, and real-time performance analytics.',
                    newTask: 'New Task',
                    newRequest: 'New Request',
                    newPurchase: 'Purchase Request',
                    importTasks: 'Import Tasks',
                    export: 'Export',
                    printBoard: 'Print Board',
                    archiveAll: 'Archive All',
                    boardView: 'Board View (Kanban)',
                    listView: 'List View',
                    calendarView: 'Calendar View',
                    totalTasks: 'Total Tasks',
                    completed: 'Completed',
                    inProgress: 'In Progress',
                    overdue: 'Overdue',
                    totalAppointments: 'Total Appointments',
                    teamMembers: 'Team Members',
                    requests: 'Requests',
                    purchases: 'Purchase Requests',
                    penalties: 'Penalties',
                    manualPenalties: 'Manual Penalties',
                    newManualPenalty: 'New Penalty',
                    addManualPenalty: 'Add Manual Penalty',
                    manualPenaltyDetails: 'Manual Penalty Details',
                    selectEmployee: 'Select Employee',
                    discountPercentage: 'Discount Percentage (%)',
                    status: 'Status',
                    all: 'All',
                    todo: 'To Do',
                    review: 'Review',
                    done: 'Done',
                    priority: 'Priority',
                    urgent: 'Urgent',
                    high: 'High',
                    medium: 'Medium',
                    low: 'Low',
                    assignee: 'Assignee',
                    assignedToMe: 'Assigned to me',
                    dueDate: 'Due Date',
                    today: 'Today',
                    tomorrow: 'Tomorrow',
                    noDate: 'No Date',
                    project: 'Project',
                    allProjects: 'All Projects',
                    clear: 'Clear',
                    save: 'Save',
                    allTasks: 'All Tasks',
                    highPriority: 'High Priority',
                    overdueTasks: 'Overdue',
                    needsReview: 'Needs Review',
                    saveFilter: 'Save Filter',
                    tasksSent: 'Tasks Sent',
                    tasksReceived: 'Tasks Received',
                    subtasks: 'Subtasks',
                    archivedTasks: 'Archived & Completed',
                    overdueTasksShort: 'Overdue: 0',
                    completedTasksShort: 'Completed: 0',
                    addNewTask: 'Add New Task',
                    urgentTasksShort: 'Urgent: 0',
                    newTasksShort: 'New: 0',
                    newRequestShort: 'New Request',
                    addNewPurchase: 'Add Purchase Request',
                    penaltiesAuto: 'Penalties appear automatically',
                    clearAllPenalties: 'Clear All',
                    edit: 'Edit',
                    delete: 'Delete',
                    archive: 'Archive',
                    progress: 'Progress',
                    escalatedAuto: 'Auto Escalated',
                    escalated: 'Escalated',
                    escalatedLevel: 'Escalated (Level {level})',
                    escalatedToGM: 'Escalated to GM',
                    quickAddTask: 'Quick Add Task',
                    from: 'From: {name}',
                    to: 'To: {name}',
                    todayAt: 'Today at {time}',
                    tomorrowAt: 'Tomorrow at {time}',
                    start: 'Start',
                    completedBy: 'Completed - Approved by {approver}',
                    completedByUser: 'Completed by: {name}',
                    deliveredForPrint: 'Delivered for print.',
                    restoreArchivedTask: 'Restore Archived Task',
                    taskTimeline: 'Task Timeline',
                    refresh: 'Refresh',
                    sun: 'Sun',
                    mon: 'Mon',
                    tue: 'Tue',
                    wed: 'Wed',
                    thu: 'Thu',
                    fri: 'Fri',
                    sat: 'Sat',
                    analyticsReports: 'Analytics & Reports',
                    last7Days: 'Last 7 Days',
                    last30Days: 'Last 30 Days',
                    last3Months: 'Last 3 Months',
                    lastYear: 'Last Year',
                    tasksByStatus: 'Tasks by Status',
                    tasksByPriority: 'Tasks by Priority',
                    tasksByProject: 'Tasks by Project',
                    teamPerformance: 'Team Performance (Workload) - by Departments',
                    tasks: 'tasks',
                    active: '⚡Active',
                    escalationIndicators: 'Escalation Indicators',
                    escalatedThisWeek: 'Escalated this week',
                    avgEscalationTime: 'Avg. escalation time',
                    hour: 'hour',
                    realEstateSystem: 'Real Estate Management System',
                    lastUpdate: 'Last update: March 1, 2026 | All rights reserved',
                    helpSupport: 'Help & Support',
                    guide: 'User Guide',
                    privacy: 'Privacy Policy',
                    terms: 'Terms of Use',
                    taskDetails: 'Task Details',
                    loading: 'Loading details...',
                    close: 'Close',
                    editTask: 'Edit Task',
                    addSubtask: 'Add Subtask',
                    createNewTask: 'Create New Task',
                    createNewRequest: 'Create New Request',
                    createNewPurchase: 'Create New Purchase Request',
                    taskTitle: 'Task Title',
                    taskTitlePlaceholder: 'Enter task title',
                    description: 'Description',
                    descriptionPlaceholder: 'Task details...',
                    relatedProject: 'Related Project',
                    noProject: 'No Project',
                    assignTo: 'Assign to',
                    multiSelectHint: 'You can select multiple people (Ctrl+Click)',
                    none: 'None (Main Task)',
                    recurring: 'Recurring',
                    noRepeat: 'No repeat',
                    daily: 'Daily',
                    weekly: 'Weekly',
                    monthly: 'Monthly',
                    checklist: 'Checklist',
                    addItem: 'Add Item',
                    cancel: 'Cancel',
                    createTask: 'Create Task',
                    create: 'Create',
                    updateProgress: 'Update Progress',
                    progressPercentage: 'Progress %',
                    autoStatusUpdate: 'Auto Status Update',
                    statusSuggestion: 'At 0%: To Do, 100%: Done',
                    noteOptional: 'Note (optional)',
                    progressNotePlaceholder: 'What have you accomplished?',
                    attachFile: 'Attach file',
                    update: 'Update',
                    commentsThread: 'Comments Thread',
                    hoursAgo: '{count} hours ago',
                    writeComment: 'Write your comment...',
                    send: 'Send',
                    attachments: 'Attachments',
                    uploadNewFile: 'Upload New File',
                    upcomingTasks: 'Upcoming Tasks',
                    clearFilters: 'Clear all filters',
                    saveFilterTitle: 'Save current filter',
                    parentOf: 'Parent of: {title}',
                    department: '+Dept',
                    departmentProgress: 'Department Progress',
                    mainTaskWithTitle: 'Main Task: {title}',
                    subtasksCount: '{count} subtasks',
                    bookHall: 'Book hall & catering',
                    printInvitations: 'Print & design invitations',
                    prepareGifts: 'Prepare souvenirs',
                    escalatedAutoTitle: 'Auto escalated - task overdue 72 hours',
                    updateProgressTitle: 'Update progress',
                    clearArchiveTitle: 'Clear archive',
                    projectManager: 'Project Manager',
                    appointments: 'Appointments',
                    newAppointment: 'New Appointment',
                    appointmentTitle: 'Appointment Title',
                    appointmentTitlePlaceholder: 'Enter appointment title',
                    appointmentDate: 'Date',
                    appointmentTime: 'Time',
                    appointmentLocation: 'Location',
                    appointmentAttendees: 'Attendees',
                    appointmentType: 'Type',
                    meeting: 'Meeting',
                    call: 'Call',
                    visit: 'Visit',
                    other: 'Other',
                    appointmentsForDay: 'Appointments for this day',
                    noAppointments: 'No appointments on this day',
                    appointmentDetails: 'Appointment Details',
                    attendees: 'Attendees',
                    location: 'Location',
                    notes: 'Notes',
                    delegationHistory: 'Delegation History',
                    comments: 'Comments',
                    activity: 'Activity',
                    noDelegationHistory: 'No delegation history',
                    noSubtasks: 'No subtasks',
                    noComments: 'No comments',
                    noActivity: 'No activity',
                    removePenalty: 'Remove Penalty',
                    confirmRemovePenalty: 'Are you sure you want to remove this penalty? (Original task remains unchanged)',
                    purchaseItem: 'Item to purchase',
                    purchaseItemPlaceholder: 'e.g., Printer, Office Chair, ...',
                    quantity: 'Quantity',
                    urgency: 'Urgency',
                    normal: 'Normal',
                    purchaseDescriptionPlaceholder: 'Additional specifications...',
                    assignees: 'Assignees',
                    basicInfo: 'Basic Info',
                    stats: 'Statistics',
                    dependencies: 'Dependencies',
                    created: 'Created',
                    lastUpdated: 'Last Updated',
                    parentTask: 'Parent Task',
                    dependsOn: 'Depends On',
                    notSpecified: 'Not specified',
                    yes: 'Yes',
                    no: 'No',
                    escalatedToLevel: 'Escalated to level {level} - {to}',
                    createdBy: 'Created by {name}',
                    uploadedOn: 'Uploaded on',
                    item: 'Item',
                    noChecklist: 'No checklist items',
                    you: 'You',
                    now: 'now',
                    subtask: 'Subtask',
                    enterTaskTitle: 'Please enter task title',
                    taskCreated: 'Task created successfully',
                    taskDeleted: 'Task deleted',
                    taskArchived: 'Task archived',
                    taskRestored: 'Task restored',
                    taskUpdated: 'Task updated',
                    taskStarted: 'Task started',
                    subtasksCreated: '{count} subtasks created',
                    commentAdded: 'Comment added',
                    progressUpdated: 'Progress updated to {progress}%',
                    checklistUpdated: 'Checklist updated',
                    allMarkedRead: 'All marked as read',
                    reportExported: 'Report exported',
                    filtersCleared: 'Filters cleared',
                    tasksFound: 'Found {count} tasks',
                    filterSaved: 'Filter "{name}" saved',
                    noResults: 'No results',
                    taskOrderUpdated: 'Task order updated',
                    taskStatusUpdated: 'Status updated to {status}',
                    cannotUpdateProgress: 'Cannot update progress for this task',
                    cannotStartTask: 'Cannot start this task',
                    archiveConfirm: 'Do you want to archive this task?',
                    deleteConfirm: 'Are you sure you want to delete this task?',
                    enterFilterName: 'Enter filter name',
                    statusSuggestionAt0: 'To Do',
                    statusSuggestionAt100: 'Done',
                    statusSuggestionStart: 'In Progress',
                    statusSuggestionMid: 'In Progress',
                    statusSuggestionReview: 'Review',
                    directManager: 'Direct Manager',
                    deptManager: 'Department Manager',
                    generalManager: 'General Manager',
                    taskEscalated: 'Task "{title}" escalated',
                    taskEscalatedLevel: 'Task "{title}" escalated to level {level}',
                    timelineUpdated: 'Timeline updated',
                    chartsUpdated: 'Charts updated',
                    noArchivedTasks: 'No archived tasks',
                    requestTitle: 'Request Title',
                    requestTitlePlaceholder: 'Enter request title',
                    requestCreated: 'Request created successfully',
                    requestDeleted: 'Request deleted',
                    purchaseCreated: 'Purchase request created successfully',
                    purchaseDeleted: 'Purchase request deleted',
                    penaltyRemoved: 'Penalty removed',
                    allPenaltiesCleared: 'All penalties cleared',
                    selectAssignee: 'Select assignee',
                    subtaskHint: 'You can add multiple subtasks, each assigned to a specific person.',
                    addSubtaskRow: 'Add Subtask',
                    addNewRequest: 'Add New Request',
                    voiceInputListening: 'Listening...',
                    voiceInputError: 'Voice input error',
                    request: 'Request',
                    purchase: 'Purchase',
                    appointment: 'Appointment',
                    saveDraft: 'Save Draft',
                    sendEmail: 'Send',
                    newItem: 'New item',
                    reportCSVHeader: 'Report,Value',
                    noNotes: 'No notes',
                    noAssignees: 'No assignees',
                    requestsReceived: 'Requests Received',
                    requestsSent: 'Requests Sent',
                    purchasesReceived: 'Purchase Requests Received',
                    purchasesSent: 'Purchase Requests Sent',
                    viewDetails: 'View Details',
                    totalTasksSent: 'Total Tasks (Sent)',
                    completedSent: 'Completed (Sent)',
                    inProgressSent: 'In Progress (Sent)',
                    overdueSent: 'Overdue (Sent)',
                    totalTasksReceived: 'Total Tasks (Received)',
                    completedReceived: 'Completed (Received)',
                    inProgressReceived: 'In Progress (Received)',
                    overdueReceived: 'Overdue (Received)',
                    departmentName: 'Department',
                    totalTasksDept: 'Total Tasks',
                    completedDept: 'Completed',
                    inProgressDept: 'In Progress',
                    overdueDept: 'Overdue',
                    rateTask: 'Rate Task',
                    qualityScore: 'Quality Score (1-10)',
                    difficultyWeight: 'Difficulty',
                    submitRating: 'Submit Rating',
                    ratingSubmitted: 'Rating submitted successfully',
                    averageScore: 'Average Score',
                    timeScore: 'Time Score',
                    finalScore: 'Final Score',
                    statsSummary: 'Statistics Summary (Tasks, Requests, Purchases, Penalties, Archived)',
                    tasksCount: 'Tasks',
                    requestsCount: 'Requests',
                    purchasesCount: 'Purchases',
                    penaltiesCount: 'Penalties',
                    archivedCount: 'Archived',
                    reminderDateTime: 'Reminder Date & Time',
                    reminderSent: 'Reminder Sent',
                    tasksDue: 'Due Tasks',
                    dueTasksForDay: 'Due tasks for this day',
                    noDueTasks: 'No due tasks on this day',
                    reminderNotification: '🔔 Reminder: {title}',
                    reminderMessage: 'This is a reminder for "{title}" scheduled at {datetime}.',
                    penaltyCreated: 'Penalty created for overdue task "{title}"',
                    subtaskOf: 'Subtask of',
                    manualPenaltyAdded: 'Manual penalty added successfully',
                    manualPenaltyDeleted: 'Manual penalty deleted',
                    fillAllFields: 'Please fill all fields',
                    invalidPercentage: 'Discount percentage must be between 0 and 100',
                    reason: 'Reason',
                    overdueDays: '{days} days overdue',
                    unknown: 'Unknown',
                    notAssigned: 'Not assigned',
                    recipient: 'Recipient',
                    sentTo: 'Sent to',
                    newTaskBadge: 'New',
                    subtaskBadge: 'Subtask',
                    progressPercent: '{percent}%',
                    escalatedIndicator: 'Escalated (Level {level})',
                    manualPenaltyCardTitle: '{name} (Discount: {percentage}%)',
                    manualPenaltyReasonLabel: 'Reason:',
                    manualPenaltyCreatedByLabel: 'Created by:',
                    manualPenaltyDateLabel: 'Date:'
                }
            };

            this.currentLang = localStorage.getItem('taskflow_lang') || 'ar';
            this.lastUnreadCount = 0;
            this.audioPermissionGranted = false;
            this.initLanguage();
            this.init();
        }

        // ========== طرق المساعدة الأساسية ==========
        getCurrentUser() {
            try {
                const userData = localStorage.getItem('user_data');
                if (userData) {
                    return JSON.parse(userData);
                }
                if (window.AuthManager && window.AuthManager.getCurrentUser) {
                    return window.AuthManager.getCurrentUser();
                }
                return null;
            } catch (error) {
                console.error('❌ خطأ في قراءة بيانات المستخدم:', error);
                return null;
            }
        }

        getAuthToken() {
            try {
                let token = localStorage.getItem('auth_token');
                if (token && token !== 'undefined' && token !== 'null') {
                    return token;
                }
                const userData = this.getCurrentUser();
                if (userData && userData.token && userData.token !== 'undefined') {
                    return userData.token;
                }
                return null;
            } catch (error) {
                console.error('❌ خطأ في قراءة التوكن:', error);
                return null;
            }
        }

        async apiRequest(endpoint, options = {}) {
            const token = this.getAuthToken();
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
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
                if (options.body instanceof FormData) {
                    config.body = options.body;
                    delete headers['Content-Type'];
                } else {
                    if (typeof options.body === 'string') {
                        config.body = options.body;
                    } else {
                        config.body = JSON.stringify(options.body);
                    }
                }
            }

            try {
                const response = await fetch(`${this.baseURL}${endpoint}`, config);
                const data = await response.json();
                if (!response.ok) {
                    const errorMessage = data.message || data.error || 'حدث خطأ داخلي في الخادم';
                    throw new Error(errorMessage);
                }
                return data;
            } catch (error) {
                console.error(`API request error for ${endpoint}:`, error);
                throw error;
            }
        }

        // ========== جلب صلاحيات المستخدم ==========
        async fetchUserPermissions() {
            try {
                const result = await this.apiRequest('/api/admin/tasks/my-permissions');
                return result.data || [];
            } catch (error) {
                console.error('Failed to fetch user permissions:', error);
                return [];
            }
        }

        // ========== تطبيق الصلاحيات على الواجهة ==========
        applyPermissions(permissions) {
            const newRequestBtn = document.getElementById('new-request-btn');
            const newPurchaseBtn = document.getElementById('new-purchase-btn');
            const newAppointmentBtn = document.getElementById('new-appointment-btn');
            const newManualPenaltyBtn = document.getElementById('new-manual-penalty-btn');
            
            const requestsSentSection = document.getElementById('requests-sent-tasks')?.closest('.board-section');
            const requestsReceivedSection = document.getElementById('requests-received-tasks')?.closest('.board-section');
            const purchasesSentSection = document.getElementById('purchases-sent-tasks')?.closest('.board-section');
            const purchasesReceivedSection = document.getElementById('purchases-received-tasks')?.closest('.board-section');
            const penaltiesSection = document.querySelector('[data-section="penalties"]');
            const manualPenaltiesSection = document.querySelector('[data-section="manual-penalties"]');
            const calendarView = document.getElementById('calendar-view');
            const analyticsSection = document.querySelector('.analytics-section');
            
            const hasTaskRequests = permissions.includes('task_requests');
            if (newRequestBtn) newRequestBtn.style.display = hasTaskRequests ? 'inline-flex' : 'none';
            if (requestsSentSection) requestsSentSection.style.display = hasTaskRequests ? '' : 'none';
            if (requestsReceivedSection) requestsReceivedSection.style.display = hasTaskRequests ? '' : 'none';
            
            const hasPurchaseRequests = permissions.includes('purchase_requests');
            if (newPurchaseBtn) newPurchaseBtn.style.display = hasPurchaseRequests ? 'inline-flex' : 'none';
            if (purchasesSentSection) purchasesSentSection.style.display = hasPurchaseRequests ? '' : 'none';
            if (purchasesReceivedSection) purchasesReceivedSection.style.display = hasPurchaseRequests ? '' : 'none';
            
            const hasAppointments = permissions.includes('appointments');
            if (newAppointmentBtn) newAppointmentBtn.style.display = hasAppointments ? 'inline-flex' : 'none';
            if (calendarView) calendarView.style.display = (hasAppointments && this.currentView === 'calendar') ? 'block' : 'none';
            
            const hasPenalties = permissions.includes('penalties');
            if (newManualPenaltyBtn) newManualPenaltyBtn.style.display = hasPenalties ? 'inline-flex' : 'none';
            if (penaltiesSection) penaltiesSection.style.display = hasPenalties ? '' : 'none';
            if (manualPenaltiesSection) manualPenaltiesSection.style.display = hasPenalties ? '' : 'none';
            
            const hasStatistics = permissions.includes('statistics');
            if (analyticsSection) analyticsSection.style.display = hasStatistics ? '' : 'none';
        }

        // ========== طرق الترجمة ==========
        initLanguage() {
            document.documentElement.lang = this.currentLang;
            document.documentElement.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';
            document.body.className = document.body.className.replace(/rtl|ltr/g, '').trim();
            document.body.classList.add(this.currentLang === 'ar' ? 'rtl' : 'ltr');
            localStorage.setItem('taskflow_lang', this.currentLang);
            this.translatePage();
        }

        toggleLanguage() {
            this.currentLang = this.currentLang === 'ar' ? 'en' : 'ar';
            this.initLanguage();
            this.refreshAllData();
        }

        translatePage() {
            const elements = document.querySelectorAll('[data-i18n]');
            elements.forEach(el => {
                const key = el.getAttribute('data-i18n');
                const translation = this.getTranslation(key);
                if (translation) el.textContent = translation;
            });

            const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
            placeholders.forEach(el => {
                const key = el.getAttribute('data-i18n-placeholder');
                const translation = this.getTranslation(key);
                if (translation) el.placeholder = translation;
            });

            const titles = document.querySelectorAll('[data-i18n-title]');
            titles.forEach(el => {
                const key = el.getAttribute('data-i18n-title');
                const translation = this.getTranslation(key);
                if (translation) el.title = translation;
            });

            const langText = document.getElementById('current-language');
            if (langText) {
                langText.textContent = this.currentLang === 'ar' ? 'العربية' : 'English';
            }

            const addManualPenaltyBtn = document.getElementById('new-manual-penalty-submit');
            if (addManualPenaltyBtn) {
                addManualPenaltyBtn.textContent = this.getTranslation('addManualPenalty');
            }
        }

        getTranslation(key, options = {}) {
            const langData = this.translations[this.currentLang];
            let text = langData[key];
            if (!text) return key;
            if (options) {
                Object.keys(options).forEach(k => {
                    const regex = new RegExp(`{${k}}`, 'g');
                    text = text.replace(regex, options[k]);
                });
            }
            return text;
        }

        translateElement(el, key, options = {}) {
            if (!el) return;
            const translation = this.getTranslation(key, options);
            if (translation) el.textContent = translation;
        }

        // ========== طرق جلب البيانات المحسنة ==========
        async fetchTasks(folder, page = 1, limit = 25) {
            try {
                const result = await this.apiRequest(`/api/admin/tasks/${folder}?page=${page}&limit=${limit}`);
                return result.data || [];
            } catch (error) {
                console.error(`Failed to fetch ${folder} tasks:`, error);
                return [];
            }
        }

        async fetchAllTasks() {
            const folders = ['inbox', 'sent', 'subtasks', 'archived'];
            const results = await Promise.all(folders.map(folder => this.fetchTasks(folder)));
            const all = [];
            results.forEach((tasks, idx) => {
                const folder = folders[idx];
                tasks.forEach(t => {
                    let type = folder;
                    if (folder === 'inbox') type = 'received';
                    else if (folder === 'archived') type = 'archived';
                    else if (folder === 'subtasks') type = 'subtask';
                    all.push({ ...t, type });
                });
            });
            return all;
        }

        async fetchTaskStats() {
            try {
                const result = await this.apiRequest('/api/admin/tasks/stats');
                return result.data || {};
            } catch (error) {
                console.error('Failed to fetch task stats:', error);
                return {};
            }
        }

        async fetchTeamWorkload() {
            try {
                const result = await this.apiRequest('/api/admin/tasks/team-workload');
                return result.data || [];
            } catch (error) {
                console.error('Failed to fetch team workload:', error);
                return [];
            }
        }

        async fetchRequests(folder = 'all') {
            try {
                const result = await this.apiRequest(`/api/admin/tasks/requests?folder=${folder}`);
                return result.data || [];
            } catch (error) {
                console.error(`Failed to fetch requests (${folder}):`, error);
                return [];
            }
        }

        async fetchPurchases(folder = 'all') {
            try {
                const result = await this.apiRequest(`/api/admin/tasks/purchases?folder=${folder}`);
                return result.data || [];
            } catch (error) {
                console.error(`Failed to fetch purchases (${folder}):`, error);
                return [];
            }
        }

        async fetchAppointments() {
            try {
                const result = await this.apiRequest('/api/admin/tasks/appointments');
                return result.data || [];
            } catch (error) {
                console.error('Failed to fetch appointments:', error);
                return [];
            }
        }

        async fetchPenalties() {
            try {
                const result = await this.apiRequest('/api/admin/tasks/penalties');
                return result.data || [];
            } catch (error) {
                console.error('Failed to fetch penalties:', error);
                return [];
            }
        }

        async fetchManualPenalties() {
            try {
                const result = await this.apiRequest('/api/admin/tasks/manual-penalties');
                return result.data || [];
            } catch (error) {
                console.error('Failed to fetch manual penalties:', error);
                return [];
            }
        }

        async createManualPenalty(userId, percentage, reason) {
            try {
                const result = await this.apiRequest('/api/admin/tasks/manual-penalties', {
                    method: 'POST',
                    body: { userId, percentage, reason }
                });
                return result.data;
            } catch (error) {
                console.error('Failed to create manual penalty:', error);
                throw error;
            }
        }

        async deleteManualPenalty(penaltyId) {
            try {
                const result = await this.apiRequest(`/api/admin/tasks/manual-penalties/${penaltyId}`, {
                    method: 'DELETE'
                });
                return result;
            } catch (error) {
                console.error('Failed to delete manual penalty:', error);
                throw error;
            }
        }

        async fetchUsers() {
            try {
                const result = await this.apiRequest('/api/admin/tasks/users');
                if (result.data && Array.isArray(result.data)) {
                    return result.data;
                }
                if (Array.isArray(result)) {
                    return result;
                }
                return [];
            } catch (error) {
                console.warn('Could not fetch users, using fallback', error);
                return [];
            }
        }

        async fetchProjects() {
            try {
                const result = await this.apiRequest('/api/public/home/featured-projects');
                if (result.data && Array.isArray(result.data)) {
                    return result.data;
                }
                if (Array.isArray(result)) {
                    return result;
                }
                return [];
            } catch (error) {
                console.warn('Could not fetch projects', error);
                return [];
            }
        }

        // ========== إدارة الإشعارات مع الصوت ==========
        async fetchNotifications(limit = 50, offset = 0) {
            try {
                const result = await this.apiRequest(`/api/admin/tasks/notifications?limit=${limit}&offset=${offset}`);
                return result;
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
                return { data: [], total: 0 };
            }
        }

        async markNotificationRead(notificationId) {
            try {
                await this.apiRequest(`/api/admin/tasks/notifications/${notificationId}/read`, { method: 'PUT' });
                await this.loadNotifications();
            } catch (error) {
                console.error('Failed to mark notification as read:', error);
            }
        }

        async markAllNotificationsRead() {
            try {
                await this.apiRequest('/api/admin/tasks/notifications/read-all', { method: 'PUT' });
                await this.loadNotifications();
                this.showNotification(this.getTranslation('allMarkedRead'), 'success');
            } catch (error) {
                console.error('Failed to mark all notifications as read:', error);
            }
        }

        async loadNotifications() {
            try {
                const { data: notifications, total } = await this.fetchNotifications(50, 0);
                const unreadCount = notifications.filter(n => !n.isRead).length;
                const countEl = document.getElementById('notifications-count');
                if (countEl) countEl.textContent = unreadCount;

                if (unreadCount > 0 && unreadCount > this.lastUnreadCount) {
                    const latestNotification = notifications[0];
                    if (latestNotification && latestNotification.eventType === 'reminder') {
                        this.playReminderSound();
                    } else {
                        this.playNotificationSound();
                    }
                }
                this.lastUnreadCount = unreadCount;

                const listEl = document.getElementById('notifications-list');
                if (listEl) {
                    if (notifications.length === 0) {
                        listEl.innerHTML = `<div class="notification-empty">${this.getTranslation('noNotifications') || 'لا توجد إشعارات'}</div>`;
                    } else {
                        listEl.innerHTML = notifications.map(n => `
                            <div class="notification-item ${n.isRead ? '' : 'unread'}" data-id="${n.id}" data-entity-type="${n.entityType}" data-entity-id="${n.entityId}">
                                <div class="notification-icon"><i class="fas ${this.getNotificationIconForEvent(n.eventType)}"></i></div>
                                <div class="notification-content">
                                    <div class="notification-text">${this.escapeHtml(n.title)}</div>
                                    <div class="notification-message">${this.escapeHtml(n.message || '')}</div>
                                    <div class="notification-time">${this.formatDateForNotification(n.createdAt)}</div>
                                </div>
                            </div>
                        `).join('');
                    }
                }
            } catch (error) {
                console.error('Failed to load notifications:', error);
            }
        }

        async requestAudioPermission() {
            if (this.audioPermissionGranted) return true;
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) {
                    const audioCtx = new AudioContext();
                    await audioCtx.resume();
                    audioCtx.close();
                } else {
                    const silent = new Audio('data:audio/wav;base64,U3RlYWx0aCBhbmQgU291bmQ=');
                    await silent.play();
                    silent.pause();
                }
                this.audioPermissionGranted = true;
                console.log('✅ Audio permission granted');
                return true;
            } catch (e) {
                console.warn('Audio permission not granted yet:', e);
                return false;
            }
        }

        playNotificationSound() {
            if (!this.audioPermissionGranted) {
                this.requestAudioPermission().then(() => {
                    this.playNotificationSound();
                });
                return;
            }
            try {
                const audio = new Audio('/sounds/notification.mp3');
                audio.play().catch(e => {
                    console.warn('Could not play notification.mp3, trying alternative path', e);
                    const audio2 = new Audio('../sounds/notification.mp3');
                    audio2.play().catch(e2 => console.warn('Notification sound failed:', e2));
                });
            } catch (e) {
                console.warn('Sound playback error:', e);
            }
        }

        playReminderSound() {
            if (!this.audioPermissionGranted) {
                this.requestAudioPermission().then(() => {
                    this.playReminderSound();
                });
                return;
            }
            try {
                const audio = new Audio('/sounds/reminder.mp3');
                audio.play().catch(e => {
                    console.warn('Could not play reminder.mp3, trying alternative path', e);
                    const audio2 = new Audio('../sounds/reminder.mp3');
                    audio2.play().catch(e2 => console.warn('Reminder sound failed:', e2));
                });
            } catch (e) {
                console.warn('Reminder sound playback error:', e);
            }
        }

        getNotificationIconForEvent(eventType) {
            const map = {
                task_created: 'fa-tasks',
                task_assigned: 'fa-user-plus',
                comment_added: 'fa-comment',
                attachment_added: 'fa-paperclip',
                progress_updated: 'fa-chart-line',
                request_created: 'fa-file-alt',
                purchase_created: 'fa-shopping-cart',
                appointment_created: 'fa-calendar-plus',
                penalty_issued: 'fa-gavel',
                task_escalated: 'fa-arrow-up',
                reminder: 'fa-bell'
            };
            return map[eventType] || 'fa-bell';
        }

        formatDateForNotification(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleString(this.currentLang === 'ar' ? 'ar-EG' : 'en-US', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        // ========== طرق جلب البيانات الرئيسية ==========
        async refreshAllData() {
            this.isLoading = true;
            try {
                const results = await Promise.allSettled([
                    this.fetchAllTasks(),
                    this.fetchTaskStats(),
                    this.fetchTeamWorkload(),
                    this.fetchRequests('assigned'),
                    this.fetchRequests('created'),
                    this.fetchPurchases('assigned'),
                    this.fetchPurchases('created'),
                    this.fetchAppointments(),
                    this.fetchPenalties(),
                    this.fetchManualPenalties(),
                    this.fetchUsers(),
                    this.fetchProjects()
                ]);

                const [tasksResult, statsResult, workloadResult, requestsReceivedResult, requestsSentResult, purchasesReceivedResult, purchasesSentResult, appointmentsResult, penaltiesResult, manualPenaltiesResult, usersResult, projectsResult] = results;

                this.tasks = tasksResult.status === 'fulfilled' ? tasksResult.value : [];
                this.requestsReceived = requestsReceivedResult.status === 'fulfilled' ? requestsReceivedResult.value : [];
                this.requestsSent = requestsSentResult.status === 'fulfilled' ? requestsSentResult.value : [];
                this.purchasesReceived = purchasesReceivedResult.status === 'fulfilled' ? purchasesReceivedResult.value : [];
                this.purchasesSent = purchasesSentResult.status === 'fulfilled' ? purchasesSentResult.value : [];
                this.appointments = appointmentsResult.status === 'fulfilled' ? appointmentsResult.value : [];
                this.penalties = penaltiesResult.status === 'fulfilled' ? penaltiesResult.value : [];
                this.manualPenalties = manualPenaltiesResult.status === 'fulfilled' ? manualPenaltiesResult.value : [];

                let usersArray = usersResult.status === 'fulfilled' ? usersResult.value : [];
                if (!Array.isArray(usersArray)) usersArray = [];
                this.users = {};
                usersArray.forEach(u => {
                    this.users[u.id] = {
                        id: u.id,
                        name: u.fullName,
                        avatar: u.profileImage || `https://i.pravatar.cc/150?img=${u.id}`,
                        role: u.role,
                        email: u.email,
                        department: u.department || 'غير محدد',
                        averageScore: u.averageScore || 0
                    };
                });

                let projectsArray = projectsResult.status === 'fulfilled' ? projectsResult.value : [];
                if (!Array.isArray(projectsArray)) projectsArray = [];
                this.projects = {};
                projectsArray.forEach(p => {
                    this.projects[p.id] = p.projectName;
                });

                const stats = statsResult.status === 'fulfilled' ? statsResult.value : {};
                const workload = workloadResult.status === 'fulfilled' ? workloadResult.value : [];

                this.updateTasksUI();
                this.updateStatisticsFromApi(stats);
                this.updateTeamWorkloadUI(workload);
                this.renderRequests();
                this.renderPurchases();
                this.renderAppointments();
                this.renderPenalties();
                this.renderManualPenalties();
                this.updateCharts();
                this.initSectionFilters();
                this.updateAssigneeFilter();
                this.populateAllAssigneeSelects();
                this.populateManualPenaltyUserSelect();

                await this.loadNotifications();
            } catch (error) {
                console.error('Failed to load tasks:', error);
                this.showNotification('حدث خطأ أثناء تحميل المهام', 'error');
            } finally {
                this.isLoading = false;
            }
        }

        updateStatisticsFromApi(stats) {
            if (this.elements.statSentTotal) this.elements.statSentTotal.textContent = stats.sentTotal || 0;
            if (this.elements.statSentCompleted) this.elements.statSentCompleted.textContent = stats.sentCompleted || 0;
            if (this.elements.statSentProgress) this.elements.statSentProgress.textContent = stats.sentInProgress || 0;
            if (this.elements.statSentOverdue) this.elements.statSentOverdue.textContent = stats.sentOverdue || 0;
            if (this.elements.statReceivedTotal) this.elements.statReceivedTotal.textContent = stats.total || 0;
            if (this.elements.statReceivedCompleted) this.elements.statReceivedCompleted.textContent = stats.completed || 0;
            if (this.elements.statReceivedProgress) this.elements.statReceivedProgress.textContent = stats.inProgress || 0;
            if (this.elements.statReceivedOverdue) this.elements.statReceivedOverdue.textContent = stats.overdue || 0;
            if (this.elements.statRequestsSent) this.elements.statRequestsSent.textContent = stats.requestsSent || 0;
            if (this.elements.statRequestsReceived) this.elements.statRequestsReceived.textContent = stats.requestsReceived || 0;
            if (this.elements.statPurchasesSent) this.elements.statPurchasesSent.textContent = stats.purchasesSent || 0;
            if (this.elements.statPurchasesReceived) this.elements.statPurchasesReceived.textContent = stats.purchasesReceived || 0;
            if (this.elements.statTotalAppointments) this.elements.statTotalAppointments.textContent = stats.totalAppointments || 0;
            if (this.elements.statTeam) this.elements.statTeam.textContent = stats.team || 0;
            if (this.elements.statPenalties) this.elements.statPenalties.textContent = stats.penalties || 0;
        }

        updateTeamWorkloadUI(workload) {
            const container = document.getElementById('team-workload');
            if (!container) return;
            let html = '';
            if (workload.length === 0) {
                html = '<div class="text-center text-muted">' + this.getTranslation('noData') + '</div>';
            } else {
                workload.forEach(dept => {
                    const total = dept.totalTasks || 0;
                    const completed = dept.completedTasks || 0;
                    const archived = dept.archivedTasks || 0;
                    const inProgress = dept.inProgressTasks || 0;
                    const overdue = dept.overdueTasks || 0;
                    const avgScore = dept.averageScore ? dept.averageScore.toFixed(2) : '0.00';
                    const percent = total ? ((completed + archived) / total) * 100 : 0;
                    html += `
                        <div class="team-progress-item">
                            <div class="team-member-info">
                                <span class="team-member-name">${this.escapeHtml(dept.departmentName)}</span>
                                <span class="team-member-role"><i class="fas fa-star" style="color: #f1c40f;"></i> ${avgScore}</span>
                            </div>
                            <div class="team-progress-bar">
                                <div class="progress-fill" style="width: ${percent}%; background-color: ${percent < 30 ? '#2ecc71' : percent < 70 ? '#f39c12' : '#e74c3c'};"></div>
                            </div>
                            <div class="team-stats">
                                <span><i class="fas fa-tasks"></i> ${total}</span>
                                <span><i class="fas fa-spinner"></i> ${inProgress}</span>
                                <span><i class="fas fa-check-circle"></i> ${completed}</span>
                                <span><i class="fas fa-archive"></i> ${archived}</span>
                                <span><i class="fas fa-exclamation-triangle"></i> ${overdue}</span>
                            </div>
                        </div>
                    `;
                });
            }
            container.innerHTML = html;
        }

        updateAssigneeFilter() {
            const assigneeSelect = document.getElementById('filter-assignee');
            if (!assigneeSelect) return;
            const currentValue = assigneeSelect.value;
            assigneeSelect.innerHTML = '<option value="all">' + this.getTranslation('all') + '</option>' +
                                       '<option value="me">' + this.getTranslation('assignedToMe') + '</option>';
            for (const userId in this.users) {
                const user = this.users[userId];
                const option = document.createElement('option');
                option.value = userId;
                option.textContent = user.name;
                assigneeSelect.appendChild(option);
            }
            assigneeSelect.value = currentValue;
        }

        populateAllAssigneeSelects() {
            const selects = [
                'task-assignees', 'request-assignee', 'purchase-assignee', 'appointment-attendees'
            ];
            selects.forEach(id => {
                const select = document.getElementById(id);
                if (!select) return;
                select.innerHTML = id === 'request-assignee' || id === 'purchase-assignee' ?
                    '<option value="">' + this.getTranslation('selectAssignee') + '</option>' : '';
                for (const userId in this.users) {
                    const user = this.users[userId];
                    const option = document.createElement('option');
                    option.value = userId;
                    option.textContent = user.name;
                    select.appendChild(option);
                }
            });

            const subtaskTemplate = document.getElementById('subtask-row-template');
            if (subtaskTemplate) {
                const subtaskAssigneeSelect = subtaskTemplate.querySelector('.subtask-assignee');
                if (subtaskAssigneeSelect) {
                    subtaskAssigneeSelect.innerHTML = '<option value="">' + this.getTranslation('selectAssignee') + '</option>';
                    for (const userId in this.users) {
                        const user = this.users[userId];
                        const option = document.createElement('option');
                        option.value = userId;
                        option.textContent = user.name;
                        subtaskAssigneeSelect.appendChild(option);
                    }
                }
            }
        }

        populateManualPenaltyUserSelect() {
            const select = document.getElementById('manual-penalty-user');
            if (!select) return;
            select.innerHTML = '<option value="">' + this.getTranslation('selectEmployee') + '</option>';
            for (const userId in this.users) {
                const user = this.users[userId];
                const option = document.createElement('option');
                option.value = userId;
                option.textContent = user.name;
                select.appendChild(option);
            }
        }

        updateTasksUI() {
            const containers = {
                sent: this.elements.sentTasks,
                received: this.elements.receivedTasks,
                subtasks: this.elements.subtasksTasks,
                archived: this.elements.archivedTasks
            };
            for (const key in containers) {
                const container = containers[key];
                if (!container) continue;
                const quickAdd = container.querySelector('.quick-add-task');
                container.innerHTML = '';
                if (quickAdd) container.appendChild(quickAdd);
            }

            this.tasks.forEach(task => {
                let container = null;
                if (task.type === 'sent') container = this.elements.sentTasks;
                else if (task.type === 'received') container = this.elements.receivedTasks;
                else if (task.type === 'subtask') container = this.elements.subtasksTasks;
                else if (task.type === 'archived') container = this.elements.archivedTasks;
                if (container) {
                    const card = this.createTaskCard(task);
                    const quickAdd = container.querySelector('.quick-add-task');
                    container.insertBefore(card, quickAdd);
                }
            });

            this.reattachTaskCardEvents();
            this.updateSectionsCount();
        }

        createTaskCard(task) {
            const card = document.createElement('div');
            card.className = 'task-card';
            if (task.type === 'archived') {
                card.style.opacity = '0.6';
                card.style.filter = 'grayscale(0.3)';
            }
            card.dataset.id = task.id;
            card.dataset.priority = task.priority;
            card.dataset.status = task.status;
            card.dataset.project = task.projectId || '';
            card.dataset.type = task.type;

            let footerButtons = '';
            const isSubtask = task.type === 'subtask';
            const isArchived = task.type === 'archived';
            if (!isArchived && !isSubtask && (task.type === 'received')) {
                if (task.status === 'todo' && task.progress === 0) {
                    footerButtons = `
                        <button class="task-start-btn" data-task-id="${task.id}" title="${this.getTranslation('start')}">
                            <i class="fas fa-play"></i> ${this.getTranslation('start')}
                        </button>
                    `;
                } else {
                    footerButtons = `
                        <button class="btn-update-progress" title="${this.getTranslation('updateProgressTitle')}" data-task-id="${task.id}">
                            <i class="fas fa-percent"></i>
                        </button>
                    `;
                }
            } else if (!isArchived && isSubtask) {
                footerButtons = '';
            }

            let subtaskIndicator = '';
            let parentTaskLink = '';
            if (task.type === 'subtask' && task.parentTaskId) {
                subtaskIndicator = `<span class="subtask-indicator"><i class="fas fa-list-ul"></i> ${this.getTranslation('subtask')}</span>`;
                const parentTask = this.tasks.find(t => t.id == task.parentTaskId);
                if (parentTask) {
                    parentTaskLink = `<div class="parent-task-link" data-parent-id="${parentTask.id}" title="${this.getTranslation('parentTask')}"><i class="fas fa-level-up-alt"></i> ${parentTask.title}</div>`;
                }
            }

            let menuItems = '';
            if (!isArchived) {
                if (task.type === 'sent') {
                    menuItems = `
                        <a href="#" class="card-dropdown-item delete-task"><i class="fas fa-trash"></i> ${this.getTranslation('delete')}</a>
                        <a href="#" class="card-dropdown-item archive-task"><i class="fas fa-archive"></i> ${this.getTranslation('archive')}</a>
                    `;
                } else if (task.type === 'received') {
                    menuItems = `
                        <a href="#" class="card-dropdown-item archive-task"><i class="fas fa-archive"></i> ${this.getTranslation('archive')}</a>
                    `;
                } else if (task.type === 'subtask') {
                    menuItems = `
                        <a href="#" class="card-dropdown-item delete-task"><i class="fas fa-trash"></i> ${this.getTranslation('delete')}</a>
                        <a href="#" class="card-dropdown-item archive-task"><i class="fas fa-archive"></i> ${this.getTranslation('archive')}</a>
                    `;
                } else {
                    menuItems = `
                        <a href="#" class="card-dropdown-item archive-task"><i class="fas fa-archive"></i> ${this.getTranslation('archive')}</a>
                    `;
                }
            }

            const progressPercent = task.progress || 0;
            let progressColor = '#2ecc71';
            if (progressPercent < 30) progressColor = '#e74c3c';
            else if (progressPercent < 70) progressColor = '#f39c12';
            else progressColor = '#2ecc71';

            let assigneesDisplay = '';
            if (task.type === 'received') {
                const senderName = task.senderName || (this.users[task.senderId]?.name) || this.getTranslation('unknown');
                assigneesDisplay = `<span class="assignee-names"><i class="fas fa-user"></i> ${this.getTranslation('from', { name: senderName })}</span>`;
            } else if (isSubtask) {
                const assigneeNames = (task.assigneesFull || []).map(a => a.fullName).join(', ');
                if (assigneeNames) {
                    assigneesDisplay = `<span class="assignee-names"><i class="fas fa-user-check"></i> ${this.getTranslation('to', { name: assigneeNames })}</span>`;
                } else {
                    assigneesDisplay = `<span class="assignee-names"><i class="fas fa-user"></i> ${this.getTranslation('notSpecified')}</span>`;
                }
            } else if (isArchived) {
                const assigneeName = (task.assigneesFull && task.assigneesFull[0]) ? task.assigneesFull[0].fullName : this.getTranslation('notSpecified');
                assigneesDisplay = `<span class="assignee-names"><i class="fas fa-user"></i> ${this.getTranslation('recipient')}: ${assigneeName}</span>`;
            } else {
                assigneesDisplay = (task.assigneesFull || []).map(a => `<img src="${a.avatar || this.users[a.id]?.avatar || `https://i.pravatar.cc/24?img=${a.id}`}" alt="${a.fullName}" class="assignee-avatar" title="${a.fullName} (${(a.averageScore || 0).toFixed(2)})">`).join('');
                if (!task.assigneesFull || task.assigneesFull.length === 0) {
                    assigneesDisplay = '<span>' + this.getTranslation('notSpecified') + '</span>';
                }
            }

            card.innerHTML = `
                <div class="task-card-priority priority-${task.priority}"></div>
                <div class="task-card-content">
                    <div class="task-card-header">
                        <div class="task-title-wrapper">
                            <h3 class="task-title">${this.escapeHtml(task.title)}</h3>
                            <span class="task-badge new">${this.getTranslation('newTaskBadge')}</span>
                            ${subtaskIndicator}
                        </div>
                        ${!isArchived ? `<button class="task-menu-btn"><i class="fas fa-ellipsis-v"></i></button>
                        <div class="card-dropdown">
                            ${menuItems}
                        </div>` : ''}
                    </div>
                    
                    <p class="task-description">${this.escapeHtml((task.description || '').substring(0, 100))}${(task.description || '').length > 100 ? '...' : ''}</p>
                    
                    ${parentTaskLink ? `<div class="parent-task-link-wrapper">${parentTaskLink}</div>` : ''}
                    
                    <div class="task-meta">
                        <div class="task-assignees">
                            ${assigneesDisplay}
                        </div>
                        <div class="task-due-date">
                            <i class="fas fa-calendar-alt"></i>
                            <span>${task.dueDate ? this.formatDate(task.dueDate) : this.getTranslation('notSpecified')}</span>
                        </div>
                    </div>
                    
                    <div class="task-progress">
                        <div class="progress-header">
                            <span class="progress-label">${this.getTranslation('progress')}</span>
                            <span class="progress-percent">${this.getTranslation('progressPercent', { percent: progressPercent })}</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercent}%; background-color: ${progressColor};"></div>
                        </div>
                    </div>
                    
                    <div class="task-footer">
                        <div class="task-comments" data-task-id="${task.id}">
                            <i class="fas fa-comment"></i>
                            <span>${task.commentsCount || 0}</span>
                        </div>
                        <div class="task-attachments" data-task-id="${task.id}">
                            <i class="fas fa-paperclip"></i>
                            <span>${task.attachmentsCount || 0}</span>
                        </div>
                        ${task.subtasks && task.subtasks.length > 0 ? `
                        <div class="task-subtasks" data-task-id="${task.id}">
                            <i class="fas fa-list-ul"></i>
                            <span>${task.subtasks.filter(st => st.status === 'done').length}/${task.subtasks.length}</span>
                        </div>
                        ` : ''}
                        ${footerButtons}
                    </div>
                    ${task.escalated ? `
                    <div class="task-escalation-indicator" data-escalated="true" data-level="${task.escalationLevel}">
                        <i class="fas fa-arrow-up"></i> <span>${this.getTranslation('escalatedIndicator', { level: task.escalationLevel })}</span>
                    </div>
                    ` : ''}
                </div>
            `;

            return card;
        }

        renderRequests() {
            if (!this.userPermissions.includes('task_requests')) return;
            const containerSent = this.elements.requestsSentTasks;
            if (containerSent) {
                const quickAdd = containerSent.querySelector('.quick-add-task');
                containerSent.innerHTML = '';
                if (quickAdd) containerSent.appendChild(quickAdd);
                this.requestsSent.forEach(req => {
                    const card = this.createRequestCard(req, 'sent');
                    containerSent.insertBefore(card, quickAdd);
                });
                this.reattachRequestCardEvents('requests-sent');
            }

            const containerReceived = this.elements.requestsReceivedTasks;
            if (containerReceived) {
                containerReceived.innerHTML = '';
                this.requestsReceived.forEach(req => {
                    const card = this.createRequestCard(req, 'received');
                    containerReceived.appendChild(card);
                });
                this.reattachRequestCardEvents('requests-received');
            }
        }

        createRequestCard(req, type) {
            const card = document.createElement('div');
            card.className = `request-card ${type}`;
            card.dataset.id = req.id;
            const assigneeName = req.assigneeId ? (this.users[req.assigneeId]?.name || this.getTranslation('notAssigned')) : this.getTranslation('notAssigned');
            card.innerHTML = `
                <div class="request-card-content">
                    <div class="request-card-header">
                        <h3 class="request-title">${this.escapeHtml(req.title)}</h3>
                        ${type === 'sent' ? `<button class="request-delete-btn" title="${this.getTranslation('delete')}"><i class="fas fa-trash"></i></button>` : ''}
                    </div>
                    <p class="request-description">${this.escapeHtml(req.description)}</p>
                    <div class="request-meta">
                        <div class="request-assignee">
                            <i class="fas fa-user"></i>
                            <span>${assigneeName}</span>
                        </div>
                    </div>
                </div>
            `;
            return card;
        }

        renderPurchases() {
            if (!this.userPermissions.includes('purchase_requests')) return;
            const containerSent = this.elements.purchasesSentTasks;
            if (containerSent) {
                const quickAdd = containerSent.querySelector('.quick-add-task');
                containerSent.innerHTML = '';
                if (quickAdd) containerSent.appendChild(quickAdd);
                this.purchasesSent.forEach(purchase => {
                    const card = this.createPurchaseCard(purchase, 'sent');
                    containerSent.insertBefore(card, quickAdd);
                });
                this.reattachPurchaseCardEvents('purchases-sent');
            }

            const containerReceived = this.elements.purchasesReceivedTasks;
            if (containerReceived) {
                containerReceived.innerHTML = '';
                this.purchasesReceived.forEach(purchase => {
                    const card = this.createPurchaseCard(purchase, 'received');
                    containerReceived.appendChild(card);
                });
                this.reattachPurchaseCardEvents('purchases-received');
            }
        }

        createPurchaseCard(purchase, type) {
            const card = document.createElement('div');
            card.className = `purchase-card ${type} ${purchase.urgency}`;
            card.dataset.id = purchase.id;
            const assigneeName = purchase.assigneeId ? (this.users[purchase.assigneeId]?.name || this.getTranslation('notAssigned')) : this.getTranslation('notAssigned');
            card.innerHTML = `
                <div class="purchase-card-content">
                    <div class="purchase-card-header">
                        <h3 class="purchase-title">${this.escapeHtml(purchase.item)}</h3>
                        ${type === 'sent' ? `<button class="purchase-delete-btn" title="${this.getTranslation('delete')}"><i class="fas fa-trash"></i></button>` : ''}
                    </div>
                    <p class="purchase-description">${this.escapeHtml(purchase.description)}</p>
                    <div class="purchase-meta">
                        <div class="purchase-quantity">
                            <i class="fas fa-cubes"></i>
                            <span>${purchase.quantity}</span>
                        </div>
                        <span class="purchase-urgency ${purchase.urgency}">${purchase.urgency === 'urgent' ? this.getTranslation('urgent') : this.getTranslation('normal')}</span>
                    </div>
                    <div class="purchase-assignee">
                        <i class="fas fa-user"></i>
                        <span>${assigneeName}</span>
                    </div>
                </div>
            `;
            return card;
        }

        renderAppointments() {
            if (!this.userPermissions.includes('appointments')) return;
            if (this.currentView === 'calendar') {
                this.renderCalendar();
            }
            if (this.elements.statTotalAppointments) {
                this.elements.statTotalAppointments.textContent = this.appointments.length;
            }
        }

        renderPenalties() {
            if (!this.userPermissions.includes('penalties')) return;
            const container = this.elements.penaltiesTasks;
            if (!container) return;

            const quickAdd = container.querySelector('.quick-add-task');
            container.innerHTML = '';
            if (quickAdd) container.appendChild(quickAdd);

            this.penalties.forEach(penalty => {
                const card = this.createPenaltyCard(penalty);
                container.insertBefore(card, quickAdd);
            });
            this.reattachPenaltyCardEvents();
        }

        createPenaltyCard(penalty) {
            const card = document.createElement('div');
            card.className = 'task-card penalty-card';
            card.dataset.id = penalty.id;
            card.dataset.priority = penalty.task?.priority || 'medium';
            card.dataset.status = penalty.task?.status || 'overdue';
            card.dataset.project = penalty.task?.projectId || '';
            card.dataset.taskId = penalty.taskId;

            const taskTitle = penalty.taskTitle || this.getTranslation('unknown');
            const reason = penalty.reason || this.getTranslation('overdue');
            const daysOverdue = penalty.daysOverdue || 1;
            
            const assigneeName = penalty.userId ? (this.users[penalty.userId]?.name || this.getTranslation('unknown')) : this.getTranslation('unknown');

            let commentsCount = 0;
            const originalTask = this.tasks.find(t => t.id == penalty.taskId);
            if (originalTask && originalTask.commentsCount !== undefined) {
                commentsCount = originalTask.commentsCount;
            }

            card.innerHTML = `
                <div class="task-card-priority priority-${penalty.task?.priority || 'medium'}"></div>
                <div class="task-card-content">
                    <div class="task-card-header">
                        <div class="task-title-wrapper">
                            <h3 class="task-title">${this.escapeHtml(taskTitle)}</h3>
                            <span class="task-badge overdue">${this.getTranslation('overdueDays', { days: daysOverdue })}</span>
                        </div>
                        <button class="penalty-remove-btn" title="${this.getTranslation('removePenalty')}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <p class="task-description">${this.escapeHtml(reason)}</p>
                    
                    <div class="task-meta">
                        <div class="task-assignees">
                            <span class="assignee-name"><i class="fas fa-user"></i> ${assigneeName}</span>
                        </div>
                        <div class="task-due-date urgent">
                            <i class="fas fa-calendar-alt"></i>
                            <span>${this.formatDate(penalty.issuedAt)}</span>
                        </div>
                    </div>
                    
                    <div class="task-footer">
                        <div class="task-comments" data-task-id="${penalty.taskId}">
                            <i class="fas fa-comment"></i>
                            <span>${commentsCount}</span>
                        </div>
                        <div class="task-attachments" data-task-id="${penalty.taskId}">
                            <i class="fas fa-paperclip"></i>
                            <span>0</span>
                        </div>
                    </div>
                </div>
            `;

            return card;
        }

        renderManualPenalties() {
            if (!this.userPermissions.includes('penalties')) return;
            const container = this.elements.manualPenaltiesTasks;
            if (!container) return;

            const quickAdd = container.querySelector('.quick-add-task');
            container.innerHTML = '';
            if (quickAdd) container.appendChild(quickAdd);

            this.manualPenalties.forEach(penalty => {
                const card = this.createManualPenaltyCard(penalty);
                container.insertBefore(card, quickAdd);
            });
            this.reattachManualPenaltyCardEvents();
        }

        createManualPenaltyCard(penalty) {
            const card = document.createElement('div');
            card.className = 'task-card manual-penalty-card';
            card.dataset.id = penalty.id;
            card.dataset.userId = penalty.userId;

            const userName = this.users[penalty.userId]?.name || this.getTranslation('unknown');
            const createdByName = this.users[penalty.createdBy]?.name || this.getTranslation('unknown');

            card.innerHTML = `
                <div class="task-card-priority priority-high" style="background-color: #e67e22;"></div>
                <div class="task-card-content">
                    <div class="task-card-header">
                        <div class="task-title-wrapper">
                            <h3 class="task-title">${this.escapeHtml(userName)}</h3>
                            <span class="task-badge manual-penalty">${this.getTranslation('discountPercentage')}: ${penalty.percentage}%</span>
                        </div>
                        <button class="manual-penalty-remove-btn" title="${this.getTranslation('removePenalty')}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <p class="task-description"><strong>${this.getTranslation('reason')}:</strong> ${this.escapeHtml(penalty.reason)}</p>
                    
                    <div class="task-meta">
                        <div class="task-assignees">
                            <span class="assignee-name"><i class="fas fa-user-plus"></i> ${this.getTranslation('createdBy', { name: createdByName })}</span>
                        </div>
                        <div class="task-due-date">
                            <i class="fas fa-calendar-alt"></i>
                            <span>${this.formatDate(penalty.createdAt)}</span>
                        </div>
                    </div>
                </div>
            `;

            return card;
        }

        showManualPenaltyDetails(penaltyId) {
            const penalty = this.manualPenalties.find(p => p.id == penaltyId);
            if (!penalty) return;

            this.selectedManualPenalty = penalty;
            const modal = document.getElementById('manual-penalty-detail-modal');
            const body = document.getElementById('manual-penalty-detail-body');
            if (!modal || !body) return;

            const userName = this.users[penalty.userId]?.name || this.getTranslation('unknown');
            const createdByName = this.users[penalty.createdBy]?.name || this.getTranslation('unknown');

            body.innerHTML = `
                <div class="task-detail">
                    <div class="task-detail-header">
                        <div class="task-detail-icon"><i class="fas fa-gavel"></i></div>
                        <div class="task-detail-title-section">
                            <h2>${this.escapeHtml(userName)}</h2>
                        </div>
                    </div>
                    <div class="manual-penalty-detail-grid">
                        <div class="detail-card">
                            <h4>${this.getTranslation('basicInfo')}</h4>
                            <div class="detail-item">
                                <span class="detail-label">${this.getTranslation('discountPercentage')}</span>
                                <span class="detail-value">${penalty.percentage}%</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">${this.getTranslation('reason')}</span>
                                <span class="detail-value">${this.escapeHtml(penalty.reason)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">${this.getTranslation('createdBy')}</span>
                                <span class="detail-value">${createdByName}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">${this.getTranslation('created')}</span>
                                <span class="detail-value">${this.formatDate(penalty.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            this.openModal(modal);
        }

        openNewManualPenaltyModal() {
            const modal = document.getElementById('new-manual-penalty-modal');
            if (!modal) return;
            document.getElementById('new-manual-penalty-form')?.reset();
            const submitBtn = document.getElementById('new-manual-penalty-submit');
            if (submitBtn) submitBtn.textContent = this.getTranslation('addManualPenalty');
            this.openModal(modal);
        }

        async createManualPenaltySubmit() {
            const userId = document.getElementById('manual-penalty-user')?.value;
            const percentage = document.getElementById('manual-penalty-percentage')?.value;
            const reason = document.getElementById('manual-penalty-reason')?.value;

            if (!userId || !percentage || !reason) {
                this.showNotification(this.getTranslation('fillAllFields'), 'error');
                return;
            }

            const percentageNum = parseFloat(percentage);
            if (isNaN(percentageNum) || percentageNum < 0 || percentageNum > 100) {
                this.showNotification(this.getTranslation('invalidPercentage'), 'error');
                return;
            }

            try {
                await this.createManualPenalty(parseInt(userId), percentageNum, reason);
                await this.refreshAllData();
                this.closeModal(document.getElementById('new-manual-penalty-modal'));
                this.showNotification(this.getTranslation('manualPenaltyAdded'), 'success');
            } catch (error) {
                console.error('Failed to create manual penalty:', error);
                this.showNotification(error.message || 'حدث خطأ أثناء إضافة الجزاء اليدوي', 'error');
            }
        }

        async deleteManualPenaltySubmit() {
            if (!this.selectedManualPenalty) return;
            try {
                await this.deleteManualPenalty(this.selectedManualPenalty.id);
                await this.refreshAllData();
                this.closeModal(document.getElementById('manual-penalty-detail-modal'));
                this.showNotification(this.getTranslation('manualPenaltyDeleted'), 'success');
            } catch (error) {
                console.error('Failed to delete manual penalty:', error);
                this.showNotification(error.message || 'حدث خطأ أثناء حذف الجزاء اليدوي', 'error');
            }
        }

        updateSectionsCount() {
            const sentCount = this.tasks.filter(t => t.type === 'sent' && t.status !== 'archived').length;
            const receivedCount = this.tasks.filter(t => t.type === 'received' && t.status !== 'archived').length;
            const subtasksCount = this.tasks.filter(t => t.type === 'subtask' && t.status !== 'archived').length;
            const archivedCount = this.tasks.filter(t => t.type === 'archived').length;
            const requestsReceivedCount = this.requestsReceived.length;
            const requestsSentCount = this.requestsSent.length;
            const purchasesReceivedCount = this.purchasesReceived.length;
            const purchasesSentCount = this.purchasesSent.length;
            const penaltiesCount = this.penalties.length;
            const manualPenaltiesCount = this.manualPenalties.length;

            const sentCountEl = document.getElementById('sent-count');
            const receivedCountEl = document.getElementById('received-count');
            const subtasksCountEl = document.getElementById('subtasks-count');
            const archivedCountEl = document.getElementById('archived-count');
            const requestsReceivedCountEl = document.getElementById('requests-received-count');
            const requestsSentCountEl = document.getElementById('requests-sent-count');
            const purchasesReceivedCountEl = document.getElementById('purchases-received-count');
            const purchasesSentCountEl = document.getElementById('purchases-sent-count');
            const penaltiesCountEl = document.getElementById('penalties-count');
            const manualPenaltiesCountEl = document.getElementById('manual-penalties-count');

            if (sentCountEl) sentCountEl.textContent = sentCount;
            if (receivedCountEl) receivedCountEl.textContent = receivedCount;
            if (subtasksCountEl) subtasksCountEl.textContent = subtasksCount;
            if (archivedCountEl) archivedCountEl.textContent = archivedCount;
            if (requestsReceivedCountEl) requestsReceivedCountEl.textContent = requestsReceivedCount;
            if (requestsSentCountEl) requestsSentCountEl.textContent = requestsSentCount;
            if (purchasesReceivedCountEl) purchasesReceivedCountEl.textContent = purchasesReceivedCount;
            if (purchasesSentCountEl) purchasesSentCountEl.textContent = purchasesSentCount;
            if (penaltiesCountEl) penaltiesCountEl.textContent = penaltiesCount;
            if (manualPenaltiesCountEl) manualPenaltiesCountEl.textContent = manualPenaltiesCount;
        }

        // ========== الرسوم البيانية ==========
        destroyCharts() {
            if (this.charts.status) {
                this.charts.status.destroy();
                this.charts.status = null;
            }
            if (this.charts.priority) {
                this.charts.priority.destroy();
                this.charts.priority = null;
            }
            if (this.charts.projects) {
                this.charts.projects.destroy();
                this.charts.projects = null;
            }
            if (this.charts.summary) {
                this.charts.summary.destroy();
                this.charts.summary = null;
            }
        }

        initCharts() {
            this.destroyCharts();
            this.createStatusChart();
            this.createPriorityChart();
            this.createProjectsChart();
            this.createSummaryChart();
        }

        updateCharts() {
            this.initCharts();
        }

        createStatusChart() {
            const statusCtx = document.getElementById('tasks-status-chart')?.getContext('2d');
            if (!statusCtx) return;
            
            const todoCount = this.tasks.filter(t => t.status === 'todo').length;
            const progressCount = this.tasks.filter(t => t.status === 'in-progress').length;
            const reviewCount = this.tasks.filter(t => t.status === 'review').length;
            const doneCount = this.tasks.filter(t => t.status === 'done' || t.progress === 100).length;
            
            this.charts.status = new Chart(statusCtx, {
                type: 'doughnut',
                data: {
                    labels: [this.getTranslation('todo'), this.getTranslation('inProgress'), this.getTranslation('review'), this.getTranslation('done')],
                    datasets: [{
                        data: [todoCount, progressCount, reviewCount, doneCount],
                        backgroundColor: ['#95a5a6', '#f39c12', '#9b59b6', '#2ecc71'],
                        borderColor: 'transparent',
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: { legend: { display: false }, tooltip: { enabled: true } }
                }
            });
        }

        createPriorityChart() {
            const priorityCtx = document.getElementById('tasks-priority-chart')?.getContext('2d');
            if (!priorityCtx) return;
            
            const urgentCount = this.tasks.filter(t => t.priority === 'urgent').length;
            const highCount = this.tasks.filter(t => t.priority === 'high').length;
            const mediumCount = this.tasks.filter(t => t.priority === 'medium').length;
            const lowCount = this.tasks.filter(t => t.priority === 'low').length;
            
            this.charts.priority = new Chart(priorityCtx, {
                type: 'doughnut',
                data: {
                    labels: [this.getTranslation('urgent'), this.getTranslation('high'), this.getTranslation('medium'), this.getTranslation('low')],
                    datasets: [{
                        data: [urgentCount, highCount, mediumCount, lowCount],
                        backgroundColor: ['#e74c3c', '#f39c12', '#3498db', '#2ecc71'],
                        borderColor: 'transparent',
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: { legend: { display: false }, tooltip: { enabled: true } }
                }
            });
        }

        createProjectsChart() {
            const projectsCtx = document.getElementById('tasks-projects-chart')?.getContext('2d');
            if (!projectsCtx) return;
            
            const projectCounts = {};
            this.tasks.forEach(task => {
                if (task.projectId) {
                    projectCounts[task.projectId] = (projectCounts[task.projectId] || 0) + 1;
                }
            });
            const labels = Object.keys(projectCounts).map(id => this.projects[id] || `مشروع ${id}`);
            const data = Object.values(projectCounts);
            
            this.charts.projects = new Chart(projectsCtx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: ['#3498db', '#e67e22', '#2ecc71', '#9b59b6', '#f1c40f'],
                        borderColor: 'transparent',
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: { legend: { display: false }, tooltip: { enabled: true } }
                }
            });
        }

        createSummaryChart() {
            const summaryCtx = document.getElementById('stats-summary-chart')?.getContext('2d');
            if (!summaryCtx) return;

            const totalTasks = this.tasks.length;
            const totalRequests = this.requestsReceived.length + this.requestsSent.length;
            const totalPurchases = this.purchasesReceived.length + this.purchasesSent.length;
            const totalPenalties = this.penalties.length + this.manualPenalties.length;
            const totalArchived = this.tasks.filter(t => t.type === 'archived').length;

            this.charts.summary = new Chart(summaryCtx, {
                type: 'bar',
                data: {
                    labels: [
                        this.getTranslation('tasksCount'),
                        this.getTranslation('requestsCount'),
                        this.getTranslation('purchasesCount'),
                        this.getTranslation('penaltiesCount'),
                        this.getTranslation('archivedCount')
                    ],
                    datasets: [{
                        label: this.getTranslation('statsSummary'),
                        data: [totalTasks, totalRequests, totalPurchases, totalPenalties, totalArchived],
                        backgroundColor: ['#3498db', '#f1c40f', '#e67e22', '#e74c3c', '#95a5a6'],
                        borderRadius: 8,
                        borderSkipped: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { enabled: true }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(255,255,255,0.1)' },
                            ticks: { stepSize: 1 }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
        }

        // ========== عرض التقويم مع المواعيد والمهام ==========
        renderCalendar() {
            if (!this.userPermissions.includes('appointments')) return;
            if (!this.elements.calendarGrid || !this.elements.calendarMonthYear) return;

            const year = this.calendarCurrentDate.getFullYear();
            const month = this.calendarCurrentDate.getMonth();

            this.elements.calendarMonthYear.textContent = moment(this.calendarCurrentDate).format('MMMM YYYY');

            const firstDay = new Date(year, month, 1);
            const startingDay = firstDay.getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            let gridHTML = '';
            let dayCount = 1;

            for (let i = 0; i < startingDay; i++) {
                gridHTML += '<div class="calendar-day empty"></div>';
            }

            for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                
                if (this.calendarMode === 'appointments') {
                    const appointmentsOnDay = this.appointments.filter(a => {
                        if (!a.appointmentDate) return false;
                        const aDate = new Date(a.appointmentDate);
                        const dDate = new Date(dateStr);
                        return aDate.toDateString() === dDate.toDateString();
                    });
                    let dotsHTML = '';
                    appointmentsOnDay.slice(0, 4).forEach(app => {
                        dotsHTML += `<span class="task-dot ${app.type}" title="${app.title} - ${app.appointmentTime}"></span>`;
                    });
                    if (appointmentsOnDay.length > 4) {
                        dotsHTML += `<span class="more-dots">+${appointmentsOnDay.length-4}</span>`;
                    }
                    gridHTML += `
                        <div class="calendar-day" data-date="${dateStr}" data-mode="appointments">
                            <div class="day-number">${day}</div>
                            <div class="task-dots">${dotsHTML}</div>
                        </div>
                    `;
                } else {
                    const dueTasksOnDay = this.tasks.filter(t => {
                        if (t.status === 'done' || t.type === 'archived') return false;
                        if (t.type !== 'subtask') return false;
                        if (!t.dueDate) return false;
                        const tDate = new Date(t.dueDate);
                        const dDate = new Date(dateStr);
                        return tDate.toDateString() === dDate.toDateString();
                    });
                    let dotsHTML = '';
                    dueTasksOnDay.slice(0, 4).forEach(task => {
                        dotsHTML += `<span class="task-dot task" title="${task.title} (${this.getTranslation('dueDate')})"></span>`;
                    });
                    if (dueTasksOnDay.length > 4) {
                        dotsHTML += `<span class="more-dots">+${dueTasksOnDay.length-4}</span>`;
                    }
                    gridHTML += `
                        <div class="calendar-day" data-date="${dateStr}" data-mode="tasks">
                            <div class="day-number">${day}</div>
                            <div class="task-dots">${dotsHTML}</div>
                        </div>
                    `;
                }
            }

            const totalCells = Math.ceil((startingDay + daysInMonth) / 7) * 7;
            for (let i = startingDay + daysInMonth; i < totalCells; i++) {
                gridHTML += '<div class="calendar-day empty"></div>';
            }

            this.elements.calendarGrid.innerHTML = gridHTML;

            document.querySelectorAll('.calendar-day:not(.empty)').forEach(dayEl => {
                dayEl.addEventListener('click', (e) => {
                    const date = dayEl.dataset.date;
                    const mode = dayEl.dataset.mode;
                    if (date) {
                        if (mode === 'appointments') {
                            this.showAppointmentsForDay(date);
                        } else {
                            this.showDueTasksForDay(date);
                        }
                    }
                });
            });
        }

        showAppointmentsForDay(date) {
            const appointments = this.appointments.filter(a => {
                if (!a.appointmentDate) return false;
                const aDate = new Date(a.appointmentDate);
                const dDate = new Date(date);
                return aDate.toDateString() === dDate.toDateString();
            });
            const modal = this.elements.appointmentDayModal;
            const body = document.getElementById('appointment-day-body');
            if (!body) return;

            if (appointments.length === 0) {
                body.innerHTML = `<p class="text-center">${this.getTranslation('noAppointments')}</p>`;
            } else {
                let html = '<div class="appointments-list">';
                appointments.forEach(app => {
                    const typeClass = app.type || 'other';
                    const attendeesNames = (app.attendees || []).map(att => {
                        if (typeof att === 'object' && att.fullName) return att.fullName;
                        if (typeof att === 'number') return this.users[att]?.name || att;
                        if (typeof att === 'string') return att;
                        return '';
                    }).filter(n => n).join('، ');
                    let formattedTime = '';
                    if (app.appointmentTime) {
                        const timeParts = app.appointmentTime.split(':');
                        let hours = parseInt(timeParts[0], 10);
                        const minutes = timeParts[1];
                        const ampm = hours >= 12 ? 'م' : 'ص';
                        hours = hours % 12 || 12;
                        formattedTime = `${hours}:${minutes} ${ampm}`;
                    }
                    const formattedDate = app.appointmentDate ? moment(app.appointmentDate).format('YYYY-MM-DD') : '';
                    html += `
                        <div class="appointment-card ${typeClass}" data-id="${app.id}">
                            <div class="appointment-header">
                                <span class="appointment-title">${this.escapeHtml(app.title)}</span>
                                <span class="appointment-time"><i class="fas fa-clock"></i> ${formattedTime}</span>
                            </div>
                            <div class="appointment-details">
                                <span class="appointment-location"><i class="fas fa-map-marker-alt"></i> ${app.location || this.getTranslation('notSpecified')}</span>
                                <span class="appointment-attendees"><i class="fas fa-users"></i> ${attendeesNames}</span>
                            </div>
                            ${app.notes ? `<div class="appointment-notes"><i class="fas fa-sticky-note"></i> ${this.escapeHtml(app.notes)}</div>` : ''}
                        </div>
                    `;
                });
                html += '</div>';
                body.innerHTML = html;

                document.querySelectorAll('.appointment-card').forEach(card => {
                    card.addEventListener('click', () => {
                        const appId = card.dataset.id;
                        const appointment = appointments.find(a => a.id == appId);
                        if (appointment) this.showAppointmentDetails(appointment);
                    });
                });
            }

            this.openModal(modal);
        }

        showDueTasksForDay(date) {
            const tasks = this.tasks.filter(t => {
                if (t.status === 'done' || t.type === 'archived') return false;
                if (t.type !== 'subtask') return false;
                if (!t.dueDate) return false;
                const tDate = new Date(t.dueDate);
                const dDate = new Date(date);
                return tDate.toDateString() === dDate.toDateString();
            });
            
            const modal = this.elements.appointmentDayModal;
            const body = document.getElementById('appointment-day-body');
            if (!body) return;

            if (tasks.length === 0) {
                body.innerHTML = `<p class="text-center">${this.getTranslation('noDueTasks')}</p>`;
            } else {
                let html = '<div class="tasks-due-list">';
                tasks.forEach(task => {
                    html += `
                        <div class="due-task-card" data-id="${task.id}">
                            <div class="due-task-header">
                                <span class="due-task-title">${this.escapeHtml(task.title)}</span>
                                <span class="due-task-priority priority-${task.priority}">${this.getPriorityText(task.priority)}</span>
                            </div>
                            <div class="due-task-meta">
                                <span><i class="fas fa-user"></i> ${task.assigneesFull && task.assigneesFull[0] ? task.assigneesFull[0].fullName : this.getTranslation('notSpecified')}</span>
                                <span><i class="fas fa-tasks"></i> ${task.progress}%</span>
                            </div>
                        </div>
                    `;
                });
                html += '</div>';
                body.innerHTML = html;

                document.querySelectorAll('.due-task-card').forEach(card => {
                    card.addEventListener('click', () => {
                        const taskId = card.dataset.id;
                        if (taskId) this.openTaskDetails(taskId);
                        this.closeModal(modal);
                    });
                });
            }
            const modalTitle = modal.querySelector('.modal-title');
            if (modalTitle) {
                modalTitle.innerHTML = `<i class="fas fa-tasks"></i> ${this.getTranslation('dueTasksForDay')}`;
            }
            this.openModal(modal);
            const originalCloseHandler = () => {
                if (modalTitle) modalTitle.innerHTML = `<i class="fas fa-calendar-day"></i> ${this.getTranslation('appointmentsForDay')}`;
                modal.removeEventListener('modal:closed', originalCloseHandler);
            };
            modal.addEventListener('modal:closed', originalCloseHandler);
        }

        showAppointmentDetails(appointment) {
            this.selectedAppointment = appointment;
            const modal = this.elements.appointmentDetailModal;
            const body = document.getElementById('appointment-detail-body');
            if (!body) return;

            const attendeesNames = (appointment.attendees || []).map(att => {
                if (typeof att === 'object' && att.fullName) return att.fullName;
                if (typeof att === 'number') return this.users[att]?.name || att;
                if (typeof att === 'string') return att;
                return '';
            }).filter(n => n).join('، ');
            const typeTrans = this.getTranslation(appointment.type) || appointment.type;
            const formattedDate = appointment.appointmentDate ? moment(appointment.appointmentDate).format('YYYY-MM-DD') : '';
            let formattedTime = '';
            if (appointment.appointmentTime) {
                const timeParts = appointment.appointmentTime.split(':');
                let hours = parseInt(timeParts[0], 10);
                const minutes = timeParts[1];
                const ampm = hours >= 12 ? 'م' : 'ص';
                hours = hours % 12 || 12;
                formattedTime = `${hours}:${minutes} ${ampm}`;
            }

            body.innerHTML = `
                <div class="task-detail-header">
                    <div class="task-detail-icon"><i class="fas fa-calendar-check"></i></div>
                    <div class="task-detail-title-section">
                        <h2>${this.escapeHtml(appointment.title)}</h2>
                        <div class="task-detail-meta-tags">
                            <span class="task-detail-tag"><i class="fas fa-tag"></i> ${typeTrans}</span>
                            <span class="task-detail-tag"><i class="fas fa-calendar"></i> ${formattedDate}</span>
                            <span class="task-detail-tag"><i class="fas fa-clock"></i> ${formattedTime}</span>
                        </div>
                    </div>
                </div>
                <div class="task-detail-grid" style="grid-template-columns: 1fr 1fr;">
                    <div class="task-detail-info-card">
                        <div class="info-card-title"><i class="fas fa-info-circle"></i> ${this.getTranslation('basicInfo')}</div>
                        <div class="info-item">
                            <span class="info-label">${this.getTranslation('appointmentLocation')}</span>
                            <span class="info-value">${appointment.location || this.getTranslation('notSpecified')}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">${this.getTranslation('appointmentAttendees')}</span>
                            <span class="info-value">${attendeesNames}</span>
                        </div>
                    </div>
                    <div class="task-detail-info-card">
                        <div class="info-card-title"><i class="fas fa-sticky-note"></i> ${this.getTranslation('notes')}</div>
                        <div class="info-item">
                            <span class="info-value">${appointment.notes || this.getTranslation('noNotes')}</span>
                        </div>
                    </div>
                </div>
            `;

            this.openModal(modal);
        }

        // ========== عرض تفاصيل المهمة ==========
        async openTaskDetails(taskId) {
            try {
                const result = await this.apiRequest(`/api/admin/tasks/${taskId}`);
                const task = result.data;
                if (!task) {
                    this.showNotification('المهمة غير موجودة أو ليس لديك صلاحية الوصول إليها', 'error');
                    return;
                }

                this.selectedTask = task;
                if (this.elements.modalTaskTitle) {
                    this.translateElement(this.elements.modalTaskTitle, 'taskDetails');
                }

                const body = this.elements.modalTaskBody;
                if (!body) return;

                const isReceived = task.type === 'received';
                const isSent = task.type === 'sent';
                const isSubtask = task.type === 'subtask';
                const isArchived = task.type === 'archived';
                const canRate = task.status === 'done' && task.senderId === this.currentUser?.id && !task.rating;

                const footer = this.elements.modalTaskFooter;
                if (footer) {
                    if (isArchived) {
                        footer.innerHTML = `
                            <button class="btn btn-secondary" id="modal-close-btn-2">${this.getTranslation('close')}</button>
                        `;
                    } else {
                        footer.innerHTML = `
                            <button class="btn btn-secondary" id="modal-close-btn-2">${this.getTranslation('close')}</button>
                            ${(isReceived || isSubtask || isSent) ? `
                                <button class="btn btn-outline" id="modal-add-subtask-btn">${this.getTranslation('addSubtask')}</button>
                            ` : ''}
                            ${canRate ? `<button class="btn btn-outline" id="modal-rate-task-btn">${this.getTranslation('rateTask')}</button>` : ''}
                        `;
                    }
                    document.getElementById('modal-close-btn-2')?.addEventListener('click', () => this.closeModal(this.elements.taskDetailModal));
                    document.getElementById('modal-add-subtask-btn')?.addEventListener('click', () => {
                        this.closeModal(this.elements.taskDetailModal);
                        this.openNewTaskModal(null, this.selectedTask.id);
                    });
                    if (canRate) {
                        document.getElementById('modal-rate-task-btn')?.addEventListener('click', () => {
                            this.closeModal(this.elements.taskDetailModal);
                            this.openRateTaskModal(taskId);
                        });
                    }
                }

                const assigneesHTML = (task.assigneesFull || []).map(user => {
                    return `<div class="assignee-card">
                        <div class="assignee-info">
                            <div class="assignee-name">${user.fullName}</div>
                            <div class="assignee-role">${user.role}</div>
                            <div class="assignee-score">${this.getTranslation('averageScore')}: ${(user.averageScore || 0).toFixed(2)}</div>
                        </div>
                    </div>`;
                }).join('') || '<p>' + this.getTranslation('noAssignees') + '</p>';

                const subtasksHTML = task.subtasks && task.subtasks.length > 0 ?
                    task.subtasks.map(st => `
                        <div class="subtask-detail-item" data-id="${st.id}" style="border-right: 4px solid #9b59b6; margin-bottom: 12px; padding: 8px; background: rgba(155,89,182,0.1); border-radius: 8px;">
                            <div class="subtask-detail-info">
                                <h4><i class="fas fa-list-ul" style="color: #9b59b6;"></i> ${st.title}</h4>
                                <div class="subtask-detail-meta">
                                    <span>${this.getTranslation('assignee')}: ${this.users[st.assignees?.[0]]?.name || this.getTranslation('notSpecified')}</span>
                                    <span>${this.getTranslation('dueDate')}: ${this.formatDate(st.dueDate)}</span>
                                </div>
                            </div>
                            <div class="subtask-detail-status">
                                <span>${st.progress}%</span>
                                <div class="subtask-progress-small">
                                    <div class="progress-fill" style="width: ${st.progress}%;"></div>
                                </div>
                            </div>
                        </div>
                    `).join('') : '<p>' + this.getTranslation('noSubtasks') + '</p>';

                let parentTaskInfo = '';
                if (task.parentTaskId) {
                    const parentTask = this.tasks.find(t => t.id == task.parentTaskId);
                    if (parentTask) {
                        parentTaskInfo = `
                            <div class="info-item">
                                <span class="info-label">${this.getTranslation('parentTask')}</span>
                                <span class="info-value parent-task-badge"><i class="fas fa-level-up-alt"></i> ${parentTask.title}</span>
                            </div>
                        `;
                    }
                }

                const commentsHTML = task.comments && task.comments.length > 0 ?
                    task.comments.map(c => `
                        <div class="comment-detail-item">
                            <div class="comment-detail-avatar"><img src="${c.profileImage || `https://i.pravatar.cc/40?img=${c.userId}`}" alt="${c.fullName}" style="width: 32px; height: 32px; border-radius: 50%;"></div>
                            <div class="comment-detail-content">
                                <div class="comment-detail-header">
                                    <span class="comment-detail-author">${c.fullName || c.userId}</span>
                                    <span class="comment-detail-time">${this.formatDate(c.createdAt)}</span>
                                </div>
                                <div class="comment-detail-text">${c.comment}</div>
                            </div>
                        </div>
                    `).join('') : '<p>' + this.getTranslation('noComments') + '</p>';

                const activityHTML = `
                    <div class="activity-timeline">
                        <div class="activity-timeline-item">
                            <span class="activity-time">${this.formatDate(task.createdAt)}</span>
                            <span class="activity-text">${this.getTranslation('createdBy', { name: task.senderName || 'مستخدم' })}</span>
                        </div>
                        <div class="activity-timeline-item">
                            <span class="activity-time">${this.formatDate(task.updatedAt)}</span>
                            <span class="activity-text">${this.getTranslation('lastUpdated')}</span>
                        </div>
                        ${task.escalationHistory && task.escalationHistory.length > 0 ? task.escalationHistory.map(e => `
                        <div class="activity-timeline-item">
                            <span class="activity-time">${this.formatDate(e.escalatedAt)}</span>
                            <span class="activity-text">${this.getTranslation('escalatedToLevel', { level: e.level, to: e.escalatedTo })}</span>
                        </div>
                        `).join('') : ''}
                    </div>
                `;

                body.innerHTML = `
                    <div class="task-detail">
                        <div class="task-detail-header">
                            <div class="task-detail-icon">
                                <i class="fas fa-tasks"></i>
                            </div>
                            <div class="task-detail-title-section">
                                <h2>${task.title}</h2>
                                <div class="task-detail-meta-tags">
                                    <span class="task-detail-tag"><i class="fas fa-tag"></i> ${this.projects[task.projectId] || this.getTranslation('noProject')}</span>
                                    <span class="task-detail-tag"><i class="fas fa-calendar"></i> ${this.getTranslation('created')}: ${this.formatDate(task.createdAt)}</span>
                                    <span class="task-detail-tag"><i class="fas fa-clock"></i> ${this.getTranslation('lastUpdated')}: ${this.formatDate(task.updatedAt)}</span>
                                    ${task.rating ? `<span class="task-detail-tag"><i class="fas fa-star"></i> ${this.getTranslation('finalScore')}: ${task.rating.finalScore.toFixed(2)}</span>` : ''}
                                </div>
                            </div>
                        </div>

                        <div class="task-detail-grid">
                            <div class="task-detail-info-card">
                                <div class="info-card-title"><i class="fas fa-info-circle"></i> ${this.getTranslation('basicInfo')}</div>
                                <div class="info-item">
                                    <span class="info-label">${this.getTranslation('status')}</span>
                                    <span class="info-value">${this.getStatusText(task.status)}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">${this.getTranslation('priority')}</span>
                                    <span class="info-value"><span class="priority-badge ${task.priority}">${this.getPriorityText(task.priority)}</span></span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">${this.getTranslation('dueDate')}</span>
                                    <span class="info-value ${task.isOverdue ? 'urgent' : ''}">${this.formatDate(task.dueDate)}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">${this.getTranslation('progress')}</span>
                                    <span class="info-value">${task.progress}%</span>
                                </div>
                                ${parentTaskInfo}
                            </div>

                            <div class="task-detail-info-card">
                                <div class="info-card-title"><i class="fas fa-users"></i> ${this.getTranslation('stats')}</div>
                                <div class="info-item">
                                    <span class="info-label">${this.getTranslation('comments')}</span>
                                    <span class="info-value">${task.commentsCount || 0}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">${this.getTranslation('attachments')}</span>
                                    <span class="info-value">${task.attachmentsCount || 0}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">${this.getTranslation('subtasks')}</span>
                                    <span class="info-value">${task.subtasks ? task.subtasks.length : 0}</span>
                                </div>
                            </div>
                        </div>

                        <div class="task-detail-assignees">
                            <h4><i class="fas fa-users"></i> ${this.getTranslation('assignees')}</h4>
                            <div class="assignees-grid">
                                ${assigneesHTML}
                            </div>
                        </div>

                        <div class="detail-section">
                            <h4><i class="fas fa-align-left"></i> ${this.getTranslation('description')}</h4>
                            <p>${task.description || ''}</p>
                        </div>

                        <div class="task-detail-tabs">
                            <button class="tab-btn active" data-tab="delegations"><i class="fas fa-share-alt"></i> ${this.getTranslation('delegationHistory')} (0)</button>
                            <button class="tab-btn" data-tab="subtasks"><i class="fas fa-list-ul"></i> ${this.getTranslation('subtasks')} (${task.subtasks?.length || 0})</button>
                            <button class="tab-btn" data-tab="comments"><i class="fas fa-comments"></i> ${this.getTranslation('comments')} (${task.commentsCount || 0})</button>
                            <button class="tab-btn" data-tab="activity"><i class="fas fa-history"></i> ${this.getTranslation('activity')}</button>
                        </div>

                        <div class="tab-pane active" id="tab-delegations">
                            <div class="delegation-chain">
                                <p>${this.getTranslation('noDelegationHistory')}</p>
                            </div>
                        </div>

                        <div class="tab-pane" id="tab-subtasks">
                            <div class="subtasks-detail-list">
                                ${subtasksHTML}
                            </div>
                        </div>

                        <div class="tab-pane" id="tab-comments">
                            <div class="comments-section" id="comments-section">
                                ${commentsHTML}
                            </div>
                            <div class="add-comment">
                                <textarea class="form-control" id="new-comment-detail" rows="2" placeholder="${this.getTranslation('writeComment')}"></textarea>
                                <div class="comment-toolbar">
                                    <button class="btn-icon" title="${this.getTranslation('attachFile')}"><i class="fas fa-paperclip"></i></button>
                                    <button class="btn btn-primary btn-sm" id="send-comment-detail">${this.getTranslation('send')}</button>
                                </div>
                            </div>
                        </div>

                        <div class="tab-pane" id="tab-activity">
                            ${activityHTML}
                        </div>
                    </div>
                `;

                document.querySelectorAll('.tab-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                        const tabId = btn.dataset.tab;
                        document.getElementById(`tab-${tabId}`).classList.add('active');
                    });
                });

                const sendCommentDetail = document.getElementById('send-comment-detail');
                if (sendCommentDetail) {
                    sendCommentDetail.addEventListener('click', async () => {
                        const commentText = document.getElementById('new-comment-detail')?.value;
                        if (commentText && commentText.trim() !== '') {
                            await this.addNewComment(commentText);
                            document.getElementById('new-comment-detail').value = '';
                            await this.openTaskDetails(taskId);
                        }
                    });
                }

                document.querySelectorAll('.subtask-detail-item').forEach(item => {
                    const subtaskId = item.dataset.id;
                    if (subtaskId) {
                        item.addEventListener('click', () => {
                            this.closeModal(this.elements.taskDetailModal);
                            this.openTaskDetails(subtaskId);
                        });
                    }
                });

                this.openModal(this.elements.taskDetailModal);
            } catch (error) {
                console.error('Failed to load task details:', error);
                this.showNotification(error.message || 'حدث خطأ أثناء تحميل تفاصيل المهمة', 'error');
            }
        }

        getPriorityText(priority) {
            const map = { urgent: this.getTranslation('urgent'), high: this.getTranslation('high'), medium: this.getTranslation('medium'), low: this.getTranslation('low') };
            return map[priority] || priority;
        }

        getStatusText(status) {
            const map = { 'todo': this.getTranslation('todo'), 'in-progress': this.getTranslation('inProgress'), 'review': this.getTranslation('review'), 'done': this.getTranslation('done'), 'archived': this.getTranslation('archived') };
            return map[status] || status;
        }

        formatDate(dateString) {
            if (!dateString) return this.getTranslation('notSpecified');
            const date = new Date(dateString);
            const now = new Date();
            const diff = date - now;
            if (date.toDateString() === now.toDateString()) {
                return `${this.getTranslation('today')} ${date.getHours()}:${date.getMinutes().toString().padStart(2,'0')}`;
            }
            const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
            if (date.toDateString() === tomorrow.toDateString()) {
                return `${this.getTranslation('tomorrow')} ${date.getHours()}:${date.getMinutes().toString().padStart(2,'0')}`;
            }
            return date.toLocaleDateString(this.currentLang === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'numeric', year: 'numeric' });
        }

        // ========== إنشاء وتحديث المهام (بدون تعديل) ==========
        async createNewTask() {
            const title = document.getElementById('task-title')?.value;
            if (!title || title.trim() === '') {
                this.showNotification(this.getTranslation('enterTaskTitle'), 'error');
                return;
            }

            const status = document.getElementById('task-status')?.value || 'todo';
            const priority = document.getElementById('task-priority')?.value || 'medium';
            const dueDate = document.getElementById('task-due-date')?.value;
            const parent = document.getElementById('task-parent-id')?.value;
            const reminderDateTime = document.getElementById('task-reminder-datetime')?.value;
            
            const subtaskRows = document.querySelectorAll('#subtasks-builder .subtask-row:not(#subtask-row-template)');
            const subtasks = [];
            subtaskRows.forEach(row => {
                const subtaskTitle = row.querySelector('.subtask-title')?.value;
                const subtaskAssignee = row.querySelector('.subtask-assignee')?.value;
                if (subtaskTitle && subtaskTitle.trim() !== '' && subtaskAssignee) {
                    subtasks.push({
                        title: subtaskTitle,
                        assignees: [parseInt(subtaskAssignee)],
                        description: `${this.getTranslation('subtaskOf')} ${title}`,
                        priority: priority,
                        dueDate: dueDate
                    });
                }
            });

            let assignees = [];
            if (subtasks.length === 0) {
                const assigneeSelect = document.getElementById('task-assignees');
                if (assigneeSelect) {
                    assignees = Array.from(assigneeSelect.selectedOptions).map(opt => parseInt(opt.value));
                }
            }

            const taskData = {
                title: title.trim(),
                description: '',
                priority,
                status,
                progress: 0,
                dueDate: dueDate ? new Date(dueDate).toISOString() : null,
                projectId: null,
                parentTaskId: parent ? parseInt(parent) : null,
                assignees: assignees,
                checklist: [],
                recurringPattern: null,
                dependencies: [],
                reminderDateTime: reminderDateTime ? new Date(reminderDateTime).toISOString() : null
            };

            try {
                // إنشاء مهمة جديدة فقط (لا تعديل)
                const result = await this.apiRequest('/api/admin/tasks', {
                    method: 'POST',
                    body: taskData
                });
                const newTaskId = result.data.taskId;
                for (const sub of subtasks) {
                    await this.apiRequest('/api/admin/tasks', {
                        method: 'POST',
                        body: {
                            ...sub,
                            parentTaskId: newTaskId,
                            projectId: null,
                            description: sub.description,
                            priority: sub.priority,
                            dueDate: sub.dueDate,
                            assignees: sub.assignees,
                            checklist: [],
                            recurringPattern: null,
                            dependencies: []
                        }
                    });
                }
                await this.refreshAllData();
                this.closeModal(this.elements.newTaskModal);
                this.showNotification(this.getTranslation('taskCreated'), 'success');
            } catch (error) {
                console.error('Failed to create task:', error);
                this.showNotification(error.message || 'حدث خطأ أثناء حفظ المهمة', 'error');
            }
        }

        async updateTaskStatus(taskId, newStatus) {
            try {
                let status = '';
                if (newStatus === 'sent') status = 'in-progress';
                else if (newStatus === 'received') status = 'todo';
                else if (newStatus === 'archived') status = 'archived';
                else status = newStatus;

                await this.apiRequest(`/api/admin/tasks/${taskId}`, {
                    method: 'PUT',
                    body: { status }
                });
                await this.refreshAllData();
                this.showNotification(this.getTranslation('taskStatusUpdated', { status: this.getStatusText(status) }), 'success');
            } catch (error) {
                console.error('Failed to update task status:', error);
                this.showNotification('حدث خطأ أثناء تحديث حالة المهمة', 'error');
            }
        }

        async archiveTask(taskId, taskStatus, taskTitle) {
            const task = this.tasks.find(t => t.id == taskId);
            if (task && task.status === 'done' && !task.rating) {
                Swal.fire({
                    title: this.getTranslation('rateTask'),
                    text: 'هذه المهمة مكتملة ولكن لم يتم تقييمها. يرجى تقييم المهمة أولاً قبل أرشفتها.',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3498db',
                    cancelButtonColor: '#95a5a6',
                    confirmButtonText: this.getTranslation('rateTask'),
                    cancelButtonText: this.getTranslation('cancel')
                }).then((result) => {
                    if (result.isConfirmed) {
                        this.openRateTaskModal(taskId);
                    }
                });
                return;
            }

            Swal.fire({
                title: this.getTranslation('archiveConfirm'),
                text: `هل تريد أرشفة المهمة "${taskTitle || ''}"؟`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#f39c12',
                cancelButtonColor: '#95a5a6',
                confirmButtonText: this.getTranslation('archive'),
                cancelButtonText: this.getTranslation('cancel')
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        await this.apiRequest(`/api/admin/tasks/${taskId}/archive`, { method: 'POST' });
                        await this.refreshAllData();
                        this.showNotification(this.getTranslation('taskArchived'), 'success');
                    } catch (error) {
                        console.error('Failed to archive task:', error);
                        this.showNotification('حدث خطأ أثناء أرشفة المهمة', 'error');
                    }
                }
            });
        }

        async restoreTask(taskId) {
            try {
                await this.apiRequest(`/api/admin/tasks/${taskId}/restore`, { method: 'POST' });
                await this.refreshAllData();
                this.showNotification(this.getTranslation('taskRestored'), 'success');
            } catch (error) {
                console.error('Failed to restore task:', error);
                this.showNotification('حدث خطأ أثناء استعادة المهمة', 'error');
            }
        }

        async updateTaskProgress(taskId, newProgress, note) {
            try {
                await this.apiRequest(`/api/admin/tasks/${taskId}/progress`, {
                    method: 'POST',
                    body: { progress: newProgress, note: note || '' }
                });
                await this.refreshAllData();
                this.showNotification(this.getTranslation('progressUpdated', { progress: newProgress }), 'success');
            } catch (error) {
                console.error('Failed to update progress:', error);
                this.showNotification('حدث خطأ أثناء تحديث التقدم', 'error');
            }
        }

        async addNewComment(commentText) {
            const task = this.selectedTask;
            if (!task) return;
            try {
                await this.apiRequest(`/api/admin/tasks/${task.id}/comments`, {
                    method: 'POST',
                    body: { comment: commentText }
                });
                await this.refreshAllData();
                this.showNotification(this.getTranslation('commentAdded'), 'success');
            } catch (error) {
                console.error('Failed to add comment:', error);
                this.showNotification('حدث خطأ أثناء إضافة التعليق', 'error');
            }
        }

        // ========== تقييم المهمة ==========
        async openRateTaskModal(taskId) {
            const task = this.tasks.find(t => t.id == taskId);
            if (!task || task.status !== 'done') {
                this.showNotification('لا يمكن تقييم مهمة غير مكتملة', 'error');
                return;
            }
            if (task.rating) {
                this.showNotification('هذه المهمة تم تقييمها بالفعل', 'warning');
                return;
            }
            this.selectedTask = task;
            const modal = document.getElementById('rate-task-modal');
            if (modal) {
                document.getElementById('rate-quality').value = '10';
                document.getElementById('rate-difficulty').value = '1.0';
                document.getElementById('rate-notes').value = '';
                this.openModal(modal);
            }
        }

        async submitRating() {
            if (!this.selectedTask) return;
            const qualityScore = parseInt(document.getElementById('rate-quality').value);
            const difficultyWeight = parseFloat(document.getElementById('rate-difficulty').value);
            const notes = document.getElementById('rate-notes').value;
            try {
                await this.apiRequest(`/api/admin/tasks/${this.selectedTask.id}/rate`, {
                    method: 'POST',
                    body: { qualityScore, difficultyWeight, notes }
                });
                await this.refreshAllData();
                this.closeModal(document.getElementById('rate-task-modal'));
                this.showNotification(this.getTranslation('ratingSubmitted'), 'success');
                if (this.selectedTask.id) await this.openTaskDetails(this.selectedTask.id);
            } catch (error) {
                console.error('Failed to submit rating:', error);
                this.showNotification(error.message || 'حدث خطأ أثناء إرسال التقييم', 'error');
            }
        }

        // ========== الطلبات ==========
        async createNewRequest() {
            if (!this.userPermissions.includes('task_requests')) {
                this.showNotification('ليس لديك صلاحية لإنشاء طلبات', 'error');
                return;
            }
            const title = document.getElementById('request-title')?.value;
            if (!title || title.trim() === '') {
                this.showNotification('الرجاء إدخال عنوان الطلب', 'error');
                return;
            }

            const description = document.getElementById('request-description')?.value || '';
            const assignee = document.getElementById('request-assignee')?.value;
            const reminderDateTime = document.getElementById('request-reminder-datetime')?.value;

            const requestData = {
                title: title.trim(),
                description: description.trim(),
                assigneeId: assignee ? parseInt(assignee) : null,
                status: 'pending',
                reminderDateTime: reminderDateTime ? new Date(reminderDateTime).toISOString() : null
            };

            try {
                const result = await this.apiRequest('/api/admin/tasks/requests', {
                    method: 'POST',
                    body: requestData
                });
                await this.refreshAllData();
                this.closeModal(this.elements.newRequestModal);
                this.showNotification(this.getTranslation('requestCreated'), 'success');
            } catch (error) {
                console.error('Failed to create request:', error);
                this.showNotification(error.message || 'حدث خطأ أثناء إنشاء الطلب', 'error');
            }
        }

        async deleteRequest(requestId) {
            if (!this.userPermissions.includes('task_requests')) {
                this.showNotification('ليس لديك صلاحية لحذف الطلبات', 'error');
                return;
            }
            try {
                await this.apiRequest(`/api/admin/tasks/requests/${requestId}`, { method: 'DELETE' });
                await this.refreshAllData();
                this.showNotification(this.getTranslation('requestDeleted'), 'success');
            } catch (error) {
                console.error('Failed to delete request:', error);
                this.showNotification('حدث خطأ أثناء حذف الطلب', 'error');
            }
        }

        // ========== طلبات الشراء ==========
        async createNewPurchase() {
            if (!this.userPermissions.includes('purchase_requests')) {
                this.showNotification('ليس لديك صلاحية لإنشاء طلبات شراء', 'error');
                return;
            }
            const item = document.getElementById('purchase-item')?.value;
            if (!item || item.trim() === '') {
                this.showNotification('الرجاء إدخال اسم العنصر', 'error');
                return;
            }

            const quantity = document.getElementById('purchase-quantity')?.value || 1;
            const urgency = document.getElementById('purchase-urgency')?.value || 'normal';
            const description = document.getElementById('purchase-description')?.value || '';
            const assignee = document.getElementById('purchase-assignee')?.value;
            const reminderDateTime = document.getElementById('purchase-reminder-datetime')?.value;

            const purchaseData = {
                item: item.trim(),
                quantity: parseInt(quantity),
                urgency: urgency,
                description: description.trim(),
                assigneeId: assignee ? parseInt(assignee) : null,
                status: 'pending',
                reminderDateTime: reminderDateTime ? new Date(reminderDateTime).toISOString() : null
            };

            try {
                const result = await this.apiRequest('/api/admin/tasks/purchases', {
                    method: 'POST',
                    body: purchaseData
                });
                await this.refreshAllData();
                this.closeModal(this.elements.newPurchaseModal);
                this.showNotification(this.getTranslation('purchaseCreated'), 'success');
            } catch (error) {
                console.error('Failed to create purchase request:', error);
                this.showNotification(error.message || 'حدث خطأ أثناء إنشاء طلب الشراء', 'error');
            }
        }

        async deletePurchase(purchaseId) {
            if (!this.userPermissions.includes('purchase_requests')) {
                this.showNotification('ليس لديك صلاحية لحذف طلبات الشراء', 'error');
                return;
            }
            try {
                await this.apiRequest(`/api/admin/tasks/purchases/${purchaseId}`, { method: 'DELETE' });
                await this.refreshAllData();
                this.showNotification(this.getTranslation('purchaseDeleted'), 'success');
            } catch (error) {
                console.error('Failed to delete purchase:', error);
                this.showNotification('حدث خطأ أثناء حذف طلب الشراء', 'error');
            }
        }

        // ========== المواعيد ==========
        async createNewAppointment() {
            if (!this.userPermissions.includes('appointments')) {
                this.showNotification('ليس لديك صلاحية لإنشاء مواعيد', 'error');
                return;
            }
            const title = document.getElementById('appointment-title')?.value;
            if (!title || title.trim() === '') {
                this.showNotification('الرجاء إدخال عنوان المعاد', 'error');
                return;
            }

            const date = document.getElementById('appointment-date')?.value;
            const time = document.getElementById('appointment-time')?.value;
            if (!date || !time) {
                this.showNotification('الرجاء إدخال التاريخ والوقت', 'error');
                return;
            }

            const location = document.getElementById('appointment-location')?.value || '';
            const type = document.getElementById('appointment-type')?.value || 'meeting';
            const notes = document.getElementById('appointment-notes')?.value || '';
            const reminderDateTime = document.getElementById('appointment-reminder-datetime')?.value;

            const attendeesSelect = document.getElementById('appointment-attendees');
            const attendees = Array.from(attendeesSelect.selectedOptions).map(opt => parseInt(opt.value));

            const appointmentData = {
                title: title.trim(),
                appointmentDate: date,
                appointmentTime: time,
                location: location,
                type: type,
                notes: notes,
                attendees: attendees,
                reminderDateTime: reminderDateTime ? new Date(reminderDateTime).toISOString() : null
            };

            try {
                const result = await this.apiRequest('/api/admin/tasks/appointments', {
                    method: 'POST',
                    body: appointmentData
                });
                await this.refreshAllData();
                this.closeModal(this.elements.newAppointmentModal);
                this.showNotification('تم إنشاء المعاد بنجاح', 'success');
                if (this.currentView === 'calendar') {
                    this.renderCalendar();
                }
            } catch (error) {
                console.error('Failed to create appointment:', error);
                this.showNotification(error.message || 'حدث خطأ أثناء إنشاء المعاد', 'error');
            }
        }

        async deleteAppointment(appointmentId) {
            if (!this.userPermissions.includes('appointments')) {
                this.showNotification('ليس لديك صلاحية لحذف المواعيد', 'error');
                return;
            }
            try {
                await this.apiRequest(`/api/admin/tasks/appointments/${appointmentId}`, { method: 'DELETE' });
                await this.refreshAllData();
                this.showNotification('تم حذف المعاد', 'success');
                if (this.currentView === 'calendar') {
                    this.renderCalendar();
                }
            } catch (error) {
                console.error('Failed to delete appointment:', error);
                this.showNotification('حدث خطأ أثناء حذف المعاد', 'error');
            }
        }

        // ========== الجزاءات التلقائية ==========
        async removePenalty(penaltyId) {
            if (!this.userPermissions.includes('penalties')) {
                this.showNotification('ليس لديك صلاحية لإزالة الجزاءات', 'error');
                return;
            }
            try {
                await this.apiRequest(`/api/admin/tasks/penalties/${penaltyId}`, { method: 'DELETE' });
                await this.refreshAllData();
                this.showNotification(this.getTranslation('penaltyRemoved'), 'success');
            } catch (error) {
                console.error('Failed to remove penalty:', error);
                this.showNotification('حدث خطأ أثناء إزالة الجزاء', 'error');
            }
        }

        // ========== طرق عرض البطاقات ==========
        reattachTaskCardEvents() {
            document.querySelectorAll('.task-card').forEach(card => {
                const id = card.dataset.id;
                if (!id) return;

                const menuBtn = card.querySelector('.task-menu-btn');
                if (menuBtn) {
                    menuBtn.removeEventListener('click', this.handleCardMenuClick);
                    menuBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const dropdown = card.querySelector('.card-dropdown');
                        dropdown.classList.toggle('show');
                    });
                }

                const deleteBtn = card.querySelector('.delete-task');
                if (deleteBtn) {
                    deleteBtn.removeEventListener('click', this.handleDeleteTask);
                    deleteBtn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        const task = this.tasks.find(t => t.id == id);
                        Swal.fire({
                            title: this.getTranslation('deleteConfirm'),
                            text: `هل أنت متأكد من حذف المهمة "${task?.title || ''}"؟ لا يمكن التراجع عن هذا الإجراء.`,
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#e74c3c',
                            cancelButtonColor: '#95a5a6',
                            confirmButtonText: this.getTranslation('delete'),
                            cancelButtonText: this.getTranslation('cancel')
                        }).then(async (result) => {
                            if (result.isConfirmed) {
                                try {
                                    await this.apiRequest(`/api/admin/tasks/${id}`, { method: 'DELETE' });
                                    await this.refreshAllData();
                                    this.showNotification(this.getTranslation('taskDeleted'), 'success');
                                } catch (error) {
                                    console.error('Failed to delete task:', error);
                                    this.showNotification('حدث خطأ أثناء حذف المهمة', 'error');
                                }
                            }
                        });
                    });
                }

                const archiveBtn = card.querySelector('.archive-task');
                if (archiveBtn) {
                    archiveBtn.removeEventListener('click', this.handleArchiveTask);
                    archiveBtn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        const task = this.tasks.find(t => t.id == id);
                        await this.archiveTask(id, task?.status, task?.title);
                    });
                }

                const progressBtn = card.querySelector('.btn-update-progress');
                if (progressBtn) {
                    progressBtn.removeEventListener('click', this.handleUpdateProgress);
                    progressBtn.addEventListener('click', () => this.openUpdateProgressModal(id));
                }

                const commentsBtn = card.querySelector('.task-comments');
                if (commentsBtn) {
                    commentsBtn.removeEventListener('click', this.handleComments);
                    commentsBtn.addEventListener('click', () => this.openCommentsModal(id));
                }

                const attachmentsBtn = card.querySelector('.task-attachments');
                if (attachmentsBtn) {
                    attachmentsBtn.removeEventListener('click', this.handleAttachments);
                    attachmentsBtn.addEventListener('click', () => this.openAttachmentsModal(id));
                }

                const subtasksBtn = card.querySelector('.task-subtasks');
                if (subtasksBtn) {
                    subtasksBtn.removeEventListener('click', this.handleSubtasks);
                    subtasksBtn.addEventListener('click', () => this.showSubtasks(id));
                }

                const parentLink = card.querySelector('.parent-task-link');
                if (parentLink) {
                    parentLink.removeEventListener('click', this.handleParentClick);
                    parentLink.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const parentId = parentLink.dataset.parentId;
                        if (parentId) this.openTaskDetails(parentId);
                    });
                }

                const startBtn = card.querySelector('.task-start-btn');
                if (startBtn) {
                    startBtn.removeEventListener('click', this.handleStartTask);
                    startBtn.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        const taskId = startBtn.dataset.taskId;
                        if (taskId) {
                            await this.startTask(taskId);
                        }
                    });
                }

                card.removeEventListener('click', this.handleCardClick);
                card.addEventListener('click', (e) => {
                    if (e.target.closest('.task-menu-btn, .card-dropdown, .card-dropdown-item, .btn-update-progress, .task-comments, .task-attachments, .task-subtasks, .task-start-btn, .parent-task-link')) return;
                    this.openTaskDetails(id);
                });
            });

            document.addEventListener('click', (e) => {
                if (!e.target.closest('.task-menu-btn')) {
                    document.querySelectorAll('.card-dropdown.show').forEach(d => d.classList.remove('show'));
                }
            });
        }

        async startTask(taskId) {
            try {
                await this.apiRequest(`/api/admin/tasks/${taskId}`, {
                    method: 'PUT',
                    body: { status: 'in-progress', progress: 1 }
                });
                await this.refreshAllData();
                this.showNotification(this.getTranslation('taskStarted'), 'success');
            } catch (error) {
                console.error('Failed to start task:', error);
                this.showNotification(this.getTranslation('cannotStartTask'), 'error');
            }
        }

        reattachRequestCardEvents(sectionId) {
            const container = document.getElementById(`${sectionId}-tasks`);
            if (!container) return;
            container.querySelectorAll('.request-card').forEach(card => {
                const deleteBtn = card.querySelector('.request-delete-btn');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const id = card.dataset.id;
                        this.deleteRequest(id);
                    });
                }
                card.addEventListener('click', (e) => {
                    if (e.target.closest('.request-delete-btn')) return;
                    const id = card.dataset.id;
                    this.openRequestDetails(id);
                });
            });
        }

        reattachPurchaseCardEvents(sectionId) {
            const container = document.getElementById(`${sectionId}-tasks`);
            if (!container) return;
            container.querySelectorAll('.purchase-card').forEach(card => {
                const deleteBtn = card.querySelector('.purchase-delete-btn');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const id = card.dataset.id;
                        this.deletePurchase(id);
                    });
                }
                card.addEventListener('click', (e) => {
                    if (e.target.closest('.purchase-delete-btn')) return;
                    const id = card.dataset.id;
                    this.openPurchaseDetails(id);
                });
            });
        }

        reattachPenaltyCardEvents() {
            document.querySelectorAll('.penalty-card').forEach(card => {
                const removeBtn = card.querySelector('.penalty-remove-btn');
                if (removeBtn) {
                    removeBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const id = card.dataset.id;
                        this.removePenalty(id);
                    });
                }
                
                const commentsBtn = card.querySelector('.task-comments');
                if (commentsBtn) {
                    commentsBtn.removeEventListener('click', this.handlePenaltyComments);
                    commentsBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const taskId = commentsBtn.dataset.taskId;
                        if (taskId) {
                            this.openCommentsModal(taskId);
                        }
                    });
                }
                
                const attachmentsBtn = card.querySelector('.task-attachments');
                if (attachmentsBtn) {
                    attachmentsBtn.removeEventListener('click', this.handlePenaltyAttachments);
                    attachmentsBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const taskId = attachmentsBtn.dataset.taskId;
                        if (taskId) {
                            this.openAttachmentsModal(taskId);
                        }
                    });
                }

                card.addEventListener('click', (e) => {
                    if (e.target.closest('.penalty-remove-btn, .task-comments, .task-attachments')) return;
                    const taskId = card.dataset.taskId;
                    if (taskId) {
                        this.openTaskDetails(taskId);
                    }
                });
            });
        }

        reattachManualPenaltyCardEvents() {
            document.querySelectorAll('.manual-penalty-card').forEach(card => {
                const removeBtn = card.querySelector('.manual-penalty-remove-btn');
                if (removeBtn) {
                    removeBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const id = card.dataset.id;
                        this.selectedManualPenalty = this.manualPenalties.find(p => p.id == id);
                        if (this.selectedManualPenalty) {
                            Swal.fire({
                                title: this.getTranslation('removePenalty'),
                                text: this.getTranslation('confirmRemovePenalty'),
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonColor: '#e74c3c',
                                cancelButtonColor: '#95a5a6',
                                confirmButtonText: this.getTranslation('removePenalty'),
                                cancelButtonText: this.getTranslation('cancel')
                            }).then(async (result) => {
                                if (result.isConfirmed) {
                                    await this.deleteManualPenalty(this.selectedManualPenalty.id);
                                    await this.refreshAllData();
                                }
                            });
                        }
                    });
                }
                card.addEventListener('click', (e) => {
                    if (e.target.closest('.manual-penalty-remove-btn')) return;
                    const id = card.dataset.id;
                    this.showManualPenaltyDetails(id);
                });
            });
        }

        openRequestDetails(requestId) {
            let request = this.requestsReceived.find(r => r.id == requestId);
            if (!request) request = this.requestsSent.find(r => r.id == requestId);
            if (!request) return;
            const modal = document.getElementById('request-detail-modal');
            const body = document.getElementById('request-detail-body');
            if (!modal || !body) return;
            const assigneeName = request.assigneeId ? (this.users[request.assigneeId]?.name || this.getTranslation('notAssigned')) : this.getTranslation('notAssigned');
            body.innerHTML = `
                <div class="task-detail">
                    <div class="task-detail-header">
                        <div class="task-detail-icon"><i class="fas fa-file-alt"></i></div>
                        <div class="task-detail-title-section">
                            <h2>${this.escapeHtml(request.title)}</h2>
                        </div>
                    </div>
                    <div class="request-detail-grid">
                        <div class="detail-card">
                            <h4>${this.getTranslation('basicInfo')}</h4>
                            <div class="detail-item">
                                <span class="detail-label">${this.getTranslation('description')}</span>
                                <span class="detail-value">${this.escapeHtml(request.description)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">${this.getTranslation('assignee')}</span>
                                <span class="detail-value">${assigneeName}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">${this.getTranslation('status')}</span>
                                <span class="detail-value">${request.status}</span>
                            </div>
                        </div>
                        <div class="detail-card">
                            <h4>${this.getTranslation('stats')}</h4>
                            <div class="detail-item">
                                <span class="detail-label">${this.getTranslation('created')}</span>
                                <span class="detail-value">${this.formatDate(request.createdAt)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">${this.getTranslation('lastUpdated')}</span>
                                <span class="detail-value">${this.formatDate(request.updatedAt)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            this.openModal(modal);
        }

        openPurchaseDetails(purchaseId) {
            let purchase = this.purchasesReceived.find(p => p.id == purchaseId);
            if (!purchase) purchase = this.purchasesSent.find(p => p.id == purchaseId);
            if (!purchase) return;
            const modal = document.getElementById('purchase-detail-modal');
            const body = document.getElementById('purchase-detail-body');
            if (!modal || !body) return;
            const assigneeName = purchase.assigneeId ? (this.users[purchase.assigneeId]?.name || this.getTranslation('notAssigned')) : this.getTranslation('notAssigned');
            body.innerHTML = `
                <div class="task-detail">
                    <div class="task-detail-header">
                        <div class="task-detail-icon"><i class="fas fa-shopping-cart"></i></div>
                        <div class="task-detail-title-section">
                            <h2>${this.escapeHtml(purchase.item)}</h2>
                        </div>
                    </div>
                    <div class="purchase-detail-grid">
                        <div class="detail-card">
                            <h4>${this.getTranslation('basicInfo')}</h4>
                            <div class="detail-item">
                                <span class="detail-label">${this.getTranslation('quantity')}</span>
                                <span class="detail-value">${purchase.quantity}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">${this.getTranslation('urgency')}</span>
                                <span class="detail-value">${purchase.urgency === 'urgent' ? this.getTranslation('urgent') : this.getTranslation('normal')}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">${this.getTranslation('description')}</span>
                                <span class="detail-value">${this.escapeHtml(purchase.description)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">${this.getTranslation('assignee')}</span>
                                <span class="detail-value">${assigneeName}</span>
                            </div>
                        </div>
                        <div class="detail-card">
                            <h4>${this.getTranslation('stats')}</h4>
                            <div class="detail-item">
                                <span class="detail-label">${this.getTranslation('created')}</span>
                                <span class="detail-value">${this.formatDate(purchase.createdAt)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">${this.getTranslation('lastUpdated')}</span>
                                <span class="detail-value">${this.formatDate(purchase.updatedAt)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            this.openModal(modal);
        }

        openUpdateProgressModal(taskId) {
            const task = this.tasks.find(t => t.id == taskId);
            if (!task) return;
            if (task.type !== 'received' && task.type !== 'subtask') {
                this.showNotification(this.getTranslation('cannotUpdateProgress'), 'error');
                return;
            }
            this.selectedTask = task;
            const modal = this.elements.updateProgressModal;
            const slider = document.getElementById('progress-slider');
            const valueDisplay = document.getElementById('progress-value');
            const suggestedStatus = document.getElementById('suggested-status');
            if (modal && slider) {
                slider.value = task.progress || 0;
                if (valueDisplay) valueDisplay.textContent = task.progress || 0;
                if (suggestedStatus) {
                    if (task.progress === 0) suggestedStatus.textContent = this.getTranslation('statusSuggestionAt0');
                    else if (task.progress === 100) suggestedStatus.textContent = this.getTranslation('statusSuggestionAt100');
                    else if (task.progress < 30) suggestedStatus.textContent = this.getTranslation('statusSuggestionStart');
                    else if (task.progress < 70) suggestedStatus.textContent = this.getTranslation('statusSuggestionMid');
                    else suggestedStatus.textContent = this.getTranslation('statusSuggestionReview');
                }
                document.getElementById('progress-note').value = '';
                slider.oninput = () => {
                    const val = parseInt(slider.value);
                    if (valueDisplay) valueDisplay.textContent = val;
                    if (suggestedStatus) {
                        if (val === 0) suggestedStatus.textContent = this.getTranslation('statusSuggestionAt0');
                        else if (val === 100) suggestedStatus.textContent = this.getTranslation('statusSuggestionAt100');
                        else if (val < 30) suggestedStatus.textContent = this.getTranslation('statusSuggestionStart');
                        else if (val < 70) suggestedStatus.textContent = this.getTranslation('statusSuggestionMid');
                        else suggestedStatus.textContent = this.getTranslation('statusSuggestionReview');
                    }
                };
                this.openModal(modal);
            }
        }

        async openCommentsModal(taskId) {
            try {
                const result = await this.apiRequest(`/api/admin/tasks/${taskId}`);
                const task = result.data;
                if (!task) return;
                this.selectedTask = task;
                const commentsThread = document.getElementById('comments-thread');
                if (commentsThread) {
                    if (task.comments && task.comments.length > 0) {
                        commentsThread.innerHTML = task.comments.map(c => `
                            <div class="comment-item">
                                <div class="comment-avatar"><img src="${c.profileImage || `https://i.pravatar.cc/32?img=${c.userId}`}" alt="${c.fullName}" style="width: 32px; height: 32px; border-radius: 50%;"></div>
                                <div class="comment-content">
                                    <div class="comment-author">${c.fullName || 'مستخدم'}</div>
                                    <div class="comment-time">${this.formatDate(c.createdAt)}</div>
                                    <div class="comment-text">${c.comment}</div>
                                </div>
                            </div>
                        `).join('');
                    } else {
                        commentsThread.innerHTML = '<p>' + this.getTranslation('noComments') + '</p>';
                    }
                }
                this.openModal(this.elements.commentsModal);
            } catch (error) {
                console.error('Failed to load comments:', error);
                this.showNotification('حدث خطأ أثناء تحميل التعليقات', 'error');
            }
        }

        async openAttachmentsModal(taskId) {
            try {
                const result = await this.apiRequest(`/api/admin/tasks/${taskId}`);
                const task = result.data;
                if (!task) return;
                const modal = this.elements.attachmentsModal;
                const list = document.getElementById('attachments-list');
                if (list) {
                    list.innerHTML = '';
                    if (task.attachments && task.attachments.length > 0) {
                        task.attachments.forEach(att => {
                            const fileUrl = att.fileUrl.startsWith('http') ? att.fileUrl : `/api${att.fileUrl}`;
                            list.innerHTML += `
                                <div class="attachment-item">
                                    <div class="attachment-icon"><i class="fas ${att.mimeType?.startsWith('image/') ? 'fa-image' : 'fa-file'}"></i></div>
                                    <div class="attachment-info">
                                        <div class="attachment-name">${att.fileName}</div>
                                        <div class="attachment-meta">${att.fileSize} bytes • ${this.formatDate(att.uploadedAt)}</div>
                                    </div>
                                    <a href="${fileUrl}" target="_blank" class="attachment-download"><i class="fas fa-download"></i></a>
                                </div>
                            `;
                        });
                    } else {
                        list.innerHTML = '<div class="text-center">لا توجد مرفقات</div>';
                    }
                }

                const uploadBtn = document.getElementById('upload-attachment-btn');
                const fileInput = document.getElementById('attachment-file-input');
                if (uploadBtn && fileInput) {
                    const newUploadBtn = uploadBtn.cloneNode(true);
                    uploadBtn.parentNode.replaceChild(newUploadBtn, uploadBtn);
                    const newFileInput = fileInput.cloneNode(true);
                    fileInput.parentNode.replaceChild(newFileInput, fileInput);
                    
                    newUploadBtn.addEventListener('click', () => {
                        newFileInput.click();
                    });
                    newFileInput.addEventListener('change', async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append('attachments', file);
                        try {
                            await this.apiRequest(`/api/admin/tasks/${taskId}/attachments`, {
                                method: 'POST',
                                body: formData
                            });
                            await this.refreshAllData();
                            this.showNotification('تم رفع الملف بنجاح', 'success');
                            this.closeModal(modal);
                            this.openAttachmentsModal(taskId);
                        } catch (error) {
                            console.error('Failed to upload attachment:', error);
                            this.showNotification('حدث خطأ أثناء رفع الملف', 'error');
                        }
                    });
                }
                this.openModal(modal);
            } catch (error) {
                console.error('Failed to load attachments:', error);
                this.showNotification('حدث خطأ أثناء تحميل المرفقات', 'error');
            }
        }

        showSubtasks(taskId) {
            this.openTaskDetails(taskId);
        }

        openNewTaskModal(parentId = null) {
            const modal = this.elements.newTaskModal;
            if (!modal) return;

            // إعادة تعيين النموذج
            const form = document.getElementById('new-task-form');
            if (form) form.reset();

            if (parentId) {
                modal.classList.add('simplified');
                document.getElementById('task-parent-id').value = parentId;
                const parentTask = this.tasks.find(t => t.id == parentId);
                if (parentTask) {
                    document.getElementById('task-title').value = `${this.getTranslation('subtaskOf')}: ${parentTask.title}`;
                }
            } else {
                modal.classList.remove('simplified');
                document.getElementById('task-parent-id').value = '';
            }
            
            // تنظيف أي مهام فرعية سابقة
            const builder = document.getElementById('subtasks-builder');
            if (builder) {
                const rows = builder.querySelectorAll('.subtask-row:not(#subtask-row-template)');
                rows.forEach(r => r.remove());
            }

            // ترجمة عنوان النموذج
            const modalTitle = modal.querySelector('.modal-title');
            if (modalTitle) {
                modalTitle.textContent = this.getTranslation('createNewTask');
            }

            this.openModal(modal);
        }

        openNewRequestModal() {
            if (!this.userPermissions.includes('task_requests')) {
                this.showNotification('ليس لديك صلاحية لإنشاء طلبات', 'error');
                return;
            }
            const modal = this.elements.newRequestModal;
            if (!modal) return;
            document.getElementById('new-request-form')?.reset();
            this.openModal(modal);
        }

        openNewPurchaseModal() {
            if (!this.userPermissions.includes('purchase_requests')) {
                this.showNotification('ليس لديك صلاحية لإنشاء طلبات شراء', 'error');
                return;
            }
            const modal = this.elements.newPurchaseModal;
            if (!modal) return;
            document.getElementById('new-purchase-form')?.reset();
            this.openModal(modal);
        }

        openNewAppointmentModal() {
            if (!this.userPermissions.includes('appointments')) {
                this.showNotification('ليس لديك صلاحية لإنشاء مواعيد', 'error');
                return;
            }
            const modal = this.elements.newAppointmentModal;
            if (!modal) return;
            document.getElementById('new-appointment-form')?.reset();
            this.openModal(modal);
        }

        // ========== التذكيرات الدورية ==========
        startReminderPolling() {
            setInterval(async () => {
                try {
                    const result = await this.apiRequest('/api/admin/tasks/reminders/check', { method: 'POST' });
                    if (result.data && (result.data.tasksSent > 0 || result.data.requestsSent > 0 || result.data.purchasesSent > 0 || result.data.appointmentsSent > 0)) {
                        console.log('Reminders sent:', result.data);
                        await this.loadNotifications();
                    }
                } catch (error) {
                    console.warn('Reminder check failed:', error);
                }
            }, 60000);
        }

        // ========== إدارة الواجهة ==========
        async checkAuth() {
            try {
                const user = this.getCurrentUser();
                if (user && user.id) {
                    this.currentUser = user;
                } else {
                    window.location.href = '../login/index.html';
                    return;
                }
                this.updateUserInfo();
                
                // جلب الصلاحيات من API
                this.userPermissions = await this.fetchUserPermissions();
                console.log('User permissions:', this.userPermissions);
                
                // تطبيق الصلاحيات على الواجهة
                this.applyPermissions(this.userPermissions);
            } catch (error) {
                console.error('❌ Auth check failed:', error);
            }
        }

        updateUserInfo() {
            const userNameEl = document.getElementById('current-user-name');
            const userRoleEl = document.getElementById('current-user-role');
            if (userNameEl && this.currentUser) {
                userNameEl.textContent = this.currentUser.fullName || this.currentUser.username || 'مستخدم';
            }
            if (userRoleEl && this.currentUser) {
                const roleMap = {
                    'مشرف_عام': 'مشرف عام',
                    'مدير_مشاريع': 'مدير مشاريع',
                    'محاسب': 'محاسب',
                    'موظف_استقبال': 'موظف استقبال',
                    'خدمة_عملاء': 'خدمة عملاء',
                    'مبيعات': 'مبيعات',
                    'موارد_بشرية': 'موارد بشرية',
                    'موظف': 'موظف'
                };
                userRoleEl.textContent = roleMap[this.currentUser.role] || this.currentUser.role;
            }
        }

        cacheElements() {
            this.elements = {
                menuToggle: document.getElementById('menu-toggle'),
                sidebar: document.getElementById('dashboard-sidebar'),
                sidebarClose: document.getElementById('sidebar-close'),
                sidebarBackdrop: document.getElementById('sidebar-backdrop'),
                globalSearch: document.getElementById('global-search'),
                searchBtn: document.getElementById('global-search-btn'),
                searchResults: document.getElementById('search-results'),
                searchResultsList: document.getElementById('search-results-list'),
                searchCount: document.getElementById('search-count'),
                notificationsBtn: document.getElementById('notifications-btn'),
                notificationsContent: document.getElementById('notifications-content'),
                notificationsList: document.getElementById('notifications-list'),
                notificationsCount: document.getElementById('notifications-count'),
                markAllRead: document.getElementById('mark-all-read'),
                tasksBoard: document.getElementById('tasks-board'),
                sentTasks: document.getElementById('sent-tasks'),
                receivedTasks: document.getElementById('received-tasks'),
                subtasksTasks: document.getElementById('subtasks-tasks'),
                requestsSentTasks: document.getElementById('requests-sent-tasks'),
                requestsReceivedTasks: document.getElementById('requests-received-tasks'),
                purchasesSentTasks: document.getElementById('purchases-sent-tasks'),
                purchasesReceivedTasks: document.getElementById('purchases-received-tasks'),
                penaltiesTasks: document.getElementById('penalties-tasks'),
                manualPenaltiesTasks: document.getElementById('manual-penalties-tasks'),
                archivedTasks: document.getElementById('archived-tasks'),
                newTaskBtn: document.getElementById('new-task-btn'),
                newRequestBtn: document.getElementById('new-request-btn'),
                newPurchaseBtn: document.getElementById('new-purchase-btn'),
                newAppointmentBtn: document.getElementById('new-appointment-btn'),
                newManualPenaltyBtn: document.getElementById('new-manual-penalty-btn'),
                viewOptions: document.querySelectorAll('.view-option'),
                clearFilters: document.getElementById('clear-filters'),
                saveFilter: document.getElementById('save-filter'),
                filterStatus: document.getElementById('filter-status'),
                filterPriority: document.getElementById('filter-priority'),
                filterAssignee: document.getElementById('filter-assignee'),
                filterDue: document.getElementById('filter-due'),
                filterProject: document.getElementById('filter-project'),
                taskDetailModal: document.getElementById('task-detail-modal'),
                newTaskModal: document.getElementById('new-task-modal'),
                newRequestModal: document.getElementById('new-request-modal'),
                newPurchaseModal: document.getElementById('new-purchase-modal'),
                newAppointmentModal: document.getElementById('new-appointment-modal'),
                updateProgressModal: document.getElementById('update-progress-modal'),
                commentsModal: document.getElementById('comments-modal'),
                attachmentsModal: document.getElementById('attachments-modal'),
                calendarModal: document.getElementById('calendar-quick-view'),
                removePenaltyModal: document.getElementById('remove-penalty-modal'),
                appointmentDayModal: document.getElementById('appointment-day-modal'),
                appointmentDetailModal: document.getElementById('appointment-detail-modal'),
                statSentTotal: document.getElementById('stat-sent-total'),
                statSentCompleted: document.getElementById('stat-sent-completed'),
                statSentProgress: document.getElementById('stat-sent-progress'),
                statSentOverdue: document.getElementById('stat-sent-overdue'),
                statReceivedTotal: document.getElementById('stat-received-total'),
                statReceivedCompleted: document.getElementById('stat-received-completed'),
                statReceivedProgress: document.getElementById('stat-received-progress'),
                statReceivedOverdue: document.getElementById('stat-received-overdue'),
                statRequestsSent: document.getElementById('stat-requests-sent'),
                statRequestsReceived: document.getElementById('stat-requests-received'),
                statPurchasesSent: document.getElementById('stat-purchases-sent'),
                statPurchasesReceived: document.getElementById('stat-purchases-received'),
                statTotalAppointments: document.getElementById('stat-total-appointments'),
                statTeam: document.getElementById('stat-team'),
                statPenalties: document.getElementById('stat-penalties'),
                modalTaskTitle: document.getElementById('modal-task-title'),
                modalTaskBody: document.getElementById('modal-task-body'),
                modalTaskFooter: document.getElementById('modal-task-footer'),
                modalEditTaskBtn: document.getElementById('modal-edit-task-btn'),
                modalAddSubtaskBtn: document.getElementById('modal-add-subtask-btn'),
                calendarView: document.getElementById('calendar-view'),
                calendarMonthYear: document.getElementById('calendar-month-year'),
                calendarGrid: document.getElementById('calendar-grid'),
                calendarPrev: document.getElementById('calendar-prev'),
                calendarNext: document.getElementById('calendar-next'),
                refreshCharts: document.getElementById('refresh-charts'),
                exportReport: document.getElementById('export-report'),
                analyticsPeriod: document.getElementById('analytics-period')
            };
        }

        async init() {
            console.log('🚀 TasksManager initializing...');
            await this.checkAuth();
            this.cacheElements();
            await this.loadInitialData();
            this.initCharts();
            this.initDragAndDrop();
            this.attachEventListeners();
            this.initSectionFilters();
            this.reattachTaskCardEvents();
            this.reattachRequestCardEvents('requests-sent');
            this.reattachRequestCardEvents('requests-received');
            this.reattachPurchaseCardEvents('purchases-sent');
            this.reattachPurchaseCardEvents('purchases-received');
            this.reattachPenaltyCardEvents();
            this.reattachManualPenaltyCardEvents();
            this.initVoiceInput();
            this.startPeriodicRefresh();
            this.startReminderPolling();
            this.updateSystemTime();
            setInterval(() => this.updateSystemTime(), 1000);
            this.setupMobileEnhancements();
            this.setupSectionSpecificButtons();

            const notificationsBtn = document.getElementById('notifications-btn');
            const notificationsContent = document.getElementById('notifications-content');
            if (notificationsBtn && notificationsContent) {
                notificationsBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    notificationsContent.classList.toggle('show');
                    this.loadNotifications();
                });
                document.addEventListener('click', (e) => {
                    if (!notificationsBtn.contains(e.target) && !notificationsContent.contains(e.target)) {
                        notificationsContent.classList.remove('show');
                    }
                });
            }

            const markAllReadBtn = document.getElementById('mark-all-read');
            if (markAllReadBtn) {
                markAllReadBtn.addEventListener('click', () => this.markAllNotificationsRead());
            }

            if (this.elements.notificationsList) {
                this.elements.notificationsList.addEventListener('click', async (e) => {
                    const item = e.target.closest('.notification-item');
                    if (!item) return;
                    const id = item.dataset.id;
                    const entityType = item.dataset.entityType;
                    const entityId = item.dataset.entityId;
                    if (id) await this.markNotificationRead(id);
                    if (entityType && entityId) {
                        if (entityType === 'task') {
                            this.openTaskDetails(entityId);
                        } else if (entityType === 'request') {
                            this.openRequestDetails(entityId);
                        } else if (entityType === 'purchase') {
                            this.openPurchaseDetails(entityId);
                        } else if (entityType === 'appointment') {
                            const appointment = this.appointments.find(a => a.id == entityId);
                            if (appointment) this.showAppointmentDetails(appointment);
                        }
                    }
                    this.elements.notificationsContent.classList.remove('show');
                });
            }

            const rateSubmit = document.getElementById('rate-submit');
            if (rateSubmit) {
                rateSubmit.addEventListener('click', () => this.submitRating());
            }
            const rateCancel = document.getElementById('rate-cancel');
            if (rateCancel) {
                rateCancel.addEventListener('click', () => this.closeModal(document.getElementById('rate-task-modal')));
            }
            const rateModalClose = document.getElementById('rate-modal-close');
            if (rateModalClose) {
                rateModalClose.addEventListener('click', () => this.closeModal(document.getElementById('rate-task-modal')));
            }

            const langToggle = document.getElementById('language-toggle') || document.getElementById('lang-toggle');
            if (langToggle) {
                langToggle.addEventListener('click', () => this.toggleLanguage());
            } else {
                console.warn('Language toggle button not found. Make sure there is an element with id "language-toggle" or "lang-toggle".');
            }

            const modeBtns = document.querySelectorAll('.calendar-mode-btn');
            modeBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    modeBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.calendarMode = btn.dataset.mode;
                    this.renderCalendar();
                });
            });

            if (this.elements.newManualPenaltyBtn) {
                this.elements.newManualPenaltyBtn.addEventListener('click', () => this.openNewManualPenaltyModal());
            }
            const newManualPenaltySubmit = document.getElementById('new-manual-penalty-submit');
            if (newManualPenaltySubmit) {
                newManualPenaltySubmit.addEventListener('click', () => this.createManualPenaltySubmit());
            }
            const newManualPenaltyCancel = document.getElementById('new-manual-penalty-cancel');
            if (newManualPenaltyCancel) {
                newManualPenaltyCancel.addEventListener('click', () => this.closeModal(document.getElementById('new-manual-penalty-modal')));
            }
            const newManualPenaltyClose = document.getElementById('new-manual-penalty-close');
            if (newManualPenaltyClose) {
                newManualPenaltyClose.addEventListener('click', () => this.closeModal(document.getElementById('new-manual-penalty-modal')));
            }
            const deleteManualPenaltyBtn = document.getElementById('delete-manual-penalty-btn');
            if (deleteManualPenaltyBtn) {
                deleteManualPenaltyBtn.addEventListener('click', () => this.deleteManualPenaltySubmit());
            }
            const manualPenaltyDetailClose = document.getElementById('manual-penalty-detail-close');
            if (manualPenaltyDetailClose) {
                manualPenaltyDetailClose.addEventListener('click', () => this.closeModal(document.getElementById('manual-penalty-detail-modal')));
            }
            const manualPenaltyDetailCloseBtn = document.getElementById('manual-penalty-detail-close-btn');
            if (manualPenaltyDetailCloseBtn) {
                manualPenaltyDetailCloseBtn.addEventListener('click', () => this.closeModal(document.getElementById('manual-penalty-detail-modal')));
            }

            document.body.addEventListener('click', () => {
                this.requestAudioPermission();
            }, { once: true });
        }

        initDragAndDrop() {
            if (typeof Sortable === 'undefined') {
                console.warn('SortableJS غير متوفر');
                return;
            }

            const containers = ['sent-tasks', 'received-tasks', 'subtasks-tasks', 'archived-tasks'];

            containers.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    new Sortable(el, {
                        group: {
                            name: 'tasks',
                            pull: true,
                            revertClone: false
                        },
                        animation: 250,
                        ghostClass: 'task-card-ghost',
                        dragClass: 'task-card-drag',
                        handle: '.task-card',
                        onEnd: async (evt) => {
                            const taskId = evt.item.dataset.id;
                            const newStatus = evt.to.dataset.status;
                            if (taskId && newStatus) {
                                await this.updateTaskStatus(taskId, newStatus);
                            }
                            this.showNotification(this.getTranslation('taskOrderUpdated'), 'info');
                        }
                    });
                }
            });
        }

        attachEventListeners() {
            if (this.elements.menuToggle) {
                this.elements.menuToggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.toggleSidebar();
                });
            }
            if (this.elements.sidebarClose) {
                this.elements.sidebarClose.addEventListener('click', () => this.closeSidebar());
            }
            if (this.elements.sidebarBackdrop) {
                this.elements.sidebarBackdrop.addEventListener('click', () => this.closeSidebar());
            }

            if (this.elements.globalSearch) {
                this.elements.globalSearch.addEventListener('input', this.debounce((e) => this.handleSearch(e), 300));
                this.elements.globalSearch.addEventListener('focus', () => {
                    if (this.elements.searchResults) this.elements.searchResults.classList.add('active');
                });
            }
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.advanced-search') && this.elements.searchResults) {
                    this.elements.searchResults.classList.remove('active');
                }
            });

            if (this.elements.filterStatus) {
                this.elements.filterStatus.addEventListener('change', () => this.applyFilters());
            }
            if (this.elements.filterPriority) {
                this.elements.filterPriority.addEventListener('change', () => this.applyFilters());
            }
            if (this.elements.filterAssignee) {
                this.elements.filterAssignee.addEventListener('change', () => this.applyFilters());
            }
            if (this.elements.filterDue) {
                this.elements.filterDue.addEventListener('change', () => this.applyFilters());
            }
            if (this.elements.filterProject) {
                this.elements.filterProject.addEventListener('change', () => this.applyFilters());
            }
            if (this.elements.clearFilters) {
                this.elements.clearFilters.addEventListener('click', () => this.clearFilters());
            }
            if (this.elements.saveFilter) {
                this.elements.saveFilter.addEventListener('click', () => this.saveCurrentFilter());
            }

            if (this.elements.newTaskBtn) {
                this.elements.newTaskBtn.addEventListener('click', () => this.openNewTaskModal());
            }
            if (this.elements.newRequestBtn) {
                this.elements.newRequestBtn.addEventListener('click', () => this.openNewRequestModal());
            }
            if (this.elements.newPurchaseBtn) {
                this.elements.newPurchaseBtn.addEventListener('click', () => this.openNewPurchaseModal());
            }
            if (this.elements.newAppointmentBtn) {
                this.elements.newAppointmentBtn.addEventListener('click', () => this.openNewAppointmentModal());
            }

            this.elements.viewOptions.forEach(opt => {
                opt.addEventListener('click', (e) => {
                    const view = e.currentTarget.dataset.view;
                    this.changeView(view);
                });
            });

            document.querySelectorAll('.saved-filter-tag').forEach(tag => {
                tag.addEventListener('click', (e) => {
                    if (e.target.classList.contains('add-filter') || e.target.id === 'add-filter-btn') return;
                    document.querySelectorAll('.saved-filter-tag').forEach(t => t.classList.remove('active'));
                    tag.classList.add('active');
                    this.applySavedFilter(tag.textContent.trim());
                });
            });

            const addFilterBtn = document.getElementById('add-filter-btn');
            if (addFilterBtn) {
                addFilterBtn.addEventListener('click', () => this.saveCurrentFilter());
            }

            if (this.elements.markAllRead) {
                this.elements.markAllRead.addEventListener('click', () => this.markAllNotificationsRead());
            }

            this.setupModalCloseButtons();

            const progressSubmit = document.getElementById('progress-submit');
            if (progressSubmit) {
                progressSubmit.addEventListener('click', async () => {
                    if (!this.selectedTask) return;
                    const slider = document.getElementById('progress-slider');
                    const note = document.getElementById('progress-note')?.value;
                    const newProgress = parseInt(slider.value);
                    
                    try {
                        await this.updateTaskProgress(this.selectedTask.id, newProgress, note);
                        await this.refreshAllData();
                        this.closeModal(this.elements.updateProgressModal);
                    } catch (error) {
                        console.error('Failed to update progress:', error);
                        this.showNotification('حدث خطأ أثناء تحديث التقدم', 'error');
                    }
                });
            }

            const sendComment = document.getElementById('send-comment');
            if (sendComment) {
                sendComment.addEventListener('click', async () => {
                    const commentText = document.getElementById('new-comment')?.value;
                    if (commentText && commentText.trim() !== '') {
                        await this.addNewComment(commentText);
                        document.getElementById('new-comment').value = '';
                        if (this.selectedTask) {
                            await this.openCommentsModal(this.selectedTask.id);
                        }
                    }
                });
            }

            const newTaskSubmit = document.getElementById('new-task-submit');
            if (newTaskSubmit) {
                newTaskSubmit.addEventListener('click', () => this.createNewTask());
            }

            const newTaskCancel = document.getElementById('new-task-cancel');
            if (newTaskCancel) {
                newTaskCancel.addEventListener('click', () => this.closeModal(this.elements.newTaskModal));
            }

            const newRequestSubmit = document.getElementById('new-request-submit');
            if (newRequestSubmit) {
                newRequestSubmit.addEventListener('click', () => this.createNewRequest());
            }

            const newRequestCancel = document.getElementById('new-request-cancel');
            if (newRequestCancel) {
                newRequestCancel.addEventListener('click', () => this.closeModal(this.elements.newRequestModal));
            }

            const newPurchaseSubmit = document.getElementById('new-purchase-submit');
            if (newPurchaseSubmit) {
                newPurchaseSubmit.addEventListener('click', () => this.createNewPurchase());
            }

            const newPurchaseCancel = document.getElementById('new-purchase-cancel');
            if (newPurchaseCancel) {
                newPurchaseCancel.addEventListener('click', () => this.closeModal(this.elements.newPurchaseModal));
            }

            const newAppointmentSubmit = document.getElementById('new-appointment-submit');
            if (newAppointmentSubmit) {
                newAppointmentSubmit.addEventListener('click', () => this.createNewAppointment());
            }

            const newAppointmentCancel = document.getElementById('new-appointment-cancel');
            if (newAppointmentCancel) {
                newAppointmentCancel.addEventListener('click', () => this.closeModal(this.elements.newAppointmentModal));
            }

            const addSubtaskRow = document.getElementById('add-subtask-row');
            if (addSubtaskRow) {
                addSubtaskRow.addEventListener('click', () => {
                    const builder = document.getElementById('subtasks-builder');
                    const template = document.getElementById('subtask-row-template');
                    const newRow = template.cloneNode(true);
                    newRow.id = '';
                    newRow.style.display = 'flex';
                    const titleInput = newRow.querySelector('.subtask-title');
                    const assigneeSelect = newRow.querySelector('.subtask-assignee');
                    titleInput.value = '';
                    assigneeSelect.selectedIndex = 0;
                    newRow.querySelector('.remove-subtask').addEventListener('click', (e) => {
                        e.target.closest('.subtask-row').remove();
                    });
                    builder.insertBefore(newRow, addSubtaskRow);
                });
            }

            if (this.elements.calendarPrev) {
                this.elements.calendarPrev.addEventListener('click', () => {
                    this.calendarCurrentDate.setMonth(this.calendarCurrentDate.getMonth() - 1);
                    this.renderCalendar();
                });
            }
            if (this.elements.calendarNext) {
                this.elements.calendarNext.addEventListener('click', () => {
                    this.calendarCurrentDate.setMonth(this.calendarCurrentDate.getMonth() + 1);
                    this.renderCalendar();
                });
            }

            if (this.elements.refreshCharts) {
                this.elements.refreshCharts.addEventListener('click', () => {
                    this.updateCharts();
                    this.showNotification(this.getTranslation('chartsUpdated'), 'success');
                });
            }
            if (this.elements.exportReport) {
                this.elements.exportReport.addEventListener('click', () => {
                    this.exportReport();
                });
            }
            if (this.elements.analyticsPeriod) {
                this.elements.analyticsPeriod.addEventListener('change', () => {
                    this.updateCharts();
                });
            }

            const closeAppointmentDay = document.getElementById('appointment-day-close');
            if (closeAppointmentDay) {
                closeAppointmentDay.addEventListener('click', () => this.closeModal(this.elements.appointmentDayModal));
            }
            const closeAppointmentDayBtn = document.getElementById('appointment-day-close-btn');
            if (closeAppointmentDayBtn) {
                closeAppointmentDayBtn.addEventListener('click', () => this.closeModal(this.elements.appointmentDayModal));
            }
            const closeAppointmentDetail = document.getElementById('appointment-detail-close');
            if (closeAppointmentDetail) {
                closeAppointmentDetail.addEventListener('click', () => this.closeModal(this.elements.appointmentDetailModal));
            }
            const closeAppointmentDetailBtn = document.getElementById('appointment-detail-close-btn');
            if (closeAppointmentDetailBtn) {
                closeAppointmentDetailBtn.addEventListener('click', () => this.closeModal(this.elements.appointmentDetailModal));
            }

            const removePenaltyCancel = document.getElementById('remove-penalty-cancel');
            if (removePenaltyCancel) {
                removePenaltyCancel.addEventListener('click', () => this.closeModal(this.elements.removePenaltyModal));
            }
            const removePenaltyConfirm = document.getElementById('remove-penalty-confirm');
            if (removePenaltyConfirm) {
                removePenaltyConfirm.addEventListener('click', () => {
                    if (this.selectedPenalty) {
                        this.removePenalty(this.selectedPenalty);
                        this.closeModal(this.elements.removePenaltyModal);
                    }
                });
            }

            const clearPenaltiesBtn = document.querySelector('[data-section="penalties"] .section-clear-btn');
            if (clearPenaltiesBtn) {
                clearPenaltiesBtn.addEventListener('click', () => {
                    this.penalties = [];
                    this.renderPenalties();
                    this.showNotification(this.getTranslation('allPenaltiesCleared'), 'success');
                    this.updateSectionsCount();
                });
            }
        }

        initVoiceInput() {
            setTimeout(() => {
                document.querySelectorAll('.voice-input-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        const targetId = btn.dataset.target;
                        const targetInput = document.getElementById(targetId);
                        if (targetInput) {
                            this.startVoiceInput(targetInput, btn);
                        }
                    });
                });
            }, 1000);
        }

        startVoiceInput(inputElement, buttonElement) {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                this.showNotification(this.getTranslation('voiceInputError') + ': المتصفح لا يدعم الإدخال الصوتي', 'error');
                return;
            }

            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.lang = this.currentLang === 'ar' ? 'ar-SA' : 'en-US';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            buttonElement.classList.add('listening');
            buttonElement.innerHTML = '<i class="fas fa-microphone-slash"></i>';
            this.showNotification(this.getTranslation('voiceInputListening'), 'info');

            recognition.start();

            recognition.onresult = (event) => {
                const speechResult = event.results[0][0].transcript;
                inputElement.value = speechResult;
                buttonElement.classList.remove('listening');
                buttonElement.innerHTML = '<i class="fas fa-microphone"></i>';
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                buttonElement.classList.remove('listening');
                buttonElement.innerHTML = '<i class="fas fa-microphone"></i>';
                this.showNotification(this.getTranslation('voiceInputError') + ': ' + event.error, 'error');
            };

            recognition.onend = () => {
                buttonElement.classList.remove('listening');
                buttonElement.innerHTML = '<i class="fas fa-microphone"></i>';
            };
        }

        toggleSidebar() {
            if (this.elements.sidebar) {
                this.elements.sidebar.classList.toggle('active');
                let backdrop = document.querySelector('.sidebar-backdrop');
                if (!backdrop) {
                    backdrop = document.createElement('div');
                    backdrop.className = 'sidebar-backdrop';
                    document.body.appendChild(backdrop);
                    backdrop.addEventListener('click', () => this.closeSidebar());
                }
                backdrop.classList.toggle('active');
                if (this.elements.sidebar.classList.contains('active')) {
                    document.body.style.overflow = 'hidden';
                    document.body.classList.add('sidebar-open');
                } else {
                    document.body.style.overflow = '';
                    document.body.classList.remove('sidebar-open');
                }
            }
        }

        closeSidebar() {
            if (this.elements.sidebar) {
                this.elements.sidebar.classList.remove('active');
                const backdrop = document.querySelector('.sidebar-backdrop');
                if (backdrop) backdrop.classList.remove('active');
                document.body.style.overflow = '';
                document.body.classList.remove('sidebar-open');
            }
        }

        handleSearch(e) {
            const query = e.target.value.trim().toLowerCase();
            const resultsList = this.elements.searchResultsList;
            const searchCount = this.elements.searchCount;
            if (!resultsList) return;

            if (query.length < 2) {
                resultsList.innerHTML = `<div class="search-empty">${this.getTranslation('searchEmpty')}</div>`;
                if (searchCount) searchCount.textContent = '0';
                return;
            }

            const results = this.tasks
                .filter(task => task.title.toLowerCase().includes(query) || (task.description && task.description.toLowerCase().includes(query)))
                .map(task => ({
                    id: task.id,
                    title: task.title,
                    type: this.getTranslation('task'),
                    subtitle: `${this.getTranslation('project')}: ${this.projects[task.projectId] || this.getTranslation('noProject')}`,
                    icon: 'fa-tasks'
                }));

            if (searchCount) searchCount.textContent = results.length;

            if (results.length === 0) {
                resultsList.innerHTML = `<div class="search-empty">${this.getTranslation('noResults')}</div>`;
                return;
            }

            resultsList.innerHTML = results.map(r => `
                <div class="search-result-item" data-id="${r.id}" data-type="task">
                    <div class="search-result-icon"><i class="fas ${r.icon}"></i></div>
                    <div class="search-result-info">
                        <div class="search-result-title">${this.escapeHtml(r.title)}</div>
                        <div class="search-result-subtitle">
                            <span>${r.type}</span> • <span>${r.subtitle}</span>
                        </div>
                    </div>
                </div>
            `).join('');

            const searchItems = resultsList.querySelectorAll('.search-result-item');
            searchItems.forEach(item => {
                item.removeEventListener('click', this.handleSearchResultClick);
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = item.dataset.id;
                    const type = item.dataset.type;
                    if (id && type === 'task') {
                        this.openTaskDetails(id);
                        if (this.elements.searchResults) {
                            this.elements.searchResults.classList.remove('active');
                        }
                        if (this.elements.globalSearch) {
                            this.elements.globalSearch.value = '';
                        }
                    }
                });
            });
        }

        applyFilters() {
            this.filters = {
                status: this.elements.filterStatus?.value || 'all',
                priority: this.elements.filterPriority?.value || 'all',
                assignee: this.elements.filterAssignee?.value || 'all',
                dueDate: this.elements.filterDue?.value || 'all',
                project: this.elements.filterProject?.value || 'all'
            };

            this.filteredTasks = this.tasks.filter(task => {
                if (this.filters.status !== 'all' && task.status !== this.filters.status) return false;
                if (this.filters.priority !== 'all' && task.priority !== this.filters.priority) return false;
                if (this.filters.assignee !== 'all') {
                    if (this.filters.assignee === 'me') {
                        if (!task.assignees || !task.assignees.includes(this.currentUser.id)) return false;
                    } else {
                        const assigneeId = parseInt(this.filters.assignee);
                        if (!task.assignees || !task.assignees.includes(assigneeId)) return false;
                    }
                }
                if (this.filters.dueDate !== 'all') {
                    if (!task.dueDate) return false;
                    const today = new Date(); today.setHours(0,0,0,0);
                    const due = new Date(task.dueDate);
                    if (this.filters.dueDate === 'today') {
                        if (due.toDateString() !== today.toDateString()) return false;
                    } else if (this.filters.dueDate === 'tomorrow') {
                        const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
                        if (due.toDateString() !== tomorrow.toDateString()) return false;
                    } else if (this.filters.dueDate === 'week') {
                        const weekLater = new Date(today); weekLater.setDate(weekLater.getDate() + 7);
                        if (due < today || due > weekLater) return false;
                    } else if (this.filters.dueDate === 'overdue') {
                        if (!task.isOverdue) return false;
                    } else if (this.filters.dueDate === 'no-date') {
                        if (task.dueDate) return false;
                    }
                }
                if (this.filters.project !== 'all') {
                    const projectId = parseInt(this.filters.project);
                    if (task.projectId !== projectId) return false;
                }
                return true;
            });

            this.updateTasksDisplay();
            this.showNotification(this.getTranslation('tasksFound', { count: this.filteredTasks.length }), 'info');
        }

        updateTasksDisplay() {
            document.querySelectorAll('.task-card').forEach(card => {
                card.style.display = 'none';
            });

            this.filteredTasks.forEach(task => {
                const card = document.querySelector(`.task-card[data-id="${task.id}"]`);
                if (card) card.style.display = 'flex';
            });

            this.updateSectionsCount();
        }

        clearFilters() {
            const selects = [this.elements.filterStatus, this.elements.filterPriority, this.elements.filterAssignee, this.elements.filterDue, this.elements.filterProject];
            selects.forEach(select => { if (select) select.value = 'all'; });
            this.applyFilters();
            this.showNotification(this.getTranslation('filtersCleared'), 'info');
        }

        saveCurrentFilter() {
            const filterName = prompt(this.getTranslation('enterFilterName'));
            if (filterName && filterName.trim() !== '') {
                const savedFiltersDiv = document.querySelector('.saved-filters');
                const addFilterBtn = document.getElementById('add-filter-btn');
                if (savedFiltersDiv && addFilterBtn) {
                    const newFilter = document.createElement('span');
                    newFilter.className = 'saved-filter-tag';
                    newFilter.textContent = filterName;
                    newFilter.addEventListener('click', () => {
                        document.querySelectorAll('.saved-filter-tag').forEach(t => t.classList.remove('active'));
                        newFilter.classList.add('active');
                        this.applySavedFilter(filterName);
                    });
                    savedFiltersDiv.insertBefore(newFilter, addFilterBtn);
                }
                this.showNotification(this.getTranslation('filterSaved', { name: filterName }), 'success');
            }
        }

        applySavedFilter(filterName) {
            let filters = {};
            switch(filterName) {
                case 'كل المهام':
                case 'All Tasks':
                    filters = { status: 'all', priority: 'all', assignee: 'all', dueDate: 'all', project: 'all' };
                    break;
                case 'مخصص لي':
                case 'Assigned to me':
                    filters = { status: 'all', priority: 'all', assignee: 'me', dueDate: 'all', project: 'all' };
                    break;
                case 'عالية الأولوية':
                case 'High Priority':
                    filters = { status: 'all', priority: 'high', assignee: 'all', dueDate: 'all', project: 'all' };
                    break;
                case 'المتأخرة':
                case 'Overdue':
                    filters = { status: 'all', priority: 'all', assignee: 'all', dueDate: 'overdue', project: 'all' };
                    break;
                case 'تتطلب مراجعة':
                case 'Needs Review':
                    filters = { status: 'review', priority: 'all', assignee: 'all', dueDate: 'all', project: 'all' };
                    break;
                default:
                    filters = { status: 'all', priority: 'all', assignee: 'all', dueDate: 'all', project: 'all' };
            }
            this.elements.filterStatus.value = filters.status;
            this.elements.filterPriority.value = filters.priority;
            this.elements.filterAssignee.value = filters.assignee;
            this.elements.filterDue.value = filters.dueDate;
            this.elements.filterProject.value = filters.project;
            this.applyFilters();
        }

        changeView(view) {
            this.currentView = view;
            this.elements.viewOptions.forEach(opt => {
                if (opt.dataset.view === view) opt.classList.add('active');
                else opt.classList.remove('active');
            });

            if (this.elements.tasksBoard) {
                this.elements.tasksBoard.style.display = 'none';
                this.elements.tasksBoard.classList.remove('list-view');
            }
            if (this.elements.calendarView) this.elements.calendarView.style.display = 'none';

            if (view === 'board') {
                this.elements.tasksBoard.style.display = 'flex';
                this.elements.tasksBoard.classList.remove('list-view');
            } else if (view === 'list') {
                this.elements.tasksBoard.style.display = 'flex';
                this.elements.tasksBoard.classList.add('list-view');
            } else if (view === 'calendar') {
                if (this.userPermissions.includes('appointments')) {
                    this.elements.calendarView.style.display = 'block';
                    this.renderCalendar();
                } else {
                    this.showNotification('ليس لديك صلاحية لعرض التقويم', 'warning');
                    this.changeView('board');
                }
            }
        }

        initSectionFilters() {
            const sections = ['sent', 'received', 'subtasks', 'archived', 'requests-sent', 'requests-received', 'purchases-sent', 'purchases-received', 'penalties', 'manual-penalties'];
            sections.forEach(section => {
                const container = document.getElementById(`${section}-tasks`);
                if (!container) return;
                const sectionEl = container.closest('.board-section');
                if (!sectionEl) return;
                const statusBtns = sectionEl.querySelectorAll('.filter-status-btn');
                if (!statusBtns.length) return;
                
                let items = [];
                if (section === 'requests-sent') items = this.requestsSent;
                else if (section === 'requests-received') items = this.requestsReceived;
                else if (section === 'purchases-sent') items = this.purchasesSent;
                else if (section === 'purchases-received') items = this.purchasesReceived;
                else if (section === 'penalties') items = this.penalties;
                else if (section === 'manual-penalties') items = this.manualPenalties;
                else items = this.tasks.filter(t => t.type === section && t.status !== 'archived');
                
                statusBtns.forEach(btn => {
                    const status = btn.dataset.status;
                    let count = 0;
                    if (status === 'all') count = items.length;
                    else if (section === 'requests-sent' || section === 'requests-received' || section === 'purchases-sent' || section === 'purchases-received' || section === 'penalties' || section === 'manual-penalties') {
                        count = items.length;
                    } else {
                        count = items.filter(t => t.status === status).length;
                    }
                    const countSpan = btn.querySelector('.count');
                    if (countSpan) countSpan.textContent = count;
                    
                    btn.removeEventListener('click', this.sectionFilterHandler);
                    btn.addEventListener('click', (e) => {
                        const cards = sectionEl.querySelectorAll('.task-card, .request-card, .purchase-card, .penalty-card, .manual-penalty-card');
                        const filterStatus = btn.dataset.status;
                        cards.forEach(card => {
                            if (filterStatus === 'all') {
                                card.style.display = '';
                            } else if (section === 'requests-sent' || section === 'requests-received' || section === 'purchases-sent' || section === 'purchases-received' || section === 'penalties' || section === 'manual-penalties') {
                                card.style.display = '';
                            } else {
                                const cardStatus = card.dataset.status;
                                if (cardStatus === filterStatus) card.style.display = '';
                                else card.style.display = 'none';
                            }
                        });
                        statusBtns.forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                    });
                });
            });
        }

        setupSectionSpecificButtons() {
            document.querySelectorAll('.board-section .section-add-btn').forEach(btn => {
                const section = btn.closest('.board-section').dataset.section;
                btn.removeEventListener('click', this.handleSectionAdd);
                btn.addEventListener('click', (e) => {
                    if (section === 'sent' || section === 'received') {
                        this.openNewTaskModal();
                    } else if (section === 'requests-sent') {
                        this.openNewRequestModal();
                    } else if (section === 'purchases-sent') {
                        this.openNewPurchaseModal();
                    } else if (section === 'manual-penalties') {
                        this.openNewManualPenaltyModal();
                    }
                });
            });

            document.querySelectorAll('.quick-add-task').forEach(quick => {
                const container = quick.parentElement;
                const section = container.closest('.board-section')?.dataset.section;
                quick.removeEventListener('click', this.handleQuickAdd);
                quick.addEventListener('click', (e) => {
                    if (section === 'sent' || section === 'received') {
                        this.openNewTaskModal();
                    } else if (section === 'requests-sent') {
                        this.openNewRequestModal();
                    } else if (section === 'purchases-sent') {
                        this.openNewPurchaseModal();
                    } else if (section === 'manual-penalties') {
                        this.openNewManualPenaltyModal();
                    }
                });
            });
        }

        setupModalCloseButtons() {
            const closeIds = ['modal-close-btn', 'modal-close-btn-2', 'new-task-modal-close', 'new-task-cancel',
                'new-request-modal-close', 'new-request-cancel',
                'new-purchase-modal-close', 'new-purchase-cancel',
                'new-appointment-modal-close', 'new-appointment-cancel',
                'progress-modal-close', 'progress-cancel', 'comments-modal-close', 'attachments-modal-close',
                'calendar-modal-close', 'appointment-day-close', 'appointment-day-close-btn', 'appointment-detail-close', 'appointment-detail-close-btn',
                'remove-penalty-modal-close', 'remove-penalty-cancel',
                'request-detail-close', 'request-detail-close-btn',
                'purchase-detail-close', 'purchase-detail-close-btn',
                'rate-modal-close', 'rate-cancel',
                'new-manual-penalty-close', 'new-manual-penalty-cancel',
                'manual-penalty-detail-close', 'manual-penalty-detail-close-btn'];
            closeIds.forEach(id => {
                const btn = document.getElementById(id);
                if (btn) {
                    btn.addEventListener('click', () => {
                        const modal = btn.closest('.modal');
                        if (modal) this.closeModal(modal);
                    });
                }
            });
        }

        openModal(modal) {
            if (modal) modal.classList.add('active');
        }

        closeModal(modal) {
            if (modal) modal.classList.remove('active');
            modal.dispatchEvent(new Event('modal:closed'));
        }

        exportReport() {
            const period = this.elements.analyticsPeriod?.value || 'month';
            let data = this.getTranslation('reportCSVHeader') + '\n';
            data += `${this.getTranslation('totalTasks')},${this.tasks.length}\n`;
            data += `${this.getTranslation('completed')},${this.tasks.filter(t => t.progress === 100).length}\n`;
            data += `${this.getTranslation('overdue')},${this.tasks.filter(t => t.isOverdue && t.status !== 'done').length}\n`;
            data += `${this.getTranslation('requests')},${this.requestsReceived.length + this.requestsSent.length}\n`;
            data += `${this.getTranslation('purchases')},${this.purchasesReceived.length + this.purchasesSent.length}\n`;
            data += `${this.getTranslation('penalties')},${this.penalties.length + this.manualPenalties.length}\n`;
            data += `${this.getTranslation('totalAppointments')},${this.appointments.length}\n`;
            
            const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `task-report-${period}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showNotification(this.getTranslation('reportExported'), 'success');
        }

        startPeriodicRefresh() {
            setInterval(() => {
                this.checkEscalations();
                this.updateCharts();
            }, 30000);
        }

        checkEscalations() {
            this.refreshAllData();
        }

        updateSystemTime() {
            const timeEl = document.getElementById('system-time');
            if (timeEl) {
                const now = new Date();
                const timeString = now.toLocaleTimeString(this.currentLang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                const dateString = now.toLocaleDateString(this.currentLang === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'numeric', year: 'numeric' });
                timeEl.textContent = `${dateString} - ${timeString}`;
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
            const menuToggle = this.elements.menuToggle;
            const sidebar = this.elements.sidebar;
            if (!menuToggle || !sidebar) return;

            menuToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleSidebar();
            });

            if (this.elements.sidebarClose) {
                this.elements.sidebarClose.addEventListener('click', () => {
                    this.closeSidebar();
                });
            }

            document.addEventListener('click', (e) => {
                const backdrop = document.querySelector('.sidebar-backdrop');
                if (backdrop && backdrop.contains(e.target) && sidebar.classList.contains('active')) {
                    this.closeSidebar();
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && sidebar.classList.contains('active')) {
                    this.closeSidebar();
                }
            });
        }

        setupMobileSearch() {
            const searchIcon = document.querySelector('.search-btn-header');
            const headerSearch = document.querySelector('.admin-search');
            if (searchIcon && headerSearch && window.innerWidth <= 992) {
                searchIcon.addEventListener('click', (e) => {
                    e.preventDefault();
                    headerSearch.classList.toggle('active');
                    if (headerSearch.classList.contains('active')) {
                        const input = headerSearch.querySelector('.search-input-header');
                        if (input) setTimeout(() => input.focus(), 100);
                    }
                });
                document.addEventListener('click', (e) => {
                    if (headerSearch.classList.contains('active') && !headerSearch.contains(e.target) && !searchIcon.contains(e.target)) {
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

                filterBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    filterDropdown.classList.toggle('active');
                    if (filterDropdown.classList.contains('active')) {
                        filterDropdown.style.transform = 'translateY(0)';
                        document.body.style.overflow = 'hidden';
                    } else {
                        filterDropdown.style.transform = 'translateY(100%)';
                        document.body.style.overflow = '';
                    }
                });

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
                    if (btn) setTimeout(() => btn.style.transform = '', 150);
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
                    if (currentIsMobile !== document.body.classList.contains('mobile-view')) {
                        if (currentIsMobile) document.body.classList.add('mobile-view');
                        else document.body.classList.remove('mobile-view');
                    }
                }, 250);
            });
        }

        showNotification(message, type = 'info') {
            const area = document.getElementById('notification-area');
            if (!area) {
                alert(message);
                return;
            }
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = `
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
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
            const map = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
            return map[type] || 'fa-info-circle';
        }

        debounce(func, wait) {
            let timeout;
            return function(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        }

        escapeHtml(str) {
            if (!str) return '';
            return str.replace(/[&<>]/g, function(m) {
                if (m === '&') return '&amp;';
                if (m === '<') return '&lt;';
                if (m === '>') return '&gt;';
                return m;
            }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function(c) {
                return c;
            });
        }

        async loadInitialData() {
            this.showLoading();
            await this.refreshAllData();
        }

        showLoading() {
            // يمكن إضافة تأثير تحميل
        }
    }

    window.tasksManager = new TasksManager();
})();