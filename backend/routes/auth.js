const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await db.query(
            'SELECT * FROM users WHERE username = $1 LIMIT 1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.json({ success: false, message: 'بيانات خاطئة' });
        }

        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.json({ success: false, message: 'بيانات خاطئة' });
        }

        delete user.password;
        res.json({ success: true, user });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;