// 📁 Backend/services/admin/payments.service.js
const sql = require('msnodesqlv8');
const contractsService = require('./contracts.service');

const connectionString = "Server=DESKTOP-54ST25S\\ATTENDANCE;Database=abh;Trusted_Connection=Yes;Driver={SQL Server Native Client 11.0}";

class PaymentsService {
    
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

    // دالة مساعدة لتحويل طريقة الدفع إلى الصيغة الصحيحة (للتوافق مع CHECK constraint)
    mapPaymentMethod(method) {
        if (!method) return null;
        const mapping = {
            'تحويل بنكي': 'تحويل_بنكي',
            'شيك': 'شيك',
            'نقدي': 'نقدي',
            'بطاقة ائتمان': 'بطاقة_ائتمان',
            'حوالة بنكية': 'حوالة_بنكية',
            'أخرى': 'أخرى'
        };
        // إذا كان القيمة بالفعل بصيغة صحيحة (بشرطة سفلية) نعيدها، وإلا نبحث عن التطابق
        return mapping[method] || method;
    }

    async getContractDetails(contractId) {
        try {
            const query = `
                SELECT 
                    c.*,
                    p.projectName
                FROM Contracts c
                LEFT JOIN Projects p ON c.projectId = p.id
                WHERE c.id = ${parseInt(contractId)}
            `;
            const result = await this.queryAsync(query);
            return result && result.length > 0 ? result[0] : null;
        } catch (error) {
            console.error('❌ getContractDetails error:', error);
            return null;
        }
    }

