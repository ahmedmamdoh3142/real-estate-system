// Backend/services/admin/auth.service.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sql = require('mssql');

require('dotenv').config();

const JWT_SECRET = 'real_estate_system_secret_key_2024';

// الحصول على pool من app.locals (تم تعيينه في server.js)
function getPool() {
    const app = require('/app');
    if (!app.locals.dbPool) {
        throw new Error('قاعدة البيانات غير متصلة');
    }
    return app.locals.dbPool;
}

// دالة مساعدة للاستعلامات (تعيد Promise)
async function queryAsync(sqlQuery) {
    const pool = getPool();
    try {
        const result = await pool.request().query(sqlQuery);
        return result.recordset;
    } catch (err) {
        console.error('❌ خطأ في الاستعلام:', err.message);
        throw err;
    }
}

/**
 * جلب صلاحيات المستخدم من قاعدة البيانات
 */
async function getUserPermissionsFromDB(userId) {
    try {
        const permissionsQuery = `
            SELECT p.name
            FROM UserPermissions up
            INNER JOIN Permissions p ON up.permissionId = p.id
            WHERE up.userId = ${userId} AND p.isActive = 1
        `;
        const rows = await queryAsync(permissionsQuery);
        return rows.map(row => row.name);
    } catch (error) {
        console.error('❌ خطأ في جلب صلاحيات المستخدم:', error);
        return [];
    }
}

/**
 * تسجيل دخول المستخدم
 */
exports.loginUser = async (username, password, rememberMe) => {
    try {
        console.log(`🔐 محاولة تسجيل دخول: ${username}`);
        
        // التحقق من البيانات الأساسية
        if (!username || !password) {
            return {
                success: false,
                message: 'اسم المستخدم وكلمة المرور مطلوبان',
                statusCode: 400
            };
        }
        
        // البحث عن المستخدم
        const userQuery = `
            SELECT 
                id,
                username,
                passwordHash,
                fullName,
                email,
                phone,
                role,
                isActive,
                lastLogin,
                createdAt
            FROM Users 
            WHERE username = '${username.replace(/'/g, "''")}' 
               OR email = '${username.replace(/'/g, "''")}'
        `;
        
        const users = await queryAsync(userQuery);
        
        if (!users || users.length === 0) {
            // تسجيل محاولة فاشلة
            await logFailedAttempt(username, 'المستخدم غير موجود');
            
            return {
                success: false,
                message: 'اسم المستخدم أو كلمة المرور غير صحيحة',
                statusCode: 401
            };
        }
        
        const user = users[0];
        
        // التحقق من حالة الحساب
        if (!user.isActive) {
            await logFailedAttempt(username, 'الحساب غير نشط', user.id);
            
            return {
                success: false,
                message: 'حسابك غير نشط. يرجى التواصل مع المدير',
                statusCode: 403
            };
        }
        
        // التحقق من كلمة المرور
        const passwordMatches = await bcrypt.compare(password, user.passwordHash);
        
        if (!passwordMatches) {
            await logFailedAttempt(username, 'كلمة المرور غير صحيحة', user.id);
            
            return {
                success: false,
                message: 'اسم المستخدم أو كلمة المرور غير صحيحة',
                statusCode: 401
            };
        }
        
        // تحديث وقت آخر دخول
        await queryAsync(`
            UPDATE Users 
            SET lastLogin = GETDATE() 
            WHERE id = ${user.id}
        `);
        
        // جلب الصلاحيات من جدول UserPermissions
        const permissions = await getUserPermissionsFromDB(user.id);
        console.log(`🔑 صلاحيات المستخدم:`, permissions);
        
        // إنشاء token
        const tokenPayload = {
            userId: user.id,
            username: user.username,
            role: user.role,
            fullName: user.fullName
        };
        
        const token = jwt.sign(
            tokenPayload,
            JWT_SECRET,
            { expiresIn: rememberMe ? '30d' : '1d' }
        );
        
        // تسجيل الدخول الناجح
        await logSuccessfulLogin(user.id, user.username);
        
        // إعداد بيانات المستخدم للرد
        const userData = {
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isActive: user.isActive,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt
        };
        
        return {
            success: true,
            data: {
                token: token,
                user: userData,
                permissions: permissions  // مصفوفة الصلاحيات من القاعدة
            }
        };
        
    } catch (error) {
        console.error('❌ خطأ في loginUser service:', error);
        
        return {
            success: false,
            message: 'حدث خطأ في الخادم',
            statusCode: 500
        };
    }
};

