// Backend/services/admin/email.service.js
const sql = require('msnodesqlv8');

require('dotenv').config();
const sql = require('msnodesqlv8');
const connectionString = process.env.DB_CONNECTION_STRING;

class EmailService {
    async queryAsync(query, params = {}) {
        return new Promise((resolve, reject) => {
            sql.query(connectionString, query, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
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

    async getUserById(userId) {
        const query = `SELECT id, username, fullName, email, phone, role FROM Users WHERE id = ${parseInt(userId)}`;
        const result = await this.queryAsync(query);
        return result[0] || null;
    }

    // جلب رسائل المستخدم حسب المجلد (مع التصفية الصحيحة)
    async getUserEmails(userId, folder = 'inbox', page = 1, limit = 25) {
        try {
            const offset = (page - 1) * limit;
            let query = '';
            let countQuery = '';

            if (folder === 'inbox') {
                query = `
                    SELECT 
                        e.id, e.subject, e.body, e.createdAt, e.hasAttachments,
                        s.id as senderId, s.fullName as senderName, s.email as senderEmail,
                        er.recipientType, er.isRead, er.readAt,
                        (SELECT COUNT(*) FROM EmailAttachments WHERE emailId = e.id) as attachmentsCount
                    FROM Emails e
                    INNER JOIN EmailRecipients er ON e.id = er.emailId
                    INNER JOIN Users s ON e.senderId = s.id
                    WHERE er.recipientId = ${parseInt(userId)}
                      AND e.isDraft = 0
                      AND e.folder != 'trash'
                    ORDER BY e.createdAt DESC
                    OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
                `;
                countQuery = `
                    SELECT COUNT(*) as total
                    FROM EmailRecipients er
                    INNER JOIN Emails e ON er.emailId = e.id
                    WHERE er.recipientId = ${parseInt(userId)}
                      AND e.isDraft = 0
                      AND e.folder != 'trash'
                `;
            } else if (folder === 'sent') {
                query = `
                    SELECT 
                        e.id, e.subject, e.body, e.createdAt, e.hasAttachments,
                        s.id as senderId, s.fullName as senderName, s.email as senderEmail,
                        NULL as recipientType, NULL as isRead, NULL as readAt,
                        (SELECT COUNT(*) FROM EmailAttachments WHERE emailId = e.id) as attachmentsCount
                    FROM Emails e
                    INNER JOIN Users s ON e.senderId = s.id
                    WHERE e.senderId = ${parseInt(userId)}
                      AND e.isDraft = 0
                      AND e.folder = 'sent'
                    ORDER BY e.createdAt DESC
                    OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
                `;
                countQuery = `
                    SELECT COUNT(*) as total
                    FROM Emails e
                    WHERE e.senderId = ${parseInt(userId)}
                      AND e.isDraft = 0
                      AND e.folder = 'sent'
                `;
            } else if (folder === 'drafts') {
                query = `
                    SELECT 
                        e.id, e.subject, e.body, e.createdAt, e.hasAttachments,
                        s.id as senderId, s.fullName as senderName, s.email as senderEmail,
                        NULL as recipientType, NULL as isRead, NULL as readAt,
                        (SELECT COUNT(*) FROM EmailAttachments WHERE emailId = e.id) as attachmentsCount
                    FROM Emails e
                    INNER JOIN Users s ON e.senderId = s.id
                    WHERE e.senderId = ${parseInt(userId)}
                      AND e.isDraft = 1
                    ORDER BY e.createdAt DESC
                    OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
                `;
                countQuery = `
                    SELECT COUNT(*) as total
                    FROM Emails e
                    WHERE e.senderId = ${parseInt(userId)}
                      AND e.isDraft = 1
                `;
            } else if (folder === 'trash') {
                query = `
                    SELECT 
                        e.id, e.subject, e.body, e.createdAt, e.hasAttachments,
                        s.id as senderId, s.fullName as senderName, s.email as senderEmail,
                        er.recipientType, er.isRead, er.readAt,
                        (SELECT COUNT(*) FROM EmailAttachments WHERE emailId = e.id) as attachmentsCount
                    FROM Emails e
                    LEFT JOIN EmailRecipients er ON e.id = er.emailId AND er.recipientId = ${parseInt(userId)}
                    INNER JOIN Users s ON e.senderId = s.id
                    WHERE (e.senderId = ${parseInt(userId)} OR er.recipientId = ${parseInt(userId)})
                      AND e.folder = 'trash'
                    ORDER BY e.createdAt DESC
                    OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
                `;
                countQuery = `
                    SELECT COUNT(*) as total
                    FROM Emails e
                    LEFT JOIN EmailRecipients er ON e.id = er.emailId AND er.recipientId = ${parseInt(userId)}
                    WHERE (e.senderId = ${parseInt(userId)} OR er.recipientId = ${parseInt(userId)})
                      AND e.folder = 'trash'
                `;
            } else {
                throw new Error(`المجلد غير صالح: ${folder}`);
            }

            const [emails, countResult] = await Promise.all([
                this.queryAsync(query),
                this.queryAsync(countQuery)
            ]);

            // جلب المستلمين لكل بريد (ضروري لعرض التفاصيل)
            for (let email of emails) {
                const recipientsQuery = `
                    SELECT u.id, u.fullName, u.email, er.recipientType
                    FROM EmailRecipients er
                    INNER JOIN Users u ON er.recipientId = u.id
                    WHERE er.emailId = ${email.id}
                `;
                const recipients = await this.queryAsync(recipientsQuery);
                email.recipients = recipients;
            }

            const totalItems = countResult[0]?.total || 0;
            const totalPages = Math.ceil(totalItems / limit);

            return {
                emails,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalItems,
                    itemsPerPage: parseInt(limit),
                    hasNextPage: parseInt(page) < totalPages,
                    hasPrevPage: parseInt(page) > 1
                }
            };
        } catch (error) {
            console.error('❌ EmailService.getUserEmails error:', error);
            throw error;
        }
    }

    // جلب بريد معين مع التحقق من أن المستخدم له حق الوصول (مرسل أو مستلم)
    async getEmailById(emailId, userId) {
        try {
            // التحقق من وجود البريد وأن المستخدم مرتبط به
            const checkQuery = `
                SELECT e.id, e.senderId
                FROM Emails e
                LEFT JOIN EmailRecipients er ON e.id = er.emailId AND er.recipientId = ${parseInt(userId)}
                WHERE e.id = ${parseInt(emailId)}
                  AND (e.senderId = ${parseInt(userId)} OR er.recipientId = ${parseInt(userId)})
            `;
            const check = await this.queryAsync(checkQuery);
            if (check.length === 0) {
                throw new Error('البريد غير موجود أو لا تملك صلاحية الاطلاع عليه');
            }

            const query = `
                SELECT 
                    e.id, e.subject, e.body, e.createdAt, e.hasAttachments,
                    s.id as senderId, s.fullName as senderName, s.email as senderEmail,
                    e.folder, e.isDraft
                FROM Emails e
                INNER JOIN Users s ON e.senderId = s.id
                WHERE e.id = ${parseInt(emailId)}
            `;
            const emails = await this.queryAsync(query);
            if (emails.length === 0) return null;
            const email = emails[0];

            const recipientsQuery = `
                SELECT u.id, u.fullName, u.email, er.recipientType, er.isRead, er.readAt
                FROM EmailRecipients er
                INNER JOIN Users u ON er.recipientId = u.id
                WHERE er.emailId = ${email.id}
            `;
            email.recipients = await this.queryAsync(recipientsQuery);

            const attachmentsQuery = `
                SELECT id, fileName, fileUrl, fileSize, mimeType
                FROM EmailAttachments
                WHERE emailId = ${email.id}
            `;
            email.attachments = await this.queryAsync(attachmentsQuery);

            // تحديث حالة القراءة إذا كان المستخدم هو المستلم
            const recipientEntry = email.recipients.find(r => r.id === userId);
            if (recipientEntry && !recipientEntry.isRead) {
                const updateReadQuery = `
                    UPDATE EmailRecipients
                    SET isRead = 1, readAt = GETDATE()
                    WHERE emailId = ${email.id} AND recipientId = ${userId}
                `;
                await this.executeAsync(updateReadQuery);
                recipientEntry.isRead = 1;
                recipientEntry.readAt = new Date();
            }

            return email;
        } catch (error) {
            console.error('❌ EmailService.getEmailById error:', error);
            throw error;
        }
    }

    // إرسال بريد أو حفظ مسودة
    async sendEmail(data, userId) {
        try {
            const { subject, body, to, cc, bcc, isDraft = false, attachments = [] } = data;
            if (!subject && !body && (!to || to.length === 0)) {
                throw new Error('لا يمكن حفظ بريد فارغ');
            }

            const recipients = [];
            if (to && Array.isArray(to)) {
                for (const email of to) recipients.push({ email, type: 'to' });
            }
            if (cc && Array.isArray(cc)) {
                for (const email of cc) recipients.push({ email, type: 'cc' });
            }
            if (bcc && Array.isArray(bcc)) {
                for (const email of bcc) recipients.push({ email, type: 'bcc' });
            }

            if (!isDraft && recipients.length === 0) {
                throw new Error('يجب تحديد مستلم واحد على الأقل');
            }

            const recipientIds = [];
            for (const rec of recipients) {
                const user = await this.getUserByEmail(rec.email);
                if (!user) {
                    throw new Error(`المستخدم "${rec.email}" غير موجود في النظام`);
                }
                recipientIds.push({ userId: user.id, type: rec.type });
            }

            const folder = isDraft ? 'drafts' : 'sent';
            const insertEmailQuery = `
                INSERT INTO Emails (senderId, subject, body, folder, isDraft, hasAttachments, createdAt, updatedAt)
                OUTPUT INSERTED.id
                VALUES (
                    ${parseInt(userId)},
                    N'${this.escapeSql(subject || '')}',
                    N'${this.escapeSql(body || '')}',
                    N'${folder}',
                    ${isDraft ? 1 : 0},
                    ${attachments.length > 0 ? 1 : 0},
                    GETDATE(),
                    GETDATE()
                )
            `;
            const insertResult = await this.queryAsync(insertEmailQuery);
            const emailId = insertResult[0]?.id;
            if (!emailId) {
                console.error('❌ Failed to get emailId after INSERT', insertResult);
                throw new Error('فشل إنشاء البريد');
            }

            // إضافة المستلمين
            for (const rec of recipientIds) {
                const insertRecipient = `
                    INSERT INTO EmailRecipients (emailId, recipientId, recipientType, isRead, readAt)
                    VALUES (${emailId}, ${rec.userId}, N'${rec.type}', 0, NULL)
                `;
                await this.executeAsync(insertRecipient);
            }

            // إضافة المرفقات
            if (attachments.length > 0) {
                for (const att of attachments) {
                    let fileName = att.fileName;
                    if (fileName && fileName.length > 500) {
                        const ext = fileName.split('.').pop();
                        const nameWithoutExt = fileName.substring(0, 500 - ext.length - 5);
                        fileName = nameWithoutExt + '...' + (ext ? '.' + ext : '');
                    }
                    const insertAtt = `
                        INSERT INTO EmailAttachments (emailId, fileName, fileUrl, fileSize, mimeType)
                        VALUES (
                            ${emailId},
                            N'${this.escapeSql(fileName)}',
                            N'${this.escapeSql(att.fileUrl)}',
                            ${att.fileSize},
                            N'${this.escapeSql(att.mimeType)}'
                        )
                    `;
                    await this.executeAsync(insertAtt);
                }
            }

            return { success: true, emailId };
        } catch (error) {
            console.error('❌ EmailService.sendEmail error:', error);
            throw error;
        }
    }

    // تحديث مسودة
    async updateDraft(emailId, data, userId) {
        try {
            // التحقق من أن المسودة تخص هذا المستخدم
            const checkQuery = `
                SELECT id FROM Emails WHERE id = ${parseInt(emailId)} AND senderId = ${userId} AND isDraft = 1
            `;
            const check = await this.queryAsync(checkQuery);
            if (check.length === 0) throw new Error('المسودة غير موجودة أو لا تملك صلاحيتها');

            const updates = [];
            if (data.subject !== undefined) updates.push(`subject = N'${this.escapeSql(data.subject || '')}'`);
            if (data.body !== undefined) updates.push(`body = N'${this.escapeSql(data.body || '')}'`);
            updates.push(`updatedAt = GETDATE()`);

            if (updates.length === 0) return { success: true, message: 'لا توجد تغييرات' };

            const updateQuery = `
                UPDATE Emails SET ${updates.join(', ')} WHERE id = ${emailId}
            `;
            await this.executeAsync(updateQuery);

            // تحديث المستلمين إذا تم إرسالهم
            if (data.to || data.cc || data.bcc) {
                await this.executeAsync(`DELETE FROM EmailRecipients WHERE emailId = ${emailId}`);

                const recipients = [];
                if (data.to && Array.isArray(data.to)) {
                    for (const email of data.to) recipients.push({ email, type: 'to' });
                }
                if (data.cc && Array.isArray(data.cc)) {
                    for (const email of data.cc) recipients.push({ email, type: 'cc' });
                }
                if (data.bcc && Array.isArray(data.bcc)) {
                    for (const email of data.bcc) recipients.push({ email, type: 'bcc' });
                }

                for (const rec of recipients) {
                    const user = await this.getUserByEmail(rec.email);
                    if (!user) throw new Error(`المستخدم "${rec.email}" غير موجود`);
                    const insertRecipient = `
                        INSERT INTO EmailRecipients (emailId, recipientId, recipientType)
                        VALUES (${emailId}, ${user.id}, N'${rec.type}')
                    `;
                    await this.executeAsync(insertRecipient);
                }
            }

            return { success: true };
        } catch (error) {
            console.error('❌ EmailService.updateDraft error:', error);
            throw error;
        }
    }

    // نقل بريد إلى المهملات (التحقق من أن المستخدم مرسل أو مستلم)
    async deleteEmail(emailId, userId) {
        try {
            const check = await this.queryAsync(`
                SELECT e.id
                FROM Emails e
                LEFT JOIN EmailRecipients er ON e.id = er.emailId AND er.recipientId = ${userId}
                WHERE e.id = ${emailId} AND (e.senderId = ${userId} OR er.recipientId = ${userId})
            `);
            if (check.length === 0) throw new Error('لا تملك صلاحية حذف هذا البريد');

            const updateQuery = `
                UPDATE Emails SET folder = 'trash', updatedAt = GETDATE() WHERE id = ${emailId}
            `;
            await this.executeAsync(updateQuery);
            return { success: true };
        } catch (error) {
            console.error('❌ EmailService.deleteEmail error:', error);
            throw error;
        }
    }

    // استعادة بريد من المهملات (نفس التحقق)
    async restoreEmail(emailId, userId) {
        try {
            const check = await this.queryAsync(`
                SELECT e.id
                FROM Emails e
                LEFT JOIN EmailRecipients er ON e.id = er.emailId AND er.recipientId = ${userId}
                WHERE e.id = ${emailId} AND e.folder = 'trash'
                  AND (e.senderId = ${userId} OR er.recipientId = ${userId})
            `);
            if (check.length === 0) throw new Error('البريد غير موجود في المهملات أو لا تملك صلاحيته');

            const updateQuery = `
                UPDATE Emails SET folder = 'sent', updatedAt = GETDATE() WHERE id = ${emailId}
            `;
            await this.executeAsync(updateQuery);
            return { success: true };
        } catch (error) {
            console.error('❌ EmailService.restoreEmail error:', error);
            throw error;
        }
    }

    // حذف نهائي (التحقق من الصلاحية)
    async permanentDelete(emailId, userId) {
        try {
            const check = await this.queryAsync(`
                SELECT e.id
                FROM Emails e
                LEFT JOIN EmailRecipients er ON e.id = er.emailId AND er.recipientId = ${userId}
                WHERE e.id = ${emailId}
                  AND (e.senderId = ${userId} OR er.recipientId = ${userId})
            `);
            if (check.length === 0) throw new Error('لا تملك صلاحية الحذف');

            await this.executeAsync(`DELETE FROM Emails WHERE id = ${emailId}`);
            return { success: true };
        } catch (error) {
            console.error('❌ EmailService.permanentDelete error:', error);
            throw error;
        }
    }

    // إضافة مرفق
    async addAttachment(emailId, fileData) {
        try {
            let fileName = fileData.fileName;
            if (fileName && fileName.length > 500) {
                const ext = fileName.split('.').pop();
                const nameWithoutExt = fileName.substring(0, 500 - ext.length - 5);
                fileName = nameWithoutExt + '...' + (ext ? '.' + ext : '');
            }
            const query = `
                INSERT INTO EmailAttachments (emailId, fileName, fileUrl, fileSize, mimeType)
                VALUES (
                    ${emailId},
                    N'${this.escapeSql(fileName)}',
                    N'${this.escapeSql(fileData.fileUrl)}',
                    ${fileData.fileSize},
                    N'${this.escapeSql(fileData.mimeType)}'
                )
            `;
            await this.executeAsync(query);
            await this.executeAsync(`
                UPDATE Emails SET hasAttachments = 1 WHERE id = ${emailId}
            `);
            return { success: true };
        } catch (error) {
            console.error('❌ EmailService.addAttachment error:', error);
            throw error;
        }
    }

    // إحصائيات البريد للمستخدم الحالي
    async getEmailStats(userId) {
        try {
            const unreadQuery = `
                SELECT COUNT(*) as unread
                FROM EmailRecipients er
                WHERE er.recipientId = ${parseInt(userId)} AND er.isRead = 0
            `;
            const unreadResult = await this.queryAsync(unreadQuery);
            const unread = unreadResult[0]?.unread || 0;

            const draftsQuery = `
                SELECT COUNT(*) as drafts
                FROM Emails e
                WHERE e.senderId = ${parseInt(userId)} AND e.isDraft = 1
            `;
            const draftsResult = await this.queryAsync(draftsQuery);
            const drafts = draftsResult[0]?.drafts || 0;

            const sentQuery = `
                SELECT COUNT(*) as sent
                FROM Emails e
                WHERE e.senderId = ${parseInt(userId)} AND e.isDraft = 0 AND e.folder = 'sent'
            `;
            const sentResult = await this.queryAsync(sentQuery);
            const sent = sentResult[0]?.sent || 0;

            const trashQuery = `
                SELECT COUNT(*) as trash
                FROM Emails e
                LEFT JOIN EmailRecipients er ON e.id = er.emailId AND er.recipientId = ${parseInt(userId)}
                WHERE (e.senderId = ${parseInt(userId)} OR er.recipientId = ${parseInt(userId)}) AND e.folder = 'trash'
            `;
            const trashResult = await this.queryAsync(trashQuery);
            const trash = trashResult[0]?.trash || 0;

            return { unread, drafts, sent, trash };
        } catch (error) {
            console.error('❌ EmailService.getEmailStats error:', error);
            throw error;
        }
    }

    async getUserByEmail(email) {
        const query = `
            SELECT id, fullName, email, role FROM Users WHERE email = N'${this.escapeSql(email)}'
        `;
        const result = await this.queryAsync(query);
        return result[0] || null;
    }

    async searchUsers(queryTerm) {
        try {
            const search = `%${this.escapeSql(queryTerm)}%`;
            const sqlQuery = `
                SELECT id, fullName, email, role
                FROM Users
                WHERE fullName LIKE N'${search}' OR email LIKE N'${search}'
                ORDER BY fullName
            `;
            return await this.queryAsync(sqlQuery);
        } catch (error) {
            console.error('❌ EmailService.searchUsers error:', error);
            return [];
        }
    }
}

module.exports = new EmailService();