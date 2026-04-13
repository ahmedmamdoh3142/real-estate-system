// 📁 Backend/services/admin/users.service.js
const bcrypt = require('bcryptjs');
const sql = require('mssql');

require('dotenv').config();

// الحصول على pool من app.locals (تم تعيينه في server.js)
function getPool() {
    if (!global.dbPool) {
        throw new Error('قاعدة البيانات غير متصلة - global.dbPool غير موجود');
    }
    return global.dbPool;
}

class UsersService {
    
    async queryAsync(query, params = {}) {
        const pool = getPool();
        try {
            const result = await pool.request().query(query);
            return result.recordset || [];
        } catch (err) {
            console.error('❌ UsersService.queryAsync error:', err);
            throw err;
        }
    }

    async executeAsync(query) {
        const pool = getPool();
        try {
            const result = await pool.request().query(query);
            return result;
        } catch (err) {
            console.error('❌ UsersService.executeAsync error:', err);
            throw err;
        }
    }

    escapeSql(str) {
        if (!str) return '';
        return str.replace(/'/g, "''");
    }

    // ========== دالة مساعدة لتشفير كلمة المرور ==========
    async hashPassword(password) {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    }

    // ========== دالة مساعدة لتوليد userId فريد (اختياري) ==========
    async generateUserId() {
        const query = `SELECT MAX(CAST(SUBSTRING(username, 6, 3) AS INT)) as lastNum FROM Users WHERE username LIKE 'user-%'`;
        const result = await this.queryAsync(query);
        const lastNum = result[0]?.lastNum || 0;
        const nextNum = lastNum + 1;
        return `user-${String(nextNum).padStart(3, '0')}`;
    }

    // ---------- جلب جميع الصلاحيات المتاحة ----------
    async getAllPermissions() {
        try {
            const query = `
                SELECT id, name, displayName, category, parentId, sortOrder
                FROM Permissions
                WHERE isActive = 1
                ORDER BY sortOrder ASC
            `;
            const result = await this.queryAsync(query);
            return result;
        } catch (error) {
            console.error('❌ UsersService.getAllPermissions:', error);
            return [];
        }
    }

    // ---------- جلب صلاحيات مستخدم معين ----------
    async getUserPermissions(userId) {
        try {
            const query = `
                SELECT p.id, p.name, p.displayName, p.category, p.parentId
                FROM UserPermissions up
                INNER JOIN Permissions p ON up.permissionId = p.id
                WHERE up.userId = ${parseInt(userId)}
            `;
            const result = await this.queryAsync(query);
            return result.map(r => r.id);
        } catch (error) {
            console.error('❌ UsersService.getUserPermissions:', error);
            return [];
        }
    }

    // ---------- تعيين صلاحيات مستخدم (حذف القديم وإضافة الجديد) ----------
    async setUserPermissions(userId, permissionIds) {
        try {
            // حذف الصلاحيات القديمة
            await this.executeAsync(`DELETE FROM UserPermissions WHERE userId = ${parseInt(userId)}`);
            
            // إضافة الصلاحيات الجديدة
            if (permissionIds && permissionIds.length > 0) {
                const values = permissionIds.map(pid => `(${parseInt(userId)}, ${parseInt(pid)}, GETDATE())`).join(',');
                const insertQuery = `INSERT INTO UserPermissions (userId, permissionId, assignedAt) VALUES ${values}`;
                await this.executeAsync(insertQuery);
            }
            return true;
        } catch (error) {
            console.error('❌ UsersService.setUserPermissions:', error);
            throw error;
        }
    }

    // ---------- جلب جميع الأدوار الفريدة من جدول المستخدمين (للفلترة) ----------
    async getAllRoles() {
        try {
            const query = `
                SELECT DISTINCT role 
                FROM Users 
                WHERE role IS NOT NULL AND role != ''
                ORDER BY role
            `;
            const result = await this.queryAsync(query);
            const roles = result.map(row => row.role);
            return roles;
        } catch (error) {
            console.error('❌ UsersService.getAllRoles:', error);
            return [];
        }
    }

    // ---------- جلب جميع المستخدمين مع فلترة وصلاحياتهم ----------
    async getAllUsers(page = 1, limit = 25, sort = 'newest', filters = {}) {
        try {
            let whereClauses = [];

            if (filters.search && filters.search.trim() !== '') {
                whereClauses.push(`(
                    username LIKE N'%${this.escapeSql(filters.search)}%' OR 
                    fullName LIKE N'%${this.escapeSql(filters.search)}%' OR 
                    email LIKE N'%${this.escapeSql(filters.search)}%' OR 
                    phone LIKE N'%${this.escapeSql(filters.search)}%' OR
                    role LIKE N'%${this.escapeSql(filters.search)}%' OR
                    department LIKE N'%${this.escapeSql(filters.search)}%'
                )`);
            }

            if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
                const activeConditions = [];
                const inactiveConditions = [];
                filters.status.forEach(s => {
                    if (s === 'نشط') activeConditions.push('1');
                    else if (s === 'غير نشط') inactiveConditions.push('0');
                });
                const statusParts = [];
                if (activeConditions.length > 0) statusParts.push(`isActive IN (${activeConditions.join(',')})`);
                if (inactiveConditions.length > 0) statusParts.push(`isActive IN (${inactiveConditions.join(',')})`);
                if (statusParts.length > 0) whereClauses.push(`(${statusParts.join(' OR ')})`);
            }

            if (filters.role && Array.isArray(filters.role) && filters.role.length > 0) {
                const rolesFilter = filters.role.map(r => `N'${this.escapeSql(r)}'`).join(',');
                whereClauses.push(`role IN (${rolesFilter})`);
            }

            const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

            let orderBy = 'ORDER BY ';
            switch(sort) {
                case 'oldest': orderBy += 'createdAt ASC'; break;
                case 'name': orderBy += 'fullName ASC'; break;
                case 'activity': orderBy += 'lastLogin DESC NULLS LAST'; break;
                case 'status': orderBy += 'isActive DESC, fullName ASC'; break;
                default: orderBy += 'createdAt DESC';
            }

            const offset = (page - 1) * limit;

            const query = `
                SELECT 
                    id,
                    username,
                    fullName,
                    email,
                    phone,
                    role,
                    isActive,
                    lastLogin,
                    createdAt,
                    updatedAt,
                    department,
                    notes
                FROM Users
                ${whereClause}
                ${orderBy}
                OFFSET ${offset} ROWS
                FETCH NEXT ${limit} ROWS ONLY
            `;

            const countQuery = `
                SELECT COUNT(*) as total 
                FROM Users
                ${whereClause}
            `;

            const [users, countResult] = await Promise.all([
                this.queryAsync(query),
                this.queryAsync(countQuery)
            ]);

            const totalItems = countResult[0]?.total || 0;
            const totalPages = Math.ceil(totalItems / limit);

            // جلب الصلاحيات لكل مستخدم
            const usersWithPermissions = [];
            for (const user of users) {
                const permissions = await this.getUserPermissions(user.id);
                usersWithPermissions.push({
                    ...user,
                    status: user.isActive ? 'نشط' : 'غير نشط',
                    department: user.department || '',
                    userId: `USER-${String(user.id).padStart(3, '0')}`,
                    permissions: permissions
                });
            }

            return {
                users: usersWithPermissions,
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
            console.error('❌ UsersService.getAllUsers:', error);
            throw error;
        }
    }

    // ---------- جلب مستخدم واحد مع صلاحياته ----------
    async getUserById(id) {
        try {
            const query = `
                SELECT 
                    id,
                    username,
                    fullName,
                    email,
                    phone,
                    role,
                    isActive,
                    lastLogin,
                    createdAt,
                    updatedAt,
                    department,
                    notes
                FROM Users
                WHERE id = ${parseInt(id)}
            `;
            const result = await this.queryAsync(query);
            if (!result || result.length === 0) return null;

            const user = result[0];
            user.status = user.isActive ? 'نشط' : 'غير نشط';
            user.userId = `USER-${String(user.id).padStart(3, '0')}`;
            user.department = user.department || '';
            user.permissions = await this.getUserPermissions(user.id);
            return user;
        } catch (error) {
            console.error('❌ UsersService.getUserById:', error);
            throw error;
        }
    }

    // ---------- إنشاء مستخدم جديد مع صلاحياته ----------
    async createUser(data) {
        try {
            // التحقق من البيانات المطلوبة
            if (!data.username || !data.fullName || !data.email || !data.role || !data.password) {
                throw new Error('جميع الحقول المطلوبة يجب أن تكون موجودة');
            }

            // التحقق من عدم تكرار اسم المستخدم أو البريد الإلكتروني
            const checkQuery = `
                SELECT id FROM Users 
                WHERE username = N'${this.escapeSql(data.username)}' 
                   OR email = N'${this.escapeSql(data.email)}'
            `;
            const existing = await this.queryAsync(checkQuery);
            if (existing.length > 0) {
                throw new Error('اسم المستخدم أو البريد الإلكتروني موجود بالفعل');
            }

            // تشفير كلمة المرور
            const passwordHash = await this.hashPassword(data.password);

            // تجهيز الحقول والقيم
            const columns = [
                'username', 'passwordHash', 'fullName', 'email', 'phone',
                'role', 'isActive', 'createdAt', 'updatedAt', 'department', 'notes'
            ];
            const values = [
                `N'${this.escapeSql(data.username)}'`,
                `'${passwordHash}'`,
                `N'${this.escapeSql(data.fullName)}'`,
                `N'${this.escapeSql(data.email)}'`,
                data.phone ? `N'${this.escapeSql(data.phone)}'` : 'NULL',
                `N'${this.escapeSql(data.role)}'`,
                data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1,
                'GETDATE()',
                'GETDATE()',
                data.department ? `N'${this.escapeSql(data.department)}'` : 'NULL',
                data.notes ? `N'${this.escapeSql(data.notes)}'` : 'NULL'
            ];

            const insertQuery = `
                INSERT INTO Users (${columns.join(', ')})
                OUTPUT INSERTED.id
                VALUES (${values.join(', ')})
            `;

            const result = await this.queryAsync(insertQuery);
            const newId = result[0]?.id;

            if (!newId) throw new Error('فشل في إنشاء المستخدم');

            // إضافة الصلاحيات إذا وجدت
            if (data.permissions && data.permissions.length > 0) {
                await this.setUserPermissions(newId, data.permissions);
            }

            return await this.getUserById(newId);
        } catch (error) {
            console.error('❌ UsersService.createUser:', error);
            throw error;
        }
    }

    // ---------- تحديث مستخدم مع صلاحياته ----------
    async updateUser(id, data) {
        try {
            const existing = await this.getUserById(id);
            if (!existing) throw new Error('المستخدم غير موجود');

            const updateFields = [];

            if (data.username) {
                if (data.username !== existing.username) {
                    const check = await this.queryAsync(`SELECT id FROM Users WHERE username = N'${this.escapeSql(data.username)}' AND id != ${parseInt(id)}`);
                    if (check.length > 0) throw new Error('اسم المستخدم موجود بالفعل');
                }
                updateFields.push(`username = N'${this.escapeSql(data.username)}'`);
            }
            if (data.fullName) updateFields.push(`fullName = N'${this.escapeSql(data.fullName)}'`);
            if (data.email) {
                if (data.email !== existing.email) {
                    const check = await this.queryAsync(`SELECT id FROM Users WHERE email = N'${this.escapeSql(data.email)}' AND id != ${parseInt(id)}`);
                    if (check.length > 0) throw new Error('البريد الإلكتروني موجود بالفعل');
                }
                updateFields.push(`email = N'${this.escapeSql(data.email)}'`);
            }
            if (data.phone !== undefined) updateFields.push(`phone = N'${this.escapeSql(data.phone || '')}'`);
            if (data.role) updateFields.push(`role = N'${this.escapeSql(data.role)}'`);
            if (data.department !== undefined) updateFields.push(`department = N'${this.escapeSql(data.department || '')}'`);
            if (data.isActive !== undefined) updateFields.push(`isActive = ${data.isActive ? 1 : 0}`);
            if (data.notes !== undefined) updateFields.push(`notes = N'${this.escapeSql(data.notes || '')}'`);

            // إذا تم إرسال كلمة مرور جديدة، نقوم بتحديثها
            if (data.password) {
                const passwordHash = await this.hashPassword(data.password);
                updateFields.push(`passwordHash = '${passwordHash}'`);
            }

            if (updateFields.length === 0) return existing;

            updateFields.push('updatedAt = GETDATE()');

            const query = `
                UPDATE Users
                SET ${updateFields.join(', ')}
                WHERE id = ${parseInt(id)}
            `;

            await this.executeAsync(query);

            // تحديث الصلاحيات
            if (data.permissions !== undefined) {
                await this.setUserPermissions(id, data.permissions);
            }

            return await this.getUserById(id);
        } catch (error) {
            console.error('❌ UsersService.updateUser:', error);
            throw error;
        }
    }

    // ---------- حذف مستخدم ----------
    async deleteUser(id) {
        try {
            // حذف الصلاحيات المرتبطة أولاً (بسبب الـ CASCADE سيتم حذفها تلقائياً إذا كان الـ FK معرفاً)
            // لكن للتأكد
            await this.executeAsync(`DELETE FROM UserPermissions WHERE userId = ${parseInt(id)}`);
            const query = `DELETE FROM Users WHERE id = ${parseInt(id)}`;
            await this.executeAsync(query);
            return true;
        } catch (error) {
            console.error('❌ UsersService.deleteUser:', error);
            throw error;
        }
    }

    // ---------- تغيير حالة المستخدم (تفعيل/تعطيل) ----------
    async changeUserStatus(id, isActive) {
        try {
            const query = `
                UPDATE Users
                SET isActive = ${isActive ? 1 : 0},
                    updatedAt = GETDATE()
                WHERE id = ${parseInt(id)}
            `;
            await this.executeAsync(query);
            return await this.getUserById(id);
        } catch (error) {
            console.error('❌ UsersService.changeUserStatus:', error);
            throw error;
        }
    }

    // ---------- تحديث آخر تسجيل دخول ----------
    async updateLastLogin(id) {
        try {
            const query = `
                UPDATE Users
                SET lastLogin = GETDATE()
                WHERE id = ${parseInt(id)}
            `;
            await this.executeAsync(query);
        } catch (error) {
            console.error('❌ UsersService.updateLastLogin:', error);
        }
    }

    // ---------- إحصائيات المستخدمين ----------
    async getUsersStats() {
        try {
            const query = `
                SELECT 
                    COUNT(*) as totalUsers,
                    SUM(CASE WHEN isActive = 1 THEN 1 ELSE 0 END) as activeUsers,
                    SUM(CASE WHEN isActive = 0 THEN 1 ELSE 0 END) as inactiveUsers,
                    SUM(CASE WHEN role = N'مشرف عام' THEN 1 ELSE 0 END) as admins,
                    COUNT(CASE WHEN MONTH(createdAt) = MONTH(GETDATE()) 
                               AND YEAR(createdAt) = YEAR(GETDATE()) THEN 1 END) as newThisMonth
                FROM Users
            `;
            const result = await this.queryAsync(query);
            const stats = result[0] || {};

            // توزيع حسب الدور (نص حر)
            const roleQuery = `
                SELECT role, COUNT(*) as count
                FROM Users
                GROUP BY role
            `;
            const roleResult = await this.queryAsync(roleQuery);
            const roleDistribution = {};
            roleResult.forEach(row => {
                roleDistribution[row.role] = row.count;
            });

            // توزيع حسب الحالة
            const statusDistribution = {
                'نشط': stats.activeUsers || 0,
                'غير نشط': stats.inactiveUsers || 0
            };

            return {
                totalUsers: parseInt(stats.totalUsers) || 0,
                activeUsers: parseInt(stats.activeUsers) || 0,
                inactiveUsers: parseInt(stats.inactiveUsers) || 0,
                admins: parseInt(stats.admins) || 0,
                newThisMonth: parseInt(stats.newThisMonth) || 0,
                roleDistribution,
                statusDistribution
            };
        } catch (error) {
            console.error('❌ UsersService.getUsersStats:', error);
            throw error;
        }
    }

    // ---------- الحصول على أحدث المستخدمين ----------
    async getRecentUsers(limit = 4) {
        try {
            const query = `
                SELECT TOP ${limit}
                    id,
                    fullName,
                    username,
                    email,
                    phone,
                    role,
                    isActive,
                    createdAt,
                    department
                FROM Users
                ORDER BY createdAt DESC
            `;
            const users = await this.queryAsync(query);
            return users.map(u => ({
                ...u,
                status: u.isActive ? 'نشط' : 'غير نشط',
                department: u.department || '',
                userId: `USER-${String(u.id).padStart(3, '0')}`
            }));
        } catch (error) {
            console.error('❌ UsersService.getRecentUsers:', error);
            return [];
        }
    }

    // ---------- تصدير المستخدمين ----------
    async exportUsers() {
        try {
            const query = `
                SELECT 
                    CONCAT('USER-', FORMAT(id, '000')) as 'معرف المستخدم',
                    fullName as 'الاسم الكامل',
                    username as 'اسم المستخدم',
                    email as 'البريد الإلكتروني',
                    phone as 'رقم الهاتف',
                    role as 'الدور',
                    ISNULL(department, 'غير محدد') as 'القسم',
                    CASE WHEN isActive = 1 THEN N'نشط' ELSE N'غير نشط' END as 'الحالة',
                    CONVERT(NVARCHAR, lastLogin, 23) as 'آخر نشاط',
                    CONVERT(NVARCHAR, createdAt, 23) as 'تاريخ التسجيل'
                FROM Users
                ORDER BY createdAt DESC
            `;
            return await this.queryAsync(query);
        } catch (error) {
            console.error('❌ UsersService.exportUsers:', error);
            return [];
        }
    }
}

module.exports = new UsersService();