// routes/premium.js
const router  = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl    = require('../controllers/premiumController');

// Public
router.get('/plans', ctrl.getPlans);

// Teacher only
router.get('/status',          protect, authorize('teacher'), ctrl.getStatus);
router.post('/initiate-payment', protect, authorize('teacher'), ctrl.initiatePayment);
router.post('/verify-payment',   protect, authorize('teacher'), ctrl.verifyPayment);
router.get('/payment-history',   protect, authorize('teacher'), ctrl.getPaymentHistory);

module.exports = router;
