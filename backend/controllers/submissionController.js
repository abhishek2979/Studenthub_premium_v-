const asyncHandler      = require('express-async-handler');
const Submission        = require('../models/AssignmentSubmission');
const Assignment        = require('../models/Assignment');
const getTeacherId      = require('../utils/getTeacherId');
const { cloudinary }    = require('../config/cloudinary');


const submitAssignment = asyncHandler(async (req, res) => {
  if (req.user.role !== 'student') { res.status(403); throw new Error('Only students can submit'); }
  if (!req.file) { res.status(400); throw new Error('PDF file is required'); }

  const { assignmentId } = req.params;

  // Verify assignment exists and belongs to student's teacher
  const teacherId = await getTeacherId(req);
  if (!teacherId) { res.status(404); throw new Error('Teacher not found'); }

  const assignment = await Assignment.findOne({ _id: assignmentId, createdBy: teacherId });
  if (!assignment) { res.status(404); throw new Error('Assignment not found'); }

  // If a previous submission exists, delete the old PDF
  const existing = await Submission.findOne({ assignment: assignmentId, student: req.user._id });
  if (existing && existing.pdfPublicId) {
    try { await cloudinary.uploader.destroy(existing.pdfPublicId, { resource_type: 'raw' }); } catch (_) {}
  }

  const submission = await Submission.findOneAndUpdate(
    { assignment: assignmentId, student: req.user._id },
    {
      pdfUrl:      req.file.path,
      pdfPublicId: req.file.filename,
      fileName:    req.file.originalname || 'submission.pdf',
      // reset grade on re-submit
      grade: null, feedback: '', gradedAt: null, gradedBy: null,
    },
    { upsert: true, new: true }
  );

  res.status(201).json({ success: true, submission });
});


const getMySubmission = asyncHandler(async (req, res) => {
  if (req.user.role !== 'student') { res.status(403); throw new Error('Students only'); }
  const submission = await Submission.findOne({
    assignment: req.params.assignmentId,
    student:    req.user._id,
  });
  res.json({ success: true, submission: submission || null });
});


const getSubmissionsForAssignment = asyncHandler(async (req, res) => {
  if (req.user.role !== 'teacher') { res.status(403); throw new Error('Teachers only'); }

  const assignment = await Assignment.findOne({ _id: req.params.assignmentId, createdBy: req.user._id });
  if (!assignment) { res.status(404); throw new Error('Assignment not found'); }

  const submissions = await Submission.find({ assignment: req.params.assignmentId })
    .populate('student', 'name email studentId class profilePic')
    .sort({ createdAt: -1 });

  res.json({ success: true, submissions });
});


const gradeSubmission = asyncHandler(async (req, res) => {
  if (req.user.role !== 'teacher') { res.status(403); throw new Error('Teachers only'); }

  const { grade, feedback } = req.body;
  if (grade === undefined || grade === null || grade === '') {
    res.status(400); throw new Error('Grade is required');
  }

  const submission = await Submission.findById(req.params.submissionId)
    .populate('assignment');

  if (!submission) { res.status(404); throw new Error('Submission not found'); }
  if (String(submission.assignment.createdBy) !== String(req.user._id)) {
    res.status(403); throw new Error('Not authorized');
  }

  submission.grade    = Number(grade);
  submission.feedback = feedback || '';
  submission.gradedAt = new Date();
  submission.gradedBy = req.user._id;
  await submission.save();

  res.json({ success: true, submission });
});

module.exports = { submitAssignment, getMySubmission, getSubmissionsForAssignment, gradeSubmission };
