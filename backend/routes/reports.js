const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireContentManager } = require('../middleware_auth');

function normalizeReportRow(row) {
    return {
        ...row,
        status_text: row.status === 'resolved' ? 'تم الحل' : row.status === 'in_progress' ? 'قيد التنفيذ' : 'جديد'
    };
}

router.get('/', requireAuth, requireContentManager, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT r.*, u.username, s.name AS section_name 
            FROM reports r 
            JOIN users u ON r.user_id = u.id 
            JOIN sections s ON r.section_id = s.id 
            ORDER BY r.id DESC
        `);
        res.json(rows.map(normalizeReportRow));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/mine', requireAuth, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT r.id, r.title, r.description, r.status, r.created_at, r.updated_at,
                   s.name AS section_name
            FROM reports r
            JOIN sections s ON r.section_id = s.id
            WHERE r.user_id = ?
            ORDER BY r.id DESC
        `, [req.user.id]);

        res.json(rows.map(normalizeReportRow));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', requireAuth, async (req, res) => {
    const { section_id, title, description } = req.body;

    if (!section_id || !title || !description) {
        return res.status(400).json({ success: false, message: 'جميع الحقول مطلوبة' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO reports (user_id, section_id, title, description, status) VALUES (?, ?, ?, ?, "new")',
            [req.user.id, section_id, title.trim(), description.trim()]
        );
        res.json({ success: true, id: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/:id/status', requireAuth, requireContentManager, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = new Set(['new', 'in_progress', 'resolved']);

    if (!allowed.has(status)) {
        return res.status(400).json({ success: false, message: 'حالة غير صحيحة' });
    }

    try {
        await db.query('UPDATE reports SET status = ? WHERE id = ?', [status, id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/:id', requireAuth, requireContentManager, async (req, res) => {
    try {
        await db.query('DELETE FROM reports WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
