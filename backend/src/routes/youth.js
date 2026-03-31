const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const { findBestMentor, rankMentors, calculateMatchScore, getIssueMatches } = require('../utils/mentorMatching');

const formatMentor = (item) => ({
  mentorId: item.mentor.userId,
  name: item.mentor.user?.username || 'Volunteer Mentor',
  email: item.mentor.user?.email || '',
  expertise: item.mentor.expertise || [],
  matchScore: item.score,
  matchedIssues: item.matchedIssues,
  totalSessions: item.mentor.totalSessions || 0,
  rating: item.mentor.rating || 0,
  isAvailable: item.mentor.isAvailable,
});

// Get youth dashboard data
router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        youthProfile: true,
        moodLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!user || user.role !== 'youth') {
      return res.status(403).json({ error: 'Not a youth account' });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        profile: user.youthProfile
      },
      recentMoods: user.moodLogs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger mentor matching
router.post('/request-mentor', verifyToken, async (req, res) => {
  try {
    const youthProfile = await prisma.youthProfile.findUnique({
      where: { userId: req.userId }
    });

    if (!youthProfile) {
      return res.status(404).json({ error: 'Youth profile not found' });
    }

    // Find available mentors
    const availableMentors = await prisma.mentorProfile.findMany({
      where: { isAvailable: true },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          }
        }
      }
    });

    if (availableMentors.length === 0) {
      return res.status(503).json({ error: 'No mentors available at the moment' });
    }

    const match = findBestMentor(youthProfile, availableMentors);

    if (!match) {
      return res.status(503).json({ error: 'No suitable mentor found' });
    }

    // Create or replace assignment for this youth
    const assignment = await prisma.assignment.upsert({
      where: { youthId: youthProfile.id },
      update: {
        mentorId: match.mentor.userId,
        matchScore: match.score,
        status: 'active'
      },
      create: {
        mentorId: match.mentor.userId,
        youthId: youthProfile.id,
        matchScore: match.score
      }
    });

    res.json({
      message: 'Mentor matched successfully',
      assignment,
      mentor: {
        mentorId: match.mentor.userId,
        name: match.mentor.user?.username || 'Volunteer Mentor',
        expertise: match.mentor.expertise || [],
        matchedIssues: match.matchedIssues || getIssueMatches(youthProfile, match.mentor),
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get matched mentors list for youth selection
router.get('/matched-mentors', verifyToken, async (req, res) => {
  try {
    const youthProfile = await prisma.youthProfile.findUnique({
      where: { userId: req.userId }
    });

    if (!youthProfile) {
      return res.status(404).json({ error: 'Youth profile not found' });
    }

    const availableMentors = await prisma.mentorProfile.findMany({
      where: { isAvailable: true },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          }
        }
      }
    });

    const previousChats = await prisma.chat.findMany({
      where: {
        youthId: req.userId,
        mentorId: { not: null },
      },
      select: {
        mentorId: true,
        startedAt: true,
      },
      orderBy: { startedAt: 'desc' },
    });

    const previousMentorMeta = new Map();
    for (const c of previousChats) {
      if (!c.mentorId) {
        continue;
      }

      if (!previousMentorMeta.has(c.mentorId)) {
        previousMentorMeta.set(c.mentorId, {
          lastChatAt: c.startedAt,
          chatCount: 1,
        });
      } else {
        const existing = previousMentorMeta.get(c.mentorId);
        existing.chatCount += 1;
      }
    }

    const rankedMentors = rankMentors(youthProfile, availableMentors);
    const rankedIds = new Set(rankedMentors.map((item) => item.mentor.userId));

    const previousMentorIds = Array.from(previousMentorMeta.keys());
    const previousProfiles = previousMentorIds.length
      ? await prisma.mentorProfile.findMany({
          where: {
            userId: { in: previousMentorIds },
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              }
            }
          }
        })
      : [];

    const previousMentors = previousProfiles
      .map((mentor) => {
        const meta = previousMentorMeta.get(mentor.userId);
        const score = calculateMatchScore(youthProfile, mentor);
        const matchedIssues = getIssueMatches(youthProfile, mentor);

        return {
          mentorId: mentor.userId,
          name: mentor.user?.username || 'Volunteer Mentor',
          email: mentor.user?.email || '',
          expertise: mentor.expertise || [],
          matchScore: score,
          matchedIssues,
          totalSessions: mentor.totalSessions || 0,
          rating: mentor.rating || 0,
          isAvailable: mentor.isAvailable,
          lastChatAt: meta?.lastChatAt || null,
          chatCount: meta?.chatCount || 0,
          hasHistory: true,
        };
      })
      .sort((a, b) => {
        const aTime = a.lastChatAt ? new Date(a.lastChatAt).getTime() : 0;
        const bTime = b.lastChatAt ? new Date(b.lastChatAt).getTime() : 0;
        return bTime - aTime;
      });

    const matchedMentors = rankedMentors.map((item) => {
      const meta = previousMentorMeta.get(item.mentor.userId);
      return {
        ...formatMentor(item),
        hasHistory: Boolean(meta),
        lastChatAt: meta?.lastChatAt || null,
        chatCount: meta?.chatCount || 0,
      };
    });

    const previousIds = new Set(previousMentors.map((mentor) => mentor.mentorId));
    const otherVolunteers = availableMentors
      .filter((mentor) => !rankedIds.has(mentor.userId) && !previousIds.has(mentor.userId))
      .map((mentor) => ({
        mentorId: mentor.userId,
        name: mentor.user?.username || 'Volunteer Mentor',
        email: mentor.user?.email || '',
        expertise: mentor.expertise || [],
        matchScore: 0,
        matchedIssues: [],
        totalSessions: mentor.totalSessions || 0,
        rating: mentor.rating || 0,
        isAvailable: mentor.isAvailable,
        hasHistory: false,
        lastChatAt: null,
        chatCount: 0,
      }));

    res.json({
      mentors: matchedMentors,
      previousMentors,
      matchedMentors,
      otherVolunteers,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign a selected mentor to youth
router.post('/assign-mentor', verifyToken, async (req, res) => {
  try {
    const { mentorId } = req.body;

    if (!mentorId) {
      return res.status(400).json({ error: 'mentorId is required' });
    }

    const youthProfile = await prisma.youthProfile.findUnique({
      where: { userId: req.userId }
    });

    if (!youthProfile) {
      return res.status(404).json({ error: 'Youth profile not found' });
    }

    const mentor = await prisma.mentorProfile.findUnique({
      where: { userId: mentorId },
      include: {
        user: {
          select: {
            username: true,
            email: true,
          }
        }
      }
    });

    if (!mentor || !mentor.isAvailable) {
      return res.status(404).json({ error: 'Selected mentor is unavailable' });
    }

    const matchScore = calculateMatchScore(youthProfile, mentor);
    if (matchScore === 0) {
      return res.status(400).json({ error: 'Selected mentor does not match youth feeling domains' });
    }

    const assignment = await prisma.assignment.upsert({
      where: { youthId: youthProfile.id },
      update: {
        mentorId,
        matchScore,
        status: 'active',
      },
      create: {
        mentorId,
        youthId: youthProfile.id,
        matchScore,
      },
    });

    res.json({
      message: 'Mentor assigned successfully',
      assignment,
      mentor: {
        mentorId,
        name: mentor.user?.username || 'Volunteer Mentor',
        expertise: mentor.expertise || [],
        matchedIssues: getIssueMatches(youthProfile, mentor),
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get assigned mentor
router.get('/assigned-mentor', verifyToken, async (req, res) => {
  try {
    const youthProfile = await prisma.youthProfile.findUnique({
      where: { userId: req.userId }
    });

    const assignment = await prisma.assignment.findUnique({
      where: { youthId: youthProfile.id },
      include: {
        mentor: {
          include: { mentorProfile: true }
        }
      }
    });

    res.json({ assignment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Track youth resource exploration activity
router.post('/activity/resource-explore', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, role: true, username: true },
    });

    if (!user || user.role !== 'youth') {
      return res.status(403).json({ error: 'Not a youth account' });
    }

    await prisma.user.update({
      where: { id: req.userId },
      data: {
        username: user.username,
      },
    });

    res.json({ message: 'Resource activity tracked' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
