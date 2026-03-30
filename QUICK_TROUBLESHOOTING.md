# Quick Start Troubleshooting

## 1-Minute Checklist

**Backend:**
- [ ] PostgreSQL running (docker-compose up -d OR local service)
- [ ] DATABASE_URL in backend/.env correct
- [ ] npm install completed
- [ ] npx prisma migrate dev executed
- [ ] npm run dev shows "running on port 3001"

**Frontend:**
- [ ] npm install completed
- [ ] .env has VITE_API_URL=http://localhost:3001/api
- [ ] npm run dev shows "running on port 8080"

**Testing:**
- [ ] curl http://localhost:3001/api/health returns OK
- [ ] http://localhost:8080 loads in browser
- [ ] Network tab shows API requests

## Quick Fixes

### Backend Won't Start

```bash
# 1. Check PostgreSQL
docker-compose ps
# All should be "Up"

# 2. Check if port is in use
# Windows:
netstat -ano | findstr 3001
# Kill: taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :3001
kill -9 <PID>

# 3. Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# 4. Restart
npm run dev
```

### Database Connection Error

```bash
# 1. Verify PostgreSQL is running
docker-compose logs postgres

# 2. Test connection
psql -U postgres -d mindbridge

# 3. If failed, restart
docker-compose down
docker-compose up -d
```

### API Returning 401 (Unauthorized)

- Token not in localStorage: login again
- Token expired: logout and login
- Wrong JWT_SECRET: check backend/.env
- Header format wrong: should be "Bearer <token>"

### Frontend Can't Reach Backend

```bash
# 1. Check backend is running
curl http://localhost:3001/api/health

# 2. Check frontend .env
cat .env | grep VITE_API_URL

# 3. Check CORS is enabled
# Should see in backend/src/server.js:
cors({ origin: process.env.FRONTEND_URL })

# 4. Check network tab for actual error
# F12 → Network tab → see failed request
```

### Prisma Issues

```bash
# 1. Regenerate client
npx prisma generate

# 2. Check migrations
npx prisma migrate status

# 3. Reset database (WILL DELETE DATA)
npx prisma migrate reset

# 4. View data
npx prisma studio
```

## Verification Steps

### Step 1: Backend Health Check
```bash
cd backend
npm run dev

# Wait for: "MindBridge Backend running on port 3001"

# In new terminal:
curl http://localhost:3001/api/health
# Expected: {"status":"OK","message":"MindBridge Backend is running"}
```

### Step 2: Database Check
```bash
# Open pgAdmin: http://localhost:5050
# Or use Prisma Studio:
npx prisma studio
# http://localhost:5555

# Should see all tables created
```

### Step 3: Frontend Connection
```bash
# In browser console (F12):
fetch('http://localhost:3001/api/health')
  .then(r => r.json())
  .then(d => console.log(d))

# Should log the health response
```

### Step 4: Authentication Flow
```bash
# 1. Go to http://localhost:8080/get-support
# 2. Fill form and submit
# 3. Open Network tab (F12)
# 4. Should see POST to /api/auth/youth-login
# 5. Response should have { token, user }
# 6. Should redirect to /dashboard
```

## Debug Mode

### Backend Logging
```bash
# Add to server.js to see all requests:
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

### Frontend Logging
```javascript
// Add to services/api.ts
const apiCall = async (endpoint, options = {}) => {
  console.log('API Call:', endpoint, options);
  const response = await fetch(...);
  console.log('API Response:', response.status, await response.json());
  return response.json();
};
```

### Database Logging
```bash
# PostgreSQL logs:
docker-compose logs -f postgres

# Query logs in Prisma Studio:
npx prisma studio
# Can run queries directly
```

## Emergency Restart

If everything breaks:

```bash
# Backend
cd backend
npm run dev   # Ctrl+C to stop
# Kill any processes on 3001
# Try npm run dev again

# Database
docker-compose down
docker-compose up -d
docker-compose logs postgres  # Wait for "ready to accept connections"

# Frontend
cd the-foundry-forge-main
npm run dev   # Ctrl+C to stop
# Try npm run dev again
```

## Performance Check

```bash
# Backend response time
time curl http://localhost:3001/api/health

# Database performance
npx prisma studio
# Try querying large tables

# Frontend rendering
# F12 → Performance tab → reload page
```

## Security Check

Do NOT use these in production:

```
❌ JWT_SECRET="dev-secret-key"
❌ DATABASE_URL pointing to localhost
❌ NODE_ENV="development"
❌ CORS origin="*"
❌ Hardcoded credentials
```

## Getting Help

1. **Read error message carefully** - Usually tells you the issue
2. **Check logs** - `npm run dev` shows request logs
3. **Use debugger** - F12 Developer Tools
4. **Verify config** - Check all .env files
5. **Restart services** - Sometimes solves temp issues
6. **Clear cache** - Ctrl+Shift+Delete browser cache
7. **Check docs** - SETUP.md has detailed guidance

## Contact Support

If still stuck:
1. Share error message
2. Show output of: `npm run dev`
3. Show content of: `.env` file (no secrets)
4. Show browser console errors (F12)
5. Describe what you were trying to do

---

Most issues are solved by:
- ✅ Making sure PostgreSQL is running
- ✅ Checking .env files are correct
- ✅ Restarting npm run dev
- ✅ Clearing browser cache
