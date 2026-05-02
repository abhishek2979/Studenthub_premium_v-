const asyncHandler  = require('express-async-handler');
const LiveLecture   = require('../models/LiveLecture');

exports.getAll = asyncHandler(async (req, res) => {
  const { subject, day, status } = req.query;
  const filter = {};

  if (req.user.role === 'teacher') {
    filter.teacher = req.user._id;
  } else {
    filter.teacher = req.user.createdBy;
  }

  if (subject) filter.subject = subject;
  if (day)     filter.day     = day;
  if (status)  filter.status  = status;

  const lectures = await LiveLecture.find(filter)
    .populate('teacher', 'name subject avatar')
    .sort({ scheduledAt: 1 });

  res.json({ success: true, lectures });
});

exports.create = asyncHandler(async (req, res) => {
  const { title, description, subject, day, scheduledAt, durationMin, meetingLink, meetingId, password } = req.body;

  if (!title || !subject || !day || !scheduledAt || !meetingLink) {
    res.status(400);
    throw new Error('title, subject, day, scheduledAt and meetingLink are required');
  }

  const lecture = await LiveLecture.create({
    teacher:     req.user._id,
    title,
    description: description || '',
    subject,
    day,
    scheduledAt: new Date(scheduledAt),
    durationMin: durationMin || 60,
    meetingLink,
    meetingId:   meetingId || '',
    password:    password  || '',
    status:      'scheduled',
  });

  res.status(201).json({ success: true, lecture });
});

exports.update = asyncHandler(async (req, res) => {
  const lecture = await LiveLecture.findOne({ _id: req.params.id, teacher: req.user._id });
  if (!lecture) { res.status(404); throw new Error('Lecture not found'); }

  const fields = ['title','description','subject','day','scheduledAt','durationMin','meetingLink','meetingId','password','status'];
  fields.forEach(f => {
    if (req.body[f] !== undefined) lecture[f] = req.body[f];
  });

  await lecture.save();
  res.json({ success: true, lecture });
});

exports.remove = asyncHandler(async (req, res) => {
  const lecture = await LiveLecture.findOne({ _id: req.params.id, teacher: req.user._id });
  if (!lecture) { res.status(404); throw new Error('Lecture not found'); }

  await lecture.deleteOne();
  res.json({ success: true, message: 'Live lecture deleted' });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed    = ['scheduled','live','completed','cancelled'];
  if (!allowed.includes(status)) {
    res.status(400); throw new Error('Invalid status');
  }

  const lecture = await LiveLecture.findOneAndUpdate(
    { _id: req.params.id, teacher: req.user._id },
    { status },
    { new: true }
  );
  if (!lecture) { res.status(404); throw new Error('Lecture not found'); }

  res.json({ success: true, lecture });
});

exports.joinLecture = asyncHandler(async (req, res) => {
  const lecture = await LiveLecture.findById(req.params.id);
  if (!lecture) { res.status(404); throw new Error('Lecture not found'); }

  const uid = req.user._id.toString();
  if (!lecture.attendees.map(a => a.toString()).includes(uid)) {
    lecture.attendees.push(req.user._id);
    await lecture.save();
  }

  res.json({ success: true, meetingLink: lecture.meetingLink });
});
