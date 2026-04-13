// Backend/controllers/admin/auth.controller.js
const authService = require('../../services/admin/auth.service');

/**
 * @desc    تسجيل دخول المستخدم
 * @route   POST /api/admin/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
    try {
        console.log('🔐 معالجة طلب تسجيل دخول...');
        
        const { username, password, rememberMe } = req.body;
        
        // التحقق من البيانات
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'اسم المستخدم وكلمة المرور مطلوبان'
            });
        }
        
        // استدعاء خدمة المصادقة
        const result = await authService.loginUser(username, password, rememberMe);
        
        if (!result.success) {
            return res.status(result.statusCode || 401).json({
                success: false,
                message: result.message
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'تم تسجيل الدخول بنجاح',
            data: result.data
        });
        
    } catch (error) {
        console.error('❌ خطأ في login controller:', error);
        
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

/**
 * @desc    الحصول على بيانات المستخدم الحالي
 * @route   GET /api/admin/auth/me
 * @access  Private
 */
exports.getCurrentUser = async (req, res) => {
    try {
        console.log('👤 معالجة طلب بيانات المستخدم...');
        
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'غير مصرح بالوصول'
            });
        }
        
        const result = await authService.getCurrentUser(token);
        
        if (!result.success) {
            return res.status(result.statusCode || 401).json({
                success: false,
                message: result.message
            });
        }
        
        res.status(200).json({
            success: true,
            data: result.data
        });
        
    } catch (error) {
        console.error('❌ خطأ في getCurrentUser controller:', error);
        
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

/**
 * @desc    تحديث الملف الشخصي
 * @route   PUT /api/admin/auth/profile
 * @access  Private
 */
exports.updateProfile = async (req, res) => {
    try {
        console.log('🔄 معالجة طلب تحديث الملف الشخصي...');
        
        const token = req.headers.authorization?.split(' ')[1];
        const { fullName, email, phone } = req.body;
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'غير مصرح بالوصول'
            });
        }
        
        if (!fullName || !email) {
            return res.status(400).json({
                success: false,
                message: 'الاسم الكامل والبريد الإلكتروني مطلوبان'
            });
        }
        
        const result = await authService.updateProfile(token, { fullName, email, phone });
        
        if (!result.success) {
            return res.status(result.statusCode || 400).json({
                success: false,
                message: result.message
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'تم تحديث البيانات بنجاح'
        });
        
    } catch (error) {
        console.error('❌ خطأ في updateProfile controller:', error);
        
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

/**
 * @desc    تغيير كلمة المرور
 * @route   PUT /api/admin/auth/change-password
 * @access  Private
 */
exports.changePassword = async (req, res) => {
    try {
        console.log('🔑 معالجة طلب تغيير كلمة المرور...');
        
        const token = req.headers.authorization?.split(' ')[1];
        const { currentPassword, newPassword, confirmPassword } = req.body;
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'غير مصرح بالوصول'
            });
        }
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'جميع الحقول مطلوبة'
            });
        }
        
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'كلمة المرور الجديدة غير متطابقة'
            });
        }
        
        const result = await authService.changePassword(token, {
            currentPassword,
            newPassword
        });
        
        if (!result.success) {
            return res.status(result.statusCode || 400).json({
                success: false,
                message: result.message
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'تم تغيير كلمة المرور بنجاح'
        });
        
    } catch (error) {
        console.error('❌ خطأ في changePassword controller:', error);
        
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

/**
 * @desc    تسجيل الخروج
 * @route   POST /api/admin/auth/logout
 * @access  Private
 */
exports.logout = async (req, res) => {
    try {
        console.log('🚪 معالجة طلب تسجيل خروج...');
        
        const token = req.headers.authorization?.split(' ')[1];
        
        if (token) {
            await authService.logoutUser(token);
        }
        
        res.status(200).json({
            success: true,
            message: 'تم تسجيل الخروج بنجاح'
        });
        
    } catch (error) {
        console.error('❌ خطأ في logout controller:', error);
        
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

/**
 * @desc    الحصول على إحصائيات لوحة التحكم
 * @route   GET /api/admin/auth/dashboard-stats
 * @access  Private
 */
exports.getDashboardStats = async (req, res) => {
    try {
        console.log('📊 معالجة طلب إحصائيات اللوحة...');
        
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'غير مصرح بالوصول'
            });
        }
        
        const result = await authService.getDashboardStats(token);
        
        if (!result.success) {
            return res.status(result.statusCode || 401).json({
                success: false,
                message: result.message
            });
        }
        
        res.status(200).json({
            success: true,
            data: result.data
        });
        
    } catch (error) {
        console.error('❌ خطأ في getDashboardStats controller:', error);
        
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

/**
 * @desc    الحصول على آخر الأنشطة
 * @route   GET /api/admin/auth/recent-activities
 * @access  Private
 */
exports.getRecentActivities = async (req, res) => {
    try {
        console.log('📄 معالجة طلب الأنشطة الأخيرة...');
        
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'غير مصرح بالوصول'
            });
        }
        
        const result = await authService.getRecentActivities(token);
        
        if (!result.success) {
            return res.status(result.statusCode || 401).json({
                success: false,
                message: result.message
            });
        }
        
        res.status(200).json({
            success: true,
            data: result.data
        });
        
    } catch (error) {
        console.error('❌ خطأ في getRecentActivities controller:', error);
        
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};