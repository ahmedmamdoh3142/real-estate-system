// Backend/services/public/inquiry.service.js - الإصدار المصحح (معدل لاستخدام mssql pool)
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
 * @desc    جلب إحصائيات الاستفسارات
 * @returns {Object} إحصائيات الاستفسارات
 */
exports.getInquiryStats = async () => {
    const pool = getPool();
    try {
        console.log('🔗 الاتصال بقاعدة البيانات لجلب إحصائيات الاستفسارات...');
        
        // استعلام 1: إجمالي الاستفسارات
        const totalQuery = `
            SELECT COUNT(*) as totalInquiries 
            FROM Inquiries 
            WHERE status != 'ملغى'
        `;
        
        // استعلام 2: الاستفسارات الجديدة (لم يتم الرد عليها)
        const newQuery = `
            SELECT COUNT(*) as newInquiries 
            FROM Inquiries 
            WHERE status = 'جديد'
        `;
        
        // استعلام 3: الاستفسارات التي تم الرد عليها
        const respondedQuery = `
            SELECT COUNT(*) as respondedInquiries 
            FROM Inquiries 
            WHERE status = 'تم_الرد'
        `;
        
        // استعلام 4: الاستفسارات اليوم
        const todayQuery = `
            SELECT COUNT(*) as todayInquiries 
            FROM Inquiries 
            WHERE CAST(createdAt AS DATE) = CAST(GETDATE() AS DATE)
        `;
        
        // استعلام 5: متوسط وقت الرد (بالساعات)
        const avgResponseQuery = `
            SELECT AVG(DATEDIFF(HOUR, createdAt, respondedAt)) as avgResponseHours 
            FROM Inquiries 
            WHERE respondedAt IS NOT NULL
        `;
        
        // تنفيذ جميع الاستعلامات بشكل متوازي
        const [
            totalResult,
            newResult,
            respondedResult,
            todayResult,
            avgResponseResult
        ] = await Promise.all([
            pool.request().query(totalQuery),
            pool.request().query(newQuery),
            pool.request().query(respondedQuery),
            pool.request().query(todayQuery),
            pool.request().query(avgResponseQuery)
        ]);
        
        const stats = {
            totalInquiries: totalResult.recordset[0]?.totalInquiries || 0,
            newInquiries: newResult.recordset[0]?.newInquiries || 0,
            respondedInquiries: respondedResult.recordset[0]?.respondedInquiries || 0,
            todayInquiries: todayResult.recordset[0]?.todayInquiries || 0,
            avgResponseHours: Math.round(avgResponseResult.recordset[0]?.avgResponseHours) || 24
        };
        
        console.log('📈 إحصائيات الاستفسارات المحسوبة:', stats);
        
        return stats;
        
    } catch (error) {
        console.error('❌ خطأ في getInquiryStats:', error);
        throw new Error('فشل في جلب إحصائيات الاستفسارات');
    }
};

/**
 * @desc    جلب المشاريع للقائمة المنسدلة
 * @returns {Array} قائمة المشاريع
 */
exports.getProjectsForDropdown = async () => {
    const pool = getPool();
    try {
        console.log('🔗 الاتصال بقاعدة البيانات لجلب المشاريع للقائمة المنسدلة...');
        
        // استعلام جلب المشاريع النشطة
        const projectsQuery = `
            SELECT 
                id,
                projectCode,
                projectName,
                projectType,
                city,
                district,
                status,
                availableUnits
            FROM Projects 
            WHERE status IN ('نشط', 'جاهز_للتسليم', 'مكتمل')
                AND availableUnits > 0
            ORDER BY projectName
        `;
        
        const result = await pool.request().query(projectsQuery);
        const projects = result.recordset;
        
        console.log(`✅ تم جلب ${projects.length} مشروع للقائمة المنسدلة`);
        
        return projects;
        
    } catch (error) {
        console.error('❌ خطأ في getProjectsForDropdown:', error);
        throw new Error('فشل في جلب المشاريع للقائمة المنسدلة');
    }
};

/**
 * @desc    إرسال استفسار جديد - الإصدار المصحح
 * @param   {Object} inquiryData - بيانات الاستفسار
 * @returns {Object} نتيجة إرسال الاستفسار
 */
