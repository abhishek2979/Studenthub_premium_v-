const asyncHandler = require('express-async-handler');
const User    = require('../models/User');
const Payment = require('../models/Payment');

// plan prices in paise
const PLANS = {
  premium1: { label: 'Premium 1', amount: 49900, currency: 'INR' }, // ₹499/mo
  premium2: { label: 'Premium 2',   amount: 99900, currency: 'INR' }, // ₹999/mo
};

exports.getPlans = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    plans: [
      {
        id:       'premium1',
        name:     'Premium 1',
        tagline:  'Video Lecture Uploads',
        price:    499,
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
        price:    999,
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

exports.getStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const isValid = user.premiumActive && user.premiumExpiry && user.premiumExpiry > new Date();

  res.json({
    success: true,
    premiumPlan:   isValid ? user.premiumPlan   : null,
    premiumExpiry: isValid ? user.premiumExpiry : null,
    premiumActive: isValid,
  });
});

// create payment order
exports.initiatePayment = asyncHandler(async (req, res) => {
  const { plan } = req.body;

  if (!PLANS[plan]) {
    res.status(400);
    throw new Error('Invalid plan selected');
  }

  const { amount, currency } = PLANS[plan];

  
  // const Razorpay = require('razorpay');
  // const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
  // const order = await razorpay.orders.create({ amount, currency, receipt: `receipt_${Date.now()}` });
  
  // TODO: hook up razorpay here when ready
  const mockOrderId = `order_mock_${Date.now()}`;

  const payment = await Payment.create({
    teacher:         req.user._id,
    plan,
    amount,
    currency,
    razorpayOrderId: mockOrderId,
    status:          'pending',
  });

  res.json({
    success:    true,
    orderId:    mockOrderId,
    amount,
    currency,
    paymentId:  payment._id,
    plan,
    // In production also return: razorpayKeyId: process.env.RAZORPAY_KEY_ID
  });
});

// verify payment after checkout
exports.verifyPayment = asyncHandler(async (req, res) => {
  const { paymentId, razorpayPaymentId, razorpayOrderId, razorpaySignature, plan } = req.body;

  const payment = await Payment.findById(paymentId);
  if (!payment || payment.teacher.toString() !== req.user._id.toString()) {
    res.status(404);
    throw new Error('Payment record not found');
  }

  if (payment.status === 'completed') {
    res.status(400);
    throw new Error('Payment already processed');
  }

  
  // const crypto = require('crypto');
  // const generated = crypto
  //   .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
  //   .update(`${razorpayOrderId}|${razorpayPaymentId}`)
  //   .digest('hex');
  // if (generated !== razorpaySignature) {
  //   res.status(400); throw new Error('Payment verification failed – invalid signature');
  // }
  
  // TODO: replace with real razorpay verification
  const validFrom  = new Date();
  const validUntil = new Date(validFrom);
  validUntil.setMonth(validUntil.getMonth() + 1);  // 30 day validity

  // Update payment record
  payment.razorpayPaymentId = razorpayPaymentId || `pay_mock_${Date.now()}`;
  payment.razorpaySignature = razorpaySignature || 'mock_sig';
  payment.status            = 'completed';
  payment.validFrom         = validFrom;
  payment.validUntil        = validUntil;
  await payment.save();

  // Upgrade teacher's User record
  // premium2 > premium1 — never downgrade if already on higher plan
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
    message:       `${payment.plan === 'premium2' ? 'Premium 2' : 'Premium 1'} activated successfully!`,
    premiumPlan:   teacher.premiumPlan,
    premiumExpiry: teacher.premiumExpiry,
  });
});

exports.getPaymentHistory = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ teacher: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({ success: true, payments });
});
