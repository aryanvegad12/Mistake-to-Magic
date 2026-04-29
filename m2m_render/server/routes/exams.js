const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Exam = require('../models/Exam');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const exams = await Exam.find({ user: req.user._id }).sort('examDate');
    res.json({ success: true, exams });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

router.post('/', protect, [
  body('name').trim().notEmpty().isLength({ max: 100 }).withMessage('Exam name is required (max 100 chars)'),
  body('examDate').isISO8601().withMessage('Enter a valid exam date')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
  try {
    const exam = await Exam.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, message: 'Exam added!', exam });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const exam = await Exam.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body, { new: true }
    );
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found.' });
    res.json({ success: true, message: 'Exam updated!', exam });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const exam = await Exam.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found.' });
    res.json({ success: true, message: 'Exam deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
