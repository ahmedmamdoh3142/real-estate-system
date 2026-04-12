// Backend/routes/admin/auth.routes.js - النسخة المعتمدة على جدول الصلاحيات (معدلة لاستخدام mssql)
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sql = require('mssql');

const router = express.Router();

console.log('🔐 تهيئة auth.routes.js - نظام المصادقة مع الصلاحيات الديناميكية (mssql)');

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

// دالة مساعدة للاستعلامات
async function queryAsync(sqlQuery) {
    const pool = getPool();
    console.log('📝 تنفيذ استعلام:', sqlQuery.substring(0, 100) + '...');
    try {
        const result = await pool.request().query(sqlQuery);
        console.log(`✅ تم جلب ${result.recordset.length} صف`);
        return result.recordset;
    } catch (err) {
        console.error('❌ خطأ في الاستعلام:', err.message);
        throw err;
    }
}

// دالة مساعدة للاستعلامات من نوع exec (للـ UPDATE/INSERT)
async function executeAsync(sqlQuery) {
    const pool = getPool();
    console.log('📝 تنفيذ أمر (non-query):', sqlQuery.substring(0, 100) + '...');
    try {
        const result = await pool.request().query(sqlQuery);
        console.log(`✅ تم تنفيذ الأمر بنجاح`);
        return result;
    } catch (err) {
        console.error('❌ خطأ في التنفيذ:', err.message);
        throw err;
    }
}

/**
 * جلب صلاحيات المستخدم من جدول UserPermissions
 */
async function getUserPermissions(userId) {
    try {
        const permissionsQuery = `
            SELECT p.name, p.displayName, p.category
            FROM UserPermissions up
            INNER JOIN Permissions p ON up.permissionId = p.id
            WHERE up.userId = ${userId} AND p.isActive = 1
            ORDER BY p.sortOrder
        `;
        const permissions = await queryAsync(permissionsQuery);
        return permissions.map(p => p.name);
    } catch (error) {
        console.error('❌ خطأ في جلب صلاحيات المستخدم:', error);
        return [];
    }
}

// 🔐 تسجيل الدخول - باستخدام قاعدة البيانات الحقيقية فقط
router.post('/login', async (req, res) => {
    try {
        console.log('🔐 طلب تسجيل دخول جديد...');
        
        const { username, password, rememberMe } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'اسم المستخدم وكلمة المرور مطلوبان'
            });
        }
        
        console.log(`👤 محاولة تسجيل دخول للمستخدم: ${username}`);
        
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
        
        let users;
        try {
            users = await queryAsync(userQuery);
        } catch (dbError) {
            console.error('❌ خطأ في قاعدة البيانات:', dbError.message);
            return res.status(500).json({
                success: false,
                message: 'خطأ في الاتصال بقاعدة البيانات، يرجى المحاولة لاحقاً'
            });
        }
        
        if (!users || users.length === 0) {
            console.log('❌ المستخدم غير موجود:', username);
            return res.status(401).json({
                success: false,
                message: 'اسم المستخدم أو كلمة المرور غير صحيحة'
            });
        }
        
        const user = users[0];
        
        if (!user.isActive) {
            console.log('❌ الحساب غير نشط:', username);
            return res.status(403).json({
                success: false,
                message: 'حسابك غير نشط. يرجى التواصل مع المدير'
            });
        }
        
        let passwordMatches = false;
        try {
            passwordMatches = await bcrypt.compare(password, user.passwordHash);
        } catch (bcryptError) {
            console.error('❌ خطأ في bcrypt.compare:', bcryptError.message);
            return res.status(500).json({
                success: false,
                message: 'حدث خطأ في التحقق من كلمة المرور'
            });
        }
        
        if (!passwordMatches) {
            console.log('❌ كلمة المرور غير صحيحة للمستخدم:', username);
            return res.status(401).json({
                success: false,
                message: 'اسم المستخدم أو كلمة المرور غير صحيحة'
            });
        }
        
        console.log('✅ تسجيل الدخول ناجح للمستخدم:', username);
        
        try {
            await executeAsync(`
                UPDATE Users 
                SET lastLogin = GETDATE() 
                WHERE id = ${user.id}
            `);
        } catch (updateError) {
            console.warn('⚠️ فشل تحديث lastLogin:', updateError.message);
        }
        
        const permissions = await getUserPermissions(user.id);
        console.log(`🔑 صلاحيات المستخدم (${permissions.length}):`, permissions);
        
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
        
        res.status(200).json({
            success: true,
            message: 'تم تسجيل الدخول بنجاح',
            data: {
                token: token,
                user: userData,
                permissions: permissions
            }
        });
        
    } catch (error) {
        console.error('❌ خطأ في تسجيل الدخول:', error.message);
        console.error(error.stack);
        
        res.status(500).json({
            success: false,
            message: 'حدث خطأ داخلي في الخادم'
        });
    }
});

