const sql = require('msnodesqlv8');
require('dotenv').config();
const sql = require('msnodesqlv8');
const connectionString = process.env.DB_CONNECTION_STRING;

class ChatService {
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

    // ========== جلب جميع المحادثات للمستخدم (مع دعم عرض مشرف عام) ==========
    async getUserChats(currentUserId, targetUserId) {
        try {
            const userId = targetUserId || currentUserId;
            const query = `
                SELECT 
                    c.id,
                    c.chatName,
                    c.chatType,
                    c.createdBy,
                    c.createdAt,
                    c.avatar,
                    (SELECT COUNT(*) FROM ChatParticipants WHERE chatId = c.id) as participantsCount,
                    (SELECT TOP 1 m.content FROM Messages m WHERE m.chatId = c.id AND m.isDeleted = 0 ORDER BY m.createdAt DESC) as lastMessage,
                    (SELECT TOP 1 m.messageType FROM Messages m WHERE m.chatId = c.id AND m.isDeleted = 0 ORDER BY m.createdAt DESC) as lastMessageType,
                    (SELECT TOP 1 m.createdAt FROM Messages m WHERE m.chatId = c.id AND m.isDeleted = 0 ORDER BY m.createdAt DESC) as lastMessageTime,
                    (SELECT TOP 1 m.senderId FROM Messages m WHERE m.chatId = c.id AND m.isDeleted = 0 ORDER BY m.createdAt DESC) as lastMessageSenderId,
                    (SELECT COUNT(*) FROM Messages m WHERE m.chatId = c.id AND m.createdAt > ISNULL(cp.lastReadAt, '1900-01-01') AND m.senderId != ${userId}) as unreadCount,
                    CASE WHEN c.chatType = 'private' THEN 
                        (SELECT TOP 1 u.fullName FROM ChatParticipants cp2 
                         INNER JOIN Users u ON cp2.userId = u.id 
                         WHERE cp2.chatId = c.id AND cp2.userId != ${userId})
                    ELSE NULL END as otherParticipantName,
                    'غير متصل' as otherParticipantStatus,
                    cp.lastReadAt
                FROM Chats c
                INNER JOIN ChatParticipants cp ON c.id = cp.chatId
                WHERE cp.userId = ${userId} AND c.isActive = 1
                ORDER BY lastMessageTime DESC
            `;
            const chats = await this.queryAsync(query);

            for (let chat of chats) {
                const participantsQuery = `
                    SELECT u.id, u.fullName, u.email, u.role, cp.role as participantRole
                    FROM ChatParticipants cp
                    INNER JOIN Users u ON cp.userId = u.id
                    WHERE cp.chatId = ${chat.id}
                `;
                chat.participants = await this.queryAsync(participantsQuery);
            }

            return chats;
        } catch (error) {
            console.error('❌ ChatService.getUserChats error:', error);
            throw error;
        }
    }

    // ========== جلب رسائل محادثة معينة (مع دعم عرض مشرف عام والردود) ==========
    async getMessages(chatId, currentUserId, targetUserId, limit = 50, offset = 0) {
        try {
            const userId = targetUserId || currentUserId;

            const checkQuery = `
                SELECT 1 FROM ChatParticipants WHERE chatId = ${parseInt(chatId)} AND userId = ${parseInt(userId)}
            `;
            const check = await this.queryAsync(checkQuery);
            if (check.length === 0) {
                throw new Error('غير مصرح لك بالاطلاع على هذه المحادثة');
            }

            const participantsCountQuery = `SELECT COUNT(*) as total FROM ChatParticipants WHERE chatId = ${parseInt(chatId)}`;
            const totalParticipants = await this.queryAsync(participantsCountQuery);
            const totalRecipients = totalParticipants[0].total;

            const query = `
                SELECT 
                    m.id,
                    m.chatId,
                    m.senderId,
                    u.fullName as senderName,
                    u.email as senderEmail,
                    m.messageType,
                    m.content,
                    m.fileUrl,
                    m.fileName,
                    m.fileSize,
                    m.mimeType,
                    m.createdAt,
                    m.isDeleted,
                    m.replyToId,
                    m.duration,
                    (SELECT COUNT(*) FROM MessageReadStatus WHERE messageId = m.id AND userId != m.senderId) as readCount,
                    ${totalRecipients - 1} as totalRecipientsExcludingSender
                FROM Messages m
                INNER JOIN Users u ON m.senderId = u.id
                WHERE m.chatId = ${parseInt(chatId)} AND m.isDeleted = 0
                ORDER BY m.createdAt ASC
                OFFSET ${parseInt(offset)} ROWS FETCH NEXT ${parseInt(limit)} ROWS ONLY
            `;
            const messages = await this.queryAsync(query);
            // جلب الردود
            for (let msg of messages) {
                msg.isReadByAll = (msg.readCount >= msg.totalRecipientsExcludingSender);
                if (msg.replyToId) {
                    const replyQuery = `
                        SELECT m.id, m.content, m.messageType, u.fullName as senderName
                        FROM Messages m
                        INNER JOIN Users u ON m.senderId = u.id
                        WHERE m.id = ${msg.replyToId}
                    `;
                    const reply = await this.queryAsync(replyQuery);
                    if (reply.length) msg.replyTo = reply[0];
                }
            }

            return messages;
        } catch (error) {
            console.error('❌ ChatService.getMessages error:', error);
            throw error;
        }
    }

