const express = require('express');
const router = express.Router();
const {
    toggleAlarm,
    toggleSMS,
    getSettings
} = require('../controllers/settingsController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getSettings);
router.post('/alarm', verifyToken, toggleAlarm);
router.post('/sms', verifyToken, toggleSMS);

module.exports = router;