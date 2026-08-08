const asyncHandler = require('express-async-handler');
const Razorpay     = require('razorpay');
const crypto       = require('crypto');
const User         = require('../models/User');
const Payment      = require('../models/Payment');

// plan config - prices in paise (1 INR = 100 paise)
const PLANS = {
  premium1: { label: 'Premium 1', amount: 100, currency: 'INR' },  // ₹499
  premium2: { label: 'Premium 2', amount: 200, currency: 'INR' },  // ₹999
};

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// GET /api/premium/plans - public
exports.getPlans = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    plans: [
      {
        id:       'premium1',
        name:     'Premium 1',
        tagline:  'Video Lecture Uploads',
        price:    1,
        currency: 'INR',
        features: [
          'Upload unlimited video lectures',
          'Organise by subject & day',
          'Students can view anytime',
          'Attach PDF materials',
          'Analytics on views',
        ],
      },
      {
        id:       'premium2',
        name:     'Premium 2',
        tagline:  'Video + Live Classes',
        price:    2,
        currency: 'INR',
        features: [
          'Everything in Premium 1',
          'Schedule live lectures',
          'Share meeting link with students',
          'Live class attendance tracking',
          'Subject & day wise organisation',
        ],
      },
    ],
  });
});

// GET /api/premium/status - teacher only
exports.getStatus = asyncHandler(async (req, res) => {
  const user    = await User.findById(req.user._id);
  const isValid = user.premiumActive && user.premiumExpiry && user.premiumExpiry > new Date();

  res.json({
    success:       true,
    premiumPlan:   isValid ? user.premiumPlan   : null,
    premiumExpiry: isValid ? user.premiumExpiry : null,
    premiumActive: isValid,
  });
});

// POST /api/premium/initiate-payment - teacher only
exports.initiatePayment = asyncHandler(async (req, res) => {
  const { plan } = req.body;

  if (!PLANS[plan]) {
    res.status(400);
    throw new Error('invalid plan selected');
  }

  const { amount, currency } = PLANS[plan];

  // create razorpay order
  const order = await razorpay.orders.create({
    amount,
    currency,
    receipt: `receipt_${Date.now()}`,
  });

  // save pending payment record
  const payment = await Payment.create({
    teacher:         req.user._id,
    plan,
    amount,
    currency,
    razorpayOrderId: order.id,
    status:          'pending',
  });

  res.json({
    success:       true,
    orderId:       order.id,
    amount,
    currency,
    paymentId:     payment._id,
    plan,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  });
});

// POST /api/premium/verify-payment - teacher only
exports.verifyPayment = asyncHandler(async (req, res) => {
  const { paymentId, razorpayPaymentId, razorpayOrderId, razorpaySignature, plan } = req.body;

  // find payment record
  const payment = await Payment.findById(paymentId);
  if (!payment || payment.teacher.toString() !== req.user._id.toString()) {
    res.status(404);
    throw new Error('payment record not found');
  }

  if (payment.status === 'completed') {
    res.status(400);
    throw new Error('payment already processed');
  }

  // verify razorpay signature
  const generated = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (generated !== razorpaySignature) {
    res.status(400);
    throw new Error('payment verification failed - invalid signature');
  }

  // set 1 month validity
  const validFrom  = new Date();
  const validUntil = new Date(validFrom);
  validUntil.setMonth(validUntil.getMonth() + 1);

  // update payment record
  payment.razorpayPaymentId = razorpayPaymentId;
  payment.razorpaySignature = razorpaySignature;
  payment.status            = 'completed';
  payment.validFrom         = validFrom;
  payment.validUntil        = validUntil;
  await payment.save();

  // upgrade teacher - never downgrade if already on higher plan
  const teacher      = await User.findById(req.user._id);
  const planRank     = { premium1: 1, premium2: 2 };
  const existingRank = planRank[teacher.premiumPlan] || 0;
  const newRank      = planRank[payment.plan] || 0;

  teacher.premiumPlan   = newRank >= existingRank ? payment.plan : teacher.premiumPlan;
  teacher.premiumExpiry = validUntil;
  teacher.premiumActive = true;
  await teacher.save();

  res.json({
    success:       true,
    message:       `${payment.plan === 'premium2' ? 'Premium 2' : 'Premium 1'} activated!`,
    premiumPlan:   teacher.premiumPlan,
    premiumExpiry: teacher.premiumExpiry,
  });
});

// GET /api/premium/payment-history - teacher only
exports.getPaymentHistory = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ teacher: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({ success: true, payments });
});
