// Backend/server.js - Production Ready with mssql (tedious)
require('dotenv').config();

const app = require('./app');
const sql = require('mssql');

const PORT = process.env.PORT || 3001;

// ==================== إعدادات قاعدة البيانات ====================
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 1433,
    options: {
        encrypt: false,          // للتشغيل المحلي بدون SSL
        trustServerCertificate: true,  // يسمح بشهادات ذاتية التوقيع
        enableArithAbort: true,
        connectTimeout: 30000,
        requestTimeout: 30000
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// ==================== START LOGS ====================
console.log('\n' + '🚀'.repeat(10));
console.log('بدء تشغيل نظام إدارة العقارات');
console.log('='.repeat(50));
console.log('📅 التاريخ:', new Date().toLocaleString('ar-SA'));
console.log('💻 المنفذ:', PORT);

// ==================== الاتصال بقاعدة البيانات ====================
let pool = null;

async function connectToDatabase() {
    try {
        pool = await sql.connect(dbConfig);
        global.dbPool = pool;   // <-- أضف هذا السطر
        console.log('✅ قاعدة البيانات متصلة بنجاح!');
        app.locals.dbConnected = true;
        app.locals.dbPool = pool;

        // جلب إحصائيات سريعة
        try {
            const result = await pool.request().query(`
                SELECT 
                    (SELECT COUNT(*) FROM Projects) as projects,
                    (SELECT COUNT(*) FROM Users) as users
            `);
            console.log(`📊 الإحصائيات: ${result.recordset[0].projects} مشروع, ${result.recordset[0].users} مستخدم`);
        } catch (err) {
            console.log('⚠️ لا يمكن قراءة الإحصائيات:', err.message);
        }

        return true;
    } catch (err) {
        console.error('❌ فشل الاتصال بقاعدة البيانات:', err.message);
        app.locals.dbConnected = false;
        app.locals.dbPool = null;
        return false;
    }
}

// ==================== بدء الخادم ====================
async function startServer() {
    // محاولة الاتصال بقاعدة البيانات (لا تمنع تشغيل الخادم في حالة الفشل)
    await connectToDatabase();

    const server = app.listen(PORT, () => {
        console.log('\n' + '🎉'.repeat(10));
        console.log('✅ نظام إدارة العقارات يعمل الآن!');
        console.log('='.repeat(50));
        console.log(`📍 الرابط: http://localhost:${PORT}`);
        console.log('📡 APIs متاحة:');
        console.log('   GET  /api/health');
        console.log('   GET  /api/public/home/stats');
        console.log('   GET  /api/public/home/featured-projects');
        console.log('\n⚡ جاهز لاستقبال الطلبات!');

        if (!app.locals.dbConnected) {
            console.log('\n⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️');
            console.log('⚠️ قاعدة البيانات غير متصلة');
            console.log('⚠️ النظام يعمل ببيانات افتراضية');
            console.log('⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️');
        }
    });

    // إغلاق نظيف
    process.on('SIGINT', async () => {
        console.log('\n👋 إيقاف الخادم...');
        if (pool) {
            await pool.close();
            console.log('✅ تم إغلاق اتصال قاعدة البيانات');
        }
        server.close(() => {
            console.log('✅ تم إغلاق الخادم بنجاح');
            process.exit(0);
        });
    });
}

startServer();