exports.submitInquiry = async (inquiryData) => {
    const pool = getPool();
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        console.log('🔗 بدء معاملة إرسال الاستفسار...');
        
        // إنشاء كود الاستفسار
        const inquiryCode = 'INQ-' + new Date().getFullYear() + '-' + 
            String(Math.floor(Math.random() * 10000)).padStart(4, '0');
        
        // تحويل تفضيلات التواصل من مصفوفة إلى نص مفصول بفواصل
        const contactPrefsText = Array.isArray(inquiryData.contactPreferences) 
            ? inquiryData.contactPreferences.join(',')
            : inquiryData.contactPreferences || '';
        
        // استعلام إدخال الاستفسار - الإصدار المصحح مع الحقول الجديدة
        const insertQuery = `
            INSERT INTO Inquiries (
                inquiryCode,
                projectId,
                customerName,
                customerEmail,
                customerPhone,
                message,
                inquiryType,
                contactPreferences,
                preferredTime,
                status,
                createdAt,
                updatedAt
            ) VALUES (
                @inquiryCode,
                @projectId,
                @customerName,
                @customerEmail,
                @customerPhone,
                @message,
                @inquiryType,
                @contactPreferences,
                @preferredTime,
                'جديد',
                GETDATE(),
                GETDATE()
            );
            
            SELECT SCOPE_IDENTITY() as newId;
        `;
        
        const request = new sql.Request(transaction);
        request.input('inquiryCode', sql.NVarChar(50), inquiryCode);
        request.input('projectId', sql.Int, inquiryData.projectId || null);
        request.input('customerName', sql.NVarChar(100), inquiryData.customerName);
        request.input('customerEmail', sql.NVarChar(100), inquiryData.customerEmail);
        request.input('customerPhone', sql.NVarChar(20), inquiryData.customerPhone);
        request.input('message', sql.NVarChar(sql.MAX), inquiryData.message);
        request.input('inquiryType', sql.NVarChar(50), inquiryData.inquiryType || 'استفسار_عام');
        request.input('contactPreferences', sql.NVarChar(500), contactPrefsText);
        request.input('preferredTime', sql.NVarChar(100), inquiryData.preferredTime || null);
        
        const result = await request.query(insertQuery);
        const newId = result.recordset[0]?.newId;
        
        if (!newId) {
            throw new Error('فشل في إدراج الاستفسار');
        }
        
        // إذا كان هناك projectId، تحديث تاريخ المشروع
        if (inquiryData.projectId) {
            const updateProjectQuery = `
                UPDATE Projects 
                SET updatedAt = GETDATE()
                WHERE id = @projectId
            `;
            
            const updateRequest = new sql.Request(transaction);
            updateRequest.input('projectId', sql.Int, inquiryData.projectId);
            await updateRequest.query(updateProjectQuery);
        }
        
        // تأكيد المعاملة
        await transaction.commit();
        console.log(`✅ تم إرسال استفسار جديد: ${inquiryCode}`);
        
        return {
            inquiryId: newId,
            inquiryCode: inquiryCode,
            customerName: inquiryData.customerName,
            customerEmail: inquiryData.customerEmail,
            customerPhone: inquiryData.customerPhone,
            contactPreferences: contactPrefsText,
            preferredTime: inquiryData.preferredTime || null,
            submittedAt: new Date().toISOString(),
            estimatedResponseTime: '24 ساعة عمل',
            referenceNumber: inquiryCode
        };
        
    } catch (error) {
        try {
            await transaction.rollback();
            console.error('❌ تم التراجع عن المعاملة:', error.message);
        } catch (rollbackError) {
            console.error('❌ خطأ في التراجع عن المعاملة:', rollbackError);
        }
        
        console.error('❌ خطأ في submitInquiry:', error);
        throw new Error(`فشل في إرسال الاستفسار: ${error.message}`);
    }
};

/**
 * @desc    جلب قائمة الاستفسارات (للإدارة)
 * @param   {Object} options - خيارات التصفية
 * @returns {Object} الاستفسارات مع معلومات الترقيم
 */
