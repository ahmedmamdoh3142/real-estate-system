// Backend/test-connection.js
require('dotenv').config();
const sql = require('mssql');

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    connectionTimeout: 30000,
    requestTimeout: 30000
};

async function testConnection() {
    console.log('🔍 اختبار اتصال قاعدة البيانات...');
    console.log('📁 السيرفر:', dbConfig.server);
    console.log('📁 قاعدة البيانات:', dbConfig.database);
    
    try {
        const pool = await sql.connect(dbConfig);
        console.log('✅ تم الاتصال بنجاح!');
        
        // اختبار استعلام بسيط
        const result = await pool.request()
            .query('SELECT DB_NAME() as dbName, @@SERVERNAME as serverName, GETDATE() as serverTime');
        
        console.log('📊 معلومات الاتصال:');
        console.log('   - قاعدة البيانات:', result.recordset[0].dbName);
        console.log('   - السيرفر:', result.recordset[0].serverName);
        console.log('   - الوقت:', result.recordset[0].serverTime);
        
        // اختبار جدول المشاريع
        try {
            const projectsResult = await pool.request()
                .query('SELECT COUNT(*) as count FROM Projects');
            console.log('🏢 عدد المشاريع:', projectsResult.recordset[0].count);
        } catch (e) {
            console.log('⚠️ تعذر الوصول إلى جدول المشاريع:', e.message);
        }
        
        // اختبار جدول المستخدمين
        try {
            const usersResult = await pool.request()
                .query('SELECT COUNT(*) as count FROM Users');
            console.log('👤 عدد المستخدمين:', usersResult.recordset[0].count);
        } catch (e) {
            console.log('⚠️ تعذر الوصول إلى جدول المستخدمين:', e.message);
        }
        
        await pool.close();
        console.log('🎉 جميع الاختبارات نجحت!');
        return true;
        
    } catch (error) {
        console.error('❌ فشل الاتصال:', error.message);
        console.log('\n🔍 تفاصيل الخطأ:');
        console.log('   - الرمز:', error.code || 'غير معروف');
        console.log('   - رقم الخطأ:', error.number || 'غير معروف');
        console.log('\n🛠️ استكشاف الأخطاء وإصلاحها:');
        console.log('   1. تأكد من تشغيل SQL Server');
        console.log('   2. تحقق من بيانات الاتصال في ملف .env');
        console.log('   3. تأكد من أن SQL Server يسمح بالاتصالات عن بعد');
        return false;
    }
}

// تشغيل الاختبار
testConnection().then(success => {
    if (success) {
        console.log('\n🎉 قاعدة البيانات جاهزة للاستخدام!');
        process.exit(0);
    } else {
        console.log('\n❌ تحتاج إلى إصلاح مشكلة الاتصال أولاً');
        process.exit(1);
    }
});