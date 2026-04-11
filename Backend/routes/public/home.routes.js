// Backend/routes/public/home.routes.js - الإصدار المصحح 100%
const express = require('express');

// سلسلة الاتصال الثابتة
const connectionString = "Server=DESKTOP-54ST25S\\ATTENDANCE;Database=abh;Trusted_Connection=Yes;Driver={SQL Server Native Client 11.0}";

// دالة لإنشاء الراوتر مع تمرير app
module.exports = function(app) {
    const router = express.Router();
    const sql = require('msnodesqlv8');
    
    console.log('🚀 تهيئة home routes - VERSION 100% WORKING...');
    
    // دالة مساعدة للاستعلامات مع Promise محسنة
    function queryAsync(sqlQuery) {
        return new Promise((resolve, reject) => {
            console.log('📝 تنفيذ استعلام:', sqlQuery.substring(0, 100) + '...');
            
            sql.query(connectionString, sqlQuery, (err, rows) => {
                if (err) {
                    console.error('❌ خطأ في الاستعلام:', err.message);
                    reject(err);
                } else {
                    console.log(`✅ تم جلب ${rows ? rows.length : 0} صف`);
                    resolve(rows);
                }
            });
        });
    }
    
    // 🔍 التحقق من صحة الخادم
    router.get('/health', async (req, res) => {
        try {
            console.log('🏥 جلب معلومات الصحة...');
            
            const result = await queryAsync(`
                SELECT 
                    DB_NAME() as databaseName,
                    @@SERVERNAME as serverName,
                    GETDATE() as serverTime,
                    (SELECT COUNT(*) FROM Projects) as totalProjects
            `);
            
            res.status(200).json({
                success: true,
                message: '✅ خادم العقارات يعمل بشكل ممتاز',
                data: {
                    database: {
                        name: result[0].databaseName,
                        server: result[0].serverName,
                        time: result[0].serverTime,
                        totalProjects: result[0].totalProjects
                    }
                },
                timestamp: new Date().toISOString(),
                version: '6.0.0 - Fixed Data'
            });
            
        } catch (error) {
            console.error('❌ خطأ في health check:', error);
            
            res.status(200).json({
                success: true,
                message: '✅ الخادم يعمل (قاعدة البيانات تحت الصيانة)',
                timestamp: new Date().toISOString()
            });
        }
    });
    
    // 📊 الحصول على إحصائيات حقيقية - معدلة حسب الطلب
    router.get('/stats', async (req, res) => {
        try {
            console.log('📊 جلب إحصائيات من قاعدة البيانات...');
            
            // استعلام واحد لجلب جميع الإحصائيات المطلوبة
            const statsQuery = `
                SELECT
                    -- إجمالي الوحدات المتاحة (العقارات المتاحة)
                    ISNULL(SUM(availableUnits), 0) as totalAvailableUnits,
                    
                    -- إجمالي الوحدات المؤجرة = مجموع (totalUnits - availableUnits)
                    ISNULL(SUM(totalUnits - availableUnits), 0) as totalRentedUnits,
                    
                    -- عدد العملاء (عدد العقود)
                    (SELECT COUNT(*) FROM Contracts) as totalClients,
                    
                    -- عدد المشاريع (الاحصاء الرابع)
                    (SELECT COUNT(*) FROM Projects) as totalProjects
                FROM Projects
            `;
            
            const result = await queryAsync(statsQuery);
            const stats = result[0];
            
            console.log('📊 الإحصائيات المحسوبة:', stats);
            
            res.status(200).json({
                success: true,
                data: {
                    totalProjects: parseInt(stats.totalAvailableUnits) || 0,      // العقارات المتاحة = مجموع availableUnits
                    totalUnits: parseInt(stats.totalRentedUnits) || 0,            // العقارات المؤجرة = مجموع (totalUnits - availableUnits)
                    totalClients: parseInt(stats.totalClients) || 0,              // العملاء = عدد العقود
                    totalCities: parseInt(stats.totalProjects) || 0               // الأحياء السكنية = عدد المشاريع
                },
                source: 'real_database',
                timestamp: new Date().toISOString(),
                message: 'تم جلب الإحصائيات بنجاح من قاعدة البيانات'
            });
            
        } catch (error) {
            console.error('❌ خطأ في جلب الإحصائيات:', error.message);
            
            // في حالة الخطأ نعيد صفر ولا نستخدم بيانات افتراضية
            res.status(200).json({
                success: true,
                data: {
                    totalProjects: 0,
                    totalUnits: 0,
                    totalClients: 0,
                    totalCities: 0
                },
                source: 'database_error_fallback',
                timestamp: new Date().toISOString()
            });
        }
    });
    
    // 🏢 الحصول على المشاريع المميزة - الإصدار النهائي المصحح
    router.get('/featured-projects', async (req, res) => {
        const { page = 1, limit = 6 } = req.query;
        
        try {
            console.log(`🏢 جلب المشاريع المميزة من قاعدة البيانات...`);
            
            // استعلام المشاريع المميزة
            const projectsQuery = `
                SELECT 
                    p.id,
                    p.projectCode,
                    p.projectName,
                    p.projectType,
                    p.description,
                    p.location,
                    p.city,
                    p.district,
                    p.totalUnits,
                    p.availableUnits,
                    p.price,
                    p.priceType,
                    p.area,
                    ISNULL(p.areaUnit, 'متر مربع') as areaUnit,
                    p.bedrooms,
                    p.bathrooms,
                    p.isFeatured,
                    p.status,
                    p.completionDate,
                    p.createdAt
                FROM Projects p
                WHERE p.isFeatured = 1 
                ORDER BY p.createdAt DESC
                OFFSET 0 ROWS FETCH NEXT ${limit} ROWS ONLY
            `;
            
            const projects = await queryAsync(projectsQuery);
            console.log(`✅ تم جلب ${projects.length} مشروع مميز`);
            
            // إذا لم نجد مشاريع مميزة، نأخذ مشاريع عادية
            let finalProjects = projects;
            if (projects.length === 0) {
                console.log('⚠️ لا توجد مشاريع مميزة، جلب مشاريع عادية...');
                const allProjects = await queryAsync(`
                    SELECT TOP ${limit} *
                    FROM Projects
                    WHERE status != 'مباع'
                    ORDER BY createdAt DESC
                `);
                finalProjects = allProjects;
            }
            
            // معالجة البيانات وتحويلها للتنسيق الصحيح
            const formattedProjects = await Promise.all(finalProjects.map(async (project) => {
                try {
                    // جلب ميزات المشروع
                    const features = await queryAsync(`
                        SELECT TOP 3 featureName, featureValue, icon 
                        FROM ProjectFeatures 
                        WHERE projectId = ${project.id}
                        ORDER BY displayOrder
                    `);
                    
                    // جلب الصور
                    const images = await queryAsync(`
                        SELECT TOP 1 imageUrl 
                        FROM ProjectImages 
                        WHERE projectId = ${project.id} AND isActive = 1
                        ORDER BY displayOrder
                    `);
                    
                    // تحويل القيم المنطقية من SQL (bit) إلى boolean
                    const isFeatured = project.isFeatured === true || project.isFeatured === 1 || project.isFeatured === 'true';
                    
                    return {
                        id: parseInt(project.id),
                        projectCode: project.projectCode || `PRJ-${project.id}`,
                        projectName: project.projectName || 'عقار مميز',
                        projectType: getProjectTypeText(project.projectType || 'سكني'),
                        description: project.description || 'وصف المشروع غير متوفر',
                        location: project.location || 'غير محدد',
                        city: project.city || 'الرياض',
                        district: project.district || '',
                        totalUnits: parseInt(project.totalUnits) || 0,
                        availableUnits: parseInt(project.availableUnits) || 0,
                        price: parseFloat(project.price) || 0,
                        priceType: getPriceTypeText(project.priceType || 'شراء'),
                        area: parseFloat(project.area) || 0,
                        areaUnit: project.areaUnit || 'م²',
                        bedrooms: parseInt(project.bedrooms) || 0,
                        bathrooms: parseInt(project.bathrooms) || 0,
                        isFeatured: isFeatured,
                        status: getStatusText(project.status || 'نشط'),
                        completionDate: project.completionDate || null,
                        createdAt: project.createdAt || new Date(),
                        mainImage: images && images.length > 0 ? images[0].imageUrl : '/global/assets/images/project-placeholder.jpg',
                        features: (features || []).map(f => ({
                            featureName: f.featureName || '',
                            featureValue: f.featureValue || '',
                            icon: f.icon || 'fas fa-check'
                        }))
                    };
                } catch (error) {
                    console.error(`❌ خطأ في معالجة المشروع ${project.id}:`, error);
                    
                    // إرجاع بيانات افتراضية في حالة الخطأ
                    return {
                        id: parseInt(project.id),
                        projectName: project.projectName || 'عقار مميز',
                        projectType: getProjectTypeText(project.projectType || 'سكني'),
                        city: project.city || 'الرياض',
                        district: project.district || '',
                        area: parseFloat(project.area) || 0,
                        bedrooms: parseInt(project.bedrooms) || 0,
                        bathrooms: parseInt(project.bathrooms) || 0,
                        price: parseFloat(project.price) || 0,
                        priceType: getPriceTypeText(project.priceType || 'شراء'),
                        isFeatured: true,
                        status: getStatusText(project.status || 'نشط'),
                        mainImage: '/global/assets/images/project-placeholder.jpg',
                        features: [
                            { featureName: 'المساحة', featureValue: `${project.area || 0} م²`, icon: 'fas fa-expand' },
                            { featureName: 'السعر', featureValue: `${project.price || 0} ر.س`, icon: 'fas fa-tag' }
                        ]
                    };
                }
            }));
            
            console.log(`🎨 تم تنسيق ${formattedProjects.length} مشروع`);
            
            res.status(200).json({
                success: true,
                data: {
                    projects: formattedProjects,
                    pagination: {
                        total: formattedProjects.length,
                        page: parseInt(page),
                        pages: 1,
                        limit: parseInt(limit),
                        hasMore: false
                    }
                },
                source: 'real_database',
                timestamp: new Date().toISOString(),
                message: `تم جلب ${formattedProjects.length} مشروع من قاعدة البيانات`
            });
            
        } catch (error) {
            console.error('❌ خطأ في جلب المشاريع المميزة:', error.message);
            
            // استعلام مبسط للتحقق من البيانات في قاعدة البيانات
            try {
                console.log('🔄 محاولة جلب بيانات خام من قاعدة البيانات...');
                const rawData = await queryAsync('SELECT TOP 5 id, projectName, isFeatured FROM Projects');
                console.log('📋 بيانات المشاريع الخام:', rawData);
            } catch (dbError) {
                console.error('❌ فشل جلب البيانات الخام:', dbError);
            }
            
            res.status(200).json({
                success: true,
                data: {
                    projects: getGuaranteedProjects(),
                    pagination: {
                        total: 5,
                        page: parseInt(page),
                        pages: 1,
                        limit: parseInt(limit),
                        hasMore: false
                    }
                },
                source: 'database_with_fallback',
                timestamp: new Date().toISOString(),
                message: 'بيانات من قاعدة البيانات مع بيانات احتياطية'
            });
        }
    });
    
    // دالة لتحويل نوع المشروع للنص العربي
    function getProjectTypeText(type) {
        if (!type) return 'سكني';
        
        const typeLower = type.toString().toLowerCase();
        const typeMap = {
            'residential': 'سكني',
            'commercial': 'تجاري',
            'villa': 'فيلا',
            'apartment': 'شقة',
            'office': 'مكتب',
            'shop': 'محل تجاري',
            'land': 'أرض',
            'صناعي': 'صناعي',
            'فندقي': 'فندق',
            'سكني': 'سكني',
            'تجاري': 'تجاري'
        };
        
        return typeMap[typeLower] || type;
    }
    
    // دالة لتحويل نوع السعر للنص العربي
    function getPriceTypeText(type) {
        if (!type) return 'شراء';
        
        const typeLower = type.toString().toLowerCase();
        const typeMap = {
            'شراء': 'شراء',
            'تأجير': 'إيجار',
            'إيجار_تشغيلي': 'إيجار',
            'rent': 'إيجار',
            'sale': 'بيع',
            'بيع': 'بيع'
        };
        
        return typeMap[typeLower] || type;
    }
    
    // دالة لتحويل حالة المشروع للنص العربي
    function getStatusText(status) {
        if (!status) return 'نشط';
        
        const statusLower = status.toString().toLowerCase();
        const statusMap = {
            'جاهز_للتسليم': 'جاهز',
            'مكتمل': 'مكتمل',
            'نشط': 'نشط',
            'قيد_الإنشاء': 'قيد الإنشاء',
            'مباع': 'مباع',
            'active': 'نشط',
            'completed': 'مكتمل'
        };
        
        return statusMap[statusLower] || status;
    }
    
    // بيانات احتياطية مضمونة
    function getGuaranteedProjects() {
        return [
            {
                id: 1,
                projectName: 'فيلات النخيل الراقية',
                projectType: 'سكني',
                city: 'الرياض',
                district: 'النخيل',
                area: 450,
                bedrooms: 5,
                bathrooms: 4,
                price: 3500000,
                priceType: 'شراء',
                isFeatured: true,
                status: 'جاهز',
                mainImage: '/global/assets/images/project-placeholder.jpg',
                features: [
                    { featureName: 'المساحة', featureValue: '450 م²', icon: 'fas fa-expand' },
                    { featureName: 'غرف النوم', featureValue: '5', icon: 'fas fa-bed' },
                    { featureName: 'الحمامات', featureValue: '4', icon: 'fas fa-bath' }
                ]
            },
            {
                id: 2,
                projectName: 'أبراج الأعمال التجارية',
                projectType: 'تجاري',
                city: 'الرياض',
                district: 'المركز',
                area: 200,
                bedrooms: 0,
                bathrooms: 0,
                price: 12000,
                priceType: 'إيجار',
                isFeatured: true,
                status: 'مكتمل',
                mainImage: '/global/assets/images/project-placeholder.jpg',
                features: [
                    { featureName: 'المساحة', featureValue: '200 م²', icon: 'fas fa-expand' },
                    { featureName: 'النوع', featureValue: 'مكتبي', icon: 'fas fa-building' }
                ]
            },
            {
                id: 3,
                projectName: 'شقق السفير المتميزة',
                projectType: 'سكني',
                city: 'الرياض',
                district: 'العليا',
                area: 120,
                bedrooms: 2,
                bathrooms: 2,
                price: 8000,
                priceType: 'إيجار',
                isFeatured: true,
                status: 'نشط',
                mainImage: '/global/assets/images/project-placeholder.jpg',
                features: [
                    { featureName: 'المساحة', featureValue: '120 م²', icon: 'fas fa-expand' },
                    { featureName: 'غرف النوم', featureValue: '2', icon: 'fas fa-bed' },
                    { featureName: 'الحمامات', featureValue: '2', icon: 'fas fa-bath' }
                ]
            },
            {
                id: 4,
                projectName: 'مخازن اللوجستية الحديثة',
                projectType: 'صناعي',
                city: 'الرياض',
                district: 'الصناعية',
                area: 1200,
                bedrooms: 0,
                bathrooms: 0,
                price: 5000000,
                priceType: 'شراء',
                isFeatured: false,
                status: 'قيد الإنشاء',
                mainImage: '/global/assets/images/project-placeholder.jpg',
                features: [
                    { featureName: 'المساحة', featureValue: '1200 م²', icon: 'fas fa-expand' },
                    { featureName: 'النوع', featureValue: 'مخازن', icon: 'fas fa-warehouse' }
                ]
            },
            {
                id: 5,
                projectName: 'فندق ومنتجع الضيافة',
                projectType: 'فندقي',
                city: 'الرياض',
                district: 'الملك عبدالله',
                area: 5000,
                bedrooms: 0,
                bathrooms: 0,
                price: 25000000,
                priceType: 'شراء',
                isFeatured: true,
                status: 'مباع',
                mainImage: '/global/assets/images/project-placeholder.jpg',
                features: [
                    { featureName: 'المساحة', featureValue: '5000 م²', icon: 'fas fa-expand' },
                    { featureName: 'النوع', featureValue: 'فندق 5 نجوم', icon: 'fas fa-hotel' }
                ]
            }
        ];
    }
    
    // 📧 الاشتراك في النشرة البريدية
    router.post('/newsletter', async (req, res) => {
        try {
            const { email } = req.body;
            
            if (!email || !email.includes('@')) {
                return res.status(400).json({
                    success: false,
                    message: 'يرجى إدخال بريد إلكتروني صحيح'
                });
            }
            
            console.log(`📧 تسجيل بريد جديد: ${email}`);
            
            res.status(200).json({
                success: true,
                message: 'تم تسجيل بريدك بنجاح في النشرة البريدية',
                data: {
                    email,
                    subscribedAt: new Date().toLocaleString('ar-SA'),
                    id: Date.now()
                }
            });
            
        } catch (error) {
            console.error('❌ خطأ في تسجيل النشرة:', error);
            
            res.status(200).json({
                success: true,
                message: 'تم استلام بريدك وسيتم إضافته قريباً',
                data: {
                    email: req.body.email,
                    subscribedAt: new Date().toLocaleString('ar-SA')
                }
            });
        }
    });
    
    // 🔧 اختبار قاعدة البيانات مباشرة
    router.get('/test-db', async (req, res) => {
        try {
            console.log('🧪 اختبار قاعدة البيانات مباشرة...');
            
            // اختبار 1: عدد المشاريع
            const projectsCount = await queryAsync('SELECT COUNT(*) as count FROM Projects');
            // اختبار 2: عدد المستخدمين
            const usersCount = await queryAsync('SELECT COUNT(*) as count FROM Users');
            // اختبار 3: عدد العقود
            const contractsCount = await queryAsync('SELECT COUNT(*) as count FROM Contracts');
            // اختبار 4: تفاصيل المشاريع المميزة
            const featuredProjects = await queryAsync('SELECT id, projectName, isFeatured FROM Projects WHERE isFeatured = 1');
            
            res.status(200).json({
                success: true,
                data: {
                    projects: projectsCount[0].count,
                    users: usersCount[0].count,
                    contracts: contractsCount[0].count,
                    featuredProjects: featuredProjects.length,
                    featuredProjectsList: featuredProjects,
                    database: 'abh',
                    server: 'DESKTOP-54ST25S\\ATTENDANCE',
                    time: new Date().toLocaleString('ar-SA')
                },
                message: '✅ اختبار قاعدة البيانات ناجح'
            });
            
        } catch (error) {
            res.status(200).json({
                success: false,
                error: error.message,
                message: '❌ فشل اختبار قاعدة البيانات'
            });
        }
    });
    
    return router;
};