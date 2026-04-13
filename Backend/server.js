// Backend/server.js - Production Ready FIXED
const path = require('path');

// 🔥 تأكد إن .env بيتقري حتى لو جوه Backend أو root
require('dotenv').config({
    path: path.join(__dirname, '.env')
});

const app = require('./app');
const sql = require('mssql');

const PORT = process.env.PORT || 3001;

// ==================== DEBUG ENV ====================
console.log('\n🔍 ENV CHECK:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PORT:', process.env.DB_PORT);

// ❌ منع التشغيل لو البيانات ناقصة
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
    console.error('\n❌ خطأ: بيانات قاعدة البيانات ناقصة في .env');
    process.exit(1);
}

// ==================== إعدادات قاعدة البيانات ====================
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST, // 👈 أهم سطر
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true,
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
        console.log('\n🔌 محاولة الاتصال بقاعدة البيانات...');
        
        pool = await sql.connect(dbConfig);

        global.dbPool = pool;
        app.locals.dbConnected = true;
        app.locals.dbPool = pool;

        console.log('✅ قاعدة البيانات متصلة بنجاح!');

        // اختبار بسيط
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
        console.error('\n❌ فشل الاتصال بقاعدة البيانات:');
        console.error('➡️ السبب:', err.message);

        console.error('\n💡 تأكد من:');
        console.error('- DB_HOST صح');
        console.error('- SQL Server شغال');
        console.error('- اليوزر والباسورد صح');

        global.dbPool = null;
        app.locals.dbConnected = false;
        app.locals.dbPool = null;

        return false;
    }
}

// ==================== بدء الخادم ====================
async function startServer() {
    await connectToDatabase();

    const server = app.listen(PORT, () => {
        console.log('\n' + '🎉'.repeat(10));
        console.log('✅ نظام إدارة العقارات يعمل الآن!');
        console.log('='.repeat(50));
        console.log(`📍 الرابط: http://localhost:${PORT}`);
        console.log('📡 APIs:');
        console.log('   GET  /api/health');
        console.log('   GET  /api/public/home/stats');
        console.log('   GET  /api/public/home/featured-projects');

        if (!app.locals.dbConnected) {
            console.log('\n⚠️ ⚠️ ⚠️');
            console.log('⚠️ قاعدة البيانات غير متصلة');
            console.log('⚠️ شغال fallback mode');
            console.log('⚠️ ⚠️ ⚠️');
        }
    });

    process.on('SIGINT', async () => {
        console.log('\n👋 إيقاف الخادم...');
        if (pool) {
            await pool.close();
            console.log('✅ تم إغلاق DB');
        }
        server.close(() => {
            console.log('✅ تم إغلاق السيرفر');
            process.exit(0);
        });
    });
}

startServer();