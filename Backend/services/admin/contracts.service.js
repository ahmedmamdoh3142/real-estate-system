// 📁 Backend/services/admin/contracts.service.js
const sql = require('msnodesqlv8');
const fs = require('fs');
const path = require('path');

require('dotenv').config();
const sql = require('msnodesqlv8');
const connectionString = process.env.DB_CONNECTION_STRING;

const GRACE_PERIOD_DAYS = 3;

class ContractsService {
    
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

    // ========== دالة مساعدة لتوليد رقم عقد فريد ==========
    async generateContractNumber() {
        const year = new Date().getFullYear();
        const query = `
            SELECT MAX(CAST(SUBSTRING(contractNumber, 9, 4) AS INT)) as lastNum
            FROM Contracts
            WHERE contractNumber LIKE N'CON-${year}-%' AND contractNumber IS NOT NULL
        `;
        const result = await this.queryAsync(query);
        const lastNum = result[0]?.lastNum || 0;
        const nextNum = lastNum + 1;
        const paddedNum = String(nextNum).padStart(4, '0');
        return `CON-${year}-${paddedNum}`;
    }

    // ========== دالة مساعدة لجلب بيانات العميل الكاملة مع leadId ==========
    async getCustomerDetails(customerId) {
        try {
            // البحث في جدول Leads أولاً
            let query = `
                SELECT 
                    id,
                    customerName as name,
                    customerEmail as email,
                    customerPhone as phone,
                    customerAddress as address,
                    customerNationalId as nationalId,
                    'lead' as source,
                    id as leadId          -- في حالة Leads، id هو نفسه leadId
                FROM Leads
                WHERE id = ${parseInt(customerId)}
            `;
            let result = await this.queryAsync(query);
            if (result && result.length > 0) {
                return result[0];
            }
            
            // إذا لم يوجد في Leads، ابحث في Contracts (عملاء سابقين)
            query = `
                SELECT 
                    customerId as id,
                    customerName as name,
                    customerEmail as email,
                    customerPhone as phone,
                    customerAddress as address,
                    customerNationalId as nationalId,
                    'contract' as source,
                    NULL as leadId          -- ليس لدينا leadId هنا
                FROM Contracts
                WHERE customerId = ${parseInt(customerId)}
            `;
            result = await this.queryAsync(query);
            if (result && result.length > 0) {
                return result[0];
            }
            
            return null;
        } catch (error) {
            console.error('❌ getCustomerDetails error:', error);
            return null;
        }
    }

    // ========== دالة مساعدة لجلب بيانات المشروع ==========
    async getProjectDetails(projectId) {
        try {
            const query = `
                SELECT 
                    id,
                    projectName,
                    projectType,
                    description,
                    location,
                    city,
                    district,
                    totalUnits,
                    availableUnits,
                    price,
                    area,
                    bedrooms,
                    bathrooms
                FROM Projects
                WHERE id = ${parseInt(projectId)}
            `;
            const result = await this.queryAsync(query);
            return result && result.length > 0 ? result[0] : null;
        } catch (error) {
            console.error('❌ getProjectDetails error:', error);
            return null;
        }
    }

    // ========== تحديث حالات التأخير لجميع الدفعات (أو لعقد معين) ==========
    async refreshOverdueStatuses(contractId = null) {
        try {
            let whereClause = contractId ? `AND contractId = ${parseInt(contractId)}` : '';
            const updateQuery = `
                UPDATE PaymentSchedules
                SET status = N'متأخر',
                    updatedAt = GETDATE()
                WHERE status IN (N'مستحق', N'متأخر')
                  AND paidAmount < amountDue
                  AND DATEDIFF(day, dueDate, GETDATE()) > ${GRACE_PERIOD_DAYS}
                  ${whereClause}
            `;
            await this.executeAsync(updateQuery);

            const contractsQuery = contractId 
                ? `SELECT DISTINCT contractId FROM PaymentSchedules WHERE contractId = ${parseInt(contractId)}`
                : `SELECT DISTINCT contractId FROM PaymentSchedules`;
            const contracts = await this.queryAsync(contractsQuery);
            for (let row of contracts) {
                await this.updateContractPaymentStatus(row.contractId);
            }

            console.log(`✅ تم تحديث حالات التأخير ${contractId ? 'للعقد ' + contractId : 'لكل العقود'}`);
        } catch (error) {
            console.error('❌ refreshOverdueStatuses error:', error);
        }
    }

