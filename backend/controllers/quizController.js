const asyncHandler       = require('express-async-handler');
const { Quiz, QuizAttempt } = require('../models/Quiz');
const getTeacherId       = require('../utils/getTeacherId');


const getQuizzes = asyncHandler(async (req, res) => {
  const quizzes = await Quiz.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
  const quizIds = quizzes.map(q => q._id);
  const counts  = await QuizAttempt.aggregate([
    { $match: { quiz: { $in: quizIds } } },
    { $group: { _id: '$quiz', count: { $sum: 1 }, avg: { $avg: '$percentage' } } },
  ]);
  const cmap = {};
  counts.forEach(a => { cmap[a._id.toString()] = { count: a.count, avg: Math.round(a.avg) }; });
  const result = quizzes.map(q => ({
    ...q.toObject(),
    attemptCount: cmap[q._id.toString()]?.count || 0,
    avgScore:     cmap[q._id.toString()]?.avg    || 0,
  }));
  res.json({ success: true, quizzes: result });
});

const createQuiz = asyncHandler(async (req, res) => {
  const { title, subject, class: cls, duration, questions } = req.body;
  if (!title || !subject)              { res.status(400); throw new Error('Title and subject required'); }
  if (!questions || !questions.length) { res.status(400); throw new Error('Add at least 1 question'); }
  const quiz = await Quiz.create({
    title: title.trim(), subject, class: cls || '',
    duration: Number(duration) || 10, questions, isActive: false,
    createdBy: req.user._id,
  });
  res.status(201).json({ success: true, quiz });
});

const updateQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.user._id });
  if (!quiz) { res.status(404); throw new Error('Quiz not found'); }
  ['title','subject','class','duration','questions','isActive'].forEach(f => { if (req.body[f] !== undefined) quiz[f] = req.body[f]; });
  await quiz.save();
  res.json({ success: true, quiz });
});

const toggleQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.user._id });
  if (!quiz) { res.status(404); throw new Error('Quiz not found'); }
  quiz.isActive = !quiz.isActive;
  await quiz.save();
  res.json({ success: true, quiz, message: quiz.isActive ? 'Quiz published' : 'Quiz unpublished' });
});

const deleteQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.user._id });
  if (!quiz) { res.status(404); throw new Error('Quiz not found'); }
  await QuizAttempt.deleteMany({ quiz: quiz._id });
  await quiz.deleteOne();
  res.json({ success: true, message: 'Quiz deleted' });
});

const getQuizResults = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.user._id });
  if (!quiz) { res.status(404); throw new Error('Quiz not found'); }
  const attempts = await QuizAttempt.find({ quiz: quiz._id })
    .populate('student', 'name username rollNo class').sort({ percentage: -1 });
  res.json({ success: true, quiz, attempts });
});


const getStudentQuizzes = asyncHandler(async (req, res) => {
  const teacherId = await getTeacherId(req);
  if (!teacherId) return res.json({ success: true, quizzes: [] });

  const cls = req.user.class || '';
  const classFilter = cls ? { $or: [{ class: '' }, { class: cls }] } : { class: '' };

  const quizzes = await Quiz.find({ createdBy: teacherId, isActive: true, ...classFilter })
    .select('-questions.correct').sort({ createdAt: -1 });

  const attempted = await QuizAttempt.find({
    quiz: { $in: quizzes.map(q => q._id) }, student: req.user._id,
  }).select('quiz score percentage');

  const amap = {};
  attempted.forEach(a => { amap[a.quiz.toString()] = a; });

  res.json({
    success: true,
    quizzes: quizzes.map(q => ({
      ...q.toObject(),
      attempted: !!amap[q._id.toString()],
      myScore:   amap[q._id.toString()]?.score || null,
      myPct:     amap[q._id.toString()]?.percentage || null,
    })),
  });
});

const getQuizToTake = asyncHandler(async (req, res) => {
  const teacherId = await getTeacherId(req);
  if (!teacherId) { res.status(404); throw new Error('Quiz not found'); }
  const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: teacherId, isActive: true }).select('-questions.correct');
  if (!quiz) { res.status(404); throw new Error('Quiz not found or not available'); }
  const existing = await QuizAttempt.findOne({ quiz: quiz._id, student: req.user._id });
  if (existing) { res.status(400); throw new Error('You have already attempted this quiz'); }
  res.json({ success: true, quiz });
});

const submitQuiz = asyncHandler(async (req, res) => {
  const { answers, timeTaken } = req.body;
  const teacherId = await getTeacherId(req);
  if (!teacherId) { res.status(404); throw new Error('Quiz not found'); }
  const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: teacherId, isActive: true });
  if (!quiz) { res.status(404); throw new Error('Quiz not found'); }
  const existing = await QuizAttempt.findOne({ quiz: quiz._id, student: req.user._id });
  if (existing) { res.status(400); throw new Error('Already attempted'); }
  let score = 0;
  quiz.questions.forEach((q, i) => { if (answers[i] === q.correct) score++; });
  const total = quiz.questions.length;
  const percentage = Math.round((score / total) * 100);
  const attempt = await QuizAttempt.create({
    quiz: quiz._id, student: req.user._id,
    answers, score, total, percentage, timeTaken: timeTaken || 0,
  });
  res.status(201).json({ success: true, score, total, percentage, attempt });
});

module.exports = {
  getQuizzes, createQuiz, updateQuiz, toggleQuiz, deleteQuiz, getQuizResults,
  getStudentQuizzes, getQuizToTake, submitQuiz,
};
