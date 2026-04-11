// Backend/routes/admin/auth.routes.js - النسخة المعتمدة على جدول الصلاحيات
const express = require('express');
const sql = require('msnodesqlv8');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

console.log('🔐 تهيئة auth.routes.js - نظام المصادقة مع الصلاحيات الديناميكية...');

// سلسلة الاتصال الثابتة
const connectionString = "Server=DESKTOP-54ST25S\\ATTENDANCE;Database=abh;Trusted_Connection=Yes;Driver={SQL Server Native Client 11.0}";
const JWT_SECRET = 'real_estate_system_secret_key_2024';

// دالة مساعدة للاستعلامات
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

// دالة مساعدة للاستعلامات من نوع exec (للـ UPDATE/INSERT)
function executeAsync(sqlQuery) {
    return new Promise((resolve, reject) => {
        sql.query(connectionString, sqlQuery, (err, result) => {
            if (err) {
                console.error('❌ خطأ في التنفيذ:', err.message);
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
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
        // إرجاع مصفوفة بأسماء الصلاحيات فقط (مثل 'dashboard', 'projects' ...)
        return permissions.map(p => p.name);
    } catch (error) {
        console.error('❌ خطأ في جلب صلاحيات المستخدم:', error);
        return []; // في حالة الخطأ نعيد مصفوفة فارغة
    }
}

// 🔐 تسجيل الدخول - باستخدام قاعدة البيانات الحقيقية فقط
router.post('/login', async (req, res) => {
    try {
        console.log('🔐 طلب تسجيل دخول جديد...');
        
        const { username, password, rememberMe } = req.body;
        
        // التحقق من البيانات المدخلة
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'اسم المستخدم وكلمة المرور مطلوبان'
            });
        }
        
        console.log(`👤 محاولة تسجيل دخول للمستخدم: ${username}`);
        
        // البحث عن المستخدم في قاعدة البيانات الحقيقية فقط
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
        
        // التحقق من حالة الحساب
        if (!user.isActive) {
            console.log('❌ الحساب غير نشط:', username);
            return res.status(403).json({
                success: false,
                message: 'حسابك غير نشط. يرجى التواصل مع المدير'
            });
        }
        
        // التحقق من كلمة المرور باستخدام bcrypt
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
        
        // تحديث وقت آخر دخول
        try {
            await executeAsync(`
                UPDATE Users 
                SET lastLogin = GETDATE() 
                WHERE id = ${user.id}
            `);
        } catch (updateError) {
            console.warn('⚠️ فشل تحديث lastLogin:', updateError.message);
            // لا نوقف عملية تسجيل الدخول بسبب هذا الخطأ
        }
        
        // جلب صلاحيات المستخدم من قاعدة البيانات
        const permissions = await getUserPermissions(user.id);
        console.log(`🔑 صلاحيات المستخدم (${permissions.length}):`, permissions);
        
        // إنشاء token (JWT)
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
        
        res.status(200).json({
            success: true,
            message: 'تم تسجيل الدخول بنجاح',
            data: {
                token: token,
                user: userData,
                permissions: permissions  // مصفوفة بأسماء الصلاحيات
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
        
        // الحصول على التوكن من الرأس
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'غير مصرح بالوصول. يرجى تسجيل الدخول'
            });
        }
        
        // التحقق من التوكن
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
        
        // جلب بيانات المستخدم من قاعدة البيانات
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
        // جلب الصلاحيات من جدول UserPermissions
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
        
        // بناء الاستعلام بناءً على الدور (مثال مبسط)
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
        
        // جلب آخر 20 نشاطاً من سجل التدقيق
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
        
        // في حالة عدم وجود جدول AuditLogs، نعيد مصفوفة فارغة
        res.status(200).json({
            success: true,
            data: []
        });
    }
});

module.exports = router;