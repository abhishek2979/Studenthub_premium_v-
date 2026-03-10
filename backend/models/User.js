
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  avatar:   { type: String, default: '' },
  avatarPublicId: { type: String, default: '' },

  role:     { type: String, enum: ['teacher', 'student'], default: 'student' },

  
  googleId:    { type: String, unique: true, sparse: true },
  googleEmail: { type: String, default: '' },

  
  username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  password: { type: String, minlength: 6, select: false },

  // Teacher fields
  subject:    { type: String, default: '' },
  department: { type: String, default: '' },

  // Student fields
  rollNo:     { type: String, default: '' },
  class:      { type: String, default: '' },
  phone:      { type: String, default: '' },
  studentRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  isActive:  { type: Boolean, default: true },
  lastLogin: { type: Date },

  
  resetToken:       { type: String,  default: null },
  resetTokenExpiry: { type: Date,    default: null },

  
  // null means free tier
  premiumPlan:    { type: String, enum: ['premium1', 'premium2', null], default: null },
  premiumExpiry:  { type: Date, default: null },        
  premiumActive:  { type: Boolean, default: false },    
}, { timestamps: true });

// hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};


userSchema.virtual('isPremiumValid').get(function () {
  return this.premiumActive && this.premiumExpiry && this.premiumExpiry > new Date();
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
