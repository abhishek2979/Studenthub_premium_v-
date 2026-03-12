const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { uploadProfile } = require('../config/cloudinary');
const {
  googleAuth, teacherRegister, teacherLogin,
  login, getMe, updateProfile, changePassword,
  forgotPassword, resetPassword,
} = require('../controllers/authController');


router.post('/google',           googleAuth);       // Teacher: Google OAuth
router.post('/teacher/register', teacherRegister);  // Teacher: Email sign-up
router.post('/teacher/login',    teacherLogin);     // Teacher: Email sign-in
router.post('/login',            login);            // Student: username + password
router.post('/forgot-password',  forgotPassword);   // Teacher: request reset link
router.post('/reset-password',   resetPassword);    // Teacher: set new password


router.get('/me',              protect, getMe);
router.put('/update-profile',  protect, uploadProfile.single('avatar'), updateProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;
