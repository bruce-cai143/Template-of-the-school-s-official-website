const express = require('express');
const cors = require('cors');
const path = require('path');
const { PORT } = require('./config/config');
const { testDatabaseConnection, initDatabase } = require('./db/init');

// 导入路由
const newsRoutes = require('./routes/news');
const slidesRoutes = require('./routes/slides');
const teachersRoutes = require('./routes/teachers');
const uploadRoutes = require('./routes/upload');
const activitiesRoutes = require('./routes/activities');
const usersRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const settingsRoutes = require('./routes/settings');

// 创建Express应用
const app = express();
exports.app = app;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 配置静态资源
app.use(express.static(__dirname));
app.use('/uploads', express.static('uploads'));

// 添加根路径处理，确保能访问到根目录的index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 注册路由
app.use('/api/news', newsRoutes);
app.use('/api/slides', slidesRoutes);
app.use('/api/teachers', teachersRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/auth', authRoutes);

// 启动服务器前初始化数据库
(async () => {
    const dbConnected = await testDatabaseConnection();
    
    if (dbConnected) {
        await initDatabase();
        
        // 启动服务器
        let currentPort = PORT;
        const maxRetries = 10;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                await new Promise((resolve, reject) => {
                    const server = app.listen(currentPort, () => {
                        console.log(`服务器运行在 http://localhost:${currentPort}`);
                        resolve();
                    }).on('error', (err) => {
                        if (err.code === 'EADDRINUSE') {
                            console.log(`端口 ${currentPort} 已被占用，尝试使用端口 ${currentPort + 1}`);
                            currentPort++;
                            reject(err);
                        } else {
                            console.error('启动服务器失败:', err);
                            reject(err);
                        }
                    });
                });
                break; // 如果成功启动，跳出循环
            } catch (error) {
                retryCount++;
                if (retryCount === maxRetries) {
                    console.error(`无法找到可用端口，已尝试端口 ${PORT} 到 ${currentPort}`);
                    process.exit(1);
                }
            }
        }
    } else {
        console.error('无法连接到数据库，服务器将退出');
        process.exit(1);
    }
})();