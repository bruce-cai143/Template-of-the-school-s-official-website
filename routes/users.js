const express = require('express');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 获取用户数量
router.get('/count', async (req, res) => {
    try {
        const [result] = await pool.query('SELECT COUNT(*) as count FROM admins');
        res.json({ count: result[0].count });
    } catch (error) {
        console.error('获取用户数量失败:', error);
        res.status(500).json({ message: '获取用户数量失败: ' + error.message });
    }
});

module.exports = router;