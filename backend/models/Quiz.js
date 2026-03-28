const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options:  [{ type: String, required: true }],   // 4 options
  correct:  { type: Number, required: true },      // index 0-3
}, { _id: true });

const quizSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  subject:     { type: String, required: true },
  class:       { type: String, default: '' },
  duration:    { type: Number, default: 10 },      // minutes
  questions:   [questionSchema],
  isActive:    { type: Boolean, default: false },  // teacher publishes when ready
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });


const attemptSchema = new mongoose.Schema({
  quiz:      { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  student:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers:   [{ type: Number }],    // selected option index per question
  score:     { type: Number, default: 0 },
  total:     { type: Number, default: 0 },
  percentage:{ type: Number, default: 0 },
  timeTaken: { type: Number, default: 0 },  // seconds
  submittedAt:{ type: Date, default: Date.now },
}, { timestamps: true });

attemptSchema.index({ quiz: 1, student: 1 }, { unique: true }); // one attempt per student

module.exports = {
  Quiz:        mongoose.models.Quiz        || mongoose.model('Quiz',        quizSchema),
  QuizAttempt: mongoose.models.QuizAttempt || mongoose.model('QuizAttempt', attemptSchema),
};