    // ========== جلب قائمة مدفوعات موحدة مع فلترة ==========
    async getAllPayments(page = 1, limit = 25, sort = 'newest', filters = {}) {
        try {
            let whereClausesPayments = [];
            let whereClausesSchedules = [];

            // البحث النصي
            if (filters.search && filters.search.trim() !== '') {
                const searchTerm = `%${this.escapeSql(filters.search)}%`;
                whereClausesPayments.push(`(
                    p.paymentNumber LIKE N'${searchTerm}' OR 
                    c.contractNumber LIKE N'${searchTerm}' OR 
                    c.customerName LIKE N'${searchTerm}' OR 
                    pr.projectName LIKE N'${searchTerm}'
                )`);
                whereClausesSchedules.push(`(
                    c.contractNumber LIKE N'${searchTerm}' OR 
                    c.customerName LIKE N'${searchTerm}' OR 
                    pr.projectName LIKE N'${searchTerm}'
                )`);
            }

            // فلترة حسب الحالة
            if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
                const statusList = filters.status.map(s => `N'${this.escapeSql(s)}'`).join(', ');
                whereClausesPayments.push(`p.status IN (${statusList})`);
                whereClausesSchedules.push(`ps.status IN (${statusList})`);
            }

            // فلترة حسب طريقة الدفع (تنطبق فقط على Payments)
            if (filters.method && Array.isArray(filters.method) && filters.method.length > 0) {
                // تحويل القيم الواردة إلى الصيغة الصحيحة للاستعلام
                const mappedMethods = filters.method.map(m => {
                    const mapped = this.mapPaymentMethod(m);
                    return `N'${this.escapeSql(mapped)}'`;
                }).join(', ');
                whereClausesPayments.push(`p.paymentMethod IN (${mappedMethods})`);
            }

            // تحديد الشهر المطلوب
            if (filters.month && filters.year) {
                const month = parseInt(filters.month);
                const year = parseInt(filters.year);
                // التحقق من صحة الأرقام
                if (!isNaN(month) && !isNaN(year)) {
                    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
                    const lastDay = new Date(year, month, 0).getDate();
                    const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
                    
                    whereClausesPayments.push(`p.paymentDate BETWEEN '${startDate}' AND '${endDate}'`);
                    whereClausesSchedules.push(`ps.dueDate <= '${endDate}'`);
                }
            }

            // شرط عدم عرض الأقساط المسددة بالكامل
            whereClausesSchedules.push(`ps.status != N'مسدد'`);

            const wherePayments = whereClausesPayments.length > 0 ? `WHERE ${whereClausesPayments.join(' AND ')}` : '';
            const whereSchedules = whereClausesSchedules.length > 0 ? `WHERE ${whereClausesSchedules.join(' AND ')}` : '';

            // ترتيب
            let orderBy = 'ORDER BY ';
            switch(sort) {
                case 'oldest': orderBy += 'createdAt ASC'; break;
                case 'amount_desc': orderBy += 'amount DESC'; break;
                case 'amount_asc': orderBy += 'amount ASC'; break;
                case 'due_date': orderBy += 'dueDate ASC'; break;
                default: orderBy += 'createdAt DESC';
            }

            const unionQuery = `
                SELECT 
                    p.id,
                    p.paymentNumber,
                    p.contractId,
                    c.contractNumber,
                    c.customerName,
                    pr.projectName,
                    p.amount,
                    ps.dueDate,
                    p.paymentDate,
                    p.paymentMethod,
                    p.bankName,
                    p.referenceNumber,
                    p.receiptNumber,
                    p.status,
                    'دفعة عقد' as paymentType,
                    u.fullName as collectedByName,
                    p.createdAt,
                    p.updatedAt,
                    'payment' as source,
                    0 as isScheduled
                FROM Payments p
                INNER JOIN Contracts c ON p.contractId = c.id
                LEFT JOIN Projects pr ON c.projectId = pr.id
                LEFT JOIN Users u ON p.collectedBy = u.id
                LEFT JOIN PaymentSchedules ps ON p.paymentScheduleId = ps.id
                ${wherePayments}

                UNION ALL

                SELECT 
                    ps.id * -1 as id,
                    CONCAT('SCH-', ps.id) as paymentNumber,
                    ps.contractId,
                    c.contractNumber,
                    c.customerName,
                    pr.projectName,
                    ps.amountDue as amount,
                    ps.dueDate,
                    NULL as paymentDate,
                    NULL as paymentMethod,
                    NULL as bankName,
                    NULL as referenceNumber,
                    NULL as receiptNumber,
                    ps.status,
                    CASE 
                        WHEN ps.installmentNumber = 1 THEN N'دفعة أولى'
                        ELSE N'قسط شهري'
                    END as paymentType,
                    NULL as collectedByName,
                    ps.createdAt,
                    ps.updatedAt,
                    'schedule' as source,
                    1 as isScheduled
                FROM PaymentSchedules ps
                INNER JOIN Contracts c ON ps.contractId = c.id
                LEFT JOIN Projects pr ON c.projectId = pr.id
                ${whereSchedules}
            `;

            const fullQuery = `
                SELECT * FROM (${unionQuery}) AS combined
                ${orderBy}
                OFFSET ${(page - 1) * limit} ROWS
                FETCH NEXT ${limit} ROWS ONLY
            `;

            const countQuery = `
                SELECT COUNT(*) as total FROM (${unionQuery}) AS combined
            `;

            const [payments, countResult] = await Promise.all([
                this.queryAsync(fullQuery),
                this.queryAsync(countQuery)
            ]);

            const totalItems = countResult[0]?.total || 0;
            const totalPages = Math.ceil(totalItems / limit);

            return {
                payments,
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
            console.error('❌ PaymentsService.getAllPayments:', error);
            throw error;
        }
    }

    // ========== إضافة دفعة إلى عقد (توزيع المبلغ على الأقساط) ==========
    async addPaymentToContract(contractId, paymentData) {
        try {
            console.log('💰 PaymentsService.addPaymentToContract called with:', { contractId, paymentData });
            
            // تحويل طريقة الدفع
            const mappedPaymentData = {
                ...paymentData,
                paymentMethod: this.mapPaymentMethod(paymentData.paymentMethod)
            };

            // استدعاء الدالة من contracts.service (إعادة استخدام المنطق الصحيح)
            return await contractsService.addPayment(contractId, mappedPaymentData);
        } catch (error) {
            console.error('❌ PaymentsService.addPaymentToContract error:', error);
            throw error;
        }
    }

