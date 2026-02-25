const express = require('express');
const router = express.Router();
const { getLogs } = require('../controllers/dashboardController');

router.get('/logs', getLogs);

module.exports = router;