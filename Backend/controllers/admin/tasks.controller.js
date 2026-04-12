const tasksService = require('/services/admin/tasks.service');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '/uploads/tasks');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'task-att-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

function safeParseInt(value, defaultValue = 1) {
    const num = parseInt(value);
    return isNaN(num) ? defaultValue : num;
}

function handleError(res, error, defaultMessage = 'حدث خطأ داخلي في الخادم') {
    console.error('❌ Controller Error Details:', error);
    let message = defaultMessage;
    if (error && typeof error === 'object') {
        message = error.message || defaultMessage;
    } else if (typeof error === 'string') {
        message = error;
    }
    if (process.env.NODE_ENV !== 'production') {
        res.status(500).json({ success: false, message, stack: error.stack || null });
    } else {
        res.status(500).json({ success: false, message });
    }
}

exports.getInbox = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = safeParseInt(req.query.page, 1);
        const limit = safeParseInt(req.query.limit, 25);
        const result = await tasksService.getUserTasks(userId, 'inbox', page, limit);
        res.json({ success: true, data: result.tasks, pagination: result.pagination });
    } catch (error) {
        handleError(res, error);
    }
};

exports.getSent = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = safeParseInt(req.query.page, 1);
        const limit = safeParseInt(req.query.limit, 25);
        const result = await tasksService.getUserTasks(userId, 'sent', page, limit);
        res.json({ success: true, data: result.tasks, pagination: result.pagination });
    } catch (error) {
        handleError(res, error);
    }
};

exports.getSubtasks = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = safeParseInt(req.query.page, 1);
        const limit = safeParseInt(req.query.limit, 25);
        const result = await tasksService.getUserTasks(userId, 'subtasks', page, limit);
        res.json({ success: true, data: result.tasks, pagination: result.pagination });
    } catch (error) {
        handleError(res, error);
    }
};

exports.getArchived = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = safeParseInt(req.query.page, 1);
        const limit = safeParseInt(req.query.limit, 25);
        const result = await tasksService.getUserTasks(userId, 'archived', page, limit);
        res.json({ success: true, data: result.tasks, pagination: result.pagination });
    } catch (error) {
        handleError(res, error);
    }
};

exports.getTaskById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const task = await tasksService.getTaskById(parseInt(id), userId);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
        res.json({ success: true, data: task });
    } catch (error) {
        handleError(res, error);
    }
};

exports.createTask = async (req, res) => {
    try {
        const userId = req.user.id;
        let taskData = req.body;
        if (taskData.assignees && typeof taskData.assignees === 'string') taskData.assignees = JSON.parse(taskData.assignees);
        if (taskData.dependencies && typeof taskData.dependencies === 'string') taskData.dependencies = JSON.parse(taskData.dependencies);
        const result = await tasksService.createTask(taskData, userId);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error);
    }
};

exports.updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        let updateData = req.body;
        if (updateData.assignees && typeof updateData.assignees === 'string') updateData.assignees = JSON.parse(updateData.assignees);
        const result = await tasksService.updateTask(parseInt(id), updateData, userId);
        res.json({ success: true, message: 'Task updated', data: result });
    } catch (error) {
        handleError(res, error);
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        await tasksService.deleteTask(parseInt(id), userId);
        res.json({ success: true, message: 'Task permanently deleted' });
    } catch (error) {
        handleError(res, error);
    }
};

exports.archiveTask = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        await tasksService.archiveTask(parseInt(id), userId);
        res.json({ success: true, message: 'Task archived' });
    } catch (error) {
        handleError(res, error);
    }
};

exports.restoreTask = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        await tasksService.restoreTask(parseInt(id), userId);
        res.json({ success: true, message: 'Task restored' });
    } catch (error) {
        handleError(res, error);
    }
};

exports.updateProgress = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { progress, note } = req.body;
        if (progress === undefined) return res.status(400).json({ success: false, message: 'Progress value required' });
        const result = await tasksService.updateProgress(parseInt(id), progress, note || '', userId);
        res.json({ success: true, message: `Progress updated to ${progress}%`, data: result });
    } catch (error) {
        handleError(res, error);
    }
};

exports.addComment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { comment } = req.body;
        if (!comment) return res.status(400).json({ success: false, message: 'Comment required' });
        const result = await tasksService.addComment(parseInt(id), comment, userId);
        res.json({ success: true, message: 'Comment added', data: result });
    } catch (error) {
        handleError(res, error);
    }
};

