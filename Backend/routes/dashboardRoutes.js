const express = require('express');
const router = express.Router();
const { getLogs } = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/logs', verifyToken, getLogs);

module.exports = router;