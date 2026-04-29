const mongoose = require('mongoose');

const MistakeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  subject: {
    type: String,
    enum: ['Physics', 'Chemistry', 'Maths', 'Biology', 'English', 'Computer', 'Accountancy', 'Economics', 'Other'],
    required: [true, 'Subject is required']
  },
  topic: {
    type: String,
    trim: true,
    maxlength: [100, 'Topic cannot exceed 100 characters']
  },
  whereHappened: {
    type: String,
    required: [true, 'Please mention where the mistake happened'],
    trim: true,
    maxlength: [200, 'Cannot exceed 200 characters']
  },
  mistakeType: {
    type: String,
    enum: ['Calculation', 'Concept', 'Question Reading', 'Formula', 'Language', 'Silly', 'Time Management', 'Other'],
    required: [true, 'Mistake type is required']
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  whatWentWrong: {
    type: String,
    required: [true, 'Please describe what went wrong'],
    trim: true,
    maxlength: [1000, 'Cannot exceed 1000 characters']
  },
  correctMethod: {
    type: String,
    required: [true, 'Please provide the correct method'],
    trim: true,
    maxlength: [1000, 'Cannot exceed 1000 characters']
  },
  howToAvoid: {
    type: String,
    required: [true, 'Please describe how to avoid this mistake'],
    trim: true,
    maxlength: [500, 'Cannot exceed 500 characters']
  },
  tags: {
    type: [String],
    default: []
  },
  isRevised: {
    type: Boolean,
    default: false
  },
  revisionCount: {
    type: Number,
    default: 0
  },
  nextRevisionDate: {
    type: Date,
    default: () => new Date(Date.now() + 86400000) // tomorrow
  },
  revisionHistory: [{
    revisedAt: { type: Date },
    notes: { type: String }
  }],
  isFavorite: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Index for fast queries
MistakeSchema.index({ user: 1, subject: 1 });
MistakeSchema.index({ user: 1, createdAt: -1 });
MistakeSchema.index({ user: 1, nextRevisionDate: 1 });

// Calculate next revision date using spaced repetition
MistakeSchema.methods.scheduleNextRevision = function () {
  const intervals = [1, 3, 7, 14, 30]; // days
  const idx = Math.min(this.revisionCount, intervals.length - 1);
  const days = intervals[idx];
  this.nextRevisionDate = new Date(Date.now() + days * 86400000);
  this.revisionCount += 1;
  this.isRevised = true;
  this.revisionHistory.push({ revisedAt: new Date() });
};

module.exports = mongoose.model('Mistake', MistakeSchema);
