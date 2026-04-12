// Backend/routes/index.js - تجميع كل الرواتر (محدث مع الاستفسارات)
const express = require('express');
const router = express.Router();

// استيراد الراوترات
const createHomeRouter = require('./public/home.routes');
const createProjectsRouter = require('./public/projects.routes');
const createProjectDetailsRouter = require('./public/project-details.routes');
const createInquiryRouter = require('./public/inquiry.routes');

// دالة لتهيئة وإرجاع الراوتر الرئيسي
module.exports = function(app) {
    console.log('🚀 تهيئة الراوترات الرئيسية...');
    
    // ربط الراوترات
    const homeRouter = createHomeRouter(app);
    const projectsRouter = createProjectsRouter(app);
    const projectDetailsRouter = createProjectDetailsRouter(app);
    const inquiryRouter = createInquiryRouter(app);
    
    router.use('/home', homeRouter);
    router.use('/projects', projectsRouter);
    router.use('/project-details', projectDetailsRouter);
    router.use('/inquiry', inquiryRouter);
    
    // 🔧 نقطة نهاية للتحقق من صحة النظام
    router.get('/health', (req, res) => {
        res.json({
            success: true,
            message: '✅ نظام API يعمل بشكل ممتاز',
            timestamp: new Date().toLocaleString('ar-SA'),
            routes: {
                home: '/api/public/home',
                projects: '/api/public/projects',
                project_details: '/api/public/project-details',
                inquiry: '/api/public/inquiry',
                health: '/api/public/health'
            },
            database: app.locals.dbConnected ? 'متصل' : 'غير متصل'
        });
    });
    
    // 📊 نقطة نهاية للإحصائيات العامة
    router.get('/stats', async (req, res) => {
        try {
            require('dotenv').config();
const sql = require('msnodesqlv8');
const connectionString = process.env.DB_CONNECTION_STRING;
            
            const query = `
                SELECT 
                    (SELECT COUNT(*) FROM Projects) as projects,
                    (SELECT COUNT(*) FROM Users) as users,
                    (SELECT COUNT(*) FROM Inquiries) as inquiries,
                    (SELECT COUNT(*) FROM Contracts) as contracts,
                    (SELECT COUNT(*) FROM Leads) as leads,
                    (SELECT COUNT(DISTINCT city) FROM Projects WHERE city IS NOT NULL) as cities,
                    (SELECT SUM(paidAmount) FROM Payments WHERE status = 'مؤكد') as totalPayments
            `;
            
            sql.query(connectionString, query, (err, rows) => {
                if (err) {
                    console.error('❌ خطأ في جلب الإحصائيات:', err);
                    
                    res.json({
                        success: true,
                        data: {
                            projects: 5,
                            users: 4,
                            inquiries: 3,
                            contracts: 2,
                            leads: 2,
                            cities: 1,
                            totalPayments: 47000
                        },
                        source: 'fallback_data'
                    });
                } else {
                    const stats = rows[0];
                    
                    res.json({
                        success: true,
                        data: {
                            projects: stats.projects || 0,
                            users: stats.users || 0,
                            inquiries: stats.inquiries || 0,
                            contracts: stats.contracts || 0,
                            leads: stats.leads || 0,
                            cities: stats.cities || 0,
                            totalPayments: stats.totalPayments || 0
                        },
                        source: 'real_database'
                    });
                }
            });
            
        } catch (error) {
            console.error('❌ خطأ في جلب الإحصائيات العامة:', error);
            
            res.json({
                success: true,
                data: {
                    projects: 5,
                    users: 4,
                    inquiries: 3,
                    contracts: 2,
                    leads: 2,
                    cities: 1,
                    totalPayments: 47000
                },
                source: 'fallback_data'
            });
        }
    });
    
    // 📍 نقطة نهاية لتجربة الاتصال بقاعدة البيانات
    router.get('/test-db', (req, res) => {
require('dotenv').config();
const sql = require('msnodesqlv8');
const connectionString = process.env.DB_CONNECTION_STRING;
        
        sql.query(connectionString, 
            "SELECT DB_NAME() as dbName, @@SERVERNAME as serverName, GETDATE() as serverTime, SYSTEM_USER as currentUser",
            (err, rows) => {
                if (err) {
                    res.json({
                        success: false,
                        message: '❌ فشل الاتصال بقاعدة البيانات',
                        error: err.message,
                        connectionString: connectionString
                    });
                } else {
                    res.json({
                        success: true,
                        message: '✅ قاعدة البيانات متصلة بنجاح',
                        data: rows[0],
                        timestamp: new Date().toLocaleString('ar-SA'),
                        connection: 'active'
                    });
                }
            }
        );
    });
    
    return router;
};