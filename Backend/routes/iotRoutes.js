const express = require('express');
const router = express.Router();
const { receiveDoorData } = require('../controllers/iotController');

router.post('/door', receiveDoorData);

module.exports = router;