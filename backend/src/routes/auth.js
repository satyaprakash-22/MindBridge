const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { OAuth2Client } = require('google-auth-library');
const { verifyToken } = require('../middleware/auth');
const { getAllowedGoogleDomains, isAllowedGoogleEmail } = require('../utils/domainRestriction');
const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

const DEFAULT_YOUTH_CONTEXT = {
  ageBracket: '16-18',
  city: 'Not specified',
  language: 'English',
  supportStyle: 'listen',
};

const normalizeString = (value, fallback) => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

const normalizeIssues = (selectedIssues) => {
  if (!Array.isArray(selectedIssues)) {
    return [];
  }

  return selectedIssues
    .filter((issue) => typeof issue === 'string' && issue.trim().length > 0)
    .map((issue) => issue.trim());
};

const normalizeExpertise = (expertise) => {
  if (!Array.isArray(expertise)) {
    return [];
  }

  return expertise
    .filter((item) => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim());
};

const DEFAULT_MENTOR_META = {
  approvalStatus: 'approved',
};

const parseMentorMeta = (credentials) => {
  if (!credentials || typeof credentials !== 'string') {
    return { ...DEFAULT_MENTOR_META };
  }

  try {
    const parsed = JSON.parse(credentials);
    const status = parsed?.approvalStatus;
    if (status === 'pending' || status === 'approved' || status === 'rejected') {
      return {
        ...parsed,
        approvalStatus: status,
      };
    }
  } catch (error) {
    return { ...DEFAULT_MENTOR_META };
  }

  return { ...DEFAULT_MENTOR_META };
};

const toMentorCredentials = (meta) => JSON.stringify(meta);

const ensureMentorApproved = (meta) => {
  if (meta.approvalStatus === 'rejected') {
    return { ok: false, message: 'Volunteer access rejected by admin. Contact NGO admin for review.' };
  }

  if (meta.approvalStatus !== 'approved') {
    return { ok: false, message: 'Volunteer profile created. Awaiting admin approval.' };
  }

  return { ok: true };
};

