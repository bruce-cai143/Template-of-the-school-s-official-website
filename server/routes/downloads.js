const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();
const connection = require('../config/database');

// 获取文件列表
router.get('/api/downloads', async (req, res) => {
    try {
        const [files] = await connection.query(
            'SELECT id, title, description, file_size, download_count, upload_date FROM downloads'
        );
        res.json(files);
    } catch (error) {
        res.status(500).json({ error: '获取文件列表失败' });
    }
});

// 下载文件
router.get('/api/downloads/:id', async (req, res) => {
    try {
        const [file] = await connection.query(
            'SELECT * FROM downloads WHERE id = ?',
            [req.params.id]
        );
        
        if (!file.length) {
            return res.status(404).json({ error: '文件不存在' });
        }

        // 更新下载次数
        await connection.query(
            'UPDATE downloads SET download_count = download_count + 1 WHERE id = ?',
            [req.params.id]
        );

        res.setHeader('Content-Type', file[0].file_type);
        res.setHeader('Content-Disposition', `attachment; filename=${file[0].file_name}`);
        res.send(file[0].file_data);
    } catch (error) {
        res.status(500).json({ error: '下载文件失败' });
    }
});

module.exports = router;