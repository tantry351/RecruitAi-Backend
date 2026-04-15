const express = require('express');
const { verifyToken } = require('../middleware/auth');
const {
    createJob,
    getAllJobs,
    getJobById,
    updateJob,
    deleteJob
} = require('../controllers/jobController');

const router = express.Router();

// Semua endpoint jobs memerlukan autentikasi (HR/Admin login)
router.use(verifyToken);

router.post('/', createJob);
router.get('/', getAllJobs);
router.get('/:id', getJobById);
router.put('/:id', updateJob);
router.delete('/:id', deleteJob);

module.exports = router;
