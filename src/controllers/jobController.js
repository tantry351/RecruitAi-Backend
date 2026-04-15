const db = require('../db/connection');

function generateJobId() {
    const prefix = 'JOB';
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}

// CREATE JOB
async function createJob(req, res) {
    try {
        const {
            title,
            description,
            employment_type,
            location,
            work_setup,
            key_responsibilities,
            minimum_qualifications,
            threshold_score
        } = req.body;
        
        const user = req.user;
        
        if (!title || !description) {
            return res.status(400).json({ success: false, message: 'Title dan description wajib diisi' });
        }
        
        const jobId = generateJobId();
        
        const query = `INSERT INTO jobs (
            job_id, title, description, employment_type, location, 
            work_setup, key_responsibilities, minimum_qualifications, 
            threshold_score, is_active, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const values = [
            jobId, title, description, employment_type || 'Full-time',
            location || null, work_setup || 'Office',
            key_responsibilities || null, minimum_qualifications || null,
            threshold_score || 70, true, user?.user_id || null
        ];
        
        await db.execute(query, values);
        
        res.status(201).json({
            success: true,
            message: 'Lowongan berhasil dibuat',
            data: { job_id: jobId, title }
        });
        
    } catch (error) {
        console.error('Create job error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
}

// GET ALL JOBS
async function getAllJobs(req, res) {
    try {
        console.log('Fetching all jobs...');
        const [jobs] = await db.query('SELECT * FROM jobs ORDER BY id DESC');
        console.log(`Found ${jobs.length} jobs`);
        
        res.status(200).json({
            success: true,
            data: jobs
        });
        
    } catch (error) {
        console.error('Get jobs error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
}

// GET JOB BY ID
async function getJobById(req, res) {
    try {
        const { id } = req.params;
        
        const [jobs] = await db.execute('SELECT * FROM jobs WHERE job_id = ? OR id = ?', [id, id]);
        
        if (jobs.length === 0) {
            return res.status(404).json({ success: false, message: 'Lowongan tidak ditemukan' });
        }
        
        res.status(200).json({
            success: true,
            data: jobs[0]
        });
        
    } catch (error) {
        console.error('Get job error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

// UPDATE JOB
async function updateJob(req, res) {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const [existing] = await db.execute('SELECT * FROM jobs WHERE job_id = ? OR id = ?', [id, id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Lowongan tidak ditemukan' });
        }
        
        const allowedFields = ['title', 'description', 'employment_type', 'location', 'work_setup', 'key_responsibilities', 'minimum_qualifications', 'threshold_score', 'is_active'];
        const fields = [];
        const values = [];
        
        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(updates[field]);
            }
        }
        
        if (fields.length === 0) {
            return res.status(400).json({ success: false, message: 'Tidak ada field yang diupdate' });
        }
        
        values.push(id, id);
        await db.execute(`UPDATE jobs SET ${fields.join(', ')} WHERE job_id = ? OR id = ?`, values);
        
        res.status(200).json({
            success: true,
            message: 'Lowongan berhasil diupdate'
        });
        
    } catch (error) {
        console.error('Update job error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

// DELETE JOB
async function deleteJob(req, res) {
    try {
        const { id } = req.params;
        
        const [existing] = await db.execute('SELECT * FROM jobs WHERE job_id = ? OR id = ?', [id, id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Lowongan tidak ditemukan' });
        }
        
        await db.execute('DELETE FROM jobs WHERE job_id = ? OR id = ?', [id, id]);
        
        res.status(200).json({
            success: true,
            message: 'Lowongan berhasil dihapus'
        });
        
    } catch (error) {
        console.error('Delete job error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

module.exports = { createJob, getAllJobs, getJobById, updateJob, deleteJob };
