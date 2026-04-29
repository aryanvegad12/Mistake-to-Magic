const mongoose = require('mongoose');

const ExamSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Exam name is required'],
    trim: true,
    maxlength: [100, 'Exam name cannot exceed 100 characters']
  },
  examDate: {
    type: Date,
    required: [true, 'Exam date is required']
  },
  subject: {
    type: String,
    default: 'All'
  },
  notes: {
    type: String,
    maxlength: [300, 'Notes cannot exceed 300 characters'],
    default: ''
  },
  color: {
    type: String,
    default: '#a78bfa'
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Exam', ExamSchema);
