// Backend/services/admin/profile.service.js
const sql = require('msnodesqlv8');
const bcrypt = require('bcryptjs');

require('dotenv').config();
const sql = require('msnodesqlv8');
const connectionString = process.env.DB_CONNECTION_STRING;

class ProfileService {
    
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

    async executeAsync(query) {
        return new Promise((resolve, reject) => {
            sql.query(connectionString, query, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    escapeSql(str) {
        if (!str) return '';
        return str.replace(/'/g, "''");
    }

    // ========== جلب بيانات المستخدم ==========
    async getUserById(userId) {
        try {
            const query = `
                SELECT 
                    id,
                    username,
                    fullName,
                    email,
                    phone,
                    role,
                    department,
                    isActive,
                    lastLogin,
                    createdAt,
                    updatedAt,
                    profileImage,
                    averageScore
                FROM Users
                WHERE id = ${parseInt(userId)}
            `;
            const result = await this.queryAsync(query);
            if (!result || result.length === 0) return null;
            return result[0];
        } catch (error) {
            console.error('❌ ProfileService.getUserById error:', error);
            throw error;
        }
    }

    // ========== تحديث بيانات المستخدم ==========
    async updateUser(userId, userData, requestingUserRole = null) {
        try {
            const existing = await this.getUserById(userId);
            if (!existing) throw new Error('المستخدم غير موجود');

            const updateFields = [];

            if (userData.fullName !== undefined) {
                updateFields.push(`fullName = N'${this.escapeSql(userData.fullName)}'`);
            }
            if (userData.email !== undefined) {
                const emailCheck = await this.queryAsync(`
                    SELECT id FROM Users 
                    WHERE email = N'${this.escapeSql(userData.email)}' AND id != ${userId}
                `);
                if (emailCheck.length > 0) {
                    throw new Error('البريد الإلكتروني مستخدم بالفعل');
                }
                updateFields.push(`email = N'${this.escapeSql(userData.email)}'`);
            }
            if (userData.phone !== undefined) {
                updateFields.push(`phone = N'${this.escapeSql(userData.phone)}'`);
            }

            if (userData.role !== undefined) {
                if (requestingUserRole === 'مشرف_عام') {
                    updateFields.push(`role = N'${this.escapeSql(userData.role)}'`);
                } else {
                    console.warn(`User ${userId} with role ${requestingUserRole} attempted to change role, ignored.`);
                }
            }

            if (userData.department !== undefined) {
                if (requestingUserRole === 'مشرف_عام') {
                    updateFields.push(`department = N'${this.escapeSql(userData.department)}'`);
                } else {
                    console.warn(`User ${userId} with role ${requestingUserRole} attempted to change department, ignored.`);
                }
            }

            if (updateFields.length === 0) return existing;

            updateFields.push('updatedAt = GETDATE()');

            const query = `
                UPDATE Users
                SET ${updateFields.join(', ')}
                WHERE id = ${parseInt(userId)}
            `;

            await this.executeAsync(query);
            return await this.getUserById(userId);
        } catch (error) {
            console.error('❌ ProfileService.updateUser error:', error);
            throw error;
        }
    }

    // ========== تغيير كلمة المرور ==========
    async changePassword(userId, currentPassword, newPassword) {
        try {
            const query = `SELECT passwordHash FROM Users WHERE id = ${parseInt(userId)}`;
            const result = await this.queryAsync(query);
            if (!result || result.length === 0) {
                throw new Error('المستخدم غير موجود');
            }

            const user = result[0];
            const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!isValid) {
                throw new Error('كلمة المرور الحالية غير صحيحة');
            }

            const saltRounds = 10;
            const newHash = await bcrypt.hash(newPassword, saltRounds);

            const updateQuery = `
                UPDATE Users
                SET passwordHash = '${newHash}',
                    updatedAt = GETDATE()
                WHERE id = ${parseInt(userId)}
            `;
            await this.executeAsync(updateQuery);

            return true;
        } catch (error) {
            console.error('❌ ProfileService.changePassword error:', error);
            throw error;
        }
    }

    // ========== تحديث الصورة الشخصية ==========
    async updateProfileImage(userId, imagePath) {
        try {
            const query = `
                UPDATE Users
                SET profileImage = N'${this.escapeSql(imagePath)}',
                    updatedAt = GETDATE()
                WHERE id = ${parseInt(userId)}
            `;
            await this.executeAsync(query);
            return await this.getUserById(userId);
        } catch (error) {
            console.error('❌ ProfileService.updateProfileImage error:', error);
            throw error;
        }
    }

    // ========== جلب متوسط التقييم الإجمالي للمستخدم ==========
    async getUserOverallRating(userId) {
        try {
            const query = `
                SELECT AVG(CAST(tr.finalScore AS FLOAT)) as avgRating,
                       COUNT(tr.id) as totalRatings
                FROM TaskAssignees ta
                INNER JOIN Tasks t ON ta.taskId = t.id
                INNER JOIN TaskRatings tr ON t.id = tr.taskId
                WHERE ta.userId = ?
                  AND tr.ratedAt IS NOT NULL
            `;
            const result = await this.queryAsync(query, [parseInt(userId)]);
            const avgRating = result[0]?.avgRating !== null && result[0]?.avgRating !== undefined ? parseFloat(result[0].avgRating) : null;
            const totalRatings = result[0]?.totalRatings || 0;
            return { avgRating, totalRatings };
        } catch (error) {
            console.error('❌ ProfileService.getUserOverallRating error:', error);
            return { avgRating: null, totalRatings: 0 };
        }
    }

    // ========== جلب جميع مهام المستخدم مع تقييماتها ==========
    async getUserTasksWithRatings(userId) {
        try {
            const query = `
                SELECT 
                    t.id,
                    t.title,
                    t.description,
                    t.status,
                    t.priority,
                    t.progress,
                    t.dueDate,
                    t.completedAt,
                    t.createdAt,
                    tr.id as ratingId,
                    tr.qualityScore,
                    tr.difficultyWeight,
                    tr.timeScore,
                    tr.finalScore,
                    tr.ratedAt,
                    tr.notes as ratingNotes,
                    (SELECT COUNT(*) FROM TaskAssignees WHERE taskId = t.id) as assigneeCount
                FROM TaskAssignees ta
                INNER JOIN Tasks t ON ta.taskId = t.id
                LEFT JOIN TaskRatings tr ON t.id = tr.taskId
                WHERE ta.userId = ?
                ORDER BY t.createdAt DESC
            `;
            const tasks = await this.queryAsync(query, [parseInt(userId)]);
            
            const tasksMap = new Map();
            for (const task of tasks) {
                if (!tasksMap.has(task.id)) {
                    tasksMap.set(task.id, {
                        id: task.id,
                        title: task.title,
                        description: task.description,
                        status: task.status,
                        priority: task.priority,
                        progress: task.progress,
                        dueDate: task.dueDate,
                        completedAt: task.completedAt,
                        createdAt: task.createdAt,
                        assigneeCount: task.assigneeCount,
                        rating: null
                    });
                }
                if (task.ratingId && tasksMap.get(task.id).rating === null) {
                    tasksMap.get(task.id).rating = {
                        id: task.ratingId,
                        qualityScore: task.qualityScore,
                        difficultyWeight: task.difficultyWeight,
                        timeScore: task.timeScore,
                        finalScore: task.finalScore,
                        ratedAt: task.ratedAt,
                        notes: task.ratingNotes
                    };
                }
            }
            
            return Array.from(tasksMap.values());
        } catch (error) {
            console.error('❌ ProfileService.getUserTasksWithRatings error:', error);
            return [];
        }
    }

    // ========== جلب جميع جزاءات المستخدم (مالية وغير مالية) ==========
    async getUserPenalties(userId) {
        try {
            // 1. الجزاءات العادية (غير مالية) من جدول Penalties
            const nonFinancialQuery = `
                SELECT 
                    'non-financial' as type,
                    id,
                    taskId,
                    userId,
                    NULL as percentage,
                    reason,
                    issuedAt,
                    resolvedAt,
                    status
                FROM Penalties
                WHERE userId = ${parseInt(userId)}
                ORDER BY issuedAt DESC
            `;
            const nonFinancialPenalties = await this.queryAsync(nonFinancialQuery);
            
            // 2. الجزاءات المالية (بخصم نسبة مئوية) من جدول ManualPenalties
            const financialQuery = `
                SELECT 
                    'financial' as type,
                    id,
                    NULL as taskId,
                    userId,
                    percentage,
                    reason,
                    createdAt as issuedAt,
                    NULL as resolvedAt,
                    status
                FROM ManualPenalties
                WHERE userId = ${parseInt(userId)}
                ORDER BY createdAt DESC
            `;
            const financialPenalties = await this.queryAsync(financialQuery);
            
            // دمج النتيجتين في مصفوفة واحدة
            const allPenalties = [...nonFinancialPenalties, ...financialPenalties];
            
            // ترتيب تنازلي حسب تاريخ الإصدار
            allPenalties.sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));
            
            return allPenalties;
        } catch (error) {
            console.error('❌ ProfileService.getUserPenalties error:', error);
            return [];
        }
    }
}

module.exports = new ProfileService();