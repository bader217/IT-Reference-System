const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware_auth');

router.get('/', requireAuth, async (req, res) => {
    const result = await db.query('SELECT id, name FROM sections ORDER BY name');
    res.json(result.rows);
});

module.exports = router;