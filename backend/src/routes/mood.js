const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

// Log mood
router.post('/log', verifyToken, async (req, res) => {
  try {
    const { mood, journal } = req.body;

    if (!mood || mood < 1 || mood > 5) {
      return res.status(400).json({ error: 'Invalid mood value (1-5)' });
    }

    const moodLog = await prisma.moodLog.create({
      data: {
        userId: req.userId,
        mood,
        journal: journal || null
      }
    });

    res.json({
      message: 'Mood logged successfully',
      moodLog
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get mood history
router.get('/history', verifyToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const moodLogs = await prisma.moodLog.findMany({
      where: {
        userId: req.userId,
        createdAt: {
          gte: startDate
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ moodLogs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get mood stats
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const moodLogs = await prisma.moodLog.findMany({
      where: {
        userId: req.userId,
        createdAt: {
          gte: startDate
        }
      }
    });

    const moodCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalMood = 0;

    moodLogs.forEach(log => {
      moodCounts[log.mood]++;
      totalMood += log.mood;
    });

    const averageMood = moodLogs.length > 0 ? (totalMood / moodLogs.length).toFixed(2) : 0;
    const trend = moodLogs.length > 1 ? (moodLogs[0].mood - moodLogs[moodLogs.length - 1].mood) : 0;

    res.json({
      stats: {
        totalLogs: moodLogs.length,
        averageMood,
        distribution: moodCounts,
        trend: trend > 0 ? 'improving' : trend < 0 ? 'declining' : 'stable',
        trendScore: trend
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
