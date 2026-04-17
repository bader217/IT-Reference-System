const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware_auth');

router.get('/', requireAuth, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, name FROM sections ORDER BY name');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;


// status rendering fix
function getStatusText(status){
  return status === 'resolved' ? 'تم الحل' : 'قيد المعالجة';
}
