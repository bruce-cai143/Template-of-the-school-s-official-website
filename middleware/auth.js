/**
 * 认证中间件
 */

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/config');

/**
 * 验证JWT令牌
 */
const authenticateToken = (req, res, next) => {
    // 从请求头获取令牌
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN格式
    
    if (!token) {
        return res.status(401).json({ message: '未提供认证令牌' });
    }
    
    // 验证令牌
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: '令牌无效或已过期' });
        }
        
        // 将用户信息添加到请求对象
        req.user = user;
        next();
    });
};

module.exports = {
    authenticateToken
};