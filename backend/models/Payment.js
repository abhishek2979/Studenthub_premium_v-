const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  teacher:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan:      { type: String, enum: ['premium1', 'premium2'], required: true },
  amount:    { type: Number, required: true },          // in INR paise (e.g. 49900 = ₹499)
  currency:  { type: String, default: 'INR' },

  // Razorpay IDs (swap with real IDs after integration)
  razorpayOrderId:   { type: String, default: '' },
  razorpayPaymentId: { type: String, default: '' },
  razorpaySignature: { type: String, default: '' },

  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },

  // Premium validity (1 month from payment)
  validFrom:  { type: Date },
  validUntil: { type: Date },

  notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