    // ========== تحديث حالة القراءة للمستخدم الهدف ==========
    async markMessagesAsRead(chatId, currentUserId, targetUserId) {
        try {
            const userId = targetUserId || currentUserId;

            await this.executeAsync(`
                UPDATE ChatParticipants SET lastReadAt = GETDATE()
                WHERE chatId = ${parseInt(chatId)} AND userId = ${parseInt(userId)}
            `);

            const unreadMessages = await this.queryAsync(`
                SELECT m.id FROM Messages m
                WHERE m.chatId = ${parseInt(chatId)} AND m.senderId != ${parseInt(userId)}
                AND NOT EXISTS (
                    SELECT 1 FROM MessageReadStatus rs
                    WHERE rs.messageId = m.id AND rs.userId = ${parseInt(userId)}
                )
            `);
            for (const msg of unreadMessages) {
                await this.executeAsync(`
                    INSERT INTO MessageReadStatus (messageId, userId, readAt)
                    VALUES (${msg.id}, ${parseInt(userId)}, GETDATE())
                `);
            }
            return true;
        } catch (error) {
            console.error('❌ ChatService.markMessagesAsRead error:', error);
            throw error;
        }
    }

    // ========== إرسال رسالة نصية (يدعم الرد) ==========
    async sendTextMessage(chatId, userId, content, replyToId = null) {
        try {
            if (!content || content.trim() === '') {
                throw new Error('لا يمكن إرسال رسالة فارغة');
            }

            const check = await this.queryAsync(`
                SELECT 1 FROM ChatParticipants WHERE chatId = ${parseInt(chatId)} AND userId = ${parseInt(userId)}
            `);
            if (check.length === 0) throw new Error('غير مصرح لك بالمشاركة في هذه المحادثة');

            let replyToClause = '';
            if (replyToId) {
                const replyCheck = await this.queryAsync(`
                    SELECT 1 FROM Messages WHERE id = ${parseInt(replyToId)} AND chatId = ${parseInt(chatId)}
                `);
                if (replyCheck.length === 0) throw new Error('الرسالة المراد الرد عليها غير موجودة');
                replyToClause = `, replyToId = ${parseInt(replyToId)}`;
            }

            const insertQuery = `
                INSERT INTO Messages (chatId, senderId, messageType, content, createdAt ${replyToId ? ', replyToId' : ''})
                OUTPUT INSERTED.id
                VALUES (${parseInt(chatId)}, ${parseInt(userId)}, 'text', N'${this.escapeSql(content)}', GETDATE() ${replyToId ? `, ${parseInt(replyToId)}` : ''})
            `;
            const result = await this.queryAsync(insertQuery);
            const messageId = result[0]?.id;

            const message = await this.getMessageById(messageId);
            return { success: true, message };
        } catch (error) {
            console.error('❌ ChatService.sendTextMessage error:', error);
            throw error;
        }
    }

