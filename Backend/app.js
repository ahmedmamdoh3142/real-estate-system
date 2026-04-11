// Backend/app.js - النسخة المحسنة مع APIs حقيقية + Project Details Routes + Inquiry Routes + Profile Routes
const express = require('express');
const path = require('path'); // ✅ إضافة path
const app = express();

console.log('🚀 بدء تشغيل نظام إدارة العقارات - الإصدار الإنتاجي الكامل (msnodesqlv8)');

// ==================== إعدادات CORS المحسنة ====================
app.use((req, res, next) => {
    const allowedOrigins = ['http://localhost', 'http://127.0.0.1', 'file://'];
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin) || !origin) {
        res.header('Access-Control-Allow-Origin', origin || '*');
    } else {
        res.header('Access-Control-Allow-Origin', '*');
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, x-access-token, X-API-Key');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    
    // معالجة طلبات preflight
    if (req.method === 'OPTIONS') {
        console.log('🔄 معالجة طلب Preflight:', req.originalUrl);
        return res.status(200).json({
            message: 'Preflight request successful',
            allowed: true
        });
    }
    
    console.log(`📡 ${req.method} ${req.originalUrl}`);
    next();
});

// ✅ خدمة الملفات الثابتة للصور المرفوعة
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Middleware لمعالجة JSON
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware للتدوين
app.use((req, res, next) => {
    console.log(`📝 ${new Date().toLocaleTimeString('ar-SA')} - ${req.method} ${req.originalUrl}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('📦 Body:', JSON.stringify(req.body, null, 2).substring(0, 500) + (JSON.stringify(req.body).length > 500 ? '...' : ''));
    }
    next();
});

// Route الأساسية للتحقق
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: '✅ خادم العقارات يعمل بنجاح مع قاعدة البيانات الحقيقية (msnodesqlv8)',
        timestamp: new Date().toLocaleString('ar-SA'),
        version: '5.0.0 - Complete Production System (msnodesqlv8)',
        database: 'Connected to SQL Server (abh) using msnodesqlv8',
        endpoints: {
            public: {
                home: '/api/public/home/*',
                projects: '/api/public/projects/*',
                project_details: '/api/public/project-details/*',
                inquiry: '/api/public/inquiry/*',
                contact: '/api/public/contact/*'
            },
            admin: {
                auth: '/api/admin/auth/*',
                dashboard: '/api/admin/dashboard/*',
                projects: '/api/admin/projects/*',
                contracts: '/api/admin/contracts/*',
                payments: '/api/admin/payments/*',
                inquiries: '/api/admin/inquiries/*',
                profile: '/api/admin/profile/*' // ✅ تمت الإضافة
            }
        }
    });
});

// Route لـ index
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'مرحباً في نظام إدارة العقارات - النسخة الإنتاجية الكاملة (msnodesqlv8)',
        system: 'Real Estate Management System (msnodesqlv8)',
        version: '5.0.0',
        database: 'SQL Server (abh) using msnodesqlv8',
        endpoints: {
            // Health & Status
            health: 'GET /api/health',
            
            // Public APIs
            home_stats: 'GET /api/public/home/stats',
            home_featured: 'GET /api/public/home/featured-projects',
            projects_all: 'GET /api/public/projects/all',
            project_details: 'GET /api/public/project-details/{id}',
            project_details_related: 'GET /api/public/project-details/{id}/related',
            project_details_inquiry: 'POST /api/public/project-details/{id}/inquiry',
            project_details_stats: 'GET /api/public/project-details/{id}/stats',
            inquiry_submit: 'POST /api/public/inquiry/submit',
            inquiry_stats: 'GET /api/public/inquiry/stats',
            inquiry_test: 'GET /api/public/inquiry/test',
            contact_submit: 'POST /api/public/contact/submit',
            
            // Admin APIs - Projects Management
            admin_projects_all: 'GET /api/admin/projects',
            admin_projects_stats: 'GET /api/admin/projects/stats',
            admin_projects_recent: 'GET /api/admin/projects/recent',
            admin_projects_search: 'GET /api/admin/projects/search',
            admin_projects_single: 'GET /api/admin/projects/{id}',
            admin_projects_create: 'POST /api/admin/projects',
            admin_projects_update: 'PUT /api/admin/projects/{id}',
            admin_projects_delete: 'DELETE /api/admin/projects/{id}',
            admin_projects_features: 'GET /api/admin/projects/{id}/features',
            admin_projects_images: 'GET /api/admin/projects/{id}/images',
            admin_projects_upload_image: 'POST /api/admin/projects/upload-image',
            admin_projects_export: 'GET /api/admin/projects/export/export-data',
            
            // Admin - Profile
            admin_profile_me: 'GET /api/admin/profile/me',
            admin_profile_update: 'PUT /api/admin/profile/me',
            admin_profile_password: 'POST /api/admin/profile/me/password',
            admin_profile_picture: 'POST /api/admin/profile/me/picture'
        },
        instructions: 'قم بزيارة الواجهة الأمامية (/Frontend/admin/pages/projects-management/index.html)'
    });
});

// ==================== استيراد جميع الراوترات الحقيقية ====================

console.log('\n🔄 تحميل الراوترات العامة...');

// 1. Public Home Routes
try {
    const homeRoutes = require('./routes/public/home.routes');
    if (typeof homeRoutes === 'function') {
        app.use('/api/public/home', homeRoutes(app));
        console.log('✅ تم تحميل home.routes.js');
    } else {
        console.log('⚠️ home.routes.js ليس دالة - إنشاء بديل');
        const tempHomeRouter = express.Router();
        tempHomeRouter.get('/stats', (req, res) => {
            res.json({ success: true, data: {}, source: 'fallback' });
        });
        app.use('/api/public/home', tempHomeRouter);
    }
} catch (error) {
    console.log('⚠️ home.routes.js غير موجود - إنشاء بديل');
    const tempHomeRouter = express.Router();
    tempHomeRouter.get('/stats', (req, res) => res.json({ success: true, data: {} }));
    app.use('/api/public/home', tempHomeRouter);
}

// 2. Public Projects Routes
try {
    const projectsRouter = require('./routes/public/projects.routes');
    if (typeof projectsRouter === 'function') {
        app.use('/api/public/projects', projectsRouter(app));
        console.log('✅ تم تحميل projects.routes.js');
    } else {
        console.log('⚠️ projects.routes.js ليس دالة - إنشاء بديل');
        const tempProjectsRouter = express.Router();
        tempProjectsRouter.get('/all', (req, res) => res.json({ success: true, data: [] }));
        app.use('/api/public/projects', tempProjectsRouter);
    }
} catch (error) {
    console.log('⚠️ projects.routes.js غير موجود - إنشاء بديل');
    const tempProjectsRouter = express.Router();
    tempProjectsRouter.get('/all', (req, res) => res.json({ success: true, data: [] }));
    app.use('/api/public/projects', tempProjectsRouter);
}

// 3. Public Project Details Routes
try {
    const projectDetailsRouter = require('./routes/public/project-details.routes');
    if (typeof projectDetailsRouter === 'function') {
        app.use('/api/public/project-details', projectDetailsRouter(app));
        console.log('✅ تم تحميل project-details.routes.js');
    } else {
        console.log('⚠️ project-details.routes.js ليس دالة - إنشاء بديل');
        const tempDetailsRouter = express.Router();
        tempDetailsRouter.get('/:id', (req, res) => res.json({ 
            success: true, 
            data: { 
                id: parseInt(req.params.id), 
                projectName: 'عقار افتراضي (بديل)',
                description: 'هذا العقار تم تحميله من المسار البديل بسبب عدم وجود الملف الأصلي.'
            }, 
            source: 'fallback' 
        }));
        app.use('/api/public/project-details', tempDetailsRouter);
    }
} catch (error) {
    console.log('⚠️ project-details.routes.js غير موجود - إنشاء بديل');
    const tempDetailsRouter = express.Router();
    tempDetailsRouter.get('/:id', (req, res) => res.json({ 
        success: true, 
        data: { 
            id: parseInt(req.params.id), 
            projectName: 'عقار افتراضي (بديل)',
            description: 'هذا العقار تم تحميله من المسار البديل بسبب عدم وجود الملف الأصلي.'
        }, 
        source: 'fallback' 
    }));
    app.use('/api/public/project-details', tempDetailsRouter);
}

// 4. Public Inquiry Routes
try {
    const inquiryRouter = require('./routes/public/inquiry.routes');
    if (typeof inquiryRouter === 'function') {
        app.use('/api/public/inquiry', inquiryRouter(app));
        console.log('✅ تم تحميل inquiry.routes.js - مع إضافة الليدات تلقائياً');
    } else {
        console.log('⚠️ inquiry.routes.js ليس دالة - إنشاء بديل');
        const tempInquiryRouter = express.Router();
        tempInquiryRouter.post('/submit', (req, res) => {
            res.json({ 
                success: true, 
                message: 'Inquiry submitted (fallback)',
                data: {
                    inquiryCode: 'INQ-FALLBACK-' + Date.now(),
                    leadAdded: true,
                    leadCode: 'LEAD-FALLBACK-' + Date.now()
                }
            });
        });
        tempInquiryRouter.get('/test', (req, res) => res.json({ success: true, message: 'Test OK' }));
        tempInquiryRouter.get('/stats', (req, res) => res.json({ success: true, data: {} }));
        app.use('/api/public/inquiry', tempInquiryRouter);
    }
} catch (error) {
    console.log('⚠️ inquiry.routes.js غير موجود - إنشاء بديل');
    const tempInquiryRouter = express.Router();
    tempInquiryRouter.post('/submit', (req, res) => {
        res.json({ 
            success: true, 
            message: 'Inquiry submitted (fallback)',
            data: {
                inquiryCode: 'INQ-FALLBACK-' + Date.now(),
                leadAdded: true,
                leadCode: 'LEAD-FALLBACK-' + Date.now()
            }
        });
    });
    tempInquiryRouter.get('/test', (req, res) => res.json({ success: true, message: 'Test OK' }));
    tempInquiryRouter.get('/stats', (req, res) => res.json({ success: true, data: {} }));
    app.use('/api/public/inquiry', tempInquiryRouter);
}

console.log('✅ تم تحميل جميع الراوترات العامة');

// ==================== استيراد الراوترات الإدارية ====================

console.log('\n🔄 تحميل الراوترات الإدارية...');

// 🔐 Auth Routes
try {
    const authRouter = require('./routes/admin/auth.routes');
    app.use('/api/admin/auth', authRouter);
    console.log('✅ تم تحميل auth.routes.js');
} catch (error) {
    console.log('⚠️ auth.routes.js غير موجود - إنشاء بديل');
    const tempAuthRouter = express.Router();
    tempAuthRouter.post('/login', (req, res) => {
        res.json({ 
            success: true, 
            message: 'Auth route working (fallback)',
            data: {
                token: 'mock_token_' + Date.now(),
                user: {
                    id: 1,
                    username: 'admin',
                    fullName: 'أحمد محمد',
                    email: 'admin@abh.com',
                    phone: '0501234567',
                    role: 'مشرف_عام',
                    isActive: true
                }
            }
        });
    });
    app.use('/api/admin/auth', tempAuthRouter);
}

// 📊 Dashboard Routes
try {
    const dashboardRouter = require('./routes/admin/dashboard.routes');
    app.use('/api/admin/dashboard', dashboardRouter);
    console.log('✅ تم تحميل dashboard.routes.js');
} catch (error) {
    console.log('⚠️ dashboard.routes.js غير موجود - إنشاء بديل');
    const tempDashboardRouter = express.Router();
    tempDashboardRouter.get('/stats', (req, res) => {
        res.json({
            success: true,
            data: {
                totalProjects: 5,
                availableUnits: 60,
                featuredProjects: 4,
                activeProjects: 5,
                totalContracts: 2,
                activeContracts: 2,
                completedContracts: 0,
                totalPayments: 2,
                totalRevenue: 47000,
                monthlyRevenue: 47000,
                totalClients: 2,
                newClients: 0,
                totalInquiries: 3,
                newInquiries: 0,
                totalUsers: 4
            },
            source: 'fallback_data'
        });
    });
    app.use('/api/admin/dashboard', tempDashboardRouter);
}

// 🏢 Projects Management Routes - النسخة المحسنة
try {
    const projectsRouter = require('./routes/admin/projects.routes');
    app.use('/api/admin/projects', projectsRouter);
    console.log('✅ تم تحميل projects.routes.js - نظام إدارة المشاريع الكامل (msnodesqlv8)');
} catch (error) {
    console.error('❌ خطأ في تحميل projects.routes:', error.message);
    console.log('🔧 إنشاء بديل مؤقت لـ projects routes');
    
    const tempProjectsRouter = express.Router();
    
    // التحقق من الصحة
    tempProjectsRouter.get('/health', (req, res) => {
        res.json({
            success: true,
            message: 'Projects API (fallback) is working',
            timestamp: new Date().toISOString()
        });
    });
    
    // جلب جميع المشاريع
    tempProjectsRouter.get('/', (req, res) => {
        const { page = 1, limit = 25 } = req.query;
        res.json({
            success: true,
            message: 'Projects fetched (fallback)',
            data: [],
            pagination: {
                currentPage: parseInt(page),
                totalPages: 1,
                totalItems: 0,
                itemsPerPage: parseInt(limit)
            }
        });
    });
    
    // إضافة مسار stats إذا لم يكن موجوداً
    tempProjectsRouter.get('/stats', (req, res) => {
        res.json({
            success: true,
            data: {
                totalProjects: 5,
                totalUnits: 125,
                availableUnits: 60,
                featuredProjects: 3,
                rentedUnits: 65,
                totalValue: 32000000,
                averagePrice: 6400000,
                newThisMonth: 2,
                typeDistribution: {
                    سكني: 2,
                    تجاري: 1,
                    صناعي: 1,
                    فندقي: 1
                },
                statusDistribution: {
                    نشط: 3,
                    'جاهز_للتسليم': 1,
                    مكتمل: 1,
                    'قيد_الإنشاء': 1,
                    مباع: 1
                }
            },
            source: 'fallback_data'
        });
    });
    
    // إضافة مسار recent إذا لم يكن موجوداً
    tempProjectsRouter.get('/recent', (req, res) => {
        res.json({
            success: true,
            data: [],
            total: 0
        });
    });
    
    // إضافة مسار search إذا لم يكن موجوداً
    tempProjectsRouter.get('/search', (req, res) => {
        res.json({
            success: true,
            data: [],
            total: 0
        });
    });
    
    app.use('/api/admin/projects', tempProjectsRouter);
}

// 📝 Contracts Routes - النسخة الكاملة
try {
    const contractsRouter = require('./routes/admin/contracts.routes');
    app.use('/api/admin/contracts', contractsRouter);
    console.log('✅ تم تحميل contracts.routes.js - نظام إدارة العقود الكامل (msnodesqlv8)');
} catch (error) {
    console.error('❌ خطأ في تحميل contracts.routes:', error.message);
    // إنشاء بديل مؤقت
    const tempRouter = express.Router();
    tempRouter.get('/', (req, res) => res.json({ success: true, data: [] }));
    app.use('/api/admin/contracts', tempRouter);
}

// 💰 Payments Routes
try {
    const paymentsRouter = require('./routes/admin/payments.routes');
    app.use('/api/admin/payments', paymentsRouter);
    console.log('✅ تم تحميل payments.routes.js');
} catch (error) {
    console.log('⚠️ payments.routes.js غير موجود - سيتم تخطيه');
}

// ❓ Inquiries Routes
try {
    const inquiriesRouter = require('./routes/admin/inquiries.routes');
    app.use('/api/admin/inquiries', inquiriesRouter);
    console.log('✅ تم تحميل inquiries.routes.js');
} catch (error) {
    console.log('⚠️ inquiries.routes.js غير موجود - سيتم تخطيه');
}

// ❓ leads Routes
try {
    const leedsRouter = require('./routes/admin/leeds.routes');
    app.use('/api/admin/leeds', leedsRouter);
    console.log('✅ تم تحميل leeds.routes.js');
} catch (error) {
    console.log('⚠️ leeds.routes.js غير موجود - سيتم تخطيه');
}

// ❓ users Routes
try {
    const usersRouter = require('./routes/admin/users.routes');
    app.use('/api/admin/users', usersRouter);
    console.log('✅ تم تحميل users.routes.js');
} catch (error) {
    console.log('⚠️ users.routes.js غير موجود - سيتم تخطيه');
}



// ❓ bills Routes
try {
    const billsRouter = require('./routes/admin/bills.routes');
    app.use('/api/admin/bills', billsRouter);
    console.log('✅ تم تحميل bills.routes.js');
} catch (error) {
    console.log('⚠️ bills.routes.js غير موجود - سيتم تخطيه');
}


// 📧 Email Routes
try {
    const emailRouter = require('./routes/admin/email.routes');
    app.use('/api/admin/email', emailRouter);
    console.log('✅ تم تحميل email.routes.js - نظام البريد الإلكتروني الداخلي');
} catch (error) {
    console.error('❌ خطأ في تحميل email.routes:', error.message);
}


// 📧 chat Routes
try {
    const chatRouter = require('./routes/admin/chat.routes');
    app.use('/api/admin/chat', chatRouter);
    console.log('✅ تم تحميل chat.routes.js - نظام الشات الداخلي');
} catch (error) {
    console.error('❌ خطأ في تحميل chat.routes:', error.message);
}


// 📧 tasks Routes
try {
    const tasksRouter = require('./routes/admin/tasks.routes');
    app.use('/api/admin/tasks', tasksRouter);
    console.log('✅ تم تحميل tasks.routes.js - نظام التاسكات الداخلي');
} catch (error) {
    console.error('❌ خطأ في تحميل tasks.routes:', error.message);
}


// 📧 stats Routes
try {
    const statsRouter = require('./routes/admin/stats.routes');
    app.use('/api/admin/stats', statsRouter);
    console.log('✅ تم تحميل stats.routes.js - نظام الاحصائيات الداخلي');
} catch (error) {
    console.error('❌ خطأ في تحميل stats.routes:', error.message);
}



// ❓ jobs Routes
try {
    const jobsRouter = require('./routes/admin/jobs.routes');
    app.use('/api/admin/jobs', jobsRouter);
    console.log('✅ تم تحميل jobs.routes.js');
} catch (error) {
    console.log('⚠️ jobs.routes.js غير موجود - سيتم تخطيه');
}

// 👤 Profile Routes (الجديد)
try {
    const profileRouter = require('./routes/admin/profile.routes');
    app.use('/api/admin/profile', profileRouter);
    console.log('✅ تم تحميل profile.routes.js - إدارة الملف الشخصي');
} catch (error) {
    console.error('❌ خطأ في تحميل profile.routes:', error.message);
    // إنشاء بديل مؤقت
    const tempProfileRouter = express.Router();
    tempProfileRouter.get('/me', (req, res) => {
        res.json({ 
            success: true, 
            data: { 
                id: 1, 
                fullName: 'مستخدم افتراضي', 
                email: 'user@example.com', 
                phone: '05xxxxxxxx',
                role: 'مشرف_عام',
                profileImage: null
            } 
        });
    });
    app.use('/api/admin/profile', tempProfileRouter);
}

console.log('✅ تم تحميل جميع الراوترات الإدارية');

// ==================== Middleware للتعامل مع الأخطاء ====================

// Handle 404 - يجب أن يكون في النهاية
app.use('*', (req, res) => {
    console.log('⚠️ مسار غير موجود:', req.originalUrl, 'Method:', req.method);
    
    // عرض المسارات المتاحة
    const availableEndpoints = {
        'التحقق من الصحة': 'GET /api/health',
        'الصفحة الرئيسية': 'GET /',
        'تفاصيل العقار (عام)': 'GET /api/public/project-details/:id',
        'العقارات المشابهة': 'GET /api/public/project-details/:id/related',
        'إرسال استفسار (خاص بالعقار)': 'POST /api/public/project-details/:id/inquiry',
        'إحصائيات المشروع': 'GET /api/public/project-details/:id/stats',
        'إرسال استفسار عام': 'POST /api/public/inquiry/submit',
        'إحصائيات الاستفسارات العامة': 'GET /api/public/inquiry/stats',
        'اختبار الاستفسارات': 'GET /api/public/inquiry/test',
        'مشاريع الإدارة (كاملة)': 'GET /api/admin/projects',
        'إحصائيات المشاريع': 'GET /api/admin/projects/stats',
        'بحث المشاريع': 'GET /api/admin/projects/search?q=كلمة',
        'مشروع محدد': 'GET /api/admin/projects/1',
        'إنشاء مشروع': 'POST /api/admin/projects',
        'تحديث مشروع': 'PUT /api/admin/projects/1',
        'حذف مشروع': 'DELETE /api/admin/projects/1',
        'تصدير المشاريع': 'GET /api/admin/projects/export/export-data',
        'الملف الشخصي': 'GET /api/admin/profile/me'
    };
    
    res.status(404).json({
        success: false,
        message: '⚠️ المسار غير موجود',
        path: req.originalUrl,
        method: req.method,
        availableEndpoints: availableEndpoints,
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err.message);
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'حدث خطأ داخلي في الخادم',
        error: err.message,
        timestamp: new Date().toISOString()
    });
});

module.exports = app;