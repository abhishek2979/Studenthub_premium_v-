const asyncHandler     = require('express-async-handler');
const Assignment       = require('../models/Assignment');
const getTeacherId     = require('../utils/getTeacherId');
const { cloudinary }   = require('../config/cloudinary');

const getAssignments = asyncHandler(async (req, res) => {
  let query;

  if (req.user.role === 'teacher') {
    query = { createdBy: req.user._id };
  } else {
    const teacherId = await getTeacherId(req);
    if (!teacherId) return res.json({ success: true, assignments: [] });
    const cls = req.user.class || '';
    query = {
      createdBy: teacherId,
      $or: [{ class: '' }, ...(cls ? [{ class: cls }] : [])],
    };
  }

  const assignments = await Assignment.find(query).sort({ dueDate: 1 });
  res.json({ success: true, assignments });
});

const createAssignment = asyncHandler(async (req, res) => {
  const { title, description, subject, class: cls, dueDate, maxMarks } = req.body;
  if (!title || !subject || !dueDate) { res.status(400); throw new Error('Title, subject and due date required'); }

  const data = {
    title: title.trim(), description: description || '',
    subject, class: cls || '', dueDate,
    maxMarks: Number(maxMarks) || 100,
    createdBy: req.user._id,
  };

  if (req.file) {
    data.pdfUrl      = req.file.path;
    data.pdfPublicId = req.file.filename;
    data.pdfFileName = req.file.originalname || 'assignment.pdf';
  }

  const assignment = await Assignment.create(data);
  res.status(201).json({ success: true, assignment });
});

const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findOne({ _id: req.params.id, createdBy: req.user._id });
  if (!assignment) { res.status(404); throw new Error('Assignment not found'); }

  ['title', 'description', 'subject', 'class', 'dueDate', 'maxMarks'].forEach(f => {
    if (req.body[f] !== undefined) assignment[f] = req.body[f];
  });

  if (req.file) {
    if (assignment.pdfPublicId) {
      try { await cloudinary.uploader.destroy(assignment.pdfPublicId, { resource_type: 'raw' }); } catch (_) {}
    }
    assignment.pdfUrl      = req.file.path;
    assignment.pdfPublicId = req.file.filename;
    assignment.pdfFileName = req.file.originalname || 'assignment.pdf';
  }

  if (req.body.removePdf === 'true' && assignment.pdfPublicId) {
    try { await cloudinary.uploader.destroy(assignment.pdfPublicId, { resource_type: 'raw' }); } catch (_) {}
    assignment.pdfUrl = ''; assignment.pdfPublicId = ''; assignment.pdfFileName = '';
  }

  await assignment.save();
  res.json({ success: true, assignment });
});

const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findOne({ _id: req.params.id, createdBy: req.user._id });
  if (!assignment) { res.status(404); throw new Error('Assignment not found'); }

  if (assignment.pdfPublicId) {
    try { await cloudinary.uploader.destroy(assignment.pdfPublicId, { resource_type: 'raw' }); } catch (_) {}
  }

  await assignment.deleteOne();
  res.json({ success: true, message: 'Assignment deleted' });
});

module.exports = { getAssignments, createAssignment, updateAssignment, deleteAssignment };
