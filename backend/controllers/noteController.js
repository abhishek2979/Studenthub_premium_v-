const asyncHandler = require('express-async-handler');
const Note         = require('../models/Note');
const getTeacherId = require('../utils/getTeacherId');
const { cloudinary } = require('../config/cloudinary');

const getNotes = asyncHandler(async (req, res) => {
  let query;

  if (req.user.role === 'teacher') {
    query = { createdBy: req.user._id };
  } else {
    const teacherId = await getTeacherId(req);
    if (!teacherId) return res.json({ success: true, notes: [] });
    const cls = req.user.class || '';
    query = {
      createdBy: teacherId,
      $or: [{ class: '' }, ...(cls ? [{ class: cls }] : [])],
    };
  }

  const notes = await Note.find(query).sort({ createdAt: -1 });
  res.json({ success: true, notes });
});

const createNote = asyncHandler(async (req, res) => {
  const { title, content, subject, class: cls } = req.body;
  if (!title || !content) { res.status(400); throw new Error('Title and content required'); }

  const noteData = {
    title: title.trim(), content,
    subject: subject || '', class: cls || '',
    createdBy: req.user._id,
  };

  if (req.file) {
    noteData.pdfUrl      = req.file.path;
    noteData.pdfPublicId = req.file.filename;
    noteData.pdfFileName = req.file.originalname || 'note.pdf';
  }

  const note = await Note.create(noteData);
  res.status(201).json({ success: true, note });
});

const updateNote = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, createdBy: req.user._id });
  if (!note) { res.status(404); throw new Error('Note not found'); }

  ['title', 'content', 'subject', 'class'].forEach(f => {
    if (req.body[f] !== undefined) note[f] = req.body[f];
  });

  if (req.file) {
    if (note.pdfPublicId) {
      try { await cloudinary.uploader.destroy(note.pdfPublicId, { resource_type: 'raw' }); } catch (_) {}
    }
    note.pdfUrl      = req.file.path;
    note.pdfPublicId = req.file.filename;
    note.pdfFileName = req.file.originalname || 'note.pdf';
  }

  if (req.body.removePdf === 'true' && note.pdfPublicId) {
    try { await cloudinary.uploader.destroy(note.pdfPublicId, { resource_type: 'raw' }); } catch (_) {}
    note.pdfUrl = ''; note.pdfPublicId = ''; note.pdfFileName = '';
  }

  await note.save();
  res.json({ success: true, note });
});

const deleteNote = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, createdBy: req.user._id });
  if (!note) { res.status(404); throw new Error('Note not found'); }

  if (note.pdfPublicId) {
    try { await cloudinary.uploader.destroy(note.pdfPublicId, { resource_type: 'raw' }); } catch (_) {}
  }

  await note.deleteOne();
  res.json({ success: true, message: 'Note deleted' });
});

module.exports = { getNotes, createNote, updateNote, deleteNote };
