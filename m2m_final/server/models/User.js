const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    match: [/^\d{10}$/, 'Please enter a valid 10-digit mobile number']
  },
  currentClass: {
    type: String,
    enum: ['11th', '12th'],
    required: [true, 'Class is required']
  },
  stream: {
    type: String,
    enum: ['Science (PCM)', 'Science (PCB)', 'Science (PCMB)', 'Commerce', 'Arts', 'Other'],
    default: 'Science (PCM)'
  },
  targetExam: {
    type: [String],
    enum: ['JEE Main', 'JEE Advanced', 'NEET', 'Board Exam', 'Other'],
    default: ['Board Exam']
  },
  avatar: {
    type: String,
    default: ''
  },
  streak: {
    type: Number,
    default: 0
  },
  lastLoginDate: {
    type: Date,
    default: null
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  achievements: {
    type: [String],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Update streak on login
UserSchema.methods.updateStreak = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!this.lastLoginDate) {
    this.streak = 1;
  } else {
    const last = new Date(this.lastLoginDate);
    last.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today - last) / 86400000);
    if (diffDays === 1) {
      this.streak += 1;
    } else if (diffDays > 1) {
      this.streak = 1;
    }
    // same day → no change
  }
  this.lastLoginDate = new Date();
};

module.exports = mongoose.model('User', UserSchema);