    // ========== إحصاءات المدفوعات للشهر الحالي (معدلة) ==========
    async getPaymentStats() {
        try {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1;
            const startOfMonth = `${year}-${month.toString().padStart(2, '0')}-01`;
            const endOfMonth = new Date(year, month, 0).toISOString().split('T')[0];

            // 1. إجمالي المدفوعات المؤكدة هذا الشهر
            const paidResult = await this.queryAsync(`
                SELECT ISNULL(SUM(amount), 0) as paidAmount, COUNT(*) as paidCount
                FROM Payments
                WHERE status = N'مؤكد'
                  AND paymentDate BETWEEN '${startOfMonth}' AND '${endOfMonth}'
            `);
            const paidAmount = parseFloat(paidResult[0]?.paidAmount || 0);
            const paidCount = paidResult[0]?.paidCount || 0;

            // 2. الأقساط المستحقة هذا الشهر (غير مسددة، تاريخ استحقاق في الشهر)
            const pendingResult = await this.queryAsync(`
                SELECT ISNULL(SUM(amountDue - ISNULL(paidAmount, 0)), 0) as pendingAmount, COUNT(*) as pendingCount
                FROM PaymentSchedules
                WHERE status != N'مسدد'
                  AND dueDate BETWEEN '${startOfMonth}' AND '${endOfMonth}'
            `);
            const pendingAmount = parseFloat(pendingResult[0]?.pendingAmount || 0);
            const pendingCount = pendingResult[0]?.pendingCount || 0;

            // 3. الأقساط المتأخرة (غير مسددة، تاريخ استحقاق < startOfMonth)
            const overdueResult = await this.queryAsync(`
                SELECT ISNULL(SUM(amountDue - ISNULL(paidAmount, 0)), 0) as overdueAmount, COUNT(*) as overdueCount
                FROM PaymentSchedules
                WHERE status != N'مسدد'
                  AND dueDate < '${startOfMonth}'
            `);
            const overdueAmount = parseFloat(overdueResult[0]?.overdueAmount || 0);
            const overdueCount = overdueResult[0]?.overdueCount || 0;

            const totalAmount = paidAmount + pendingAmount;

            return {
                totalAmount,
                paidAmount,
                pendingAmount,
                overdueAmount,
                paidCount,
                pendingCount,
                overdueCount
            };
        } catch (error) {
            console.error('❌ PaymentsService.getPaymentStats error:', error);
            return {
                totalAmount: 0,
                paidAmount: 0,
                pendingAmount: 0,
                overdueAmount: 0,
                paidCount: 0,
                pendingCount: 0,
                overdueCount: 0
            };
        }
    }

    // ========== الأقساط القادمة ==========
    async getUpcomingPayments(limit = 5) {
        try {
            const query = `
                SELECT TOP ${limit}
                    ps.id,
                    ps.contractId,
                    c.contractNumber,
                    c.customerName,
                    p.projectName,
                    ps.amountDue as amount,
                    ps.dueDate,
                    ps.status,
                    CASE 
                        WHEN ps.installmentNumber = 1 THEN N'دفعة أولى'
                        ELSE N'قسط شهري'
                    END as paymentType
                FROM PaymentSchedules ps
                INNER JOIN Contracts c ON ps.contractId = c.id
                LEFT JOIN Projects p ON c.projectId = p.id
                WHERE ps.status IN (N'مستحق', N'متأخر')
                  AND ps.dueDate >= GETDATE()
                ORDER BY ps.dueDate ASC
            `;
            return await this.queryAsync(query);
        } catch (error) {
            console.error('❌ PaymentsService.getUpcomingPayments:', error);
            return [];
        }
    }

