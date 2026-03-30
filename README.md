# MindBridge - Mental Health Support Platform

A comprehensive full-stack application connecting youth with mentors for mental health support, featuring real-time chat, AI assistance, crisis detection, and admin management.

## Project Structure

```
lovable_code/
├── the-foundry-forge-main/        # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── pages/               # Page components
│   │   ├── services/            # API & Socket.IO services
│   │   └── App.tsx              # Main app
│   ├── .env                     # Frontend env variables
│   └── package.json
│
└── backend/                      # Backend (Node.js + Express)
    ├── src/
    │   ├── routes/              # API routes
    │   ├── middleware/          # Auth middleware
    │   ├── utils/               # Utilities (matching, crisis detection, AI)
    │   └── server.js            # Express server
    ├── prisma/
    │   └── schema.prisma        # Database schema
    ├── .env                     # Backend env variables
    ├── SETUP.md                 # Detailed setup guide
    └── package.json
```

## Quick Start

### Prerequisites
- Node.js 16+
- PostgreSQL 12+ (or Docker)
- npm or yarn

### 1. Start Database

#### With Docker (Recommended)
```bash
cd backend
docker-compose up -d

# Wait for PostgreSQL to be ready (health check passes)
```

#### Without Docker
```bash
# Create PostgreSQL database
createdb mindbridge

# Update DATABASE_URL in backend/.env
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install
# Setup database
npx prisma generate
npx prisma migrate dev

# Start server
npm run dev
# Runs on http://localhost:3001
```

### 3. Frontend Setup
```bash
cd the-foundry-forge-main

# Install dependencies
npm install

# Start dev server
npm run dev
# Runs on http://localhost:8080
```

## Configuration

### Backend (.env)
```
DATABASE_URL="postgresql://postgres:mindbridge@localhost:5432/mindbridge"
JWT_SECRET="your-secret-key"
CLAUDE_API_KEY="sk-ant-v4-your-key-here"
ADMIN_KEY="admin-secret-key"
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:8080"
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
```

## Core Features

### Authentication
- **Youth**: Anonymous login with username
- **Mentors**: Email/password registration & login
- **Admins**: Email/password with admin key verification
- JWT tokens with 7-day expiration

### Mentor Matching Engine
Automatic scoring system:
- Issue match: +40 points
- Age match: +25 points  
- Language match: +25 points
- Support style: +10 points

### Real-Time Chat
- Socket.IO for live messaging
- AI fallback when mentor unavailable
- Message history storage
- Auto-detection of crisis keywords

### Crisis Detection
Monitors for keywords:
- "suicide", "self-harm", "killing myself"
- "overdose", "cutting", "poison"
- Creates flags, alerts admins, shows helpline

### AI Assistant (Claude)
- Responds to messages when mentor unavailable
- Generates case summaries for handover
- Context-aware responses based on user issues

### Mood Tracking
- Daily mood logging (1-5 scale)
- Journal entries
- Historical trends
- Admin analytics

### Admin Dashboard
- Real-time statistics
- Crisis flag management
- Mentor & youth overview
- Issue & mood analytics

## User Flows

### Youth Journey
1. Visit `/get-support`
2. Enter username, age, city
3. Select issues (up to 3)
4. Choose language & support style
5. Redirected to `/dashboard`
6. Can log mood, access chat, view resources
7. Request mentor match → assigned via algorithm

### Mentor Journey
1. Sign up with email/expertise
2. Login to `/mentor-portal`
3. View assigned youth
4. Toggle availability status
5. Chat with youth
6. Log session notes & case updates

### Admin Journey
1. Login with email + admin key to `/admin-login`
2. Access `/admin` dashboard
3. Monitor crisis flags
4. View mentor & youth statistics
5. Update flag statuses
6. Access analytics

## API Documentation

### Authentication
```bash
# Youth anonymous login
POST /api/auth/youth-login
Body: { username, ageBracket, city, selectedIssues, language, supportStyle }
Response: { token, user }

# Mentor login
POST /api/auth/mentor-login
Body: { email, password }
Response: { token, user }

# Admin login
POST /api/auth/admin-login
Body: { email, password, adminKey }
Response: { token, user }
```

