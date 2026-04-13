const express = require('express');
const router = express.Router();
const emailController = require('../../controllers/admin/email.controller');
const jwt = require('jsonwebtoken');

console.log('📧 Loading email.routes...');

// نفس السر المستخدم في auth.service.js
const JWT_SECRET = 'real_estate_system_secret_key_2024';

/**
 * Custom authentication middleware for email routes.
 * Supports both real JWT tokens and mock tokens for development.
 */
const customAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ Email route: No token provided');
            return res.status(401).json({ success: false, message: 'غير مصرح: يجب تسجيل الدخول' });
        }

        const token = authHeader.substring(7);
        
        // التحقق من التوكن الوهمي (mock)
        if (token.startsWith('mock_jwt_token_')) {
            console.log('🔧 Mock token detected');
            const parts = token.split('_');
            if (parts.length >= 4) {
                const userId = parseInt(parts[3]); // التنسيق: mock_jwt_token_{userId}_{timestamp}
                if (!isNaN(userId)) {
                    console.log(`✅ Mock authentication for user ID: ${userId}`);
                    req.user = { id: userId };
                    return next();
                }
            }
            console.log('❌ Invalid mock token format');
            return res.status(401).json({ success: false, message: 'توكن غير صالح' });
        }

        // معالجة التوكن الحقيقي
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            console.error('❌ Email route: Invalid token:', err.message);
            return res.status(401).json({ success: false, message: 'جلسة غير صالحة، يرجى تسجيل الدخول مرة أخرى' });
        }

        const userId = decoded.userId || decoded.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'توكن غير صالح' });
        }

        req.user = { id: userId };
        console.log(`✅ Email route: Authenticated user ID: ${userId}`);
        next();
    } catch (error) {
        console.error('❌ Email route: Auth middleware error:', error);
        res.status(500).json({ success: false, message: 'خطأ داخلي في الخادم' });
    }
};

// Apply the custom middleware to all email routes
router.use(customAuthMiddleware);
console.log('✅ Custom auth middleware applied to all email routes');

// Define routes
router.get('/inbox', emailController.getInbox);
router.get('/sent', emailController.getSent);
router.get('/drafts', emailController.getDrafts);
router.get('/trash', emailController.getTrash);
router.get('/stats', emailController.getStats);
router.get('/users/search', emailController.searchUsers);
router.get('/:id', emailController.getEmail);
router.post('/send', emailController.upload, emailController.sendEmail);
router.put('/draft/:id', emailController.updateDraft);
router.delete('/:id', emailController.deleteEmail);
router.post('/:id/restore', emailController.restoreEmail);
router.delete('/:id/permanent', emailController.permanentDelete);

module.exports = router;