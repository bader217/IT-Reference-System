const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;

function getStatusText(status){
  return status === 'resolved' ? 'تم الحل' : 'قيد المعالجة';
}