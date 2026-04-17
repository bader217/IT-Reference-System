const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/sections', require('./routes/sections'));
app.use('/api/problems', require('./routes/problems'));
app.use('/api/reports', require('./routes/reports'));

app.get('/', (req, res) => {
    res.redirect('/login.html');
});

async function ensureReportsUpdatedAtColumn() {
    try {
        const [rows] = await db.query(`
            SELECT COUNT(*) AS count
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'reports'
              AND column_name = 'updated_at'
        `);

        if (rows[0].count === 0) {
            await db.query(
                'ALTER TABLE reports ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at'
            );
            console.log('Added reports.updated_at column');
        }
    } catch (error) {
        console.error('Schema check failed:', error.message);
    }
}

ensureReportsUpdatedAtColumn().finally(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
