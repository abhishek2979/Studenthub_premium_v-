const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const {
  getQuizzes, createQuiz, updateQuiz, toggleQuiz, deleteQuiz, getQuizResults,
  getStudentQuizzes, getQuizToTake, submitQuiz,
} = require('../controllers/quizController');

// Teacher routes
router.get('/',              protect, getQuizzes);
router.post('/',             protect, createQuiz);
router.put('/:id',           protect, updateQuiz);
router.patch('/:id/toggle',  protect, toggleQuiz);
router.delete('/:id',        protect, deleteQuiz);
router.get('/:id/results',   protect, getQuizResults);

// Student routes
router.get('/student/list',       protect, getStudentQuizzes);
router.get('/student/:id/take',   protect, getQuizToTake);
router.post('/student/:id/submit',protect, submitQuiz);

module.exports = router;
