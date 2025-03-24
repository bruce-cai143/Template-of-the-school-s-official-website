/**
 * 活动记录路由
 */

const express = require('express');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * 获取活动记录列表
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        // 分页参数
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;
        
        // 获取活动记录总数
        const [countResult] = await pool.query('SELECT COUNT(*) as total FROM activities');
        const total = countResult[0].total;
        
        // 获取分页活动记录列表
        const [activities] = await pool.query(
            'SELECT * FROM activities ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );
        
        res.json({
            activities,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('获取活动记录失败:', error);
        res.status(500).json({ message: '获取活动记录失败: ' + error.message });
    }
});

/**
 * 添加活动记录
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { type, description } = req.body;
        
        // 验证输入
        if (!type || !description) {
            return res.status(400).json({ message: '请提供活动类型和描述' });
        }
        
        // 添加活动记录
        const [result] = await pool.query(
            'INSERT INTO activities (type, description) VALUES (?, ?)',
            [type, description]
        );
        
        res.status(201).json({
            id: result.insertId,
            type,
            description,
            created_at: new Date()
        });
    } catch (error) {
        console.error('添加活动记录失败:', error);
        res.status(500).json({ message: '添加活动记录失败: ' + error.message });
    }
});

/**
 * 清空活动记录
 */
router.delete('/clear', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM activities');
        
        res.json({ message: '活动记录已清空' });
    } catch (error) {
        console.error('清空活动记录失败:', error);
        res.status(500).json({ message: '清空活动记录失败: ' + error.message });
    }
});

module.exports = router;