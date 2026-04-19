const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const { requireAuth, requireAdmin } = require('../middleware_auth');

router.get('/', requireAuth, requireAdmin, async (req, res) => {
    const result = await db.query('SELECT id, username, phone, role, created_at FROM users ORDER BY id DESC');
    res.json(result.rows);
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
    const { username, password, phone, role } = req.body;

    const hash = await bcrypt.hash(password, 10);

    const result = await db.query(
        'INSERT INTO users (username, password, phone, role) VALUES ($1,$2,$3,$4) RETURNING id',
        [username, hash, phone, role]
    );

    res.json({ success: true, id: result.rows[0].id });
});

router.put('/:id', requireAuth, async (req, res) => {
    const { username, phone, role, password } = req.body;

    if (password) {
        const hash = await bcrypt.hash(password, 10);
        await db.query(
            'UPDATE users SET username=$1, phone=$2, role=$3, password=$4 WHERE id=$5',
            [username, phone, role, hash, req.params.id]
        );
    } else {
        await db.query(
            'UPDATE users SET username=$1, phone=$2, role=$3 WHERE id=$4',
            [username, phone, role, req.params.id]
        );
    }

    res.json({ success: true });
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
    await db.query('DELETE FROM users WHERE id=$1', [req.params.id]);
    res.json({ success: true });
});

module.exports = router;