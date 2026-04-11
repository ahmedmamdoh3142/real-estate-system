/**
 * خدمة التدقيق للنظام العقاري
 * تاريخ: 2024
 * وصف: تسجيل جميع عمليات النظام في جدول AuditLogs
 */

const sql = require('mssql');
const config = require('../../config/database.config');

/**
 * خدمة التدقيق
 */
class AuditService {
    /**
     * تسجيل عملية في سجلات التدقيق
     * @param {Object} options - خيارات التسجيل
     */
    async logAudit(options = {}) {
        let pool;
        try {
            const {
                userId = null,
                action = 'UNKNOWN',
                tableName = 'Unknown',
                recordId = null,
                oldValue = null,
                newValue = null,
                ipAddress = null,
                userAgent = null
            } = options;

            pool = await sql.connect(config);

            const query = `
                INSERT INTO AuditLogs 
                (userId, action, tableName, recordId, oldValue, newValue, ipAddress, userAgent, createdAt)
                VALUES 
                (@userId, @action, @tableName, @recordId, @oldValue, @newValue, @ipAddress, @userAgent, GETDATE())
            `;

            const request = pool.request();
            request.input('userId', sql.Int, userId);
            request.input('action', sql.NVarChar(50), action);
            request.input('tableName', sql.NVarChar(100), tableName);
            request.input('recordId', sql.Int, recordId);
            request.input('oldValue', sql.NVarChar(sql.MAX), oldValue ? JSON.stringify(oldValue) : null);
            request.input('newValue', sql.NVarChar(sql.MAX), newValue ? JSON.stringify(newValue) : null);
            request.input('ipAddress', sql.NVarChar(50), ipAddress);
            request.input('userAgent', sql.NVarChar(500), userAgent);

            await request.query(query);
            
            console.log(`📝 تم تسجيل عملية التدقيق: ${action} - ${tableName}`);
            return { success: true };
            
        } catch (error) {
            console.error('❌ خطأ في تسجيل التدقيق:', error.message);
            // لا نعيد الخطأ حتى لا تؤثر على العملية الرئيسية
            return { success: false, error: error.message };
        } finally {
            if (pool) {
                try {
                    await pool.close();
                } catch (closeError) {
                    console.error('❌ خطأ في إغلاق الاتصال:', closeError.message);
                }
            }
        }
    }

    /**
     * جلب سجلات التدقيق
     * @param {Object} filters - عوامل التصفية
     */
    async getAuditLogs(filters = {}) {
        let pool;
        try {
            const {
                page = 1,
                limit = 50,
                userId = null,
                action = null,
                tableName = null,
                startDate = null,
                endDate = null
            } = filters;

            pool = await sql.connect(config);

            const offset = (page - 1) * limit;

            let query = `
                SELECT 
                    al.id,
                    al.userId,
                    u.username,
                    u.fullName,
                    al.action,
                    al.tableName,
                    al.recordId,
                    al.oldValue,
                    al.newValue,
                    al.ipAddress,
                    al.userAgent,
                    FORMAT(al.createdAt, 'yyyy-MM-dd HH:mm:ss') as createdAt
                FROM AuditLogs al
                LEFT JOIN Users u ON al.userId = u.id
                WHERE 1=1
            `;

            const request = pool.request();

            // تطبيق التصفيات
            if (userId) {
                query += ` AND al.userId = @userId`;
                request.input('userId', sql.Int, userId);
            }

            if (action) {
                query += ` AND al.action = @action`;
                request.input('action', sql.NVarChar(50), action);
            }

            if (tableName) {
                query += ` AND al.tableName = @tableName`;
                request.input('tableName', sql.NVarChar(100), tableName);
            }

            if (startDate) {
                query += ` AND al.createdAt >= @startDate`;
                request.input('startDate', sql.DateTime, new Date(startDate));
            }

            if (endDate) {
                query += ` AND al.createdAt <= @endDate`;
                request.input('endDate', sql.DateTime, new Date(endDate));
            }

            query += ` ORDER BY al.createdAt DESC`;
            query += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;

            request.input('offset', sql.Int, offset);
            request.input('limit', sql.Int, limit);

            // استعلام للحصول على العدد الإجمالي
            let countQuery = `
                SELECT COUNT(*) as total FROM AuditLogs al WHERE 1=1
            `;

            if (userId) countQuery += ` AND al.userId = ${userId}`;
            if (action) countQuery += ` AND al.action = '${action}'`;
            if (tableName) countQuery += ` AND al.tableName = '${tableName}'`;
            if (startDate) countQuery += ` AND al.createdAt >= '${startDate}'`;
            if (endDate) countQuery += ` AND al.createdAt <= '${endDate}'`;

            const [logsResult, countResult] = await Promise.all([
                request.query(query),
                pool.request().query(countQuery)
            ]);

            return {
                success: true,
                data: {
                    logs: logsResult.recordset,
                    total: countResult.recordset[0]?.total || 0,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil((countResult.recordset[0]?.total || 0) / limit)
                }
            };

        } catch (error) {
            console.error('❌ خطأ في جلب سجلات التدقيق:', error.message);
            throw new Error('فشل في جلب سجلات التدقيق');
        } finally {
            if (pool) {
                try {
                    await pool.close();
                } catch (closeError) {
                    console.error('❌ خطأ في إغلاق الاتصال:', closeError.message);
                }
            }
        }
    }

    /**
     * تسجيل عملية تسجيل دخول
     * @param {number} userId - معرف المستخدم
     * @param {boolean} success - نجاح العملية
     * @param {Object} req - طلب Express
     */
    async logLogin(userId, success, req) {
        return await this.logAudit({
            userId,
            action: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
            tableName: 'Users',
            recordId: userId,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });
    }

    /**
     * تسجيل عملية إنشاء
     * @param {number} userId - معرف المستخدم
     * @param {string} tableName - اسم الجدول
     * @param {number} recordId - معرف السجل
     * @param {Object} data - البيانات الجديدة
     * @param {Object} req - طلب Express
     */
    async logCreate(userId, tableName, recordId, data, req) {
        return await this.logAudit({
            userId,
            action: 'CREATE',
            tableName,
            recordId,
            newValue: data,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });
    }

    /**
     * تسجيل عملية تحديث
     * @param {number} userId - معرف المستخدم
     * @param {string} tableName - اسم الجدول
     * @param {number} recordId - معرف السجل
     * @param {Object} oldData - البيانات القديمة
     * @param {Object} newData - البيانات الجديدة
     * @param {Object} req - طلب Express
     */
    async logUpdate(userId, tableName, recordId, oldData, newData, req) {
        return await this.logAudit({
            userId,
            action: 'UPDATE',
            tableName,
            recordId,
            oldValue: oldData,
            newValue: newData,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });
    }

    /**
     * تسجيل عملية حذف
     * @param {number} userId - معرف المستخدم
     * @param {string} tableName - اسم الجدول
     * @param {number} recordId - معرف السجل
     * @param {Object} data - البيانات المحذوفة
     * @param {Object} req - طلب Express
     */
    async logDelete(userId, tableName, recordId, data, req) {
        return await this.logAudit({
            userId,
            action: 'DELETE',
            tableName,
            recordId,
            oldValue: data,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });
    }
}

module.exports = new AuditService();