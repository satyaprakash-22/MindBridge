# MindBridge API Testing Guide

Complete examples to test all backend APIs using curl or Postman.

## Base URL
```
http://localhost:3001/api
```

## Auth Token Flow

1. First login to get token
2. Copy token from response
3. Use in header: `Authorization: Bearer <token>`

## Health Check

```bash
curl http://localhost:3001/api/health
```

Response:
```json
{
  "status": "OK",
  "message": "MindBridge Backend is running"
}
```

## Authentication APIs

### 1. Youth Anonymous Login

```bash
curl -X POST http://localhost:3001/api/auth/youth-login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "SkyWalker",
    "ageBracket": "16-18",
    "city": "Mumbai",
    "selectedIssues": ["anxiety", "family"],
    "language": "English",
    "supportStyle": "listen"
  }'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx123...",
    "username": "SkyWalker",
    "role": "youth"
  }
}
```

### 2. Mentor Signup

```bash
curl -X POST http://localhost:3001/api/auth/mentor-signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mentor@example.com",
    "password": "SecurePassword123!",
    "expertise": ["anxiety", "family", "academic"]
  }'
```

### 3. Mentor Login

```bash
curl -X POST http://localhost:3001/api/auth/mentor-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mentor@example.com",
    "password": "SecurePassword123!"
  }'
```

### 4. Admin Login

```bash
curl -X POST http://localhost:3001/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@youngistaan.org",
    "password": "AdminPass123!",
    "adminKey": "admin-secret-key"
  }'
```

**Note**: Get admin-secret-key from backend/.env `ADMIN_KEY`

### 5. Verify Token

```bash
curl http://localhost:3001/api/auth/verify \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Response:
```json
{
  "user": {
    "id": "clx123...",
    "username": "SkyWalker",
    "role": "youth",
    "email": null
  }
}
```

## Youth APIs

### Get Dashboard

```bash
curl http://localhost:3001/api/youth/dashboard \
  -H "Authorization: Bearer <YOUTH_TOKEN>"
```

Response:
```json
{
  "user": {
    "id": "clx123...",
    "username": "SkyWalker",
    "profile": {
      "id": "profile...",
      "userId": "clx123...",
      "ageBracket": "16-18",
      "city": "Mumbai",
      "selectedIssues": ["anxiety", "family"],
      "language": "English",
      "supportStyle": "listen"
    }
  },
  "recentMoods": [
    {
      "id": "mood1...",
      "mood": 4,
      "journal": "Had a good day today",
      "createdAt": "2024-03-30T10:00:00Z"
    }
  ]
}
```

### Request Mentor

```bash
curl -X POST http://localhost:3001/api/youth/request-mentor \
  -H "Authorization: Bearer <YOUTH_TOKEN>"
```

Response:
```json
{
  "message": "Mentor matched successfully",
  "assignment": {
    "id": "assign1...",
    "mentorId": "mentor123...",
    "youthId": "profile123...",
    "matchScore": 90,
    "status": "active"
  },
  "mentor": {
    "id": "mentor123...",
    "userId": "user456...",
    "expertise": ["anxiety", "family"],
    "rating": 4.8,
    "isAvailable": true
  }
}
```

### Get Assigned Mentor

```bash
curl http://localhost:3001/api/youth/assigned-mentor \
  -H "Authorization: Bearer <YOUTH_TOKEN>"
```

## Mentor APIs

### Get Dashboard

```bash
curl http://localhost:3001/api/mentor/dashboard \
  -H "Authorization: Bearer <MENTOR_TOKEN>"
```

Response:
```json
{
  "mentor": {
    "id": "mentor123...",
    "email": "mentor@example.com",
    "profile": {
      "id": "profile...",
      "userId": "mentor123...",
      "bio": "Experienced counselor",
      "expertise": ["anxiety", "family"],
      "rating": 4.8,
      "totalSessions": 42,
      "isAvailable": true
    }
  },
  "assignedYouth": [
    {
      "id": "assign1...",
      "youth": {
        "id": "youth1...",
        "userId": "user1...",
        "ageBracket": "16-18",
        "city": "Mumbai",
        "selectedIssues": ["anxiety"],
        "language": "English"
      }
    }
  ]
}
```

### Toggle Availability

```bash
curl -X POST http://localhost:3001/api/mentor/toggle-availability \
  -H "Authorization: Bearer <MENTOR_TOKEN>"
