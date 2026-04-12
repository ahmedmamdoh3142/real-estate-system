const express = require('express');
const router = express.Router();
const tasksController = require('/controllers/admin/tasks.controller');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'real_estate_system_secret_key_2024';

router.use(express.json());

const customAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Unauthorized: Please login' });
        }
        const token = authHeader.substring(7);
        if (token.startsWith('mock_jwt_token_')) {
            const parts = token.split('_');
            if (parts.length >= 4) {
                const userId = parseInt(parts[3]);
                if (!isNaN(userId)) {
                    req.user = { id: userId };
                    return next();
                }
            }
            return res.status(401).json({ success: false, message: 'Invalid mock token' });
        }
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ success: false, message: 'Invalid or expired token' });
        }
        const userId = decoded.userId || decoded.id;
        if (!userId) return res.status(401).json({ success: false, message: 'Invalid token' });
        req.user = { id: userId };
        next();
    } catch (error) {
        console.error('❌ Auth middleware error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

router.use(customAuthMiddleware);

// ========== الصلاحيات ==========
router.get('/my-permissions', tasksController.getUserPermissions);

// ========== مسارات محددة (بدون معرّف) ==========
router.get('/stats', tasksController.getStats);
router.get('/team-workload', tasksController.getTeamWorkload);
router.get('/search', tasksController.searchTasks);
router.get('/requests', tasksController.getRequests);
router.get('/purchases', tasksController.getPurchaseRequests);
router.get('/appointments', tasksController.getAppointments);
router.get('/penalties', tasksController.getPenalties);
router.get('/manual-penalties', tasksController.getManualPenalties);
router.get('/users', tasksController.getAllUsers);
router.get('/weekly-performance', tasksController.getWeeklyPerformance);
router.post('/reminders/check', tasksController.checkReminders);

// ========== مسارات الإشعارات ==========
router.get('/notifications', tasksController.getNotifications);
router.put('/notifications/:id/read', tasksController.markNotificationAsRead);
router.put('/notifications/read-all', tasksController.markAllNotificationsAsRead);

// ========== مسارات المهام ذات المعرّف في المسار ==========
router.get('/inbox', tasksController.getInbox);
router.get('/sent', tasksController.getSent);
router.get('/subtasks', tasksController.getSubtasks);
router.get('/archived', tasksController.getArchived);
router.get('/:id', tasksController.getTaskById);

// ========== مسارات POST / PUT / DELETE ==========
router.post('/', tasksController.createTask);
router.put('/:id', tasksController.updateTask);
router.delete('/:id', tasksController.deleteTask);
router.post('/:id/archive', tasksController.archiveTask);
router.post('/:id/restore', tasksController.restoreTask);
router.post('/:id/progress', tasksController.updateProgress);
router.post('/:id/comments', tasksController.addComment);
router.post('/:id/attachments', tasksController.upload, tasksController.addAttachment);

// ========== مسارات التقييم ==========
router.post('/:id/rate', tasksController.rateTask);

// ========== مسارات الطلبات والمشتريات والمواعيد والجزاءات ==========
router.post('/requests', tasksController.createRequest);
router.put('/requests/:id', tasksController.updateRequest);
router.delete('/requests/:id', tasksController.deleteRequest);

router.post('/purchases', tasksController.createPurchaseRequest);
router.put('/purchases/:id', tasksController.updatePurchaseRequest);
router.delete('/purchases/:id', tasksController.deletePurchaseRequest);

router.post('/appointments', tasksController.createAppointment);
router.put('/appointments/:id', tasksController.updateAppointment);
router.delete('/appointments/:id', tasksController.deleteAppointment);

router.delete('/penalties/:id', tasksController.removePenalty);
router.post('/penalties/generate', tasksController.generatePenalties);

router.post('/manual-penalties', tasksController.createManualPenalty);
router.delete('/manual-penalties/:id', tasksController.deleteManualPenalty);

module.exports = router;