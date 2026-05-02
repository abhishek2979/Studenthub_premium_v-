// controllers/videoController.js
const asyncHandler   = require('express-async-handler');
const cloudinary     = require('../config/cloudinary');   // existing cloudinary config
const VideoLecture   = require('../models/VideoLecture');


exports.getAll = asyncHandler(async (req, res) => {
  const { subject, day } = req.query;
  const filter = {};

  if (req.user.role === 'teacher') {
    filter.teacher = req.user._id;
  } else {
    filter.teacher    = req.user.createdBy;
    filter.isPublished = true;
  }

  if (subject) filter.subject = subject;
  if (day)     filter.day     = day;

  const videos = await VideoLecture.find(filter)
    .populate('teacher', 'name subject avatar')
    .sort({ createdAt: -1 });

  res.json({ success: true, videos });
});



// TODO: maybe add video duration detection later
exports.create = asyncHandler(async (req, res) => {
  const { title, description, subject, day } = req.body;

  if (!title || !subject || !day) {
    res.status(400);
    throw new Error('title, subject and day are required');
  }

  
  const videoFile = req.files?.video?.[0];
  if (!videoFile) {
    res.status(400);
    throw new Error('Video file is required');
  }

  const attachmentFile = req.files?.attachment?.[0];

  const lecture = await VideoLecture.create({
    teacher:            req.user._id,
    title,
    description:        description || '',
    subject,
    day,
    videoUrl:           videoFile.path,          // Cloudinary URL
    videoPublicId:      videoFile.filename,      // Cloudinary public_id
    thumbnailUrl:       videoFile.path.replace(/\.[^.]+$/, '.jpg') || '',
    attachmentUrl:      attachmentFile ? attachmentFile.path     : '',
    attachmentPublicId: attachmentFile ? attachmentFile.filename : '',
  });

  res.status(201).json({ success: true, video: lecture });
});


exports.update = asyncHandler(async (req, res) => {
  const lecture = await VideoLecture.findOne({ _id: req.params.id, teacher: req.user._id });
  if (!lecture) { res.status(404); throw new Error('Video not found'); }

  const { title, description, subject, day, isPublished } = req.body;
  if (title)                          lecture.title       = title;
  if (description !== undefined)      lecture.description = description;
  if (subject)                        lecture.subject     = subject;
  if (day)                            lecture.day         = day;
  if (isPublished !== undefined)      lecture.isPublished = isPublished === 'true' || isPublished === true;

  await lecture.save();
  res.json({ success: true, video: lecture });
});


exports.remove = asyncHandler(async (req, res) => {
  const lecture = await VideoLecture.findOne({ _id: req.params.id, teacher: req.user._id });
  if (!lecture) { res.status(404); throw new Error('Video not found'); }

  // delete from cloudinary
  if (lecture.videoPublicId) {
    await cloudinary.uploader.destroy(lecture.videoPublicId, { resource_type: 'video' }).catch(() => {});
  }
  if (lecture.attachmentPublicId) {
    await cloudinary.uploader.destroy(lecture.attachmentPublicId).catch(() => {});
  }

  await lecture.deleteOne();
  res.json({ success: true, message: 'Video deleted' });
});



exports.incrementView = asyncHandler(async (req, res) => {
  await VideoLecture.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
  res.json({ success: true });
});