    // ========== تحديث حالة الدفع الإجمالية للعقد بناءً على دفعاته ==========
    async updateContractPaymentStatus(contractId) {
        try {
            const schedules = await this.getPaymentSchedules(contractId);
            let totalPaid = 0;
            let totalDue = 0;
            let hasOverdue = false;
            let hasUnpaid = false;
            let allPaid = true;

            for (let s of schedules) {
                totalPaid += parseFloat(s.paidAmount || 0);
                totalDue += parseFloat(s.amountDue);
                if (s.status === 'متأخر') hasOverdue = true;
                if (s.status !== 'مسدد') allPaid = false;
                if (s.status === 'مستحق' || s.status === 'متأخر') hasUnpaid = true;
            }

            let paymentStatus;
            if (allPaid) paymentStatus = 'مسدد';
            else if (hasOverdue) paymentStatus = 'متأخر';
            else if (hasUnpaid) paymentStatus = 'غير مدفوع';
            else paymentStatus = 'قيد_الدفع';

            const updateQuery = `
                UPDATE Contracts
                SET paidAmount = ${totalPaid},
                    remainingAmount = ${totalDue - totalPaid},
                    paymentStatus = N'${this.escapeSql(paymentStatus)}',
                    updatedAt = GETDATE()
                WHERE id = ${parseInt(contractId)}
            `;
            await this.executeAsync(updateQuery);

            return paymentStatus;
        } catch (error) {
            console.error('❌ updateContractPaymentStatus error:', error);
        }
    }

    // ========== دالة جديدة لتحديد حالة الدفع الحالية للعرض في الجدول ==========
    determinePaymentStatus(schedules) {
        if (!schedules || schedules.length === 0) return 'غير مدفوع';

        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        // البحث عن دفعة مستحقة في الشهر الحالي
        const currentMonthSchedule = schedules.find(s => {
            const dueDate = new Date(s.dueDate);
            return dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear;
        });

        if (currentMonthSchedule) {
            return currentMonthSchedule.status; // مستحق / متأخر / مسدد
        }

        // إذا لم توجد دفعة هذا الشهر، نأخذ حالة آخر دفعة
        const lastSchedule = schedules[schedules.length - 1];
        return lastSchedule.status;
    }

    // ---------- جلب جميع العقود مع فلترة ----------
    async getAllContracts(page = 1, limit = 25, sort = 'newest', filters = {}) {
        try {
            let whereClauses = [];

            if (filters.search && filters.search.trim() !== '') {
                whereClauses.push(`(
                    c.contractNumber LIKE N'%${this.escapeSql(filters.search)}%' OR 
                    c.customerName LIKE N'%${this.escapeSql(filters.search)}%' OR 
                    c.customerPhone LIKE N'%${this.escapeSql(filters.search)}%' OR 
                    p.projectName LIKE N'%${this.escapeSql(filters.search)}%'
                )`);
            }

            if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
                const statusList = filters.status.map(s => `N'${this.escapeSql(s)}'`).join(', ');
                whereClauses.push(`c.contractStatus IN (${statusList})`);
            }

            if (filters.type && Array.isArray(filters.type) && filters.type.length > 0) {
                const typeList = filters.type.map(t => `N'${this.escapeSql(t)}'`).join(', ');
                whereClauses.push(`c.contractType IN (${typeList})`);
            }

            if (filters.payment && Array.isArray(filters.payment) && filters.payment.length > 0) {
                const paymentList = filters.payment.map(p => `N'${this.escapeSql(p)}'`).join(', ');
                whereClauses.push(`c.paymentStatus IN (${paymentList})`);
            }

            const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

            let orderBy = 'ORDER BY ';
            switch(sort) {
                case 'oldest': orderBy += 'c.createdAt ASC'; break;
                case 'amount-high': orderBy += 'c.totalAmount DESC'; break;
                case 'amount-low': orderBy += 'c.totalAmount ASC'; break;
                case 'name': orderBy += 'c.customerName ASC'; break;
                default: orderBy += 'c.createdAt DESC';
            }

            const offset = (page - 1) * limit;

            const query = `
                SELECT 
                    c.*,
                    p.projectName,
                    u.fullName as createdByName
                FROM Contracts c
                LEFT JOIN Projects p ON c.projectId = p.id
                LEFT JOIN Users u ON c.createdBy = u.id
                ${whereClause}
                ${orderBy}
                OFFSET ${offset} ROWS
                FETCH NEXT ${limit} ROWS ONLY
            `;

            const countQuery = `
                SELECT COUNT(*) as total 
                FROM Contracts c
                ${whereClause}
            `;

            const [contracts, countResult] = await Promise.all([
                this.queryAsync(query),
                this.queryAsync(countQuery)
            ]);

            const totalItems = countResult[0]?.total || 0;
            const totalPages = Math.ceil(totalItems / limit);

            for (let contract of contracts) {
                contract.paymentSchedules = await this.getPaymentSchedules(contract.id);
                // تحديث paymentStatus بناءً على الدفعات الحالية
                contract.paymentStatus = this.determinePaymentStatus(contract.paymentSchedules);
            }

            return {
                contracts,
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
            console.error('❌ ContractsService.getAllContracts:', error);
            throw error;
        }
    }

