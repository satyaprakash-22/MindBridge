# MindBridge Backend Setup Guide

## Overview
This backend implements a complete mental health support platform with:
- Authentication system for Youth, Mentors, and Admins
- Mentor matching engine
- Real-time chat with AI fallback
- Crisis detection and alerts
- Mood logging and analytics
- Admin dashboard

## Prerequisites
- Node.js 16+ 
- PostgreSQL 12+
- npm or yarn

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Database Setup

#### Option 1: PostgreSQL Local (Recommended for Development)
```bash
# Install PostgreSQL if not already installed
# Windows: https://www.postgresql.org/download/windows/
# Mac: brew install postgresql
# Linux: apt-get install postgresql

# Start PostgreSQL service
# Windows: Start PostgreSQL from Services
# Mac/Linux: sudo systemctl start postgresql

# Create database
createdb mindbridge

# Update DATABASE_URL in .env
DATABASE_URL="postgresql://postgres:password@localhost:5432/mindbridge"
```

#### Option 2: Supabase (Cloud PostgreSQL)
```bash
# 1. Create account at https://supabase.com
# 2. Create new project
# 3. Get connection string from project settings
# 4. Update DATABASE_URL in .env
DATABASE_URL="postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres"
```

### 3. Environment Configuration
Edit `.env` file with:
```
DATABASE_URL="postgresql://user:password@localhost:5432/mindbridge"
JWT_SECRET="your-secret-key-change-this-in-production"
CLAUDE_API_KEY="sk-ant-v4-your-key-here"  # Get from Anthropic
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:8080"
ADMIN_KEY="admin-secret-key"
```

### 4. Setup Prisma
```bash
# Generate Prisma Client
npx prisma generate

# Create database tables
npx prisma migrate dev --name init

# View database (optional)
npx prisma studio
```

### 5. Start Backend Server
```bash
npm run dev         # Development with hot reload
npm start           # Production
```

Server will run on `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/youth-login` - Youth login/signup
- `POST /api/auth/mentor-login` - Mentor login
- `POST /api/auth/mentor-signup` - Mentor registration
- `POST /api/auth/admin-login` - Admin login
- `GET /api/auth/verify` - Verify token

### Youth
- `GET /api/youth/dashboard` - Get dashboard data
- `POST /api/youth/request-mentor` - Request mentor match
- `GET /api/youth/assigned-mentor` - Get assigned mentor

### Mentor
- `GET /api/mentor/dashboard` - Mentor dashboard
- `POST /api/mentor/toggle-availability` - Set availability
- `GET /api/mentor/youth/:youthId` - Get youth details
- `POST /api/mentor/session-notes/:assignmentId` - Save notes

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/crisis-flags` - All crisis flags
- `POST /api/admin/crisis-flags/:flagId/status` - Update flag status
- `GET /api/admin/analytics` - Analytics data
- `GET /api/admin/mentors` - All mentors

### Chat
- `POST /api/chat/start` - Start new chat
- `POST /api/chat/message` - Send message (includes AI & crisis detection)
- `GET /api/chat/:chatId` - Get chat history
- `POST /api/chat/:chatId/end` - End chat with summary
- `GET /api/chat/user/chats` - Get user chats

### Mood
- `POST /api/mood/log` - Log mood (1-5 scale)
- `GET /api/mood/history` - Get mood history
- `GET /api/mood/stats` - Get mood statistics

## Real-Time Chat (Socket.IO)

### Client Events
- `join_chat` - Connect to specific chat room
- `send_message` - Send message to chat

### Server Events
- `receive_message` - Receive new message

Example:
```javascript
import { joinChat, sendMessage } from './services/socket';

joinChat('chat-id-123');
sendMessage('chat-id-123', 'youth', 'Hello mentor!');
```

## Features

### 1. Authentication
- JWT-based secure authentication
- Bcrypt password hashing
- Anonymous youth login
- Admin key verification

### 2. Mentor Matching
- Issue match: +40 points
- Age match: +25 points
- Language match: +25 points
- Support style match: +10 points
- Automatic assignment of highest scorer

### 3. Crisis Detection
Automatic detection of keywords:
- Self-harm, suicide, harm
- Jump, overdose, poison, rope
- Cut, hang, kill myself, etc.

Triggers:
- Flag creation
- Admin notification
- Helpline resources displayed

### 4. AI Chatbot
- Claude API integration
- Responds when mentor unavailable
- Case summary generation
- Contextual responses based on user issues

### 5. Admin Dashboard
- Real-time stats (youth, sessions, active chats)
- Crisis flag management
- Mentor overview
- Mood analytics
- Issue tracking

### 6. Database Schema
- Users (youth, mentor, admin roles)
- Youth/Mentor profiles
- Assignments (matching)
- Chats & Messages
- Mood logs
- Crisis Flags
- Case History
- Admin Actions

## Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify DATABASE_URL in .env
# Test connection: psql -U postgres -d mindbridge
```

### Prisma Migration Issues
```bash
# Reset database (deletes data!)
npx prisma migrate reset

# Create new migration
npx prisma migrate dev --name migration_name
```

### Port Already in Use
```bash
# Change PORT in .env to 3002, 3003, etc
```

### API Calls Return 401
- Check JWT_SECRET is set correctly
- Verify token in Authorization header
- Token format: `Bearer <token>`

## Production Deployment

### Environment Variables
```
NODE_ENV=production
JWT_SECRET=<strong-random-key>
DATABASE_URL=<production-db-url>
CLAUDE_API_KEY=<api-key>
ADMIN_KEY=<secure-key>
FRONTEND_URL=<your-domain>
```

### Deployment Platforms
- **Heroku**: `git push heroku main`
- **Railway**: Connect GitHub repo
- **Render**: Create new Web Service
- **DigitalOcean**: Deploy via App Platform

## Development Notes

### Adding New Features
1. Update Prisma schema
2. Run migration: `npx prisma migrate dev --name feature_name`
3. Create new route in `src/routes/`
4. Add API endpoint in frontend `src/services/api.ts`

### Database Monitoring
```bash
# View/edit data
npx prisma studio

# Check logs
# Windows: Check PostgreSQL logs in Program Files
# Mac/Linux: tail -f /var/log/postgresql/postgresql.log
```

## Support
For issues or questions:
1. Check error logs
2. Verify .env configuration
3. Ensure PostgreSQL is running
4. Restart dev server
