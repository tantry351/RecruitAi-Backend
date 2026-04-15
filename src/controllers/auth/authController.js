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

// FORGOT PASSWORD
async function forgotPassword(req, res) {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email wajib diisi' });
        }
        
        const [users] = await db.execute('SELECT id, email FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'Email tidak terdaftar' });
        }
        
        // Generate token random
        const crypto = require('crypto');
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 jam
        
        // Simpan token ke database
        await db.execute(
            'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)',
            [email, token, expiresAt]
        );
        
        // Kirim email (opsional, bisa di-skip dulu)
        const { sendResetPasswordEmail } = require('../../services/emailService');
        await sendResetPasswordEmail(email, token);
        
        res.status(200).json({
            success: true,
            message: 'Link reset password telah dikirim ke email Anda'
        });
        
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

// RESET PASSWORD
async function resetPassword(req, res) {
    try {
        const { token, new_password } = req.body;
        
        if (!token || !new_password) {
            return res.status(400).json({ success: false, message: 'Token dan password baru wajib diisi' });
        }
        
        if (new_password.length < 8) {
            return res.status(400).json({ success: false, message: 'Password minimal 8 karakter' });
        }
        
        // Cek token
        const [resets] = await db.execute(
            'SELECT * FROM password_resets WHERE token = ? AND used = FALSE AND expires_at > NOW()',
            [token]
        );
        
        if (resets.length === 0) {
            return res.status(400).json({ success: false, message: 'Token tidak valid atau sudah kadaluarsa' });
        }
        
        const reset = resets[0];
        
        // Hash password baru
        const hashedPassword = await bcrypt.hash(new_password, 10);
        
        // Update password user
        await db.execute('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, reset.email]);
        
        // Tandai token sudah digunakan
        await db.execute('UPDATE password_resets SET used = TRUE WHERE id = ?', [reset.id]);
        
        res.status(200).json({
            success: true,
            message: 'Password berhasil direset. Silakan login dengan password baru.'
        });
        
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

module.exports = { register, login, getMe, forgotPassword, resetPassword };
