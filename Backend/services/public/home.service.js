const sql = require('mssql');

// الحصول على pool من app.locals (تم تعيينه في server.js)
function getPool() {
    const app = require('../../app');
    if (!app.locals.dbPool) {
        throw new Error('قاعدة البيانات غير متصلة');
    }
    return app.locals.dbPool;
}

/**
 * @desc    جلب إحصائيات الصفحة الرئيسية
 * @returns {Object} إحصائيات الصفحة الرئيسية
 */
exports.getHomeStats = async () => {
    const pool = getPool();
    try {
        console.log('🔗 الاتصال بقاعدة البيانات لجلب الإحصائيات...');
        
        // استعلام 1: عدد المشاريع النشطة
        const projectsQuery = `
            SELECT COUNT(*) as totalProjects 
            FROM Projects 
            WHERE status = 'active' 
            AND availableUnits > 0
        `;
        
        // استعلام 2: إجمالي الوحدات المباعة
        const unitsQuery = `
            SELECT ISNULL(SUM(totalUnits - availableUnits), 0) as totalUnits 
            FROM Projects 
            WHERE status = 'active'
        `;
        
        // استعلام 3: عدد العملاء (من العقود المكتملة)
        const clientsQuery = `
            SELECT COUNT(DISTINCT customerId) as totalClients 
            FROM Contracts 
            WHERE contractStatus = 'مكتمل'
        `;
        
        // استعلام 4: عدد المدن المختلفة
        const citiesQuery = `
            SELECT COUNT(DISTINCT city) as totalCities 
            FROM Projects 
            WHERE status = 'active'
        `;
        
        // استعلام 5: عدد المشاريع المميزة
        const featuredQuery = `
            SELECT COUNT(*) as featuredCount 
            FROM Projects 
            WHERE isFeatured = 1 
            AND status = 'active' 
            AND availableUnits > 0
        `;
        
        // تنفيذ جميع الاستعلامات بشكل متوازي
        const [
            projectsResult,
            unitsResult,
            clientsResult,
            citiesResult,
            featuredResult
        ] = await Promise.all([
            pool.request().query(projectsQuery),
            pool.request().query(unitsQuery),
            pool.request().query(clientsQuery),
            pool.request().query(citiesQuery),
            pool.request().query(featuredQuery)
        ]);
        
        const stats = {
            totalProjects: projectsResult.recordset[0]?.totalProjects || 0,
            totalUnits: unitsResult.recordset[0]?.totalUnits || 0,
            totalClients: clientsResult.recordset[0]?.totalClients || 0,
            totalCities: citiesResult.recordset[0]?.totalCities || 0,
            featuredCount: featuredResult.recordset[0]?.featuredCount || 0
        };
        
        console.log('📈 الإحصائيات المحسوبة:', stats);
        
        return stats;
        
    } catch (error) {
        console.error('❌ خطأ في getHomeStats:', error);
        throw new Error('فشل في جلب إحصائيات الصفحة الرئيسية');
    }
};

/**
 * @desc    جلب المشاريع المميزة
 * @param   {Object} options - خيارات التصفية
 * @param   {number} options.page - رقم الصفحة
 * @param   {number} options.limit - عدد العناصر في الصفحة
 * @returns {Object} المشاريع مع معلومات الترقيم
 */
