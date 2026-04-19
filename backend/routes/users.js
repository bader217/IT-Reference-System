const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const { requireAuth, requireAdmin } = require('../middleware_auth');

router.get('/', requireAuth, requireAdmin, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, username, phone, role, created_at FROM users ORDER BY id DESC'
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
    const { username, password, phone, role } = req.body;

    if (!username || !password || !phone || !role) {
        return res.status(400).json({ success: false, message: 'جميع الحقول مطلوبة' });
    }

    if (!/^[0-9]{10}$/.test(phone)) {
        return res.status(400).json({ success: false, message: 'رقم الجوال يجب أن يكون 10 أرقام' });
    }

    try {
        const check = await db.query(
            'SELECT id FROM users WHERE username = $1 OR phone = $2 LIMIT 1',
            [username.trim(), phone]
        );

        if (check.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'اسم المستخدم أو رقم الجوال مستخدم مسبقاً'
            });
        }

        const hash = await bcrypt.hash(password, 10);

        const result = await db.query(
            'INSERT INTO users (username, password, phone, role) VALUES ($1,$2,$3,$4) RETURNING id',
            [username.trim(), hash, phone, role]
        );

        res.json({ success: true, id: result.rows[0].id });

    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({
                success: false,
                message: 'اسم المستخدم أو رقم الجوال مكرر'
            });
        }

        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/:id', requireAuth, async (req, res) => {
    const targetId = Number(req.params.id);
    const { username, phone, role, password } = req.body;

    if (!username || !phone || !role) {
        return res.status(400).json({ success: false, message: 'البيانات غير مكتملة' });
    }

    if (!/^[0-9]{10}$/.test(phone)) {
        return res.status(400).json({ success: false, message: 'رقم الجوال يجب أن يكون 10 أرقام' });
    }

    try {
        const check = await db.query(
            'SELECT id FROM users WHERE (username = $1 OR phone = $2) AND id <> $3 LIMIT 1',
            [username.trim(), phone, targetId]
        );

        if (check.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'اسم المستخدم أو رقم الجوال مستخدم مسبقاً'
            });
        }

        if (password && password.trim()) {
            const hash = await bcrypt.hash(password, 10);
            await db.query(
                'UPDATE users SET username=$1, phone=$2, role=$3, password=$4 WHERE id=$5',
                [username.trim(), phone, role, hash, targetId]
            );
        } else {
            await db.query(
                'UPDATE users SET username=$1, phone=$2, role=$3 WHERE id=$4',
                [username.trim(), phone, role, targetId]
            );
        }

        res.json({ success: true });

    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({
                success: false,
                message: 'اسم المستخدم أو رقم الجوال مكرر'
            });
        }

        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM users WHERE id=$1', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;