### Chat with AI & Crisis Detection
```bash
# Send message (auto-detects crisis & generates AI response)
POST /api/chat/message
Headers: { Authorization: "Bearer <token>" }
Body: { chatId, content, sender }
Response: { message, crisisAlert?, aiResponse? }

# Join real-time chat
Socket.IO: socket.emit('join_chat', { chatId })
```

### Mood Logging
```bash
# Log mood
POST /api/mood/log
Body: { mood: 1-5, journal?: string }
Response: { moodLog }

# Get mood stats
GET /api/mood/stats?days=30
Response: { stats: { averageMood, distribution, trend } }
```

See [Backend SETUP.md](./backend/SETUP.md) for complete API documentation.

## Database Schema

### Core Models
- **User**: id, email, password, username, role, timestamps
- **YouthProfile**: age, city, issues, language, supportStyle
- **MentorProfile**: expertise, rating, availability, bio
- **Assignment**: mentor-youth matching with score & status
- **Chat**: youthId, mentorId, messages, session notes
- **ChatMessage**: sender, content, timestamp
- **MoodLog**: mood (1-5), journal, timestamp
- **CrisisFlag**: reason, severity, status, helpline link
- **CaseHistory**: session notes, mentor history, progress

## Development

### Adding Features

1. **Database Change**
```bash
# Update prisma/schema.prisma
npx prisma migrate dev --name feature_name
```

2. **Backend API**
```bash
# Create route in src/routes/
# Update middleware/routes as needed
```

3. **Frontend Integration**
```bash
# Add API call in src/services/api.ts
# Update component to use new endpoint
```

### Testing
```bash
# Frontend
cd the-foundry-forge-main
npm run test

# Backend
cd backend
npm test
```

## Deployment

### Backend Deployment Options
- **Heroku**: `heroku create mindbridge-api && git push heroku main`
- **Railway**: Connect GitHub repo, auto-deploys
- **Render**: Create Web Service from repo
- **DigitalOcean App Platform**: Connect repo

### Frontend Deployment
- **Vercel**: Connect GitHub, auto-deploys on push
- **Netlify**: Drag & drop or GitHub integration
- **AWS Amplify**: GitHub integration
- **Firebase Hosting**: `npm run build && firebase deploy`

### Environment Setup for Production
Update `.env` files with:
- Strong JWT_SECRET (e.g., 32-char random string)
- Production database URL (Supabase/AWS RDS)
- Valid CLAUDE_API_KEY
- Secure ADMIN_KEY
- Production FRONTEND_URL

## Troubleshooting

### Backend won't start
```bash
# Check PostgreSQL is running
# Check DATABASE_URL in .env
# Verify port 3001 is not in use
# Check for migration errors: npx prisma migrate status
```

### Frontend can't reach backend
```bash
# Verify backend is running on port 3001
# Check VITE_API_URL in .env
# Check CORS is enabled in backend/src/server.js
# Check browser console for specific errors
```

### Database migrations fail
```bash
# Reset (DELETES DATA):
npx prisma migrate reset

# Fresh migration:
npx prisma db push
```

### Crisis detection not working
- Check crisisKeywords in src/utils/crisisDetection.js
- Verify chat message endpoint is being called
- Check database for CrisisFlag records

## Support & Resources

### Documentation
- See [Backend SETUP.md](./backend/SETUP.md) for detailed backend guide
- See [Frontend Components README](./the-foundry-forge-main/src/components/README.md) (if exists)

### Emergency Resources
- **India**: AASRA 9820466726
- **US**: 988 Suicide & Crisis Lifeline
- **International**: findahelpline.com

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind, shadcn/ui
- **Backend**: Node.js, Express.js, Prisma, PostgreSQL
- **Real-time**: Socket.IO
- **AI**: Claude API (Anthropic)
- **Auth**: JWT, bcrypt

## License
MIT

## Contributing
1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

**Built with ❤️ for mental health support | Youngistaan Foundation**
