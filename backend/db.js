const mysql = require('mysql2');

const connection = mysql.createPool({
  uri: process.env.MYSQL_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

connection.getConnection((err, conn) => {
  if (err) {
    console.error('DB Error:', err);
  } else {
    console.log('MySQL Connected');
    conn.release();
  }
});

module.exports = connection;

function getStatusText(status){
  return status === 'resolved' ? 'تم الحل' : 'قيد المعالجة';
}