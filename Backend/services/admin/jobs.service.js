const sql = require('mssql');

require('dotenv').config();

// الحصول على pool من app.locals (تم تعيينه في server.js)
function getPool() {
    const app = require('/app');
    if (!app.locals.dbPool) {
        throw new Error('قاعدة البيانات غير متصلة');
    }
    return app.locals.dbPool;
}

class JobsService {
    
    async queryAsync(query, params = {}) {
        const pool = getPool();
        try {
            const result = await pool.request().query(query);
            return result.recordset || [];
        } catch (err) {
            console.error('❌ SQL Error:', err);
            throw err;
        }
    }

    async executeAsync(query) {
        const pool = getPool();
        try {
            const result = await pool.request().query(query);
            return result;
        } catch (err) {
            console.error('❌ SQL Execute Error:', err);
            throw err;
        }
    }

    escapeSql(str) {
        if (!str) return '';
        return str.replace(/'/g, "''");
    }

    // ---------- دوال طلبات التوظيف (Applications) ----------
    buildDateFilter(dateFilters) {
        if (!dateFilters || dateFilters.length === 0) return '';

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const conditions = [];

        if (dateFilters.includes('اليوم')) {
            conditions.push(`CAST(created_at AS DATE) = CAST(GETDATE() AS DATE)`);
        }
        if (dateFilters.includes('أخر 7 أيام')) {
            conditions.push(`created_at >= '${sevenDaysAgo.toISOString().split('T')[0]}' AND created_at < DATEADD(day, 1, '${today.toISOString().split('T')[0]}')`);
        }
        if (dateFilters.includes('أخر 30 يوم')) {
            conditions.push(`created_at >= '${thirtyDaysAgo.toISOString().split('T')[0]}' AND created_at < '${sevenDaysAgo.toISOString().split('T')[0]}'`);
        }
        if (dateFilters.includes('أقدم من 30 يوم')) {
            conditions.push(`created_at < '${thirtyDaysAgo.toISOString().split('T')[0]}'`);
        }

        if (conditions.length === 0) return '';
        return `(${conditions.join(' OR ')})`;
    }

    async getAllApplications(page = 1, limit = 25, sort = 'newest', filters = {}) {
        try {
            let whereClauses = [];

            if (filters.search && filters.search.trim() !== '') {
                whereClauses.push(`(
                    first_name LIKE N'%${this.escapeSql(filters.search)}%' OR 
                    last_name LIKE N'%${this.escapeSql(filters.search)}%' OR 
                    email LIKE N'%${this.escapeSql(filters.search)}%' OR 
                    phone LIKE N'%${this.escapeSql(filters.search)}%' OR
                    expertise LIKE N'%${this.escapeSql(filters.search)}%' OR
                    current_position LIKE N'%${this.escapeSql(filters.search)}%'
                )`);
            }

            if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
                const statusList = filters.status.map(s => `N'${this.escapeSql(s)}'`).join(', ');
                whereClauses.push(`status IN (${statusList})`);
            }
            if (filters.department && Array.isArray(filters.department) && filters.department.length > 0) {
                const deptList = filters.department.map(d => `N'${this.escapeSql(d)}'`).join(', ');
                whereClauses.push(`expertise IN (${deptList})`);
            }
            if (filters.job_type && Array.isArray(filters.job_type) && filters.job_type.length > 0) {
                const jobTypeList = filters.job_type.map(j => `N'${this.escapeSql(j)}'`).join(', ');
                whereClauses.push(`job_type IN (${jobTypeList})`);
            }
            if (filters.experience && Array.isArray(filters.experience) && filters.experience.length > 0) {
                const expList = filters.experience.map(e => `N'${this.escapeSql(e)}'`).join(', ');
                whereClauses.push(`experience_years IN (${expList})`);
            }
            if (filters.education && Array.isArray(filters.education) && filters.education.length > 0) {
                const eduList = filters.education.map(e => `N'${this.escapeSql(e)}'`).join(', ');
                whereClauses.push(`education IN (${eduList})`);
            }
            if (filters.nationality && Array.isArray(filters.nationality) && filters.nationality.length > 0) {
                const natList = filters.nationality.map(n => `N'${this.escapeSql(n)}'`).join(', ');
                whereClauses.push(`nationality IN (${natList})`);
            }
            if (filters.city && Array.isArray(filters.city) && filters.city.length > 0) {
                const cityList = filters.city.map(c => `N'${this.escapeSql(c)}'`).join(', ');
                whereClauses.push(`city IN (${cityList})`);
            }
            if (filters.gender && Array.isArray(filters.gender) && filters.gender.length > 0) {
                const genderList = filters.gender.map(g => `N'${this.escapeSql(g)}'`).join(', ');
                whereClauses.push(`gender IN (${genderList})`);
            }
            if (filters.residence && Array.isArray(filters.residence) && filters.residence.length > 0) {
                const resList = filters.residence.map(r => `N'${this.escapeSql(r)}'`).join(', ');
                whereClauses.push(`current_residence IN (${resList})`);
            }
            if (filters.region && Array.isArray(filters.region) && filters.region.length > 0) {
                const regionList = filters.region.map(r => `N'${this.escapeSql(r)}'`).join(', ');
                whereClauses.push(`region IN (${regionList})`);
            }
            if (filters.marital && Array.isArray(filters.marital) && filters.marital.length > 0) {
                const marList = filters.marital.map(m => `N'${this.escapeSql(m)}'`).join(', ');
                whereClauses.push(`marital_status IN (${marList})`);
            }
            if (filters.disability && Array.isArray(filters.disability) && filters.disability.length > 0) {
                const disList = filters.disability.map(d => `N'${this.escapeSql(d)}'`).join(', ');
                whereClauses.push(`disability IN (${disList})`);
            }
            if (filters.employment_status && Array.isArray(filters.employment_status) && filters.employment_status.length > 0) {
                const empList = filters.employment_status.map(e => `N'${this.escapeSql(e)}'`).join(', ');
                whereClauses.push(`employment_status IN (${empList})`);
            }
            if (filters.transferable && Array.isArray(filters.transferable) && filters.transferable.length > 0) {
                const transList = filters.transferable.map(t => `N'${this.escapeSql(t)}'`).join(', ');
                whereClauses.push(`transferable_residence IN (${transList})`);
            }
            if (filters.notice_period && Array.isArray(filters.notice_period) && filters.notice_period.length > 0) {
                const noticeList = filters.notice_period.map(n => `N'${this.escapeSql(n)}'`).join(', ');
                whereClauses.push(`notice_period IN (${noticeList})`);
            }
            if (filters.previous_contact && Array.isArray(filters.previous_contact) && filters.previous_contact.length > 0) {
                const prevList = filters.previous_contact.map(p => `N'${this.escapeSql(p)}'`).join(', ');
                whereClauses.push(`previous_contact IN (${prevList})`);
            }
            if (filters.date && Array.isArray(filters.date) && filters.date.length > 0) {
                const dateFilter = this.buildDateFilter(filters.date);
                if (dateFilter) whereClauses.push(dateFilter);
            }

            const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

            let orderBy = 'ORDER BY ';
            switch(sort) {
                case 'oldest': orderBy += 'created_at ASC'; break;
                case 'name': orderBy += 'first_name ASC, last_name ASC'; break;
                case 'experience-high': orderBy += 'experience_years DESC'; break;
                case 'experience-low': orderBy += 'experience_years ASC'; break;
                case 'salary-high': orderBy += 'expected_salary DESC'; break;
                case 'salary-low': orderBy += 'expected_salary ASC'; break;
                default: orderBy += 'created_at DESC';
            }

            const offset = (page - 1) * limit;

            const query = `
                SELECT * FROM job_applications
                ${whereClause}
                ${orderBy}
                OFFSET ${offset} ROWS
                FETCH NEXT ${limit} ROWS ONLY
            `;

            const countQuery = `
                SELECT COUNT(*) as total 
                FROM job_applications
                ${whereClause}
            `;

            const [applications, countResult] = await Promise.all([
                this.queryAsync(query),
                this.queryAsync(countQuery)
            ]);

            const totalItems = countResult[0]?.total || 0;
            const totalPages = Math.ceil(totalItems / limit);

            return {
                applications,
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
            console.error('❌ JobsService.getAllApplications:', error);
            throw error;
        }
    }

    async getApplicationById(id) {
        try {
            const query = `SELECT * FROM job_applications WHERE id = ${parseInt(id)}`;
            const result = await this.queryAsync(query);
            return result && result.length > 0 ? result[0] : null;
        } catch (error) {
            console.error('❌ JobsService.getApplicationById:', error);
            throw error;
        }
    }

    async createApplication(data) {
        try {
            const columns = [];
            const values = [];

            for (const [key, value] of Object.entries(data)) {
                if (value !== undefined && value !== null) {
                    columns.push(key);
                    if (typeof value === 'string') {
                        values.push(`N'${this.escapeSql(value)}'`);
                    } else if (value instanceof Date) {
                        values.push(`'${value.toISOString().split('T')[0]}'`);
                    } else {
                        values.push(value);
                    }
                }
            }

            if (!columns.includes('created_at')) {
                columns.push('created_at');
                values.push('GETDATE()');
            }
            if (!columns.includes('updated_at')) {
                columns.push('updated_at');
                values.push('GETDATE()');
            }

            const query = `
                INSERT INTO job_applications (${columns.join(', ')})
                OUTPUT INSERTED.id
                VALUES (${values.join(', ')})
            `;

            const result = await this.queryAsync(query);
            const newId = result[0]?.id;
            return await this.getApplicationById(newId);
        } catch (error) {
            console.error('❌ JobsService.createApplication:', error);
            throw error;
        }
    }

    async updateApplication(id, data) {
        try {
            const existing = await this.getApplicationById(id);
            if (!existing) throw new Error('Application not found');

            const updateFields = [];
            for (const [key, value] of Object.entries(data)) {
                if (value !== undefined && value !== null) {
                    if (typeof value === 'string') {
                        updateFields.push(`${key} = N'${this.escapeSql(value)}'`);
                    } else if (value instanceof Date) {
                        updateFields.push(`${key} = '${value.toISOString().split('T')[0]}'`);
                    } else {
                        updateFields.push(`${key} = ${value}`);
                    }
                }
            }

            updateFields.push('updated_at = GETDATE()');

            const query = `
                UPDATE job_applications
                SET ${updateFields.join(', ')}
                WHERE id = ${parseInt(id)}
            `;

            await this.executeAsync(query);
            return await this.getApplicationById(id);
        } catch (error) {
            console.error('❌ JobsService.updateApplication:', error);
            throw error;
        }
    }

    async deleteApplication(id) {
        try {
            const query = `DELETE FROM job_applications WHERE id = ${parseInt(id)}`;
            await this.executeAsync(query);
            return true;
        } catch (error) {
            console.error('❌ JobsService.deleteApplication:', error);
            throw error;
        }
    }

    async getApplicationsStats() {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = N'جديد' THEN 1 ELSE 0 END) as new,
                    SUM(CASE WHEN status = N'قيد المراجعة' THEN 1 ELSE 0 END) as review,
                    SUM(CASE WHEN status = N'للمقابلة' THEN 1 ELSE 0 END) as interview,
                    SUM(CASE WHEN status = N'مقابلة مجدولة' THEN 1 ELSE 0 END) as scheduled,
                    SUM(CASE WHEN status = N'مقبولة' THEN 1 ELSE 0 END) as accepted,
                    SUM(CASE WHEN status = N'مرفوضة' THEN 1 ELSE 0 END) as rejected,
                    SUM(CASE WHEN status = N'مؤرشفة' THEN 1 ELSE 0 END) as archived
                FROM job_applications
            `;
            const result = await this.queryAsync(query);
            const stats = result[0] || {};

            const deptQuery = `
                SELECT expertise as department, COUNT(*) as count
                FROM job_applications
                WHERE expertise IS NOT NULL
                GROUP BY expertise
            `;
            const deptResult = await this.queryAsync(deptQuery);
            const departmentDistribution = {};
            deptResult.forEach(row => departmentDistribution[row.department] = row.count);

            return {
                total: parseInt(stats.total) || 0,
                new: parseInt(stats.new) || 0,
                review: parseInt(stats.review) || 0,
                interview: parseInt(stats.interview) || 0,
                scheduled: parseInt(stats.scheduled) || 0,
                accepted: parseInt(stats.accepted) || 0,
                rejected: parseInt(stats.rejected) || 0,
                archived: parseInt(stats.archived) || 0,
                departmentDistribution
            };
        } catch (error) {
            console.error('❌ JobsService.getApplicationsStats:', error);
            throw error;
        }
    }

    async exportApplications() {
        try {
            const query = `
                SELECT 
                    id,
                    first_name,
                    last_name,
                    email,
                    phone,
                    expertise,
                    current_position,
                    experience_years,
                    education,
                    expected_salary,
                    nationality,
                    city,
                    status,
                    created_at
                FROM job_applications
                ORDER BY created_at DESC
            `;
            return await this.queryAsync(query);
        } catch (error) {
            console.error('❌ JobsService.exportApplications:', error);
            return [];
        }
    }

    // ==================== دوال إدارة الوظائف (Jobs) ====================
    
    async getAllJobs() {
        try {
            const query = `
                SELECT * FROM jobs
                ORDER BY created_at DESC
            `;
            return await this.queryAsync(query);
        } catch (error) {
            console.error('❌ JobsService.getAllJobs:', error);
            throw error;
        }
    }

    async getJobById(id) {
        try {
            const query = `SELECT * FROM jobs WHERE id = ${parseInt(id)}`;
            const result = await this.queryAsync(query);
            return result && result.length > 0 ? result[0] : null;
        } catch (error) {
            console.error('❌ JobsService.getJobById:', error);
            throw error;
        }
    }

    async createJob(data) {
        try {
            const {
                title,
                department,
                location,
                job_type,
                badge = null,
                company_sector = null,
                experience_years = null,
                description,
                tags = null,
                is_active = 1
            } = data;

            if (!title || !department || !location || !job_type || !description) {
                throw new Error('Missing required fields for job creation');
            }

            const query = `
                INSERT INTO jobs (title, department, location, job_type, badge, company_sector, experience_years, description, tags, is_active, created_at, updated_at)
                OUTPUT INSERTED.id
                VALUES (
                    N'${this.escapeSql(title)}',
                    N'${this.escapeSql(department)}',
                    N'${this.escapeSql(location)}',
                    N'${this.escapeSql(job_type)}',
                    ${badge ? `N'${this.escapeSql(badge)}'` : 'NULL'},
                    ${company_sector ? `N'${this.escapeSql(company_sector)}'` : 'NULL'},
                    ${experience_years ? `N'${this.escapeSql(experience_years)}'` : 'NULL'},
                    N'${this.escapeSql(description)}',
                    ${tags ? `N'${this.escapeSql(tags)}'` : 'NULL'},
                    ${is_active},
                    GETDATE(),
                    GETDATE()
                )
            `;

            const result = await this.queryAsync(query);
            const newId = result[0]?.id;
            return await this.getJobById(newId);
        } catch (error) {
            console.error('❌ JobsService.createJob:', error);
            throw error;
        }
    }

    async updateJob(id, data) {
        try {
            const existing = await this.getJobById(id);
            if (!existing) throw new Error('Job not found');

            const updateFields = [];
            const allowedFields = ['title', 'department', 'location', 'job_type', 'badge', 'company_sector', 'experience_years', 'description', 'tags', 'is_active'];

            for (const field of allowedFields) {
                if (data[field] !== undefined && data[field] !== null) {
                    if (typeof data[field] === 'string') {
                        updateFields.push(`${field} = N'${this.escapeSql(data[field])}'`);
                    } else if (typeof data[field] === 'boolean' || typeof data[field] === 'number') {
                        updateFields.push(`${field} = ${data[field]}`);
                    } else {
                        updateFields.push(`${field} = N'${this.escapeSql(String(data[field]))}'`);
                    }
                }
            }

            updateFields.push('updated_at = GETDATE()');

            const query = `
                UPDATE jobs
                SET ${updateFields.join(', ')}
                WHERE id = ${parseInt(id)}
            `;

            await this.executeAsync(query);
            return await this.getJobById(id);
        } catch (error) {
            console.error('❌ JobsService.updateJob:', error);
            throw error;
        }
    }

    async deleteJob(id) {
        try {
            const query = `DELETE FROM jobs WHERE id = ${parseInt(id)}`;
            await this.executeAsync(query);
            return true;
        } catch (error) {
            console.error('❌ JobsService.deleteJob:', error);
            throw error;
        }
    }

    async getJobsStats() {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
                    SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive
                FROM jobs
            `;
            const result = await this.queryAsync(query);
            const stats = result[0] || {};

            const deptQuery = `
                SELECT department, COUNT(*) as count
                FROM jobs
                WHERE department IS NOT NULL
                GROUP BY department
            `;
            const deptResult = await this.queryAsync(deptQuery);
            const departmentDistribution = {};
            deptResult.forEach(row => departmentDistribution[row.department] = row.count);

            return {
                total: parseInt(stats.total) || 0,
                active: parseInt(stats.active) || 0,
                inactive: parseInt(stats.inactive) || 0,
                departmentDistribution
            };
        } catch (error) {
            console.error('❌ JobsService.getJobsStats:', error);
            throw error;
        }
    }
}

module.exports = new JobsService();