exports.getInquiriesList = async ({ page = 1, limit = 10, status = null }) => {
    const pool = getPool();
    try {
        console.log('🔗 الاتصال بقاعدة البيانات لجلب قائمة الاستفسارات...');
        
        const offset = (page - 1) * limit;
        
        // بناء استعلام WHERE ديناميكي
        let whereClause = 'WHERE 1=1';
        if (status) {
            whereClause += ` AND status = '${status.replace(/'/g, "''")}'`;
        }
        
        // استعلام جلب الاستفسارات - الإصدار المصحح مع الحقول الجديدة
        const inquiriesQuery = `
            SELECT 
                i.id,
                i.inquiryCode,
                i.customerName,
                i.customerEmail,
                i.customerPhone,
                i.message,
                i.inquiryType,
                i.contactPreferences,
                i.preferredTime,
                i.status,
                i.createdAt,
                i.respondedAt,
                i.response,
                p.projectName,
                p.projectCode
            FROM Inquiries i
            LEFT JOIN Projects p ON i.projectId = p.id
            ${whereClause}
            ORDER BY i.createdAt DESC
            OFFSET @offset ROWS
            FETCH NEXT @limit ROWS ONLY
        `;
        
        // استعلام حساب العدد الكلي
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM Inquiries i
            ${whereClause}
        `;
        
        const request = pool.request();
        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, limit);
        
        const [inquiriesResult, countResult] = await Promise.all([
            request.query(inquiriesQuery),
            pool.request().query(countQuery)
        ]);
        
        const inquiries = inquiriesResult.recordset;
        const total = countResult.recordset[0]?.total || 0;
        
        console.log(`✅ تم جلب ${inquiries.length} استفسار`);
        
        return {
            inquiries,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                limit: parseInt(limit)
            }
        };
        
    } catch (error) {
        console.error('❌ خطأ في getInquiriesList:', error);
        throw new Error('فشل في جلب قائمة الاستفسارات');
    }
};

/**
 * @desc    تحديث حالة الاستفسار
 * @param   {number} inquiryId - معرف الاستفسار
 * @param   {string} status - الحالة الجديدة
 * @param   {string} response - الرد (اختياري)
 * @param   {number} assignedTo - المعرف المعين (اختياري)
 * @returns {Object} نتيجة التحديث
 */
exports.updateInquiryStatus = async (inquiryId, status, response = null, assignedTo = null) => {
    const pool = getPool();
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        console.log(`🔗 تحديث حالة الاستفسار ${inquiryId}...`);
        
        let updateQuery = `
            UPDATE Inquiries 
            SET status = @status,
                updatedAt = GETDATE()
        `;
        
        if (response) {
            updateQuery += `, response = @response, respondedAt = GETDATE()`;
        }
        
        if (assignedTo) {
            updateQuery += `, assignedTo = @assignedTo`;
        }
        
        updateQuery += ` WHERE id = @inquiryId`;
        
        const request = new sql.Request(transaction);
        request.input('inquiryId', sql.Int, inquiryId);
        request.input('status', sql.NVarChar(30), status);
        
        if (response) {
            request.input('response', sql.NVarChar(sql.MAX), response);
        }
        
        if (assignedTo) {
            request.input('assignedTo', sql.Int, assignedTo);
        }
        
        const result = await request.query(updateQuery);
        
        if (result.rowsAffected[0] === 0) {
            throw new Error('لم يتم العثور على الاستفسار');
        }
        
        // إذا كان الاستفسار مرتبطاً بمشروع، تسجيل في جدول AuditLogs
        if (assignedTo) {
            const auditQuery = `
                INSERT INTO AuditLogs (userId, action, tableName, recordId, newValue)
                VALUES (@assignedTo, 'UPDATE', 'Inquiries', @inquiryId, 
                        'تم تعيين الاستفسار إلى المستخدم ' + CAST(@assignedTo as nvarchar(10)))
            `;
            
            const auditRequest = new sql.Request(transaction);
            auditRequest.input('assignedTo', sql.Int, assignedTo);
            auditRequest.input('inquiryId', sql.Int, inquiryId);
            await auditRequest.query(auditQuery);
        }
        
        await transaction.commit();
        console.log(`✅ تم تحديث حالة الاستفسار ${inquiryId} إلى ${status}`);
        
        return {
            success: true,
            inquiryId: inquiryId,
            status: status,
            updatedAt: new Date().toISOString()
        };
        
    } catch (error) {
        try {
            await transaction.rollback();
        } catch (rollbackError) {
            console.error('❌ خطأ في التراجع عن المعاملة:', rollbackError);
        }
        
        console.error('❌ خطأ في updateInquiryStatus:', error);
        throw new Error(`فشل في تحديث حالة الاستفسار: ${error.message}`);
    }
};