/**
 * الحصول على بيانات المستخدم الحالي
 */
exports.getCurrentUser = async (token) => {
    try {
        // التحقق من التوكن
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (jwtError) {
            return {
                success: false,
                message: 'توكن غير صالح أو منتهي الصلاحية',
                statusCode: 401
            };
        }
        
        // جلب بيانات المستخدم
        const userQuery = `
            SELECT 
                id,
                username,
                fullName,
                email,
                phone,
                role,
                isActive,
                lastLogin,
                createdAt
            FROM Users 
            WHERE id = ${decoded.userId}
        `;
        
        const users = await queryAsync(userQuery);
        
        if (!users || users.length === 0) {
            return {
                success: false,
                message: 'المستخدم غير موجود',
                statusCode: 404
            };
        }
        
        const user = users[0];
        const permissions = await getUserPermissionsFromDB(user.id);
        
        return {
            success: true,
            data: {
                user: user,
                permissions: permissions
            }
        };
        
    } catch (error) {
        console.error('❌ خطأ في getCurrentUser service:', error);
        
        return {
            success: false,
            message: 'حدث خطأ في الخادم',
            statusCode: 500
        };
    }
};

/**
 * تحديث الملف الشخصي
 */
exports.updateProfile = async (token, profileData) => {
    try {
        // التحقق من التوكن
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (jwtError) {
            return {
                success: false,
                message: 'توكن غير صالح',
                statusCode: 401
            };
        }
        
        const { fullName, email, phone } = profileData;
        
        // التحقق من البريد الإلكتروني
        if (email) {
            const emailCheckQuery = `
                SELECT id FROM Users 
                WHERE email = '${email.replace(/'/g, "''")}' 
                AND id != ${decoded.userId}
            `;
            
            const existingUsers = await queryAsync(emailCheckQuery);
            
            if (existingUsers && existingUsers.length > 0) {
                return {
                    success: false,
                    message: 'البريد الإلكتروني مستخدم بالفعل',
                    statusCode: 400
                };
            }
        }
        
        // تحديث البيانات
        const updateQuery = `
            UPDATE Users 
            SET 
                fullName = '${fullName.replace(/'/g, "''")}',
                email = '${email.replace(/'/g, "''")}',
                phone = ${phone ? `'${phone.replace(/'/g, "''")}'` : 'NULL'},
                updatedAt = GETDATE()
            WHERE id = ${decoded.userId}
        `;
        
        await queryAsync(updateQuery);
        
        // تسجيل العملية
        await logAudit(
            decoded.userId,
            'تحديث_الملف_الشخصي',
            'Users',
            decoded.userId,
            null,
            JSON.stringify({ fullName, email, phone })
        );
        
        return {
            success: true,
            message: 'تم تحديث البيانات بنجاح'
        };
        
    } catch (error) {
        console.error('❌ خطأ في updateProfile service:', error);
        
        return {
            success: false,
            message: 'حدث خطأ في تحديث البيانات',
            statusCode: 500
        };
    }
};

/**
 * تغيير كلمة المرور
 */
exports.changePassword = async (token, passwordData) => {
    try {
        // التحقق من التوكن
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (jwtError) {
            return {
                success: false,
                message: 'توكن غير صالح',
                statusCode: 401
            };
        }
        
        const { currentPassword, newPassword } = passwordData;
        
        // جلب كلمة المرور الحالية
        const userQuery = `
            SELECT passwordHash 
            FROM Users 
            WHERE id = ${decoded.userId}
        `;
        
        const users = await queryAsync(userQuery);
        
        if (!users || users.length === 0) {
            return {
                success: false,
                message: 'المستخدم غير موجود',
                statusCode: 404
            };
        }
        
        const user = users[0];
        
        // التحقق من كلمة المرور الحالية
        const currentPasswordMatches = await bcrypt.compare(currentPassword, user.passwordHash);
        
        if (!currentPasswordMatches) {
            return {
                success: false,
                message: 'كلمة المرور الحالية غير صحيحة',
                statusCode: 400
            };
        }
        
        // تشفير كلمة المرور الجديدة
        const saltRounds = 10;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
        
        // تحديث كلمة المرور
        const updateQuery = `
            UPDATE Users 
            SET 
                passwordHash = '${newPasswordHash}',
                updatedAt = GETDATE()
            WHERE id = ${decoded.userId}
        `;
        
        await queryAsync(updateQuery);
        
        // تسجيل العملية
        await logAudit(
            decoded.userId,
            'تغيير_كلمة_المرور',
            'Users',
            decoded.userId,
            null,
            '{"action": "تم_تغيير_كلمة_المرور"}'
        );
        
        return {
            success: true,
            message: 'تم تغيير كلمة المرور بنجاح'
        };
        
    } catch (error) {
        console.error('❌ خطأ في changePassword service:', error);
        
        return {
            success: false,
            message: 'حدث خطأ في تغيير كلمة المرور',
            statusCode: 500
        };
    }
};

/**
 * تسجيل الخروج
 */
exports.logoutUser = async (token) => {
    try {
        // التحقق من التوكن
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
            
            // تسجيل عملية الخروج
            await logAudit(
                decoded.userId,
                'تسجيل_خروج',
                'Users',
                decoded.userId,
                null,
                '{"action": "تسجيل_خروج_من_النظام"}'
            );
            
        } catch (jwtError) {
            // التوكن غير صالح، لا بأس
        }
        
        return { success: true };
        
    } catch (error) {
        console.error('❌ خطأ في logoutUser service:', error);
        return { success: false };
    }
};

/**
 * الحصول على إحصائيات لوحة التحكم
 */
exports.getDashboardStats = async (token) => {
    try {
        // التحقق من التوكن
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (jwtError) {
            return {
                success: false,
                message: 'توكن غير صالح',
                statusCode: 401
            };
        }
        
        // بناء الاستعلام بناءً على الدور
        let statsQuery;
        
        switch (decoded.role) {
            case 'مشرف_عام':
            case 'مدير_مشاريع':
                statsQuery = `
                    SELECT 
                        (SELECT COUNT(*) FROM Projects) as totalProjects,
                        (SELECT COUNT(*) FROM Projects WHERE status = 'نشط') as activeProjects,
                        (SELECT COUNT(*) FROM Contracts) as totalContracts,
                        (SELECT COUNT(*) FROM Contracts WHERE contractStatus = 'نشط') as activeContracts,
                        (SELECT COUNT(*) FROM Inquiries WHERE status = 'جديد') as newInquiries,
                        (SELECT COUNT(*) FROM Leads WHERE status = 'مؤهل') as qualifiedLeads,
                        (SELECT ISNULL(SUM(amount), 0) FROM Payments WHERE status = 'مؤكد') as totalRevenue,
                        (SELECT COUNT(*) FROM Users) as totalUsers
                `;
                break;
                
            case 'محاسب':
                statsQuery = `
                    SELECT 
                        (SELECT COUNT(*) FROM Contracts) as totalContracts,
                        (SELECT COUNT(*) FROM PaymentSchedules WHERE status = 'مستحق') as pendingPayments,
                        (SELECT COUNT(*) FROM PaymentSchedules WHERE status = 'متأخر') as overduePayments,
                        (SELECT ISNULL(SUM(amount), 0) FROM Payments WHERE MONTH(paymentDate) = MONTH(GETDATE())) as monthlyRevenue,
                        (SELECT ISNULL(SUM(amountDue), 0) FROM PaymentSchedules WHERE status IN ('مستحق', 'متأخر')) as pendingAmount,
                        (SELECT COUNT(*) FROM Payments WHERE paymentDate = CAST(GETDATE() AS DATE)) as todayPayments
                `;
                break;
                
            case 'موظف_استقبال':
                statsQuery = `
                    SELECT 
                        (SELECT COUNT(*) FROM Inquiries WHERE assignedTo = ${decoded.userId} AND status = 'جديد') as myNewInquiries,
                        (SELECT COUNT(*) FROM Inquiries WHERE assignedTo = ${decoded.userId} AND status = 'تحت_المراجعة') as myPendingInquiries,
                        (SELECT COUNT(*) FROM Inquiries WHERE CAST(createdAt AS DATE) = CAST(GETDATE() AS DATE)) as todayInquiries,
                        (SELECT COUNT(*) FROM Inquiries) as totalInquiries
                `;
                break;
                
            default:
                statsQuery = `
                    SELECT 
                        (SELECT COUNT(*) FROM Projects) as totalProjects,
                        (SELECT COUNT(*) FROM Inquiries) as totalInquiries
                `;
        }
        
        const stats = await queryAsync(statsQuery);
        
        return {
            success: true,
            data: stats[0] || {},
            userRole: decoded.role
        };
        
    } catch (error) {
        console.error('❌ خطأ في getDashboardStats service:', error);
        
        return {
            success: false,
            message: 'حدث خطأ في جلب الإحصائيات',
            statusCode: 500
        };
    }
};

/**
 * الحصول على آخر الأنشطة
 */
exports.getRecentActivities = async (token) => {
    try {
        // التحقق من التوكن
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (jwtError) {
            return {
                success: false,
                message: 'توكن غير صالح',
                statusCode: 401
            };
        }
        
        // جلب الأنشطة
        let activitiesQuery;
        
        if (decoded.role === 'مشرف_عام') {
            activitiesQuery = `
                SELECT TOP 20 
                    a.id,
                    a.action,
                    a.tableName,
                    a.recordId,
                    a.createdAt,
                    u.fullName as userFullName,
                    u.username as userUsername
                FROM AuditLogs a
                LEFT JOIN Users u ON a.userId = u.id
                ORDER BY a.createdAt DESC
            `;
        } else {
            activitiesQuery = `
                SELECT TOP 20 
                    a.id,
                    a.action,
                    a.tableName,
                    a.recordId,
                    a.createdAt,
                    u.fullName as userFullName,
                    u.username as userUsername
                FROM AuditLogs a
                LEFT JOIN Users u ON a.userId = u.id
                WHERE a.userId = ${decoded.userId}
                ORDER BY a.createdAt DESC
            `;
        }
        
        const activities = await queryAsync(activitiesQuery);
        
        return {
            success: true,
            data: activities
        };
        
    } catch (error) {
        console.error('❌ خطأ في getRecentActivities service:', error);
        
        return {
            success: false,
            message: 'حدث خطأ في جلب الأنشطة',
            statusCode: 500
        };
    }
};

// ===== الدوال المساعدة =====

/**
 * تسجيل محاولة دخول فاشلة
 */
async function logFailedAttempt(username, reason, userId = null) {
    try {
        const query = `
            INSERT INTO AuditLogs (userId, action, tableName, recordId, oldValue, newValue)
            VALUES (
                ${userId || 'NULL'},
                'محاولة_دخول_فاشلة',
                'Users',
                ${userId || 0},
                NULL,
                '{"username": "${username.replace(/'/g, "''")}", "reason": "${reason}"}'
            )
        `;
        
        await queryAsync(query);
    } catch (error) {
        console.error('❌ خطأ في تسجيل محاولة فاشلة:', error);
    }
}

/**
 * تسجيل دخول ناجح
 */
async function logSuccessfulLogin(userId, username) {
    try {
        const query = `
            INSERT INTO AuditLogs (userId, action, tableName, recordId, oldValue, newValue)
            VALUES (
                ${userId},
                'تسجيل_دخول_ناجح',
                'Users',
                ${userId},
                NULL,
                '{"username": "${username.replace(/'/g, "''")}"}'
            )
        `;
        
        await queryAsync(query);
    } catch (error) {
        console.error('❌ خطأ في تسجيل دخول ناجح:', error);
    }
}

/**
 * تسجيل سجل تدقيق عام
 */
async function logAudit(userId, action, tableName, recordId, oldValue, newValue) {
    try {
        const query = `
            INSERT INTO AuditLogs (userId, action, tableName, recordId, oldValue, newValue)
            VALUES (
                ${userId || 'NULL'},
                '${action.replace(/'/g, "''")}',
                '${tableName.replace(/'/g, "''")}',
                ${recordId || 0},
                ${oldValue ? `'${JSON.stringify(oldValue).replace(/'/g, "''")}'` : 'NULL'},
                ${newValue ? `'${JSON.stringify(newValue).replace(/'/g, "''")}'` : 'NULL'}
            )
        `;
        
        await queryAsync(query);
    } catch (error) {
        console.error('❌ خطأ في تسجيل سجل التدقيق:', error);
    }
}