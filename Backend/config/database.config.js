// Backend/config/database.config.js - ملف إعدادات قاعدة البيانات
const sql = require('mssql');

const dbConfig = {
    server: 'DESKTOP-54ST25S\\ATTENDANCE',
    database: 'abh',
    options: {
        trustedConnection: true,
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true
    },
    driver: 'msnodesqlv8',
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    connectionTimeout: 30000,
    requestTimeout: 30000
};

// دالة الاتصال العامة
async function connectToDatabase() {
    try {
        const pool = await sql.connect(dbConfig);
        console.log('✅ تم الاتصال بنجاح بقاعدة البيانات:', dbConfig.database);
        return pool;
    } catch (error) {
        console.error('❌ فشل الاتصال بقاعدة البيانات:', error.message);
        throw error;
    }
}

// دالة الاستعلام العامة
async function executeQuery(query, params = []) {
    try {
        const pool = await connectToDatabase();
        const request = pool.request();
        
        // إضافة الباراميترات إذا وجدت
        params.forEach((param, index) => {
            request.input(`param${index}`, param.type || sql.VarChar, param.value);
        });
        
        const result = await request.query(query);
        await pool.close();
        
        return {
            success: true,
            data: result.recordset,
            rowsAffected: result.rowsAffected || 0
        };
    } catch (error) {
        console.error('❌ خطأ في تنفيذ الاستعلام:', error.message);
        return {
            success: false,
            error: error.message,
            errorCode: error.code
        };
    }
}

module.exports = {
    dbConfig,
    connectToDatabase,
    executeQuery,
    sql
};