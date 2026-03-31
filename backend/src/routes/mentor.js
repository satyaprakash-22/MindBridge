const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

// Get mentor dashboard
router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    const mentor = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        mentorProfile: true,
        assignedYouth: {
          include: {
            youth: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!mentor || mentor.role !== 'mentor') {
      return res.status(403).json({ error: 'Not a mentor account' });
    }

    const mentorChats = await prisma.chat.findMany({
      where: { mentorId: req.userId },
      include: {
        messages: {
          select: {
            sender: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    const completedChats = mentorChats.filter((chat) => Boolean(chat.endedAt));
    const sessionsDone = mentorChats.length;
    const totalMessages = mentorChats.reduce((sum, chat) => sum + chat.messages.length, 0);
    const avgMessagesPerSession = sessionsDone > 0 ? totalMessages / sessionsDone : 0;

    const responseMinutes = [];
    mentorChats.forEach((chat) => {
      for (let i = 0; i < chat.messages.length; i += 1) {
        const current = chat.messages[i];
        if (current.sender !== 'youth') {
          continue;
        }

        for (let j = i + 1; j < chat.messages.length; j += 1) {
          const reply = chat.messages[j];
          if (reply.sender !== 'mentor') {
            continue;
          }

          const diffMs = new Date(reply.createdAt).getTime() - new Date(current.createdAt).getTime();
          if (diffMs > 0) {
            responseMinutes.push(diffMs / (1000 * 60));
          }
          break;
        }
      }
    });

    const avgResponseMinutesRaw = responseMinutes.length
      ? responseMinutes.reduce((sum, value) => sum + value, 0) / responseMinutes.length
      : 8;
    const avgResponseMinutes = Math.max(1, Math.round(avgResponseMinutesRaw));

    const storedRating = Number(mentor.mentorProfile?.rating || 0);
    let avgRating = storedRating;
    if (storedRating <= 0 && sessionsDone > 0) {
      const engagementScore = Math.min(2, avgMessagesPerSession / 12);
      const responsivenessBonus = Math.max(0, 1.2 - (avgResponseMinutesRaw / 20));
      const experienceBonus = Math.min(1, sessionsDone / 15);
      const inferredRating = 2 + engagementScore + responsivenessBonus + experienceBonus;
      avgRating = Number(Math.max(1, Math.min(5, inferredRating)).toFixed(1));
    }

    if (mentor.mentorProfile) {
      const needsSessionSync = mentor.mentorProfile.totalSessions !== sessionsDone;
      const needsRatingSync = storedRating <= 0 && avgRating > 0 && avgRating !== storedRating;

      if (needsSessionSync || needsRatingSync) {
        await prisma.mentorProfile.update({
          where: { id: mentor.mentorProfile.id },
          data: {
            totalSessions: sessionsDone,
            ...(needsRatingSync ? { rating: avgRating } : {}),
          },
        });
      }
    }

    const profile = {
      ...(mentor.mentorProfile || {}),
      totalSessions: sessionsDone,
      rating: avgRating,
    };

    res.json({
      mentor: {
        id: mentor.id,
        email: mentor.email,
        profile
      },
      assignedYouth: mentor.assignedYouth,
      metrics: {
        sessionsDone,
        avgRating,
        avgResponseMinutes,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start or continue mentor chat with a youth user
router.post('/chat/start', verifyToken, async (req, res) => {
  try {
    const { youthUserId } = req.body;

    if (!youthUserId) {
      return res.status(400).json({ error: 'youthUserId is required' });
    }

    const assignment = await prisma.assignment.findFirst({
      where: {
        mentorId: req.userId,
        youth: {
          userId: youthUserId,
        }
      }
    });

    if (!assignment) {
      return res.status(403).json({ error: 'This youth is not assigned to you' });
    }

    const existingChat = await prisma.chat.findFirst({
      where: {
        youthId: youthUserId,
        mentorId: req.userId,
      },
      orderBy: { startedAt: 'desc' },
    });

    if (existingChat) {
      const reopened = existingChat.endedAt
        ? await prisma.chat.update({
            where: { id: existingChat.id },
            data: { endedAt: null },
          })
        : existingChat;

      return res.json({ chat: reopened, continued: true });
    }

    const chat = await prisma.chat.create({
      data: {
        youthId: youthUserId,
        mentorId: req.userId,
      }
    });

    res.json({ chat, continued: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle availability
router.post('/toggle-availability', verifyToken, async (req, res) => {
  try {
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: req.userId }
    });

    if (!mentorProfile) {
      return res.status(404).json({ error: 'Mentor profile not found' });
    }

    const updated = await prisma.mentorProfile.update({
      where: { id: mentorProfile.id },
      data: { isAvailable: !mentorProfile.isAvailable }
    });

    res.json({ message: 'Availability updated', profile: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get assigned youth details
router.get('/youth/:youthId', verifyToken, async (req, res) => {
  try {
    const youthProfile = await prisma.youthProfile.findUnique({
      where: { id: req.params.youthId },
      include: {
        user: {
          include: {
            caseHistory: true,
            moodLogs: {
              take: 20,
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });

    res.json({ youth: youthProfile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update session notes
router.post('/session-notes/:assignmentId', verifyToken, async (req, res) => {
  try {
    const { sessionNotes } = req.body;

    const assignment = await prisma.assignment.findUnique({
      where: { id: req.params.assignmentId }
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    if (assignment.mentorId !== req.userId) {
      return res.status(403).json({ error: 'Not your assignment' });
    }

    const youthProfile = await prisma.youthProfile.findUnique({
      where: { id: assignment.youthId }
    });

    if (!youthProfile) {
      return res.status(404).json({ error: 'Youth profile not found' });
    }

    const caseHistory = await prisma.caseHistory.findUnique({
      where: { userId: youthProfile.userId }
    });

    if (!caseHistory) {
      return res.status(404).json({ error: 'Case history not found' });
    }

    const updated = await prisma.caseHistory.update({
      where: { id: caseHistory.id },
      data: {
        sessionNotes: [...caseHistory.sessionNotes, sessionNotes]
      }
    });

    res.json({ message: 'Session notes saved', caseHistory: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
