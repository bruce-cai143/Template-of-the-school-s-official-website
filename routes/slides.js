const express = require('express');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 获取轮播图列表
router.get('/', async (req, res) => {
    try {
        // 检查slides表是否存在
        const [tables] = await pool.query(
            "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'school_db' AND TABLE_NAME = 'slides'"
        );
        
        if (tables.length === 0) {
            // 如果表不存在，创建表
            console.log('slides表不存在，正在创建...');
            await pool.query(`
                CREATE TABLE IF NOT EXISTS slides (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    title VARCHAR(255),
                    image_url VARCHAR(255) NOT NULL,
                    link VARCHAR(255),
                    order_num INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `);
            console.log('slides表创建成功');
            
            // 添加一些示例轮播图
            await pool.query(`
                INSERT INTO slides (title, image_url, link, order_num) VALUES 
                ('校园风光', '/uploads/slide-1.jpg', '#', 1),
                ('招生简章', '/uploads/slide-2.jpg', '#', 2),
                ('科技创新', '/uploads/slide-3.jpg', '#', 3)
            `);
        }
        
        // 获取轮播图列表
        const [slides] = await pool.query('SELECT * FROM slides');
        
        res.json({ slides });
    } catch (error) {
        console.error('获取轮播图列表失败:', error);
        res.status(500).json({ message: '获取轮播图列表失败: ' + error.message });
    }
});

// 获取单个轮播图
router.get('/:id', async (req, res) => {
    try {
        const slideId = req.params.id;
        
        const [slides] = await pool.query(
            'SELECT * FROM slides WHERE id = ?',
            [slideId]
        );
        
        if (slides.length === 0) {
            return res.status(404).json({ message: '轮播图不存在' });
        }
        
        res.json({ slide: slides[0] });
    } catch (error) {
        console.error('获取轮播图详情失败:', error);
        res.status(500).json({ message: '获取轮播图详情失败: ' + error.message });
    }
});

// 添加轮播图
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { title, image_url, link, order_num } = req.body;
        
        if (!image_url) {
            return res.status(400).json({ message: '轮播图图片URL不能为空' });
        }
        
        const [result] = await pool.query(
            'INSERT INTO slides (title, image_url, link, order_num) VALUES (?, ?, ?, ?)',
            [title || null, image_url, link || null, order_num || 0]
        );
        
        // 记录活动
        await pool.query(
            'INSERT INTO activities (user_id, type, description) VALUES (?, ?, ?)',
            [req.user.id, 'slides', `添加了轮播图：${title || '无标题'}`]
        );
        
        res.json({ 
            success: true, 
            message: '轮播图添加成功', 
            slideId: result.insertId 
        });
    } catch (error) {
        console.error('添加轮播图失败:', error);
        res.status(500).json({ message: '添加轮播图失败: ' + error.message });
    }
});

// 更新轮播图
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const slideId = req.params.id;
        const { title, image_url, link, order_num } = req.body;
        
        if (!image_url) {
            return res.status(400).json({ message: '轮播图图片URL不能为空' });
        }
        
        const [result] = await pool.query(
            'UPDATE slides SET title = ?, image_url = ?, link = ?, order_num = ? WHERE id = ?',
            [title || null, image_url, link || null, order_num || 0, slideId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '轮播图不存在' });
        }
        
        // 记录活动
        await pool.query(
            'INSERT INTO activities (user_id, type, description) VALUES (?, ?, ?)',
            [req.user.id, 'slides', `更新了轮播图：${title || '无标题'}`]
        );
        
        res.json({ success: true, message: '轮播图更新成功' });
    } catch (error) {
        console.error('更新轮播图失败:', error);
        res.status(500).json({ message: '更新轮播图失败: ' + error.message });
    }
});

// 删除轮播图
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const slideId = req.params.id;
        
        // 获取轮播图标题用于活动记录
        const [slides] = await pool.query('SELECT title FROM slides WHERE id = ?', [slideId]);
        if (slides.length === 0) {
            return res.status(404).json({ message: '轮播图不存在' });
        }
        
        const [result] = await pool.query('DELETE FROM slides WHERE id = ?', [slideId]);
        
        // 记录活动
        await pool.query(
            'INSERT INTO activities (user_id, type, description) VALUES (?, ?, ?)',
            [req.user.id, 'slides', `删除了轮播图：${slides[0].title || '无标题'}`]
        );
        
        res.json({ success: true, message: '轮播图删除成功' });
    } catch (error) {
        console.error('删除轮播图失败:', error);
        res.status(500).json({ message: '删除轮播图失败: ' + error.message });
    }
});

module.exports = router;