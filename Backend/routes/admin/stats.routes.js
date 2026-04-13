const express = require('express');
const router = express.Router();
const statsController = require('../../controllers/admin/stats.controller');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'real_estate_system_secret_key_2024';

// Middleware للمصادقة مع logging مفصل
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        console.log(`🔐 Stats route - Authorization header: ${authHeader ? 'present' : 'missing'}`);

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ Stats route: No token provided or invalid format');
            return res.status(401).json({ success: false, message: 'غير مصرح: يجب تسجيل الدخول' });
        }

        const token = authHeader.substring(7);
        console.log(`🔑 Token received (first 20 chars): ${token.substring(0, 20)}...`);

        // دعم التوكن الوهمي للتطوير
        if (token.startsWith('mock_jwt_token_')) {
            console.log('🔧 Mock token detected');
            const parts = token.split('_');
            if (parts.length >= 4) {
                const userId = parseInt(parts[3]);
                if (!isNaN(userId)) {
                    console.log(`✅ Mock authentication for user ID: ${userId}`);
                    req.user = { id: userId };
                    return next();
                }
            }
            console.log('❌ Invalid mock token format');
            return res.status(401).json({ success: false, message: 'توكن غير صالح' });
        }

        // التحقق من التوكن الحقيقي
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
            console.log('✅ Token verified successfully:', decoded);
        } catch (err) {
            console.error('❌ JWT verification failed:', err.message);
            return res.status(401).json({ success: false, message: 'جلسة غير صالحة، يرجى تسجيل الدخول مرة أخرى' });
        }

        const userId = decoded.userId || decoded.id;
        if (!userId) {
            console.log('❌ No userId in decoded token');
            return res.status(401).json({ success: false, message: 'توكن غير صالح' });
        }

        req.user = { id: userId };
        console.log(`✅ Stats route: Authenticated user ID: ${userId}`);
        next();
    } catch (error) {
        console.error('❌ Stats route: Auth middleware error:', error);
        res.status(500).json({ success: false, message: 'خطأ داخلي في الخادم' });
    }
};

// تطبيق middleware على جميع Routes
router.use(authMiddleware);

// Routes
router.get('/departments', statsController.getAllDepartments);
router.get('/departments/:id', statsController.getDepartmentById);
router.get('/departments-stats', statsController.getDepartmentsStats);
router.get('/overall-stats', statsController.getOverallStats);
router.get('/departments/:id/employees', statsController.getEmployeesByDepartment);
router.get('/departments/:id/tasks-stats', statsController.getDepartmentTasksStats);
router.get('/top-employees', statsController.getTopEmployees);
router.get('/employees/:id', statsController.getEmployeeDetails);
router.get('/tasks-chart', statsController.getTasksChartData);

module.exports = router;