const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const Mistake = require('../models/Mistake');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// GET /api/mistakes — get all with filters, search, pagination
router.get('/', protect, async (req, res) => {
  try {
    const { subject, type, search, severity, page = 1, limit = 20, sort = '-createdAt', dueOnly } = req.query;
    const filter = { user: req.user._id };

    if (subject && subject !== 'All') filter.subject = subject;
    if (type && type !== 'All') filter.mistakeType = type;
    if (severity && severity !== 'All') filter.severity = severity;
    if (dueOnly === 'true') filter.nextRevisionDate = { $lte: new Date() };
    if (search) {
      filter.$or = [
        { whatWentWrong: { $regex: search, $options: 'i' } },
        { correctMethod: { $regex: search, $options: 'i' } },
        { whereHappened: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [mistakes, total] = await Promise.all([
      Mistake.find(filter).sort(sort).skip(skip).limit(parseInt(limit)),
      Mistake.countDocuments(filter)
    ]);

    res.json({
      success: true,
      count: mistakes.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      mistakes
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/mistakes — create
router.post('/', protect, [
  body('subject').isIn(['Physics','Chemistry','Maths','Biology','English','Computer','Accountancy','Economics','Other']),
  body('whereHappened').trim().notEmpty().isLength({ max: 200 }),
  body('mistakeType').isIn(['Calculation','Concept','Question Reading','Formula','Language','Silly','Time Management','Other']),
  body('whatWentWrong').trim().notEmpty().isLength({ max: 1000 }),
  body('correctMethod').trim().notEmpty().isLength({ max: 1000 }),
  body('howToAvoid').trim().notEmpty().isLength({ max: 500 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

  try {
    const mistake = await Mistake.create({ ...req.body, user: req.user._id });

    // Award points
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalPoints: 10 } });

    // Check and award achievements
    const count = await Mistake.countDocuments({ user: req.user._id });
    const achievements = [];
    if (count === 1) achievements.push('first_mistake');
    if (count === 10) achievements.push('ten_mistakes');
    if (count === 50) achievements.push('fifty_mistakes');
    if (count === 100) achievements.push('hundred_mistakes');

    const subjectCount = await Mistake.distinct('subject', { user: req.user._id });
    if (subjectCount.length >= 6) achievements.push('all_subjects');

    if (achievements.length > 0) {
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { achievements: { $each: achievements } } });
    }

    res.status(201).json({ success: true, message: 'Mistake logged! +10 points 🎯', mistake });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/mistakes/due — get mistakes due for revision
router.get('/due', protect, async (req, res) => {
  try {
    const mistakes = await Mistake.find({
      user: req.user._id,
      nextRevisionDate: { $lte: new Date() }
    }).sort('nextRevisionDate').limit(20);
    res.json({ success: true, count: mistakes.length, mistakes });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/mistakes/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const mistake = await Mistake.findOne({ _id: req.params.id, user: req.user._id });
    if (!mistake) return res.status(404).json({ success: false, message: 'Mistake not found.' });
    res.json({ success: true, mistake });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PUT /api/mistakes/:id — update
router.put('/:id', protect, async (req, res) => {
  try {
    const allowed = ['subject','topic','whereHappened','mistakeType','severity','whatWentWrong','correctMethod','howToAvoid','tags','isFavorite'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const mistake = await Mistake.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true, runValidators: true }
    );
    if (!mistake) return res.status(404).json({ success: false, message: 'Mistake not found.' });
    res.json({ success: true, message: 'Updated!', mistake });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PUT /api/mistakes/:id/revise — mark as revised (spaced repetition)
router.put('/:id/revise', protect, async (req, res) => {
  try {
    const mistake = await Mistake.findOne({ _id: req.params.id, user: req.user._id });
    if (!mistake) return res.status(404).json({ success: false, message: 'Mistake not found.' });

    mistake.scheduleNextRevision();
    if (req.body.notes) mistake.revisionHistory[mistake.revisionHistory.length - 1].notes = req.body.notes;
    await mistake.save();

    await User.findByIdAndUpdate(req.user._id, { $inc: { totalPoints: 5 } });
    res.json({ success: true, message: 'Revision marked! +5 points ✅', mistake });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE /api/mistakes/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const mistake = await Mistake.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!mistake) return res.status(404).json({ success: false, message: 'Mistake not found.' });
    res.json({ success: true, message: 'Mistake deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE /api/mistakes — delete all for user
router.delete('/', protect, async (req, res) => {
  try {
    await Mistake.deleteMany({ user: req.user._id });
    res.json({ success: true, message: 'All mistakes deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
