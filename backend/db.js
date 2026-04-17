const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'it_reference_system',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
});

module.exports = pool.promise();



function getStatusText(status){
  return status === 'resolved' ? 'تم الحل' : 'قيد المعالجة';
}