```

Response:
```json
{
  "message": "Availability updated",
  "profile": {
    "id": "profile...",
    "isAvailable": false
  }
}
```

### Get Youth Details

```bash
curl http://localhost:3001/api/mentor/youth/<YOUTH_PROFILE_ID> \
  -H "Authorization: Bearer <MENTOR_TOKEN>"
```

### Update Session Notes

```bash
curl -X POST http://localhost:3001/api/mentor/session-notes/<ASSIGNMENT_ID> \
  -H "Authorization: Bearer <MENTOR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionNotes": "Youth discussed family conflict. Provided coping strategies."
  }'
```

## Admin APIs

### Get Dashboard

```bash
curl http://localhost:3001/api/admin/dashboard \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

Response:
```json
{
  "stats": {
    "totalYouth": 2547,
    "activeChats": 156,
    "totalSessions": 8392,
    "activeCrisisFlags": 3
  },
  "crisisFlags": [
    {
      "id": "flag1...",
      "youthId": "youth1...",
      "reason": "Crisis keyword detected: suicide, kill myself",
      "severity": "critical",
      "status": "new",
      "createdAt": "2024-03-30T15:30:00Z"
    }
  ],
  "activeMentors": [...]
}
```

### Get All Crisis Flags

```bash
curl http://localhost:3001/api/admin/crisis-flags \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### Update Crisis Flag Status

```bash
curl -X POST http://localhost:3001/api/admin/crisis-flags/<FLAG_ID>/status \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "reviewed"
  }'
```

Status values: `new`, `reviewed`, `referred`, `resolved`

### Get Analytics

```bash
curl http://localhost:3001/api/admin/analytics \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

Response:
```json
{
  "moodDistribution": [
    { "mood": 1, "_count": 42 },
    { "mood": 5, "_count": 156 }
  ],
  "topIssues": [
    ["anxiety", 523],
    ["family", 412],
    ["academic", 398]
  ],
  "recentSessions": 42
}
```

### Get All Mentors

```bash
curl http://localhost:3001/api/admin/mentors \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

## Chat APIs

### Start Chat

```bash
curl -X POST http://localhost:3001/api/chat/start \
  -H "Authorization: Bearer <YOUTH_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "mentorId": "mentor123..."
  }'
```

Response:
```json
{
  "chat": {
    "id": "chat1...",
    "youthId": "youth1...",
    "mentorId": "mentor123...",
    "startedAt": "2024-03-30T15:30:00Z"
  }
}
```

### Send Message (with Crisis Detection & AI)

```bash
curl -X POST http://localhost:3001/api/chat/message \
  -H "Authorization: Bearer <YOUTH_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "chat1...",
    "content": "I\'m feeling anxious about exams",
    "sender": "youth"
  }'
```

Response (normal):
```json
{
  "message": {
    "id": "msg1...",
    "chatId": "chat1...",
    "sender": "youth",
    "content": "I'm feeling anxious about exams",
    "createdAt": "2024-03-30T15:30:00Z"
  },
  "aiResponse": {
    "sender": "ai",
    "content": "I understand exam anxiety can be challenging..."
  }
}
```

Response (crisis detected):
```json
{
  "message": {
    "id": "msg1...",
    "sender": "youth",
    "content": "I want to kill myself"
  },
  "crisisAlert": {
    "detected": true,
    "flag": {
      "id": "flag1...",
      "reason": "Crisis keyword detected: kill myself, suicide",
      "severity": "critical"
    },
    "message": "Please reach out to a helpline immediately. You are not alone."
  }
}
```

### Get Chat History

```bash
curl http://localhost:3001/api/chat/<CHAT_ID> \
  -H "Authorization: Bearer <YOUTH_TOKEN>"
```

Response:
```json
{
  "chat": {
    "id": "chat1...",
    "youthId": "youth1...",
    "mentorId": "mentor1...",
    "messages": [
      {
        "id": "msg1...",
        "sender": "youth",
        "content": "Hi, I need help",
        "createdAt": "2024-03-30T15:30:00Z"
      }
    ],
    "mentor": {
      "id": "mentor1...",
      "email": "mentor@example.com",
      "username": "MentorPriya"
    }
  }
}
```

### End Chat with Summary

```bash
curl -X POST http://localhost:3001/api/chat/<CHAT_ID>/end \
  -H "Authorization: Bearer <YOUTH_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionNotes": "Optional custom notes"
  }'
```

### Get User Chats

```bash
curl http://localhost:3001/api/chat/user/chats \
  -H "Authorization: Bearer <YOUTH_TOKEN>"