    // ---------- جلب عقد واحد ----------
    async getContractById(id, refreshOverdue = false) {
        try {
            if (refreshOverdue) {
                await this.refreshOverdueStatuses(id);
            }

            const query = `
                SELECT 
                    c.*,
                    p.projectName,
                    u.fullName as createdByName
                FROM Contracts c
                LEFT JOIN Projects p ON c.projectId = p.id
                LEFT JOIN Users u ON c.createdBy = u.id
                WHERE c.id = ${parseInt(id)}
            `;
            const result = await this.queryAsync(query);
            if (!result || result.length === 0) return null;

            const contract = result[0];
            contract.paymentSchedules = await this.getPaymentSchedules(id);
            // تحديث paymentStatus بناءً على الدفعات الحالية
            contract.paymentStatus = this.determinePaymentStatus(contract.paymentSchedules);
            return contract;
        } catch (error) {
            console.error('❌ ContractsService.getContractById:', error);
            throw error;
        }
    }

    // ---------- جدول الدفعات ----------
    async getPaymentSchedules(contractId) {
        try {
            const query = `
                SELECT * FROM PaymentSchedules 
                WHERE contractId = ${parseInt(contractId)}
                ORDER BY installmentNumber
            `;
            return await this.queryAsync(query);
        } catch (error) {
            console.error('❌ getPaymentSchedules error:', error);
            return [];
        }
    }

    // ---------- حساب عدد الدفعات بناءً على المدة والتكرار ----------
    calculateNumberOfInstallments(durationMonths, frequency) {
        if (frequency === 'دفعة واحدة') return 1;
        if (frequency === 'شهري') return durationMonths;
        if (frequency === 'ربع سنوي') return Math.ceil(durationMonths / 3);
        if (frequency === 'نصف سنوي') return Math.ceil(durationMonths / 6);
        if (frequency === 'سنوي') return Math.ceil(durationMonths / 12);
        // fallback
        return durationMonths;
    }

