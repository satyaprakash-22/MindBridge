const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const { detectCrisis } = require('../utils/crisisDetection');
const { getAIResponse, generateCaseSummary, isGroqConfigured } = require('../utils/claudeAPI');
const { getAllowedGoogleDomains, isAllowedGoogleEmail } = require('../utils/domainRestriction');
const AI_BRIDGE_ACCESS_ERROR = 'AI Bridge is available only for Google users from allowed domains.';

const canUseAiBridge = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, role: true },
  });

  return Boolean(user && user.role === 'youth' && isAllowedGoogleEmail(user.email));
};

// Start a new chat
router.post('/start', verifyToken, async (req, res) => {
  try {
    const { mentorId } = req.body || {};

    const youthProfile = await prisma.youthProfile.findUnique({ where: { userId: req.userId } });
    if (!youthProfile) {
      return res.status(404).json({ error: 'Youth profile not found' });
    }

    if (!mentorId) {
      const allowed = await canUseAiBridge(req.userId);
      if (!allowed) {
        return res.status(403).json({
          error: `${AI_BRIDGE_ACCESS_ERROR} Allowed domains: ${getAllowedGoogleDomains().join(', ')}`,
        });
      }
    }

    // Continue existing chat for the same youth-mentor pair.
    const existingChat = await prisma.chat.findFirst({
      where: {
        youthId: req.userId,
        mentorId: mentorId || null,
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
        youthId: req.userId,
        mentorId: mentorId || null
      }
    });

    res.json({ chat, continued: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send message and check for crisis
router.post('/message', verifyToken, async (req, res) => {
  try {
    const { chatId, content, sender } = req.body;

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { id: true, youthId: true, mentorId: true },
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    if (chat.youthId !== req.userId && chat.mentorId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!chat.mentorId) {
      const allowed = await canUseAiBridge(req.userId);
      if (!allowed) {
        return res.status(403).json({
          error: `${AI_BRIDGE_ACCESS_ERROR} Allowed domains: ${getAllowedGoogleDomains().join(', ')}`,
        });
      }
    }

    // Detect crisis keywords
    const crisisDetection = detectCrisis(content);

    // Save message
    const message = await prisma.chatMessage.create({
      data: {
        chatId,
        sender,
        content
      }
    });

    // If crisis detected, create flag
    if (crisisDetection.isCrisis) {
      const flag = await prisma.crisisFlag.create({
        data: {
          youthId: req.userId,
          reason: `Crisis keyword detected: ${crisisDetection.keywords.join(', ')}`,
          severity: crisisDetection.score
        }
      });

      return res.json({
        message,
        crisisAlert: {
          detected: true,
          flag,
          message: 'Please reach out to a helpline immediately. You are not alone.'
        }
      });
    }

    // If mentor not available, use AI response
    let aiResponse = null;
    if (!chat.mentorId) {
      // Get recent messages for context
      const recentMessages = await prisma.chatMessage.findMany({
        where: { chatId },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      const youthProfile = await prisma.youthProfile.findUnique({
        where: { userId: chat.youthId },
        select: { selectedIssues: true },
      });
      const context = (youthProfile?.selectedIssues || []).join(', ');

      aiResponse = await getAIResponse(recentMessages.reverse(), context);

      // Save AI response
      await prisma.chatMessage.create({
        data: {
          chatId,
          sender: 'ai',
          content: aiResponse
        }
      });
    }

    res.json({
      message,
      aiResponse: aiResponse ? { sender: 'ai', content: aiResponse } : null
    });
  } catch (error) {
    console.error('Chat message error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get youth chats
router.get('/user/chats', verifyToken, async (req, res) => {
  try {
    const chats = await prisma.chat.findMany({
      where: { youthId: req.userId },
      include: {
        messages: { take: 1, orderBy: { createdAt: 'desc' } },
        mentor: { select: { email: true, username: true } }
      },
      orderBy: { startedAt: 'desc' }
    });

    res.json({ chats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get chat history
router.get('/:chatId', verifyToken, async (req, res) => {
  try {
    const chat = await prisma.chat.findUnique({
      where: { id: req.params.chatId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        },
        mentor: {
          select: { id: true, email: true, username: true }
        }
      }
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    if (chat.youthId !== req.userId && chat.mentorId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json({ chat });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// End chat and generate summary
router.post('/:chatId/end', verifyToken, async (req, res) => {
  try {
    const { sessionNotes } = req.body;

    const chat = await prisma.chat.findUnique({
      where: { id: req.params.chatId },
      include: {
        messages: true
      }
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    if (chat.youthId !== req.userId && chat.mentorId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Generate summary
    const chatHistory = chat.messages.map(m => `${m.sender}: ${m.content}`).join('\n');
    const youthProfile = await prisma.youthProfile.findUnique({
      where: { userId: chat.youthId }
    });

    let summary = null;
    if (isGroqConfigured()) {
      summary = await generateCaseSummary(chatHistory, youthProfile.selectedIssues);
    }

    const updated = await prisma.chat.update({
      where: { id: req.params.chatId },
      data: {
        endedAt: new Date(),
        sessionNotes: sessionNotes || summary
      }
    });

    if (chat.mentorId && !chat.endedAt) {
      const youthForAssignment = await prisma.youthProfile.findUnique({
        where: { userId: chat.youthId },
        select: { id: true },
      });

      await prisma.mentorProfile.updateMany({
        where: { userId: chat.mentorId },
        data: {
          totalSessions: {
            increment: 1,
          },
        },
      });

      if (youthForAssignment) {
        await prisma.assignment.updateMany({
          where: {
            mentorId: chat.mentorId,
            youthId: youthForAssignment.id,
          },
          data: {
            sessionCount: {
              increment: 1,
            },
          },
        });
      }
    }

    res.json({
      message: 'Chat ended',
      chat: updated,
      summary
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
