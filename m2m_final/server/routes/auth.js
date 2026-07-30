const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Mistake = require('../models/Mistake');
const Exam = require('../models/Exam');
const { protect } = require('../middleware/auth');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });

const sendToken = (user, statusCode, res, message = 'Success') => {
  const token = signToken(user._id);
  const userData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    currentClass: user.currentClass,
    stream: user.stream,
    targetExam: user.targetExam,
    streak: user.streak,
    totalPoints: user.totalPoints,
    achievements: user.achievements,
    createdAt: user.createdAt
  };
  res.status(statusCode).json({ success: true, message, token, user: userData });
};

// POST /api/auth/register
router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('mobile').matches(/^\d{10}$/).withMessage('Enter a valid 10-digit mobile number'),
  body('currentClass').isIn(['11th', '12th']).withMessage('Class must be 11th or 12th')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }
  try {
    const { name, email, password, mobile, currentClass, stream, targetExam } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered. Please login.' });

    const user = await User.create({ name, email, password, mobile, currentClass, stream, targetExam });
    user.updateStreak();
    await user.save();
    sendToken(user, 201, res, 'Registration successful! Welcome to Mistake To Magic 🎯');
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    user.updateStreak();
    await user.save();
    sendToken(user, 200, res, `Welcome back, ${user.name}! 👋`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PUT /api/auth/profile
router.put('/profile', protect, [
  body('name').optional().trim().isLength({ min: 2, max: 50 }),
  body('mobile').optional().matches(/^\d{10}$/)
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
  try {
    const allowed = ['name', 'mobile', 'currentClass', 'stream', 'targetExam'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, message: 'Profile updated!', user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/auth/forgot-password/verify
// Step 1 of "Forgot Password": confirm identity using email + registered mobile number
// (no email service is configured in this project, so identity is verified this way)
router.post('/forgot-password/verify', [
  body('email').isEmail().normalizeEmail().withMessage('Enter a valid email'),
  body('mobile').matches(/^\d{10}$/).withMessage('Enter a valid 10-digit mobile number')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }
  try {
    const { email, mobile } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.mobile !== mobile) {
      return res.status(400).json({ success: false, message: 'No account found matching that email and mobile number.' });
    }
    const resetToken = jwt.sign({ id: user._id, purpose: 'reset' }, process.env.JWT_SECRET, { expiresIn: '15m' });
    res.json({ success: true, message: 'Identity verified! Set your new password.', resetToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// POST /api/auth/forgot-password/reset
// Step 2 of "Forgot Password": consume the short-lived resetToken and set a new password
router.post('/forgot-password/reset', [
  body('resetToken').notEmpty().withMessage('Reset token is missing'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }
  try {
    const { resetToken, newPassword } = req.body;
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Reset link expired or invalid. Please start again.' });
    }
    if (decoded.purpose !== 'reset') {
      return res.status(400).json({ success: false, message: 'Invalid reset token.' });
    }
    const user = await User.findById(decoded.id);
    if (!user) return res.status(400).json({ success: false, message: 'User not found.' });

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password reset successfully! You can now login.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// PUT /api/auth/change-password

router.put('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
  try {
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(req.body.currentPassword);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    user.password = req.body.newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE /api/auth/account
// Permanently removes the user and everything they own. Requires the current
// password because this cannot be undone.
router.delete('/account', protect, [
  body('password').notEmpty().withMessage('Password is required to delete your account')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const isMatch = await user.comparePassword(req.body.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Password is incorrect.' });

    await Promise.all([
      Mistake.deleteMany({ user: user._id }),
      Exam.deleteMany({ user: user._id })
    ]);
    await User.findByIdAndDelete(user._id);

    res.json({ success: true, message: 'Your account and all data have been deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
