const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  roll:     { type: String, required: true, trim: true },  // unique per teacher, not globally
  email:    { type: String, required: true, lowercase: true },  // unique per teacher, not globally
  class:    { type: String, required: true },
  phone:    { type: String, default: '' },
  avatar:   { type: String, default: '' },
  avatarPublicId: { type: String, default: '' },
  status:   { type: String, enum: ['active', 'inactive', 'graduated'], default: 'active' },
  userRef:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  address:  { type: String, default: '' },
  dob:      { type: Date },
  guardian: { name: String, phone: String, relation: String },
}, { timestamps: true });


studentSchema.index({ roll: 1, createdBy: 1 }, { unique: true });

studentSchema.index({ email: 1, createdBy: 1 }, { unique: true });

// Virtual: initials
studentSchema.virtual('initials').get(function () {
  return this.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
});

studentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.models.Student || mongoose.model('Student', studentSchema);
