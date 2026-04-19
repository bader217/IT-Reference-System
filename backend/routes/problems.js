const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireContentManager } = require('../middleware_auth');

router.get('/', requireAuth, async (req, res) => {
    const { section_id } = req.query;

    let query = `
    SELECT p.*, s.name as section_name
    FROM problems p
    JOIN sections s ON p.section_id = s.id
    `;
    const params = [];

    if (section_id) {
        query += ' WHERE p.section_id = $1';
        params.push(section_id);
    }

    const result = await db.query(query, params);
    res.json(result.rows);
});

router.post('/', requireAuth, requireContentManager, async (req, res) => {
    const { section_id, created_by, title, problem_text, solution_text } = req.body;

    const result = await db.query(
        `INSERT INTO problems (section_id, created_by, title, problem_text, solution_text)
         VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [section_id, created_by, title, problem_text, solution_text]
    );

    res.json({ success: true, id: result.rows[0].id });
});

router.put('/:id', requireAuth, requireContentManager, async (req, res) => {
    const { section_id, title, problem_text, solution_text } = req.body;

    await db.query(
        `UPDATE problems SET section_id=$1,title=$2,problem_text=$3,solution_text=$4 WHERE id=$5`,
        [section_id, title, problem_text, solution_text, req.params.id]
    );

    res.json({ success: true });
});

router.delete('/:id', requireAuth, requireContentManager, async (req, res) => {
    await db.query('DELETE FROM problems WHERE id=$1', [req.params.id]);
    res.json({ success: true });
});

module.exports = router;