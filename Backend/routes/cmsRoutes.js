// Backend/routes/cmsRoutes.js
const express = require('express');
const router  = express.Router();
const { getCms, updateCms }            = require('../controllers/cmsController');
const { verifyToken, isAdmin }    = require('../middleware/authMiddleware');

router.get('/',  getCms);
router.put('/',  verifyToken, isAdmin, updateCms);

module.exports = router;