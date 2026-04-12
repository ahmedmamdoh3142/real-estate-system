// Backend/services/public/project-details.service.js - خدمة تفاصيل المشروع مع الحقول الجديدة والتحقق من الليد (نسخة متوافقة مع @@IDENTITY)
const sql = require('msnodesqlv8');

// سلسلة الاتصال
require('dotenv').config();
const sql = require('msnodesqlv8');
const connectionString = process.env.DB_CONNECTION_STRING;

// دالة مساعدة للاستعلامات
function queryAsync(sqlQuery) {
    return new Promise((resolve, reject) => {
        sql.query(connectionString, sqlQuery, (err, rows) => {
            if (err) {
                console.error('❌ خطأ في الاستعلام:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// دالة لتنفيذ أوامر (INSERT, UPDATE, DELETE) بدون توقع نتائج
function executeNonQuery(sqlQuery) {
    return new Promise((resolve, reject) => {
        sql.query(connectionString, sqlQuery, (err, rows) => {
            if (err) {
                console.error('❌ خطأ في تنفيذ الأمر:', err.message);
                reject(err);
            } else {
                console.log(`✅ تم تنفيذ الأمر بنجاح`);
                resolve(rows);
            }
        });
    });
}

/**
 * جلب تفاصيل عقار محدد
 */
exports.getProjectDetails = async (projectId) => {
    try {
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
        
        const projectResult = await queryAsync(projectQuery);
        
        if (!projectResult || projectResult.length === 0) {
            return null;
        }
        
        const project = projectResult[0];
        
        // جلب الصور والميزات
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
        
        return {
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
                url: img.imageUrl,
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
        
    } catch (error) {
        console.error('❌ خطأ في getProjectDetails service:', error);
        throw error;
    }
};

/**
 * جلب العقارات المشابهة
 */
exports.getRelatedProjects = async (projectId, limit = 3) => {
    try {
        // جلب بيانات المشروع الحالي
        const currentProject = await queryAsync(`
            SELECT projectType, city
            FROM Projects
            WHERE id = ${projectId}
        `);
        
        if (!currentProject || currentProject.length === 0) {
            return [];
        }
        
        const { projectType, city } = currentProject[0];
        
        // جلب العقارات المشابهة
        const relatedQuery = `
            SELECT TOP ${limit} 
                p.id,
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
                p.status
            FROM Projects p
            WHERE p.id != ${projectId}
            AND (p.projectType = N'${projectType?.replace(/'/g, "''") || 'سكني'}'
                 OR p.city = N'${city?.replace(/'/g, "''") || 'الرياض'}')
            AND p.status NOT IN ('مباع', 'محجوز')
            ORDER BY 
                CASE WHEN p.projectType = N'${projectType?.replace(/'/g, "''") || 'سكني'}' THEN 0 ELSE 1 END,
                CASE WHEN p.city = N'${city?.replace(/'/g, "''") || 'الرياض'}' THEN 0 ELSE 1 END,
                p.isFeatured DESC,
                p.createdAt DESC
        `;
        
        const relatedProjects = await queryAsync(relatedQuery);
        
        // معالجة النتائج
        const processedProjects = await Promise.all(relatedProjects.map(async (project) => {
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
                isFeatured: project.isFeatured === true || project.isFeatured === 1,
                status: getStatusText(project.status || 'نشط'),
                mainImage: images && images.length > 0 ? images[0].imageUrl : '/global/assets/images/project-placeholder.jpg'
            };
        }));
        
        return processedProjects;
        
    } catch (error) {
        console.error('❌ خطأ في getRelatedProjects service:', error);
        throw error;
    }
};

/**
 * إرسال استفسار عن عقار (مع إضافة الليد والتحقق) - نسخة مع @@IDENTITY والسماح بـ NULL في inquiryId
 */
exports.submitInquiry = async (projectId, inquiryData) => {
    try {
        const {
            customerName,
            customerEmail,
            customerPhone,
            message,
            inquiryType = 'استفسار_عام',
            contactPreference,
            preferredTime
        } = inquiryData;
        
        // التحقق من وجود المشروع
        const projectCheck = await queryAsync(`
            SELECT projectName
            FROM Projects
            WHERE id = ${projectId}
        `);
        
        if (!projectCheck || projectCheck.length === 0) {
            throw new Error('العقار غير موجود');
        }
        
        const projectName = projectCheck[0].projectName;
        
        // تنظيف رقم الجوال
        const cleanedPhone = customerPhone.replace(/\s+/g, '');
        
        // إدخال الاستفسار (استعلام منفصل)
        const insertQuery = `
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
        
        await executeNonQuery(insertQuery);
        
        // جلب آخر ID باستخدام @@IDENTITY
        const idResult = await queryAsync(`SELECT @@IDENTITY as newId;`);
        let newId = idResult && idResult.length > 0 ? idResult[0].newId : null;
        
        // إذا فشل @@IDENTITY، نجرب SCOPE_IDENTITY()
        if (!newId) {
            const scopeResult = await queryAsync(`SELECT SCOPE_IDENTITY() as newId;`);
            newId = scopeResult && scopeResult.length > 0 ? scopeResult[0].newId : null;
        }
        
        // إذا فشل كل شيء، نستخدم آخر ID
        if (!newId) {
            const lastIdResult = await queryAsync(`SELECT MAX(id) as newId FROM Inquiries;`);
            newId = lastIdResult && lastIdResult.length > 0 ? lastIdResult[0].newId : null;
        }
        
        // جلب inquiryCode إذا كان newId موجوداً
        let inquiryCode = null;
        if (newId) {
            const codeResult = await queryAsync(`
                SELECT inquiryCode 
                FROM Inquiries 
                WHERE id = ${newId}
            `);
            inquiryCode = codeResult && codeResult.length > 0 ? codeResult[0].inquiryCode : `INQ-${newId}`;
        } else {
            inquiryCode = `INQ-${Date.now()}`;
        }
        
        // إدارة الليد
        let leadResult = null;
        
        // التحقق من وجود العميل في Leads
        const checkLeadQuery = `
            SELECT id, leadCode, status
            FROM Leads
            WHERE customerEmail = N'${customerEmail.replace(/'/g, "''")}'
               OR customerPhone = N'${cleanedPhone.replace(/'/g, "''")}'
        `;
        
        const existingLead = await queryAsync(checkLeadQuery);
        
        if (existingLead && existingLead.length > 0) {
            // تحديث تاريخ التحديث
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
            // إنشاء ليد جديد - بدون leadCode (computed) ومع إمكانية NULL لـ inquiryId
            let insertLeadQuery;
            if (newId) {
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
                        ${newId},
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
            
            const leadIdResult = await queryAsync(`SELECT @@IDENTITY as leadId;`);
            const leadId = leadIdResult && leadIdResult.length > 0 ? leadIdResult[0].leadId : null;
            
            if (leadId) {
                const leadCodeResult = await queryAsync(`SELECT leadCode FROM Leads WHERE id = ${leadId}`);
                const leadCode = leadCodeResult && leadCodeResult.length > 0 ? leadCodeResult[0].leadCode : `LEAD-${leadId}`;
                
                leadResult = {
                    id: leadId,
                    leadCode: leadCode,
                    status: 'مؤهل',
                    existed: false
                };
            }
        }
        
        return {
            inquiryId: newId,
            inquiryCode: inquiryCode,
            projectId: projectId,
            projectName: projectName,
            customerName: customerName,
            submittedAt: new Date(),
            lead: leadResult
        };
        
    } catch (error) {
        console.error('❌ خطأ في submitInquiry service:', error);
        throw error;
    }
};

/**
 * جلب إحصائيات المشروع
 */
exports.getProjectStats = async (projectId) => {
    try {
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
            return null;
        }
        
        const stats = statsResult[0];
        
        return {
            projectId: projectId,
            projectName: stats.projectName || 'عقار',
            projectType: getProjectTypeText(stats.projectType || 'سكني'),
            city: stats.city || 'الرياض',
            status: getStatusText(stats.status || 'نشط'),
            locationLink: stats.locationLink || null,
            
            statistics: {
                inquiries: parseInt(stats.inquiriesCount) || 0,
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
        
    } catch (error) {
        console.error('❌ خطأ في getProjectStats service:', error);
        throw error;
    }
};

// دوال مساعدة
function getProjectTypeText(type) {
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
        'تجاري': 'تجاري'
    };
    
    return typeMap[type?.toLowerCase()] || type || 'سكني';
}

function getPriceTypeText(type) {
    if (!type) return 'شراء';
    
    const typeLower = type.toString().toLowerCase();
    if (typeLower.includes('إيجار') || typeLower.includes('تأجير') || typeLower === 'rent') {
        return 'إيجار';
    }
    return 'شراء';
}

function getStatusText(status) {
    const statusMap = {
        'جاهز_للتسليم': 'جاهز',
        'مكتمل': 'مكتمل',
        'نشط': 'نشط',
        'قيد_الإنشاء': 'قيد الإنشاء',
        'مباع': 'مباع',
        'محجوز': 'محجوز',
        'active': 'نشط',
        'completed': 'مكتمل',
        'sold': 'مباع'
    };
    
    return statusMap[status?.toLowerCase()] || status || 'نشط';
}