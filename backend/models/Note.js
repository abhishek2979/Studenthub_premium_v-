const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  content:     { type: String, required: true },
  subject:     { type: String, default: '' },
  class:       { type: String, default: '' },   // empty = all classes
  pdfUrl:      { type: String, default: '' },   // Cloudinary URL
  pdfPublicId: { type: String, default: '' },   // for deletion
  pdfFileName: { type: String, default: '' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.models.Note || mongoose.model('Note', noteSchema);
