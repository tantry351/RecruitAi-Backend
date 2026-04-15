const jwt = require('jsonwebtoken');
const db = require('../db/connection');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'recruitai-secret-key-change-in-production';

async function verifyToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
        }
        
        const token = authHeader.split(' ')[1];
        
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Ambil user dari database
        const [users] = await db.execute('SELECT user_id, full_name, company_name, email, role FROM users WHERE user_id = ?', [decoded.user_id]);
        
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'User tidak ditemukan' });
        }
        
        req.user = users[0];
        next();
        
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Token tidak valid' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired' });
        }
        console.error('Auth error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

module.exports = { verifyToken };
