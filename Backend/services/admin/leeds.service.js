// 📁 Backend/services/admin/leeds.service.js
const sql = require('msnodesqlv8');

const connectionString = "Server=DESKTOP-54ST25S\\ATTENDANCE;Database=abh;Trusted_Connection=Yes;Driver={SQL Server Native Client 11.0}";

class LeedsService {
    
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

    // ========== جلب جميع العملاء من جدول Leads فقط ==========
    async getAllClients(page = 1, limit = 25, sort = 'newest', filters = {}) {
        try {
            // 1. جلب جميع العملاء من Leads فقط
            const leadsQuery = `
                SELECT 
                    l.id,
                    l.leadCode as clientCode,
                    'Leads' as source,
                    l.customerName,
                    l.customerEmail,
                    l.customerPhone,
                    l.customerNationalId,
                    l.customerAddress,
                    l.projectId,
                    p.projectName,
                    l.unitType,
                    l.budget,
                    l.leadSource,
                    l.status,
                    l.priority,
                    l.assignedTo,
                    u.fullName as assignedToName,
                    l.notes,
                    l.nextFollowUp,
                    l.createdAt,
                    l.updatedAt,
                    l.inquiryId,
                    NULL as customerId
                FROM Leads l
                LEFT JOIN Projects p ON l.projectId = p.id
                LEFT JOIN Users u ON l.assignedTo = u.id
            `;

            let allClients = await this.queryAsync(leadsQuery);

            // جلب العقود لكل عميل بناءً على رقم الهاتف (customerPhone)
            await this.attachContractsToClients(allClients);

            // تحديد clientType بناءً على وجود عقود
            allClients.forEach(client => {
                client.clientType = (client.contracts && client.contracts.length > 0) ? 'متعاقد' : 'محتمل';
            });

            // تطبيق الفلاتر
            let filtered = allClients.filter(client => {
                // بحث نصي
                if (filters.search && filters.search.trim() !== '') {
                    const searchLower = filters.search.toLowerCase();
                    const matches = 
                        (client.customerName && client.customerName.toLowerCase().includes(searchLower)) ||
                        (client.customerEmail && client.customerEmail.toLowerCase().includes(searchLower)) ||
                        (client.customerPhone && client.customerPhone.includes(searchLower)) ||
                        (client.projectName && client.projectName.toLowerCase().includes(searchLower));
                    if (!matches) return false;
                }
                
                // نوع العميل (محتمل / متعاقد)
                if (filters.clientType && filters.clientType.length > 0) {
                    if (!filters.clientType.includes(client.clientType)) return false;
                }
                
                // الحالة (status)
                if (filters.status && filters.status.length > 0) {
                    if (!filters.status.includes(client.status)) return false;
                }
                
                // الأولوية
                if (filters.priority && filters.priority.length > 0) {
                    if (!filters.priority.includes(client.priority)) return false;
                }
                
                // تاريخ الإنشاء
                if (filters.dateFrom) {
                    const fromDate = new Date(filters.dateFrom);
                    const clientDate = new Date(client.createdAt);
                    if (clientDate < fromDate) return false;
                }
                if (filters.dateTo) {
                    const toDate = new Date(filters.dateTo);
                    toDate.setHours(23, 59, 59, 999);
                    const clientDate = new Date(client.createdAt);
                    if (clientDate > toDate) return false;
                }
                
                return true;
            });

            // تطبيق الترتيب
            this.sortClients(filtered, sort);

            // العدد الإجمالي بعد الفلترة
            const totalItems = filtered.length;
            const totalPages = Math.ceil(totalItems / limit);
            const startIndex = (page - 1) * limit;
            const paginated = filtered.slice(startIndex, startIndex + limit);

            return {
                clients: paginated,
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
            console.error('❌ LeedsService.getAllClients:', error);
            throw error;
        }
    }

    // دالة مساعدة لإرفاق العقود لكل العملاء بناءً على رقم الهاتف (customerPhone)
    async attachContractsToClients(clients) {
        if (clients.length === 0) return;

        // تجميع أرقام الهواتف الفريدة (مع تجاهل القيم الفارغة)
        const phoneNumbers = [...new Set(clients.map(c => c.customerPhone).filter(p => p && p.trim() !== ''))];

        if (phoneNumbers.length === 0) return;

        // بناء جملة WHERE للبحث عن أي من هذه الأرقام في جدول Contracts
        const phoneList = phoneNumbers.map(p => `N'${this.escapeSql(p)}'`).join(',');

        // جلب جميع العقود التي تطابق أي من أرقام الهواتف
        const contracts = await this.queryAsync(`
            SELECT * FROM Contracts 
            WHERE customerPhone IN (${phoneList})
        `);

        // بعد جلب العقود، نضيف لها حالة الدفع المطلوبة (شهر حالي أو آخر دفعة)
        await this.attachPaymentStatusToContracts(contracts);

        // تنظيم العقود حسب رقم الهاتف
        const byPhone = new Map();
        contracts.forEach(contract => {
            if (contract.customerPhone) {
                if (!byPhone.has(contract.customerPhone)) {
                    byPhone.set(contract.customerPhone, []);
                }
                byPhone.get(contract.customerPhone).push(contract);
            }
        });

        // إرفاق العقود لكل عميل بناءً على رقم هاتفه
        clients.forEach(client => {
            if (client.customerPhone) {
                client.contracts = byPhone.get(client.customerPhone) || [];
            } else {
                client.contracts = [];
            }
        });
    }

    // دالة مساعدة لإرفاق حالة الدفع المناسبة لكل عقد (شهر حالي أو آخر دفعة)
    async attachPaymentStatusToContracts(contracts) {
        if (contracts.length === 0) return;

        const contractIds = contracts.map(c => c.id).join(',');
        // جلب جميع جداول الدفعات لهذه العقود
        const paymentSchedules = await this.queryAsync(`
            SELECT contractId, dueDate, status
            FROM PaymentSchedules
            WHERE contractId IN (${contractIds})
            ORDER BY dueDate DESC
        `);

        // تجميع جداول الدفعات حسب contractId
        const schedulesByContract = {};
        paymentSchedules.forEach(ps => {
            if (!schedulesByContract[ps.contractId]) {
                schedulesByContract[ps.contractId] = [];
            }
            schedulesByContract[ps.contractId].push(ps);
        });

        const now = new Date();
        const currentMonth = now.getMonth() + 1; // 1-12
        const currentYear = now.getFullYear();

        contracts.forEach(contract => {
            const schedules = schedulesByContract[contract.id] || [];
            let paymentStatusForDisplay = 'لا يوجد جدول دفعات';

            if (schedules.length > 0) {
                // البحث عن دفعة في الشهر الحالي
                const currentMonthSchedule = schedules.find(ps => {
                    const dueDate = new Date(ps.dueDate);
                    return dueDate.getMonth() + 1 === currentMonth && dueDate.getFullYear() === currentYear;
                });

                if (currentMonthSchedule) {
                    paymentStatusForDisplay = currentMonthSchedule.status;
                } else {
                    // آخر دفعة (أحدث dueDate)
                    paymentStatusForDisplay = schedules[0].status; // لأننا طلبنا ORDER BY dueDate DESC
                }
            }

            contract.paymentStatusForDisplay = paymentStatusForDisplay;
        });
    }

    sortClients(clients, sort) {
        switch (sort) {
            case 'oldest':
                clients.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'name':
                clients.sort((a, b) => (a.customerName || '').localeCompare(b.customerName || '', 'ar'));
                break;
            case 'priority':
                const priorityOrder = { 'عالي': 1, 'متوسط': 2, 'منخفض': 3 };
                clients.sort((a, b) => (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99));
                break;
            case 'newest':
            default:
                clients.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
        }
    }

    // ========== جلب عميل واحد بواسطة المعرف من جدول Leads فقط ==========
    async getClientById(id) {
        try {
            // نحاول في Leads
            const query = `
                SELECT 
                    l.id,
                    l.leadCode as clientCode,
                    'Leads' as source,
                    l.customerName,
                    l.customerEmail,
                    l.customerPhone,
                    l.customerNationalId,
                    l.customerAddress,
                    l.projectId,
                    p.projectName,
                    l.unitType,
                    l.budget,
                    l.leadSource,
                    l.status,
                    l.priority,
                    l.assignedTo,
                    u.fullName as assignedToName,
                    l.notes,
                    l.nextFollowUp,
                    l.createdAt,
                    l.updatedAt,
                    l.inquiryId,
                    NULL as customerId
                FROM Leads l
                LEFT JOIN Projects p ON l.projectId = p.id
                LEFT JOIN Users u ON l.assignedTo = u.id
                WHERE l.id = ${parseInt(id)}
            `;
            const result = await this.queryAsync(query);
            if (result && result.length > 0) {
                const client = result[0];
                // جلب العقود المرتبطة بهذا العميل بناءً على رقم الهاتف
                await this.attachContractsToClients([client]);
                client.clientType = client.contracts.length > 0 ? 'متعاقد' : 'محتمل';
                return client;
            }

            return null;
        } catch (error) {
            console.error('❌ LeedsService.getClientById:', error);
            throw error;
        }
    }

    // ========== إنشاء عميل جديد (إضافة lead) ==========
    async createClient(data) {
        try {
            if (!data.customerName || !data.customerEmail || !data.customerPhone) {
                throw new Error('الاسم والبريد والهاتف حقول مطلوبة');
            }

            // ملاحظة: لا نقوم بتضمين leadCode لأنه عمود محسوب (computed column) في قاعدة البيانات
            const columns = [
                'customerName', 'customerEmail', 'customerPhone',
                'customerNationalId', 'customerAddress', 'projectId', 'unitType',
                'budget', 'leadSource', 'status', 'priority', 'assignedTo',
                'notes', 'nextFollowUp', 'createdAt', 'updatedAt'
            ];

            const values = [
                `N'${this.escapeSql(data.customerName)}'`,
                `N'${this.escapeSql(data.customerEmail)}'`,
                `N'${this.escapeSql(data.customerPhone)}'`,
                data.customerNationalId ? `N'${this.escapeSql(data.customerNationalId)}'` : 'NULL',
                data.customerAddress ? `N'${this.escapeSql(data.customerAddress)}'` : 'NULL',
                data.projectId ? parseInt(data.projectId) : 'NULL',
                data.unitType ? `N'${this.escapeSql(data.unitType)}'` : 'NULL',
                data.budget ? data.budget : 'NULL',
                data.leadSource ? `N'${this.escapeSql(data.leadSource)}'` : 'NULL',
                `N'${this.escapeSql(data.status || 'جديد')}'`,
                `N'${this.escapeSql(data.priority || 'متوسط')}'`,
                data.assignedTo ? parseInt(data.assignedTo) : 'NULL',
                data.notes ? `N'${this.escapeSql(data.notes)}'` : 'NULL',
                data.nextFollowUp ? `'${data.nextFollowUp}'` : 'NULL',
                'GETDATE()',
                'GETDATE()'
            ];

            const insertQuery = `
                INSERT INTO Leads (${columns.join(', ')})
                OUTPUT INSERTED.id
                VALUES (${values.join(', ')})
            `;

            const result = await this.queryAsync(insertQuery);
            const newId = result[0]?.id;

            if (!newId) throw new Error('فشل في إنشاء العميل');

            return await this.getClientById(newId);
        } catch (error) {
            console.error('❌ LeedsService.createClient:', error);
            throw error;
        }
    }

    // ========== تحديث عميل (lead) ==========
    async updateClient(id, data) {
        try {
            const checkQuery = `SELECT id FROM Leads WHERE id = ${parseInt(id)}`;
            const exists = await this.queryAsync(checkQuery);
            if (exists.length === 0) {
                throw new Error('العميل غير موجود أو لا يمكن تعديله');
            }

            const updateFields = [];

            if (data.customerName) updateFields.push(`customerName = N'${this.escapeSql(data.customerName)}'`);
            if (data.customerEmail) updateFields.push(`customerEmail = N'${this.escapeSql(data.customerEmail)}'`);
            if (data.customerPhone) updateFields.push(`customerPhone = N'${this.escapeSql(data.customerPhone)}'`);
            if (data.customerNationalId !== undefined) updateFields.push(`customerNationalId = N'${this.escapeSql(data.customerNationalId || '')}'`);
            if (data.customerAddress !== undefined) updateFields.push(`customerAddress = N'${this.escapeSql(data.customerAddress || '')}'`);
            if (data.projectId !== undefined) updateFields.push(`projectId = ${data.projectId ? parseInt(data.projectId) : 'NULL'}`);
            if (data.unitType !== undefined) updateFields.push(`unitType = N'${this.escapeSql(data.unitType || '')}'`);
            if (data.budget !== undefined) updateFields.push(`budget = ${data.budget ? data.budget : 'NULL'}`);
            if (data.leadSource !== undefined) updateFields.push(`leadSource = N'${this.escapeSql(data.leadSource || '')}'`);
            if (data.status) updateFields.push(`status = N'${this.escapeSql(data.status)}'`);
            if (data.priority) updateFields.push(`priority = N'${this.escapeSql(data.priority)}'`);
            if (data.assignedTo !== undefined) updateFields.push(`assignedTo = ${data.assignedTo ? parseInt(data.assignedTo) : 'NULL'}`);
            if (data.notes !== undefined) updateFields.push(`notes = N'${this.escapeSql(data.notes || '')}'`);
            if (data.nextFollowUp !== undefined) updateFields.push(`nextFollowUp = ${data.nextFollowUp ? `'${data.nextFollowUp}'` : 'NULL'}`);

            if (updateFields.length === 0) return await this.getClientById(id);

            updateFields.push('updatedAt = GETDATE()');

            const updateQuery = `
                UPDATE Leads
                SET ${updateFields.join(', ')}
                WHERE id = ${parseInt(id)}
            `;

            await this.executeAsync(updateQuery);
            return await this.getClientById(id);
        } catch (error) {
            console.error('❌ LeedsService.updateClient:', error);
            throw error;
        }
    }

    // ========== حذف عميل (lead) ==========
    async deleteClient(id) {
        try {
            // أولاً نجلب العميل لنعرف رقم هاتفه
            const client = await this.getClientById(id);
            if (!client) {
                throw new Error('العميل غير موجود أو لا يمكن حذفه');
            }

            // نتحقق إذا كان هناك عقود مرتبطة بنفس رقم الهاتف
            if (client.customerPhone) {
                const contractCheck = `
                    SELECT id FROM Contracts 
                    WHERE customerPhone = N'${this.escapeSql(client.customerPhone)}'
                `;
                const contracts = await this.queryAsync(contractCheck);
                if (contracts.length > 0) {
                    throw new Error('لا يمكن حذف عميل لديه عقود نشطة مرتبطة بنفس رقم الهاتف');
                }
            }

            // حذف العميل من Leads
            await this.executeAsync(`DELETE FROM Leads WHERE id = ${parseInt(id)}`);
            return true;
        } catch (error) {
            console.error('❌ LeedsService.deleteClient:', error);
            throw error;
        }
    }

    // ========== إحصائيات العملاء من جدول Leads فقط ==========
    async getClientsStats() {
        try {
            // إجمالي العملاء من Leads
            const totalResult = await this.queryAsync(`SELECT COUNT(*) as total FROM Leads`);
            const totalClients = totalResult[0]?.total || 0;

            // العملاء المحتملين (ليس لديهم عقود) - نستخدم left join مع Contracts على رقم الهاتف
            const potentialResult = await this.queryAsync(`
                SELECT COUNT(DISTINCT l.id) as potential
                FROM Leads l
                LEFT JOIN Contracts c ON l.customerPhone = c.customerPhone
                WHERE c.id IS NULL
            `);
            const potentialClients = potentialResult[0]?.potential || 0;

            // العملاء المتعاقدين (لديهم عقود) - inner join على رقم الهاتف
            const contractedResult = await this.queryAsync(`
                SELECT COUNT(DISTINCT l.id) as contracted
                FROM Leads l
                INNER JOIN Contracts c ON l.customerPhone = c.customerPhone
            `);
            const contractedClients = contractedResult[0]?.contracted || 0;

            // عدد العقود النشطة (من جدول Contracts مباشرة)
            const activeContractsQuery = `SELECT COUNT(*) as active FROM Contracts WHERE contractStatus = N'نشط'`;
            const activeResult = await this.queryAsync(activeContractsQuery);
            const activeContracts = activeResult[0]?.active || 0;

            return {
                totalClients,
                potentialClients,
                contractedClients,
                activeContracts
            };
        } catch (error) {
            console.error('❌ LeedsService.getClientsStats:', error);
            throw error;
        }
    }

    // ========== جلب جميع المشاريع للقوائم ==========
    async getAllProjects() {
        try {
            const query = `
                SELECT id, projectCode, projectName
                FROM Projects
                WHERE status != N'مباع'
                ORDER BY projectName
            `;
            return await this.queryAsync(query);
        } catch (error) {
            console.error('❌ LeedsService.getAllProjects:', error);
            return [];
        }
    }

    // ========== تصدير العملاء ==========
    async exportClients() {
        try {
            const result = await this.getAllClients(1, 10000, 'newest', {});
            return result.clients.map(client => ({
                'كود العميل': client.clientCode || '',
                'الاسم': client.customerName,
                'البريد': client.customerEmail,
                'الهاتف': client.customerPhone,
                'المشروع': client.projectName || '',
                'نوع العميل': client.clientType,
                'الحالة': client.status,
                'الأولوية': client.priority,
                'تاريخ التسجيل': client.createdAt ? new Date(client.createdAt).toLocaleDateString('ar-SA') : '',
                'عدد العقود': client.contracts ? client.contracts.length : 0
            }));
        } catch (error) {
            console.error('❌ LeedsService.exportClients:', error);
            return [];
        }
    }
}

module.exports = new LeedsService();