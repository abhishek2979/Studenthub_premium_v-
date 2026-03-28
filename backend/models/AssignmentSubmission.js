const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignment:   { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  student:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',       required: true },
  pdfUrl:       { type: String, required: true },
  pdfPublicId:  { type: String, required: true },
  fileName:     { type: String, default: '' },
  grade:        { type: Number, default: null },
  feedback:     { type: String, default: '' },
  gradedAt:     { type: Date,   default: null },
  gradedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// One submission per student per assignment (can re-submit — upsert)
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

module.exports = mongoose.models.AssignmentSubmission || mongoose.model('AssignmentSubmission', submissionSchema);
