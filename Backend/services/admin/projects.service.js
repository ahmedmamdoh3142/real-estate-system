// 📁 Backend/services/admin/projects.service.js - النسخة المصححة كاملة مع إضافة locationLink و contractPdfUrl وإصلاح مشكلة الحذف (معدلة لاستخدام mssql)
const sql = require('mssql');

require('dotenv').config();

// الحصول على pool من app.locals (تم تعيينه في server.js)
function getPool() {
    if (!global.dbPool) {
        throw new Error('قاعدة البيانات غير متصلة - global.dbPool غير موجود');
    }
    return global.dbPool;
}

class ProjectsService {
    
    /**
     * تنفيذ استعلام مع معاملات - محسنة
     */
    async queryAsync(query, params = {}) {
        const pool = getPool();
        try {
            console.log('📝 تنفيذ استعلام SQL...');
            console.log('🔤 الاستعلام:', query.substring(0, 200) + (query.length > 200 ? '...' : ''));
            
            if (Object.keys(params).length > 0) {
                console.log('📦 المعاملات:', params);
            }
            
            const result = await pool.request().query(query);
            console.log(`✅ نجاح الاستعلام، عدد النتائج: ${result.recordset ? result.recordset.length : 0}`);
            return result.recordset || [];
        } catch (err) {
            console.error('❌ خطأ في الاستعلام:', err.message);
            throw err;
        }
    }

    /**
     * تنفيذ استعلام INSERT/UPDATE/DELETE
     */
    async executeAsync(query) {
        const pool = getPool();
        try {
            console.log('⚡ تنفيذ استعلام تغيير...');
            console.log('🔤 الاستعلام:', query.substring(0, 300));
            
            const result = await pool.request().query(query);
            console.log('✅ تم التنفيذ بنجاح');
            return result;
        } catch (err) {
            console.error('❌ خطأ في التنفيذ:', err.message);
            throw err;
        }
    }

    /**
     * إدخال آمن للسلسلة النصية في SQL
     */
    escapeSql(str) {
        if (!str) return '';
        // استبدال الاقتباسات المفردة لتفادي SQL Injection
        return str.replace(/'/g, "''");
    }

    /**
     * حساب الوقت المنقضي
     */
    getTimeAgo(dateString) {
        if (!dateString) return '--';
        
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            const diffMonths = Math.floor(diffDays / 30);
            const diffYears = Math.floor(diffDays / 365);
            
            if (diffMins < 1) {
                return 'الآن';
            } else if (diffMins < 60) {
                return `قبل ${diffMins} دقيقة`;
            } else if (diffHours < 24) {
                return `قبل ${diffHours} ساعة`;
            } else if (diffDays < 30) {
                return `قبل ${diffDays} يوم`;
            } else if (diffMonths < 12) {
                return `قبل ${diffMonths} شهر`;
            } else {
                return `قبل ${diffYears} سنة`;
            }
        } catch (error) {
            return dateString;
        }
    }

