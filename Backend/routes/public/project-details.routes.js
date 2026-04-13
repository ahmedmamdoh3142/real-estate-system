// Backend/routes/public/project-details.routes.js - الإصدار النهائي (معدل لاستخدام mssql)
const express = require('express');
const sql = require('mssql');

require('dotenv').config();

// الحصول على pool من app.locals
function getPool() {
    const app = require('../../app');
    if (!app.locals.dbPool) {
        throw new Error('قاعدة البيانات غير متصلة');
    }
    return app.locals.dbPool;
}

// دالة لإنشاء الراوتر مع تمرير app
module.exports = function(app) {
    const router = express.Router();
    
    console.log('🚀 تهيئة project-details routes - VERSION 5.5 (mssql)');
    
    // دالة مساعدة للاستعلامات مع Promise محسنة
    async function queryAsync(sqlQuery) {
        const pool = getPool();
        console.log('📝 تنفيذ استعلام:', sqlQuery.substring(0, 200) + (sqlQuery.length > 200 ? '...' : ''));
        try {
            const result = await pool.request().query(sqlQuery);
            console.log(`✅ تم جلب ${result.recordset.length} صف`);
            return result.recordset;
        } catch (err) {
            console.error('❌ خطأ في الاستعلام:', err.message);
            console.error('❌ استعلام مسبب للخطأ:', sqlQuery);
            throw err;
        }
    }
    
    // دالة لتنفيذ استعلام بدون توقع نتائج (مثل INSERT, UPDATE, DELETE)
    async function executeNonQuery(sqlQuery) {
        const pool = getPool();
        console.log('📝 تنفيذ أمر (non-query):', sqlQuery.substring(0, 200) + (sqlQuery.length > 200 ? '...' : ''));
        try {
            const result = await pool.request().query(sqlQuery);
            console.log(`✅ تم تنفيذ الأمر بنجاح`);
            return result;
        } catch (err) {
            console.error('❌ خطأ في تنفيذ الأمر:', err.message);
            throw err;
        }
    }
    
    // ===== ROUTES =====
    
    // 🔍 جلب تفاصيل عقار محدد
    router.get('/:id', async (req, res) => {
        try {
            const projectId = parseInt(req.params.id);
            console.log(`🔍 جلب تفاصيل العقار ID: ${projectId}`);
            
            if (!projectId || isNaN(projectId)) {
                return res.status(400).json({
                    success: false,
                    message: 'معرّف العقار غير صالح'
                });
            }
            
            const projectQuery = `
                SELECT 
                    p.id,
                    p.projectCode,
                    p.projectName,
                    p.projectType,
                    p.description,
                    p.location,
                    p.city,
                    p.district,
                    p.totalUnits,
                    p.availableUnits,
                    p.price,
                    p.priceType,
                    p.area,
                    ISNULL(p.areaUnit, N'متر مربع') as areaUnit,
                    p.bedrooms,
                    p.bathrooms,
                    p.isFeatured,
                    p.status,
                    p.completionDate,
                    p.createdAt,
                    p.updatedAt,
                    p.locationLink,
                    u.fullName as createdByName
                FROM Projects p
                LEFT JOIN Users u ON p.createdBy = u.id
                WHERE p.id = ${projectId}
            `;
            
            console.log('📊 تنفيذ استعلام المشروع...');
            const projectResult = await queryAsync(projectQuery);
            
            if (!projectResult || projectResult.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'العقار غير موجود'
                });
            }
            
            const project = projectResult[0];
            
            const [images, features] = await Promise.all([
                queryAsync(`
                    SELECT id, imageUrl, imageType, displayOrder, isActive
                    FROM ProjectImages 
                    WHERE projectId = ${projectId} AND isActive = 1
                    ORDER BY displayOrder
                `),
                queryAsync(`
                    SELECT id, featureName, featureValue, icon, displayOrder
                    FROM ProjectFeatures 
                    WHERE projectId = ${projectId}
                    ORDER BY displayOrder
                `)
            ]);
            
            const processedProject = {
                id: parseInt(project.id),
                projectCode: project.projectCode || `PJ-${project.id}`,
                projectName: project.projectName || 'عقار',
                projectType: getProjectTypeText(project.projectType || 'سكني'),
                description: project.description || 'وصف غير متوفر',
                location: project.location || 'غير محدد',
                city: project.city || 'الرياض',
                district: project.district || '',
                fullAddress: `${project.city}${project.district ? '، ' + project.district : ''}${project.location ? '، ' + project.location : ''}`,
                totalUnits: parseInt(project.totalUnits) || 0,
                availableUnits: parseInt(project.availableUnits) || 0,
                price: parseFloat(project.price) || 0,
                priceType: getPriceTypeText(project.priceType || 'شراء'),
                area: parseFloat(project.area) || 0,
                areaUnit: project.areaUnit || 'م²',
                bedrooms: parseInt(project.bedrooms) || 0,
                bathrooms: parseInt(project.bathrooms) || 0,
                isFeatured: project.isFeatured === true || project.isFeatured === 1 || project.isFeatured === 'true',
                status: getStatusText(project.status || 'نشط'),
                completionDate: project.completionDate || null,
                createdAt: project.createdAt || new Date(),
                updatedAt: project.updatedAt || null,
                createdBy: project.createdByName || 'النظام',
                locationLink: project.locationLink || null,
                images: (images || []).map(img => ({
                    id: img.id,
                    url: img.imageUrl || '/global/assets/images/project-placeholder.jpg',
                    type: img.imageType || 'صورة',
                    order: img.displayOrder || 0,
                    isActive: img.isActive === true || img.isActive === 1 || img.isActive === 'true'
                })),
                features: (features || []).map(feat => ({
                    id: feat.id,
                    name: feat.featureName,
                    value: feat.featureValue,
                    icon: feat.icon || 'fas fa-check',
                    order: feat.displayOrder || 0
                }))
            };
            
            console.log(`✅ تم جلب تفاصيل المشروع ID: ${projectId} بنجاح`);
            
            res.status(200).json({
                success: true,
                data: processedProject,
                source: 'real_database',
                timestamp: new Date().toISOString(),
                message: 'تم جلب تفاصيل العقار بنجاح'
            });
            
        } catch (error) {
            console.error('❌ خطأ في جلب تفاصيل العقار:', error);
            
            res.status(500).json({
                success: false,
                message: 'فشل في جلب تفاصيل العقار',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
                details: error.message
            });
        }
    });
    
    // 🏢 جلب العقارات المشابهة
    router.get('/:id/related', async (req, res) => {
        try {
            const projectId = parseInt(req.params.id);
            const limit = parseInt(req.query.limit) || 3;
            
            console.log(`🔗 جلب العقارات المشابهة للمشروع ID: ${projectId}, limit: ${limit}`);
            
            if (!projectId || isNaN(projectId)) {
                return res.status(400).json({
                    success: false,
                    message: 'معرّف العقار غير صالح'
                });
            }
            
            const currentProjectQuery = `
                SELECT projectType, city, projectName
                FROM Projects
                WHERE id = ${projectId}
            `;
            
            const currentProject = await queryAsync(currentProjectQuery);
            
            if (!currentProject || currentProject.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'العقار غير موجود'
                });
            }
            
            const { projectType, city, projectName } = currentProject[0];
            
            const relatedQuery = `
                SELECT TOP ${limit} 
                    p.id,
                    p.projectCode,
                    p.projectName,
                    p.projectType,
                    p.city,
                    p.district,
                    p.area,
                    p.bedrooms,
                    p.bathrooms,
                    p.price,
                    p.priceType,
                    p.isFeatured,
                    p.status,
                    p.createdAt
                FROM Projects p
                WHERE p.id != ${projectId}
                AND p.projectType = N'${projectType?.replace(/'/g, "''") || 'سكني'}'
                AND p.city = N'${city?.replace(/'/g, "''") || 'الرياض'}'
                AND p.status NOT IN ('مباع', 'محجوز')
                ORDER BY p.isFeatured DESC, p.createdAt DESC
            `;
            
            console.log('📊 تنفيذ استعلام العقارات المشابهة...');
            const relatedProjects = await queryAsync(relatedQuery);
            
            const processedProjects = await Promise.all(relatedProjects.map(async (project) => {
                try {
                    const images = await queryAsync(`
                        SELECT TOP 1 imageUrl
                        FROM ProjectImages 
                        WHERE projectId = ${project.id} AND isActive = 1
                        ORDER BY displayOrder
                    `);
                    
                    return {
                        id: parseInt(project.id),
                        projectName: project.projectName || 'عقار',
                        projectType: getProjectTypeText(project.projectType || 'سكني'),
                        city: project.city || 'الرياض',
                        district: project.district || '',
                        area: parseFloat(project.area) || 0,
                        bedrooms: parseInt(project.bedrooms) || 0,
                        bathrooms: parseInt(project.bathrooms) || 0,
                        price: parseFloat(project.price) || 0,
                        priceType: getPriceTypeText(project.priceType || 'شراء'),
                        isFeatured: project.isFeatured === true || project.isFeatured === 1 || project.isFeatured === 'true',
                        status: getStatusText(project.status || 'نشط'),
                        mainImage: (images && images.length > 0 && images[0].imageUrl) 
                            ? images[0].imageUrl 
                            : '/global/assets/images/project-placeholder.jpg',
                        createdAt: project.createdAt || new Date()
                    };
                } catch (error) {
                    console.error(`❌ خطأ في معالجة المشروع ${project.id}:`, error);
                    
                    return {
                        id: parseInt(project.id),
                        projectName: project.projectName || 'عقار',
                        projectType: getProjectTypeText(project.projectType || 'سكني'),
                        city: project.city || 'الرياض',
                        area: parseFloat(project.area) || 0,
                        price: parseFloat(project.price) || 0,
                        priceType: getPriceTypeText(project.priceType || 'شراء'),
                        isFeatured: false,
                        status: getStatusText(project.status || 'نشط'),
                        mainImage: '/global/assets/images/project-placeholder.jpg'
                    };
                }
            }));
            
            res.status(200).json({
                success: true,
                data: {
                    projects: processedProjects,
                    count: processedProjects.length,
                    currentProject: {
                        id: projectId,
                        projectName: projectName,
                        projectType: getProjectTypeText(projectType || 'سكني'),
                        city: city || 'الرياض'
                    }
                },
                source: 'real_database',
                timestamp: new Date().toISOString(),
                message: processedProjects.length === 0 ? 'لا توجد عقارات مشابهة' : 'تم جلب العقارات المشابهة بنجاح'
            });
            
        } catch (error) {
            console.error('❌ خطأ في جلب العقارات المشابهة:', error);
            
            res.status(500).json({
                success: false,
                message: 'فشل في جلب العقارات المشابهة',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
                details: error.message
            });
        }
    });
    
    // 📤 إرسال استفسار عن عقار
    router.post('/:id/inquiry', async (req, res) => {
        try {
            const projectId = parseInt(req.params.id);
            const {
                customerName,
                customerEmail,
                customerPhone,
                message,
                inquiryType = 'استفسار_عام',
                contactPreference,
                preferredTime
            } = req.body;
            
            console.log(`📤 [INQUIRY] إرسال استفسار للمشروع ID: ${projectId}`);
            console.log('📝 بيانات الاستفسار:', { 
                customerName, 
                customerEmail, 
                customerPhone, 
                inquiryType,
                contactPreference,
                preferredTime,
                messageLength: message?.length 
            });
            
            if (!projectId || isNaN(projectId)) {
                return res.status(400).json({
                    success: false,
                    message: 'معرّف العقار غير صالح'
                });
            }
            
            if (!customerName || !customerEmail || !customerPhone || !message) {
                return res.status(400).json({
                    success: false,
                    message: 'جميع الحقول مطلوبة'
                });
            }
            
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(customerEmail)) {
                return res.status(400).json({
                    success: false,
                    message: 'البريد الإلكتروني غير صالح'
                });
            }
            
            const cleanedPhone = customerPhone.replace(/\s+/g, '');
            const phoneRegex = /^(05|5)([0-9]{8,9})$/;
            if (!phoneRegex.test(cleanedPhone)) {
                return res.status(400).json({
                    success: false,
                    message: 'رقم الجوال غير صالح (يجب أن يبدأ بـ 05 ويتكون من 10 أرقام)'
                });
            }
            
            const projectCheckQuery = `
                SELECT projectName, projectCode
                FROM Projects
                WHERE id = ${projectId}
            `;
            
            const projectCheck = await queryAsync(projectCheckQuery);
            
            if (!projectCheck || projectCheck.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'العقار غير موجود'
                });
            }
            
            const projectName = projectCheck[0].projectName;
            const projectCode = projectCheck[0].projectCode || `PJ-${projectId}`;
            
            const insertInquiryQuery = `
                INSERT INTO Inquiries (
                    projectId,
                    customerName,
                    customerEmail,
                    customerPhone,
                    message,
                    inquiryType,
                    status,
                    contactPreferences,
                    preferredTime,
                    createdAt,
                    updatedAt
                ) VALUES (
                    ${projectId},
                    N'${customerName.replace(/'/g, "''")}',
                    N'${customerEmail.replace(/'/g, "''")}',
                    N'${cleanedPhone.replace(/'/g, "''")}',
                    N'${message.replace(/'/g, "''")}',
                    N'${inquiryType.replace(/'/g, "''")}',
                    N'جديد',
                    N'${contactPreference === 'whatsapp' ? 'whatsapp' : 'phone'}',
                    ${preferredTime ? `N'${preferredTime.replace(/'/g, "''")}'` : 'NULL'},
                    GETDATE(),
                    GETDATE()
                );
            `;
            
            console.log('📝 تنفيذ إدخال الاستفسار في قاعدة البيانات...');
            await executeNonQuery(insertInquiryQuery);
            
            const getIdQuery = `SELECT @@IDENTITY as newId;`;
            const idResult = await queryAsync(getIdQuery);
            
            let newInquiryId = idResult && idResult.length > 0 ? idResult[0].newId : null;
            
            if (!newInquiryId) {
                console.log('⚠️ @@IDENTITY أعادت NULL، نحاول SCOPE_IDENTITY()...');
                const scopeIdResult = await queryAsync(`SELECT SCOPE_IDENTITY() as newId;`);
                newInquiryId = scopeIdResult && scopeIdResult.length > 0 ? scopeIdResult[0].newId : null;
            }
            
            if (!newInquiryId) {
                console.log('⚠️ SCOPE_IDENTITY() أيضاً فشلت، نجلب آخر ID من الجدول...');
                const lastIdResult = await queryAsync(`SELECT MAX(id) as newId FROM Inquiries;`);
                newInquiryId = lastIdResult && lastIdResult.length > 0 ? lastIdResult[0].newId : null;
            }
            
            if (!newInquiryId) {
                console.warn('⚠️ فشل الحصول على ID الاستفسار، سنكمل بدون ربط مع Leads');
                newInquiryId = null;
            }
            
            let inquiryCode = null;
            if (newInquiryId) {
                try {
                    const getInquiryCodeQuery = `
                        SELECT inquiryCode 
                        FROM Inquiries 
                        WHERE id = ${newInquiryId}
                    `;
                    const codeResult = await queryAsync(getInquiryCodeQuery);
                    inquiryCode = codeResult && codeResult.length > 0 ? codeResult[0].inquiryCode : `INQ-${newInquiryId}`;
                } catch (codeError) {
                    console.warn('⚠️ فشل جلب inquiryCode:', codeError.message);
                    inquiryCode = `INQ-${newInquiryId}`;
                }
            } else {
                inquiryCode = `INQ-${Date.now()}`;
            }
            
            try {
                await executeNonQuery(`
                    UPDATE Projects 
                    SET updatedAt = GETDATE()
                    WHERE id = ${projectId}
                `);
                console.log('📝 تم تحديث تاريخ المشروع');
            } catch (updateError) {
                console.warn('⚠️ فشل تحديث المشروع:', updateError.message);
            }
            
            let leadResult = null;
            
            try {
                const checkLeadQuery = `
                    SELECT id, leadCode, status
                    FROM Leads
                    WHERE customerEmail = N'${customerEmail.replace(/'/g, "''")}'
                       OR customerPhone = N'${cleanedPhone.replace(/'/g, "''")}'
                `;
                
                const existingLead = await queryAsync(checkLeadQuery);
                
                if (existingLead && existingLead.length > 0) {
                    console.log(`✅ العميل موجود مسبقاً في Leads, ID: ${existingLead[0].id}`);
                    
                    await executeNonQuery(`
                        UPDATE Leads
                        SET updatedAt = GETDATE()
                        WHERE id = ${existingLead[0].id}
                    `);
                    
                    leadResult = {
                        id: existingLead[0].id,
                        leadCode: existingLead[0].leadCode,
                        status: existingLead[0].status,
                        existed: true
                    };
                } else {
                    console.log('➕ إضافة عميل جديد إلى Leads...');
                    
                    let insertLeadQuery;
                    if (newInquiryId) {
                        insertLeadQuery = `
                            INSERT INTO Leads (
                                inquiryId,
                                customerName,
                                customerEmail,
                                customerPhone,
                                projectId,
                                leadSource,
                                status,
                                priority,
                                createdAt,
                                updatedAt
                            ) VALUES (
                                ${newInquiryId},
                                N'${customerName.replace(/'/g, "''")}',
                                N'${customerEmail.replace(/'/g, "''")}',
                                N'${cleanedPhone.replace(/'/g, "''")}',
                                ${projectId},
                                N'موقع_إلكتروني',
                                N'مؤهل',
                                N'عالي',
                                GETDATE(),
                                GETDATE()
                            );
                        `;
                    } else {
                        insertLeadQuery = `
                            INSERT INTO Leads (
                                customerName,
                                customerEmail,
                                customerPhone,
                                projectId,
                                leadSource,
                                status,
                                priority,
                                createdAt,
                                updatedAt
                            ) VALUES (
                                N'${customerName.replace(/'/g, "''")}',
                                N'${customerEmail.replace(/'/g, "''")}',
                                N'${cleanedPhone.replace(/'/g, "''")}',
                                ${projectId},
                                N'موقع_إلكتروني',
                                N'مؤهل',
                                N'عالي',
                                GETDATE(),
                                GETDATE()
                            );
                        `;
                    }
                    
                    await executeNonQuery(insertLeadQuery);
                    
                    const leadIdResult = await queryAsync(`SELECT @@IDENTITY as newLeadId;`);
                    const newLeadId = leadIdResult && leadIdResult.length > 0 ? leadIdResult[0].newLeadId : null;
                    
                    if (newLeadId) {
                        const leadCodeQuery = `SELECT leadCode FROM Leads WHERE id = ${newLeadId}`;
                        const leadCodeResult = await queryAsync(leadCodeQuery);
                        const leadCode = leadCodeResult && leadCodeResult.length > 0 ? leadCodeResult[0].leadCode : `LEAD-${newLeadId}`;
                        
                        leadResult = {
                            id: newLeadId,
                            leadCode: leadCode,
                            status: 'مؤهل',
                            existed: false
                        };
                        console.log(`✅ تم إنشاء الليد بنجاح، ID: ${newLeadId}, Code: ${leadCode}`);
                    }
                }
            } catch (leadError) {
                console.error('❌ فشل في معالجة الليد:', leadError.message);
                leadResult = {
                    error: leadError.message,
                    note: 'فشل إضافة/تحديث الليد، ولكن تم حفظ الاستفسار بنجاح'
                };
            }
            
            try {
                const checkAuditTableQuery = `
                    SELECT TABLE_NAME 
                    FROM INFORMATION_SCHEMA.TABLES 
                    WHERE TABLE_NAME = 'AuditLogs'
                `;
                
                const auditTableCheck = await queryAsync(checkAuditTableQuery);
                
                if (auditTableCheck && auditTableCheck.length > 0 && newInquiryId) {
                    const auditQuery = `
                        INSERT INTO AuditLogs (
                            userId,
                            action,
                            tableName,
                            recordId,
                            newValue,
                            ipAddress,
                            userAgent,
                            createdAt
                        ) VALUES (
                            NULL,
                            N'إنشاء استفسار وليد',
                            N'Inquiries',
                            ${newInquiryId},
                            N'استفسار جديد: ${customerName.replace(/'/g, "''")} - ${projectName.replace(/'/g, "''")}',
                            N'${(req.ip || 'غير معروف').replace(/'/g, "''")}',
                            N'${(req.headers['user-agent'] || 'غير معروف').replace(/'/g, "''")}',
                            GETDATE()
                        )
                    `;
                    
                    await executeNonQuery(auditQuery);
                    console.log('📝 تم تسجيل سجل التدقيق');
                }
            } catch (auditError) {
                console.warn('⚠️ فشل تسجيل سجل التدقيق:', auditError.message);
            }
            
            console.log(`✅ تم إرسال الاستفسار بنجاح، ID: ${newInquiryId || 'غير معروف'}, Code: ${inquiryCode}`);
            
            res.status(201).json({
                success: true,
                data: {
                    inquiry: {
                        id: newInquiryId,
                        inquiryCode: inquiryCode,
                        projectId: projectId,
                        projectName: projectName,
                        projectCode: projectCode,
                        customerName: customerName,
                        customerEmail: customerEmail,
                        contactPreference: contactPreference,
                        preferredTime: preferredTime || null,
                        submittedAt: new Date().toISOString()
                    },
                    lead: leadResult
                },
                message: newInquiryId ? 'تم إرسال استفسارك بنجاح. سيتواصل معك فريقنا قريباً.' : 'تم استلام استفسارك، ولكن حدث خطأ بسيط في تسجيل المعرف. سنتواصل معك قريباً.',
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ خطأ في إرسال الاستفسار:', error);
            console.error('❌ تفاصيل الخطأ:', error.stack);
            
            res.status(500).json({
                success: false,
                message: 'فشل في إرسال الاستفسار',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
                details: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    });
    
    // 📊 جلب إحصائيات المشروع
    router.get('/:id/stats', async (req, res) => {
        try {
            const projectId = parseInt(req.params.id);
            
            console.log(`📊 جلب إحصائيات المشروع ID: ${projectId}`);
            
            if (!projectId || isNaN(projectId)) {
                return res.status(400).json({
                    success: false,
                    message: 'معرّف العقار غير صالح'
                });
            }
            
            const statsQuery = `
                SELECT 
                    (SELECT COUNT(*) FROM Inquiries WHERE projectId = ${projectId}) as inquiriesCount,
                    (SELECT COUNT(*) FROM Leads WHERE projectId = ${projectId}) as leadsCount,
                    (SELECT COUNT(*) FROM Contracts WHERE projectId = ${projectId}) as contractsCount,
                    (SELECT COUNT(*) FROM Contracts WHERE projectId = ${projectId} AND contractStatus = 'نشط') as activeContractsCount,
                    
                    p.projectName,
                    p.projectType,
                    p.city,
                    p.status,
                    p.availableUnits,
                    p.totalUnits,
                    p.price,
                    p.priceType,
                    p.locationLink
                FROM Projects p
                WHERE p.id = ${projectId}
            `;
            
            const statsResult = await queryAsync(statsQuery);
            
            if (!statsResult || statsResult.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'العقار غير موجود'
                });
            }
            
            const stats = statsResult[0];
            
            let recentInquiries = [];
            try {
                const recentInquiriesQuery = `
                    SELECT TOP 5 
                        id,
                        inquiryCode,
                        customerName,
                        customerEmail,
                        inquiryType,
                        status,
                        createdAt
                    FROM Inquiries
                    WHERE projectId = ${projectId}
                    ORDER BY createdAt DESC
                `;
                
                recentInquiries = await queryAsync(recentInquiriesQuery);
            } catch (inqError) {
                console.warn('⚠️ فشل جلب الاستفسارات الحديثة:', inqError.message);
            }
            
            const processedStats = {
                projectId: projectId,
                projectName: stats.projectName || 'عقار',
                projectType: getProjectTypeText(stats.projectType || 'سكني'),
                city: stats.city || 'الرياض',
                status: getStatusText(stats.status || 'نشط'),
                locationLink: stats.locationLink || null,
                
                statistics: {
                    inquiries: {
                        total: parseInt(stats.inquiriesCount) || 0,
                        recent: (recentInquiries || []).map(inq => ({
                            id: inq.id,
                            inquiryCode: inq.inquiryCode || `INQ-${inq.id}`,
                            customerName: inq.customerName,
                            type: inq.inquiryType || 'استفسار عام',
                            status: inq.status || 'جديد',
                            date: inq.createdAt
                        }))
                    },
                    leads: parseInt(stats.leadsCount) || 0,
                    contracts: {
                        total: parseInt(stats.contractsCount) || 0,
                        active: parseInt(stats.activeContractsCount) || 0
                    },
                    units: {
                        total: parseInt(stats.totalUnits) || 0,
                        available: parseInt(stats.availableUnits) || 0,
                        occupied: parseInt(stats.totalUnits) - parseInt(stats.availableUnits) || 0,
                        occupancyRate: stats.totalUnits > 0 ? 
                            Math.round(((parseInt(stats.totalUnits) - parseInt(stats.availableUnits)) / parseInt(stats.totalUnits)) * 100) : 0
                    },
                    price: {
                        value: parseFloat(stats.price) || 0,
                        type: getPriceTypeText(stats.priceType || 'شراء')
                    }
                }
            };
            
            res.status(200).json({
                success: true,
                data: processedStats,
                source: 'real_database',
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ خطأ في جلب إحصائيات المشروع:', error);
            
            res.status(500).json({
                success: false,
                message: 'فشل في جلب إحصائيات المشروع',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });
    
    // 🧪 اختبار API تفاصيل المشروع
    router.get('/:id/test', async (req, res) => {
        try {
            const projectId = parseInt(req.params.id);
            
            console.log(`🧪 اختبار API تفاصيل المشروع ID: ${projectId}`);
            
            const projectTest = await queryAsync(`
                SELECT 
                    p.id,
                    p.projectName,
                    p.projectType,
                    p.city,
                    p.locationLink,
                    (SELECT COUNT(*) FROM ProjectImages WHERE projectId = p.id) as imagesCount,
                    (SELECT COUNT(*) FROM ProjectFeatures WHERE projectId = p.id) as featuresCount
                FROM Projects p
                WHERE p.id = ${projectId}
            `);
            
            const imagesTest = await queryAsync(`
                SELECT TOP 2 id, imageUrl
                FROM ProjectImages 
                WHERE projectId = ${projectId} AND isActive = 1
                ORDER BY displayOrder
            `);
            
            const featuresTest = await queryAsync(`
                SELECT TOP 2 featureName, featureValue
                FROM ProjectFeatures 
                WHERE projectId = ${projectId}
                ORDER BY displayOrder
            `);
            
            res.status(200).json({
                success: true,
                data: {
                    project: projectTest && projectTest.length > 0 ? projectTest[0] : null,
                    images: {
                        sample: imagesTest,
                        count: projectTest && projectTest.length > 0 ? projectTest[0].imagesCount : 0
                    },
                    features: {
                        sample: featuresTest,
                        count: projectTest && projectTest.length > 0 ? projectTest[0].featuresCount : 0
                    },
                    apiStatus: 'working',
                    database: 'abh',
                    timestamp: new Date().toLocaleString('ar-SA')
                },
                message: '✅ اختبار API تفاصيل المشروع ناجح'
            });
            
        } catch (error) {
            console.error('❌ فشل اختبار API تفاصيل المشروع:', error);
            
            res.status(200).json({
                success: false,
                error: error.message,
                database: 'abh',
                message: '❌ فشل اختبار API تفاصيل المشروع'
            });
        }
    });
    
    // 📌 اختبار inquiry مباشر
    router.post('/test-inquiry', async (req, res) => {
        try {
            console.log('🧪 اختبار inquiry مباشر:', req.body);
            
            res.status(200).json({
                success: true,
                message: '✅ اختبار inquiry ناجح',
                data: req.body,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('❌ فشل اختبار inquiry:', error);
            res.status(500).json({
                success: false,
                message: 'فشل اختبار inquiry',
                error: error.message
            });
        }
    });
    
    // 🔧 إنشاء جدول Inquiries إذا لم يكن موجوداً
    router.get('/setup/inquiries-table', async (req, res) => {
        try {
            const createTableQuery = `
                IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Inquiries')
                BEGIN
                    CREATE TABLE Inquiries (
                        id INT IDENTITY(1,1) PRIMARY KEY,
                        inquiryCode AS ('INQ-' + RIGHT('00000' + CAST(id AS NVARCHAR(5)), 5)) PERSISTED,
                        projectId INT NOT NULL,
                        customerName NVARCHAR(100) NOT NULL,
                        customerEmail NVARCHAR(100) NOT NULL,
                        customerPhone NVARCHAR(20) NOT NULL,
                        message NVARCHAR(MAX) NOT NULL,
                        inquiryType NVARCHAR(50) DEFAULT 'استفسار_عام',
                        status NVARCHAR(50) DEFAULT 'جديد',
                        contactPreferences NVARCHAR(50) NULL,
                        preferredTime NVARCHAR(50) NULL,
                        assignedTo INT NULL,
                        response NVARCHAR(MAX) NULL,
                        respondedAt DATETIME NULL,
                        respondedBy INT NULL,
                        createdAt DATETIME DEFAULT GETDATE(),
                        updatedAt DATETIME DEFAULT GETDATE(),
                        FOREIGN KEY (projectId) REFERENCES Projects(id)
                    )
                    
                    PRINT 'تم إنشاء جدول Inquiries بنجاح'
                END
                ELSE
                BEGIN
                    PRINT 'جدول Inquiries موجود بالفعل'
                END
            `;
            
            await queryAsync(createTableQuery);
            
            const testInsertQuery = `
                INSERT INTO Inquiries (projectId, customerName, customerEmail, customerPhone, message, inquiryType, status, contactPreferences, preferredTime)
                VALUES (1, N'اختبار', N'test@test.com', N'0512345678', N'رسالة اختبار', N'استفسار_عام', N'جديد', N'whatsapp', N'مساءً');
                
                SELECT TOP 1 id, inquiryCode FROM Inquiries ORDER BY id DESC;
            `;
            
            const testResult = await queryAsync(testInsertQuery);
            
            res.status(200).json({
                success: true,
                message: '✅ تم إنشاء/التحقق من جدول Inquiries بنجاح',
                testInsert: testResult && testResult.length > 0 ? testResult[0] : null,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ فشل في إنشاء جدول Inquiries:', error);
            
            res.status(500).json({
                success: false,
                message: 'فشل في إنشاء جدول Inquiries',
                error: error.message,
                details: 'تحقق من صلاحيات قاعدة البيانات'
            });
        }
    });
    
    // 🔍 عرض هيكل جدول Inquiries
    router.get('/debug/inquiries-structure', async (req, res) => {
        try {
            const structureQuery = `
                SELECT 
                    COLUMN_NAME,
                    DATA_TYPE,
                    CHARACTER_MAXIMUM_LENGTH as MAX_LENGTH,
                    IS_NULLABLE,
                    COLUMN_DEFAULT,
                    COLUMNPROPERTY(OBJECT_ID('Inquiries'), COLUMN_NAME, 'IsComputed') as IsComputed,
                    COLUMNPROPERTY(OBJECT_ID('Inquiries'), COLUMN_NAME, 'IsIdentity') as IsIdentity
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'Inquiries'
                ORDER BY ORDINAL_POSITION
            `;
            
            const structure = await queryAsync(structureQuery);
            
            let sample = [];
            try {
                sample = await queryAsync(`SELECT TOP 5 * FROM Inquiries ORDER BY id DESC`);
            } catch (sampleError) {
                console.warn('⚠️ فشل جلب عينة من البيانات:', sampleError.message);
            }
            
            res.status(200).json({
                success: true,
                data: {
                    structure: structure,
                    sample: sample,
                    tableExists: structure && structure.length > 0
                },
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ فشل في جلب هيكل الجدول:', error);
            
            res.status(500).json({
                success: false,
                message: 'فشل في جلب هيكل الجدول',
                error: error.message
            });
        }
    });
    
    // ===== دوال مساعدة =====
    
    function getProjectTypeText(type) {
        if (!type) return 'سكني';
        
        const typeLower = type.toString().toLowerCase();
        const typeMap = {
            'residential': 'سكني',
            'commercial': 'تجاري',
            'villa': 'فيلا',
            'apartment': 'شقة',
            'office': 'مكتب',
            'shop': 'محل تجاري',
            'land': 'أرض',
            'صناعي': 'صناعي',
            'فندقي': 'فندقي',
            'سكني': 'سكني',
            'تجاري': 'تجاري',
            'فيلا': 'فيلا',
            'شقة': 'شقة'
        };
        
        return typeMap[typeLower] || type;
    }
    
    function getPriceTypeText(type) {
        if (!type) return 'شراء';
        
        const typeLower = type.toString().toLowerCase();
        const typeMap = {
            'شراء': 'شراء',
            'تأجير': 'إيجار',
            'إيجار_تشغيلي': 'إيجار',
            'rent': 'إيجار',
            'sale': 'شراء',
            'بيع': 'شراء',
            'شراء/بيع': 'شراء'
        };
        
        return typeMap[typeLower] || type;
    }
    
    function getStatusText(status) {
        if (!status) return 'نشط';
        
        const statusLower = status.toString().toLowerCase();
        const statusMap = {
            'جاهز_للتسليم': 'جاهز',
            'مكتمل': 'مكتمل',
            'نشط': 'نشط',
            'قيد_الإنشاء': 'قيد الإنشاء',
            'مباع': 'مباع',
            'محجوز': 'محجوز',
            'active': 'نشط',
            'completed': 'مكتمل',
            'sold': 'مباع',
            'under_construction': 'قيد الإنشاء'
        };
        
        return statusMap[statusLower] || status;
    }
    
    return router;
};