const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('../middleware/auth');
const { generateCaseSummary } = require('../utils/claudeAPI');

const prisma = new PrismaClient();

const CASE_STATUSES = ['Active', 'Monitoring', 'Resolved', 'Escalated'];
const BLOG_STORE_PATH = path.resolve(__dirname, '../../data/blog-posts.json');

const parseMentorMeta = (credentials) => {
  if (!credentials || typeof credentials !== 'string') {
    return { approvalStatus: 'approved' };
  }

  try {
    const parsed = JSON.parse(credentials);
    const status = parsed?.approvalStatus;
    if (status === 'pending' || status === 'approved' || status === 'rejected') {
      return parsed;
    }
  } catch (error) {
    return { approvalStatus: 'approved' };
  }

  return { approvalStatus: 'approved' };
};

const toMentorCredentials = (meta) => JSON.stringify(meta);

const getDateKey = (dateValue) => {
  const date = new Date(dateValue);
  return date.toISOString().slice(0, 10);
};

const ensureBlogStore = () => {
  const folder = path.dirname(BLOG_STORE_PATH);
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }

  if (!fs.existsSync(BLOG_STORE_PATH)) {
    fs.writeFileSync(BLOG_STORE_PATH, '[]', 'utf8');
  }
};

const readBlogPosts = () => {
  ensureBlogStore();
  try {
    const raw = fs.readFileSync(BLOG_STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const writeBlogPosts = (posts) => {
  ensureBlogStore();
  fs.writeFileSync(BLOG_STORE_PATH, JSON.stringify(posts, null, 2), 'utf8');
};

const requireAdmin = async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user || user.role !== 'admin') {
    res.status(403).json({ error: 'Unauthorized' });
    return null;
  }
  return user;
};

const buildOverview = async () => {
  const activityWindowStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const heatmapWindowStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalYouth,
    totalVolunteers,
    pendingVolunteers,
    approvedVolunteers,
    baselineYouthBeforeWindow,
    baselineVolunteersBeforeWindow,
    activeChats,
    totalSessions,
    activeCrisisFlags,
    crisisFlags,
    activeMentors,
    moodLogs,
    recentChats,
    recentMessages,
    monthMessages,
    monthChats,
    monthUsers,
    recentUsers,
  ] = await Promise.all([
    prisma.youthProfile.count(),
    prisma.mentorProfile.count(),
    prisma.mentorProfile.count({
      where: {
        credentials: {
          contains: '"approvalStatus":"pending"',
        },
      },
    }),
    prisma.mentorProfile.count({
      where: {
        OR: [
          {
            credentials: {
              contains: '"approvalStatus":"approved"',
            },
          },
          {
            credentials: null,
          },
        ],
      },
    }),
    prisma.user.count({
      where: {
        role: 'youth',
        createdAt: { lt: activityWindowStart },
      },
    }),
    prisma.user.count({
      where: {
        role: 'mentor',
        createdAt: { lt: activityWindowStart },
      },
    }),
    prisma.chat.count({ where: { endedAt: null } }),
    prisma.chat.count(),
    prisma.crisisFlag.count({ where: { status: { in: ['new', 'reviewed'] } } }),
    prisma.crisisFlag.findMany({ orderBy: { createdAt: 'desc' }, take: 15 }),
    prisma.mentorProfile.findMany({
      where: { isAvailable: true },
      include: { user: { select: { id: true, username: true, email: true } } },
      take: 20,
    }),
    prisma.moodLog.findMany({
      where: { createdAt: { gte: heatmapWindowStart } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.chat.findMany({
      where: { startedAt: { gte: activityWindowStart } },
      select: { startedAt: true },
    }),
    prisma.chatMessage.findMany({
      where: { createdAt: { gte: activityWindowStart } },
      select: { createdAt: true },
    }),
    prisma.chatMessage.findMany({
      where: { createdAt: { gte: heatmapWindowStart } },
      select: { createdAt: true },
    }),
    prisma.chat.findMany({
      where: { startedAt: { gte: heatmapWindowStart } },
      select: { startedAt: true },
    }),
    prisma.user.findMany({
      where: {
        OR: [
          { createdAt: { gte: heatmapWindowStart } },
          { updatedAt: { gte: heatmapWindowStart } },
        ],
        role: { in: ['youth', 'mentor'] },
      },
      select: { createdAt: true, updatedAt: true },
    }),
    prisma.user.findMany({
      where: {
        OR: [
          { createdAt: { gte: activityWindowStart } },
          { updatedAt: { gte: activityWindowStart } },
        ],
        role: { in: ['youth', 'mentor'] },
      },
      select: { createdAt: true, updatedAt: true, role: true },
    }),
  ]);

  const moodHeatmapMap = new Map();
  moodLogs.forEach((log) => {
    const key = getDateKey(log.createdAt);
    const current = moodHeatmapMap.get(key) || {
      date: key,
      moodCount: 0,
      totalMood: 0,
      engagementCount: 0,
    };
    current.moodCount += 1;
    current.totalMood += log.mood;
    moodHeatmapMap.set(key, current);
  });

  monthMessages.forEach((message) => {
    const key = getDateKey(message.createdAt);
    const current = moodHeatmapMap.get(key) || {
      date: key,
      moodCount: 0,
      totalMood: 0,
      engagementCount: 0,
    };
    current.engagementCount += 1;
    moodHeatmapMap.set(key, current);
  });

  monthChats.forEach((chat) => {
    const key = getDateKey(chat.startedAt);
    const current = moodHeatmapMap.get(key) || {
      date: key,
      moodCount: 0,
      totalMood: 0,
      engagementCount: 0,
    };
    current.engagementCount += 1;
    moodHeatmapMap.set(key, current);
  });

  monthUsers.forEach((user) => {
    const eventDate = user.updatedAt && user.updatedAt > user.createdAt ? user.updatedAt : user.createdAt;
    const key = getDateKey(eventDate);
    const current = moodHeatmapMap.get(key) || {
      date: key,
      moodCount: 0,
      totalMood: 0,
      engagementCount: 0,
    };
    current.engagementCount += 1;
    moodHeatmapMap.set(key, current);
  });

  const moodHeatmap = Array.from(moodHeatmapMap.values()).map((entry) => ({
    date: entry.date,
    count: entry.moodCount > 0 ? entry.moodCount : entry.engagementCount,
    moodCount: entry.moodCount,
    engagementCount: entry.engagementCount,
    hasMoodData: entry.moodCount > 0,
    avgMood: Number(((entry.moodCount > 0 ? entry.totalMood / entry.moodCount : 3)).toFixed(2)),
  }));

  const activityMap = new Map();
  recentChats.forEach((chat) => {
    const key = getDateKey(chat.startedAt);
    const current = activityMap.get(key) || {
      date: key,
      sessions: 0,
      messages: 0,
      newUsers: 0,
      newVolunteers: 0,
      totalUsers: 0,
      totalVolunteers: 0,
    };
    current.sessions += 1;
    activityMap.set(key, current);
  });

  recentMessages.forEach((message) => {
    const key = getDateKey(message.createdAt);
    const current = activityMap.get(key) || {
      date: key,
      sessions: 0,
      messages: 0,
      newUsers: 0,
      newVolunteers: 0,
      totalUsers: 0,
      totalVolunteers: 0,
    };
    current.messages += 1;
    activityMap.set(key, current);
  });

  recentUsers.forEach((user) => {
    const eventDate = user.updatedAt && user.updatedAt > user.createdAt ? user.updatedAt : user.createdAt;
    const key = getDateKey(eventDate);
    const current = activityMap.get(key) || {
      date: key,
      sessions: 0,
      messages: 0,
      newUsers: 0,
      newVolunteers: 0,
      totalUsers: 0,
      totalVolunteers: 0,
    };
    if (user.role === 'youth') {
      current.newUsers += 1;
    }
    if (user.role === 'youth') {
      // Youth users are counted in newUsers for admin graph.
    }
    if (user.role === 'mentor') {
      current.newVolunteers += 1;
    }
    activityMap.set(key, current);
  });

  const activityByDay = Array.from(activityMap.values())
    .sort((a, b) => a.date.localeCompare(b.date));

  let runningUsers = baselineYouthBeforeWindow;
  let runningVolunteers = baselineVolunteersBeforeWindow;
  activityByDay.forEach((entry) => {
    runningUsers += entry.newUsers;
    runningVolunteers += entry.newVolunteers;
    entry.totalUsers = runningUsers;
    entry.totalVolunteers = runningVolunteers;
  });

  return {
    stats: {
      totalYouth,
      totalVolunteers,
      pendingVolunteers,
      approvedVolunteers,
      activeChats,
      totalSessions,
      activeCrisisFlags,
    },
    crisisFlags,
    activeMentors,
    moodHeatmap,
    activityByDay,
  };
};

const buildVolunteerOverview = async () => {
  const mentors = await prisma.mentorProfile.findMany({
    include: {
      user: { select: { id: true, username: true, email: true, createdAt: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const activeAssignmentsByMentor = await prisma.assignment.groupBy({
    by: ['mentorId'],
    where: { status: 'active' },
    _count: { _all: true },
  });

  const activeAssignmentsMap = new Map(
    activeAssignmentsByMentor.map((item) => [item.mentorId, item._count._all])
  );

  const mentorUserIds = mentors.map((m) => m.userId);
  const chats = mentorUserIds.length
    ? await prisma.chat.findMany({
        where: { mentorId: { in: mentorUserIds } },
        include: {
          youth: { select: { id: true, username: true } },
        },
        orderBy: { startedAt: 'desc' },
      })
    : [];

  const messages = chats.length
    ? await prisma.chatMessage.findMany({
        where: { chatId: { in: chats.map((chat) => chat.id) } },
        select: { chatId: true },
      })
    : [];

  const messageCountByChat = messages.reduce((acc, item) => {
    acc[item.chatId] = (acc[item.chatId] || 0) + 1;
    return acc;
  }, {});

  return mentors.map((mentor) => {
    const mentorMeta = parseMentorMeta(mentor.credentials);
    const mentorChats = chats.filter((chat) => chat.mentorId === mentor.userId);
    const sessions = mentorChats.map((chat) => ({
      chatId: chat.id,
      youthId: chat.youthId,
      youthName: chat.youth?.username || 'Unknown youth',
      startedAt: chat.startedAt,
      endedAt: chat.endedAt,
      messageCount: messageCountByChat[chat.id] || 0,
      sessionNotes: chat.sessionNotes || '',
    }));

    const completedSessions = sessions.filter((session) => Boolean(session.endedAt)).length;
    const avgMessagesPerSession = sessions.length === 0
      ? 0
      : Number((sessions.reduce((sum, s) => sum + s.messageCount, 0) / sessions.length).toFixed(2));

    return {
      id: mentor.id,
      userId: mentor.userId,
      approvalStatus: mentorMeta.approvalStatus || 'approved',
      user: mentor.user,
      expertise: mentor.expertise || [],
      isAvailable: mentor.isAvailable,
      rating: mentor.rating,
      totalSessions: mentor.totalSessions,
      activeAssignments: activeAssignmentsMap.get(mentor.userId) || 0,
      performance: {
        totalSessions: sessions.length,
        completedSessions,
        avgMessagesPerSession,
      },
      sessions,
    };
  });
};

const resolveCaseStatus = (progress) => {
  if (!progress || typeof progress !== 'string') {
    return 'Active';
  }

  return CASE_STATUSES.includes(progress) ? progress : 'Active';
};

const buildCaseDetails = async (youthUserId) => {
  const youthProfile = await prisma.youthProfile.findUnique({
    where: { userId: youthUserId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          createdAt: true,
          moodLogs: { orderBy: { createdAt: 'desc' }, take: 50 },
          caseHistory: true,
        },
      },
      assignedMentor: {
        include: {
          mentor: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!youthProfile) {
    return null;
  }

  const chats = await prisma.chat.findMany({
    where: { youthId: youthUserId },
    include: {
      mentor: { select: { id: true, username: true, email: true } },
      messages: { orderBy: { createdAt: 'asc' } },
    },
    orderBy: { startedAt: 'desc' },
  });

  const moodTrend = youthProfile.user.moodLogs
    .map((m) => ({ date: m.createdAt, mood: m.mood, journal: m.journal }))
    .reverse();

  return {
    youth: {
      id: youthProfile.user.id,
      username: youthProfile.user.username,
      email: youthProfile.user.email,
      ageBracket: youthProfile.ageBracket,
      city: youthProfile.city,
      selectedIssues: youthProfile.selectedIssues,
      language: youthProfile.language,
      supportStyle: youthProfile.supportStyle,
      createdAt: youthProfile.user.createdAt,
    },
    assignment: youthProfile.assignedMentor
      ? {
          id: youthProfile.assignedMentor.id,
          status: youthProfile.assignedMentor.status,
          mentor: youthProfile.assignedMentor.mentor,
          matchScore: youthProfile.assignedMentor.matchScore,
        }
      : null,
    caseStatus: resolveCaseStatus(youthProfile.user.caseHistory?.progress),
    caseHistory: youthProfile.user.caseHistory,
    moodTrend,
    chats,
  };
};

const toCsv = (rows) => rows
  .map((row) => row
    .map((value) => {
      const stringValue = String(value ?? '');
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    })
    .join(','))
  .join('\n');

const isAiConfigured = () => (
  process.env.CLAUDE_API_KEY
  && process.env.CLAUDE_API_KEY !== 'sk-ant-v4-your-key-here'
);

// Get admin dashboard
router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) {
      return;
    }

    const overview = await buildOverview();
    res.json(overview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Volunteer management overview
router.get('/volunteers', verifyToken, async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) {
      return;
    }

    const volunteers = await buildVolunteerOverview();
    res.json({ volunteers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve or reject volunteer
router.post('/volunteers/:mentorUserId/approval', verifyToken, async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) {
      return;
    }

    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }

    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: req.params.mentorUserId },
      include: {
        user: { select: { id: true, username: true, email: true } },
      },
    });

    if (!mentorProfile) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }

    const currentMeta = parseMentorMeta(mentorProfile.credentials);
    const updatedMeta = {
      ...currentMeta,
      approvalStatus: status,
      reviewedAt: new Date().toISOString(),
      reviewedBy: admin.id,
    };

    const updated = await prisma.mentorProfile.update({
      where: { id: mentorProfile.id },
      data: {
        credentials: toMentorCredentials(updatedMeta),
        isAvailable: status === 'approved',
      },
      include: {
        user: { select: { id: true, username: true, email: true } },
      },
    });

    await prisma.adminAction.create({
      data: {
        adminId: admin.id,
        action: `Volunteer ${status}`,
        target: mentorProfile.userId,
      },
    });

    res.json({
      message: `Volunteer ${status}`,
      volunteer: {
        userId: updated.userId,
        user: updated.user,
        approvalStatus: status,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all youth cases (overview)
router.get('/cases', verifyToken, async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) {
      return;
    }

    const youthProfiles = await prisma.youthProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            caseHistory: true,
            moodLogs: { orderBy: { createdAt: 'desc' }, take: 10 },
          },
        },
        assignedMentor: {
          include: {
            mentor: { select: { id: true, username: true, email: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const cases = youthProfiles.map((item) => {
      const moodTrend = item.user.moodLogs.map((m) => ({ mood: m.mood, createdAt: m.createdAt })).reverse();
      return {
        youthUserId: item.userId,
        username: item.user.username,
        selectedIssues: item.selectedIssues,
        language: item.language,
        supportStyle: item.supportStyle,
        caseStatus: resolveCaseStatus(item.user.caseHistory?.progress),
        mentor: item.assignedMentor?.mentor || null,
        moodTrend,
      };
    });

    res.json({ cases, statuses: CASE_STATUSES });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a full youth case
router.get('/cases/:youthUserId', verifyToken, async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) {
      return;
    }

    const details = await buildCaseDetails(req.params.youthUserId);
    if (!details) {
      return res.status(404).json({ error: 'Case not found' });
    }

    res.json(details);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update case status
router.post('/cases/:youthUserId/status', verifyToken, async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) {
      return;
    }

    const { status } = req.body;
    if (!CASE_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${CASE_STATUSES.join(', ')}` });
    }

    const youthProfile = await prisma.youthProfile.findUnique({ where: { userId: req.params.youthUserId } });
    if (!youthProfile) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const updatedCaseHistory = await prisma.caseHistory.upsert({
      where: { userId: req.params.youthUserId },
      update: { progress: status },
      create: {
        userId: req.params.youthUserId,
        sessionNotes: [],
        mentorHistory: [],
        issues: youthProfile.selectedIssues,
        progress: status,
      },
    });

    await prisma.adminAction.create({
      data: {
        adminId: admin.id,
        action: `Case status changed to ${status}`,
        target: req.params.youthUserId,
      },
    });

    res.json({ message: 'Case status updated', caseHistory: updatedCaseHistory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reassign mentor and generate AI handover summary
router.post('/cases/:youthUserId/reassign', verifyToken, async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) {
      return;
    }

    const { mentorUserId } = req.body;
    if (!mentorUserId) {
      return res.status(400).json({ error: 'mentorUserId is required' });
    }

    const youthProfile = await prisma.youthProfile.findUnique({
      where: { userId: req.params.youthUserId },
      include: {
        assignedMentor: true,
      },
    });

    if (!youthProfile) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: mentorUserId },
      include: {
        user: { select: { id: true, username: true, email: true } },
      },
    });

    if (!mentorProfile) {
      return res.status(404).json({ error: 'Selected mentor not found' });
    }

    const mentorMeta = parseMentorMeta(mentorProfile.credentials);
    if (mentorMeta.approvalStatus !== 'approved') {
      return res.status(400).json({ error: 'Selected mentor is not approved by admin' });
    }

    const chats = await prisma.chat.findMany({
      where: { youthId: req.params.youthUserId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 40,
        },
      },
      orderBy: { startedAt: 'desc' },
      take: 3,
    });

    const chatHistory = chats
      .flatMap((chat) => chat.messages)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map((message) => `${message.sender}: ${message.content}`)
      .join('\n');

    let handoverSummary = 'No prior chat history found. Start with a fresh rapport-building session.';
    if (chatHistory && isAiConfigured()) {
      handoverSummary = await generateCaseSummary(chatHistory, youthProfile.selectedIssues || []);
    } else if (chatHistory) {
      handoverSummary = `Handover summary (manual): ${chatHistory.slice(0, 900)}`;
    }

    const assignment = await prisma.assignment.upsert({
      where: { youthId: youthProfile.id },
      update: {
        mentorId: mentorUserId,
        status: 'active',
      },
      create: {
        youthId: youthProfile.id,
        mentorId: mentorUserId,
        matchScore: 50,
        status: 'active',
      },
      include: {
        mentor: { select: { id: true, username: true, email: true } },
      },
    });

    const existingCaseHistory = await prisma.caseHistory.findUnique({ where: { userId: req.params.youthUserId } });
    const mentorLabel = `${mentorProfile.user.username || 'Mentor'} (${mentorProfile.user.email || mentorProfile.userId})`;

    const caseHistory = await prisma.caseHistory.upsert({
      where: { userId: req.params.youthUserId },
      update: {
        mentorHistory: [
          ...(existingCaseHistory?.mentorHistory || []),
          mentorLabel,
        ],
        sessionNotes: [
          ...(existingCaseHistory?.sessionNotes || []),
          `AI Handover Summary (${new Date().toISOString()}): ${handoverSummary}`,
        ],
      },
      create: {
        userId: req.params.youthUserId,
        issues: youthProfile.selectedIssues,
        progress: 'Monitoring',
        mentorHistory: [mentorLabel],
        sessionNotes: [`AI Handover Summary (${new Date().toISOString()}): ${handoverSummary}`],
      },
    });

    await prisma.adminAction.create({
      data: {
        adminId: admin.id,
        action: `Reassigned case to mentor ${mentorUserId}`,
        target: req.params.youthUserId,
      },
    });

    res.json({
      message: 'Mentor reassigned successfully',
      assignment,
      handoverSummary,
      caseHistory,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export admin reports as CSV or PDF
router.get('/reports/export', verifyToken, async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) {
      return;
    }

    const format = (req.query.format || 'csv').toString().toLowerCase();
    if (!['csv', 'pdf'].includes(format)) {
      return res.status(400).json({ error: 'format must be csv or pdf' });
    }

    const overview = await buildOverview();
    const volunteers = await buildVolunteerOverview();
    const casesRes = await prisma.youthProfile.findMany({
      include: {
        user: { include: { caseHistory: true } },
      },
    });

    const caseRows = casesRes.map((item) => ({
      youth: item.user.username,
      status: resolveCaseStatus(item.user.caseHistory?.progress),
      issues: (item.selectedIssues || []).join(' | '),
    }));

    if (format === 'csv') {
      const rows = [
        ['Section', 'Metric', 'Value'],
        ['Overview', 'Total Youth', overview.stats.totalYouth],
        ['Overview', 'Active Chats', overview.stats.activeChats],
        ['Overview', 'Total Sessions', overview.stats.totalSessions],
        ['Overview', 'Active Crisis Flags', overview.stats.activeCrisisFlags],
        ...volunteers.map((v) => ['Volunteer', `${v.user.username} (${v.user.email || 'no-email'})`, `${v.approvalStatus}, sessions=${v.performance.totalSessions}`]),
        ...caseRows.map((c) => ['Case', c.youth, `${c.status}; issues=${c.issues}`]),
      ];

      const csv = toCsv(rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="mindbridge-report-${Date.now()}.csv"`);
      return res.send(csv);
    }

    const doc = new PDFDocument({ margin: 48 });
    const buffers = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => {
      const pdf = Buffer.concat(buffers);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="mindbridge-report-${Date.now()}.pdf"`);
      res.send(pdf);
    });

    doc.fontSize(20).text('MindBridge Admin Report');
    doc.moveDown(0.5);
    doc.fontSize(11).text(`Generated: ${new Date().toISOString()}`);
    doc.moveDown(1);

    doc.fontSize(14).text('Overview Dashboard');
    doc.fontSize(11).text(`Total Youth: ${overview.stats.totalYouth}`);
    doc.fontSize(11).text(`Active Chats: ${overview.stats.activeChats}`);
    doc.fontSize(11).text(`Total Sessions: ${overview.stats.totalSessions}`);
    doc.fontSize(11).text(`Active Crisis Flags: ${overview.stats.activeCrisisFlags}`);
    doc.moveDown(1);

    doc.fontSize(14).text('Volunteer Management');
    volunteers.slice(0, 25).forEach((volunteer, index) => {
      doc.fontSize(10).text(`${index + 1}. ${volunteer.user.username} (${volunteer.user.email || 'no-email'}) - ${volunteer.approvalStatus} - sessions ${volunteer.performance.totalSessions}`);
    });
    doc.moveDown(1);

    doc.fontSize(14).text('Youth Case Status');
    caseRows.slice(0, 30).forEach((row, index) => {
      doc.fontSize(10).text(`${index + 1}. ${row.youth} - ${row.status}`);
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Publish new article/update to About page blog
router.post('/blog/posts', verifyToken, async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) {
      return;
    }

    const { title, content, author } = req.body;
    const normalizedTitle = (title || '').trim();
    const normalizedContent = (content || '').trim();
    const normalizedAuthor = (author || admin.username || admin.email || 'Admin').trim();

    if (!normalizedTitle || !normalizedContent) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const posts = readBlogPosts();
    const now = new Date().toISOString();
    const post = {
      id: `post_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: normalizedTitle,
      content: normalizedContent,
      author: normalizedAuthor,
      createdAt: now,
      updatedAt: now,
    };

    posts.unshift(post);
    writeBlogPosts(posts);

    await prisma.adminAction.create({
      data: {
        adminId: admin.id,
        action: 'Published blog update',
        target: post.id,
      },
    });

    res.json({ message: 'Blog post published', post });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin list of blog posts
router.get('/blog/posts', verifyToken, async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) {
      return;
    }

    const posts = readBlogPosts();
    res.json({ posts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Public blog feed for About page
router.get('/public/blog-posts', async (req, res) => {
  try {
    const posts = readBlogPosts();
    res.json({ posts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Legacy crisis flags list endpoint
router.get('/crisis-flags', verifyToken, async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) {
      return;
    }

    const flags = await prisma.crisisFlag.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ flags });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Legacy crisis flag status update endpoint
router.post('/crisis-flags/:flagId/status', verifyToken, async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) {
      return;
    }

    const { status } = req.body;
    const updated = await prisma.crisisFlag.update({
      where: { id: req.params.flagId },
      data: { status, flaggedBy: req.userId },
    });

    await prisma.adminAction.create({
      data: {
        adminId: admin.id,
        action: 'Update crisis flag status',
        target: req.params.flagId,
      },
    });

    res.json({ message: 'Crisis flag updated', flag: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Legacy analytics endpoint
router.get('/analytics', verifyToken, async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) {
      return;
    }

    const overview = await buildOverview();
    res.json({
      moodHeatmap: overview.moodHeatmap,
      activityByDay: overview.activityByDay,
      recentSessions: overview.stats.totalSessions,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Legacy mentors endpoint
router.get('/mentors', verifyToken, async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) {
      return;
    }

    const volunteers = await buildVolunteerOverview();
    res.json({ mentors: volunteers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