    // ========== جلب دفعة واحدة ==========
    async getPaymentById(id) {
        try {
            // التحقق من أن id هو رقم صحيح
            if (id === undefined || id === null || id === '') {
                throw new Error('معرّف الدفعة غير صالح');
            }
            
            const numericId = Number(id);
            if (isNaN(numericId) || !Number.isInteger(numericId)) {
                throw new Error('معرّف الدفعة يجب أن يكون رقماً صحيحاً');
            }

            const isSchedule = numericId < 0;
            const absId = Math.abs(numericId);

            if (isSchedule) {
                const query = `
                    SELECT 
                        ps.id * -1 as id,
                        CONCAT('SCH-', ps.id) as paymentNumber,
                        ps.contractId,
                        c.contractNumber,
                        c.customerName,
                        p.projectName,
                        ps.amountDue as amount,
                        ps.dueDate,
                        NULL as paymentDate,
                        NULL as paymentMethod,
                        NULL as bankName,
                        NULL as referenceNumber,
                        NULL as receiptNumber,
                        ps.status,
                        CASE 
                            WHEN ps.installmentNumber = 1 THEN N'دفعة أولى'
                            ELSE N'قسط شهري'
                        END as paymentType,
                        NULL as collectedByName,
                        ps.notes,
                        ps.createdAt,
                        ps.updatedAt,
                        1 as isScheduled
                    FROM PaymentSchedules ps
                    INNER JOIN Contracts c ON ps.contractId = c.id
                    LEFT JOIN Projects p ON c.projectId = p.id
                    WHERE ps.id = ${absId}
                `;
                const result = await this.queryAsync(query);
                return result && result.length > 0 ? result[0] : null;
            } else {
                const query = `
                    SELECT 
                        p.id,
                        p.paymentNumber,
                        p.contractId,
                        c.contractNumber,
                        c.customerName,
                        pr.projectName,
                        p.amount,
                        ps.dueDate,
                        p.paymentDate,
                        p.paymentMethod,
                        p.bankName,
                        p.referenceNumber,
                        p.receiptNumber,
                        p.status,
                        'دفعة عقد' as paymentType,
                        u.fullName as collectedByName,
                        p.notes,
                        p.createdAt,
                        p.updatedAt,
                        0 as isScheduled
                    FROM Payments p
                    INNER JOIN Contracts c ON p.contractId = c.id
                    LEFT JOIN Projects pr ON c.projectId = pr.id
                    LEFT JOIN Users u ON p.collectedBy = u.id
                    LEFT JOIN PaymentSchedules ps ON p.paymentScheduleId = ps.id
                    WHERE p.id = ${absId}
                `;
                const result = await this.queryAsync(query);
                return result && result.length > 0 ? result[0] : null;
            }
        } catch (error) {
            console.error('❌ PaymentsService.getPaymentById:', error);
            throw error;
        }
    }

    // ========== دفع قسط معين ==========
    async paySchedule(scheduleId, paymentData) {
        try {
            const absScheduleId = Math.abs(parseInt(scheduleId));
            console.log('💰 paySchedule called with:', { scheduleId, absScheduleId, paymentData });

            const scheduleQuery = `SELECT * FROM PaymentSchedules WHERE id = ${absScheduleId}`;
            const schedules = await this.queryAsync(scheduleQuery);
            if (!schedules || schedules.length === 0) {
                throw new Error('القسط غير موجود');
            }
            const schedule = schedules[0];
            const contractId = schedule.contractId;

            let amount = parseFloat(paymentData.amount);
            if (isNaN(amount) || amount <= 0) {
                throw new Error('المبلغ يجب أن يكون أكبر من صفر');
            }

            const amountDue = parseFloat(schedule.amountDue);
            const paidSoFar = parseFloat(schedule.paidAmount || 0);
            const remainingForSchedule = amountDue - paidSoFar;

            if (amount > remainingForSchedule + 0.01) {
                throw new Error(`المبلغ المدخل (${amount}) يتجاوز المتبقي على هذا القسط (${remainingForSchedule})`);
            }

            const newPaid = paidSoFar + amount;
            const isFullyPaid = Math.abs(newPaid - amountDue) < 0.01;

            const updateSchedule = `
                UPDATE PaymentSchedules
                SET paidAmount = ${newPaid},
                    status = ${isFullyPaid ? 'N\'مسدد\'' : 'N\'مستحق\''},
                    paidAt = ${isFullyPaid ? 'GETDATE()' : 'NULL'},
                    updatedAt = GETDATE()
                WHERE id = ${absScheduleId}
            `;
            await this.executeAsync(updateSchedule);

            // تحويل طريقة الدفع إلى الصيغة الصحيحة
            const mappedPaymentMethod = this.mapPaymentMethod(paymentData.paymentMethod);
            if (!mappedPaymentMethod) {
                throw new Error('طريقة الدفع غير صالحة');
            }

            const insertPayment = `
                INSERT INTO Payments (
                    contractId, paymentScheduleId, amount, paymentDate,
                    paymentMethod, bankName, referenceNumber, receiptNumber, notes, status,
                    collectedBy, createdAt, updatedAt
                ) VALUES (
                    ${contractId},
                    ${absScheduleId},
                    ${amount},
                    '${paymentData.paymentDate}',
                    N'${this.escapeSql(mappedPaymentMethod)}',
                    ${paymentData.bankName ? `N'${this.escapeSql(paymentData.bankName)}'` : 'NULL'},
                    ${paymentData.referenceNumber ? `N'${this.escapeSql(paymentData.referenceNumber)}'` : 'NULL'},
                    ${paymentData.receiptNumber ? `N'${this.escapeSql(paymentData.receiptNumber)}'` : 'NULL'},
                    ${paymentData.notes ? `N'${this.escapeSql(paymentData.notes)}'` : 'NULL'},
                    N'مؤكد',
                    ${paymentData.collectedBy || 1},
                    GETDATE(),
                    GETDATE()
                )
            `;
            await this.executeAsync(insertPayment);

            await contractsService.updateContractPaymentStatus(contractId);

            return { success: true, message: 'تم إضافة الدفعة بنجاح' };
        } catch (error) {
            console.error('❌ PaymentsService.paySchedule error:', error);
            throw error;
        }
    }

