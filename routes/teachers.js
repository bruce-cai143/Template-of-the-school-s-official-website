const express = require('express');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 获取教师列表
router.get('/', async (req, res) => {
    try {
        // 检查teachers表是否存在
        const [tables] = await pool.query(
            "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'school_db' AND TABLE_NAME = 'teachers'"
        );
        
        if (tables.length === 0) {
            // 如果表不存在，创建表
            console.log('teachers表不存在，正在创建...');
            await pool.query(`
                CREATE TABLE IF NOT EXISTS teachers (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(50) NOT NULL,
                    title VARCHAR(100),
                    department VARCHAR(50),
                    avatar_url VARCHAR(255),
                    introduction TEXT,
                    order_num INT DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('teachers表创建成功');
            
            // 添加一些示例教师
            await pool.query(`
                INSERT INTO teachers (name, title, department, introduction, order_num) VALUES 
                ('张三', '教授', '数学系', '张三教授是我校资深教师，拥有20年教学经验...', 1),
                ('李四', '副教授', '物理系', '李四副教授专注于量子物理研究，曾获多项科研奖项...', 2),
                ('王五', '讲师', '计算机系', '王五讲师毕业于清华大学，专注于人工智能领域研究...', 3)
            `);
        }
        
        // 获取教师列表
        const [teachers] = await pool.query('SELECT * FROM teachers ORDER BY order_num ASC');
        
        res.json({ teachers });
    } catch (error) {
        console.error('获取教师列表失败:', error);
        res.status(500).json({ message: '获取教师列表失败: ' + error.message });
    }
});

// 获取单个教师
router.get('/:id', async (req, res) => {
    try {
        const teacherId = req.params.id;
        
        const [teachers] = await pool.query(
            'SELECT * FROM teachers WHERE id = ?',
            [teacherId]
        );
        
        if (teachers.length === 0) {
            return res.status(404).json({ message: '教师不存在' });
        }
        
        res.json({ teacher: teachers[0] });
    } catch (error) {
        console.error('获取教师详情失败:', error);
        res.status(500).json({ message: '获取教师详情失败: ' + error.message });
    }
});

// 添加教师
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, title, department, avatar_url, introduction, order_num } = req.body;
        
        if (!name) {
            return res.status(400).json({ message: '教师姓名不能为空' });
        }
        
        const [result] = await pool.query(
            'INSERT INTO teachers (name, title, department, avatar_url, introduction, order_num) VALUES (?, ?, ?, ?, ?, ?)',
            [name, title || null, department || null, avatar_url || null, introduction || null, order_num || 1]
        );
        
        // 记录活动
        await pool.query(
            'INSERT INTO activities (user_id, type, description) VALUES (?, ?, ?)',
            [req.user.id, 'teachers', `添加了教师：${name}`]
        );
        
        res.json({ 
            success: true, 
            message: '教师添加成功', 
            teacherId: result.insertId 
        });
    } catch (error) {
        console.error('添加教师失败:', error);
        res.status(500).json({ message: '添加教师失败: ' + error.message });
    }
});

// 更新教师
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const teacherId = req.params.id;
        const { name, title, department, avatar_url, introduction, order_num } = req.body;
        
        if (!name) {
            return res.status(400).json({ message: '教师姓名不能为空' });
        }
        
        const [result] = await pool.query(
            'UPDATE teachers SET name = ?, title = ?, department = ?, avatar_url = ?, introduction = ?, order_num = ? WHERE id = ?',
            [name, title || null, department || null, avatar_url || null, introduction || null, order_num || 1, teacherId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '教师不存在' });
        }
        
        // 记录活动
        await pool.query(
            'INSERT INTO activities (user_id, type, description) VALUES (?, ?, ?)',
            [req.user.id, 'teachers', `更新了教师：${name}`]
        );
        
        res.json({ success: true, message: '教师更新成功' });
    } catch (error) {
        console.error('更新教师失败:', error);
        res.status(500).json({ message: '更新教师失败: ' + error.message });
    }
});

// 删除教师
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const teacherId = req.params.id;
        
        // 获取教师姓名用于活动记录
        const [teachers] = await pool.query('SELECT name FROM teachers WHERE id = ?', [teacherId]);
        if (teachers.length === 0) {
            return res.status(404).json({ message: '教师不存在' });
        }
        
        const [result] = await pool.query('DELETE FROM teachers WHERE id = ?', [teacherId]);
        
        // 记录活动
        await pool.query(
            'INSERT INTO activities (user_id, type, description) VALUES (?, ?, ?)',
            [req.user.id, 'teachers', `删除了教师：${teachers[0].name}`]
        );
        
        res.json({ success: true, message: '教师删除成功' });
    } catch (error) {
        console.error('删除教师失败:', error);
        res.status(500).json({ message: '删除教师失败: ' + error.message });
    }
});

module.exports = router;