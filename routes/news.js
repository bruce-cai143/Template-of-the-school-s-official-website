const express = require('express');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 获取新闻列表
router.get('/', async (req, res) => {
    try {
        // 检查news表是否存在
        const [tables] = await pool.query(
            "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'school_db' AND TABLE_NAME = 'news'"
        );
        
        if (tables.length === 0) {
            // 如果表不存在，创建表
            console.log('news表不存在，正在创建...');
            await pool.query(`
                CREATE TABLE IF NOT EXISTS news (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    content TEXT,
                    image_url VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `);
            console.log('news表创建成功');
            
            // 添加一些示例新闻
            await pool.query(`
                INSERT INTO news (title, content) VALUES 
                ('学校举办科技创新大赛', '为了培养学生的创新精神和实践能力，我校于上周举办了科技创新大赛...'),
                ('2023年秋季招生公告', '2023年秋季招生工作即将开始，欢迎广大学子报考我校...'),
                ('教师节表彰大会', '在第39个教师节来临之际，学校举行了隆重的表彰大会，表彰优秀教师...')
            `);
        }
        
        // 分页参数
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        // 获取新闻总数
        const [countResult] = await pool.query('SELECT COUNT(*) as total FROM news');
        const total = countResult[0].total;
        
        // 获取分页新闻列表
        const [news] = await pool.query(
            'SELECT * FROM news ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );
        
        res.json({
            news,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('获取新闻列表失败:', error);
        res.status(500).json({ message: '获取新闻列表失败: ' + error.message });
    }
});

// 获取单条新闻
router.get('/:id', async (req, res) => {
    try {
        const newsId = req.params.id;
        
        const [news] = await pool.query(
            'SELECT * FROM news WHERE id = ?',
            [newsId]
        );
        
        if (news.length === 0) {
            return res.status(404).json({ message: '新闻不存在' });
        }
        
        res.json({ news: news[0] });
    } catch (error) {
        console.error('获取新闻详情失败:', error);
        res.status(500).json({ message: '获取新闻详情失败: ' + error.message });
    }
});

// 添加新闻
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { title, content, image_url } = req.body;
        
        if (!title) {
            return res.status(400).json({ message: '新闻标题不能为空' });
        }
        
        const [result] = await pool.query(
            'INSERT INTO news (title, content, image_url) VALUES (?, ?, ?)',
            [title, content || null, image_url || null]
        );
        
        // 记录活动
        await pool.query(
            'INSERT INTO activities (user_id, type, description) VALUES (?, ?, ?)',
            [req.user.id, 'news', `添加了新闻：${title}`]
        );
        
        res.json({ 
            success: true, 
            message: '新闻添加成功', 
            newsId: result.insertId 
        });
    } catch (error) {
        console.error('添加新闻失败:', error);
        res.status(500).json({ message: '添加新闻失败: ' + error.message });
    }
});

// 更新新闻
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const newsId = req.params.id;
        const { title, content, image_url } = req.body;
        
        if (!title) {
            return res.status(400).json({ message: '新闻标题不能为空' });
        }
        
        const [result] = await pool.query(
            'UPDATE news SET title = ?, content = ?, image_url = ? WHERE id = ?',
            [title, content || null, image_url || null, newsId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '新闻不存在' });
        }
        
        // 记录活动
        await pool.query(
            'INSERT INTO activities (user_id, type, description) VALUES (?, ?, ?)',
            [req.user.id, 'news', `更新了新闻：${title}`]
        );
        
        res.json({ success: true, message: '新闻更新成功' });
    } catch (error) {
        console.error('更新新闻失败:', error);
        res.status(500).json({ message: '更新新闻失败: ' + error.message });
    }
});

// 删除新闻
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const newsId = req.params.id;
        
        // 获取新闻标题用于活动记录
        const [news] = await pool.query('SELECT title FROM news WHERE id = ?', [newsId]);
        if (news.length === 0) {
            return res.status(404).json({ message: '新闻不存在' });
        }
        
        const [result] = await pool.query('DELETE FROM news WHERE id = ?', [newsId]);
        
        // 记录活动
        await pool.query(
            'INSERT INTO activities (user_id, type, description) VALUES (?, ?, ?)',
            [req.user.id, 'news', `删除了新闻：${news[0].title}`]
        );
        
        res.json({ success: true, message: '新闻删除成功' });
    } catch (error) {
        console.error('删除新闻失败:', error);
        res.status(500).json({ message: '删除新闻失败: ' + error.message });
    }
});

module.exports = router;