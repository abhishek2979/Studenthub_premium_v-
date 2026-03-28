const mongoose = require('mongoose');

const liveLectureSchema = new mongoose.Schema({
  teacher:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  subject:     { type: String, required: true, trim: true },
  day:         {
    type: String,
    required: true,
    enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
  },
  scheduledAt: { type: Date, required: true },         // exact date + time
  durationMin: { type: Number, default: 60 },           // expected duration in minutes

  // Meeting link (Google Meet / Zoom / Jitsi etc.)
  meetingLink: { type: String, required: true },
  meetingId:   { type: String, default: '' },
  password:    { type: String, default: '' },

  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled'],
    default: 'scheduled',
  },

  // Students who joined (for attendance)
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

liveLectureSchema.index({ teacher: 1, scheduledAt: 1 });

module.exports = mongoose.models.LiveLecture || mongoose.model('LiveLecture', liveLectureSchema);
