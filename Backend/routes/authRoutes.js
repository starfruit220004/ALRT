const router = require('express').Router();
const auth = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/signup',  auth.signup);
router.post('/login',   auth.login);
router.put('/profile',  verifyToken, auth.updateProfile); 
router.post('/forgot-password', auth.forgotPassword);

module.exports = router;