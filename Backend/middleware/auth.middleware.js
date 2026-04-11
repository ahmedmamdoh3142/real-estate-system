// Backend/middleware/auth.middleware.js
const sql = require('msnodesqlv8');
const jwt = require('jsonwebtoken');

const connectionString = "Server=DESKTOP-54ST25S\\ATTENDANCE;Database=abh;Trusted_Connection=Yes;Driver={SQL Server Native Client 11.0}";

function queryAsync(query) {
    return new Promise((resolve, reject) => {
        sql.query(connectionString, query, (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
}

async function getUserById(userId) {
    const query = `SELECT id, username, fullName, email, phone, role FROM Users WHERE id = ${parseInt(userId)}`;
    const result = await queryAsync(query);
    return result[0] || null;
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

        const user = await getUserById(userId);
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