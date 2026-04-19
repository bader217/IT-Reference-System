const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireContentManager } = require('../middleware_auth');

router.get('/', requireAuth, requireContentManager, async (req, res) => {
    const result = await db.query(`
        SELECT r.*, u.username, s.name as section_name
        FROM reports r
        JOIN users u ON r.user_id = u.id
        JOIN sections s ON r.section_id = s.id
        ORDER BY r.id DESC
    `);

    res.json(result.rows);
});

router.get('/mine', requireAuth, async (req, res) => {
    const result = await db.query(
        `SELECT r.*, s.name as section_name
         FROM reports r
         JOIN sections s ON r.section_id = s.id
         WHERE r.user_id = $1`,
        [req.user.id]
    );

    res.json(result.rows);
});

router.post('/', requireAuth, async (req, res) => {
    const { section_id, title, description } = req.body;

    const result = await db.query(
        `INSERT INTO reports (user_id, section_id, title, description, status)
         VALUES ($1,$2,$3,$4,'new') RETURNING id`,
        [req.user.id, section_id, title, description]
    );

    res.json({ success: true, id: result.rows[0].id });
});

router.put('/:id/status', requireAuth, requireContentManager, async (req, res) => {
    const { status } = req.body;

    await db.query(
        'UPDATE reports SET status=$1 WHERE id=$2',
        [status, req.params.id]
    );

    res.json({ success: true });
});

router.delete('/:id', requireAuth, requireContentManager, async (req, res) => {
    await db.query('DELETE FROM reports WHERE id=$1', [req.params.id]);
    res.json({ success: true });
});

module.exports = router;