    /**
     * جلب جميع المشاريع مع فلترة - مصححة تماماً
     */
    async getAllProjects(page = 1, limit = 25, sort = 'newest', filters = {}) {
        try {
            console.log('📊 جلب المشاريع من قاعدة البيانات مع الفلترات...');
            console.log('🎯 الفلترات:', filters);
            
            let whereClauses = [];
            
            // معالجة الفلترات بشكل صحيح
            if (filters.search && filters.search.trim() !== '') {
                whereClauses.push(`(
                    projectName LIKE N'%${this.escapeSql(filters.search)}%' OR 
                    projectCode LIKE N'%${this.escapeSql(filters.search)}%' OR 
                    location LIKE N'%${this.escapeSql(filters.search)}%' OR 
                    city LIKE N'%${this.escapeSql(filters.search)}%' OR 
                    district LIKE N'%${this.escapeSql(filters.search)}%'
                )`);
            }
            
            if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
                const statusList = filters.status.map(s => `N'${this.escapeSql(s)}'`).join(', ');
                whereClauses.push(`status IN (${statusList})`);
            }
            
            if (filters.type && Array.isArray(filters.type) && filters.type.length > 0) {
                const typeList = filters.type.map(t => `N'${this.escapeSql(t)}'`).join(', ');
                whereClauses.push(`projectType IN (${typeList})`);
            }
            
            if (filters.featured === true || filters.featured === 'true') {
                whereClauses.push(`isFeatured = 1`);
            }
            
            if (filters.available === true || filters.available === 'true') {
                whereClauses.push(`availableUnits > 0`);
            }
            
            const whereClause = whereClauses.length > 0 
                ? `WHERE ${whereClauses.join(' AND ')}` 
                : '';
            
            console.log('🔧 جملة WHERE النهائية:', whereClause);
            
            let orderBy = 'ORDER BY ';
            switch(sort) {
                case 'oldest':
                    orderBy += 'createdAt ASC';
                    break;
                case 'name':
                    orderBy += 'projectName ASC';
                    break;
                case 'price-high':
                    orderBy += 'price DESC';
                    break;
                case 'price-low':
                    orderBy += 'price ASC';
                    break;
                default:
                    orderBy += 'createdAt DESC';
            }
            
            const offset = (page - 1) * limit;
            
            const query = `
                SELECT 
                    id, projectCode, projectName, projectType, 
                    description, location, city, district, locationLink,
                    totalUnits, availableUnits, price, priceType,
                    area, areaUnit, bedrooms, bathrooms,
                    isFeatured, status, completionDate,
                    createdBy, createdAt, updatedAt
                FROM Projects 
                ${whereClause}
                ${orderBy}
                OFFSET ${offset} ROWS 
                FETCH NEXT ${limit} ROWS ONLY
            `;
            
            const countQuery = `
                SELECT COUNT(*) as total 
                FROM Projects 
                ${whereClause}
            `;
            
            console.log('📄 استعلام الجلب:', query.substring(0, 200));
            
            const [projects, countResult] = await Promise.all([
                this.queryAsync(query),
                this.queryAsync(countQuery)
            ]);
            
            const totalItems = countResult[0]?.total || 0;
            const totalPages = Math.ceil(totalItems / limit);
            
            console.log(`✅ تم جلب ${projects.length} مشروع من أصل ${totalItems}`);
            
            // جلب الصور والميزات لكل مشروع
            const enrichedProjects = await Promise.all(
                projects.map(async (project) => {
                    const [features, images] = await Promise.all([
                        this.getProjectFeatures(project.id),
                        this.getProjectImages(project.id)
                    ]);
                    
                    return {
                        ...project,
                        features: features || [],
                        images: images || [],
                        featuresCount: features.length,
                        imagesCount: images.length
                    };
                })
            );
            
            return {
                projects: enrichedProjects,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: totalPages,
                    totalItems: totalItems,
                    itemsPerPage: parseInt(limit),
                    hasNextPage: parseInt(page) < totalPages,
                    hasPrevPage: parseInt(page) > 1
                }
            };
            
        } catch (error) {
            console.error('❌ خطأ في getAllProjects:', error.message);
            throw error;
        }
    }

    /**
     * جلب إحصائيات المشاريع
     */
    async getProjectsStats() {
        try {
            console.log('📈 جلب إحصائيات المشاريع...');
            
            const query = `
                SELECT 
                    COUNT(*) as totalProjects,
                    SUM(CASE WHEN isFeatured = 1 THEN 1 ELSE 0 END) as featuredProjects,
                    SUM(CASE WHEN status = 'نشط' THEN 1 ELSE 0 END) as activeProjects,
                    SUM(CASE WHEN status = 'قيد_الإنشاء' THEN 1 ELSE 0 END) as underConstructionProjects,
                    ISNULL(SUM(totalUnits), 0) as totalUnits,
                    ISNULL(SUM(availableUnits), 0) as availableUnits,
                    ISNULL(SUM(totalUnits - availableUnits), 0) as rentedUnits,
                    ISNULL(AVG(price), 0) as averagePrice,
                    COUNT(CASE WHEN MONTH(createdAt) = MONTH(GETDATE()) 
                               AND YEAR(createdAt) = YEAR(GETDATE()) 
                               THEN 1 END) as newThisMonth
                FROM Projects
            `;
            
            const result = await this.queryAsync(query);
            
            if (!result || result.length === 0) {
                throw new Error('لا توجد بيانات إحصائية');
            }
            
            const stats = result[0];
            
            const typeQuery = `
                SELECT 
                    projectType,
                    COUNT(*) as count
                FROM Projects
                GROUP BY projectType
            `;
            
            const typeResult = await this.queryAsync(typeQuery);
            const typeDistribution = {};
            
            if (typeResult && typeResult.length > 0) {
                typeResult.forEach(row => {
                    typeDistribution[row.projectType] = row.count;
                });
            }
            
            return {
                totalProjects: parseInt(stats.totalProjects) || 0,
                featuredProjects: parseInt(stats.featuredProjects) || 0,
                activeProjects: parseInt(stats.activeProjects) || 0,
                underConstructionProjects: parseInt(stats.underConstructionProjects) || 0,
                totalUnits: parseInt(stats.totalUnits) || 0,
                availableUnits: parseInt(stats.availableUnits) || 0,
                rentedUnits: parseInt(stats.rentedUnits) || 0,
                averagePrice: parseFloat(stats.averagePrice) || 0,
                newThisMonth: parseInt(stats.newThisMonth) || 0,
                typeDistribution: typeDistribution
            };
            
        } catch (error) {
            console.error('❌ خطأ في getProjectsStats:', error.message);
            throw error;
        }
    }

    /**
     * جلب المشاريع الحديثة
     */
    async getRecentProjects(limit = 4) {
        try {
            console.log(`🆕 جلب ${limit} مشروع حديث...`);
            
            const query = `
                SELECT TOP ${limit} *
                FROM Projects
                ORDER BY createdAt DESC
            `;
            
            const projects = await this.queryAsync(query);
            
            const enrichedProjects = await Promise.all(
                projects.map(async (project) => {
                    const [features, images] = await Promise.all([
                        this.getProjectFeatures(project.id),
                        this.getProjectImages(project.id)
                    ]);
                    
                    return {
                        ...project,
                        features: features || [],
                        images: images || [],
                        featuresCount: features.length,
                        imagesCount: images.length,
                        timeAgo: this.getTimeAgo(project.createdAt)
                    };
                })
            );
            
            return enrichedProjects;
            
        } catch (error) {
            console.error('❌ خطأ في getRecentProjects:', error.message);
            throw error;
        }
    }

    /**
     * جلب مشروع واحد مع الصور والميزات
     */
    async getProjectById(id) {
        try {
            console.log(`📄 جلب مشروع رقم ${id}...`);
            
            const query = `
                SELECT *
                FROM Projects
                WHERE id = ${parseInt(id)}
            `;
            
            const result = await this.queryAsync(query);
            
            if (!result || result.length === 0) {
                return null;
            }
            
            const project = result[0];
            
            // جلب الميزات والصور
            const [features, images] = await Promise.all([
                this.getProjectFeatures(id),
                this.getProjectImages(id)
            ]);
            
            project.features = features || [];
            project.images = images || [];
            
            return project;
            
        } catch (error) {
            console.error('❌ خطأ في getProjectById:', error.message);
            throw error;
        }
    }

    /**
     * جلب ميزات المشروع
     */
    async getProjectFeatures(projectId) {
        try {
            console.log(`⭐ جلب ميزات مشروع ${projectId}...`);
            
            const query = `
                SELECT *
                FROM ProjectFeatures
                WHERE projectId = ${projectId}
                ORDER BY displayOrder
            `;
            
            return await this.queryAsync(query);
        } catch (error) {
            console.error('❌ خطأ في getProjectFeatures:', error.message);
            return [];
        }
    }

    /**
     * جلب صور المشروع - ✅ إصلاح: إضافة isMain افتراضياً
     */
    async getProjectImages(projectId) {
        try {
            console.log(`🖼️ جلب صور مشروع ${projectId}...`);
            
            const query = `
                SELECT 
                    id, projectId, imageUrl, imageType, 
                    displayOrder, isActive, 
                    uploadedAt,
                    CASE 
                        WHEN imageType = 'صورة_رئيسية' THEN 1 
                        ELSE 0 
                    END as isMain
                FROM ProjectImages
                WHERE projectId = ${projectId}
                ORDER BY displayOrder
            `;
            
            return await this.queryAsync(query);
        } catch (error) {
            console.error('❌ خطأ في getProjectImages:', error.message);
            return [];
        }
    }

    /**
     * إنشاء مشروع جديد مع الصور والميزات - مصححة
     */
    async createProject(projectData) {
        try {
            console.log('➕ إنشاء مشروع جديد مع الصور والميزات...');
            console.log('📝 بيانات المشروع:', JSON.stringify(projectData, null, 2));
            
            // التحقق من البيانات الأساسية
            const requiredFields = ['projectName', 'projectCode', 'projectType', 'status', 
                                   'location', 'city', 'totalUnits', 'availableUnits', 'price', 'area'];
            const missingFields = requiredFields.filter(field => {
                const value = projectData[field];
                return value === undefined || value === null || value === '';
            });
            
            if (missingFields.length > 0) {
                throw new Error(`الحقول التالية مطلوبة: ${missingFields.join(', ')}`);
            }
            
            // التحقق من البيانات الرقمية
            const totalUnits = parseInt(projectData.totalUnits);
            const availableUnits = parseInt(projectData.availableUnits);
            const price = parseFloat(projectData.price);
            const area = parseFloat(projectData.area);
            
            if (isNaN(totalUnits) || totalUnits <= 0) {
                throw new Error('عدد الوحدات الإجمالي يجب أن يكون رقماً صحيحاً أكبر من الصفر');
            }
            
            if (isNaN(availableUnits) || availableUnits < 0) {
                throw new Error('عدد الوحدات المتاحة يجب أن يكون رقماً صحيحاً');
            }
            
            if (availableUnits > totalUnits) {
                throw new Error('الوحدات المتاحة لا يمكن أن تكون أكثر من إجمالي الوحدات');
            }
            
            if (isNaN(price) || price <= 0) {
                throw new Error('السعر يجب أن يكون رقماً أكبر من الصفر');
            }
            
            if (isNaN(area) || area <= 0) {
                throw new Error('المساحة يجب أن تكون رقماً أكبر من الصفر');
            }
            
            // تحويل القيم المنطقية
            const isFeatured = projectData.isFeatured === true || 
                               projectData.isFeatured === 'true' || 
                               projectData.isFeatured === 1 ? 1 : 0;
            
            // 🟢 استعلام الإضافة مع الحصول على الـ ID الجديد
            const insertQuery = `
                INSERT INTO Projects (
                    projectCode, projectName, projectType, description,
                    location, city, district, locationLink, totalUnits, availableUnits,
                    price, priceType, area, areaUnit, bedrooms, bathrooms,
                    isFeatured, status, completionDate, createdBy, createdAt, updatedAt
                ) 
                OUTPUT INSERTED.id
                VALUES (
                    N'${this.escapeSql(projectData.projectCode)}',
                    N'${this.escapeSql(projectData.projectName)}',
                    N'${this.escapeSql(projectData.projectType)}',
                    N'${this.escapeSql(projectData.description || '')}',
                    N'${this.escapeSql(projectData.location)}',
                    N'${this.escapeSql(projectData.city)}',
                    ${projectData.district ? `N'${this.escapeSql(projectData.district)}'` : 'NULL'},
                    ${projectData.locationLink ? `N'${this.escapeSql(projectData.locationLink)}'` : 'NULL'},
                    ${totalUnits},
                    ${availableUnits},
                    ${price},
                    N'${this.escapeSql(projectData.priceType || 'شراء')}',
                    ${area},
                    N'${this.escapeSql(projectData.areaUnit || 'متر_مربع')}',
                    ${projectData.bedrooms ? parseInt(projectData.bedrooms) : 'NULL'},
                    ${projectData.bathrooms ? parseInt(projectData.bathrooms) : 'NULL'},
                    ${isFeatured},
                    N'${this.escapeSql(projectData.status)}',
                    ${projectData.completionDate ? `'${projectData.completionDate}'` : 'NULL'},
                    ${projectData.createdBy || 1},
                    GETDATE(),
                    GETDATE()
                );
            `;
            
            console.log('⚙️ استعلام الـ INSERT:', insertQuery.substring(0, 300));
            
            // تنفيذ الاستعلام والحصول على الـ ID الجديد
            const result = await this.queryAsync(insertQuery);
            
            if (!result || result.length === 0) {
                throw new Error('فشل في الحصول على معرف المشروع الجديد');
            }
            
            const newId = result[0]?.id;
            
            if (!newId) {
                throw new Error('لم يتم إنشاء معرف للمشروع الجديد');
            }
            
            console.log(`✅ تم إنشاء المشروع بنجاح في قاعدة البيانات: ${projectData.projectCode} (ID: ${newId})`);
            
            // 🟢 إضافة الميزات إذا كانت موجودة
            if (projectData.features && Array.isArray(projectData.features) && projectData.features.length > 0) {
                console.log(`⭐ إضافة ${projectData.features.length} ميزة للمشروع...`);
                
                for (let i = 0; i < projectData.features.length; i++) {
                    const feature = projectData.features[i];
                    const featureName = feature.name || feature.featureName;
                    const featureValue = feature.value || feature.featureValue;
                    
                    if (featureName && featureValue) {
                        const featureQuery = `
                            INSERT INTO ProjectFeatures (projectId, featureName, featureValue, icon, displayOrder)
                            VALUES (
                                ${newId},
                                N'${this.escapeSql(featureName)}',
                                N'${this.escapeSql(featureValue)}',
                                N'${this.escapeSql(feature.icon || '')}',
                                ${feature.displayOrder || i + 1}
                            )
                        `;
                        await this.executeAsync(featureQuery);
                    }
                }
                console.log(`✅ تمت إضافة ${projectData.features.length} ميزة للمشروع ${newId}`);
            }
            
            // 🟢 إضافة الصور إذا كانت موجودة - ✅ إصلاح: إزالة isMain من الاستعلام
            if (projectData.images && Array.isArray(projectData.images) && projectData.images.length > 0) {
                console.log(`🖼️ إضافة ${projectData.images.length} صورة للمشروع...`);
                
                for (let i = 0; i < projectData.images.length; i++) {
                    const image = projectData.images[i];
                    
                    // ✅ تحويل isMain إلى imageType
                    let imageType = image.imageType || 'صورة_عامة';
                    if (image.isMain === true || image.isMain === 'true' || image.isMain === 1) {
                        imageType = 'صورة_رئيسية';
                    }
                    
                    const isActive = image.isActive !== undefined ? (image.isActive ? 1 : 0) : 1;
                    
                    const imageQuery = `
                        INSERT INTO ProjectImages (projectId, imageUrl, imageType, displayOrder, isActive, uploadedAt)
                        VALUES (
                            ${newId},
                            N'${this.escapeSql(image.imageUrl || `/uploads/projects/project-${newId}-${i + 1}.jpg`)}',
                            N'${this.escapeSql(imageType)}',
                            ${image.displayOrder || (i + 1)},
                            ${isActive},
                            GETDATE()
                        )
                    `;
                    await this.executeAsync(imageQuery);
                }
                console.log(`✅ تمت إضافة ${projectData.images.length} صورة للمشروع ${newId}`);
            }
            
            console.log(`🎉 تم إنشاء المشروع ${newId} بنجاح مع جميع البيانات المرتبطة`);
            
            // جلب المشروع المنشأ مع البيانات الكاملة
            return await this.getProjectById(newId);
            
        } catch (error) {
            console.error('❌ خطأ في createProject:', error.message);
            
            if (error.message.includes('Login failed for user')) {
                throw new Error('فشل الاتصال بقاعدة البيانات. تأكد من: 1) تشغيل SQL Server 2) تفعيل مصادقة ويندوز');
            }
            
            throw new Error(`فشل في إنشاء المشروع: ${error.message}`);
        }
    }

    /**
     * تحديث مشروع مع الصور والميزات - مصححة بالكامل
     */
    async updateProject(id, updateData) {
        const transaction = async () => {
            try {
                console.log(`✏️ تحديث مشروع رقم ${id}...`);
                
                // التحقق من وجود المشروع أولاً
                const existingProject = await this.getProjectById(id);
                if (!existingProject) {
                    throw new Error('المشروع غير موجود');
                }
                
                // بناء جملة UPDATE ديناميكياً
                const updateFields = [];
                
                // إضافة الحقول للتحديث
                const fieldMappings = {
                    projectName: 'projectName',
                    projectCode: 'projectCode',
                    projectType: 'projectType',
                    description: 'description',
                    location: 'location',
                    city: 'city',
                    district: 'district',
                    locationLink: 'locationLink',
                    totalUnits: 'totalUnits',
                    availableUnits: 'availableUnits',
                    price: 'price',
                    priceType: 'priceType',
                    area: 'area',
                    areaUnit: 'areaUnit',
                    bedrooms: 'bedrooms',
                    bathrooms: 'bathrooms',
                    isFeatured: 'isFeatured',
                    status: 'status',
                    completionDate: 'completionDate'
                };
                
                for (const [field, dbField] of Object.entries(fieldMappings)) {
                    if (updateData[field] !== undefined) {
                        if (field === 'isFeatured') {
                            const value = updateData[field] === true || 
                                        updateData[field] === 'true' || 
                                        updateData[field] === 1 ? 1 : 0;
                            updateFields.push(`${dbField} = ${value}`);
                        } else if (field === 'totalUnits' || field === 'availableUnits') {
                            const value = parseInt(updateData[field]);
                            updateFields.push(`${dbField} = ${value}`);
                        } else if (field === 'price' || field === 'area') {
                            const value = parseFloat(updateData[field]);
                            updateFields.push(`${dbField} = ${value}`);
                        } else if (field === 'bedrooms' || field === 'bathrooms') {
                            const value = updateData[field] ? parseInt(updateData[field]) : 'NULL';
                            updateFields.push(`${dbField} = ${value}`);
                        } else if (field === 'completionDate') {
                            const value = updateData[field] ? 
                                `'${new Date(updateData[field]).toISOString().split('T')[0]}'` : 'NULL';
                            updateFields.push(`${dbField} = ${value}`);
                        } else {
                            const value = this.escapeSql(updateData[field].toString());
                            updateFields.push(`${dbField} = N'${value}'`);
                        }
                    }
                }
                
                if (updateFields.length === 0) {
                    throw new Error('لا توجد بيانات للتحديث');
                }
                
                // التحقق من الوحدات إذا تم تحديثها
                if (updateData.availableUnits !== undefined && updateData.totalUnits !== undefined) {
                    if (parseInt(updateData.availableUnits) > parseInt(updateData.totalUnits)) {
                        throw new Error('الوحدات المتاحة لا يمكن أن تكون أكثر من إجمالي الوحدات');
                    }
                }
                
                updateFields.push('updatedAt = GETDATE()');
                
                const query = `
                    UPDATE Projects 
                    SET ${updateFields.join(', ')}
                    WHERE id = ${parseInt(id)}
                `;
                
                console.log('🔧 استعلام التحديث:', query);
                await this.executeAsync(query);
                console.log(`✅ تم تحديث البيانات الأساسية للمشروع رقم ${id}`);
                
                // 🟢 تحديث الميزات (حذف القديم وإضافة الجديد)
                if (updateData.features !== undefined) {
                    console.log(`🔄 تحديث ميزات المشروع ${id}...`);
                    
                    // حذف الميزات القديمة
                    const deleteFeaturesQuery = `DELETE FROM ProjectFeatures WHERE projectId = ${parseInt(id)}`;
                    await this.executeAsync(deleteFeaturesQuery);
                    console.log(`🗑️ تم حذف الميزات القديمة للمشروع ${id}`);
                    
                    // إضافة الميزات الجديدة
                    if (Array.isArray(updateData.features) && updateData.features.length > 0) {
                        for (let i = 0; i < updateData.features.length; i++) {
                            const feature = updateData.features[i];
                            const featureName = feature.name || feature.featureName;
                            const featureValue = feature.value || feature.featureValue;
                            
                            if (featureName && featureValue) {
                                const featureQuery = `
                                    INSERT INTO ProjectFeatures (projectId, featureName, featureValue, icon, displayOrder)
                                    VALUES (
                                        ${parseInt(id)},
                                        N'${this.escapeSql(featureName)}',
                                        N'${this.escapeSql(featureValue)}',
                                        N'${this.escapeSql(feature.icon || '')}',
                                        ${feature.displayOrder || i + 1}
                                    )
                                `;
                                await this.executeAsync(featureQuery);
                            }
                        }
                        console.log(`✅ تمت إضافة ${updateData.features.length} ميزة جديدة للمشروع ${id}`);
                    }
                }
                
                // 🟢 تحديث الصور (حذف القديم وإضافة الجديد) - ✅ إصلاح: إزالة isMain من الاستعلام
                if (updateData.images !== undefined) {
                    console.log(`🔄 تحديث صور المشروع ${id}...`);
                    
                    // حذف الصور القديمة
                    const deleteImagesQuery = `DELETE FROM ProjectImages WHERE projectId = ${parseInt(id)}`;
                    await this.executeAsync(deleteImagesQuery);
                    console.log(`🗑️ تم حذف الصور القديمة للمشروع ${id}`);
                    
                    // إضافة الصور الجديدة
                    if (Array.isArray(updateData.images) && updateData.images.length > 0) {
                        for (let i = 0; i < updateData.images.length; i++) {
                            const image = updateData.images[i];
                            
                            // ✅ تحويل isMain إلى imageType
                            let imageType = image.imageType || 'صورة_عامة';
                            if (image.isMain === true || image.isMain === 'true' || image.isMain === 1) {
                                imageType = 'صورة_رئيسية';
                            }
                            
                            const isActive = image.isActive !== undefined ? (image.isActive ? 1 : 0) : 1;
                            
                            const imageQuery = `
                                INSERT INTO ProjectImages (projectId, imageUrl, imageType, displayOrder, isActive, uploadedAt)
                                VALUES (
                                    ${parseInt(id)},
                                    N'${this.escapeSql(image.imageUrl || `/uploads/projects/project-${id}-${i + 1}.jpg`)}',
                                    N'${this.escapeSql(imageType)}',
                                    ${image.displayOrder || (i + 1)},
                                    ${isActive},
                                    GETDATE()
                                )
                            `;
                            await this.executeAsync(imageQuery);
                        }
                        console.log(`✅ تمت إضافة ${updateData.images.length} صورة جديدة للمشروع ${id}`);
                    }
                }
                
                console.log(`🎉 تم تحديث المشروع ${id} بنجاح مع جميع البيانات المرتبطة`);
                
                // جلب المشروع المحدث مع البيانات الكاملة
                return await this.getProjectById(id);
                
            } catch (error) {
                console.error('❌ خطأ في updateProject:', error.message);
                throw error;
            }
        };
        
        return transaction();
    }

    /**
     * حذف مشروع مع جميع البيانات المرتبطة - ✅ تم إعادة الترتيب لحل مشكلة القيود المرجعية
     */
    async deleteProject(id) {
        try {
            console.log(`🗑️ حذف مشروع رقم ${id} مع جميع البيانات المرتبطة...`);
            
            // التحقق من وجود المشروع أولاً
            const existingProject = await this.getProjectById(id);
            if (!existingProject) {
                throw new Error('المشروع غير موجود');
            }
            
            // الترتيب الصحيح للحذف لتفادي تعارض القيود المرجعية:
            // 1. حذف المدفوعات (Payments) المرتبطة بجداول الدفعات
            // 2. حذف جداول الدفعات (PaymentSchedules) المرتبطة بالعقود
            // 3. حذف العقود (Contracts) المرتبطة بالمشروع والعملاء المحتملين
            // 4. حذف العملاء المحتملين (Leads) المرتبطة بالمشروع والاستفسارات
            // 5. حذف الاستفسارات (Inquiries) المرتبطة بالمشروع
            // 6. حذف الميزات (ProjectFeatures) والصور (ProjectImages) المرتبطة بالمشروع
            // 7. حذف المشروع (Projects) نفسه
            
            // 1. حذف المدفوعات (Payments) المرتبطة بجداول الدفعات للعقود المرتبطة بالمشروع
            const deletePaymentsQuery = `
                DELETE FROM Payments 
                WHERE paymentScheduleId IN (
                    SELECT id FROM PaymentSchedules 
                    WHERE contractId IN (
                        SELECT id FROM Contracts WHERE projectId = ${parseInt(id)}
                    )
                )
            `;
            await this.executeAsync(deletePaymentsQuery);
            console.log(`🗑️ تم حذف المدفوعات المرتبطة بالمشروع ${id}`);
            
            // 2. حذف جداول الدفعات (PaymentSchedules) المرتبطة بالعقود
            const deleteSchedulesQuery = `
                DELETE FROM PaymentSchedules 
                WHERE contractId IN (
                    SELECT id FROM Contracts WHERE projectId = ${parseInt(id)}
                )
            `;
            await this.executeAsync(deleteSchedulesQuery);
            console.log(`🗑️ تم حذف جداول الدفعات المرتبطة بالمشروع ${id}`);
            
            // 3. حذف العقود (Contracts) المرتبطة بالمشروع
            const deleteContractsQuery = `DELETE FROM Contracts WHERE projectId = ${parseInt(id)}`;
            await this.executeAsync(deleteContractsQuery);
            console.log(`🗑️ تم حذف العقود المرتبطة بالمشروع ${id}`);
            
            // 4. حذف العملاء المحتملين (Leads) المرتبطة بالمشروع
            const deleteLeadsQuery = `DELETE FROM Leads WHERE projectId = ${parseInt(id)}`;
            await this.executeAsync(deleteLeadsQuery);
            console.log(`🗑️ تم حذف العملاء المحتملين المرتبطة بالمشروع ${id}`);
            
            // 5. حذف الاستفسارات (Inquiries) المرتبطة بالمشروع
            const deleteInquiriesQuery = `DELETE FROM Inquiries WHERE projectId = ${parseInt(id)}`;
            await this.executeAsync(deleteInquiriesQuery);
            console.log(`🗑️ تم حذف الاستفسارات المرتبطة بالمشروع ${id}`);
            
            // 6. حذف الميزات (ProjectFeatures) المرتبطة بالمشروع
            const deleteFeaturesQuery = `DELETE FROM ProjectFeatures WHERE projectId = ${parseInt(id)}`;
            await this.executeAsync(deleteFeaturesQuery);
            console.log(`🗑️ تم حذف ميزات المشروع ${id}`);
            
            // 7. حذف الصور (ProjectImages) المرتبطة بالمشروع
            const deleteImagesQuery = `DELETE FROM ProjectImages WHERE projectId = ${parseInt(id)}`;
            await this.executeAsync(deleteImagesQuery);
            console.log(`🗑️ تم حذف صور المشروع ${id}`);
            
            // 8. أخيراً حذف المشروع نفسه
            const deleteProjectQuery = `DELETE FROM Projects WHERE id = ${parseInt(id)}`;
            await this.executeAsync(deleteProjectQuery);
            console.log(`✅ تم حذف المشروع رقم ${id} بنجاح مع جميع البيانات المرتبطة`);
            
            return true;
            
        } catch (error) {
            console.error('❌ خطأ في deleteProject:', error.message);
            throw new Error(`فشل حذف المشروع: ${error.message}`);
        }
    }

    /**
     * البحث في المشاريع
     */
    async searchProjects(query, limit = 10) {
        try {
            console.log(`🔍 البحث عن: "${query}" في قاعدة البيانات...`);
            
            const searchQuery = `
                SELECT TOP ${limit} *
                FROM Projects
                WHERE projectName LIKE N'%${this.escapeSql(query)}%' 
                   OR projectCode LIKE N'%${this.escapeSql(query)}%'
                   OR location LIKE N'%${this.escapeSql(query)}%'
                   OR city LIKE N'%${this.escapeSql(query)}%'
                ORDER BY createdAt DESC
            `;
            
            const projects = await this.queryAsync(searchQuery);
            
            // جلب الصور والميزات لكل مشروع
            const enrichedProjects = await Promise.all(
                projects.map(async (project) => {
                    const [features, images] = await Promise.all([
                        this.getProjectFeatures(project.id),
                        this.getProjectImages(project.id)
                    ]);
                    
                    return {
                        ...project,
                        features: features || [],
                        images: images || []
                    };
                })
            );
            
            return enrichedProjects;
            
        } catch (error) {
            console.error('❌ خطأ في searchProjects:', error.message);
            return [];
        }
    }

    /**
     * إضافة صورة للمشروع - ✅ إصلاح: إزالة isMain من الاستعلام
     */
    async addProjectImage(imageData) {
        try {
            console.log(`📤 إضافة صورة لمشروع ${imageData.projectId}...`);
            
            // ✅ تحويل isMain إلى imageType
            let imageType = imageData.imageType || 'صورة_عامة';
            if (imageData.isMain === true || imageData.isMain === 'true' || imageData.isMain === 1) {
                imageType = 'صورة_رئيسية';
            }
            
            const isActive = imageData.isActive !== undefined ? (imageData.isActive ? 1 : 0) : 1;
            
            const query = `
                INSERT INTO ProjectImages (projectId, imageUrl, imageType, displayOrder, isActive, uploadedAt)
                VALUES (
                    ${parseInt(imageData.projectId)},
                    N'${this.escapeSql(imageData.imageUrl || '/uploads/default.jpg')}',
                    N'${this.escapeSql(imageType)}',
                    ${imageData.displayOrder || 1},
                    ${isActive},
                    GETDATE()
                )
            `;
            
            await this.executeAsync(query);
            
            console.log(`✅ تمت إضافة صورة للمشروع ${imageData.projectId}`);
            return { success: true, message: 'تمت إضافة الصورة' };
        } catch (error) {
            console.error('❌ خطأ في addProjectImage:', error.message);
            throw error;
        }
    }

    /**
     * تصدير المشاريع
     */
    async exportProjects(format = 'csv') {
        try {
            console.log(`📊 تصدير المشاريع بصيغة ${format}...`);
            
            const query = `
                SELECT 
                    id,
                    projectCode,
                    projectName,
                    projectType,
                    location,
                    city,
                    district,
                    locationLink,
                    price,
                    priceType,
                    area,
                    areaUnit,
                    totalUnits,
                    availableUnits,
                    bedrooms,
                    bathrooms,
                    isFeatured,
                    status,
                    completionDate,
                    createdAt,
                    updatedAt
                FROM Projects
                ORDER BY createdAt DESC
            `;
            
            const projects = await this.queryAsync(query);
            
            return projects;
        } catch (error) {
            console.error('❌ خطأ في exportProjects:', error.message);
            return [];
        }
    }

    /**
     * دالة اختبار الاتصال
     */
    async testConnection() {
        try {
            console.log('🔌 اختبار الاتصال بقاعدة البيانات...');
            
            const result = await this.queryAsync('SELECT TOP 1 projectName FROM Projects');
            
            console.log('✅ اختبار الاتصال بنجاح');
            return { 
                success: true, 
                message: 'الاتصال بقاعدة البيانات ناجح',
                data: result 
            };
        } catch (error) {
            console.error('❌ فشل اختبار الاتصال:', error.message);
            
            let errorMessage = 'فشل الاتصال بقاعدة البيانات';
            
            if (error.message.includes('Login failed for user')) {
                errorMessage = 'فشل تسجيل الدخول. تحقق من: 1) تشغيل SQL Server 2) تفعيل مصادقة ويندوز';
            } else if (error.message.includes('Cannot open database')) {
                errorMessage = 'قاعدة البيانات غير موجودة. تأكد من اسم قاعدة البيانات: abh';
            } else if (error.message.includes('network-related')) {
                errorMessage = 'مشكلة في الشبكة. تأكد أن SQL Server يعمل على المنفذ 1433';
            }
            
            return { 
                success: false, 
                message: errorMessage,
                error: error.message 
            };
        }
    }
}

module.exports = new ProjectsService();