    // ---------- إنشاء عقد جديد ----------
    async createContract(data) {
        try {
            if (!data.customerId || !data.projectId || !data.startDate || !data.endDate || !data.totalAmount) {
                throw new Error('جميع الحقول المطلوبة يجب أن تكون موجودة');
            }

            // جلب بيانات المشروع والتحقق من توفر الوحدات
            const projectDetails = await this.getProjectDetails(data.projectId);
            if (!projectDetails) {
                throw new Error('المشروع غير موجود');
            }

            if (projectDetails.availableUnits <= 0) {
                throw new Error('لا توجد وحدات متاحة في هذا المشروع');
            }

            // جلب بيانات العميل الكاملة مع leadId
            const customerDetails = await this.getCustomerDetails(data.customerId);
            if (!customerDetails) {
                throw new Error('العميل غير موجود');
            }

            // استخراج leadId من بيانات العميل (إذا كان المصدر lead)
            const leadId = customerDetails.source === 'lead' ? customerDetails.leadId : null;
            console.log(`🔍 leadId المستخرج: ${leadId}`);

            const totalAmount = parseFloat(data.totalAmount);
            if (isNaN(totalAmount) || totalAmount <= 0) {
                throw new Error('المبلغ الإجمالي غير صالح');
            }

            const startDate = new Date(data.startDate);
            const endDate = new Date(data.endDate);
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                throw new Error('التواريخ غير صالحة');
            }
            if (endDate <= startDate) {
                throw new Error('تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء');
            }

            // حساب عدد الأشهر
            const diffTime = endDate - startDate;
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            const durationMonths = Math.max(1, Math.round(diffDays / 30.44));

            const paymentFrequency = data.paymentFrequency || 'شهري';

            // حساب عدد الدفعات وقيمة كل دفعة
            const numberOfInstallments = this.calculateNumberOfInstallments(durationMonths, paymentFrequency);
            
            // توزيع المبلغ مع معالجة الباقي (آخر دفعة تأخذ الباقي)
            const baseAmount = Math.floor((totalAmount / numberOfInstallments) * 100) / 100;
            const remainder = totalAmount - (baseAmount * numberOfInstallments);
            // قيمة الدفعة العادية (baseAmount) وآخر دفعة تزيد بمقدار remainder
            // سيتم تخزين baseAmount في monthlyPayment (قيمة الدفعة الواحدة الأساسية)
            const installmentAmount = baseAmount; // القيمة الأساسية

            const unitDetails = `مشروع: ${projectDetails.projectName} - نوع: ${projectDetails.projectType} - المساحة: ${projectDetails.area || 'غير محدد'} م² - الغرف: ${projectDetails.bedrooms || 'غير محدد'}`;

            // بناء الأعمدة والقيم (بما في ذلك leadId و contractFileUrl)
            const columns = [
                'leadId', 'projectId', 'customerId',
                'customerName', 'customerNationalId', 'customerPhone', 'customerEmail', 'customerAddress',
                'unitDetails', 'contractType', 'paymentFrequency',
                'startDate', 'endDate', 'durationMonths',
                'totalAmount', 'paidAmount', 'remainingAmount',
                'monthlyPayment', 'contractStatus', 'paymentStatus',
                'notes', 'createdBy', 'createdAt', 'updatedAt',
                'contractFileUrl'   // ✅ إضافة هذا العمود
            ];

            const values = [
                leadId ? leadId : 'NULL',
                parseInt(data.projectId),
                parseInt(data.customerId),
                `N'${this.escapeSql(customerDetails.name)}'`,
                `N'${this.escapeSql(customerDetails.nationalId || '')}'`,
                `N'${this.escapeSql(customerDetails.phone || '')}'`,
                `N'${this.escapeSql(customerDetails.email || '')}'`,
                `N'${this.escapeSql(customerDetails.address || '')}'`,
                `N'${this.escapeSql(unitDetails)}'`,
                `N'${this.escapeSql(data.contractType)}'`,
                `N'${this.escapeSql(paymentFrequency)}'`,
                `'${data.startDate}'`,
                `'${data.endDate}'`,
                durationMonths,
                totalAmount,
                0,
                totalAmount,
                installmentAmount,
                `N'${this.escapeSql(data.contractStatus || 'نشط')}'`,
                `N'غير مدفوع'`,
                `N'${this.escapeSql(data.notes || '')}'`,
                data.createdBy || 1,
                'GETDATE()',
                'GETDATE()',
                data.contractFileUrl ? `N'${this.escapeSql(data.contractFileUrl)}'` : 'NULL'   // ✅ القيمة
            ];

            const insertQuery = `
                INSERT INTO Contracts (${columns.join(', ')})
                OUTPUT INSERTED.id
                VALUES (${values.join(', ')})
            `;

            const result = await this.queryAsync(insertQuery);
            const newId = result[0]?.id;

            if (!newId) {
                throw new Error('فشل في الحصول على معرف العقد الجديد');
            }

            console.log(`✅ تم إنشاء العقد ID: ${newId}, leadId: ${leadId}, المدة: ${durationMonths} شهر, عدد الدفعات: ${numberOfInstallments}, قيمة الدفعة الأساسية: ${installmentAmount}`);

            // إنشاء جدول الدفعات بشكل متسلسل مع تمرير العدد المحسوب والمبلغ الأساسي والباقي
            try {
                await this.generatePaymentSchedulesSequential(
                    newId, 
                    startDate, 
                    endDate, 
                    totalAmount, 
                    paymentFrequency, 
                    numberOfInstallments, 
                    baseAmount, 
                    remainder
                );
            } catch (scheduleError) {
                console.error('❌ فشل إنشاء جدول الدفعات، سيتم حذف العقد:', scheduleError);
                await this.deleteContract(newId);
                throw new Error('فشل إنشاء جدول الدفعات: ' + scheduleError.message);
            }

            // ✅ تحديث عدد الوحدات المتاحة في المشروع (إنقاص 1)
            try {
                const updateProjectQuery = `
                    UPDATE Projects
                    SET availableUnits = availableUnits - 1,
                        updatedAt = GETDATE()
                    WHERE id = ${parseInt(data.projectId)} AND availableUnits > 0
                `;
                await this.executeAsync(updateProjectQuery);
                console.log(`✅ تم تحديث الوحدات المتاحة للمشروع ID: ${data.projectId}`);
            } catch (updateError) {
                // إذا فشل تحديث المشروع، نحتاج لحذف العقد وجدول الدفعات للحفاظ على التكامل
                console.error('❌ فشل تحديث الوحدات المتاحة، سيتم حذف العقد:', updateError);
                await this.deleteContract(newId);
                throw new Error('فشل تحديث الوحدات المتاحة: ' + updateError.message);
            }

            // جلب العقد بعد الإدراج (بدون تحديث حالات التأخير)
            return await this.getContractById(newId, false);
        } catch (error) {
            console.error('❌ ContractsService.createContract:', error);
            throw error;
        }
    }

    // ---------- إنشاء جدول دفعات العقد (مع دعم الباقي) ----------
    async generatePaymentSchedulesSequential(contractId, startDate, endDate, totalAmount, frequency, numberOfInstallments, baseAmount, remainder) {
        try {
            console.log(`🔄 Generating payment schedules for contract ${contractId} sequentially, installments: ${numberOfInstallments}, baseAmount: ${baseAmount}, remainder: ${remainder}`);

            // حذف أي جداول سابقة (لن يكون هناك جداول سابقة لأن العقد جديد)
            await this.executeAsync(`DELETE FROM PaymentSchedules WHERE contractId = ${contractId}`);

            if (numberOfInstallments <= 0) {
                throw new Error(`عدد الدفعات غير صالح: ${numberOfInstallments}`);
            }

            // إنشاء الدفعات واحدة تلو الأخرى
            for (let i = 0; i < numberOfInstallments; i++) {
                let dueDate = new Date(startDate);
                if (frequency === 'شهري') {
                    dueDate.setMonth(startDate.getMonth() + i);
                } else if (frequency === 'ربع سنوي') {
                    dueDate.setMonth(startDate.getMonth() + (i * 3));
                } else if (frequency === 'نصف سنوي') {
                    dueDate.setMonth(startDate.getMonth() + (i * 6));
                } else if (frequency === 'سنوي') {
                    dueDate.setFullYear(startDate.getFullYear() + i);
                } else if (frequency === 'دفعة واحدة') {
                    dueDate = new Date(startDate);
                } else {
                    dueDate.setMonth(startDate.getMonth() + i);
                }

                // التأكد من أن تاريخ الاستحقاق لا يتجاوز تاريخ الانتهاء
                if (dueDate > endDate) {
                    dueDate = new Date(endDate);
                }

                const dueDateStr = dueDate.toISOString().split('T')[0];
                
                // تحديد مبلغ هذه الدفعة: آخر دفعة تأخذ المبلغ الأساسي + الباقي، والباقي تأخذ المبلغ الأساسي فقط
                let amount = baseAmount;
                if (i === numberOfInstallments - 1) {
                    amount += remainder;
                }

                const query = `
                    INSERT INTO PaymentSchedules (
                        contractId, installmentNumber, dueDate, amountDue,
                        status, paidAmount, createdAt, updatedAt
                    ) VALUES (
                        ${contractId},
                        ${i + 1},
                        '${dueDateStr}',
                        ${amount},
                        N'مستحق',
                        0,
                        GETDATE(),
                        GETDATE()
                    )
                `;
                await this.executeAsync(query);
                console.log(`  ✅ Inserted installment ${i+1}: dueDate ${dueDateStr}, amount ${amount}`);
            }

            console.log(`✅ Successfully generated ${numberOfInstallments} payment schedules for contract ${contractId}`);
        } catch (error) {
            console.error('❌ ContractsService.generatePaymentSchedulesSequential:', error);
            throw error;
        }
    }

    // ---------- تحديث عقد ----------
    async updateContract(id, data) {
        try {
            const existing = await this.getContractById(id, false);
            if (!existing) throw new Error('العقد غير موجود');

            const updateFields = [];

            if (data.projectId) updateFields.push(`projectId = ${parseInt(data.projectId)}`);
            if (data.customerId) updateFields.push(`customerId = ${parseInt(data.customerId)}`);
            if (data.customerName) updateFields.push(`customerName = N'${this.escapeSql(data.customerName)}'`);
            if (data.customerPhone) updateFields.push(`customerPhone = N'${this.escapeSql(data.customerPhone)}'`);
            if (data.customerEmail !== undefined) updateFields.push(`customerEmail = N'${this.escapeSql(data.customerEmail || '')}'`);
            if (data.customerAddress !== undefined) updateFields.push(`customerAddress = N'${this.escapeSql(data.customerAddress || '')}'`);
            if (data.unitDetails !== undefined) updateFields.push(`unitDetails = N'${this.escapeSql(data.unitDetails || '')}'`);
            if (data.contractType) updateFields.push(`contractType = N'${this.escapeSql(data.contractType)}'`);
            if (data.paymentFrequency) updateFields.push(`paymentFrequency = N'${this.escapeSql(data.paymentFrequency)}'`);
            if (data.startDate) updateFields.push(`startDate = '${data.startDate}'`);
            if (data.endDate) updateFields.push(`endDate = '${data.endDate}'`);
            if (data.totalAmount) {
                const total = parseFloat(data.totalAmount);
                updateFields.push(`totalAmount = ${total}`);
                const paid = data.paidAmount !== undefined ? parseFloat(data.paidAmount) : existing.paidAmount;
                updateFields.push(`remainingAmount = ${total - paid}`);
            }
            if (data.paidAmount !== undefined) {
                const paid = parseFloat(data.paidAmount);
                updateFields.push(`paidAmount = ${paid}`);
                const total = data.totalAmount ? parseFloat(data.totalAmount) : existing.totalAmount;
                updateFields.push(`remainingAmount = ${total - paid}`);
            }
            if (data.contractStatus) updateFields.push(`contractStatus = N'${this.escapeSql(data.contractStatus)}'`);
            if (data.paymentStatus) updateFields.push(`paymentStatus = N'${this.escapeSql(data.paymentStatus)}'`);
            if (data.notes !== undefined) updateFields.push(`notes = N'${this.escapeSql(data.notes || '')}'`);
            if (data.contractFileUrl !== undefined) {
                updateFields.push(`contractFileUrl = N'${this.escapeSql(data.contractFileUrl)}'`);
            }

            if (updateFields.length === 0) return existing;

            updateFields.push('updatedAt = GETDATE()');

            const query = `
                UPDATE Contracts
                SET ${updateFields.join(', ')}
                WHERE id = ${parseInt(id)}
            `;

            await this.executeAsync(query);
            return await this.getContractById(id, true);
        } catch (error) {
            console.error('❌ ContractsService.updateContract:', error);
            throw error;
        }
    }

    // ---------- حذف عقد (مع دفعاته ومدفوعاته) ----------
    async deleteContract(id) {
        try {
            // أولاً: حذف المدفوعات المرتبطة بجداول الدفعات لهذا العقد
            const deletePaymentsQuery = `
                DELETE FROM Payments
                WHERE paymentScheduleId IN (
                    SELECT id FROM PaymentSchedules WHERE contractId = ${parseInt(id)}
                )
            `;
            await this.executeAsync(deletePaymentsQuery);
            
            // ثانياً: حذف جداول الدفعات
            await this.executeAsync(`DELETE FROM PaymentSchedules WHERE contractId = ${parseInt(id)}`);
            
            // ثالثاً: حذف العقد
            await this.executeAsync(`DELETE FROM Contracts WHERE id = ${parseInt(id)}`);
            
            return true;
        } catch (error) {
            console.error('❌ ContractsService.deleteContract:', error);
            throw error;
        }
    }

    // ---------- إحصائيات العقود ----------
    async getContractsStats() {
        try {
            const query = `
                SELECT 
                    COUNT(*) as totalContracts,
                    SUM(CASE WHEN contractStatus = N'نشط' THEN 1 ELSE 0 END) as activeContracts,
                    SUM(CASE WHEN contractStatus = N'منتهي' THEN 1 ELSE 0 END) as completedContracts,
                    SUM(CASE WHEN paymentStatus = N'متأخر' THEN 1 ELSE 0 END) as overduePayments,
                    SUM(CASE WHEN paymentStatus = N'مسدد' THEN 1 ELSE 0 END) as fullyPaid,
                    ISNULL(SUM(totalAmount), 0) as totalRevenue,
                    ISNULL(SUM(remainingAmount), 0) as totalPending,
                    COUNT(CASE WHEN MONTH(createdAt) = MONTH(GETDATE()) 
                               AND YEAR(createdAt) = YEAR(GETDATE()) THEN 1 END) as newThisMonth
                FROM Contracts
            `;
            const result = await this.queryAsync(query);
            const stats = result[0] || {};

            const typeQuery = `
                SELECT contractStatus, COUNT(*) as count
                FROM Contracts
                GROUP BY contractStatus
            `;
            const typeResult = await this.queryAsync(typeQuery);
            const typeDistribution = {};
            typeResult.forEach(row => typeDistribution[row.contractStatus] = row.count);

            return {
                totalContracts: parseInt(stats.totalContracts) || 0,
                activeContracts: parseInt(stats.activeContracts) || 0,
                completedContracts: parseInt(stats.completedContracts) || 0,
                overduePayments: parseInt(stats.overduePayments) || 0,
                fullyPaid: parseInt(stats.fullyPaid) || 0,
                totalRevenue: parseFloat(stats.totalRevenue) || 0,
                totalPending: parseFloat(stats.totalPending) || 0,
                newThisMonth: parseInt(stats.newThisMonth) || 0,
                typeDistribution
            };
        } catch (error) {
            console.error('❌ ContractsService.getContractsStats:', error);
            throw error;
        }
    }

    // ---------- العقود المنتهية قريباً ----------
    async getUpcomingContracts(limit = 4) {
        try {
            const query = `
                SELECT TOP ${limit}
                    c.*,
                    p.projectName,
                    DATEDIFF(day, GETDATE(), c.endDate) as daysRemaining,
                    CASE 
                        WHEN c.totalAmount > 0 
                        THEN ROUND((c.paidAmount / c.totalAmount) * 100, 0)
                        ELSE 0 
                    END as paymentPercentage
                FROM Contracts c
                LEFT JOIN Projects p ON c.projectId = p.id
                WHERE c.contractStatus = N'نشط'
                  AND c.endDate >= GETDATE()
                  AND DATEDIFF(day, GETDATE(), c.endDate) <= 30
                ORDER BY c.endDate ASC
            `;
            return await this.queryAsync(query);
        } catch (error) {
            console.error('❌ ContractsService.getUpcomingContracts:', error);
            return [];
        }
    }

    // ---------- البحث عن العملاء ----------
    async searchCustomers(query) {
        try {
            let sqlQuery;
            if (!query || query.trim() === '') {
                sqlQuery = `
                    SELECT DISTINCT
                        customerId as id,
                        customerName as name,
                        customerPhone as phone,
                        customerEmail as email,
                        customerAddress as address,
                        'contract' as source
                    FROM Contracts
                    WHERE customerName IS NOT NULL AND customerName != ''
                    UNION
                    SELECT
                        id,
                        customerName as name,
                        customerPhone as phone,
                        customerEmail as email,
                        customerAddress as address,
                        'lead' as source
                    FROM Leads
                    WHERE customerName IS NOT NULL AND customerName != ''
                `;
            } else {
                const search = `%${this.escapeSql(query)}%`;
                sqlQuery = `
                    SELECT 
                        customerId as id,
                        customerName as name,
                        customerPhone as phone,
                        customerEmail as email,
                        customerAddress as address,
                        'contract' as source
                    FROM Contracts
                    WHERE (customerName LIKE N'${search}' OR customerPhone LIKE N'${search}')
                    UNION
                    SELECT
                        id,
                        customerName as name,
                        customerPhone as phone,
                        customerEmail as email,
                        customerAddress as address,
                        'lead' as source
                    FROM Leads
                    WHERE (customerName LIKE N'${search}' OR customerPhone LIKE N'${search}')
                `;
            }

            let results = await this.queryAsync(sqlQuery);
            
            const unique = new Map();
            results.forEach(item => {
                const key = `${item.name}_${item.phone}`;
                if (!unique.has(key)) {
                    unique.set(key, item);
                }
            });
            
            return Array.from(unique.values());
        } catch (error) {
            console.error('❌ ContractsService.searchCustomers:', error);
            return [];
        }
    }

    // ---------- جلب جميع المشاريع ----------
    async getAllProjects() {
        try {
            const query = `
                SELECT id, projectCode, projectName, projectType, status,
                       area, bedrooms, bathrooms, totalUnits, availableUnits
                FROM Projects
                WHERE status != N'مباع'
                ORDER BY projectName
            `;
            return await this.queryAsync(query);
        } catch (error) {
            console.error('❌ ContractsService.getAllProjects:', error);
            return [];
        }
    }

    // ---------- إضافة دفعة جديدة ----------
    async addPayment(contractId, paymentData) {
        try {
            console.log('💰 addPayment called with:', { contractId, paymentData });

            const contract = await this.getContractById(contractId, false);
            if (!contract) throw new Error('العقد غير موجود');

            let amount = parseFloat(paymentData.amount);
            if (isNaN(amount) || amount <= 0) throw new Error('المبلغ يجب أن يكون أكبر من صفر');

            if (!contract.paymentSchedules || contract.paymentSchedules.length === 0) {
                throw new Error('لا يوجد جدول دفعات لهذا العقد');
            }

            const schedules = contract.paymentSchedules
                .filter(s => s.status !== 'مسدد' && parseFloat(s.paidAmount) < parseFloat(s.amountDue))
                .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

            if (schedules.length === 0) {
                throw new Error('لا توجد دفعات مستحقة لهذا العقد');
            }

            let remainingPayment = amount;
            const paymentDate = paymentData.paymentDate || new Date().toISOString().split('T')[0];
            const paymentMethod = paymentData.paymentMethod || 'نقدي';
            const referenceNumber = paymentData.referenceNumber || '';
            const notes = paymentData.notes || '';
            const collectedBy = paymentData.collectedBy || 1;

            for (let schedule of schedules) {
                if (remainingPayment <= 0) break;

                const scheduleId = schedule.id;
                const dueAmount = parseFloat(schedule.amountDue);
                const paidSoFar = parseFloat(schedule.paidAmount || 0);
                const remainingForSchedule = dueAmount - paidSoFar;

                const paymentForThis = Math.min(remainingPayment, remainingForSchedule);
                const newPaid = paidSoFar + paymentForThis;
                const isFullyPaid = Math.abs(newPaid - dueAmount) < 0.01;

                console.log(`Processing schedule ${scheduleId}: due=${dueAmount}, paidSoFar=${paidSoFar}, paymentForThis=${paymentForThis}, newPaid=${newPaid}, isFullyPaid=${isFullyPaid}`);

                const updateSchedule = `
                    UPDATE PaymentSchedules
                    SET paidAmount = ${newPaid},
                        status = ${isFullyPaid ? 'N\'مسدد\'' : 'N\'مستحق\''},
                        paidAt = ${isFullyPaid ? 'GETDATE()' : 'NULL'},
                        updatedAt = GETDATE()
                    WHERE id = ${scheduleId}
                `;
                await this.executeAsync(updateSchedule);
                console.log(`✅ Updated schedule ${scheduleId}`);

                if (paymentForThis > 0) {
                    const insertPayment = `
                        INSERT INTO Payments (
                            contractId, paymentScheduleId, amount, paymentDate,
                            paymentMethod, referenceNumber, notes, status,
                            collectedBy, createdAt, updatedAt
                        ) VALUES (
                            ${parseInt(contractId)},
                            ${scheduleId},
                            ${paymentForThis},
                            '${paymentDate}',
                            N'${this.escapeSql(paymentMethod)}',
                            N'${this.escapeSql(referenceNumber)}',
                            N'${this.escapeSql(notes)}',
                            N'مؤكد',
                            ${collectedBy},
                            GETDATE(),
                            GETDATE()
                        )
                    `;
                    await this.executeAsync(insertPayment);
                    console.log(`✅ Inserted payment record for schedule ${scheduleId}`);
                }

                remainingPayment -= paymentForThis;
            }

            await this.updateContractPaymentStatus(contractId);
            await this.refreshOverdueStatuses(contractId);

            return { success: true, message: 'تم إضافة الدفعة بنجاح' };
        } catch (error) {
            console.error('❌ ContractsService.addPayment error:', error);
            throw error;
        }
    }

    // ---------- تصدير العقود ----------
    async exportContracts() {
        try {
            const query = `
                SELECT 
                    c.contractNumber as 'رقم العقد',
                    c.customerName as 'العميل',
                    c.customerPhone as 'الهاتف',
                    p.projectName as 'المشروع',
                    c.contractType as 'النوع',
                    c.totalAmount as 'الإجمالي',
                    c.paidAmount as 'المدفوع',
                    c.remainingAmount as 'المتبقي',
                    c.contractStatus as 'حالة العقد',
                    c.paymentStatus as 'حالة الدفع',
                    CONVERT(NVARCHAR, c.startDate, 23) as 'تاريخ البدء',
                    CONVERT(NVARCHAR, c.endDate, 23) as 'تاريخ الانتهاء',
                    c.contractFileUrl as 'ملف العقد'
                FROM Contracts c
                LEFT JOIN Projects p ON c.projectId = p.id
                ORDER BY c.createdAt DESC
            `;
            return await this.queryAsync(query);
        } catch (error) {
            console.error('❌ ContractsService.exportContracts:', error);
            return [];
        }
    }
}

module.exports = new ContractsService();