exports.getFeaturedProjects = async ({ page = 1, limit = 6 }) => {
    const pool = getPool();
    try {
        console.log('🔗 الاتصال بقاعدة البيانات لجلب المشاريع المميزة...');
        
        const offset = (page - 1) * limit;
        
        // استعلام جلب المشاريع المميزة
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
                p.areaUnit,
                p.bedrooms,
                p.bathrooms,
                p.isFeatured,
                p.status,
                p.completionDate,
                pi.imageUrl as mainImage
            FROM Projects p
            LEFT JOIN (
                SELECT projectId, imageUrl,
                ROW_NUMBER() OVER (PARTITION BY projectId ORDER BY displayOrder) as rn
                FROM ProjectImages 
                WHERE isActive = 1
            ) pi ON p.id = pi.projectId AND pi.rn = 1
            WHERE p.isFeatured = 1 
                AND p.status = 'active'
                AND p.availableUnits > 0
            ORDER BY p.createdAt DESC
            OFFSET @offset ROWS
            FETCH NEXT @limit ROWS ONLY
        `;
        
        // استعلام حساب العدد الكلي
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM Projects 
            WHERE isFeatured = 1 
                AND status = 'active' 
                AND availableUnits > 0
        `;
        
        const request = pool.request();
        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, limit);
        
        const [projectsResult, countResult] = await Promise.all([
            request.query(projectsQuery),
            pool.request().query(countQuery)
        ]);
        
        const projects = projectsResult.recordset;
        const total = countResult.recordset[0]?.total || 0;
        
        // جلب المميزات لكل مشروع
        for (let project of projects) {
            const featuresQuery = `
                SELECT featureName, featureValue, icon 
                FROM ProjectFeatures 
                WHERE projectId = @projectId 
                ORDER BY displayOrder
            `;
            
            const featuresRequest = pool.request();
            featuresRequest.input('projectId', sql.Int, project.id);
            
            const featuresResult = await featuresRequest.query(featuresQuery);
            project.features = featuresResult.recordset;
        }
        
        console.log(`✅ تم جلب ${projects.length} مشروع مميز`);
        
        return {
            projects,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                limit: parseInt(limit)
            }
        };
        
    } catch (error) {
        console.error('❌ خطأ في getFeaturedProjects:', error);
        throw new Error('فشل في جلب المشاريع المميزة');
    }
};

/**
 * @desc    الاشتراك في النشرة البريدية
 * @param   {string} email - البريد الإلكتروني
 * @returns {Object} نتيجة الاشتراك
 */
exports.subscribeNewsletter = async (email) => {
    const pool = getPool();
    try {
        console.log('🔗 الاتصال بقاعدة البيانات لتسجيل النشرة البريدية...');
        
        // التحقق من وجود البريد مسبقاً
        const checkQuery = `
            SELECT settingValue 
            FROM SystemSettings 
            WHERE settingKey = 'newsletter_subscribers'
        `;
        
        const checkResult = await pool.request().query(checkQuery);
        
        let subscribers = [];
        
        if (checkResult.recordset.length > 0 && checkResult.recordset[0].settingValue) {
            try {
                subscribers = JSON.parse(checkResult.recordset[0].settingValue);
                
                // التحقق من وجود البريد مسبقاً
                const exists = subscribers.some(sub => sub.email === email);
                if (exists) {
                    throw new Error('هذا البريد الإلكتروني مشترك بالفعل في النشرة البريدية');
                }
            } catch (parseError) {
                console.error('❌ خطأ في تحليل بيانات المشتركين:', parseError);
                subscribers = [];
            }
        }
        
        // إضافة المشترك الجديد
        const newSubscriber = {
            email,
            subscribedAt: new Date().toISOString(),
            isActive: true
        };
        
        subscribers.push(newSubscriber);
        
        // حفظ أو تحديث الإعدادات
        if (checkResult.recordset.length > 0) {
            // تحديث السجل الموجود
            const updateQuery = `
                UPDATE SystemSettings 
                SET settingValue = @subscribers,
                    updatedAt = GETDATE()
                WHERE settingKey = 'newsletter_subscribers'
            `;
            
            const updateRequest = pool.request();
            updateRequest.input('subscribers', sql.NVarChar, JSON.stringify(subscribers));
            
            await updateRequest.query(updateQuery);
        } else {
            // إنشاء سجل جديد
            const insertQuery = `
                INSERT INTO SystemSettings 
                (settingKey, settingValue, settingType, category, description, isEditable)
                VALUES 
                ('newsletter_subscribers', @subscribers, 'json', 'newsletter', 
                 'قائمة المشتركين في النشرة البريدية', 1)
            `;
            
            const insertRequest = pool.request();
            insertRequest.input('subscribers', sql.NVarChar, JSON.stringify(subscribers));
            
            await insertRequest.query(insertQuery);
        }
        
        console.log(`✅ تم تسجيل البريد ${email} في النشرة البريدية`);
        
        return {
            email,
            subscribedAt: newSubscriber.subscribedAt,
            totalSubscribers: subscribers.length
        };
        
    } catch (error) {
        console.error('❌ خطأ في subscribeNewsletter:', error);
        throw error;
    }
};