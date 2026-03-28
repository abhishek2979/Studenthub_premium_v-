const mongoose = require('mongoose');

const videoLectureSchema = new mongoose.Schema({
  teacher:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  subject:     { type: String, required: true, trim: true },
  day:         {
    type: String,
    required: true,
    enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
  },
  
  videoUrl:       { type: String, required: true },
  videoPublicId:  { type: String, required: true },
  duration:       { type: Number, default: 0 },      
  thumbnailUrl:   { type: String, default: '' },

  
  attachmentUrl:  { type: String, default: '' },
  attachmentPublicId: { type: String, default: '' },

  isPublished: { type: Boolean, default: true },
  views:       { type: Number, default: 0 },
}, { timestamps: true });

videoLectureSchema.index({ teacher: 1, subject: 1, day: 1 });

module.exports = mongoose.models.VideoLecture || mongoose.model('VideoLecture', videoLectureSchema);
