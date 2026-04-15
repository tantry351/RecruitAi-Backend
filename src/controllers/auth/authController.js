const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../db/connection');
const { generateUserId } = require('../../utils/helpers');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'recruitai-secret-key-change-in-production';

// REGISTER
async function register(req, res) {
    try {
        const { full_name, company_name, email, password } = req.body;
        
        // Validasi
        const errors = [];
        if (!full_name) errors.push('Full name wajib diisi');
        if (!company_name) errors.push('Company name wajib diisi');
        if (!email) errors.push('Email wajib diisi');
        if (!password) errors.push('Password wajib diisi');
        if (password && password.length < 8) errors.push('Password minimal 8 karakter');
        if (email && !isValidEmail(email)) errors.push('Email tidak valid');
        
        if (errors.length > 0) {
            return res.status(400).json({ success: false, errors });
        }
        
        // Cek email sudah terdaftar
        const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'Email sudah terdaftar' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = generateUserId();
        
        // Simpan ke database
        await db.execute(
            `INSERT INTO users (user_id, full_name, company_name, email, password, role) 
             VALUES (?, ?, ?, ?, ?, 'hr')`,
            [userId, full_name, company_name, email, hashedPassword]
        );
        
        // Generate token JWT
        const token = jwt.sign(
            { user_id: userId, email: email, role: 'hr' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.status(201).json({
            success: true,
            message: 'Register berhasil',
            data: {
                user_id: userId,
                full_name,
                company_name,
                email,
                role: 'hr'
            },
            token
        });
        
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
}

// LOGIN
async function login(req, res) {
    try {
        const { email, password } = req.body;
        
        const errors = [];
        if (!email) errors.push('Email wajib diisi');
        if (!password) errors.push('Password wajib diisi');
        
        if (errors.length > 0) {
            return res.status(400).json({ success: false, errors });
        }
        
        // Cari user
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Email atau password salah' });
        }
        
        const user = users[0];
        
        // Verifikasi password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ success: false, message: 'Email atau password salah' });
        }
        
        // Generate token JWT
        const token = jwt.sign(
            { user_id: user.user_id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.status(200).json({
            success: true,
            message: 'Login berhasil',
            data: {
                user_id: user.user_id,
                full_name: user.full_name,
                company_name: user.company_name,
                email: user.email,
                role: user.role
            },
            token
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
}

// GET ME (info user yang login)
async function getMe(req, res) {
    try {
        const user = req.user; // dari middleware auth
        res.status(200).json({
            success: true,
            data: {
                user_id: user.user_id,
                full_name: user.full_name,
                company_name: user.company_name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

module.exports = { register, login, getMe };
