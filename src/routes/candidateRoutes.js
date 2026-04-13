const express = require('express');
const upload = require('../middleware/upload');
const { createCandidate } = require('../controllers/candidateController');

const router = express.Router();

router.post('/candidates', upload.single('cv_file'), createCandidate);

module.exports = router;
