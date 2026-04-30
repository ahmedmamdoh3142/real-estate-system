// Backend/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const sql = require('mssql');
require('dotenv').config();

// سوف نستخدم req.app.locals.dbPool بدلاً من require('../app')
async function getUserById(pool, userId) {
    const result = await pool.request()
        .input('userId', sql.Int, parseInt(userId))
        .query(`SELECT id, username, fullName, email, phone, role FROM Users WHERE id = @userId`);
    return result.recordset[0] || null;
}

module.exports = async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('🔐 No token provided');
            return res.status(401).json({ success: false, message: 'غير مصرح: يجب تسجيل الدخول' });
        }

        const token = authHeader.substring(7);
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        } catch (err) {
            console.error('❌ Invalid token:', err.message);
            return res.status(401).json({ success: false, message: 'جلسة غير صالحة، يرجى تسجيل الدخول مرة أخرى' });
        }

        const userId = decoded.userId || decoded.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'توكن غير صالح' });
        }

        // الحصول على pool من تطبيق Express نفسه (بدون require دائري)
        const pool = req.app.locals.dbPool;
        if (!pool) {
            console.error('❌ Database pool not available');
            return res.status(500).json({ success: false, message: 'قاعدة البيانات غير متصلة' });
        }

        const user = await getUserById(pool, userId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'المستخدم غير موجود' });
        }

        req.user = user;
        console.log(`🔐 Auth Middleware: Authenticated user ${req.user.fullName} (ID: ${req.user.id})`);
        next();
    } catch (error) {
        console.error('❌ Auth middleware error:', error);
        res.status(500).json({ success: false, message: 'خطأ داخلي في الخادم' });
    }
};