const express = require('express');
const router = express.Router();
const {
    toggleAlarm,
    toggleSMS,
    getSettings
} = require('../controllers/settingsController');

router.get('/', getSettings);
router.post('/alarm', toggleAlarm);
router.post('/sms', toggleSMS);

module.exports = router;