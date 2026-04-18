const mysql = require('mysql2/promise');

const connection = mysql.createPool({
  uri: process.env.MYSQL_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function testConnection() {
  try {
    const conn = await connection.getConnection();
    console.log('MySQL Connected');
    conn.release();
  } catch (err) {
    console.error('DB Error:', err);
  }
}

testConnection();

module.exports = connection;

function getStatusText(status){
  return status === 'resolved' ? 'تم الحل' : 'قيد المعالجة';
}