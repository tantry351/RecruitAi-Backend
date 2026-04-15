const authRoutes = require('./src/routes/authRoutes');
const jobRoutes = require('./src/routes/jobRoutes');
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const candidateRoutes = require('./src/routes/candidateRoutes');
const db = require('./src/db/connection');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', candidateRoutes);

app.get('/health', async (req, res) => {
    try {
        await db.query('SELECT 1');
        res.json({ status: 'healthy', database: 'connected' });
    } catch (error) {
        res.status(500).json({ status: 'unhealthy', database: 'disconnected' });
    }
});

app.get('/', (req, res) => {
    res.json({ service: 'RecruitAi API', version: '1.0.0' });
});

app.listen(PORT, () => {
    console.log(` RecruitAi Server running on http://localhost:${PORT}`);
});

app.use((err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File maksimal 5MB' });
    }
    if (err.message === 'Hanya file PDF yang diperbolehkan') {
        return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
});
