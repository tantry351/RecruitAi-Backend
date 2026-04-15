const fs = require('fs');
const path = require('path');
const { uploadCVToGoogleDrive } = require('../services/googleDriveService');
const { saveCandidate } = require('../services/dbService');
const { sendToWebhook } = require('../services/webhookService');
const { isValidEmail, isValidPhone } = require('../utils/helpers');

async function createCandidate(req, res) {
    console.log('Controller DIPANGGIL!');
    console.log('File:', req.file);
    console.log('Body:', req.body);
    
    try {
        const { nama, email, telepon, portofolio, posisi, job_id } = req.body;
        const file = req.file;
        
        const errors = [];
        if (!nama) errors.push('Nama wajib diisi');
        if (!email) errors.push('Email wajib diisi');
        if (email && !isValidEmail(email)) errors.push('Email tidak valid');
        if (!telepon) errors.push('Telepon wajib diisi');
        if (telepon && !isValidPhone(telepon)) errors.push('Telepon harus 10-15 digit');
        if (!posisi) errors.push('Posisi wajib diisi');
        if (!job_id) errors.push('Job ID wajib diisi');
        if (!file) errors.push('File CV wajib diupload');
        
        if (errors.length > 0) {
            return res.status(400).json({ success: false, errors });
        }
        
        // === UPLOAD KE GOOGLE DRIVE ===
        console.log(' Memanggil uploadCVToGoogleDrive...');
        const uploadResult = await uploadCVToGoogleDrive(file, nama);
        console.log('Hasil upload:', uploadResult);
        
        // === SIMPAN KE DATABASE ===
        const candidate = await saveCandidate({
            nama, email, telepon, portofolio: portofolio || null, posisi, job_id,
            cv_google_drive_id: uploadResult.fileId,
            cv_original_name: file.originalname,
            cv_url: uploadResult.url
        });
        
        // === KIRIM KE WEBHOOK ===
        sendToWebhook({
            candidate_id: candidate.candidate_id,
            job_id: candidate.job_id,
            cv_path: uploadResult.url,
            division: candidate.posisi
        });
        
        res.status(201).json({
            success: true,
            message: 'Lamaran berhasil dikirim',
            data: candidate
        });
        
    } catch (error) {
        console.error(' Error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
}

module.exports = { createCandidate };