    // ========== إرسال رسالة تحتوي على ملف (يدعم الرد) ==========
    async sendFileMessage(chatId, userId, fileData, textContent = null, replyToId = null) {
        try {
            const check = await this.queryAsync(`
                SELECT 1 FROM ChatParticipants WHERE chatId = ${parseInt(chatId)} AND userId = ${parseInt(userId)}
            `);
            if (check.length === 0) throw new Error('غير مصرح لك بالمشاركة في هذه المحادثة');

            let fileName = fileData.fileName;
            if (fileName && fileName.length > 255) {
                const ext = fileName.split('.').pop();
                fileName = fileName.substring(0, 255 - ext.length - 5) + '...' + (ext ? '.' + ext : '');
            }

            const messageType = fileData.mimeType && fileData.mimeType.startsWith('image/') ? 'image' : 
                               (fileData.mimeType && fileData.mimeType.startsWith('audio/') ? 'voice' : 'file');
            let replyToClause = '';
            if (replyToId) {
                const replyCheck = await this.queryAsync(`
                    SELECT 1 FROM Messages WHERE id = ${parseInt(replyToId)} AND chatId = ${parseInt(chatId)}
                `);
                if (replyCheck.length === 0) throw new Error('الرسالة المراد الرد عليها غير موجودة');
                replyToClause = `, replyToId = ${parseInt(replyToId)}`;
            }

            const durationValue = fileData.duration ? parseInt(fileData.duration) : null;
            const durationClause = durationValue ? `, duration = ${durationValue}` : '';

            const insertQuery = `
                INSERT INTO Messages (chatId, senderId, messageType, content, fileUrl, fileName, fileSize, mimeType, createdAt ${replyToId ? ', replyToId' : ''} ${durationValue ? ', duration' : ''})
                OUTPUT INSERTED.id
                VALUES (
                    ${parseInt(chatId)},
                    ${parseInt(userId)},
                    '${messageType}',
                    ${textContent ? `N'${this.escapeSql(textContent)}'` : 'NULL'},
                    N'${this.escapeSql(fileData.fileUrl)}',
                    N'${this.escapeSql(fileName)}',
                    ${fileData.fileSize},
                    N'${this.escapeSql(fileData.mimeType)}',
                    GETDATE() ${replyToId ? `, ${parseInt(replyToId)}` : ''} ${durationValue ? `, ${durationValue}` : ''}
                )
            `;
            const result = await this.queryAsync(insertQuery);
            const messageId = result[0]?.id;
            const message = await this.getMessageById(messageId);
            return { success: true, message };
        } catch (error) {
            console.error('❌ ChatService.sendFileMessage error:', error);
            throw error;
        }
    }

    async getMessageById(messageId) {
        const query = `
            SELECT m.*, u.fullName as senderName, u.email as senderEmail
            FROM Messages m
            INNER JOIN Users u ON m.senderId = u.id
            WHERE m.id = ${parseInt(messageId)}
        `;
        const result = await this.queryAsync(query);
        return result[0] || null;
    }

    // ========== البحث العام في جميع المحادثات ==========
    async searchMessages(userId, query, targetUserId = null) {
        try {
            const effectiveUserId = targetUserId || userId;
            const searchTerm = `%${this.escapeSql(query)}%`;
            const sqlQuery = `
                SELECT 
                    m.id, m.chatId, m.senderId, m.messageType, m.content, m.fileUrl, m.fileName, m.createdAt,
                    c.chatName, c.chatType,
                    CASE WHEN c.chatType = 'private' THEN 
                        (SELECT TOP 1 u.fullName FROM ChatParticipants cp2 
                         INNER JOIN Users u ON cp2.userId = u.id 
                         WHERE cp2.chatId = c.id AND cp2.userId != ${effectiveUserId})
                    ELSE NULL END as otherParticipantName,
                    u.fullName as senderName
                FROM Messages m
                INNER JOIN Chats c ON m.chatId = c.id
                INNER JOIN ChatParticipants cp ON c.id = cp.chatId AND cp.userId = ${effectiveUserId}
                INNER JOIN Users u ON m.senderId = u.id
                WHERE m.isDeleted = 0
                AND (m.content LIKE N'${searchTerm}' OR m.fileName LIKE N'${searchTerm}')
                ORDER BY m.createdAt DESC
            `;
            const results = await this.queryAsync(sqlQuery);
            return results;
        } catch (error) {
            console.error('❌ ChatService.searchMessages error:', error);
            throw error;
        }
    }