exports.upload = upload.array('attachments', 10);
exports.addAttachment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'No files uploaded' });
        }
        const attachments = req.files.map(file => ({
            fileName: file.originalname,
            fileUrl: `/uploads/tasks/${file.filename}`,
            fileSize: file.size,
            mimeType: file.mimetype
        }));
        for (const att of attachments) {
            await tasksService.addAttachment(parseInt(id), att, userId);
        }
        res.json({ success: true, message: `${attachments.length} attachment(s) added` });
    } catch (error) {
        if (req.files) {
            req.files.forEach(file => {
                try { fs.unlinkSync(file.path); } catch(e) {}
            });
        }
        handleError(res, error);
    }
};

exports.getStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const stats = await tasksService.getTaskStats(userId);
        res.json({ success: true, data: stats });
    } catch (error) {
        handleError(res, error);
    }
};

exports.getTeamWorkload = async (req, res) => {
    try {
        const userId = req.user.id;
        const workload = await tasksService.getTeamWorkload(userId);
        res.json({ success: true, data: workload });
    } catch (error) {
        handleError(res, error);
    }
};

exports.searchTasks = async (req, res) => {
    try {
        const userId = req.user.id;
        const { q, page = 1, limit = 25 } = req.query;
        if (!q) return res.json({ success: true, data: [], pagination: { totalItems: 0 } });
        const pageNum = safeParseInt(page, 1);
        const limitNum = safeParseInt(limit, 25);
        const result = await tasksService.searchTasks(userId, q, pageNum, limitNum);
        res.json({ success: true, data: result.tasks, pagination: result.pagination });
    } catch (error) {
        handleError(res, error);
    }
};

exports.getWeeklyPerformance = async (req, res) => {
    try {
        const userId = req.user.id;
        const data = await tasksService.getWeeklyPerformance(userId);
        res.json({ success: true, data });
    } catch (error) {
        handleError(res, error);
    }
};

exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = safeParseInt(req.query.limit, 50);
        const offset = safeParseInt(req.query.offset, 0);
        const result = await tasksService.getNotifications(userId, limit, offset);
        res.json({ success: true, data: result.notifications, total: result.total });
    } catch (error) {
        handleError(res, error);
    }
};

exports.markNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const result = await tasksService.markNotificationAsRead(parseInt(id), userId);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error);
    }
};

exports.markAllNotificationsAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await tasksService.markAllNotificationsAsRead(userId);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error);
    }
};

exports.rateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { qualityScore, difficultyWeight, notes } = req.body;
        if (!qualityScore || !difficultyWeight) {
            return res.status(400).json({ success: false, message: 'Quality score and difficulty weight are required' });
        }
        const result = await tasksService.rateTask(parseInt(id), { qualityScore, difficultyWeight, notes }, userId);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error);
    }
};

exports.getRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const { folder = 'all', page = 1, limit = 25 } = req.query;
        const pageNum = safeParseInt(page, 1);
        const limitNum = safeParseInt(limit, 25);
        const result = await tasksService.getRequests(userId, folder, pageNum, limitNum);
        res.json({ success: true, data: result.requests, pagination: result.pagination });
    } catch (error) {
        handleError(res, error);
    }
};

exports.createRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const data = req.body;
        if (!data.title) {
            return res.status(400).json({ success: false, message: 'عنوان الطلب مطلوب' });
        }
        const result = await tasksService.createRequest(data, userId);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error);
    }
};

exports.updateRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const data = req.body;
        const result = await tasksService.updateRequest(parseInt(id), data, userId);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error);
    }
};

exports.deleteRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        await tasksService.deleteRequest(parseInt(id), userId);
        res.json({ success: true, message: 'Request deleted' });
    } catch (error) {
        handleError(res, error);
    }
};

exports.getPurchaseRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const { folder = 'all', page = 1, limit = 25 } = req.query;
        const pageNum = safeParseInt(page, 1);
        const limitNum = safeParseInt(limit, 25);
        const result = await tasksService.getPurchaseRequests(userId, folder, pageNum, limitNum);
        res.json({ success: true, data: result.purchases, pagination: result.pagination });
    } catch (error) {
        handleError(res, error);
    }
};

