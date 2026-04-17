const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require('../db');

function normalizeRole(role) {
    if (role === 'admin') return 'manager';
    return role;
}

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'اسم المستخدم وكلمة المرور مطلوبان' });
    }

    try {
        const [rows] = await db.query(
            'SELECT id, username, phone, role, password FROM users WHERE username = ? LIMIT 1',
            [username.trim()]
        );

        if (rows.length === 0) {
            return res.json({ success: false, message: 'بيانات الدخول غير صحيحة' });
        }

        const user = rows[0];
        const passwordMatches = await bcrypt.compare(password, user.password).catch(() => false);
        const legacyPlainMatches = user.password === password;

        if (!passwordMatches && !legacyPlainMatches) {
            return res.json({ success: false, message: 'بيانات الدخول غير صحيحة' });
        }

        user.role = normalizeRole(user.role);
        delete user.password;
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;


// status rendering fix
function getStatusText(status){
  return status === 'resolved' ? 'تم الحل' : 'قيد المعالجة';
}
