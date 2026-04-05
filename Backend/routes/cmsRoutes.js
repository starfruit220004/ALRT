const express = require('express');
const router  = express.Router();
const { getCms, updateCms } = require('../controllers/cmsController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Public route for landing page
router.get('/', getCms);

// Protected route for admin dashboard
router.put('/', verifyToken, isAdmin, updateCms);

module.exports = router;