    // ========== تحديث حالة دفعة (معدلة لتدعم إلغاء الدفعة وإرجاع القسط لمستحق) ==========
    async updatePaymentStatus(paymentId, status, reason) {
        try {
            const paymentQuery = `SELECT * FROM Payments WHERE id = ${parseInt(paymentId)}`;
            const payments = await this.queryAsync(paymentQuery);
            if (!payments || payments.length === 0) {
                throw new Error('الدفعة غير موجودة');
            }
            const payment = payments[0];

            // إذا كانت الحالة المطلوبة هي 'مستحق'، نقوم بحذف الدفعة وإعادة القسط إلى حالته السابقة
            if (status === 'مستحق') {
                if (!payment.paymentScheduleId) {
                    throw new Error('هذه الدفعة غير مرتبطة بجدول أقساط، لا يمكن إرجاعها إلى مستحق');
                }

                // تحديث القسط: طرح المبلغ المدفوع وإعادة الحالة إلى مستحق (أو متأخر حسب تاريخ الاستحقاق)
                const scheduleQuery = `SELECT * FROM PaymentSchedules WHERE id = ${payment.paymentScheduleId}`;
                const schedules = await this.queryAsync(scheduleQuery);
                if (!schedules || schedules.length === 0) {
                    throw new Error('القسط المرتبط غير موجود');
                }
                const schedule = schedules[0];

                const newPaid = parseFloat(schedule.paidAmount) - parseFloat(payment.amount);
                const amountDue = parseFloat(schedule.amountDue);
                
                // حساب الحالة الجديدة للقسط
                let newScheduleStatus;
                const today = new Date();
                const dueDate = new Date(schedule.dueDate);
                if (newPaid <= 0) {
                    // لم يعد هناك أي مبلغ مدفوع
                    newScheduleStatus = dueDate < today ? 'متأخر' : 'مستحق';
                } else if (Math.abs(newPaid - amountDue) < 0.01) {
                    // لا ينبغي أن يحدث هنا لأننا طرحنا المبلغ
                    newScheduleStatus = 'مسدد';
                } else {
                    newScheduleStatus = dueDate < today ? 'متأخر' : 'مستحق';
                }

                const updateSchedule = `
                    UPDATE PaymentSchedules
                    SET paidAmount = ${newPaid},
                        status = N'${this.escapeSql(newScheduleStatus)}',
                        paidAt = ${newPaid >= amountDue ? 'GETDATE()' : 'NULL'},
                        updatedAt = GETDATE()
                    WHERE id = ${payment.paymentScheduleId}
                `;
                await this.executeAsync(updateSchedule);

                // حذف الدفعة من جدول Payments
                await this.executeAsync(`DELETE FROM Payments WHERE id = ${parseInt(paymentId)}`);

                // تحديث حالة العقد
                await contractsService.updateContractPaymentStatus(payment.contractId);

                return true;
            } else {
                // الحالات الأخرى: يجب أن تكون ضمن القيم المسموحة في CHECK constraint
                const allowedStatuses = ['مؤكد', 'ملغي', 'مؤقت']; // حسب قاعدة البيانات
                if (!allowedStatuses.includes(status)) {
                    throw new Error(`الحالة ${status} غير مسموح بها لجدول Payments`);
                }

                const updateQuery = `
                    UPDATE Payments
                    SET status = N'${this.escapeSql(status)}',
                        updatedAt = GETDATE()
                    WHERE id = ${parseInt(paymentId)}
                `;
                await this.executeAsync(updateQuery);

                // إذا كانت الدفعة مرتبطة بجدول أقساط، قد نحتاج لتحديث القسط أيضاً (مثلاً إذا تم إلغاء الدفعة)
                if (payment.paymentScheduleId && status === 'ملغي') {
                    // مشابه للإلغاء: نطرح المبلغ من القسط
                    const scheduleQuery = `SELECT * FROM PaymentSchedules WHERE id = ${payment.paymentScheduleId}`;
                    const schedules = await this.queryAsync(scheduleQuery);
                    if (schedules && schedules.length > 0) {
                        const schedule = schedules[0];
                        const newPaid = parseFloat(schedule.paidAmount) - parseFloat(payment.amount);
                        const amountDue = parseFloat(schedule.amountDue);
                        
                        const today = new Date();
                        const dueDate = new Date(schedule.dueDate);
                        let newScheduleStatus;
                        if (newPaid <= 0) {
                            newScheduleStatus = dueDate < today ? 'متأخر' : 'مستحق';
                        } else if (Math.abs(newPaid - amountDue) < 0.01) {
                            newScheduleStatus = 'مسدد';
                        } else {
                            newScheduleStatus = dueDate < today ? 'متأخر' : 'مستحق';
                        }

                        const updateSchedule = `
                            UPDATE PaymentSchedules
                            SET paidAmount = ${newPaid},
                                status = N'${this.escapeSql(newScheduleStatus)}',
                                paidAt = ${newPaid >= amountDue ? 'GETDATE()' : 'NULL'},
                                updatedAt = GETDATE()
                            WHERE id = ${payment.paymentScheduleId}
                        `;
                        await this.executeAsync(updateSchedule);
                    }
                }

                await contractsService.updateContractPaymentStatus(payment.contractId);
                return true;
            }
        } catch (error) {
            console.error('❌ PaymentsService.updatePaymentStatus error:', error);
            throw error;
        }
    }

