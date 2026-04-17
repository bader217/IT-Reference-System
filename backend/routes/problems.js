const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireContentManager } = require('../middleware_auth');

router.get('/', requireAuth, async (req, res) => {
    const { section_id } = req.query;

    try {
        let query = `
            SELECT p.*, s.name as section_name, u.username as created_by_name 
            FROM problems p 
            JOIN sections s ON p.section_id = s.id 
            JOIN users u ON p.created_by = u.id
        `;
        const params = [];

        if (section_id) {
            query += ' WHERE p.section_id = ?';
            params.push(section_id);
        }

        query += ' ORDER BY p.id DESC';

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', requireAuth, requireContentManager, async (req, res) => {
    const { section_id, created_by, title, problem_text, solution_text } = req.body;

    if (!section_id || !created_by || !title || !problem_text || !solution_text) {
        return res.status(400).json({ success: false, message: 'جميع الحقول مطلوبة' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO problems (section_id, created_by, title, problem_text, solution_text) VALUES (?, ?, ?, ?, ?)',
            [section_id, created_by, title.trim(), problem_text.trim(), solution_text.trim()]
        );
        res.json({ success: true, id: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/:id', requireAuth, requireContentManager, async (req, res) => {
    const { id } = req.params;
    const { section_id, title, problem_text, solution_text } = req.body;

    if (!section_id || !title || !problem_text || !solution_text) {
        return res.status(400).json({ success: false, message: 'جميع الحقول مطلوبة' });
    }

    try {
        await db.query(
            'UPDATE problems SET section_id = ?, title = ?, problem_text = ?, solution_text = ? WHERE id = ?',
            [section_id, title.trim(), problem_text.trim(), solution_text.trim(), id]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/:id', requireAuth, requireContentManager, async (req, res) => {
    try {
        await db.query('DELETE FROM problems WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;



function getStatusText(status){
  return status === 'resolved' ? 'تم الحل' : 'قيد المعالجة';
}
