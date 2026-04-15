const db = require('../db/connection');
const { generateCandidateId } = require('../utils/helpers');

async function saveCandidate(data) {
    const candidateId = generateCandidateId();
    
    const query = `INSERT INTO candidates 
        (candidate_id, nama, email, telepon, portofolio, posisi, job_id, 
         cv_google_drive_id, cv_original_name, cv_url, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const values = [
        candidateId, data.nama, data.email, data.telepon,
        data.portofolio, data.posisi, data.job_id,
        data.cv_google_drive_id, data.cv_original_name, data.cv_url, 'pending'
    ];
    
    await db.execute(query, values);
    
    return {
        candidate_id: candidateId,
        nama: data.nama,
        email: data.email,
        telepon: data.telepon,
        portofolio: data.portofolio,
        posisi: data.posisi,
        job_id: data.job_id,
        status: 'pending'
    };
}

module.exports = { saveCandidate };