    // ========== حذف دفعة ==========
    async deletePayment(paymentId) {
        try {
            const paymentQuery = `SELECT * FROM Payments WHERE id = ${parseInt(paymentId)}`;
            const payments = await this.queryAsync(paymentQuery);
            if (!payments || payments.length === 0) {
                throw new Error('الدفعة غير موجودة');
            }
            const payment = payments[0];

            if (payment.paymentScheduleId) {
                const scheduleQuery = `SELECT * FROM PaymentSchedules WHERE id = ${payment.paymentScheduleId}`;
                const schedules = await this.queryAsync(scheduleQuery);
                if (schedules && schedules.length > 0) {
                    const schedule = schedules[0];
                    const newPaid = parseFloat(schedule.paidAmount) - parseFloat(payment.amount);
                    const isFullyPaid = Math.abs(newPaid - parseFloat(schedule.amountDue)) < 0.01;
                    
                    const today = new Date();
                    const dueDate = new Date(schedule.dueDate);
                    let newStatus;
                    if (newPaid <= 0) {
                        newStatus = dueDate < today ? 'متأخر' : 'مستحق';
                    } else if (isFullyPaid) {
                        newStatus = 'مسدد';
                    } else {
                        newStatus = dueDate < today ? 'متأخر' : 'مستحق';
                    }

                    const updateSchedule = `
                        UPDATE PaymentSchedules
                        SET paidAmount = ${newPaid},
                            status = N'${this.escapeSql(newStatus)}',
                            paidAt = ${newPaid >= parseFloat(schedule.amountDue) ? 'GETDATE()' : 'NULL'},
                            updatedAt = GETDATE()
                        WHERE id = ${payment.paymentScheduleId}
                    `;
                    await this.executeAsync(updateSchedule);
                }
            }

            await this.executeAsync(`DELETE FROM Payments WHERE id = ${parseInt(paymentId)}`);

            await contractsService.updateContractPaymentStatus(payment.contractId);

            return true;
        } catch (error) {
            console.error('❌ PaymentsService.deletePayment error:', error);
            throw error;
        }
    }

