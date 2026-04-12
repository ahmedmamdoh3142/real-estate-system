// 📁 Backend/services/admin/inquiries.service.js
const sql = require('mssql');

require('dotenv').config();

// الحصول على pool من app.locals (تم تعيينه في server.js)
function getPool() {
    const app = require('/app');
    if (!app.locals.dbPool) {
        throw new Error('قاعدة البيانات غير متصلة');
    }
    return app.locals.dbPool;
}

class InquiriesService {
    
    async queryAsync(query, params = {}) {
        const pool = getPool();
        try {
            const result = await pool.request().query(query);
            return result.recordset || [];
        } catch (err) {
            console.error('❌ InquiriesService.queryAsync error:', err);
            throw err;
        }
    }

    async executeAsync(query) {
        const pool = getPool();
        try {
            const result = await pool.request().query(query);
            return result;
        } catch (err) {
            console.error('❌ InquiriesService.executeAsync error:', err);
            throw err;
        }
    }

    escapeSql(str) {
        if (!str) return '';
        return str.replace(/'/g, "''");
    }

    // ========== دالة مساعدة لتوليد رقم استفسار فريد ==========
    async generateInquiryCode() {
        const year = new Date().getFullYear();
        const query = `
            SELECT MAX(CAST(SUBSTRING(inquiryCode, 9, 4) AS INT)) as lastNum
            FROM Inquiries
            WHERE inquiryCode LIKE N'INQ-${year}-%' AND inquiryCode IS NOT NULL
        `;
        const result = await this.queryAsync(query);
        const lastNum = result[0]?.lastNum || 0;
        const nextNum = lastNum + 1;
        const paddedNum = String(nextNum).padStart(4, '0');
        return `INQ-${year}-${paddedNum}`;
    }

    // ========== جلب جميع أنواع الاستفسارات المميزة ==========
    async getDistinctTypes() {
        try {
            const query = `SELECT DISTINCT inquiryType FROM Inquiries WHERE inquiryType IS NOT NULL ORDER BY inquiryType`;
            const result = await this.queryAsync(query);
            return result.map(r => r.inquiryType);
        } catch (error) {
            console.error('❌ InquiriesService.getDistinctTypes:', error);
            return [];
        }
    }

    // ========== جلب جميع الاستفسارات مع فلترة ==========
    async getAllInquiries(page = 1, limit = 25, sort = 'newest', filters = {}) {
        try {
            let whereClauses = [];

            if (filters.search && filters.search.trim() !== '') {
                whereClauses.push(`(
                    i.inquiryCode LIKE N'%${this.escapeSql(filters.search)}%' OR 
                    i.customerName LIKE N'%${this.escapeSql(filters.search)}%' OR 
                    i.customerEmail LIKE N'%${this.escapeSql(filters.search)}%' OR 
                    i.customerPhone LIKE N'%${this.escapeSql(filters.search)}%' OR 
                    i.message LIKE N'%${this.escapeSql(filters.search)}%'
                )`);
            }

            if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
                const statusList = filters.status.map(s => `N'${this.escapeSql(s)}'`).join(', ');
                whereClauses.push(`i.status IN (${statusList})`);
            }

            if (filters.type && Array.isArray(filters.type) && filters.type.length > 0) {
                const typeList = filters.type.map(t => `N'${this.escapeSql(t)}'`).join(', ');
                whereClauses.push(`i.inquiryType IN (${typeList})`);
            }

            const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

            let orderBy = 'ORDER BY ';
            switch(sort) {
                case 'oldest': orderBy += 'i.createdAt ASC'; break;
                case 'name': orderBy += 'i.customerName ASC'; break;
                default: orderBy += 'i.createdAt DESC';
            }

            const offset = (page - 1) * limit;

            const query = `
                SELECT 
                    i.*,
                    u.fullName as assignedToName,
                    r.fullName as respondedByName,
                    p.projectName
                FROM Inquiries i
                LEFT JOIN Users u ON i.assignedTo = u.id
                LEFT JOIN Users r ON i.respondedBy = r.id
                LEFT JOIN Projects p ON i.projectId = p.id
                ${whereClause}
                ${orderBy}
                OFFSET ${offset} ROWS
                FETCH NEXT ${limit} ROWS ONLY
            `;

            const countQuery = `
                SELECT COUNT(*) as total 
                FROM Inquiries i
                ${whereClause}
            `;

            const [inquiries, countResult] = await Promise.all([
                this.queryAsync(query),
                this.queryAsync(countQuery)
            ]);

            const totalItems = countResult[0]?.total || 0;
            const totalPages = Math.ceil(totalItems / limit);

            return {
                inquiries,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalItems,
                    itemsPerPage: parseInt(limit),
                    hasNextPage: parseInt(page) < totalPages,
                    hasPrevPage: parseInt(page) > 1
                }
            };
        } catch (error) {
            console.error('❌ InquiriesService.getAllInquiries:', error);
            throw error;
        }
    }

    // ========== جلب استفسار واحد ==========
    async getInquiryById(id) {
        try {
            const query = `
                SELECT 
                    i.*,
                    u.fullName as assignedToName,
                    r.fullName as respondedByName,
                    p.projectName
                FROM Inquiries i
                LEFT JOIN Users u ON i.assignedTo = u.id
                LEFT JOIN Users r ON i.respondedBy = r.id
                LEFT JOIN Projects p ON i.projectId = p.id
                WHERE i.id = ${parseInt(id)}
            `;
            const result = await this.queryAsync(query);
            return result && result.length > 0 ? result[0] : null;
        } catch (error) {
            console.error('❌ InquiriesService.getInquiryById:', error);
            throw error;
        }
    }

    // ========== إنشاء استفسار جديد ==========
    async createInquiry(data) {
        try {
            const inquiryCode = await this.generateInquiryCode();

            const columns = [
                'inquiryCode', 'projectId', 'customerName', 'customerEmail', 'customerPhone',
                'message', 'inquiryType', 'status', 'assignedTo', 'contactPreferences', 'preferredTime',
                'createdAt', 'updatedAt'
            ];

            const values = [
                `N'${this.escapeSql(inquiryCode)}'`,
                data.projectId ? parseInt(data.projectId) : 'NULL',
                `N'${this.escapeSql(data.customerName)}'`,
                `N'${this.escapeSql(data.customerEmail)}'`,
                `N'${this.escapeSql(data.customerPhone)}'`,
                `N'${this.escapeSql(data.message)}'`,
                `N'${this.escapeSql(data.inquiryType || 'استفسار_عام')}'`,
                `N'${this.escapeSql(data.status || 'جديد')}'`,
                data.assignedTo ? parseInt(data.assignedTo) : 'NULL',
                `N'${this.escapeSql(data.contactPreferences || '')}'`,
                `N'${this.escapeSql(data.preferredTime || '')}'`,
                'GETDATE()',
                'GETDATE()'
            ];

            const insertQuery = `
                INSERT INTO Inquiries (${columns.join(', ')})
                OUTPUT INSERTED.id
                VALUES (${values.join(', ')})
            `;

            const result = await this.queryAsync(insertQuery);
            const newId = result[0]?.id;

            if (!newId) throw new Error('فشل في الحصول على معرف الاستفسار الجديد');

            return await this.getInquiryById(newId);
        } catch (error) {
            console.error('❌ InquiriesService.createInquiry:', error);
            throw error;
        }
    }

    // ========== تحديث استفسار ==========
    async updateInquiry(id, data) {
        try {
            const existing = await this.getInquiryById(id);
            if (!existing) throw new Error('الاستفسار غير موجود');

            const updateFields = [];

            if (data.projectId !== undefined) updateFields.push(`projectId = ${data.projectId ? parseInt(data.projectId) : 'NULL'}`);
            if (data.customerName !== undefined) updateFields.push(`customerName = N'${this.escapeSql(data.customerName)}'`);
            if (data.customerEmail !== undefined) updateFields.push(`customerEmail = N'${this.escapeSql(data.customerEmail)}'`);
            if (data.customerPhone !== undefined) updateFields.push(`customerPhone = N'${this.escapeSql(data.customerPhone)}'`);
            if (data.message !== undefined) updateFields.push(`message = N'${this.escapeSql(data.message)}'`);
            if (data.inquiryType !== undefined) updateFields.push(`inquiryType = N'${this.escapeSql(data.inquiryType)}'`);
            if (data.status !== undefined) updateFields.push(`status = N'${this.escapeSql(data.status)}'`);
            if (data.assignedTo !== undefined) updateFields.push(`assignedTo = ${data.assignedTo ? parseInt(data.assignedTo) : 'NULL'}`);
            if (data.contactPreferences !== undefined) updateFields.push(`contactPreferences = N'${this.escapeSql(data.contactPreferences)}'`);
            if (data.preferredTime !== undefined) updateFields.push(`preferredTime = N'${this.escapeSql(data.preferredTime)}'`);

            updateFields.push('updatedAt = GETDATE()');

            if (updateFields.length === 1) return existing;

            const query = `
                UPDATE Inquiries
                SET ${updateFields.join(', ')}
                WHERE id = ${parseInt(id)}
            `;

            await this.executeAsync(query);
            return await this.getInquiryById(id);
        } catch (error) {
            console.error('❌ InquiriesService.updateInquiry:', error);
            throw error;
        }
    }

    // ========== الرد على الاستفسار ==========
    async replyToInquiry(id, replyData) {
        try {
            const existing = await this.getInquiryById(id);
            if (!existing) throw new Error('الاستفسار غير موجود');

            const updateFields = [
                `response = N'${this.escapeSql(replyData.response)}'`,
                `respondedAt = GETDATE()`,
                `updatedAt = GETDATE()`
            ];

            if (replyData.status) {
                updateFields.push(`status = N'${this.escapeSql(replyData.status)}'`);
            }

            if (replyData.respondedBy !== undefined) {
                updateFields.push(`respondedBy = ${replyData.respondedBy ? parseInt(replyData.respondedBy) : 'NULL'}`);
            }

            const query = `
                UPDATE Inquiries
                SET ${updateFields.join(', ')}
                WHERE id = ${parseInt(id)}
            `;

            await this.executeAsync(query);
            return await this.getInquiryById(id);
        } catch (error) {
            console.error('❌ InquiriesService.replyToInquiry:', error);
            throw error;
        }
    }

    // ========== حذف استفسار ==========
    async deleteInquiry(id) {
        try {
            const checkLeads = await this.queryAsync(`SELECT id FROM Leads WHERE inquiryId = ${parseInt(id)}`);
            if (checkLeads.length > 0) {
                throw new Error('لا يمكن حذف الاستفسار لوجود عملاء محتملين مرتبطين به');
            }

            await this.executeAsync(`DELETE FROM Inquiries WHERE id = ${parseInt(id)}`);
            return true;
        } catch (error) {
            console.error('❌ InquiriesService.deleteInquiry:', error);
            throw error;
        }
    }

    // ========== إحصائيات الاستفسارات ==========
    async getInquiriesStats() {
        try {
            const query = `
                SELECT 
                    COUNT(*) as totalInquiries,
                    SUM(CASE WHEN status = N'جديد' THEN 1 ELSE 0 END) as newInquiries,
                    SUM(CASE WHEN status = N'تحت_المراجعة' THEN 1 ELSE 0 END) as pendingInquiries,
                    SUM(CASE WHEN status = N'تم_الرد' THEN 1 ELSE 0 END) as resolvedInquiries,
                    SUM(CASE WHEN status = N'ملغي' THEN 1 ELSE 0 END) as closedInquiries,
                    SUM(CASE WHEN status = N'متحول_لعميل' THEN 1 ELSE 0 END) as convertedInquiries
                FROM Inquiries
            `;
            const result = await this.queryAsync(query);
            return result[0] || {
                totalInquiries: 0,
                newInquiries: 0,
                pendingInquiries: 0,
                resolvedInquiries: 0,
                closedInquiries: 0,
                convertedInquiries: 0
            };
        } catch (error) {
            console.error('❌ InquiriesService.getInquiriesStats:', error);
            throw error;
        }
    }

    // ========== أحدث الاستفسارات ==========
    async getRecentInquiries(limit = 3) {
        try {
            const query = `
                SELECT TOP ${limit}
                    id, inquiryCode, customerName, message, status, createdAt
                FROM Inquiries
                ORDER BY createdAt DESC
            `;
            return await this.queryAsync(query);
        } catch (error) {
            console.error('❌ InquiriesService.getRecentInquiries:', error);
            return [];
        }
    }

    // ========== جلب المشاريع للقوائم ==========
    async getAllProjects() {
        try {
            const query = `
                SELECT id, projectName
                FROM Projects
                WHERE status != N'مباع'
                ORDER BY projectName
            `;
            return await this.queryAsync(query);
        } catch (error) {
            console.error('❌ InquiriesService.getAllProjects:', error);
            return [];
        }
    }

    // ========== تصدير الاستفسارات ==========
    async exportInquiries() {
        try {
            const query = `
                SELECT 
                    i.inquiryCode as 'رقم الاستفسار',
                    i.customerName as 'العميل',
                    i.customerEmail as 'البريد',
                    i.customerPhone as 'الهاتف',
                    i.inquiryType as 'نوع الاستفسار',
                    CASE i.status
                        WHEN N'جديد' THEN N'جديد'
                        WHEN N'تحت_المراجعة' THEN N'تحت المراجعة'
                        WHEN N'تم_الرد' THEN N'تم الرد'
                        WHEN N'ملغي' THEN N'ملغي'
                        WHEN N'متحول_لعميل' THEN N'متحول لعميل'
                        ELSE i.status
                    END as 'الحالة',
                    CONVERT(NVARCHAR, i.createdAt, 23) as 'تاريخ الإرسال',
                    CONVERT(NVARCHAR, i.respondedAt, 23) as 'تاريخ الرد'
                FROM Inquiries i
                ORDER BY i.createdAt DESC
            `;
            return await this.queryAsync(query);
        } catch (error) {
            console.error('❌ InquiriesService.exportInquiries:', error);
            return [];
        }
    }

    // ========== البحث عن المستخدمين ==========
    async searchUsers(query) {
        try {
            if (!query || query.trim() === '') {
                const sqlQuery = `
                    SELECT id, fullName, email, role
                    FROM Users
                    WHERE isActive = 1
                    ORDER BY fullName
                `;
                return await this.queryAsync(sqlQuery);
            } else {
                const search = `%${this.escapeSql(query)}%`;
                const sqlQuery = `
                    SELECT id, fullName, email, role
                    FROM Users
                    WHERE (fullName LIKE N'${search}' OR email LIKE N'${search}')
                      AND isActive = 1
                    ORDER BY fullName
                `;
                return await this.queryAsync(sqlQuery);
            }
        } catch (error) {
            console.error('❌ InquiriesService.searchUsers:', error);
            return [];
        }
    }
}

module.exports = new InquiriesService();