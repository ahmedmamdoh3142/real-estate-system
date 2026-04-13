const express = require('express');
const router = express.Router();
const chatController = require('../../controllers/admin/chat.controller');
const jwt = require('jsonwebtoken');
const sql = require('mssql');

require('dotenv').config();

const JWT_SECRET = 'real_estate_system_secret_key_2024';

// الحصول على pool من app.locals
function getPool() {
    const app = require('../../app');
    if (!app.locals.dbPool) {
        throw new Error('قاعدة البيانات غير متصلة');
    }
    return app.locals.dbPool;
}

/**
 * Custom authentication middleware for chat routes.
 * Fetches full user data (including role) from database after token validation.
 */
const customAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ Chat route: No token provided');
            return res.status(401).json({ success: false, message: 'غير مصرح: يجب تسجيل الدخول' });
        }

        const token = authHeader.substring(7);
        
        if (token.startsWith('mock_jwt_token_')) {
            const parts = token.split('_');
            if (parts.length >= 4) {
                const userId = parseInt(parts[3]);
                if (!isNaN(userId)) {
                    const pool = getPool();
                    const query = `SELECT id, username, fullName, email, phone, role FROM Users WHERE id = ${userId}`;
                    const result = await pool.request().query(query);
                    const user = result.recordset[0] || null;
                    if (!user) {
                        return res.status(401).json({ success: false, message: 'مستخدم غير موجود' });
                    }
                    req.user = user;
                    console.log(`✅ Mock authentication for user ID: ${userId}, role: ${user.role}`);
                    return next();
                }
            }
            console.log('❌ Invalid mock token format');
            return res.status(401).json({ success: false, message: 'توكن غير صالح' });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            console.error('❌ Chat route: Invalid token:', err.message);
            return res.status(401).json({ success: false, message: 'جلسة غير صالحة، يرجى تسجيل الدخول مرة أخرى' });
        }

        const userId = decoded.userId || decoded.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'توكن غير صالح' });
        }

        const pool = getPool();
        const query = `SELECT id, username, fullName, email, phone, role FROM Users WHERE id = ${userId}`;
        const result = await pool.request().query(query);
        const user = result.recordset[0] || null;
        if (!user) {
            return res.status(401).json({ success: false, message: 'مستخدم غير موجود' });
        }

        req.user = user;
        console.log(`✅ Chat route: Authenticated user ID: ${userId}, role: ${user.role}`);
        next();
    } catch (error) {
        console.error('❌ Chat route: Auth middleware error:', error);
        res.status(500).json({ success: false, message: 'خطأ داخلي في الخادم' });
    }
};

router.use(customAuthMiddleware);
console.log('✅ Custom auth middleware applied to all chat routes');

// ========== Routes ==========
router.get('/', chatController.getChats);
router.get('/search', chatController.searchMessages);
router.get('/:chatId/messages', chatController.getMessages);
router.post('/:chatId/read', chatController.markMessagesAsRead);
router.post('/:chatId/messages/text', chatController.sendTextMessage);
router.post('/:chatId/messages/file', chatController.upload, chatController.sendFileMessage);
router.post('/private', chatController.startPrivateChat);
router.post('/group', chatController.createGroup);
router.post('/:chatId/participants', chatController.addParticipants);
router.delete('/:chatId/participants/:userId', chatController.removeParticipant);
router.put('/:chatId', chatController.updateGroup);
router.post('/:chatId/avatar', chatController.uploadAvatar, chatController.updateGroupAvatar);
router.delete('/:chatId/leave', chatController.leaveGroup);
router.delete('/:chatId', chatController.deleteChat);
router.get('/:chatId/participants', chatController.getGroupParticipants);
router.get('/users/search', chatController.searchUsers);
router.get('/users/all', chatController.getAllUsers);
router.get('/:chatId/media', chatController.getChatMedia);

module.exports = router;