const upsertYouthContext = async (userId, context = {}) => {
  const payload = {
    ageBracket: normalizeString(context.ageBracket, DEFAULT_YOUTH_CONTEXT.ageBracket),
    city: normalizeString(context.city, DEFAULT_YOUTH_CONTEXT.city),
    selectedIssues: normalizeIssues(context.selectedIssues),
    language: normalizeString(context.language, DEFAULT_YOUTH_CONTEXT.language),
    supportStyle: normalizeString(context.supportStyle, DEFAULT_YOUTH_CONTEXT.supportStyle),
  };

  await prisma.youthProfile.upsert({
    where: { userId },
    update: payload,
    create: {
      userId,
      ...payload,
    },
  });

  await prisma.caseHistory.upsert({
    where: { userId },
    update: {
      issues: payload.selectedIssues,
    },
    create: {
      userId,
      issues: payload.selectedIssues,
    },
  });

  return payload;
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Youth signup/login (anonymous)
router.post('/youth-login', async (req, res) => {
  try {
    const { username, ageBracket, city, selectedIssues, language, supportStyle } = req.body;
    const normalizedUsername = (username || '').trim();

    if (!normalizedUsername) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Create or find youth user
    let user = await prisma.user.findFirst({
      where: { username: normalizedUsername }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          username: normalizedUsername,
          role: 'youth'
        }
      });
    }

    await upsertYouthContext(user.id, {
      ageBracket,
      city,
      selectedIssues,
      language,
      supportStyle,
    });

    const token = generateToken(user);
    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (error) {
    console.error('Youth login error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/guest-login', async (req, res) => {
  try {
    const guestId = Math.random().toString(36).slice(2, 8).toUpperCase();
    const guestUsername = `Guest-${guestId}`;

    const user = await prisma.user.create({
      data: {
        username: guestUsername,
        role: 'youth',
      },
    });

    await upsertYouthContext(user.id, {});

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        isGuest: true,
      },
    });
  } catch (error) {
    console.error('Guest login error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/google-login', async (req, res) => {
  try {
    const { idToken, name, selectedIssues, language, supportStyle } = req.body;

    if (!process.env.GOOGLE_CLIENT_ID || !googleClient) {
      return res.status(500).json({ error: 'Google OAuth is not configured on the server' });
    }

    if (!idToken) {
      return res.status(400).json({ error: 'Google token is required' });
    }

    const normalizedName = (name || '').trim();
    const normalizedIssues = normalizeIssues(selectedIssues);

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload?.email;

    if (!email) {
      return res.status(401).json({ error: 'Unable to verify Google account email' });
    }

    if (!isAllowedGoogleEmail(email)) {
      return res.status(403).json({
        error: `Google sign-in is restricted to: ${getAllowedGoogleDomains().join(', ')}`,
      });
    }

    let user = await prisma.user.findUnique({
      where: { email },
      include: { youthProfile: true }
    });

    if (user && user.role !== 'youth') {
      return res.status(403).json({ error: 'This Google account is not a youth account' });
    }

    if (!user) {
      if (!normalizedName) {
        return res.status(400).json({ error: 'PROFILE_SETUP_REQUIRED: Name is required for first-time Google sign-in' });
      }

      if (normalizedIssues.length === 0 || !language || !supportStyle) {
        return res.status(400).json({ error: 'PROFILE_SETUP_REQUIRED: Please complete your support preferences' });
      }

      user = await prisma.user.create({
        data: {
          email,
          username: normalizedName,
          role: 'youth',
        },
        include: { youthProfile: true }
      });
    } else if (normalizedName && user.username !== normalizedName) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { username: normalizedName },
        include: { youthProfile: true }
      });
    }

    const finalIssues = normalizedIssues.length > 0
      ? normalizedIssues
      : (user.youthProfile?.selectedIssues || []);
    const finalLanguage = language || user.youthProfile?.language || DEFAULT_YOUTH_CONTEXT.language;
    const finalSupportStyle = supportStyle || user.youthProfile?.supportStyle || DEFAULT_YOUTH_CONTEXT.supportStyle;
    const finalAgeBracket = user.youthProfile?.ageBracket || DEFAULT_YOUTH_CONTEXT.ageBracket;
    const finalCity = user.youthProfile?.city || DEFAULT_YOUTH_CONTEXT.city;

    if (finalIssues.length === 0) {
      return res.status(400).json({ error: 'PROFILE_SETUP_REQUIRED: Please select at least one issue for matching' });
    }

    await upsertYouthContext(user.id, {
      ageBracket: finalAgeBracket,
      city: finalCity,
      selectedIssues: finalIssues,
      language: finalLanguage,
      supportStyle: finalSupportStyle,
    });

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

router.post('/mentor-google-login', async (req, res) => {
  try {
    const { idToken, name, expertise } = req.body;

    if (!process.env.GOOGLE_CLIENT_ID || !googleClient) {
      return res.status(500).json({ error: 'Google OAuth is not configured on the server' });
    }

    if (!idToken) {
      return res.status(400).json({ error: 'Google token is required' });
    }

    const normalizedName = (name || '').trim();
    if (!normalizedName) {
      return res.status(400).json({ error: 'Volunteer name is required' });
    }

    const normalizedExpertise = normalizeExpertise(expertise);
    if (normalizedExpertise.length === 0) {
      return res.status(400).json({ error: 'Please select at least one expertise domain' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload?.email;

    if (!email) {
      return res.status(401).json({ error: 'Unable to verify Google account email' });
    }

    if (!isAllowedGoogleEmail(email)) {
      return res.status(403).json({
        error: `Google sign-in is restricted to: ${getAllowedGoogleDomains().join(', ')}`,
      });
    }

    let user = await prisma.user.findUnique({
      where: { email },
      include: { mentorProfile: true }
    });

    if (user && user.role !== 'mentor') {
      return res.status(403).json({ error: 'This Google account is already linked to a non-volunteer account' });
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          username: normalizedName,
          role: 'mentor',
          mentorProfile: {
            create: {
              expertise: normalizedExpertise,
              isAvailable: false,
              credentials: toMentorCredentials({
                approvalStatus: 'pending',
                submittedAt: new Date().toISOString(),
              }),
            }
          }
        },
        include: { mentorProfile: true }
      });

      return res.status(403).json({ error: 'Volunteer profile created. Awaiting admin approval.' });
    } else {
      if (user.username !== normalizedName) {
        await prisma.user.update({
          where: { id: user.id },
          data: { username: normalizedName }
        });
      }

      if (user.mentorProfile) {
        const mentorMeta = parseMentorMeta(user.mentorProfile.credentials);
        const approval = ensureMentorApproved(mentorMeta);
        if (!approval.ok) {
          return res.status(403).json({ error: approval.message });
        }

        await prisma.mentorProfile.update({
          where: { id: user.mentorProfile.id },
          data: { expertise: normalizedExpertise }
        });
      } else {
        await prisma.mentorProfile.create({
          data: {
            userId: user.id,
            expertise: normalizedExpertise,
            isAvailable: false,
            credentials: toMentorCredentials({
              approvalStatus: 'pending',
              submittedAt: new Date().toISOString(),
            }),
          }
        });

        return res.status(403).json({ error: 'Volunteer profile created. Awaiting admin approval.' });
      }

      user = await prisma.user.findUnique({
        where: { id: user.id },
        include: { mentorProfile: true }
      });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        username: user.username,
        expertise: user.mentorProfile?.expertise || []
      }
    });
  } catch (error) {
    console.error('Mentor Google login error:', error);
    res.status(500).json({ error: 'Google volunteer login failed' });
  }
});

// Mentor login
router.post('/mentor-login', async (req, res) => {
  try {
    const { email, password, name, expertise } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedPassword = typeof password === 'string' ? password : '';
    const normalizedName = (name || '').trim();
    const normalizedExpertise = normalizeExpertise(expertise);

    if (!normalizedEmail || !normalizedPassword) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (normalizedExpertise.length === 0) {
      return res.status(400).json({ error: 'Please select at least one expertise domain' });
    }

    let user = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive',
        },
      },
      include: { mentorProfile: true }
    });

    // First volunteer login can bootstrap the mentor profile.
    if (!user) {
      if (!normalizedName) {
        return res.status(400).json({ error: 'Name is required for first-time volunteer login' });
      }

      const hashedPassword = await bcrypt.hash(normalizedPassword, 10);
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          username: normalizedName,
          role: 'mentor',
          mentorProfile: {
            create: {
              expertise: normalizedExpertise,
              isAvailable: false,
              credentials: toMentorCredentials({
                approvalStatus: 'pending',
                submittedAt: new Date().toISOString(),
              }),
            }
          }
        },
        include: { mentorProfile: true }
      });

      return res.status(403).json({ error: 'Volunteer profile created. Awaiting admin approval.' });
    } else {
      if (user.role !== 'mentor') {
        return res.status(403).json({ error: 'Not a mentor account' });
      }

      if (!user.password) {
        // Legacy volunteer accounts created through social login may not have a password yet.
        const hashedPassword = await bcrypt.hash(normalizedPassword, 10);
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            password: hashedPassword,
            ...(normalizedName ? { username: normalizedName } : {}),
          },
          include: { mentorProfile: true },
        });
      } else {
        const isValidPassword = await bcrypt.compare(normalizedPassword, user.password);
        if (!isValidPassword) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
      }

      if (user.mentorProfile) {
        const mentorMeta = parseMentorMeta(user.mentorProfile.credentials);
        const approval = ensureMentorApproved(mentorMeta);
        if (!approval.ok) {
          return res.status(403).json({ error: approval.message });
        }
      }

      if (normalizedName && user.username !== normalizedName) {
        await prisma.user.update({
          where: { id: user.id },
          data: { username: normalizedName }
        });
      }

      if (user.mentorProfile) {
        await prisma.mentorProfile.update({
          where: { id: user.mentorProfile.id },
          data: { expertise: normalizedExpertise }
        });
      } else {
        await prisma.mentorProfile.create({
          data: {
            userId: user.id,
            expertise: normalizedExpertise,
            isAvailable: false,
            credentials: toMentorCredentials({
              approvalStatus: 'pending',
              submittedAt: new Date().toISOString(),
            }),
          }
        });

        return res.status(403).json({ error: 'Volunteer profile created. Awaiting admin approval.' });
      }

      user = await prisma.user.findUnique({
        where: { id: user.id },
        include: { mentorProfile: true }
      });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        username: user.username,
        expertise: user.mentorProfile?.expertise || []
      }
    });
  } catch (error) {
    console.error('Mentor login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mentor signup
router.post('/mentor-signup', async (req, res) => {
  try {
    const { email, password, expertise } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username: email.split('@')[0],
        role: 'mentor'
      }
    });

    await prisma.mentorProfile.create({
      data: {
        userId: user.id,
        expertise: expertise || [],
        isAvailable: false,
        credentials: toMentorCredentials({
          approvalStatus: 'pending',
          submittedAt: new Date().toISOString(),
        }),
      }
    });

    res.status(403).json({ error: 'Volunteer profile created. Awaiting admin approval.' });
  } catch (error) {
    console.error('Mentor signup error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin login
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password, adminKey } = req.body;
    const configuredAdminKey = process.env.ADMIN_KEY;

    if (!configuredAdminKey) {
      return res.status(500).json({ error: 'ADMIN_KEY is not configured in environment' });
    }

    // Simple admin key verification (in production, use a more secure method)
    if (adminKey !== configuredAdminKey || adminKey === 'default-key') {
      return res.status(403).json({ error: 'Invalid admin key' });
    }

    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          username: email.split('@')[0],
          role: 'admin'
        }
      });
    } else if (!(await bcrypt.compare(password, user.password)) || user.role !== 'admin') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify token
router.get('/verify', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    res.json({
      user: { id: user.id, username: user.username, role: user.role, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
