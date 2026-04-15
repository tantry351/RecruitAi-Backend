const nodemailer = require('nodemailer');
require('dotenv').config();

async function sendResetPasswordEmail(email, token) {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
        
        await transporter.sendMail({
            from: `"RecruitAI" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Reset Password - RecruitAI',
            html: `
                <h1>Reset Password</h1>
                <p>Klik link di bawah untuk reset password Anda:</p>
                <a href="${resetUrl}">${resetUrl}</a>
                <p>Link ini berlaku selama 1 jam.</p>
                <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
            `
        });
        
        console.log(` Reset password email sent to ${email}`);
        return true;
    } catch (error) {
        console.error(' Email error:', error.message);
        return false;
    }
}

module.exports = { sendResetPasswordEmail };
