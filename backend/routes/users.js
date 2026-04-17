const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const { requireAuth, requireAdmin } = require('../middleware_auth');

const ALLOWED_ROLES = new Set(['intern', 'employee', 'manager', 'admin']);

router.get('/', requireAuth, requireAdmin, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, username, phone, role, created_at FROM users ORDER BY id DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
    const { username, password, phone, role } = req.body;

    if (!username || !password || !phone || !role) {
        return res.status(400).json({ success: false, message: 'جميع الحقول مطلوبة' });
    }

    if (!ALLOWED_ROLES.has(role)) {
        return res.status(400).json({ success: false, message: 'الدور غير صحيح' });
    }

    try {
        const hash = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO users (username, password, phone, role) VALUES (?, ?, ?, ?)',
            [username.trim(), hash, phone.trim(), role]
        );
        res.json({ success: true, id: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/:id', requireAuth, async (req, res) => {
    const targetId = Number(req.params.id);
    const { username, phone, password, role } = req.body;
    const isSelf = req.user.id === targetId;

    try {
        const [rows] = await db.query('SELECT id, username, phone, role FROM users WHERE id = ? LIMIT 1', [targetId]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        }

        const current = rows[0];

        if (!isSelf && !['manager', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'لا تملك صلاحية تعديل المستخدمين' });
        }

        if (isSelf) {
            if ((username && username.trim() !== current.username) || (role && role !== current.role)) {
                return res.status(403).json({ success: false, message: 'لا يمكنك تعديل اسم المستخدم أو الدور من هذه الصفحة' });
            }
        }

        const nextUsername = isSelf ? current.username : username.trim();
        const nextPhone = phone.trim();
        const nextRole = isSelf ? current.role : role;

        if (!nextUsername || !nextPhone || !nextRole) {
            return res.status(400).json({ success: false, message: 'البيانات المطلوبة غير مكتملة' });
        }

        if (!ALLOWED_ROLES.has(nextRole)) {
            return res.status(400).json({ success: false, message: 'الدور غير صحيح' });
        }

        const [duplicates] = await db.query(
            'SELECT id FROM users WHERE (username = ? OR phone = ?) AND id <> ? LIMIT 1',
            [nextUsername, nextPhone, targetId]
        );

        if (duplicates.length > 0) {
            return res.status(409).json({ success: false, message: 'اسم المستخدم أو رقم الجوال مستخدم بالفعل' });
        }

        const params = [nextUsername, nextPhone, nextRole, targetId];
        let sql = 'UPDATE users SET username = ?, phone = ?, role = ?';

        if (password && String(password).trim()) {
            const hash = await bcrypt.hash(password, 10);
            sql += ', password = ?';
            params.splice(3, 0, hash);
        }

        sql += ' WHERE id = ?';
        await db.query(sql, params);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
    const targetId = Number(req.params.id);

    if (req.user.id === targetId) {
        return res.status(400).json({ success: false, message: 'لا يمكن حذف حسابك الحالي' });
    }

    try {
        await db.query('DELETE FROM users WHERE id = ?', [targetId]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;


// status rendering fix
function getStatusText(status){
  return status === 'resolved' ? 'تم الحل' : 'قيد المعالجة';
}
