const fs = require('fs');
const path = require('path');
const sql = require('mssql');

require('dotenv').config();

// الحصول على pool من app.locals (تم تعيينه في server.js)
function getPool() {
    const app = require('/app');
    if (!app.locals.dbPool) {
        throw new Error('قاعدة البيانات غير متصلة');
    }
    return app.locals.dbPool;
}

class TasksService {
    constructor() {
        this.uploadDir = path.join(__dirname, '/uploads/tasks');
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    formatDateForSQL(dateInput) {
        if (!dateInput) return null;
        let date;
        if (dateInput instanceof Date) {
            date = dateInput;
        } else {
            date = new Date(dateInput);
            if (isNaN(date.getTime())) return null;
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    // دالة لتنفيذ استعلامات مع باراميترات (علامات استفهام)
    async parameterizedQuery(query, params = []) {
        const pool = getPool();
        const request = pool.request();
        // إضافة الباراميترات بالترتيب (p1, p2, ...)
        params.forEach((param, index) => {
            const paramName = `p${index + 1}`;
            if (param === null || param === undefined) {
                request.input(paramName, sql.NVarChar, null);
            } else if (typeof param === 'number') {
                request.input(paramName, sql.Int, param);
            } else if (typeof param === 'string') {
                request.input(paramName, sql.NVarChar, param);
            } else if (param instanceof Date) {
                request.input(paramName, sql.DateTime, param);
            } else {
                request.input(paramName, sql.NVarChar, String(param));
            }
        });
        // استبدال علامات الاستفهام بأسماء الباراميترات
        let namedQuery = query;
        for (let i = 0; i < params.length; i++) {
            namedQuery = namedQuery.replace('?', `@p${i+1}`);
        }
        const result = await request.query(namedQuery);
        return result.recordset || [];
    }

    async queryAsync(sqlQuery, params = []) {
        try {
            if (params && params.length > 0) {
                return await this.parameterizedQuery(sqlQuery, params);
            } else {
                const pool = getPool();
                const result = await pool.request().query(sqlQuery);
                return result.recordset || [];
            }
        } catch (err) {
            console.error('❌ SQL Error:', err.message);
            console.error('Query:', sqlQuery);
            console.error('Params:', params);
            throw err;
        }
    }

    async executeAsync(sqlQuery, params = []) {
        try {
            if (params && params.length > 0) {
                await this.parameterizedQuery(sqlQuery, params);
                return { rowsAffected: 1 }; // تقليد النتيجة
            } else {
                const pool = getPool();
                const result = await pool.request().query(sqlQuery);
                return result;
            }
        } catch (err) {
            console.error('❌ SQL Execute Error:', err.message);
            console.error('Query:', sqlQuery);
            console.error('Params:', params);
            throw err;
        }
    }

    async getScalar(query, params = []) {
        const rows = await this.queryAsync(query, params);
        return rows[0] ? rows[0][Object.keys(rows[0])[0]] : null;
    }

    _toSafeInt(value, defaultValue = null, required = false) {
        if (value === undefined || value === null) {
            if (required) throw new Error('Value is required and cannot be null');
            return defaultValue;
        }
        const num = Number(value);
        if (!isNaN(num) && Number.isInteger(num) && num > 0) return num;
        if (required) throw new Error(`Invalid integer value: ${value}`);
        return defaultValue;
    }

    async userExists(userId) {
        if (!userId) return false;
        try {
            let query = `SELECT 1 FROM Users WHERE id = ? AND isActive = 1`;
            let result = await this.queryAsync(query, [userId]);
            if (result.length > 0) return true;
            query = `SELECT 1 FROM Users WHERE id = ?`;
            result = await this.queryAsync(query, [userId]);
            return result.length > 0;
        } catch (error) {
            console.error(`userExists error for userId ${userId}:`, error);
            return false;
        }
    }

    async _isGeneralManager(userId) {
        try {
            const result = await this.queryAsync(`SELECT role FROM Users WHERE id = ?`, [userId]);
            if (result.length && result[0].role === 'مشرف_عام') return true;
            return false;
        } catch (error) {
            return false;
        }
    }

    // ======================= الإشعارات =======================
    async _createNotification(userId, eventType, title, message, entityType, entityId, metadata = null) {
        if (!userId) return;
        try {
            const metadataJson = metadata ? JSON.stringify(metadata) : null;
            await this.executeAsync(`
                INSERT INTO UserNotifications (userId, eventType, title, message, entityType, entityId, metadata, createdAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, GETDATE())
            `, [userId, eventType, title, message, entityType, entityId, metadataJson]);
        } catch (err) {
            console.error('Failed to create notification:', err);
        }
    }

    async getNotifications(userId, limit = 50, offset = 0) {
        userId = this._toSafeInt(userId, null, true);
        const query = `
            SELECT id, eventType, title, message, entityType, entityId, isRead, createdAt, metadata
            FROM UserNotifications
            WHERE userId = ?
            ORDER BY createdAt DESC
            OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
        `;
        const countQuery = `SELECT COUNT(*) AS total FROM UserNotifications WHERE userId = ?`;
        const notifications = await this.queryAsync(query, [userId, offset, limit]);
        const total = await this.getScalar(countQuery, [userId]);
        return { notifications, total };
    }

    async markNotificationAsRead(notificationId, userId) {
        userId = this._toSafeInt(userId, null, true);
        const result = await this.executeAsync(`
            UPDATE UserNotifications SET isRead = 1
            WHERE id = ? AND userId = ?
        `, [notificationId, userId]);
        return { success: true };
    }

    async markAllNotificationsAsRead(userId) {
        userId = this._toSafeInt(userId, null, true);
        await this.executeAsync(`
            UPDATE UserNotifications SET isRead = 1
            WHERE userId = ? AND isRead = 0
        `, [userId]);
        return { success: true };
    }

    // ======================= الصلاحيات =======================
    async getUserPermissions(userId) {
        userId = this._toSafeInt(userId, null, true);
        const query = `
            SELECT p.name
            FROM Permissions p
            INNER JOIN UserPermissions up ON p.id = up.permissionId
            WHERE up.userId = ?
        `;
        let rows = await this.queryAsync(query, [userId]);
        let permissions = rows.map(row => row.name);
        
        // إضافة صلاحية الجزاءات للمشرف العام تلقائياً
        const isGM = await this._isGeneralManager(userId);
        if (isGM && !permissions.includes('penalties')) {
            permissions.push('penalties');
        }
        return permissions;
    }

    // ================================ TASKS ================================
    async getUserTasks(userId, folder = 'inbox', page = 1, limit = 25) {
        userId = this._toSafeInt(userId, null, true);
        page = this._toSafeInt(page, 1);
        limit = this._toSafeInt(limit, 25);
        const offset = (page - 1) * limit;

        let query = '', countQuery = '', params = [], countParams = [];

        switch (folder) {
            case 'inbox':
                query = `
                    SELECT 
                        t.id, t.title, t.description, t.priority, t.status, t.progress, t.dueDate, t.completedAt,
                        t.projectId, t.senderId, t.parentTaskId, t.createdAt, t.updatedAt,
                        t.isOverdue, t.daysOverdue, t.escalated, t.escalationLevel,
                        t.recurringPattern, t.reminderDateTime, t.reminderSent,
                        u.fullName AS senderName,
                        (SELECT COUNT(*) FROM TaskComments WHERE taskId = t.id) AS commentsCount,
                        (SELECT COUNT(*) FROM TaskAttachments WHERE taskId = t.id) AS attachmentsCount,
                        'received' AS type
                    FROM Tasks t
                    INNER JOIN TaskAssignees ta ON t.id = ta.taskId
                    LEFT JOIN Users u ON t.senderId = u.id
                    WHERE ta.userId = ?
                      AND t.isArchived = 0
                      AND t.status != 'archived'
                    ORDER BY t.createdAt DESC
                    OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
                `;
                params = [userId, offset, limit];
                countQuery = `
                    SELECT COUNT(*) AS total
                    FROM Tasks t
                    INNER JOIN TaskAssignees ta ON t.id = ta.taskId
                    WHERE ta.userId = ?
                      AND t.isArchived = 0
                      AND t.status != 'archived'
                `;
                countParams = [userId];
                break;
            case 'sent':
                query = `
                    SELECT 
                        t.id, t.title, t.description, t.priority, t.status, t.progress, t.dueDate, t.completedAt,
                        t.projectId, t.senderId, t.parentTaskId, t.createdAt, t.updatedAt,
                        t.isOverdue, t.daysOverdue, t.escalated, t.escalationLevel,
                        t.recurringPattern, t.reminderDateTime, t.reminderSent,
                        u.fullName AS senderName,
                        (SELECT COUNT(*) FROM TaskComments WHERE taskId = t.id) AS commentsCount,
                        (SELECT COUNT(*) FROM TaskAttachments WHERE taskId = t.id) AS attachmentsCount,
                        'sent' AS type
                    FROM Tasks t
                    INNER JOIN Users u ON t.senderId = u.id
                    WHERE t.senderId = ?
                      AND t.isArchived = 0
                      AND t.status != 'archived'
                      AND t.parentTaskId IS NULL
                    ORDER BY t.createdAt DESC
                    OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
                `;
                params = [userId, offset, limit];
                countQuery = `
                    SELECT COUNT(*) AS total
                    FROM Tasks t
                    WHERE t.senderId = ?
                      AND t.isArchived = 0
                      AND t.status != 'archived'
                      AND t.parentTaskId IS NULL
                `;
                countParams = [userId];
                break;
            case 'subtasks':
                query = `
                    SELECT 
                        t.id, t.title, t.description, t.priority, t.status, t.progress, t.dueDate, t.completedAt,
                        t.projectId, t.senderId, t.parentTaskId, t.createdAt, t.updatedAt,
                        t.isOverdue, t.daysOverdue, t.escalated, t.escalationLevel,
                        t.recurringPattern, t.reminderDateTime, t.reminderSent,
                        u.fullName AS senderName,
                        (SELECT COUNT(*) FROM TaskComments WHERE taskId = t.id) AS commentsCount,
                        (SELECT COUNT(*) FROM TaskAttachments WHERE taskId = t.id) AS attachmentsCount,
                        'subtask' AS type
                    FROM Tasks t
                    LEFT JOIN Users u ON t.senderId = u.id
                    WHERE t.senderId = ?
                      AND t.parentTaskId IS NOT NULL
                      AND t.isArchived = 0
                      AND t.status != 'archived'
                    ORDER BY t.createdAt DESC
                    OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
                `;
                params = [userId, offset, limit];
                countQuery = `
                    SELECT COUNT(*) AS total
                    FROM Tasks t
                    WHERE t.senderId = ?
                      AND t.parentTaskId IS NOT NULL
                      AND t.isArchived = 0
                      AND t.status != 'archived'
                `;
                countParams = [userId];
                break;
            case 'archived':
                query = `
                    SELECT 
                        t.id, t.title, t.description, t.priority, t.status, t.progress, t.dueDate, t.completedAt,
                        t.projectId, t.senderId, t.parentTaskId, t.createdAt, t.updatedAt,
                        t.isOverdue, t.daysOverdue, t.escalated, t.escalationLevel,
                        t.recurringPattern, t.reminderDateTime, t.reminderSent,
                        u.fullName AS senderName,
                        (SELECT COUNT(*) FROM TaskComments WHERE taskId = t.id) AS commentsCount,
                        (SELECT COUNT(*) FROM TaskAttachments WHERE taskId = t.id) AS attachmentsCount,
                        'archived' AS type
                    FROM Tasks t
                    LEFT JOIN Users u ON t.senderId = u.id
                    WHERE (t.senderId = ? OR EXISTS (SELECT 1 FROM TaskAssignees ta2 WHERE ta2.taskId = t.id AND ta2.userId = ?))
                      AND t.isArchived = 1
                    ORDER BY t.createdAt DESC
                    OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
                `;
                params = [userId, userId, offset, limit];
                countQuery = `
                    SELECT COUNT(*) AS total
                    FROM Tasks t
                    WHERE (t.senderId = ? OR EXISTS (SELECT 1 FROM TaskAssignees ta2 WHERE ta2.taskId = t.id AND ta2.userId = ?))
                      AND t.isArchived = 1
                `;
                countParams = [userId, userId];
                break;
            default:
                throw new Error(`Invalid folder: ${folder}`);
        }

        const tasks = await this.queryAsync(query, params);
        const countResult = await this.queryAsync(countQuery, countParams);
        const totalItems = countResult[0]?.total || 0;
        const totalPages = Math.ceil(totalItems / limit);

        for (let task of tasks) {
            const assigneesQuery = `
                SELECT u.id, u.fullName, u.email, u.role, u.profileImage, u.averageScore
                FROM TaskAssignees ta
                INNER JOIN Users u ON ta.userId = u.id
                WHERE ta.taskId = ?
            `;
            const assignees = await this.queryAsync(assigneesQuery, [task.id]);
            task.assignees = assignees.map(a => a.id);
            task.assigneesFull = assignees.map(a => ({
                id: a.id,
                fullName: a.fullName,
                email: a.email,
                role: a.role,
                avatar: a.profileImage || `https://i.pravatar.cc/150?img=${a.id}`,
                averageScore: a.averageScore || 0
            }));

            const subtasksQuery = `
                SELECT id, title, progress, status, dueDate, completedAt
                FROM Tasks
                WHERE parentTaskId = ?
                ORDER BY createdAt ASC
            `;
            task.subtasks = await this.queryAsync(subtasksQuery, [task.id]);

            const ratingQuery = `SELECT * FROM TaskRatings WHERE taskId = ?`;
            const rating = await this.queryAsync(ratingQuery, [task.id]);
            if (rating.length > 0) task.rating = rating[0];
        }

        return {
            tasks,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems,
                itemsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        };
    }

    async getTaskById(taskId, userId) {
        taskId = this._toSafeInt(taskId, null, true);
        userId = this._toSafeInt(userId, null, true);

        const isGM = await this._isGeneralManager(userId);
        
        let checkQuery, checkParams;
        if (isGM) {
            checkQuery = `SELECT 1 FROM Tasks WHERE id = ?`;
            checkParams = [taskId];
        } else {
            checkQuery = `
                SELECT 1
                FROM Tasks t
                LEFT JOIN TaskAssignees ta ON t.id = ta.taskId
                WHERE t.id = ?
                  AND (t.senderId = ? OR ta.userId = ?)
            `;
            checkParams = [taskId, userId, userId];
        }
        
        const check = await this.queryAsync(checkQuery, checkParams);
        if (check.length === 0) {
            throw new Error('Task not found or you do not have permission');
        }

        const query = `
            SELECT 
                t.id, t.title, t.description, t.priority, t.status, t.progress, t.dueDate, t.completedAt,
                t.projectId, t.senderId, t.parentTaskId, t.createdAt, t.updatedAt,
                t.isOverdue, t.daysOverdue, t.escalated, t.escalationLevel,
                t.recurringPattern, t.reminderDateTime, t.reminderSent,
                u.fullName AS senderName,
                u.profileImage AS senderAvatar,
                p.projectName AS projectName,
                (SELECT COUNT(*) FROM TaskComments WHERE taskId = t.id) AS commentsCount,
                (SELECT COUNT(*) FROM TaskAttachments WHERE taskId = t.id) AS attachmentsCount
            FROM Tasks t
            INNER JOIN Users u ON t.senderId = u.id
            LEFT JOIN Projects p ON t.projectId = p.id
            WHERE t.id = ?
        `;
        const tasks = await this.queryAsync(query, [taskId]);
        if (tasks.length === 0) return null;
        const task = tasks[0];

        const assigneesQuery = `
            SELECT u.id, u.fullName, u.email, u.role, u.profileImage, u.averageScore
            FROM TaskAssignees ta
            INNER JOIN Users u ON ta.userId = u.id
            WHERE ta.taskId = ?
        `;
        const assignees = await this.queryAsync(assigneesQuery, [taskId]);
        task.assignees = assignees.map(a => a.id);
        task.assigneesFull = assignees.map(a => ({
            id: a.id,
            fullName: a.fullName,
            email: a.email,
            role: a.role,
            avatar: a.profileImage || `https://i.pravatar.cc/150?img=${a.id}`,
            averageScore: a.averageScore || 0
        }));

        const commentsQuery = `
            SELECT tc.id, tc.comment, tc.createdAt, u.fullName, u.role, u.profileImage
            FROM TaskComments tc
            INNER JOIN Users u ON tc.userId = u.id
            WHERE tc.taskId = ?
            ORDER BY tc.createdAt ASC
        `;
        task.comments = await this.queryAsync(commentsQuery, [taskId]);

        const attachmentsQuery = `
            SELECT id, fileName, fileUrl, fileSize, mimeType, uploadedAt
            FROM TaskAttachments
            WHERE taskId = ?
        `;
        task.attachments = await this.queryAsync(attachmentsQuery, [taskId]);

        const subtasksQuery = `
            SELECT 
                id, title, priority, status, progress, dueDate, createdAt, completedAt
            FROM Tasks
            WHERE parentTaskId = ?
            ORDER BY createdAt DESC
        `;
        task.subtasks = await this.queryAsync(subtasksQuery, [taskId]);

        const escalationQuery = `
            SELECT level, escalatedTo, escalatedAt
            FROM TaskEscalations
            WHERE taskId = ?
            ORDER BY escalatedAt ASC
        `;
        task.escalationHistory = await this.queryAsync(escalationQuery, [taskId]);

        const ratingQuery = `SELECT * FROM TaskRatings WHERE taskId = ?`;
        const rating = await this.queryAsync(ratingQuery, [taskId]);
        if (rating.length > 0) task.rating = rating[0];

        return task;
    }

    async createTask(data, userId) {
        const {
            title,
            description = '',
            priority = 'medium',
            status = 'todo',
            progress = 0,
            dueDate = null,
            projectId = null,
            parentTaskId = null,
            assignees = [],
            recurringPattern = null,
            dependencies = [],
            reminderDateTime = null
        } = data;

        if (!title) throw new Error('Task title is required');
        const safeUserId = this._toSafeInt(userId, null, true);
        if (!(await this.userExists(safeUserId))) throw new Error(`User ${safeUserId} does not exist`);

        let formattedDueDate = null;
        if (dueDate) {
            formattedDueDate = this.formatDateForSQL(dueDate);
        }
        let formattedReminder = null;
        if (reminderDateTime) {
            formattedReminder = this.formatDateForSQL(reminderDateTime);
        }

        const insertTaskQuery = `
            INSERT INTO Tasks (
                title, description, priority, status, progress, dueDate,
                projectId, senderId, parentTaskId, recurringPattern, reminderDateTime, reminderSent,
                createdAt, updatedAt, isArchived, isOverdue, daysOverdue, escalated, escalationLevel
            )
            OUTPUT INSERTED.id
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, GETDATE(), GETDATE(), 0, 0, 0, 0, 0)
        `;
        const params = [
            title,
            description,
            priority,
            status,
            progress,
            formattedDueDate,
            this._toSafeInt(projectId),
            safeUserId,
            this._toSafeInt(parentTaskId),
            recurringPattern,
            formattedReminder
        ];

        let taskId;
        try {
            const result = await this.queryAsync(insertTaskQuery, params);
            taskId = result[0]?.id;
            if (!taskId) throw new Error('Failed to retrieve inserted task ID');
        } catch (error) {
            console.error('Failed to insert task:', error);
            throw new Error(`Database error while creating task: ${error.message}`);
        }

        const actualAssignees = [];
        for (const assigneeId of assignees) {
            const safeAssigneeId = this._toSafeInt(assigneeId);
            if (safeAssigneeId && await this.userExists(safeAssigneeId)) {
                try {
                    await this.executeAsync(`
                        INSERT INTO TaskAssignees (taskId, userId, assignedAt)
                        VALUES (?, ?, GETDATE())
                    `, [taskId, safeAssigneeId]);
                    actualAssignees.push(safeAssigneeId);
                } catch (err) {
                    console.error(`Failed to assign user ${safeAssigneeId} to task ${taskId}:`, err);
                }
            }
        }

        for (const depId of dependencies) {
            const safeDepId = this._toSafeInt(depId);
            if (safeDepId) {
                try {
                    await this.executeAsync(`
                        INSERT INTO TaskDependencies (taskId, dependsOnTaskId)
                        VALUES (?, ?)
                    `, [taskId, safeDepId]);
                } catch (err) {
                    console.error(`Failed to add dependency ${safeDepId} for task ${taskId}:`, err);
                }
            }
        }

        const sender = await this.queryAsync(`SELECT fullName FROM Users WHERE id = ?`, [safeUserId]);
        const senderName = sender[0]?.fullName || 'مستخدم';
        for (const assigneeId of actualAssignees) {
            await this._createNotification(
                assigneeId,
                'task_created',
                `مهمة جديدة: ${title}`,
                `${senderName} أنشأ مهمة "${title}" وكلّفك بها.`,
                'task',
                taskId,
                { createdBy: senderName, taskTitle: title }
            );
        }

        if (parentTaskId) {
            await this.updateParentTaskProgress(parentTaskId, safeUserId);
        }

        return { success: true, taskId };
    }

    async updateTask(taskId, data, userId) {
        taskId = this._toSafeInt(taskId, null, true);
        userId = this._toSafeInt(userId, null, true);
        if (!taskId || !userId) throw new Error('Invalid task or user ID');

        const checkQuery = `
            SELECT 1 FROM Tasks t
            LEFT JOIN TaskAssignees ta ON t.id = ta.taskId
            WHERE t.id = ?
              AND (t.senderId = ? OR ta.userId = ?)
        `;
        const check = await this.queryAsync(checkQuery, [taskId, userId, userId]);
        if (check.length === 0) {
            throw new Error('You do not have permission to update this task');
        }

        const updates = [];
        const params = [];
        if (data.title !== undefined) {
            updates.push('title = ?');
            params.push(data.title);
        }
        if (data.description !== undefined) {
            updates.push('description = ?');
            params.push(data.description);
        }
        if (data.priority !== undefined) {
            updates.push('priority = ?');
            params.push(data.priority);
        }
        if (data.status !== undefined) {
            updates.push('status = ?');
            params.push(data.status);
            if (data.status === 'done') {
                updates.push('isOverdue = 0, daysOverdue = 0');
                const task = await this.getTaskById(taskId, userId);
                if (task && task.dueDate && new Date(task.dueDate) < new Date()) {
                    await this.createPenaltyForTask(taskId, userId);
                }
            }
        }
        if (data.progress !== undefined) {
            updates.push('progress = ?');
            params.push(data.progress);
            if (data.progress === 100 && data.completedAt === undefined) {
                updates.push('completedAt = GETDATE(), isOverdue = 0, daysOverdue = 0');
                const task = await this.getTaskById(taskId, userId);
                if (task && task.dueDate && new Date(task.dueDate) < new Date()) {
                    await this.createPenaltyForTask(taskId, userId);
                }
            } else if (data.progress !== 100) {
                updates.push('completedAt = NULL');
            }
        }
        if (data.dueDate !== undefined) {
            updates.push('dueDate = ?');
            params.push(data.dueDate ? this.formatDateForSQL(data.dueDate) : null);
        }
        if (data.projectId !== undefined) {
            updates.push('projectId = ?');
            params.push(this._toSafeInt(data.projectId));
        }
        if (data.recurringPattern !== undefined) {
            updates.push('recurringPattern = ?');
            params.push(data.recurringPattern);
        }
        if (data.reminderDateTime !== undefined) {
            updates.push('reminderDateTime = ?');
            params.push(data.reminderDateTime ? this.formatDateForSQL(data.reminderDateTime) : null);
        }
        updates.push('updatedAt = GETDATE()');
        params.push(taskId);

        if (updates.length > 1) {
            const updateQuery = `UPDATE Tasks SET ${updates.join(', ')} WHERE id = ?`;
            await this.executeAsync(updateQuery, params);
        }

        if (data.assignees !== undefined && Array.isArray(data.assignees)) {
            const currentAssignees = await this.queryAsync(`SELECT userId FROM TaskAssignees WHERE taskId = ?`, [taskId]);
            const currentIds = currentAssignees.map(a => a.userId);
            await this.executeAsync(`DELETE FROM TaskAssignees WHERE taskId = ?`, [taskId]);
            const newAssignees = [];
            for (const assigneeId of data.assignees) {
                const safeAssigneeId = this._toSafeInt(assigneeId);
                if (safeAssigneeId && await this.userExists(safeAssigneeId)) {
                    await this.executeAsync(`
                        INSERT INTO TaskAssignees (taskId, userId, assignedAt)
                        VALUES (?, ?, GETDATE())
                    `, [taskId, safeAssigneeId]);
                    newAssignees.push(safeAssigneeId);
                }
            }
            const added = newAssignees.filter(a => !currentIds.includes(a));
            if (added.length) {
                const task = await this.getTaskById(taskId, userId);
                const senderName = task.senderName;
                for (const aid of added) {
                    await this._createNotification(
                        aid,
                        'task_assigned',
                        `تم تعيينك لمهمة: ${task.title}`,
                        `${senderName} عينك على مهمة "${task.title}".`,
                        'task',
                        taskId,
                        { taskTitle: task.title, assignedBy: senderName }
                    );
                }
            }
        }

        const taskInfo = await this.getTaskById(taskId, userId);
        if (taskInfo && taskInfo.parentTaskId) {
            await this.updateParentTaskProgress(taskInfo.parentTaskId, userId);
        }

        return { success: true };
    }

    async createPenaltyForTask(taskId, userId) {
        try {
            const task = await this.getTaskById(taskId, userId);
            if (!task) return;
            const assignees = await this.queryAsync(`SELECT userId FROM TaskAssignees WHERE taskId = ?`, [taskId]);
            const dueDate = new Date(task.dueDate);
            const now = new Date();
            const daysOverdue = Math.max(1, Math.floor((now - dueDate) / (1000 * 60 * 60 * 24)));
            const reason = `تأخر تسليم المهمة "${task.title}" بمقدار ${daysOverdue} يوم(أيام) عن تاريخ الاستحقاق ${task.dueDate}.`;
            for (const assignee of assignees) {
                const existing = await this.queryAsync(`SELECT 1 FROM Penalties WHERE taskId = ? AND userId = ?`, [taskId, assignee.userId]);
                if (existing.length === 0) {
                    await this.executeAsync(`
                        INSERT INTO Penalties (taskId, userId, reason, issuedAt, status)
                        VALUES (?, ?, ?, GETDATE(), 'active')
                    `, [taskId, assignee.userId, reason]);
                    await this._createNotification(
                        assignee.userId,
                        'penalty_issued',
                        `تم تسجيل جزاء عليك`,
                        `بسبب تأخر المهمة "${task.title}" عن موعدها.`,
                        'penalty',
                        taskId,
                        { taskTitle: task.title, dueDate: task.dueDate, daysOverdue }
                    );
                }
            }
        } catch (err) {
            console.error('Failed to create penalty for task', taskId, err);
        }
    }

    async updateParentTaskProgress(parentTaskId, userId) {
        try {
            await this.executeAsync(`EXEC sp_UpdateParentTaskStatus @ParentTaskId = ?`, [parentTaskId]);
        } catch (err) {
            console.error('Failed to call sp_UpdateParentTaskStatus:', err);
            const subtasks = await this.queryAsync(`
                SELECT progress, status FROM Tasks WHERE parentTaskId = ? AND isArchived = 0
            `, [parentTaskId]);
            if (subtasks.length === 0) return;
            const totalProgress = subtasks.reduce((sum, st) => sum + (st.progress || 0), 0);
            const avgProgress = Math.round(totalProgress / subtasks.length);
            let newStatus = 'todo';
            const completedCount = subtasks.filter(st => st.status === 'done').length;
            const inProgressCount = subtasks.filter(st => st.status === 'in-progress' || st.status === 'review').length;
            if (subtasks.length === 1) {
                newStatus = subtasks[0].status;
            } else {
                if (completedCount === subtasks.length) newStatus = 'done';
                else if (inProgressCount > 0) newStatus = 'in-progress';
                else newStatus = 'todo';
            }
            await this.executeAsync(`
                UPDATE Tasks SET progress = ?, status = ?, updatedAt = GETDATE() WHERE id = ?
            `, [avgProgress, newStatus, parentTaskId]);
        }
    }

    async archiveTask(taskId, userId) {
        taskId = this._toSafeInt(taskId, null, true);
        userId = this._toSafeInt(userId, null, true);
        const check = await this.queryAsync(`
            SELECT 1 FROM Tasks t
            LEFT JOIN TaskAssignees ta ON t.id = ta.taskId
            WHERE t.id = ?
              AND (t.senderId = ? OR ta.userId = ?)
        `, [taskId, userId, userId]);
        if (check.length === 0) throw new Error('Permission denied');
        await this.executeAsync(`
            UPDATE Tasks SET isArchived = 1, status = 'archived', updatedAt = GETDATE()
            WHERE id = ?
        `, [taskId]);
        return { success: true };
    }

    async restoreTask(taskId, userId) {
        taskId = this._toSafeInt(taskId, null, true);
        userId = this._toSafeInt(userId, null, true);
        const check = await this.queryAsync(`
            SELECT 1 FROM Tasks t
            LEFT JOIN TaskAssignees ta ON t.id = ta.taskId
            WHERE t.id = ?
              AND (t.senderId = ? OR ta.userId = ?)
        `, [taskId, userId, userId]);
        if (check.length === 0) throw new Error('Permission denied');
        await this.executeAsync(`
            UPDATE Tasks SET isArchived = 0, updatedAt = GETDATE()
            WHERE id = ?
        `, [taskId]);
        return { success: true };
    }

    async deleteTask(taskId, userId) {
        taskId = this._toSafeInt(taskId, null, true);
        userId = this._toSafeInt(userId, null, true);
        const check = await this.queryAsync(`
            SELECT 1 FROM Tasks WHERE id = ? AND senderId = ?
        `, [taskId, userId]);
        if (check.length === 0) throw new Error('You are not the sender of this task');
        
        await this.executeAsync(`DELETE FROM Tasks WHERE parentTaskId = ?`, [taskId]);
        await this.executeAsync(`DELETE FROM Tasks WHERE id = ?`, [taskId]);
        return { success: true };
    }

    async addComment(taskId, comment, userId) {
        taskId = this._toSafeInt(taskId, null, true);
        userId = this._toSafeInt(userId, null, true);
        const check = await this.queryAsync(`
            SELECT 1 FROM Tasks t
            LEFT JOIN TaskAssignees ta ON t.id = ta.taskId
            WHERE t.id = ?
              AND (t.senderId = ? OR ta.userId = ?)
        `, [taskId, userId, userId]);
        if (check.length === 0) throw new Error('Permission denied');

        await this.executeAsync(`
            INSERT INTO TaskComments (taskId, userId, comment, createdAt, updatedAt)
            VALUES (?, ?, ?, GETDATE(), GETDATE())
        `, [taskId, userId, comment]);

        const task = await this.getTaskById(taskId, userId);
        const commenter = await this.queryAsync(`SELECT fullName FROM Users WHERE id = ?`, [userId]);
        const commenterName = commenter[0]?.fullName || 'مستخدم';

        const assignees = await this.queryAsync(`SELECT userId FROM TaskAssignees WHERE taskId = ?`, [taskId]);
        const recipients = new Set([task.senderId, ...assignees.map(a => a.userId)]);
        recipients.delete(userId);
        for (const recId of recipients) {
            await this._createNotification(
                recId,
                'comment_added',
                `تعليق جديد على مهمة "${task.title}"`,
                `${commenterName} أضاف تعليقاً: "${comment.substring(0, 100)}..."`,
                'task',
                taskId,
                { taskTitle: task.title, commenter: commenterName, commentPreview: comment.substring(0, 100) }
            );
        }

        return { success: true };
    }

    async addAttachment(taskId, fileData, userId) {
        taskId = this._toSafeInt(taskId, null, true);
        userId = this._toSafeInt(userId, null, true);
        const check = await this.queryAsync(`
            SELECT 1 FROM Tasks t
            LEFT JOIN TaskAssignees ta ON t.id = ta.taskId
            WHERE t.id = ?
              AND (t.senderId = ? OR ta.userId = ?)
        `, [taskId, userId, userId]);
        if (check.length === 0) throw new Error('Permission denied');

        await this.executeAsync(`
            INSERT INTO TaskAttachments (taskId, fileName, fileUrl, fileSize, mimeType, uploadedAt)
            VALUES (?, ?, ?, ?, ?, GETDATE())
        `, [taskId, fileData.fileName, fileData.fileUrl, fileData.fileSize, fileData.mimeType]);

        const task = await this.getTaskById(taskId, userId);
        const uploader = await this.queryAsync(`SELECT fullName FROM Users WHERE id = ?`, [userId]);
        const uploaderName = uploader[0]?.fullName || 'مستخدم';
        const assignees = await this.queryAsync(`SELECT userId FROM TaskAssignees WHERE taskId = ?`, [taskId]);
        const recipients = new Set([task.senderId, ...assignees.map(a => a.userId)]);
        recipients.delete(userId);
        for (const recId of recipients) {
            await this._createNotification(
                recId,
                'attachment_added',
                `مرفق جديد في مهمة "${task.title}"`,
                `${uploaderName} أضاف ملفاً: ${fileData.fileName}`,
                'task',
                taskId,
                { taskTitle: task.title, uploader: uploaderName, fileName: fileData.fileName }
            );
        }

        return { success: true };
    }

    async updateProgress(taskId, progress, note, userId) {
        taskId = this._toSafeInt(taskId, null, true);
        userId = this._toSafeInt(userId, null, true);
        progress = this._toSafeInt(progress, 0);
        if (!taskId || !userId) throw new Error('Invalid task or user ID');

        const check = await this.queryAsync(`
            SELECT 1 FROM Tasks t
            INNER JOIN TaskAssignees ta ON t.id = ta.taskId
            WHERE t.id = ? AND ta.userId = ?
        `, [taskId, userId]);
        if (check.length === 0) throw new Error('Only assignees can update progress');

        let completedAtUpdate = '';
        if (progress === 100) {
            completedAtUpdate = ', completedAt = GETDATE(), isOverdue = 0, daysOverdue = 0';
            const task = await this.getTaskById(taskId, userId);
            if (task && task.dueDate && new Date(task.dueDate) < new Date()) {
                await this.createPenaltyForTask(taskId, userId);
            }
        } else {
            completedAtUpdate = ', completedAt = NULL';
        }

        await this.executeAsync(`
            UPDATE Tasks SET progress = ?, updatedAt = GETDATE() ${completedAtUpdate}
            WHERE id = ?
        `, [progress, taskId]);

        let newStatus = null;
        if (progress === 0) {
            newStatus = 'todo';
        } else if (progress === 100) {
            newStatus = 'done';
        } else if (progress > 0 && progress < 100) {
            if (progress < 30) newStatus = 'in-progress';
            else if (progress < 70) newStatus = 'in-progress';
            else newStatus = 'review';
        }
        if (newStatus) {
            await this.executeAsync(`
                UPDATE Tasks SET status = ? WHERE id = ?
            `, [newStatus, taskId]);
        }

        if (note) {
            await this.addComment(taskId, `Progress updated to ${progress}%: ${note}`, userId);
        } else {
            await this.addComment(taskId, `Progress updated to ${progress}%`, userId);
        }

        const task = await this.getTaskById(taskId, userId);
        if (task && task.parentTaskId) {
            try {
                await this.updateParentTaskProgress(task.parentTaskId, userId);
            } catch (err) {
                console.error('Failed to update parent progress after subtask progress update:', err);
            }
        }

        const assignees = await this.queryAsync(`SELECT userId FROM TaskAssignees WHERE taskId = ?`, [taskId]);
        const recipients = new Set([task.senderId, ...assignees.map(a => a.userId)]);
        recipients.delete(userId);
        const updater = await this.queryAsync(`SELECT fullName FROM Users WHERE id = ?`, [userId]);
        const updaterName = updater[0]?.fullName || 'مستخدم';
        for (const recId of recipients) {
            await this._createNotification(
                recId,
                'progress_updated',
                `تحديث تقدم المهمة "${task.title}"`,
                `${updaterName} حدث التقدم إلى ${progress}%`,
                'task',
                taskId,
                { taskTitle: task.title, updater: updaterName, newProgress: progress }
            );
        }

        return { success: true };
    }

    async getTaskStats(userId) {
        userId = this._toSafeInt(userId, null, true);
        
        const inboxQuery = `
            SELECT 
                COUNT(*) AS total,
                SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS completed,
                SUM(CASE WHEN status IN ('in-progress','review') THEN 1 ELSE 0 END) AS inProgress,
                SUM(CASE 
                    WHEN status != 'done' AND (isOverdue = 1 OR (dueDate IS NOT NULL AND CAST(dueDate AS DATE) < CAST(GETDATE() AS DATE))) THEN 1
                    ELSE 0 END) AS overdue
            FROM Tasks t
            INNER JOIN TaskAssignees ta ON t.id = ta.taskId
            WHERE ta.userId = ? AND t.isArchived = 0 AND t.status != 'archived'
        `;
        const inbox = await this.queryAsync(inboxQuery, [userId]);

        const sentQuery = `
            SELECT 
                COUNT(*) AS total,
                SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS completed,
                SUM(CASE WHEN status IN ('in-progress','review') THEN 1 ELSE 0 END) AS inProgress,
                SUM(CASE 
                    WHEN status != 'done' AND (isOverdue = 1 OR (dueDate IS NOT NULL AND CAST(dueDate AS DATE) < CAST(GETDATE() AS DATE))) THEN 1
                    ELSE 0 END) AS overdue
            FROM Tasks
            WHERE senderId = ? AND isArchived = 0 AND status != 'archived' AND parentTaskId IS NULL
        `;
        const sent = await this.queryAsync(sentQuery, [userId]);

        const teamCountResult = await this.queryAsync(`SELECT COUNT(*) as count FROM Users WHERE isActive = 1`);
        const teamCount = teamCountResult[0]?.count || 1;

        const requestsReceived = await this.queryAsync(`
            SELECT COUNT(*) AS total FROM Requests WHERE assigneeId = ?
        `, [userId]);
        const requestsSent = await this.queryAsync(`
            SELECT COUNT(*) AS total FROM Requests WHERE createdBy = ?
        `, [userId]);
        const purchasesReceived = await this.queryAsync(`
            SELECT COUNT(*) AS total FROM PurchaseRequests WHERE assigneeId = ?
        `, [userId]);
        const purchasesSent = await this.queryAsync(`
            SELECT COUNT(*) AS total FROM PurchaseRequests WHERE createdBy = ?
        `, [userId]);
        const penaltiesCount = await this.queryAsync(`
            SELECT COUNT(*) AS total FROM Penalties WHERE userId = ? AND status = 'active'
        `, [userId]);
        const manualPenaltiesCount = await this.queryAsync(`
            SELECT COUNT(*) AS total FROM ManualPenalties WHERE userId = ? AND status = 'active'
        `, [userId]);

        const totalAppointments = await this.queryAsync(`
            SELECT COUNT(*) AS total FROM Appointments a
            WHERE a.createdBy = ? OR EXISTS (SELECT 1 FROM AppointmentAttendees WHERE appointmentId = a.id AND userId = ?)
        `, [userId, userId]);

        return {
            total: inbox[0]?.total || 0,
            completed: inbox[0]?.completed || 0,
            inProgress: inbox[0]?.inProgress || 0,
            overdue: inbox[0]?.overdue || 0,
            team: teamCount,
            requestsReceived: requestsReceived[0]?.total || 0,
            requestsSent: requestsSent[0]?.total || 0,
            purchasesReceived: purchasesReceived[0]?.total || 0,
            purchasesSent: purchasesSent[0]?.total || 0,
            penalties: (penaltiesCount[0]?.total || 0) + (manualPenaltiesCount[0]?.total || 0),
            totalAppointments: totalAppointments[0]?.total || 0,
            sentTotal: sent[0]?.total || 0,
            sentCompleted: sent[0]?.completed || 0,
            sentInProgress: sent[0]?.inProgress || 0,
            sentOverdue: sent[0]?.overdue || 0
        };
    }

    async getTeamWorkload(userId) {
        userId = this._toSafeInt(userId, null, true);
        const query = `
            SELECT 
                COALESCE(u.department, N'غير محدد') AS departmentName,
                COUNT(ta.taskId) AS totalTasks,
                SUM(CASE WHEN t.status = 'done' AND t.isArchived = 0 THEN 1 ELSE 0 END) AS completedTasks,
                SUM(CASE WHEN t.isArchived = 1 THEN 1 ELSE 0 END) AS archivedTasks,
                SUM(CASE WHEN t.status IN ('in-progress','review') AND t.isArchived = 0 THEN 1 ELSE 0 END) AS inProgressTasks,
                SUM(CASE 
                    WHEN t.status != 'done' AND (t.isOverdue = 1 OR (t.dueDate IS NOT NULL AND CAST(t.dueDate AS DATE) < CAST(GETDATE() AS DATE))) THEN 1
                    ELSE 0 END) AS overdueTasks,
                AVG(tr.finalScore) AS averageScore
            FROM Users u
            LEFT JOIN TaskAssignees ta ON u.id = ta.userId
            LEFT JOIN Tasks t ON ta.taskId = t.id
            LEFT JOIN TaskRatings tr ON t.id = tr.taskId
            WHERE u.isActive = 1
            GROUP BY u.department
            ORDER BY u.department
        `;
        const rows = await this.queryAsync(query);
        return rows;
    }

    async searchTasks(userId, query, page = 1, limit = 25) {
        userId = this._toSafeInt(userId, null, true);
        page = this._toSafeInt(page, 1);
        limit = this._toSafeInt(limit, 25);
        const offset = (page - 1) * limit;
        const searchTerm = `%${query}%`;

        const sqlQuery = `
            SELECT 
                t.id, t.title, t.description, t.priority, t.status, t.progress, t.dueDate,
                t.projectId, t.senderId, t.parentTaskId, t.createdAt,
                u.fullName AS senderName,
                (SELECT COUNT(*) FROM TaskComments WHERE taskId = t.id) AS commentsCount,
                (SELECT COUNT(*) FROM TaskAttachments WHERE taskId = t.id) AS attachmentsCount
            FROM Tasks t
            INNER JOIN Users u ON t.senderId = u.id
            WHERE (t.senderId = ? OR EXISTS (SELECT 1 FROM TaskAssignees WHERE taskId = t.id AND userId = ?))
              AND (t.title LIKE ? OR t.description LIKE ?)
              AND t.isArchived = 0
            ORDER BY t.createdAt DESC
            OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
        `;
        const tasks = await this.queryAsync(sqlQuery, [userId, userId, searchTerm, searchTerm, offset, limit]);

        const countQuery = `
            SELECT COUNT(*) AS total
            FROM Tasks t
            WHERE (t.senderId = ? OR EXISTS (SELECT 1 FROM TaskAssignees WHERE taskId = t.id AND userId = ?))
              AND (t.title LIKE ? OR t.description LIKE ?)
              AND t.isArchived = 0
        `;
        const countResult = await this.queryAsync(countQuery, [userId, userId, searchTerm, searchTerm]);
        const totalItems = countResult[0]?.total || 0;
        const totalPages = Math.ceil(totalItems / limit);

        return {
            tasks,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems,
                itemsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        };
    }

    async checkAndEscalateTasks() {
        const now = new Date();
        const threshold = 72 * 60 * 60 * 1000;

        const overdueTasks = await this.queryAsync(`
            SELECT id, senderId, dueDate, escalated, escalationLevel, title
            FROM Tasks
            WHERE dueDate IS NOT NULL
              AND dueDate < GETDATE()
              AND status NOT IN ('done', 'archived')
              AND isArchived = 0
        `);

        for (const task of overdueTasks) {
            if (!task.escalated) {
                await this.executeAsync(`
                    UPDATE Tasks
                    SET isOverdue = 1,
                        daysOverdue = DATEDIFF(DAY, dueDate, GETDATE()),
                        escalated = 1,
                        escalationLevel = 1,
                        updatedAt = GETDATE()
                    WHERE id = ?
                `, [task.id]);
                await this.executeAsync(`
                    INSERT INTO TaskEscalations (taskId, level, escalatedTo, escalatedAt)
                    VALUES (?, 1, 'Direct Manager', GETDATE())
                `, [task.id]);
                await this._createNotification(task.senderId, 'task_escalated', `تصعيد المهمة: ${task.title}`, `تم تصعيد المهمة إلى المستوى 1 (المدير المباشر) بسبب التأخير.`, 'task', task.id);
            } else if (task.escalationLevel < 3) {
                const lastEscalation = await this.queryAsync(`
                    SELECT TOP 1 escalatedAt FROM TaskEscalations WHERE taskId = ? ORDER BY escalatedAt DESC
                `, [task.id]);
                if (lastEscalation.length > 0) {
                    const lastDate = new Date(lastEscalation[0].escalatedAt);
                    const hoursSince = (now - lastDate) / (60 * 60 * 1000);
                    if (hoursSince >= 72) {
                        const newLevel = task.escalationLevel + 1;
                        await this.executeAsync(`
                            UPDATE Tasks SET escalationLevel = ?, updatedAt = GETDATE() WHERE id = ?
                        `, [newLevel, task.id]);
                        const escalatedTo = newLevel === 2 ? 'Department Manager' : 'General Manager';
                        await this.executeAsync(`
                            INSERT INTO TaskEscalations (taskId, level, escalatedTo, escalatedAt)
                            VALUES (?, ?, ?, GETDATE())
                        `, [task.id, newLevel, escalatedTo]);
                        await this._createNotification(task.senderId, 'task_escalated', `تصعيد المهمة: ${task.title}`, `تم تصعيد المهمة إلى المستوى ${newLevel} (${escalatedTo}) بسبب التأخير.`, 'task', task.id);
                    }
                }
            }
        }

        return { escalatedCount: overdueTasks.length };
    }

    async generateRecurringTasks() {
        const recurringTasks = await this.queryAsync(`
            SELECT id, title, description, priority, projectId, dueDate, recurringPattern, senderId
            FROM Tasks
            WHERE recurringPattern IS NOT NULL
              AND isArchived = 0
              AND status != 'archived'
        `);

        const now = new Date();
        for (const task of recurringTasks) {
            let nextDueDate = null;
            if (task.dueDate) {
                const due = new Date(task.dueDate);
                switch (task.recurringPattern) {
                    case 'daily':
                        nextDueDate = new Date(due.setDate(due.getDate() + 1));
                        break;
                    case 'weekly':
                        nextDueDate = new Date(due.setDate(due.getDate() + 7));
                        break;
                    case 'monthly':
                        nextDueDate = new Date(due.setMonth(due.getMonth() + 1));
                        break;
                }
                if (nextDueDate && nextDueDate <= now) {
                    const assignees = await this.queryAsync(`SELECT userId FROM TaskAssignees WHERE taskId = ?`, [task.id]);
                    const newTaskId = await this.createTask({
                        title: task.title,
                        description: task.description,
                        priority: task.priority,
                        status: 'todo',
                        progress: 0,
                        dueDate: nextDueDate.toISOString(),
                        projectId: task.projectId,
                        assignees: assignees.map(a => a.userId),
                        recurringPattern: task.recurringPattern
                    }, task.senderId);

                    await this.executeAsync(`
                        INSERT INTO TaskRecurringInstances (originalTaskId, generatedTaskId, dueDate, createdAt)
                        VALUES (?, ?, ?, GETDATE())
                    `, [task.id, newTaskId.taskId, this.formatDateForSQL(nextDueDate)]);
                }
            }
        }
        return { generatedCount: 0 };
    }

    // ========== التذكيرات ==========
    async checkAndSendReminders() {
        const now = new Date();
        const nowFormatted = this.formatDateForSQL(now);
        
        const tasks = await this.queryAsync(`
            SELECT id, title, dueDate, reminderDateTime, senderId, parentTaskId
            FROM Tasks
            WHERE reminderDateTime IS NOT NULL
              AND reminderSent = 0
              AND reminderDateTime <= ?
        `, [nowFormatted]);
        
        for (const task of tasks) {
            let recipientIds = [task.senderId];
            const subtasks = await this.queryAsync(`
                SELECT id FROM Tasks WHERE parentTaskId = ? AND isArchived = 0
            `, [task.id]);
            if (subtasks.length > 0) {
                for (const sub of subtasks) {
                    const assignees = await this.queryAsync(`SELECT userId FROM TaskAssignees WHERE taskId = ?`, [sub.id]);
                    for (const a of assignees) {
                        recipientIds.push(a.userId);
                    }
                }
            } else {
                const assignees = await this.queryAsync(`SELECT userId FROM TaskAssignees WHERE taskId = ?`, [task.id]);
                for (const a of assignees) {
                    recipientIds.push(a.userId);
                }
            }
            const uniqueRecipients = [...new Set(recipientIds.filter(id => id != null))];
            await this.sendReminderForEntity('task', task.id, task.title, task.reminderDateTime, ...uniqueRecipients);
            await this.executeAsync(`UPDATE Tasks SET reminderSent = 1 WHERE id = ?`, [task.id]);
        }

        const requests = await this.queryAsync(`
            SELECT id, title, reminderDateTime, createdBy, assigneeId
            FROM Requests
            WHERE reminderDateTime IS NOT NULL
              AND reminderSent = 0
              AND reminderDateTime <= ?
        `, [nowFormatted]);
        for (const req of requests) {
            const recipientIds = [req.createdBy];
            if (req.assigneeId) recipientIds.push(req.assigneeId);
            const uniqueRecipients = [...new Set(recipientIds.filter(id => id != null))];
            await this.sendReminderForEntity('request', req.id, req.title, req.reminderDateTime, ...uniqueRecipients);
            await this.executeAsync(`UPDATE Requests SET reminderSent = 1 WHERE id = ?`, [req.id]);
        }

        const purchases = await this.queryAsync(`
            SELECT id, item AS title, reminderDateTime, createdBy, assigneeId
            FROM PurchaseRequests
            WHERE reminderDateTime IS NOT NULL
              AND reminderSent = 0
              AND reminderDateTime <= ?
        `, [nowFormatted]);
        for (const pur of purchases) {
            const recipientIds = [pur.createdBy];
            if (pur.assigneeId) recipientIds.push(pur.assigneeId);
            const uniqueRecipients = [...new Set(recipientIds.filter(id => id != null))];
            await this.sendReminderForEntity('purchase', pur.id, pur.title, pur.reminderDateTime, ...uniqueRecipients);
            await this.executeAsync(`UPDATE PurchaseRequests SET reminderSent = 1 WHERE id = ?`, [pur.id]);
        }

        const appointments = await this.queryAsync(`
            SELECT id, title, reminderDateTime, createdBy
            FROM Appointments
            WHERE reminderDateTime IS NOT NULL
              AND reminderSent = 0
              AND reminderDateTime <= ?
        `, [nowFormatted]);
        for (const app of appointments) {
            const attendees = await this.queryAsync(`SELECT userId FROM AppointmentAttendees WHERE appointmentId = ?`, [app.id]);
            const recipientIds = [app.createdBy, ...attendees.map(a => a.userId)];
            const uniqueRecipients = [...new Set(recipientIds.filter(id => id != null))];
            await this.sendReminderForEntity('appointment', app.id, app.title, app.reminderDateTime, ...uniqueRecipients);
            await this.executeAsync(`UPDATE Appointments SET reminderSent = 1 WHERE id = ?`, [app.id]);
        }

        return { 
            tasksSent: tasks.length, 
            requestsSent: requests.length, 
            purchasesSent: purchases.length, 
            appointmentsSent: appointments.length 
        };
    }

    async sendReminderForEntity(entityType, entityId, title, reminderDateTime, ...userIds) {
        const uniqueUserIds = [...new Set(userIds.filter(id => id != null))];
        let formattedTime = '';
        if (reminderDateTime) {
            const reminderDate = new Date(reminderDateTime);
            formattedTime = reminderDate.toLocaleString('ar-EG', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        for (const uid of uniqueUserIds) {
            await this._createNotification(
                uid,
                'reminder',
                `🔔 تذكير: ${title}`,
                `هذا تذكير بالعنوان "${title}" المقرر في ${formattedTime}.`,
                entityType,
                entityId,
                { entityTitle: title, reminderTime: reminderDateTime }
            );
        }
    }

    // ======================= التقييمات =======================
    async rateTask(taskId, ratingData, userId) {
        taskId = this._toSafeInt(taskId, null, true);
        userId = this._toSafeInt(userId, null, true);
        const { qualityScore, difficultyWeight, notes } = ratingData;
        if (!qualityScore || !difficultyWeight) throw new Error('Quality score and difficulty weight are required');
        if (qualityScore < 1 || qualityScore > 10) throw new Error('Quality score must be between 1 and 10');
        if (![1.0, 1.5, 2.0].includes(difficultyWeight)) throw new Error('Difficulty weight must be 1.0, 1.5, or 2.0');

        const task = await this.getTaskById(taskId, userId);
        if (!task) throw new Error('Task not found');
        if (task.senderId !== userId) {
            throw new Error('Only the task creator can rate this task');
        }
        if (task.status !== 'done') {
            throw new Error('Task must be completed before rating');
        }

        const existingRating = await this.queryAsync(`SELECT id FROM TaskRatings WHERE taskId = ?`, [taskId]);
        if (existingRating.length > 0) {
            throw new Error('This task has already been rated');
        }

        let timeScore = 10;
        if (task.dueDate && task.completedAt) {
            const dueDateOnly = new Date(task.dueDate);
            dueDateOnly.setHours(0,0,0,0);
            const completedDateOnly = new Date(task.completedAt);
            completedDateOnly.setHours(0,0,0,0);
            if (completedDateOnly > dueDateOnly) {
                timeScore = 7;
            } else {
                timeScore = 10;
            }
        } else if (!task.dueDate && task.completedAt) {
            timeScore = 10;
        } else {
            timeScore = 10;
        }

        const finalScore = ((timeScore * 0.4) + (qualityScore * 0.4) + (10 * 0.2)) * difficultyWeight;

        await this.executeAsync(`
            INSERT INTO TaskRatings (taskId, ratedBy, qualityScore, difficultyWeight, timeScore, finalScore, notes, ratedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, GETDATE())
        `, [taskId, userId, qualityScore, difficultyWeight, timeScore, finalScore, notes || null]);

        const assignees = await this.queryAsync(`SELECT userId FROM TaskAssignees WHERE taskId = ?`, [taskId]);
        for (const assignee of assignees) {
            await this.updateUserAverageScore(assignee.userId);
        }

        return { success: true, finalScore, timeScore };
    }

    async updateUserAverageScore(userId) {
        userId = this._toSafeInt(userId, null, true);
        if (!userId) return;
        const avgQuery = `
            SELECT AVG(tr.finalScore) AS avgScore
            FROM TaskRatings tr
            INNER JOIN TaskAssignees ta ON tr.taskId = ta.taskId
            WHERE ta.userId = ?
        `;
        const result = await this.queryAsync(avgQuery, [userId]);
        const newAverage = result[0]?.avgScore !== null ? parseFloat(result[0].avgScore) : null;
        await this.executeAsync(`
            UPDATE Users SET averageScore = ? WHERE id = ?
        `, [newAverage, userId]);
    }

    async getUserAverageScore(userId) {
        userId = this._toSafeInt(userId, null, true);
        const query = `
            SELECT AVG(tr.finalScore) AS averageScore
            FROM TaskRatings tr
            INNER JOIN TaskAssignees ta ON tr.taskId = ta.taskId
            WHERE ta.userId = ?
        `;
        const result = await this.queryAsync(query, [userId]);
        return result[0]?.avgScore !== null ? parseFloat(result[0].avgScore) : null;
    }

    // ================================ REQUESTS ================================
    async getRequests(userId, folder = 'all', page = 1, limit = 25) {
        userId = this._toSafeInt(userId, null, true);
        page = this._toSafeInt(page, 1);
        limit = this._toSafeInt(limit, 25);
        const offset = (page - 1) * limit;

        let whereClause = '';
        let params = [];
        let countParams = [];

        if (folder === 'assigned') {
            whereClause = `WHERE r.assigneeId = ?`;
            params = [userId, offset, limit];
            countParams = [userId];
        } else if (folder === 'created') {
            whereClause = `WHERE r.createdBy = ?`;
            params = [userId, offset, limit];
            countParams = [userId];
        } else {
            whereClause = `WHERE (r.assigneeId = ? OR r.createdBy = ?)`;
            params = [userId, userId, offset, limit];
            countParams = [userId, userId];
        }

        const query = `
            SELECT 
                r.id, r.title, r.description, r.assigneeId, r.projectId, r.status, 
                r.createdAt, r.updatedAt, r.createdBy, r.reminderDateTime, r.reminderSent,
                u.fullName AS assigneeName, 
                c.fullName AS createdByName
            FROM Requests r
            LEFT JOIN Users u ON r.assigneeId = u.id
            LEFT JOIN Users c ON r.createdBy = c.id
            ${whereClause}
            ORDER BY r.createdAt DESC
            OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
        `;
        const countQuery = `
            SELECT COUNT(*) AS total FROM Requests r
            ${whereClause}
        `;

        const [requests, countResult] = await Promise.all([
            this.queryAsync(query, params),
            this.queryAsync(countQuery, countParams)
        ]);

        const totalItems = countResult[0]?.total || 0;
        const totalPages = Math.ceil(totalItems / limit);

        return {
            requests,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems,
                itemsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        };
    }

    async createRequest(data, userId) {
        const { title, description = '', assigneeId = null, status = 'pending', reminderDateTime = null } = data;
        if (!title) throw new Error('Request title required');

        const safeUserId = this._toSafeInt(userId, null, true);
        if (!(await this.userExists(safeUserId))) {
            throw new Error(`User ${safeUserId} does not exist or is inactive`);
        }

        let safeAssigneeId = null;
        if (assigneeId) {
            safeAssigneeId = this._toSafeInt(assigneeId);
            if (safeAssigneeId && !(await this.userExists(safeAssigneeId))) {
                throw new Error(`Assignee user with ID ${assigneeId} does not exist`);
            }
        }

        let formattedReminder = null;
        if (reminderDateTime) {
            formattedReminder = this.formatDateForSQL(reminderDateTime);
        }

        const insertQuery = `
            INSERT INTO Requests (title, description, assigneeId, status, createdBy, createdAt, updatedAt, reminderDateTime, reminderSent)
            OUTPUT INSERTED.id
            VALUES (?, ?, ?, ?, ?, GETDATE(), GETDATE(), ?, 0)
        `;
        try {
            const result = await this.queryAsync(insertQuery, [title, description, safeAssigneeId, status, safeUserId, formattedReminder]);
            const requestId = result[0]?.id;
            if (!requestId) throw new Error('Failed to retrieve inserted request ID');

            if (safeAssigneeId) {
                const creator = await this.queryAsync(`SELECT fullName FROM Users WHERE id = ?`, [safeUserId]);
                const creatorName = creator[0]?.fullName || 'مستخدم';
                await this._createNotification(
                    safeAssigneeId,
                    'request_created',
                    `طلب جديد: ${title}`,
                    `${creatorName} أنشأ طلباً جديداً: "${title}"`,
                    'request',
                    requestId,
                    { requestTitle: title, createdBy: creatorName }
                );
            }

            return { success: true, requestId };
        } catch (error) {
            console.error('Failed to create request:', error);
            throw new Error(`Database error while creating request: ${error.message}`);
        }
    }

    async updateRequest(requestId, data, userId) {
        requestId = this._toSafeInt(requestId, null, true);
        userId = this._toSafeInt(userId, null, true);
        if (!requestId || !userId) throw new Error('Invalid request or user ID');

        const check = await this.queryAsync(`
            SELECT 1 FROM Requests WHERE id = ? AND (assigneeId = ? OR createdBy = ?)
        `, [requestId, userId, userId]);
        if (check.length === 0) throw new Error('Permission denied');

        const updates = [];
        const params = [];
        if (data.title !== undefined) {
            updates.push('title = ?');
            params.push(data.title);
        }
        if (data.description !== undefined) {
            updates.push('description = ?');
            params.push(data.description);
        }
        if (data.assigneeId !== undefined) {
            let safeAssigneeId = null;
            if (data.assigneeId) {
                safeAssigneeId = this._toSafeInt(data.assigneeId);
                if (safeAssigneeId && !(await this.userExists(safeAssigneeId))) {
                    throw new Error(`User with ID ${data.assigneeId} does not exist`);
                }
            }
            updates.push('assigneeId = ?');
            params.push(safeAssigneeId);
        }
        if (data.status !== undefined) {
            updates.push('status = ?');
            params.push(data.status);
        }
        if (data.reminderDateTime !== undefined) {
            updates.push('reminderDateTime = ?');
            params.push(data.reminderDateTime ? this.formatDateForSQL(data.reminderDateTime) : null);
        }
        updates.push('updatedAt = GETDATE()');
        params.push(requestId);

        if (updates.length > 1) {
            const updateQuery = `UPDATE Requests SET ${updates.join(', ')} WHERE id = ?`;
            await this.executeAsync(updateQuery, params);
        }
        return { success: true };
    }

    async deleteRequest(requestId, userId) {
        requestId = this._toSafeInt(requestId, null, true);
        userId = this._toSafeInt(userId, null, true);
        if (!requestId || !userId) throw new Error('Invalid request or user ID');

        const check = await this.queryAsync(`
            SELECT 1 FROM Requests WHERE id = ? AND createdBy = ?
        `, [requestId, userId]);
        if (check.length === 0) throw new Error('Only creator can delete request');
        await this.executeAsync(`DELETE FROM Requests WHERE id = ?`, [requestId]);
        return { success: true };
    }

    // ================================ PURCHASE REQUESTS ================================
    async getPurchaseRequests(userId, folder = 'all', page = 1, limit = 25) {
        userId = this._toSafeInt(userId, null, true);
        page = this._toSafeInt(page, 1);
        limit = this._toSafeInt(limit, 25);
        const offset = (page - 1) * limit;

        let whereClause = '';
        let params = [];
        let countParams = [];

        if (folder === 'assigned') {
            whereClause = `WHERE p.assigneeId = ?`;
            params = [userId, offset, limit];
            countParams = [userId];
        } else if (folder === 'created') {
            whereClause = `WHERE p.createdBy = ?`;
            params = [userId, offset, limit];
            countParams = [userId];
        } else {
            whereClause = `WHERE (p.assigneeId = ? OR p.createdBy = ?)`;
            params = [userId, userId, offset, limit];
            countParams = [userId, userId];
        }

        const query = `
            SELECT 
                p.id, p.item, p.quantity, p.urgency, p.description, p.assigneeId, 
                p.status, p.createdAt, p.updatedAt, p.createdBy, p.reminderDateTime, p.reminderSent,
                u.fullName AS assigneeName, 
                c.fullName AS createdByName
            FROM PurchaseRequests p
            LEFT JOIN Users u ON p.assigneeId = u.id
            LEFT JOIN Users c ON p.createdBy = c.id
            ${whereClause}
            ORDER BY p.createdAt DESC
            OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
        `;
        const countQuery = `
            SELECT COUNT(*) AS total FROM PurchaseRequests p
            ${whereClause}
        `;

        const [purchases, countResult] = await Promise.all([
            this.queryAsync(query, params),
            this.queryAsync(countQuery, countParams)
        ]);

        const totalItems = countResult[0]?.total || 0;
        const totalPages = Math.ceil(totalItems / limit);

        return {
            purchases,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems,
                itemsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        };
    }

    async createPurchaseRequest(data, userId) {
        const { item, quantity = 1, urgency = 'normal', description = '', assigneeId = null, status = 'pending', reminderDateTime = null } = data;
        if (!item) throw new Error('Item name required');

        const safeUserId = this._toSafeInt(userId, null, true);
        if (!(await this.userExists(safeUserId))) {
            throw new Error(`User ${safeUserId} does not exist or is inactive`);
        }

        let safeAssigneeId = null;
        if (assigneeId) {
            safeAssigneeId = this._toSafeInt(assigneeId);
            if (safeAssigneeId && !(await this.userExists(safeAssigneeId))) {
                throw new Error(`Assignee user with ID ${assigneeId} does not exist`);
            }
        }

        let formattedReminder = null;
        if (reminderDateTime) {
            formattedReminder = this.formatDateForSQL(reminderDateTime);
        }

        const insertQuery = `
            INSERT INTO PurchaseRequests (item, quantity, urgency, description, assigneeId, status, createdBy, createdAt, updatedAt, reminderDateTime, reminderSent)
            OUTPUT INSERTED.id
            VALUES (?, ?, ?, ?, ?, ?, ?, GETDATE(), GETDATE(), ?, 0)
        `;
        try {
            const result = await this.queryAsync(insertQuery, [
                item,
                this._toSafeInt(quantity, 1),
                urgency,
                description,
                safeAssigneeId,
                status,
                safeUserId,
                formattedReminder
            ]);
            const purchaseId = result[0]?.id;
            if (!purchaseId) throw new Error('Failed to retrieve inserted purchase ID');

            if (safeAssigneeId) {
                const creator = await this.queryAsync(`SELECT fullName FROM Users WHERE id = ?`, [safeUserId]);
                const creatorName = creator[0]?.fullName || 'مستخدم';
                await this._createNotification(
                    safeAssigneeId,
                    'purchase_created',
                    `طلب شراء جديد: ${item}`,
                    `${creatorName} أنشأ طلب شراء "${item}" (الكمية: ${quantity})`,
                    'purchase',
                    purchaseId,
                    { item, quantity, createdBy: creatorName }
                );
            }

            return { success: true, purchaseId };
        } catch (error) {
            console.error('Failed to create purchase request:', error);
            throw new Error(`Database error while creating purchase request: ${error.message}`);
        }
    }

    async updatePurchaseRequest(purchaseId, data, userId) {
        purchaseId = this._toSafeInt(purchaseId, null, true);
        userId = this._toSafeInt(userId, null, true);
        if (!purchaseId || !userId) throw new Error('Invalid purchase request or user ID');

        const check = await this.queryAsync(`
            SELECT 1 FROM PurchaseRequests WHERE id = ? AND (assigneeId = ? OR createdBy = ?)
        `, [purchaseId, userId, userId]);
        if (check.length === 0) throw new Error('Permission denied');

        const updates = [];
        const params = [];
        if (data.item !== undefined) {
            updates.push('item = ?');
            params.push(data.item);
        }
        if (data.quantity !== undefined) {
            updates.push('quantity = ?');
            params.push(this._toSafeInt(data.quantity, 1));
        }
        if (data.urgency !== undefined) {
            updates.push('urgency = ?');
            params.push(data.urgency);
        }
        if (data.description !== undefined) {
            updates.push('description = ?');
            params.push(data.description);
        }
        if (data.assigneeId !== undefined) {
            let safeAssigneeId = null;
            if (data.assigneeId) {
                safeAssigneeId = this._toSafeInt(data.assigneeId);
                if (safeAssigneeId && !(await this.userExists(safeAssigneeId))) {
                    throw new Error(`User with ID ${data.assigneeId} does not exist`);
                }
            }
            updates.push('assigneeId = ?');
            params.push(safeAssigneeId);
        }
        if (data.status !== undefined) {
            updates.push('status = ?');
            params.push(data.status);
        }
        if (data.reminderDateTime !== undefined) {
            updates.push('reminderDateTime = ?');
            params.push(data.reminderDateTime ? this.formatDateForSQL(data.reminderDateTime) : null);
        }
        updates.push('updatedAt = GETDATE()');
        params.push(purchaseId);

        if (updates.length > 1) {
            const updateQuery = `UPDATE PurchaseRequests SET ${updates.join(', ')} WHERE id = ?`;
            await this.executeAsync(updateQuery, params);
        }
        return { success: true };
    }

    async deletePurchaseRequest(purchaseId, userId) {
        purchaseId = this._toSafeInt(purchaseId, null, true);
        userId = this._toSafeInt(userId, null, true);
        if (!purchaseId || !userId) throw new Error('Invalid purchase request or user ID');

        const check = await this.queryAsync(`
            SELECT 1 FROM PurchaseRequests WHERE id = ? AND createdBy = ?
        `, [purchaseId, userId]);
        if (check.length === 0) throw new Error('Only creator can delete purchase request');
        await this.executeAsync(`DELETE FROM PurchaseRequests WHERE id = ?`, [purchaseId]);
        return { success: true };
    }

    // ================================ APPOINTMENTS ================================
    async getAppointments(userId, page = 1, limit = 25, startDate = null, endDate = null) {
        userId = this._toSafeInt(userId, null, true);
        page = this._toSafeInt(page, 1);
        limit = this._toSafeInt(limit, 25);
        const offset = (page - 1) * limit;

        let whereClause = `WHERE (a.createdBy = ? OR EXISTS (SELECT 1 FROM AppointmentAttendees WHERE appointmentId = a.id AND userId = ?))`;
        const params = [userId, userId];
        if (startDate) {
            whereClause += ` AND a.appointmentDate >= ?`;
            params.push(startDate);
        }
        if (endDate) {
            whereClause += ` AND a.appointmentDate <= ?`;
            params.push(endDate);
        }

        const query = `
            SELECT 
                a.id, a.title, a.appointmentDate, a.appointmentTime, a.location, 
                a.type, a.notes, a.createdBy, a.createdAt, a.updatedAt, a.reminderDateTime, a.reminderSent,
                u.fullName AS createdByName
            FROM Appointments a
            INNER JOIN Users u ON a.createdBy = u.id
            ${whereClause}
            ORDER BY a.appointmentDate ASC, a.appointmentTime ASC
            OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
        `;
        const countQuery = `
            SELECT COUNT(*) AS total FROM Appointments a
            ${whereClause}
        `;

        const mainParams = [...params, offset, limit];
        const countParams = [...params];

        const [appointments, countResult] = await Promise.all([
            this.queryAsync(query, mainParams),
            this.queryAsync(countQuery, countParams)
        ]);

        for (let app of appointments) {
            const attendeesQuery = `
                SELECT u.id, u.fullName, u.email, u.role, u.profileImage
                FROM AppointmentAttendees aa
                INNER JOIN Users u ON aa.userId = u.id
                WHERE aa.appointmentId = ?
            `;
            const attendees = await this.queryAsync(attendeesQuery, [app.id]);
            app.attendees = attendees.map(a => ({
                id: a.id,
                fullName: a.fullName,
                email: a.email,
                role: a.role,
                avatar: a.profileImage || `https://i.pravatar.cc/150?img=${a.id}`
            }));
        }

        const totalItems = countResult[0]?.total || 0;
        const totalPages = Math.ceil(totalItems / limit);

        return {
            appointments,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems,
                itemsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        };
    }

    async createAppointment(data, userId) {
        const { title, appointmentDate, appointmentTime, location = '', type = 'meeting', notes = '', attendees = [], reminderDateTime = null } = data;
        if (!title || !appointmentDate || !appointmentTime) throw new Error('Title, date, and time required');

        const safeUserId = this._toSafeInt(userId, null, true);
        if (!(await this.userExists(safeUserId))) {
            throw new Error(`User ${safeUserId} does not exist or is inactive`);
        }

        let formattedTime = appointmentTime;
        if (formattedTime && formattedTime.split(':').length === 2) {
            formattedTime = `${formattedTime}:00`;
        } else if (formattedTime && formattedTime.split(':').length !== 3) {
            formattedTime = `${formattedTime}:00:00`;
        }

        let formattedReminder = null;
        if (reminderDateTime) {
            formattedReminder = this.formatDateForSQL(reminderDateTime);
        }

        const validAttendees = [];
        for (const attendeeId of attendees) {
            const safeId = this._toSafeInt(attendeeId);
            if (safeId && await this.userExists(safeId)) {
                validAttendees.push(safeId);
            }
        }

        const insertQuery = `
            INSERT INTO Appointments (title, appointmentDate, appointmentTime, location, type, notes, createdBy, createdAt, updatedAt, reminderDateTime, reminderSent)
            OUTPUT INSERTED.id
            VALUES (?, ?, ?, ?, ?, ?, ?, GETDATE(), GETDATE(), ?, 0)
        `;
        try {
            const result = await this.queryAsync(insertQuery, [
                title,
                appointmentDate,
                formattedTime,
                location,
                type,
                notes,
                safeUserId,
                formattedReminder
            ]);
            const appointmentId = result[0]?.id;
            if (!appointmentId) throw new Error('Failed to retrieve inserted appointment ID');

            for (const attendeeId of validAttendees) {
                await this.executeAsync(`
                    INSERT INTO AppointmentAttendees (appointmentId, userId)
                    VALUES (?, ?)
                `, [appointmentId, attendeeId]);
                const creator = await this.queryAsync(`SELECT fullName FROM Users WHERE id = ?`, [safeUserId]);
                const creatorName = creator[0]?.fullName || 'مستخدم';
                await this._createNotification(
                    attendeeId,
                    'appointment_created',
                    `موعد جديد: ${title}`,
                    `${creatorName} أضافك إلى موعد "${title}" في ${appointmentDate} ${formattedTime}`,
                    'appointment',
                    appointmentId,
                    { appointmentTitle: title, date: appointmentDate, time: formattedTime, createdBy: creatorName }
                );
            }

            return { success: true, appointmentId };
        } catch (error) {
            console.error('Failed to create appointment:', error);
            throw new Error(`Database error while creating appointment: ${error.message}`);
        }
    }

    async updateAppointment(appointmentId, data, userId) {
        appointmentId = this._toSafeInt(appointmentId, null, true);
        userId = this._toSafeInt(userId, null, true);
        if (!appointmentId || !userId) throw new Error('Invalid appointment or user ID');

        const check = await this.queryAsync(`
            SELECT 1 FROM Appointments WHERE id = ? AND createdBy = ?
        `, [appointmentId, userId]);
        if (check.length === 0) throw new Error('Only creator can update appointment');

        const updates = [];
        const params = [];
        if (data.title !== undefined) {
            updates.push('title = ?');
            params.push(data.title);
        }
        if (data.appointmentDate !== undefined) {
            updates.push('appointmentDate = ?');
            params.push(data.appointmentDate);
        }
        if (data.appointmentTime !== undefined) {
            let formattedTime = data.appointmentTime;
            if (formattedTime && formattedTime.split(':').length === 2) {
                formattedTime = `${formattedTime}:00`;
            } else if (formattedTime && formattedTime.split(':').length !== 3) {
                formattedTime = `${formattedTime}:00:00`;
            }
            updates.push('appointmentTime = ?');
            params.push(formattedTime);
        }
        if (data.location !== undefined) {
            updates.push('location = ?');
            params.push(data.location);
        }
        if (data.type !== undefined) {
            updates.push('type = ?');
            params.push(data.type);
        }
        if (data.notes !== undefined) {
            updates.push('notes = ?');
            params.push(data.notes);
        }
        if (data.reminderDateTime !== undefined) {
            updates.push('reminderDateTime = ?');
            params.push(data.reminderDateTime ? this.formatDateForSQL(data.reminderDateTime) : null);
        }
        updates.push('updatedAt = GETDATE()');
        params.push(appointmentId);

        if (updates.length > 1) {
            const updateQuery = `UPDATE Appointments SET ${updates.join(', ')} WHERE id = ?`;
            await this.executeAsync(updateQuery, params);
        }

        if (data.attendees !== undefined && Array.isArray(data.attendees)) {
            await this.executeAsync(`DELETE FROM AppointmentAttendees WHERE appointmentId = ?`, [appointmentId]);
            for (const attendeeId of data.attendees) {
                const safeAttendeeId = this._toSafeInt(attendeeId);
                if (safeAttendeeId && await this.userExists(safeAttendeeId)) {
                    await this.executeAsync(`
                        INSERT INTO AppointmentAttendees (appointmentId, userId)
                        VALUES (?, ?)
                    `, [appointmentId, safeAttendeeId]);
                }
            }
        }

        return { success: true };
    }

    async deleteAppointment(appointmentId, userId) {
        appointmentId = this._toSafeInt(appointmentId, null, true);
        userId = this._toSafeInt(userId, null, true);
        if (!appointmentId || !userId) throw new Error('Invalid appointment or user ID');

        const check = await this.queryAsync(`
            SELECT 1 FROM Appointments WHERE id = ? AND createdBy = ?
        `, [appointmentId, userId]);
        if (check.length === 0) throw new Error('Only creator can delete appointment');
        await this.executeAsync(`DELETE FROM Appointments WHERE id = ?`, [appointmentId]);
        return { success: true };
    }

    // ================================ PENALTIES (AUTOMATIC) ================================
    async getPenalties(userId, page = 1, limit = 25) {
        userId = this._toSafeInt(userId, null, true);
        page = this._toSafeInt(page, 1);
        limit = this._toSafeInt(limit, 25);
        const offset = (page - 1) * limit;

        let query, countQuery;
        const isGM = await this._isGeneralManager(userId);

        if (isGM) {
            // المشرف العام يرى جميع الجزاءات
            query = `
                SELECT p.*, t.title AS taskTitle, u.fullName AS userName
                FROM Penalties p
                INNER JOIN Tasks t ON p.taskId = t.id
                INNER JOIN Users u ON p.userId = u.id
                ORDER BY p.issuedAt DESC
                OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
            `;
            countQuery = `
                SELECT COUNT(*) AS total
                FROM Penalties p
                INNER JOIN Tasks t ON p.taskId = t.id
            `;
            const [penalties, countResult] = await Promise.all([
                this.queryAsync(query, [offset, limit]),
                this.queryAsync(countQuery)
            ]);
            const totalItems = countResult[0]?.total || 0;
            const totalPages = Math.ceil(totalItems / limit);
            return { penalties, pagination: { currentPage: page, totalPages, totalItems, itemsPerPage: limit, hasNextPage: page < totalPages, hasPrevPage: page > 1 } };
        } else {
            query = `
                SELECT p.*, t.title AS taskTitle, u.fullName AS userName
                FROM Penalties p
                INNER JOIN Tasks t ON p.taskId = t.id
                INNER JOIN Users u ON p.userId = u.id
                WHERE p.userId = ? OR t.senderId = ? OR EXISTS (SELECT 1 FROM TaskAssignees WHERE taskId = t.id AND userId = ?)
                ORDER BY p.issuedAt DESC
                OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
            `;
            countQuery = `
                SELECT COUNT(*) AS total
                FROM Penalties p
                INNER JOIN Tasks t ON p.taskId = t.id
                WHERE p.userId = ? OR t.senderId = ? OR EXISTS (SELECT 1 FROM TaskAssignees WHERE taskId = t.id AND userId = ?)
            `;
            const [penalties, countResult] = await Promise.all([
                this.queryAsync(query, [userId, userId, userId, offset, limit]),
                this.queryAsync(countQuery, [userId, userId, userId])
            ]);
            const totalItems = countResult[0]?.total || 0;
            const totalPages = Math.ceil(totalItems / limit);
            return { penalties, pagination: { currentPage: page, totalPages, totalItems, itemsPerPage: limit, hasNextPage: page < totalPages, hasPrevPage: page > 1 } };
        }
    }

    async removePenalty(penaltyId, userId) {
        penaltyId = this._toSafeInt(penaltyId, null, true);
        userId = this._toSafeInt(userId, null, true);
        if (!penaltyId || !userId) throw new Error('Invalid penalty or user ID');

        const isGM = await this._isGeneralManager(userId);
        if (isGM) {
            // المشرف العام يمكنه حذف أي جزاء
            await this.executeAsync(`DELETE FROM Penalties WHERE id = ?`, [penaltyId]);
            return { success: true };
        }

        // تحقق إذا كان المستخدم هو منشئ المهمة أو مسؤول عنها
        const check = await this.queryAsync(`
            SELECT p.id
            FROM Penalties p
            INNER JOIN Tasks t ON p.taskId = t.id
            WHERE p.id = ? AND (t.senderId = ? OR EXISTS (SELECT 1 FROM TaskAssignees WHERE taskId = t.id AND userId = ?))
        `, [penaltyId, userId, userId]);
        if (check.length === 0) throw new Error('Permission denied');
        await this.executeAsync(`DELETE FROM Penalties WHERE id = ?`, [penaltyId]);
        return { success: true };
    }

    async generatePenaltiesForOverdueTasks() {
        const overdueTasks = await this.queryAsync(`
            SELECT t.id, t.title, t.dueDate, t.senderId
            FROM Tasks t
            WHERE t.dueDate < GETDATE()
              AND t.status NOT IN ('done', 'archived')
              AND t.isArchived = 0
              AND NOT EXISTS (SELECT 1 FROM Penalties WHERE taskId = t.id AND status = 'active')
        `);

        for (const task of overdueTasks) {
            const assignees = await this.queryAsync(`SELECT userId FROM TaskAssignees WHERE taskId = ?`, [task.id]);
            const penaltyReason = `المهمة "${task.title}" متأخرة عن موعدها المحدد (${task.dueDate})`;

            for (const assignee of assignees) {
                await this.executeAsync(`
                    INSERT INTO Penalties (taskId, userId, reason, issuedAt, status)
                    VALUES (?, ?, ?, GETDATE(), 'active')
                `, [task.id, assignee.userId, penaltyReason]);
                await this._createNotification(
                    assignee.userId,
                    'penalty_issued',
                    `تم تسجيل جزاء عليك`,
                    `بسبب تأخر المهمة "${task.title}" عن موعدها.`,
                    'penalty',
                    task.id,
                    { taskTitle: task.title, dueDate: task.dueDate }
                );
            }
        }
        return { penaltiesGenerated: overdueTasks.length };
    }

    // ================================ MANUAL PENALTIES ================================
    async getManualPenalties(userId, page = 1, limit = 25) {
        userId = this._toSafeInt(userId, null, true);
        page = this._toSafeInt(page, 1);
        limit = this._toSafeInt(limit, 25);
        const offset = (page - 1) * limit;

        let query, countQuery;
        const isGM = await this._isGeneralManager(userId);

        if (isGM) {
            query = `
                SELECT mp.*, u.fullName AS userName, c.fullName AS createdByName
                FROM ManualPenalties mp
                INNER JOIN Users u ON mp.userId = u.id
                INNER JOIN Users c ON mp.createdBy = c.id
                ORDER BY mp.createdAt DESC
                OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
            `;
            countQuery = `SELECT COUNT(*) AS total FROM ManualPenalties`;
            const [penalties, countResult] = await Promise.all([
                this.queryAsync(query, [offset, limit]),
                this.queryAsync(countQuery)
            ]);
            const totalItems = countResult[0]?.total || 0;
            const totalPages = Math.ceil(totalItems / limit);
            return { penalties, pagination: { currentPage: page, totalPages, totalItems, itemsPerPage: limit, hasNextPage: page < totalPages, hasPrevPage: page > 1 } };
        } else {
            query = `
                SELECT mp.*, u.fullName AS userName, c.fullName AS createdByName
                FROM ManualPenalties mp
                INNER JOIN Users u ON mp.userId = u.id
                INNER JOIN Users c ON mp.createdBy = c.id
                WHERE mp.userId = ? OR mp.createdBy = ?
                ORDER BY mp.createdAt DESC
                OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
            `;
            countQuery = `
                SELECT COUNT(*) AS total
                FROM ManualPenalties mp
                WHERE mp.userId = ? OR mp.createdBy = ?
            `;
            const [penalties, countResult] = await Promise.all([
                this.queryAsync(query, [userId, userId, offset, limit]),
                this.queryAsync(countQuery, [userId, userId])
            ]);
            const totalItems = countResult[0]?.total || 0;
            const totalPages = Math.ceil(totalItems / limit);
            return { penalties, pagination: { currentPage: page, totalPages, totalItems, itemsPerPage: limit, hasNextPage: page < totalPages, hasPrevPage: page > 1 } };
        }
    }

    async createManualPenalty(data, userId) {
        const { userId: targetUserId, percentage, reason } = data;
        if (!targetUserId || percentage === undefined || !reason) {
            throw new Error('User ID, percentage, and reason are required');
        }
        if (percentage < 0 || percentage > 100) {
            throw new Error('Percentage must be between 0 and 100');
        }

        const safeTargetUserId = this._toSafeInt(targetUserId, null, true);
        const safeCreatedBy = this._toSafeInt(userId, null, true);

        if (!(await this.userExists(safeTargetUserId))) {
            throw new Error(`User ${safeTargetUserId} does not exist`);
        }
        if (!(await this.userExists(safeCreatedBy))) {
            throw new Error(`Creator user ${safeCreatedBy} does not exist`);
        }

        const insertQuery = `
            INSERT INTO ManualPenalties (userId, percentage, reason, createdAt, createdBy, status)
            OUTPUT INSERTED.id
            VALUES (?, ?, ?, GETDATE(), ?, 'active')
        `;
        const result = await this.queryAsync(insertQuery, [safeTargetUserId, percentage, reason, safeCreatedBy]);
        const penaltyId = result[0]?.id;
        if (!penaltyId) throw new Error('Failed to create manual penalty');

        const creator = await this.queryAsync(`SELECT fullName FROM Users WHERE id = ?`, [safeCreatedBy]);
        const creatorName = creator[0]?.fullName || 'مشرف';
        await this._createNotification(
            safeTargetUserId,
            'penalty_issued',
            `تم تسجيل جزاء يدوي عليك`,
            `تم تسجيل جزاء يدوي بنسبة ${percentage}% بسبب: ${reason}`,
            'manual_penalty',
            penaltyId,
            { percentage, reason, createdBy: creatorName }
        );

        return { success: true, penaltyId };
    }

    async deleteManualPenalty(penaltyId, userId) {
        penaltyId = this._toSafeInt(penaltyId, null, true);
        userId = this._toSafeInt(userId, null, true);
        if (!penaltyId || !userId) throw new Error('Invalid penalty or user ID');

        const isGM = await this._isGeneralManager(userId);
        if (isGM) {
            await this.executeAsync(`DELETE FROM ManualPenalties WHERE id = ?`, [penaltyId]);
            return { success: true };
        }

        const check = await this.queryAsync(`
            SELECT 1 FROM ManualPenalties WHERE id = ? AND createdBy = ?
        `, [penaltyId, userId]);
        if (check.length === 0) throw new Error('Only creator can delete manual penalty');

        await this.executeAsync(`DELETE FROM ManualPenalties WHERE id = ?`, [penaltyId]);
        return { success: true };
    }

    // ================================ USERS ================================
    async getAllUsers() {
        const query = `
            SELECT id, username, fullName, email, phone, role, isActive, department, averageScore, profileImage
            FROM Users
            WHERE isActive = 1
            ORDER BY fullName
        `;
        const users = await this.queryAsync(query);
        return users.map(u => ({
            ...u,
            avatar: u.profileImage || `https://i.pravatar.cc/150?img=${u.id}`
        }));
    }

    // ================================ WEEKLY PERFORMANCE ================================
    async getWeeklyPerformance(userId) {
        userId = this._toSafeInt(userId, null, true);
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0,0,0,0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23,59,59,999);

        const query = `
            WITH DateRange AS (
                SELECT DATEADD(day, n, ?) AS date
                FROM (VALUES (0),(1),(2),(3),(4),(5),(6)) AS numbers(n)
            )
            SELECT 
                dr.date,
                COALESCE(completedCount, 0) AS completed,
                COALESCE(newCount, 0) AS newTasks
            FROM DateRange dr
            LEFT JOIN (
                SELECT 
                    CAST(tc.createdAt AS DATE) AS completedDate,
                    COUNT(*) AS completedCount
                FROM TaskComments tc
                INNER JOIN Tasks t ON tc.taskId = t.id
                WHERE (t.senderId = ? OR EXISTS (SELECT 1 FROM TaskAssignees WHERE taskId = t.id AND userId = ?))
                  AND tc.comment LIKE '%Progress updated to 100%'
                  AND tc.createdAt >= ? AND tc.createdAt <= ?
                GROUP BY CAST(tc.createdAt AS DATE)
            ) c ON dr.date = c.completedDate
            LEFT JOIN (
                SELECT 
                    CAST(t.createdAt AS DATE) AS createdDate,
                    COUNT(*) AS newCount
                FROM Tasks t
                WHERE (t.senderId = ? OR EXISTS (SELECT 1 FROM TaskAssignees WHERE taskId = t.id AND userId = ?))
                  AND t.createdAt >= ? AND t.createdAt <= ?
                GROUP BY CAST(t.createdAt AS DATE)
            ) n ON dr.date = n.createdDate
            ORDER BY dr.date
        `;
        const params = [startOfWeek, userId, userId, startOfWeek, endOfWeek, userId, userId, startOfWeek, endOfWeek];
        return await this.queryAsync(query, params);
    }
}

module.exports = new TasksService();