    // ========== بيانات المخطط الشهري (خطي) ==========
    async getChartData(period) {
        try {
            const now = new Date();
            const labels = [];
            const paidData = [];
            const pendingData = [];

            let monthsCount = 6;
            if (period === 'week') monthsCount = 1;
            else if (period === 'month') monthsCount = 1;
            else if (period === 'quarter') monthsCount = 3;
            else if (period === 'year') monthsCount = 12;

            for (let i = monthsCount - 1; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const year = d.getFullYear();
                const month = d.getMonth() + 1;
                const monthName = d.toLocaleDateString('ar-SA', { month: 'short' });
                labels.push(monthName);

                const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
                const endDate = new Date(year, month, 0).toISOString().split('T')[0];

                const paidResult = await this.queryAsync(`
                    SELECT ISNULL(SUM(amount), 0) as total
                    FROM Payments
                    WHERE paymentDate BETWEEN '${startDate}' AND '${endDate}'
                      AND status = N'مؤكد'
                `);
                paidData.push(paidResult[0]?.total || 0);

                const pendingResult = await this.queryAsync(`
                    SELECT ISNULL(SUM(amountDue - ISNULL(paidAmount, 0)), 0) as total
                    FROM PaymentSchedules
                    WHERE dueDate <= '${endDate}'
                      AND status != N'مسدد'
                `);
                pendingData.push(pendingResult[0]?.total || 0);
            }

            return {
                labels,
                paid: paidData,
                pending: pendingData
            };
        } catch (error) {
            console.error('❌ PaymentsService.getChartData error:', error);
            return {
                labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
                paid: [12000, 15000, 18000, 22000, 35000, 47000],
                pending: [45000, 42000, 39000, 36000, 378000, 350000]
            };
        }
    }

    // ========== التوقعات المالية - الإصدار الجديد بدون BETWEEN ==========
    async getFinancialForecast(months) {
        try {
            const today = new Date();
            const startMonth = today.getMonth() + 1; // الشهر الحالي (1-12)
            const startYear = today.getFullYear();
            
            const forecast = [];

            for (let i = 1; i <= months; i++) {
                // حساب الشهر التالي
                let targetMonth = startMonth + i;
                let targetYear = startYear;
                if (targetMonth > 12) {
                    targetMonth -= 12;
                    targetYear += 1;
                }

                // التحقق من أن targetMonth و targetYear أرقام صحيحة
                if (isNaN(targetMonth) || isNaN(targetYear) || !Number.isInteger(targetMonth) || !Number.isInteger(targetYear)) {
                    console.warn(`⚠️ Invalid targetMonth or targetYear: ${targetMonth}, ${targetYear}`);
                    continue;
                }

                // التأكد من أن targetMonth بين 1 و 12
                if (targetMonth < 1 || targetMonth > 12) {
                    console.warn(`⚠️ targetMonth out of range: ${targetMonth}`);
                    continue;
                }

                // جلب الأقساط الخاصة بهذا الشهر باستخدام MONTH و YEAR
                const schedulesQuery = `
                    SELECT 
                        ps.id,
                        ps.contractId,
                        ps.amountDue,
                        ps.dueDate,
                        ps.status,
                        c.customerName,
                        c.customerPhone,
                        c.customerEmail,
                        c.unitDetails,
                        c.contractNumber,
                        p.projectName
                    FROM PaymentSchedules ps
                    INNER JOIN Contracts c ON ps.contractId = c.id
                    LEFT JOIN Projects p ON c.projectId = p.id
                    WHERE MONTH(ps.dueDate) = ${targetMonth}
                      AND YEAR(ps.dueDate) = ${targetYear}
                      AND ps.status != N'مسدد'
                    ORDER BY ps.dueDate ASC
                `;

                console.log(`📊 Executing forecast query for month ${targetMonth}/${targetYear}:`, schedulesQuery);

                let schedules;
                try {
                    schedules = await this.queryAsync(schedulesQuery);
                } catch (queryErr) {
                    console.error(`❌ Error executing schedules query for month ${targetMonth}/${targetYear}:`, queryErr);
                    continue;
                }

                // حساب الإجمالي والمعلومات
                let totalAmount = 0;
                const uniqueContracts = new Set();
                const uniqueCustomers = new Set();
                const customerPayments = [];

                schedules.forEach(sch => {
                    const amount = parseFloat(sch.amountDue) || 0;
                    totalAmount += amount;
                    if (sch.contractNumber) uniqueContracts.add(sch.contractNumber);
                    if (sch.customerName) uniqueCustomers.add(sch.customerName);

                    customerPayments.push({
                        id: sch.id,
                        contractId: sch.contractId,
                        contractNumber: sch.contractNumber,
                        customerName: sch.customerName,
                        customerPhone: sch.customerPhone,
                        customerEmail: sch.customerEmail,
                        unitDetails: sch.unitDetails,
                        projectName: sch.projectName,
                        amount: amount,
                        dueDate: sch.dueDate,
                        status: sch.status
                    });
                });

                // اسم الشهر بالعربية
                const monthNames = [
                    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
                    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
                ];
                const monthName = monthNames[targetMonth - 1] || 'غير معروف';

                forecast.push({
                    month: monthName,
                    year: targetYear,
                    totalAmount,
                    paymentsCount: schedules.length,
                    uniqueCustomers: uniqueCustomers.size,
                    uniqueContracts: uniqueContracts.size,
                    customerPayments: customerPayments
                });
            }

            return forecast;
        } catch (error) {
            console.error('❌ PaymentsService.getFinancialForecast error:', error);
            return [];
        }
    }