    // ========== جلب الوسائط (الصور، الملفات، الصوتيات) لمحادثة ==========
    async getChatMedia(chatId, userId, targetUserId = null) {
        try {
            const effectiveUserId = targetUserId || userId;
            const check = await this.queryAsync(`
                SELECT 1 FROM ChatParticipants WHERE chatId = ${parseInt(chatId)} AND userId = ${parseInt(effectiveUserId)}
            `);
            if (check.length === 0) throw new Error('غير مصرح لك بالاطلاع على هذه المحادثة');

            const query = `
                SELECT 
                    m.id, m.messageType, m.fileUrl, m.fileName, m.fileSize, m.duration, m.createdAt,
                    u.fullName as senderName
                FROM Messages m
                INNER JOIN Users u ON m.senderId = u.id
                WHERE m.chatId = ${parseInt(chatId)} AND m.isDeleted = 0
                AND m.messageType IN ('image', 'file', 'voice')
                ORDER BY m.createdAt DESC
            `;
            const results = await this.queryAsync(query);
            return results;
        } catch (error) {
            console.error('❌ ChatService.getChatMedia error:', error);
            throw error;
        }
    }

    // ========== إنشاء محادثة خاصة جديدة ==========
    async createPrivateChat(userId1, userId2) {
        try {
            const existing = await this.queryAsync(`
                SELECT c.id 
                FROM Chats c
                INNER JOIN ChatParticipants cp1 ON c.id = cp1.chatId AND cp1.userId = ${parseInt(userId1)}
                INNER JOIN ChatParticipants cp2 ON c.id = cp2.chatId AND cp2.userId = ${parseInt(userId2)}
                WHERE c.chatType = 'private' AND c.isActive = 1
            `);
            if (existing.length > 0) {
                return { success: true, chatId: existing[0].id, existing: true };
            }

            const insertChat = `
                INSERT INTO Chats (chatName, chatType, createdBy, createdAt, updatedAt)
                OUTPUT INSERTED.id
                VALUES (NULL, 'private', ${parseInt(userId1)}, GETDATE(), GETDATE())
            `;
            const chatResult = await this.queryAsync(insertChat);
            const chatId = chatResult[0].id;

            await this.executeAsync(`
                INSERT INTO ChatParticipants (chatId, userId, joinedAt)
                VALUES (${chatId}, ${parseInt(userId1)}, GETDATE()),
                       (${chatId}, ${parseInt(userId2)}, GETDATE())
            `);

            return { success: true, chatId, existing: false };
        } catch (error) {
            console.error('❌ ChatService.createPrivateChat error:', error);
            throw error;
        }
    }

    // ========== إنشاء مجموعة جديدة ==========
    async createGroupChat(groupName, createdBy, participantIds) {
        try {
            if (!groupName || groupName.trim() === '') throw new Error('اسم المجموعة مطلوب');
            if (!participantIds || participantIds.length === 0) throw new Error('يجب اختيار مشارك واحد على الأقل');

            if (!participantIds.includes(createdBy)) participantIds.push(createdBy);

            const insertChat = `
                INSERT INTO Chats (chatName, chatType, createdBy, createdAt, updatedAt)
                OUTPUT INSERTED.id
                VALUES (N'${this.escapeSql(groupName)}', 'group', ${parseInt(createdBy)}, GETDATE(), GETDATE())
            `;
            const chatResult = await this.queryAsync(insertChat);
            const chatId = chatResult[0].id;

            for (const uid of participantIds) {
                await this.executeAsync(`
                    INSERT INTO ChatParticipants (chatId, userId, joinedAt)
                    VALUES (${chatId}, ${parseInt(uid)}, GETDATE())
                `);
            }

            return { success: true, chatId };
        } catch (error) {
            console.error('❌ ChatService.createGroupChat error:', error);
            throw error;
        }
    }