// 👤 الحصول على معلومات المستخدم الحالي
router.get('/me', async (req, res) => {
    try {
        console.log('👤 طلب معلومات المستخدم الحالي...');
        
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'غير مصرح بالوصول. يرجى تسجيل الدخول'
            });
        }
        
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (jwtError) {
            console.error('❌ خطأ في التحقق من التوكن:', jwtError.message);
            return res.status(401).json({
                success: false,
                message: 'توكن غير صالح أو منتهي الصلاحية'
            });
        }
        
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
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود'
            });
        }
        
        const user = users[0];
        const permissions = await getUserPermissions(user.id);
        console.log(`🔑 صلاحيات المستخدم (me):`, permissions);
        
        res.status(200).json({
            success: true,
            data: {
                user: user,
                permissions: permissions
            }
        });
        
    } catch (error) {
        console.error('❌ خطأ في جلب معلومات المستخدم:', error);
        
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في جلب معلومات المستخدم'
        });
    }
});

// 🚪 تسجيل الخروج
router.post('/logout', (req, res) => {
    console.log('🚪 طلب تسجيل خروج...');
    
    res.status(200).json({
        success: true,
        message: 'تم تسجيل الخروج بنجاح'
    });
});

// 📊 الحصول على إحصائيات لوحة التحكم
router.get('/dashboard-stats', async (req, res) => {
    try {
        console.log('📊 طلب إحصائيات لوحة التحكم...');
        
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'غير مصرح بالوصول'
            });
        }
        
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (jwtError) {
            return res.status(401).json({
                success: false,
                message: 'توكن غير صالح'
            });
        }
        
        let statsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM Projects) as totalProjects,
                (SELECT COUNT(*) FROM Projects WHERE status = 'نشط') as activeProjects,
                (SELECT COUNT(*) FROM Contracts) as totalContracts,
                (SELECT COUNT(*) FROM Contracts WHERE contractStatus = 'نشط') as activeContracts,
                (SELECT COUNT(*) FROM Inquiries WHERE status = 'جديد') as newInquiries,
                (SELECT COUNT(*) FROM Users) as totalUsers
        `;
        
        const stats = await queryAsync(statsQuery);
        
        res.status(200).json({
            success: true,
            data: stats[0] || {},
            userRole: decoded.role
        });
        
    } catch (error) {
        console.error('❌ خطأ في جلب إحصائيات اللوحة:', error);
        
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في جلب الإحصائيات'
        });
    }
});

// 📄 الحصول على آخر الأنشطة
router.get('/recent-activities', async (req, res) => {
    try {
        console.log('📄 طلب آخر الأنشطة...');
        
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'غير مصرح بالوصول'
            });
        }
        
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (jwtError) {
            return res.status(401).json({
                success: false,
                message: 'توكن غير صالح'
            });
        }
        
        const activitiesQuery = `
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
        
        const activities = await queryAsync(activitiesQuery);
        
        res.status(200).json({
            success: true,
            data: activities || []
        });
        
    } catch (error) {
        console.error('❌ خطأ في جلب الأنشطة:', error);
        
        res.status(200).json({
            success: true,
            data: []
        });
    }
});

module.exports = router;