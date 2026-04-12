const sql = require('msnodesqlv8');

require('dotenv').config();
const sql = require('msnodesqlv8');
const connectionString = process.env.DB_CONNECTION_STRING;

class StatsService {
    async queryAsync(query, params = []) {
        return new Promise((resolve, reject) => {
            if (params && params.length > 0) {
                sql.query(connectionString, query, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                });
            } else {
                sql.query(connectionString, query, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                });
            }
        });
    }

    escapeSql(str) {
        if (!str) return '';
        return str.replace(/'/g, "''");
    }

    // جلب الأقسام من Users بأيدي ديناميكية
    async getDepartmentsWithIds() {
        const query = `
            SELECT DISTINCT department as name
            FROM Users
            WHERE department IS NOT NULL AND department != '' AND isActive = 1
            ORDER BY department
        `;
        const rows = await this.queryAsync(query);
        return rows.map((row, idx) => ({ id: idx + 1, name: row.name }));
    }

    async getAllDepartments() {
        return await this.getDepartmentsWithIds();
    }

    async getDepartmentById(deptId) {
        const departments = await this.getDepartmentsWithIds();
        const dept = departments.find(d => d.id == deptId);
        if (!dept) return null;
        return {
            id: dept.id,
            name: dept.name,
            managerId: null,
            managerName: null,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }

    async getDepartmentNameFromId(deptId) {
        const departments = await this.getDepartmentsWithIds();
        const dept = departments.find(d => d.id == deptId);
        return dept ? dept.name : null;
    }

    // ========== دوال الجزاءات اليدوية مع فلتر التاريخ ==========
    async getEmployeeManualPenalties(userId, startDate, endDate) {
        let query = `
            SELECT id, percentage, reason, createdAt, status
            FROM ManualPenalties
            WHERE userId = ? AND status = 'active'
        `;
        const params = [userId];
        if (startDate && endDate) {
            query += ` AND CAST(createdAt AS DATE) BETWEEN CAST(? AS DATE) AND CAST(? AS DATE)`;
            params.push(startDate, endDate);
        }
        query += ` ORDER BY createdAt DESC`;
        return await this.queryAsync(query, params);
    }

    async getManualPenaltiesSumPercentage(userId, startDate, endDate) {
        let query = `
            SELECT ISNULL(SUM(percentage), 0) as totalPercentage
            FROM ManualPenalties
            WHERE userId = ? AND status = 'active'
        `;
        const params = [userId];
        if (startDate && endDate) {
            query += ` AND CAST(createdAt AS DATE) BETWEEN CAST(? AS DATE) AND CAST(? AS DATE)`;
            params.push(startDate, endDate);
        }
        const result = await this.queryAsync(query, params);
        return result[0]?.totalPercentage || 0;
    }

    // ========== دوال الجزاءات العادية مع فلتر التاريخ ==========
    async getEmployeeRegularPenaltiesCount(userId, startDate, endDate) {
        let query = `
            SELECT COUNT(*) as count
            FROM Penalties
            WHERE userId = ? AND status = 'active'
        `;
        const params = [userId];
        if (startDate && endDate) {
            query += ` AND CAST(issuedAt AS DATE) BETWEEN CAST(? AS DATE) AND CAST(? AS DATE)`;
            params.push(startDate, endDate);
        }
        const result = await this.queryAsync(query, params);
        return result[0]?.count || 0;
    }

    async getEmployeeRegularPenalties(userId, startDate, endDate) {
        let query = `
            SELECT id, amount, reason, issuedAt, resolvedAt, status
            FROM Penalties
            WHERE userId = ? AND status = 'active'
        `;
        const params = [userId];
        if (startDate && endDate) {
            query += ` AND CAST(issuedAt AS DATE) BETWEEN CAST(? AS DATE) AND CAST(? AS DATE)`;
            params.push(startDate, endDate);
        }
        query += ` ORDER BY issuedAt DESC`;
        return await this.queryAsync(query, params);
    }

    // إحصائيات كل الأقسام (مع فلتر التاريخ)
    async getAllDepartmentsStats(startDate, endDate) {
        const departments = await this.getDepartmentsWithIds();
        const stats = [];

        for (const dept of departments) {
            const deptName = this.escapeSql(dept.name);

            // عدد الموظفين
            const empCountQuery = `SELECT COUNT(*) as count FROM Users WHERE department = ? AND isActive = 1`;
            const empCountResult = await this.queryAsync(empCountQuery, [deptName]);
            const employeeCount = empCountResult[0]?.count || 0;

            // إحصائيات المهام مع الفلتر
            let tasksQuery = `
                SELECT 
                    COUNT(DISTINCT CASE 
                        WHEN t.status IN ('done', 'archived') 
                             AND (t.dueDate IS NULL OR CAST(t.completedAt AS DATE) <= CAST(t.dueDate AS DATE))
                        THEN t.id 
                    END) as tasksOnTime,
                    COUNT(DISTINCT CASE 
                        WHEN t.status IN ('in-progress', 'review', 'todo')
                             AND (t.dueDate IS NULL OR CAST(t.dueDate AS DATE) >= CAST(GETDATE() AS DATE))
                             AND t.status NOT IN ('done', 'archived')
                        THEN t.id 
                    END) as tasksInProgress,
                    COUNT(DISTINCT CASE 
                        WHEN (t.status IN ('done', 'archived') 
                              AND t.dueDate IS NOT NULL 
                              AND CAST(t.completedAt AS DATE) > CAST(t.dueDate AS DATE))
                             OR (t.status IN ('in-progress', 'review', 'todo')
                                 AND t.dueDate IS NOT NULL 
                                 AND CAST(t.dueDate AS DATE) < CAST(GETDATE() AS DATE))
                        THEN t.id 
                    END) as tasksOverdue
                FROM Tasks t
                INNER JOIN TaskAssignees ta ON t.id = ta.taskId
                INNER JOIN Users u ON ta.userId = u.id
                WHERE u.department = ? AND u.isActive = 1
            `;
            const queryParams = [deptName];
            if (startDate && endDate) {
                tasksQuery += ` AND CAST(t.dueDate AS DATE) BETWEEN CAST(? AS DATE) AND CAST(? AS DATE)`;
                queryParams.push(startDate, endDate);
            }
            const tasksResult = await this.queryAsync(tasksQuery, queryParams);
            const row = tasksResult[0] || {};

            stats.push({
                id: dept.id,
                name: dept.name,
                employeeCount: employeeCount,
                tasksOnTime: row.tasksOnTime || 0,
                tasksInProgress: row.tasksInProgress || 0,
                tasksOverdue: row.tasksOverdue || 0,
                tasksTodo: 0,
                tasksReview: 0
            });
        }
        return stats;
    }

    // إحصائيات عامة (الكروت العلوية)
    async getOverallStats(startDate, endDate) {
        const totalEmployeesQuery = `SELECT COUNT(*) as total FROM Users WHERE isActive = 1`;
        const empResult = await this.queryAsync(totalEmployeesQuery);
        const totalEmployees = empResult[0]?.total || 0;

        let statsQuery = `
            SELECT 
                COUNT(DISTINCT CASE 
                    WHEN t.status IN ('done', 'archived') 
                         AND (t.dueDate IS NULL OR CAST(t.completedAt AS DATE) <= CAST(t.dueDate AS DATE))
                    THEN t.id 
                END) as totalTasksOntime,
                COUNT(DISTINCT CASE 
                    WHEN t.status IN ('in-progress', 'review', 'todo')
                         AND (t.dueDate IS NULL OR CAST(t.dueDate AS DATE) >= CAST(GETDATE() AS DATE))
                         AND t.status NOT IN ('done', 'archived')
                    THEN t.id 
                END) as totalTasksProgress,
                COUNT(DISTINCT CASE 
                    WHEN (t.status IN ('done', 'archived') 
                          AND t.dueDate IS NOT NULL 
                          AND CAST(t.completedAt AS DATE) > CAST(t.dueDate AS DATE))
                         OR (t.status IN ('in-progress', 'review', 'todo')
                             AND t.dueDate IS NOT NULL 
                             AND CAST(t.dueDate AS DATE) < CAST(GETDATE() AS DATE))
                    THEN t.id 
                END) as totalTasksOverdue
            FROM Tasks t
            INNER JOIN TaskAssignees ta ON t.id = ta.taskId
            INNER JOIN Users u ON ta.userId = u.id
            WHERE u.isActive = 1
        `;
        const queryParams = [];
        if (startDate && endDate) {
            statsQuery += ` AND CAST(t.dueDate AS DATE) BETWEEN CAST(? AS DATE) AND CAST(? AS DATE)`;
            queryParams.push(startDate, endDate);
        }
        const statsResult = await this.queryAsync(statsQuery, queryParams);
        const row = statsResult[0] || {};

        return {
            totalEmployees: totalEmployees,
            totalTasksOntime: row.totalTasksOntime || 0,
            totalTasksProgress: row.totalTasksProgress || 0,
            totalTasksOverdue: row.totalTasksOverdue || 0
        };
    }

    // موظفو قسم معين مع إحصائياتهم (مع فلتر التاريخ والتقييم المحسوب من الفترة)
    async getEmployeesByDepartment(deptId, startDate, endDate) {
        const deptName = await this.getDepartmentNameFromId(deptId);
        if (!deptName) return [];

        // استعلام واحد يجلب الموظفين وإحصائيات مهامهم وتقييمهم خلال الفترة
        let query = `
            SELECT 
                u.id,
                u.fullName,
                u.email,
                u.phone,
                u.role,
                u.profileImage,
                ISNULL((
                    SELECT AVG(CAST(tr.finalScore AS FLOAT))
                    FROM TaskAssignees ta2
                    INNER JOIN Tasks t ON ta2.taskId = t.id
                    INNER JOIN TaskRatings tr ON t.id = tr.taskId
                    WHERE ta2.userId = u.id
                      AND (tr.ratedAt IS NOT NULL)
                      ${startDate && endDate ? 'AND CAST(tr.ratedAt AS DATE) BETWEEN CAST(? AS DATE) AND CAST(? AS DATE)' : ''}
                ), NULL) as ratingFromPeriod,
                ISNULL((
                    SELECT COUNT(DISTINCT t.id)
                    FROM TaskAssignees ta2
                    INNER JOIN Tasks t ON ta2.taskId = t.id
                    WHERE ta2.userId = u.id
                      AND t.status IN ('done', 'archived')
                      AND (t.dueDate IS NULL OR CAST(t.completedAt AS DATE) <= CAST(t.dueDate AS DATE))
                      ${startDate && endDate ? 'AND CAST(t.dueDate AS DATE) BETWEEN CAST(? AS DATE) AND CAST(? AS DATE)' : ''}
                ), 0) as tasksOnTime,
                ISNULL((
                    SELECT COUNT(DISTINCT t.id)
                    FROM TaskAssignees ta2
                    INNER JOIN Tasks t ON ta2.taskId = t.id
                    WHERE ta2.userId = u.id
                      AND t.status IN ('in-progress', 'review', 'todo')
                      AND (t.dueDate IS NULL OR CAST(t.dueDate AS DATE) >= CAST(GETDATE() AS DATE))
                      ${startDate && endDate ? 'AND CAST(t.dueDate AS DATE) BETWEEN CAST(? AS DATE) AND CAST(? AS DATE)' : ''}
                ), 0) as tasksInProgress,
                ISNULL((
                    SELECT COUNT(DISTINCT t.id)
                    FROM TaskAssignees ta2
                    INNER JOIN Tasks t ON ta2.taskId = t.id
                    WHERE ta2.userId = u.id
                      AND (
                          (t.status IN ('done', 'archived') AND t.dueDate IS NOT NULL AND CAST(t.completedAt AS DATE) > CAST(t.dueDate AS DATE))
                          OR
                          (t.status IN ('in-progress', 'review', 'todo') AND t.dueDate IS NOT NULL AND CAST(t.dueDate AS DATE) < CAST(GETDATE() AS DATE))
                      )
                      ${startDate && endDate ? 'AND CAST(t.dueDate AS DATE) BETWEEN CAST(? AS DATE) AND CAST(? AS DATE)' : ''}
                ), 0) as tasksOverdue
            FROM Users u
            WHERE u.department = ? AND u.isActive = 1
            ORDER BY u.fullName
        `;

        let queryParams = [];
        if (startDate && endDate) {
            // ratingFromPeriod (2 تواريخ) + tasksOnTime (2) + tasksInProgress (2) + tasksOverdue (2) + departmentName
            queryParams = [startDate, endDate, startDate, endDate, startDate, endDate, startDate, endDate, deptName];
        } else {
            queryParams = [deptName];
        }

        try {
            const result = await this.queryAsync(query, queryParams);
            // إضافة manual penalties و regular penalties لكل موظف مع الفلتر
            const employeesWithPenalties = [];
            for (const row of result) {
                const manualTotalPercentage = await this.getManualPenaltiesSumPercentage(row.id, startDate, endDate);
                const regularPenaltiesCount = await this.getEmployeeRegularPenaltiesCount(row.id, startDate, endDate);
                employeesWithPenalties.push({
                    ...row,
                    rating: row.ratingFromPeriod !== null ? parseFloat(row.ratingFromPeriod) : null,
                    manualPenaltiesTotalPercentage: manualTotalPercentage,
                    penaltiesCount: regularPenaltiesCount
                });
            }
            return employeesWithPenalties;
        } catch (error) {
            console.error('❌ Error in getEmployeesByDepartment:', error);
            // Fallback: جلب بدون فلتر تاريخ مع احتساب الجزاءات حسب الفترة فقط (لن يتم تطبيق الفلتر على المهام ولكن سيتم على الجزاءات)
            const fallbackQuery = `
                SELECT 
                    u.id, u.fullName, u.email, u.phone, u.role, u.profileImage,
                    NULL as rating,
                    ISNULL((SELECT COUNT(DISTINCT t.id) FROM TaskAssignees ta2 INNER JOIN Tasks t ON ta2.taskId = t.id WHERE ta2.userId = u.id AND t.status IN ('done', 'archived') AND (t.dueDate IS NULL OR CAST(t.completedAt AS DATE) <= CAST(t.dueDate AS DATE))), 0) as tasksOnTime,
                    ISNULL((SELECT COUNT(DISTINCT t.id) FROM TaskAssignees ta2 INNER JOIN Tasks t ON ta2.taskId = t.id WHERE ta2.userId = u.id AND t.status IN ('in-progress', 'review', 'todo') AND (t.dueDate IS NULL OR CAST(t.dueDate AS DATE) >= CAST(GETDATE() AS DATE))), 0) as tasksInProgress,
                    ISNULL((SELECT COUNT(DISTINCT t.id) FROM TaskAssignees ta2 INNER JOIN Tasks t ON ta2.taskId = t.id WHERE ta2.userId = u.id AND ((t.status IN ('done', 'archived') AND t.dueDate IS NOT NULL AND CAST(t.completedAt AS DATE) > CAST(t.dueDate AS DATE)) OR (t.status IN ('in-progress', 'review', 'todo') AND t.dueDate IS NOT NULL AND CAST(t.dueDate AS DATE) < CAST(GETDATE() AS DATE)))), 0) as tasksOverdue
                FROM Users u
                WHERE u.department = ? AND u.isActive = 1
                ORDER BY u.fullName
            `;
            const fallbackResult = await this.queryAsync(fallbackQuery, [deptName]);
            const employeesWithPenaltiesFallback = [];
            for (const row of fallbackResult) {
                const manualTotalPercentage = await this.getManualPenaltiesSumPercentage(row.id, startDate, endDate);
                const regularPenaltiesCount = await this.getEmployeeRegularPenaltiesCount(row.id, startDate, endDate);
                employeesWithPenaltiesFallback.push({
                    ...row,
                    rating: null,
                    manualPenaltiesTotalPercentage: manualTotalPercentage,
                    penaltiesCount: regularPenaltiesCount
                });
            }
            return employeesWithPenaltiesFallback;
        }
    }

    // إحصائيات مهام قسم معين (للرسم البياني)
    async getDepartmentTasksStats(deptId, startDate, endDate) {
        const deptName = await this.getDepartmentNameFromId(deptId);
        if (!deptName) return { onTime: 0, inProgress: 0, overdue: 0 };

        let query = `
            SELECT 
                COUNT(DISTINCT CASE 
                    WHEN t.status IN ('done', 'archived') 
                         AND (t.dueDate IS NULL OR CAST(t.completedAt AS DATE) <= CAST(t.dueDate AS DATE))
                    THEN t.id 
                END) as onTime,
                COUNT(DISTINCT CASE 
                    WHEN t.status IN ('in-progress', 'review', 'todo')
                         AND (t.dueDate IS NULL OR CAST(t.dueDate AS DATE) >= CAST(GETDATE() AS DATE))
                    THEN t.id 
                END) as inProgress,
                COUNT(DISTINCT CASE 
                    WHEN (t.status IN ('done', 'archived') 
                          AND t.dueDate IS NOT NULL 
                          AND CAST(t.completedAt AS DATE) > CAST(t.dueDate AS DATE))
                         OR (t.status IN ('in-progress', 'review', 'todo')
                             AND t.dueDate IS NOT NULL 
                             AND CAST(t.dueDate AS DATE) < CAST(GETDATE() AS DATE))
                    THEN t.id 
                END) as overdue
            FROM Tasks t
            INNER JOIN TaskAssignees ta ON t.id = ta.taskId
            INNER JOIN Users u ON ta.userId = u.id
            WHERE u.department = ? AND u.isActive = 1
        `;
        const queryParams = [deptName];
        if (startDate && endDate) {
            query += ` AND CAST(t.dueDate AS DATE) BETWEEN CAST(? AS DATE) AND CAST(? AS DATE)`;
            queryParams.push(startDate, endDate);
        }
        const result = await this.queryAsync(query, queryParams);
        const row = result[0] || {};
        return {
            onTime: row.onTime || 0,
            inProgress: row.inProgress || 0,
            overdue: row.overdue || 0,
            todo: 0,
            review: 0
        };
    }

    // أفضل الموظفين حسب التقييم (مع فلتر التاريخ – يعتمد على تقييمات الفترة فقط)
    async getTopEmployees(limit = 5, startDate, endDate) {
        let query;
        let queryParams = [];

        if (startDate && endDate) {
            query = `
                SELECT TOP ${parseInt(limit)}
                    u.id,
                    u.fullName,
                    u.email,
                    u.role,
                    AVG(CAST(tr.finalScore AS FLOAT)) as rating,
                    u.department as departmentName,
                    COUNT(DISTINCT CASE WHEN t.status IN ('done', 'archived') AND (t.dueDate IS NULL OR CAST(t.completedAt AS DATE) <= CAST(t.dueDate AS DATE)) THEN t.id END) as tasksCompleted,
                    COUNT(DISTINCT CASE WHEN (t.status IN ('done', 'archived') AND t.dueDate IS NOT NULL AND CAST(t.completedAt AS DATE) > CAST(t.dueDate AS DATE)) OR (t.status IN ('in-progress', 'review', 'todo') AND t.dueDate IS NOT NULL AND CAST(t.dueDate AS DATE) < CAST(GETDATE() AS DATE)) THEN t.id END) as tasksOverdue
                FROM Users u
                LEFT JOIN TaskAssignees ta ON u.id = ta.userId
                LEFT JOIN Tasks t ON ta.taskId = t.id
                LEFT JOIN TaskRatings tr ON t.id = tr.taskId
                WHERE u.isActive = 1
                  AND tr.ratedAt IS NOT NULL
                  AND CAST(tr.ratedAt AS DATE) BETWEEN CAST(? AS DATE) AND CAST(? AS DATE)
                GROUP BY u.id, u.fullName, u.email, u.role, u.department
                HAVING AVG(CAST(tr.finalScore AS FLOAT)) IS NOT NULL
                ORDER BY AVG(CAST(tr.finalScore AS FLOAT)) DESC, tasksCompleted DESC
            `;
            queryParams = [startDate, endDate];
        } else {
            // بدون فلتر: استخدام averageScore المخزن
            query = `
                SELECT TOP ${parseInt(limit)}
                    u.id,
                    u.fullName,
                    u.email,
                    u.role,
                    ISNULL(u.averageScore, 0) as rating,
                    u.department as departmentName,
                    ISNULL((SELECT COUNT(DISTINCT t.id) FROM TaskAssignees ta INNER JOIN Tasks t ON ta.taskId = t.id WHERE ta.userId = u.id AND t.status IN ('done', 'archived') AND (t.dueDate IS NULL OR CAST(t.completedAt AS DATE) <= CAST(t.dueDate AS DATE))), 0) as tasksCompleted,
                    ISNULL((SELECT COUNT(DISTINCT t.id) FROM TaskAssignees ta INNER JOIN Tasks t ON ta.taskId = t.id WHERE ta.userId = u.id AND ((t.status IN ('done', 'archived') AND t.dueDate IS NOT NULL AND CAST(t.completedAt AS DATE) > CAST(t.dueDate AS DATE)) OR (t.status IN ('in-progress', 'review', 'todo') AND t.dueDate IS NOT NULL AND CAST(t.dueDate AS DATE) < CAST(GETDATE() AS DATE)))), 0) as tasksOverdue
                FROM Users u
                WHERE u.isActive = 1 AND u.averageScore IS NOT NULL
                ORDER BY u.averageScore DESC, tasksCompleted DESC
            `;
        }

        return await this.queryAsync(query, queryParams);
    }

    // تفاصيل موظف معين (مع المهام والجزاءات والتقييمات – التقييم والجزاءات تعتمد على الفترة)
    async getEmployeeDetails(employeeId, startDate, endDate) {
        // معلومات الموظف الأساسية
        const employeeQuery = `
            SELECT 
                u.id,
                u.fullName,
                u.email,
                u.phone,
                u.role,
                u.profileImage,
                u.department as departmentName
            FROM Users u
            WHERE u.id = ?
        `;
        const employeeResult = await this.queryAsync(employeeQuery, [parseInt(employeeId)]);
        const employee = employeeResult[0];
        if (!employee) return null;

        // حساب متوسط التقييم خلال الفترة (إن وجد)
        let ratingQuery = `
            SELECT AVG(CAST(tr.finalScore AS FLOAT)) as avgRating
            FROM TaskAssignees ta
            INNER JOIN Tasks t ON ta.taskId = t.id
            INNER JOIN TaskRatings tr ON t.id = tr.taskId
            WHERE ta.userId = ?
              AND tr.ratedAt IS NOT NULL
        `;
        const ratingParams = [parseInt(employeeId)];
        if (startDate && endDate) {
            ratingQuery += ` AND CAST(tr.ratedAt AS DATE) BETWEEN CAST(? AS DATE) AND CAST(? AS DATE)`;
            ratingParams.push(startDate, endDate);
        }
        const ratingResult = await this.queryAsync(ratingQuery, ratingParams);
        const avgRating = ratingResult[0]?.avgRating !== undefined && ratingResult[0]?.avgRating !== null ? parseFloat(ratingResult[0].avgRating) : null;
        employee.rating = avgRating;

        // إحصائيات المهام خلال الفترة
        let statsQuery = `
            SELECT 
                COUNT(DISTINCT CASE 
                    WHEN t.status IN ('done', 'archived') 
                         AND (t.dueDate IS NULL OR CAST(t.completedAt AS DATE) <= CAST(t.dueDate AS DATE))
                    THEN t.id 
                END) as tasksOnTime,
                COUNT(DISTINCT CASE 
                    WHEN t.status IN ('in-progress', 'review', 'todo')
                         AND (t.dueDate IS NULL OR CAST(t.dueDate AS DATE) >= CAST(GETDATE() AS DATE))
                    THEN t.id 
                END) as tasksInProgress,
                COUNT(DISTINCT CASE 
                    WHEN (t.status IN ('done', 'archived') 
                          AND t.dueDate IS NOT NULL 
                          AND CAST(t.completedAt AS DATE) > CAST(t.dueDate AS DATE))
                         OR (t.status IN ('in-progress', 'review', 'todo')
                             AND t.dueDate IS NOT NULL 
                             AND CAST(t.dueDate AS DATE) < CAST(GETDATE() AS DATE))
                    THEN t.id 
                END) as tasksOverdue
            FROM TaskAssignees ta
            INNER JOIN Tasks t ON ta.taskId = t.id
            WHERE ta.userId = ?
        `;
        const statsParams = [parseInt(employeeId)];
        if (startDate && endDate) {
            statsQuery += ` AND CAST(t.dueDate AS DATE) BETWEEN CAST(? AS DATE) AND CAST(? AS DATE)`;
            statsParams.push(startDate, endDate);
        }
        const statsResult = await this.queryAsync(statsQuery, statsParams);
        const row = statsResult[0] || {};
        employee.tasks = {
            tasksOnTime: row.tasksOnTime || 0,
            tasksInProgress: row.tasksInProgress || 0,
            tasksOverdue: row.tasksOverdue || 0,
            tasksTodo: 0,
            tasksReview: 0
        };

        // قائمة المهام مع حالتها (خلال الفترة)
        let tasksQuery = `
            SELECT 
                t.id,
                t.title,
                t.status,
                t.dueDate,
                t.completedAt,
                t.updatedAt,
                t.priority,
                t.progress,
                CASE 
                    WHEN (t.status IN ('done', 'archived')) AND (t.dueDate IS NULL OR CAST(t.completedAt AS DATE) <= CAST(t.dueDate AS DATE)) THEN 'ontime'
                    WHEN (t.status IN ('done', 'archived')) AND t.dueDate IS NOT NULL AND CAST(t.completedAt AS DATE) > CAST(t.dueDate AS DATE) THEN 'overdue'
                    WHEN t.status IN ('in-progress', 'review', 'todo') AND (t.dueDate IS NOT NULL AND CAST(t.dueDate AS DATE) < CAST(GETDATE() AS DATE)) THEN 'overdue'
                    ELSE 'inProgress'
                END as statusKey,
                CASE 
                    WHEN (t.status IN ('done', 'archived')) AND (t.dueDate IS NULL OR CAST(t.completedAt AS DATE) <= CAST(t.dueDate AS DATE)) THEN N'مكتملة في الموعد'
                    WHEN (t.status IN ('done', 'archived')) AND t.dueDate IS NOT NULL AND CAST(t.completedAt AS DATE) > CAST(t.dueDate AS DATE) THEN N'مكتملة متأخرة'
                    WHEN t.status IN ('in-progress', 'review', 'todo') AND (t.dueDate IS NOT NULL AND CAST(t.dueDate AS DATE) < CAST(GETDATE() AS DATE)) THEN N'متأخرة (غير مكتملة)'
                    ELSE N'قيد التنفيذ'
                END as statusText
            FROM TaskAssignees ta
            INNER JOIN Tasks t ON ta.taskId = t.id
            WHERE ta.userId = ?
        `;
        const tasksParams = [parseInt(employeeId)];
        if (startDate && endDate) {
            tasksQuery += ` AND CAST(t.dueDate AS DATE) BETWEEN CAST(? AS DATE) AND CAST(? AS DATE)`;
            tasksParams.push(startDate, endDate);
        }
        tasksQuery += ` ORDER BY t.dueDate ASC`;
        employee.tasksList = await this.queryAsync(tasksQuery, tasksParams);

        // الجزاءات العادية مع فلتر التاريخ (issuedAt)
        const regularPenalties = await this.getEmployeeRegularPenalties(parseInt(employeeId), startDate, endDate);
        employee.penalties = regularPenalties;
        employee.penaltiesCount = regularPenalties.length;

        // الجزاءات اليدوية مع الفلتر
        const manualPenalties = await this.getEmployeeManualPenalties(parseInt(employeeId), startDate, endDate);
        employee.manualPenalties = manualPenalties;
        employee.manualPenaltiesTotalPercentage = await this.getManualPenaltiesSumPercentage(parseInt(employeeId), startDate, endDate);

        // التقييمات التفصيلية (مع فلتر تاريخ إن وجد)
        let ratingsQuery = `
            SELECT tr.id, tr.qualityScore, tr.timeScore, tr.finalScore, tr.ratedAt, tr.notes, t.title as taskTitle
            FROM TaskRatings tr
            INNER JOIN Tasks t ON tr.taskId = t.id
            INNER JOIN TaskAssignees ta ON t.id = ta.taskId
            WHERE ta.userId = ?
        `;
        const ratingsParams = [parseInt(employeeId)];
        if (startDate && endDate) {
            ratingsQuery += ` AND CAST(tr.ratedAt AS DATE) BETWEEN CAST(? AS DATE) AND CAST(? AS DATE)`;
            ratingsParams.push(startDate, endDate);
        }
        ratingsQuery += ` ORDER BY tr.ratedAt DESC`;
        employee.ratings = await this.queryAsync(ratingsQuery, ratingsParams);

        return employee;
    }

    // بيانات الرسم البياني (دونات)
    async getTasksChartData(departmentId, startDate, endDate) {
        let deptCondition = '';
        const queryParams = [];

        if (departmentId && departmentId !== 'all') {
            const deptName = await this.getDepartmentNameFromId(parseInt(departmentId));
            if (deptName) {
                deptCondition = ` AND u.department = ?`;
                queryParams.push(deptName);
            }
        }

        let query = `
            SELECT 
                COUNT(DISTINCT CASE 
                    WHEN t.status IN ('done', 'archived') 
                         AND (t.dueDate IS NULL OR CAST(t.completedAt AS DATE) <= CAST(t.dueDate AS DATE))
                    THEN t.id 
                END) as completed,
                COUNT(DISTINCT CASE 
                    WHEN t.status IN ('in-progress', 'review', 'todo')
                         AND (t.dueDate IS NULL OR CAST(t.dueDate AS DATE) >= CAST(GETDATE() AS DATE))
                    THEN t.id 
                END) as inProgress,
                COUNT(DISTINCT CASE 
                    WHEN (t.status IN ('done', 'archived') 
                          AND t.dueDate IS NOT NULL 
                          AND CAST(t.completedAt AS DATE) > CAST(t.dueDate AS DATE))
                         OR (t.status IN ('in-progress', 'review', 'todo')
                             AND t.dueDate IS NOT NULL 
                             AND CAST(t.dueDate AS DATE) < CAST(GETDATE() AS DATE))
                    THEN t.id 
                END) as overdue
            FROM Tasks t
            INNER JOIN TaskAssignees ta ON t.id = ta.taskId
            INNER JOIN Users u ON ta.userId = u.id
            WHERE u.isActive = 1
            ${deptCondition}
        `;
        if (startDate && endDate) {
            query += ` AND CAST(t.dueDate AS DATE) BETWEEN CAST(? AS DATE) AND CAST(? AS DATE)`;
            queryParams.push(startDate, endDate);
        }
        const result = await this.queryAsync(query, queryParams);
        const row = result[0] || {};
        return {
            completed: row.completed || 0,
            inProgress: row.inProgress || 0,
            overdue: row.overdue || 0
        };
    }
}

module.exports = new StatsService();