    // ========== إضافة أعضاء إلى مجموعة ==========
    async addParticipants(chatId, adminId, newUserIds) {
        try {
            const chat = await this.queryAsync(`
                SELECT createdBy FROM Chats WHERE id = ${parseInt(chatId)} AND chatType = 'group'
            `);
            if (chat.length === 0) throw new Error('المحادثة غير موجودة أو ليست مجموعة');
            const creatorId = chat[0].createdBy;
            if (creatorId !== adminId) {
                throw new Error('ليس لديك صلاحية إضافة أعضاء');
            }

            for (const uid of newUserIds) {
                const exists = await this.queryAsync(`
                    SELECT 1 FROM ChatParticipants WHERE chatId = ${parseInt(chatId)} AND userId = ${parseInt(uid)}
                `);
                if (exists.length === 0) {
                    await this.executeAsync(`
                        INSERT INTO ChatParticipants (chatId, userId, joinedAt)
                        VALUES (${parseInt(chatId)}, ${parseInt(uid)}, GETDATE())
                    `);
                }
            }
            return { success: true };
        } catch (error) {
            console.error('❌ ChatService.addParticipants error:', error);
            throw error;
        }
    }

    // ========== إزالة عضو من مجموعة ==========
    async removeParticipant(chatId, adminId, userIdToRemove) {
        try {
            const chat = await this.queryAsync(`
                SELECT createdBy FROM Chats WHERE id = ${parseInt(chatId)} AND chatType = 'group'
            `);
            if (chat.length === 0) throw new Error('المحادثة غير موجودة أو ليست مجموعة');
            const creatorId = chat[0].createdBy;
            if (creatorId !== adminId) {
                throw new Error('ليس لديك صلاحية إزالة الأعضاء');
            }
            if (userIdToRemove === adminId) {
                throw new Error('لا يمكن إزالة منشئ المجموعة');
            }
            await this.executeAsync(`
                DELETE FROM ChatParticipants WHERE chatId = ${parseInt(chatId)} AND userId = ${parseInt(userIdToRemove)}
            `);
            return { success: true };
        } catch (error) {
            console.error('❌ ChatService.removeParticipant error:', error);
            throw error;
        }
    }

    // ========== مغادرة مجموعة ==========
    async leaveGroup(chatId, userId) {
        try {
            const participantsCount = await this.queryAsync(`
                SELECT COUNT(*) as cnt FROM ChatParticipants WHERE chatId = ${parseInt(chatId)}
            `);
            if (participantsCount[0].cnt === 1) {
                await this.executeAsync(`
                    UPDATE Chats SET isActive = 0 WHERE id = ${parseInt(chatId)}
                `);
            } else {
                await this.executeAsync(`
                    DELETE FROM ChatParticipants WHERE chatId = ${parseInt(chatId)} AND userId = ${parseInt(userId)}
                `);
            }
            return { success: true };
        } catch (error) {
            console.error('❌ ChatService.leaveGroup error:', error);
            throw error;
        }
    }

    // ========== حذف محادثة للمستخدم ==========
    async deleteChatForUser(chatId, userId) {
        try {
            await this.executeAsync(`
                DELETE FROM ChatParticipants WHERE chatId = ${parseInt(chatId)} AND userId = ${parseInt(userId)}
            `);
            const chat = await this.queryAsync(`SELECT chatType FROM Chats WHERE id = ${parseInt(chatId)}`);
            if (chat[0]?.chatType === 'private') {
                const remaining = await this.queryAsync(`
                    SELECT COUNT(*) as cnt FROM ChatParticipants WHERE chatId = ${parseInt(chatId)}
                `);
                if (remaining[0].cnt === 0) {
                    await this.executeAsync(`UPDATE Chats SET isActive = 0 WHERE id = ${parseInt(chatId)}`);
                }
            }
            return { success: true };
        } catch (error) {
            console.error('❌ ChatService.deleteChatForUser error:', error);
            throw error;
        }
    }