exports.createPurchaseRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const data = req.body;
        if (!data.item) {
            return res.status(400).json({ success: false, message: 'اسم العنصر مطلوب' });
        }
        const result = await tasksService.createPurchaseRequest(data, userId);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error);
    }
};

exports.updatePurchaseRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const data = req.body;
        const result = await tasksService.updatePurchaseRequest(parseInt(id), data, userId);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error);
    }
};

exports.deletePurchaseRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        await tasksService.deletePurchaseRequest(parseInt(id), userId);
        res.json({ success: true, message: 'Purchase request deleted' });
    } catch (error) {
        handleError(res, error);
    }
};

exports.getAppointments = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 25, startDate, endDate } = req.query;
        const pageNum = safeParseInt(page, 1);
        const limitNum = safeParseInt(limit, 25);
        const result = await tasksService.getAppointments(userId, pageNum, limitNum, startDate, endDate);
        res.json({ success: true, data: result.appointments, pagination: result.pagination });
    } catch (error) {
        handleError(res, error);
    }
};

exports.createAppointment = async (req, res) => {
    try {
        const userId = req.user.id;
        let data = req.body;
        if (data.attendees && typeof data.attendees === 'string') data.attendees = JSON.parse(data.attendees);
        if (!data.title || !data.appointmentDate || !data.appointmentTime) {
            return res.status(400).json({ success: false, message: 'العنوان والتاريخ والوقت مطلوبة' });
        }
        const result = await tasksService.createAppointment(data, userId);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error);
    }
};

exports.updateAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        let data = req.body;
        if (data.attendees && typeof data.attendees === 'string') data.attendees = JSON.parse(data.attendees);
        const result = await tasksService.updateAppointment(parseInt(id), data, userId);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error);
    }
};

exports.deleteAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        await tasksService.deleteAppointment(parseInt(id), userId);
        res.json({ success: true, message: 'Appointment deleted' });
    } catch (error) {
        handleError(res, error);
    }
};

exports.getPenalties = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 25 } = req.query;
        const pageNum = safeParseInt(page, 1);
        const limitNum = safeParseInt(limit, 25);
        const result = await tasksService.getPenalties(userId, pageNum, limitNum);
        res.json({ success: true, data: result.penalties, pagination: result.pagination });
    } catch (error) {
        handleError(res, error);
    }
};

exports.removePenalty = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        await tasksService.removePenalty(parseInt(id), userId);
        res.json({ success: true, message: 'Penalty removed' });
    } catch (error) {
        handleError(res, error);
    }
};

exports.generatePenalties = async (req, res) => {
    try {
        const result = await tasksService.generatePenaltiesForOverdueTasks();
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error);
    }
};

exports.getManualPenalties = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 25 } = req.query;
        const pageNum = safeParseInt(page, 1);
        const limitNum = safeParseInt(limit, 25);
        const result = await tasksService.getManualPenalties(userId, pageNum, limitNum);
        res.json({ success: true, data: result.penalties, pagination: result.pagination });
    } catch (error) {
        handleError(res, error);
    }
};

exports.createManualPenalty = async (req, res) => {
    try {
        const userId = req.user.id;
        const { userId: targetUserId, percentage, reason } = req.body;
        if (!targetUserId || percentage === undefined || !reason) {
            return res.status(400).json({ success: false, message: 'الموظف ونسبة الخصم والسبب مطلوبة' });
        }
        if (percentage < 0 || percentage > 100) {
            return res.status(400).json({ success: false, message: 'نسبة الخصم يجب أن تكون بين 0 و 100' });
        }
        const result = await tasksService.createManualPenalty({ userId: targetUserId, percentage, reason }, userId);
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error);
    }
};

exports.deleteManualPenalty = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        await tasksService.deleteManualPenalty(parseInt(id), userId);
        res.json({ success: true, message: 'Manual penalty deleted' });
    } catch (error) {
        handleError(res, error);
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await tasksService.getAllUsers();
        res.json({ success: true, data: users });
    } catch (error) {
        handleError(res, error);
    }
};

exports.checkReminders = async (req, res) => {
    try {
        const result = await tasksService.checkAndSendReminders();
        res.json({ success: true, data: result });
    } catch (error) {
        handleError(res, error);
    }
};

exports.getUserPermissions = async (req, res) => {
    try {
        const userId = req.user.id;
        const permissions = await tasksService.getUserPermissions(userId);
        res.json({ success: true, data: permissions });
    } catch (error) {
        handleError(res, error);
    }
};