```

## Mood APIs

### Log Mood

```bash
curl -X POST http://localhost:3001/api/mood/log \
  -H "Authorization: Bearer <YOUTH_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "mood": 4,
    "journal": "Had a great day with friends!"
  }'
```

Mood values: 1-5 (1=Very Bad, 5=Great)

Response:
```json
{
  "message": "Mood logged successfully",
  "moodLog": {
    "id": "mood1...",
    "userId": "youth1...",
    "mood": 4,
    "journal": "Had a great day with friends!",
    "createdAt": "2024-03-30T15:30:00Z"
  }
}
```

### Get Mood History

```bash
curl "http://localhost:3001/api/mood/history?days=30" \
  -H "Authorization: Bearer <YOUTH_TOKEN>"
```

### Get Mood Statistics

```bash
curl "http://localhost:3001/api/mood/stats?days=30" \
  -H "Authorization: Bearer <YOUTH_TOKEN>"
```

Response:
```json
{
  "stats": {
    "totalLogs": 28,
    "averageMood": "3.64",
    "distribution": {
      "1": 2,
      "2": 3,
      "3": 8,
      "4": 10,
      "5": 5
    },
    "trend": "improving",
    "trendScore": 1
  }
}
```

## Testing Workflow

### 1. Register Youth
```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/youth-login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "TestUser",
    "ageBracket": "16-18",
    "city": "TestCity",
    "selectedIssues": ["anxiety"],
    "language": "English",
    "supportStyle": "listen"
  }' | jq -r '.token')

echo "Token: $TOKEN"
```

### 2. Log Mood
```bash
curl -X POST http://localhost:3001/api/mood/log \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mood": 3,
    "journal": "Testing the system"
  }'
```

### 3. Request Mentor
```bash
curl -X POST http://localhost:3001/api/youth/request-mentor \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Start Chat
```bash
CHAT_ID=$(curl -s -X POST http://localhost:3001/api/chat/start \
  -H "Authorization: Bearer $TOKEN" | jq -r '.chat.id')

echo "Chat ID: $CHAT_ID"
```

### 5. Send Message
```bash
curl -X POST http://localhost:3001/api/chat/message \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "'$CHAT_ID'",
    "content": "I am feeling anxious",
    "sender": "youth"
  }'
```

## Error Responses

### 401 Unauthorized
```json
{
  "error": "No token provided"
}
```
or
```json
{
  "error": "Invalid token"
}
```

### 400 Bad Request
```json
{
  "error": "Invalid mood value (1-5)"
}
```

### 403 Forbidden
```json
{
  "error": "Not a youth account"
}
```

### 500 Server Error
```json
{
  "error": "Something went wrong!",
  "message": "Detailed error message"
}
```

## Postman Collection

You can import this collection into Postman:

1. Open Postman
2. Click "Import"
3. Paste this JSON:

```json
{
  "info": {
    "name": "MindBridge API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "http://localhost:3001/api/health"
      }
    },
    {
      "name": "Youth Login",
      "request": {
        "method": "POST",
        "url": "http://localhost:3001/api/auth/youth-login",
        "body": {
          "mode": "raw",
          "raw": "{\"username\":\"TestUser\",\"ageBracket\":\"16-18\",\"city\":\"Mumbai\",\"selectedIssues\":[\"anxiety\"],\"language\":\"English\",\"supportStyle\":\"listen\"}"
        }
      }
    }
  ]
}
```

## Troubleshooting API Calls

### Connection Refused
- Backend not running: `npm run dev` in backend directory
- Wrong port: Check .env PORT variable

### Invalid Token
- Token expired: Get new token
- Wrong format: Use "Bearer <token>"
- Not included: Check Authorization header

### Database Error
- PostgreSQL not running: `docker-compose up -d`
- Migrations not applied: `npx prisma migrate dev`

### CORS Error
- Backend not running: Start backend
- Wrong frontend URL: Check backend .env FRONTEND_URL

## Performance Testing

```bash
# Time a request
time curl http://localhost:3001/api/health

# Multiple requests
for i in {1..100}; do
  curl -s http://localhost:3001/api/health
done

# With authentication
for i in {1..100}; do
  curl -s http://localhost:3001/api/youth/dashboard \
    -H "Authorization: Bearer $TOKEN"
done
```

---

For more info, see:
- [Backend SETUP.md](./backend/SETUP.md)
- [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
- [BACKEND_IMPLEMENTATION_SUMMARY.md](./BACKEND_IMPLEMENTATION_SUMMARY.md)
