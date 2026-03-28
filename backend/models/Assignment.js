const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  subject:     { type: String, required: true },
  class:       { type: String, default: '' },
  dueDate:     { type: String, required: true },   // "YYYY-MM-DD"
  maxMarks:    { type: Number, default: 100 },
  pdfUrl:      { type: String, default: '' },      // Cloudinary URL
  pdfPublicId: { type: String, default: '' },      // for deletion
  pdfFileName: { type: String, default: '' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.models.Assignment || mongoose.model('Assignment', assignmentSchema);
