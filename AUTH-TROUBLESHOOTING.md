# Authentication Troubleshooting Guide

## 🎯 Quick Fix Commands

### If You See Authentication Loops
```bash
# Restart the system with correct configuration
FRONTEND_PORT=8080 CORS_ORIGIN="http://localhost:8080" docker-compose restart

# If that doesn't work, rebuild and restart
FRONTEND_PORT=8080 CORS_ORIGIN="http://localhost:8080" docker-compose down
FRONTEND_PORT=8080 CORS_ORIGIN="http://localhost:8080" docker-compose up -d
```

## 🚨 NEVER DO THESE THINGS

### ❌ Don't Use ngrok
```bash
# WRONG - These were bad suggestions
ngrok http 3001
AZURE_REDIRECT_URI="https://xxxxx.ngrok-free.app/auth/callback"
```

### ❌ Don't Clear Browser Cache
- The system should work without clearing cache
- If you need to clear cache, there's a deeper issue

### ❌ Don't Use Incognito/Private Browsing
- System should work in regular browser windows
- Private browsing was a workaround, not a solution

### ❌ Don't Modify macOS Network Settings
- No hosts file changes needed
- No network configuration changes needed
- localhost works out of the box

## ✅ Correct Authentication Flow

### 1. Expected User Experience
1. Go to http://localhost:8080
2. Click "Sign In"
3. Redirect to Microsoft login
4. Enter credentials
5. **Immediate redirect back to dashboard** (no loops)
6. Dashboard loads with SharePoint data

### 2. Backend Session Management
- **Session Duration**: 24 hours
- **Token Refresh**: Automatic every 55 minutes
- **No Manual Intervention**: System handles everything

### 3. Technical Flow
```
User → Frontend (8080) → Backend (3001) → Microsoft OAuth → Backend → Frontend
```

## 🔍 Debugging Steps

### Check System Status
```bash
# 1. Verify all containers are healthy
docker-compose ps

# Expected output should show:
# sharepoint-ai-frontend    Up X seconds (healthy)
# sharepoint-ai-backend     Up X seconds (healthy)
```

### Check Logs for Issues
```bash
# 2. Check backend logs for errors
docker logs sharepoint-ai-backend --tail=20

# Look for:
# ✅ "OAuth callback successful"
# ❌ "Session validation failed"
# ❌ "Authentication loops"
```

### Verify Configuration
```bash
# 3. Check environment variables
docker exec sharepoint-ai-backend printenv | grep -E "(CORS_ORIGIN|AZURE_REDIRECT_URI|FRONTEND_PORT)"

# Expected output:
# CORS_ORIGIN=http://localhost:8080
# AZURE_REDIRECT_URI=http://localhost:3001/auth/callback
```

## 🔧 Authentication Loop Analysis

### Root Cause (FIXED)
The authentication loops were caused by:
1. **Sessions expiring immediately** after creation
2. **Improper token refresh timing** causing session invalidation
3. **Race conditions** in OAuth callback handling

### Solution Implemented
1. **Extended session duration** to 24 hours
2. **Separated token expiration tracking** from session expiration
3. **Improved refresh token logic** with better account management
4. **Added 500ms OAuth callback delay** to prevent race conditions

## 📊 System Health Indicators

### ✅ Healthy System Signs
```bash
# Backend logs should show:
✅ "Authentication successful for user: [Name]"
✅ "OAuth callback successful, redirecting to frontend"
✅ "Found 7 sites via search API"

# No repeated authentication attempts
# No session validation failures
```

### 🚨 Problem Indicators
```bash
# If you see these, restart the system:
❌ "Session validation failed"
❌ "Authentication loop detected"
❌ Multiple OAuth redirects in quick succession
```

## 🛠️ Recovery Procedures

### Level 1: Simple Restart
```bash
FRONTEND_PORT=8080 CORS_ORIGIN="http://localhost:8080" docker-compose restart
```

### Level 2: Full Rebuild (if Level 1 fails)
```bash
FRONTEND_PORT=8080 CORS_ORIGIN="http://localhost:8080" docker-compose down
FRONTEND_PORT=8080 CORS_ORIGIN="http://localhost:8080" docker-compose build --no-cache
FRONTEND_PORT=8080 CORS_ORIGIN="http://localhost:8080" docker-compose up -d
```

### Level 3: Clean Slate (nuclear option)
```bash
# Only if absolutely necessary
docker system prune -f
git checkout main
FRONTEND_PORT=8080 CORS_ORIGIN="http://localhost:8080" docker-compose up -d --build
```

## 📝 What to Check First

1. **URL**: Are you using http://localhost:8080?
2. **Containers**: Are both frontend and backend healthy?
3. **Logs**: Any authentication errors in backend logs?
4. **Environment**: Are environment variables correct?

## 🚫 What NOT to Suggest in Future

1. **ngrok tunneling** - Completely unnecessary
2. **Network configuration changes** - localhost works fine
3. **Browser-specific workarounds** - System should work everywhere
4. **Manual cache clearing** - System should work without this
5. **Different ports** - 8080/3001 is the tested configuration

## 📞 Last Resort

If none of the above works:
1. Check if Azure app registration has correct redirect URI: `http://localhost:3001/auth/callback`
2. Verify Azure credentials in environment variables
3. Ensure no other services are using ports 8080 or 3001

---

**Remember**: The system was designed to work simply with localhost. Any suggestions for external tunneling, network changes, or complex workarounds are incorrect.