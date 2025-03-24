const express = require('express');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 获取系统设置
router.get('/', async (req, res) => {
    try {
        // 检查settings表是否存在
        const [tables] = await pool.query(
            "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'school_db' AND TABLE_NAME = 'settings'"
        );
        
        if (tables.length === 0) {
            // 如果表不存在，创建表
            console.log('settings表不存在，正在创建...');
            await pool.query(`
                CREATE TABLE IF NOT EXISTS settings (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    \`key\` VARCHAR(50) NOT NULL UNIQUE,
                    value TEXT,
                    description VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `);
            console.log('settings表创建成功');
            
            // 添加默认设置
            await pool.query(`
                INSERT INTO settings (\`key\`, value, description) VALUES 
                ('school_name', '未来科技中学', '学校名称'),
                ('school_slogan', '培养未来科技人才', '学校口号'),
                ('contact_email', 'contact@example.com', '联系邮箱'),
                ('contact_phone', '123-456-7890', '联系电话'),
                ('address', '北京市海淀区XX路XX号', '学校地址'),
                ('footer_text', '© 2023 未来科技中学. 保留所有权利.', '页脚文本')
            `);
        }
        
        // 获取所有设置
        const [settings] = await pool.query('SELECT * FROM settings');
        
        // 转换为键值对格式
        const settingsObj = {};
        settings.forEach(setting => {
            settingsObj[setting.key] = setting.value;
        });
        
        res.json({ settings: settingsObj, raw: settings });
    } catch (error) {
        console.error('获取系统设置失败:', error);
        res.status(500).json({ message: '获取系统设置失败: ' + error.message });
    }
});

// 更新系统设置
router.put('/', authenticateToken, async (req, res) => {
    try {
        const settings = req.body;
        
        if (!settings || Object.keys(settings).length === 0) {
            return res.status(400).json({ message: '未提供任何设置' });
        }
        
        // 更新每个设置
        for (const [key, value] of Object.entries(settings)) {
            // 检查设置是否存在
            const [existingSettings] = await pool.query('SELECT * FROM settings WHERE `key` = ?', [key]);
            
            if (existingSettings.length > 0) {
                // 更新现有设置
                await pool.query('UPDATE settings SET value = ? WHERE `key` = ?', [value, key]);
            } else {
                // 添加新设置
                await pool.query('INSERT INTO settings (`key`, value) VALUES (?, ?)', [key, value]);
            }
        }
        
        // 记录活动
        await pool.query(
            'INSERT INTO activities (user_id, type, description) VALUES (?, ?, ?)',
            [req.user.id, 'settings', `更新了系统设置`]
        );
        
        res.json({ success: true, message: '系统设置更新成功' });
    } catch (error) {
        console.error('系统设置更新失败:', error);
        res.status(500).json({ message: '系统设置更新失败: ' + error.message });
    }
});

module.exports = router;