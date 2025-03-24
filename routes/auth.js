/**
 * 认证路由
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { JWT_SECRET } = require('../config/config');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

module.exports = router;

/**
 * 管理员登录
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // 验证输入
        if (!username || !password) {
            return res.status(400).json({ message: '请提供用户名和密码' });
        }
        
        // 查询管理员
        const [admins] = await pool.query('SELECT * FROM admins WHERE username = ?', [username]);
        
        if (admins.length === 0) {
            return res.status(401).json({ message: '用户名或密码错误' });
        }
        
        const admin = admins[0];
        
        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ message: '用户名或密码错误' });
        }
        
        // 生成JWT令牌
        const token = jwt.sign(
            { id: admin.id, username: admin.username },
            JWT_SECRET,
            { expiresIn: '24h' } // 令牌有效期24小时
        );
        
        // 记录登录活动
        await pool.query(
            'INSERT INTO activities (type, description) VALUES (?, ?)',
            ['登录', `管理员 ${admin.username} 登录系统`]
        );
        
        // 返回令牌和管理员信息
        res.json({
            token,
            admin: {
                id: admin.id,
                username: admin.username,
                name: admin.name,
                email: admin.email
            }
        });
    } catch (error) {
        console.error('登录失败:', error);
        res.status(500).json({ message: '登录失败: ' + error.message });
    }
});

/**
 * 获取当前管理员信息
 */
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const [admins] = await pool.query('SELECT id, username, name, email FROM admins WHERE id = ?', [req.user.id]);
        
        if (admins.length === 0) {
            return res.status(404).json({ message: '管理员不存在' });
        }
        
        res.json({ admin: admins[0] });
    } catch (error) {
        console.error('获取管理员信息失败:', error);
        res.status(500).json({ message: '获取管理员信息失败: ' + error.message });
    }
});

/**
 * 修改密码
 */
router.put('/password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        // 验证输入
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: '请提供当前密码和新密码' });
        }
        
        // 查询管理员
        const [admins] = await pool.query('SELECT * FROM admins WHERE id = ?', [req.user.id]);
        
        if (admins.length === 0) {
            return res.status(404).json({ message: '管理员不存在' });
        }
    
        const admin = admins[0];
        
        // 验证当前密码
        const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ message: '当前密码错误' });
        }
        
        // 加密新密码
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        // 更新密码
        await pool.query('UPDATE admins SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);
        
        // 记录密码修改活动
        await pool.query(
            'INSERT INTO activities (type, description) VALUES (?, ?)',
            ['密码修改', `管理员 ${admin.username} 修改了密码`]
        );
        
        res.json({ message: '密码修改成功' });
    } catch (error) {
        console.error('修改密码失败:', error);
        res.status(500).json({ message: '修改密码失败: ' + error.message });
    }
});