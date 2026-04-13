// 📁 Backend/services/admin/bills.service.js
const sql = require('mssql');

require('dotenv').config();

// الحصول على pool من app.locals (تم تعيينه في server.js)
function getPool() {
    if (!global.dbPool) {
        throw new Error('قاعدة البيانات غير متصلة - global.dbPool غير موجود');
    }
    return global.dbPool;
}

class BillsService {
    
    async queryAsync(query, params = {}) {
        const pool = getPool();
        try {
            const result = await pool.request().query(query);
            return result.recordset || [];
        } catch (err) {
            console.error('❌ BillsService.queryAsync error:', err);
            throw err;
        }
    }

    async executeAsync(query) {
        const pool = getPool();
        try {
            const result = await pool.request().query(query);
            return result;
        } catch (err) {
            console.error('❌ BillsService.executeAsync error:', err);
            throw err;
        }
    }

    escapeSql(str) {
        if (!str) return '';
        return str.replace(/'/g, "''");
    }

    // ========== توليد رقم فاتورة فريد ==========
    async generateInvoiceNumber() {
        const year = new Date().getFullYear();
        const query = `
            SELECT MAX(CAST(SUBSTRING(invoiceNumber, 9, 4) AS INT)) as lastNum
            FROM invoices
            WHERE invoiceNumber LIKE N'INV-${year}-%' AND invoiceNumber IS NOT NULL
        `;
        const result = await this.queryAsync(query);
        const lastNum = result[0]?.lastNum || 0;
        const nextNum = lastNum + 1;
        const paddedNum = String(nextNum).padStart(4, '0');
        return `INV-${year}-${paddedNum}`;
    }

    // ========== تحديث حالة الفاتورة بناءً على المدفوع وتاريخ الاستحقاق ==========
    determineStatus(invoice) {
        if (invoice.paidAmount >= invoice.amount) return 'مدفوعة';
        const today = new Date();
        const dueDate = new Date(invoice.dueDate);
        if (dueDate < today) return 'متأخرة';
        return 'غير مدفوعة';
    }

    // ========== إعادة حساب المتبقي (للاستخدام الداخلي فقط) ==========
    calculateRemaining(amount, paid) {
        return amount - paid;
    }

    // ========== جلب جميع الفواتير مع فلترة ==========
    async getAllInvoices(page = 1, limit = 25, sort = 'newest', filters = {}) {
        try {
            let whereClauses = [];

            if (filters.search && filters.search.trim() !== '') {
                whereClauses.push(`(
                    invoiceNumber LIKE N'%${this.escapeSql(filters.search)}%' OR 
                    propertyName LIKE N'%${this.escapeSql(filters.search)}%' OR 
                    invoiceType LIKE N'%${this.escapeSql(filters.search)}%'
                )`);
            }

            if (filters.paymentStatus && Array.isArray(filters.paymentStatus) && filters.paymentStatus.length > 0) {
                const statusList = filters.paymentStatus.map(s => `N'${this.escapeSql(s)}'`).join(', ');
                whereClauses.push(`status IN (${statusList})`);
            }

            if (filters.invoiceType && Array.isArray(filters.invoiceType) && filters.invoiceType.length > 0) {
                const typeList = filters.invoiceType.map(t => `N'${this.escapeSql(t)}'`).join(', ');
                whereClauses.push(`invoiceType IN (${typeList})`);
            }

            if (filters.property && Array.isArray(filters.property) && filters.property.length > 0) {
                const propList = filters.property.map(p => parseInt(p)).join(', ');
                whereClauses.push(`propertyId IN (${propList})`);
            }

            const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

            let orderBy = 'ORDER BY ';
            switch(sort) {
                case 'oldest': orderBy += 'issueDate ASC'; break;
                case 'amount-high': orderBy += 'amount DESC'; break;
                case 'amount-low': orderBy += 'amount ASC'; break;
                case 'due-date': orderBy += 'dueDate ASC'; break;
                default: orderBy += 'issueDate DESC';
            }

            const offset = (page - 1) * limit;

            const query = `
                SELECT *
                FROM invoices
                ${whereClause}
                ${orderBy}
                OFFSET ${offset} ROWS
                FETCH NEXT ${limit} ROWS ONLY
            `;

            const countQuery = `
                SELECT COUNT(*) as total 
                FROM invoices
                ${whereClause}
            `;

            const [invoices, countResult] = await Promise.all([
                this.queryAsync(query),
                this.queryAsync(countQuery)
            ]);

            const totalItems = countResult[0]?.total || 0;
            const totalPages = Math.ceil(totalItems / limit);

            // تحويل حقل المدفوعات من JSON نصي إلى مصفوفة
            invoices.forEach(inv => {
                if (inv.payments) {
                    try {
                        inv.payments = JSON.parse(inv.payments);
                    } catch {
                        inv.payments = [];
                    }
                } else {
                    inv.payments = [];
                }
            });

            return {
                invoices,
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
            console.error('❌ BillsService.getAllInvoices:', error);
            throw error;
        }
    }

    // ========== جلب فاتورة واحدة ==========
    async getInvoiceById(id) {
        try {
            const query = `SELECT * FROM invoices WHERE id = ${parseInt(id)}`;
            const result = await this.queryAsync(query);
            if (!result || result.length === 0) return null;

            const invoice = result[0];
            if (invoice.payments) {
                try {
                    invoice.payments = JSON.parse(invoice.payments);
                } catch {
                    invoice.payments = [];
                }
            } else {
                invoice.payments = [];
            }
            return invoice;
        } catch (error) {
            console.error('❌ BillsService.getInvoiceById:', error);
            throw error;
        }
    }

    // ========== إنشاء فاتورة جديدة ==========
    async createInvoice(data) {
        try {
            // التحقق من وجود العقار
            if (!data.propertyId) throw new Error('معرف العقار مطلوب');

            // جلب اسم العقار من جدول المشاريع
            const projectQuery = `SELECT projectName FROM Projects WHERE id = ${parseInt(data.propertyId)}`;
            const projectResult = await this.queryAsync(projectQuery);
            if (!projectResult || projectResult.length === 0) throw new Error('العقار غير موجود');
            const propertyName = projectResult[0].projectName;

            // توليد رقم فاتورة
            const invoiceNumber = await this.generateInvoiceNumber();

            const amount = parseFloat(data.amount) || 0;
            const paidAmount = parseFloat(data.paidAmount) || 0;
            if (amount <= 0) throw new Error('المبلغ يجب أن يكون أكبر من صفر');

            // الحالة يتم حسابها من الدالة determineStatus
            const status = this.determineStatus({ amount, paidAmount, dueDate: data.dueDate });

            // لا نقوم بإدراج remainingAmount لأنه عمود محسوب
            const invoiceData = {
                invoiceNumber,
                propertyId: parseInt(data.propertyId),
                propertyName,
                invoiceType: data.invoiceType || 'خدمات',
                issueDate: data.issueDate || new Date().toISOString().split('T')[0],
                dueDate: data.dueDate,
                amount,
                paidAmount,
                status, // يتم إدراج الحالة
                meterReading: data.meterReading || '',
                notes: data.notes || '',
                payments: '[]',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const columns = Object.keys(invoiceData).join(', ');
            const values = Object.values(invoiceData).map(v => {
                if (typeof v === 'string') return `N'${this.escapeSql(v)}'`;
                return v;
            }).join(', ');

            const insertQuery = `
                INSERT INTO invoices (${columns})
                OUTPUT INSERTED.id
                VALUES (${values})
            `;

            const result = await this.queryAsync(insertQuery);
            const newId = result[0]?.id;

            if (!newId) throw new Error('فشل في إنشاء الفاتورة');

            return await this.getInvoiceById(newId);
        } catch (error) {
            console.error('❌ BillsService.createInvoice:', error);
            throw error;
        }
    }

    // ========== تحديث فاتورة ==========
    async updateInvoice(id, data) {
        try {
            const existing = await this.getInvoiceById(id);
            if (!existing) throw new Error('الفاتورة غير موجودة');

            const updateFields = [];

            if (data.propertyId !== undefined) {
                const propId = parseInt(data.propertyId);
                const projectQuery = `SELECT projectName FROM Projects WHERE id = ${propId}`;
                const projectResult = await this.queryAsync(projectQuery);
                if (!projectResult || projectResult.length === 0) throw new Error('العقار غير موجود');
                updateFields.push(`propertyId = ${propId}`);
                updateFields.push(`propertyName = N'${this.escapeSql(projectResult[0].projectName)}'`);
            }

            if (data.invoiceType !== undefined) updateFields.push(`invoiceType = N'${this.escapeSql(data.invoiceType)}'`);
            if (data.issueDate !== undefined) updateFields.push(`issueDate = '${data.issueDate}'`);
            if (data.dueDate !== undefined) updateFields.push(`dueDate = '${data.dueDate}'`);

            let amount = existing.amount;
            if (data.amount !== undefined) {
                amount = parseFloat(data.amount);
                if (amount <= 0) throw new Error('المبلغ يجب أن يكون أكبر من صفر');
                updateFields.push(`amount = ${amount}`);
            }

            let paidAmount = existing.paidAmount;
            if (data.paidAmount !== undefined) {
                paidAmount = parseFloat(data.paidAmount);
                updateFields.push(`paidAmount = ${paidAmount}`);
            }

            if (data.meterReading !== undefined) updateFields.push(`meterReading = N'${this.escapeSql(data.meterReading)}'`);
            if (data.notes !== undefined) updateFields.push(`notes = N'${this.escapeSql(data.notes)}'`);

            // إعادة حساب الحالة (status) بناءً على القيم الجديدة
            const dueDate = data.dueDate || existing.dueDate;
            const status = this.determineStatus({ amount, paidAmount, dueDate });
            updateFields.push(`status = N'${this.escapeSql(status)}'`);

            // لا نضيف remainingAmount لأنه عمود محسوب

            updateFields.push(`updated_at = GETDATE()`);

            if (updateFields.length === 0) return existing;

            const updateQuery = `
                UPDATE invoices
                SET ${updateFields.join(', ')}
                WHERE id = ${parseInt(id)}
            `;

            await this.executeAsync(updateQuery);
            return await this.getInvoiceById(id);
        } catch (error) {
            console.error('❌ BillsService.updateInvoice:', error);
            throw error;
        }
    }

    // ========== حذف فاتورة ==========
    async deleteInvoice(id) {
        try {
            await this.executeAsync(`DELETE FROM invoices WHERE id = ${parseInt(id)}`);
            return true;
        } catch (error) {
            console.error('❌ BillsService.deleteInvoice:', error);
            throw error;
        }
    }

    // ========== إضافة دفعة إلى فاتورة ==========
    async addPayment(invoiceId, paymentData) {
        try {
            const invoice = await this.getInvoiceById(invoiceId);
            if (!invoice) throw new Error('الفاتورة غير موجودة');

            if (invoice.status === 'مدفوعة') throw new Error('الفاتورة مدفوعة بالكامل');

            const amount = parseFloat(paymentData.amount);
            if (isNaN(amount) || amount <= 0) throw new Error('المبلغ يجب أن يكون أكبر من صفر');
            if (amount > invoice.remainingAmount) throw new Error('المبلغ المدفوع أكبر من المتبقي');

            // إنشاء سجل الدفع
            const payment = {
                id: Date.now(),
                amount,
                date: paymentData.paymentDate || new Date().toISOString().split('T')[0],
                method: paymentData.paymentMethod || 'نقدي',
                reference: paymentData.referenceNumber || '',
                notes: paymentData.notes || ''
            };

            // إضافة إلى مصفوفة المدفوعات
            let payments = invoice.payments || [];
            payments.push(payment);

            // تحديث المبالغ والحالة
            const newPaidAmount = parseFloat(invoice.paidAmount) + amount;
            const dueDate = invoice.dueDate;
            const newStatus = this.determineStatus({ amount: invoice.amount, paidAmount: newPaidAmount, dueDate });

            const updateQuery = `
                UPDATE invoices
                SET paidAmount = ${newPaidAmount},
                    status = N'${this.escapeSql(newStatus)}',
                    payments = N'${this.escapeSql(JSON.stringify(payments))}',
                    updated_at = GETDATE()
                WHERE id = ${parseInt(invoiceId)}
            `;

            await this.executeAsync(updateQuery);

            return { success: true, message: 'تم إضافة الدفعة بنجاح' };
        } catch (error) {
            console.error('❌ BillsService.addPayment:', error);
            throw error;
        }
    }

    // ========== تحديث حالات التأخير (يتم استدعاؤها دورياً) ==========
    async refreshOverdueStatuses() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const updateQuery = `
                UPDATE invoices
                SET status = N'متأخرة',
                    updated_at = GETDATE()
                WHERE dueDate < '${today}'
                  AND remainingAmount > 0
                  AND status != N'مدفوعة'
            `;
            await this.executeAsync(updateQuery);
            console.log('✅ تم تحديث حالات الفواتير المتأخرة');
        } catch (error) {
            console.error('❌ BillsService.refreshOverdueStatuses:', error);
        }
    }

    // ========== إحصائيات الفواتير ==========
    async getInvoicesStats() {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = N'مدفوعة' THEN 1 ELSE 0 END) as paid,
                    SUM(CASE WHEN status = N'غير مدفوعة' THEN 1 ELSE 0 END) as unpaid,
                    SUM(CASE WHEN status = N'متأخرة' THEN 1 ELSE 0 END) as overdue,
                    ISNULL(SUM(amount), 0) as totalAmount,
                    ISNULL(SUM(paidAmount), 0) as totalPaid,
                    ISNULL(SUM(remainingAmount), 0) as totalRemaining
                FROM invoices
            `;
            const result = await this.queryAsync(query);
            return result[0] || { total:0, paid:0, unpaid:0, overdue:0, totalAmount:0, totalPaid:0, totalRemaining:0 };
        } catch (error) {
            console.error('❌ BillsService.getInvoicesStats:', error);
            throw error;
        }
    }

    // ========== جلب آخر المدفوعات (من خلال تحليل JSON) ==========
    async getRecentPayments(limit = 5) {
        try {
            const query = `
                SELECT TOP ${limit}
                    i.invoiceNumber,
                    p.amount,
                    p.date,
                    p.method,
                    p.reference,
                    p.notes,
                    p.id
                FROM invoices i
                CROSS APPLY OPENJSON(i.payments) WITH (
                    amount decimal(10,2) '$.amount',
                    date date '$.date',
                    method nvarchar(50) '$.method',
                    reference nvarchar(100) '$.reference',
                    notes nvarchar(max) '$.notes',
                    id int '$.id'
                ) p
                WHERE i.payments IS NOT NULL 
                  AND i.payments != N''
                  AND ISJSON(i.payments) = 1
                ORDER BY p.date DESC
            `;
            return await this.queryAsync(query);
        } catch (error) {
            console.error('❌ BillsService.getRecentPayments:', error);
            return [];
        }
    }

    // ========== جلب الفواتير المتأخرة (للقائمة الجانبية) ==========
    async getOverdueInvoices(limit = 5) {
        try {
            const query = `
                SELECT TOP ${limit}
                    id, invoiceNumber, propertyName, remainingAmount, dueDate,
                    DATEDIFF(day, dueDate, GETDATE()) as daysOverdue
                FROM invoices
                WHERE status = N'متأخرة'
                ORDER BY dueDate ASC
            `;
            return await this.queryAsync(query);
        } catch (error) {
            console.error('❌ BillsService.getOverdueInvoices:', error);
            return [];
        }
    }

    // ========== جلب جميع المشاريع (للبحث في القوائم) ==========
    async getAllProjects() {
        try {
            const query = `
                SELECT id, projectName
                FROM Projects
                WHERE status != N'مباع'
                ORDER BY projectName
            `;
            return await this.queryAsync(query);
        } catch (error) {
            console.error('❌ BillsService.getAllProjects:', error);
            return [];
        }
    }

    // ========== تصدير الفواتير (لـ CSV) ==========
    async exportInvoices() {
        try {
            const query = `
                SELECT 
                    invoiceNumber as 'رقم الفاتورة',
                    propertyName as 'العقار',
                    invoiceType as 'النوع',
                    CONVERT(NVARCHAR, issueDate, 23) as 'تاريخ الإصدار',
                    CONVERT(NVARCHAR, dueDate, 23) as 'تاريخ الاستحقاق',
                    amount as 'المبلغ',
                    paidAmount as 'المدفوع',
                    remainingAmount as 'المتبقي',
                    status as 'الحالة'
                FROM invoices
                ORDER BY issueDate DESC
            `;
            return await this.queryAsync(query);
        } catch (error) {
            console.error('❌ BillsService.exportInvoices:', error);
            return [];
        }
    }
}

module.exports = new BillsService();