    // ========== حذف مجموعة بالكامل (للمنشئ) ==========
    async deleteGroup(chatId, userId) {
        try {
            const chat = await this.queryAsync(`
                SELECT createdBy FROM Chats WHERE id = ${parseInt(chatId)} AND chatType = 'group'
            `);
            if (chat.length === 0) throw new Error('المحادثة غير موجودة أو ليست مجموعة');
            const creatorId = chat[0].createdBy;
            if (creatorId !== userId) {
                throw new Error('ليس لديك صلاحية حذف المجموعة');
            }
            await this.executeAsync(`DELETE FROM ChatParticipants WHERE chatId = ${parseInt(chatId)}`);
            await this.executeAsync(`DELETE FROM Messages WHERE chatId = ${parseInt(chatId)}`);
            await this.executeAsync(`DELETE FROM Chats WHERE id = ${parseInt(chatId)}`);
            return { success: true };
        } catch (error) {
            console.error('❌ ChatService.deleteGroup error:', error);
            throw error;
        }
    }

    // ========== تحديث اسم المجموعة ==========
    async updateGroupName(chatId, userId, newName) {
        try {
            const chat = await this.queryAsync(`
                SELECT createdBy FROM Chats WHERE id = ${parseInt(chatId)} AND chatType = 'group'
            `);
            if (chat.length === 0) throw new Error('المحادثة غير موجودة أو ليست مجموعة');
            const creatorId = chat[0].createdBy;
            if (creatorId !== userId) {
                throw new Error('ليس لديك صلاحية تعديل اسم المجموعة');
            }
            await this.executeAsync(`
                UPDATE Chats SET chatName = N'${this.escapeSql(newName)}', updatedAt = GETDATE()
                WHERE id = ${parseInt(chatId)}
            `);
            return { success: true };
        } catch (error) {
            console.error('❌ ChatService.updateGroupName error:', error);
            throw error;
        }
    }

    // ========== تحديث صورة المجموعة ==========
    async updateGroupAvatar(chatId, userId, avatarUrl) {
        try {
            const chat = await this.queryAsync(`
                SELECT createdBy FROM Chats WHERE id = ${parseInt(chatId)} AND chatType = 'group'
            `);
            if (chat.length === 0) throw new Error('المحادثة غير موجودة أو ليست مجموعة');
            const creatorId = chat[0].createdBy;
            if (creatorId !== userId) {
                throw new Error('ليس لديك صلاحية تعديل صورة المجموعة');
            }
            await this.executeAsync(`
                UPDATE Chats SET avatar = N'${this.escapeSql(avatarUrl)}', updatedAt = GETDATE()
                WHERE id = ${parseInt(chatId)}
            `);
            return { success: true };
        } catch (error) {
            console.error('❌ ChatService.updateGroupAvatar error:', error);
            throw error;
        }
    }

    // ========== جلب المشاركين في مجموعة ==========
    async getGroupParticipants(chatId) {
        try {
            const query = `
                SELECT u.id, u.fullName, u.email, u.role, cp.joinedAt
                FROM ChatParticipants cp
                INNER JOIN Users u ON cp.userId = u.id
                WHERE cp.chatId = ${parseInt(chatId)}
                ORDER BY u.fullName
            `;
            return await this.queryAsync(query);
        } catch (error) {
            console.error('❌ ChatService.getGroupParticipants error:', error);
            throw error;
        }
    }

    // ========== بحث عن مستخدمين ==========
    async searchUsers(queryTerm, excludeUserId = null) {
        try {
            const search = `%${this.escapeSql(queryTerm)}%`;
            let sqlQuery = `
                SELECT id, fullName, email, role
                FROM Users
                WHERE (fullName LIKE N'${search}' OR email LIKE N'${search}')
                AND isActive = 1
            `;
            if (excludeUserId) {
                sqlQuery += ` AND id != ${parseInt(excludeUserId)}`;
            }
            sqlQuery += ` ORDER BY fullName`;
            return await this.queryAsync(sqlQuery);
        } catch (error) {
            console.error('❌ ChatService.searchUsers error:', error);
            return [];
        }
    }

    // ========== الحصول على جميع المستخدمين ==========
    async getAllUsers() {
        try {
            const query = `SELECT id, fullName, email, role FROM Users WHERE isActive = 1 ORDER BY fullName`;
            return await this.queryAsync(query);
        } catch (error) {
            console.error('❌ ChatService.getAllUsers error:', error);
            return [];
        }
    }
}

module.exports = new ChatService();