    // ========== تصدير المدفوعات ==========
    async exportPayments() {
        try {
            const unionQuery = `
                SELECT 
                    p.paymentNumber as 'رقم الدفعة',
                    c.contractNumber as 'رقم العقد',
                    c.customerName as 'العميل',
                    pr.projectName as 'المشروع',
                    p.amount as 'المبلغ',
                    CONVERT(NVARCHAR, ps.dueDate, 23) as 'تاريخ الاستحقاق',
                    CONVERT(NVARCHAR, p.paymentDate, 23) as 'تاريخ الدفع',
                    p.paymentMethod as 'طريقة الدفع',
                    p.status as 'الحالة',
                    'دفعة عقد' as 'نوع الدفعة',
                    p.receiptNumber as 'رقم الإيصال',
                    p.referenceNumber as 'رقم المرجع',
                    p.bankName as 'البنك',
                    u.fullName as 'المحصل',
                    CONVERT(NVARCHAR, p.updatedAt, 23) as 'آخر تحديث'
                FROM Payments p
                INNER JOIN Contracts c ON p.contractId = c.id
                LEFT JOIN Projects pr ON c.projectId = pr.id
                LEFT JOIN Users u ON p.collectedBy = u.id
                LEFT JOIN PaymentSchedules ps ON p.paymentScheduleId = ps.id

                UNION ALL

                SELECT 
                    CONCAT('SCH-', ps.id) as 'رقم الدفعة',
                    c.contractNumber as 'رقم العقد',
                    c.customerName as 'العميل',
                    pr.projectName as 'المشروع',
                    ps.amountDue as 'المبلغ',
                    CONVERT(NVARCHAR, ps.dueDate, 23) as 'تاريخ الاستحقاق',
                    NULL as 'تاريخ الدفع',
                    NULL as 'طريقة الدفع',
                    ps.status as 'الحالة',
                    CASE 
                        WHEN ps.installmentNumber = 1 THEN N'دفعة أولى'
                        ELSE N'قسط شهري'
                    END as 'نوع الدفعة',
                    NULL as 'رقم الإيصال',
                    NULL as 'رقم المرجع',
                    NULL as 'البنك',
                    NULL as 'المحصل',
                    CONVERT(NVARCHAR, ps.updatedAt, 23) as 'آخر تحديث'
                FROM PaymentSchedules ps
                INNER JOIN Contracts c ON ps.contractId = c.id
                LEFT JOIN Projects pr ON c.projectId = pr.id
                WHERE ps.status != N'مسدد'
            `;
            return await this.queryAsync(unionQuery);
        } catch (error) {
            console.error('❌ PaymentsService.exportPayments error:', error);
            return [];
        }
    }
}

module.exports = new PaymentsService();