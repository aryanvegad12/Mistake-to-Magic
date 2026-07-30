const express = require('express');
const router = express.Router();
const Mistake = require('../models/Mistake');
const { protect } = require('../middleware/auth');

// Students are in India — bucket "days" by IST, not by the server's UTC clock,
// so a mistake logged at 1 AM IST counts towards that day and not the previous one.
const TZ = 'Asia/Kolkata';
const dayKey = (date) => date.toLocaleDateString('en-CA', { timeZone: TZ }); // YYYY-MM-DD

// GET /api/analytics/summary
router.get('/summary', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const weekAgo = new Date(now - 7 * 86400000);
    const monthAgo = new Date(now - 30 * 86400000);

    const [total, thisWeek, thisMonth, dueForRevision] = await Promise.all([
      Mistake.countDocuments({ user: userId }),
      Mistake.countDocuments({ user: userId, createdAt: { $gte: weekAgo } }),
      Mistake.countDocuments({ user: userId, createdAt: { $gte: monthAgo } }),
      Mistake.countDocuments({ user: userId, nextRevisionDate: { $lte: now } })
    ]);

    // By subject
    const bySubject = await Mistake.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$subject', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // By type
    const byType = await Mistake.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$mistakeType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // By severity
    const bySeverity = await Mistake.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);

    // Last 7 days trend — one grouped query instead of seven counts
    const trendAgg = await Mistake.aggregate([
      { $match: { user: userId, createdAt: { $gte: weekAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: TZ } }, count: { $sum: 1 } } }
    ]);
    const trendByDay = new Map(trendAgg.map(d => [d._id, d.count]));

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now - i * 86400000);
      last7Days.push({
        date: day.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', timeZone: TZ }),
        count: trendByDay.get(dayKey(day)) || 0
      });
    }

    // Top weakest subjects (most mistakes in last 30 days)
    const recentBySubject = await Mistake.aggregate([
      { $match: { user: userId, createdAt: { $gte: monthAgo } } },
      { $group: { _id: '$subject', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]);

    res.json({
      success: true,
      summary: { total, thisWeek, thisMonth, dueForRevision },
      bySubject, byType, bySeverity, last7Days,
      weakestSubjects: recentBySubject
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/analytics/heatmap — mistake count by day (last 90 days)
router.get('/heatmap', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000);
    const data = await Mistake.aggregate([
      { $match: { user: userId, createdAt: { $gte: ninetyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: TZ } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    res.json({ success: true, heatmap: data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
