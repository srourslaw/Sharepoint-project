# SharePoint AI Dashboard - Troubleshooting Guide

## 🚨 Common Issues & Solutions

### 1. Authentication Issues

#### **Problem**: "Authentication required" error when accessing dashboard
**Symptoms:**
- Can't access dashboard without login prompt
- Getting 401 Unauthorized errors
- Session seems to expire quickly

**Solutions:**
```bash
# Check if backend is running
docker-compose ps backend

# Check backend logs for authentication errors
docker logs sharepoint-ai-backend --tail=50

# Verify environment variables
docker-compose exec backend printenv | grep -E "(AZURE|CLIENT|TENANT)"

# Restart with proper environment
AZURE_REDIRECT_URI="https://your-ngrok-url.ngrok-free.app/auth/callback" docker-compose restart backend
```

**Root Cause:** Usually missing or incorrect Azure redirect URI configuration.

---

### 2. File Preview Issues

#### **Problem**: "FILE_CONTENT_NOT_FOUND" for Excel/Office files
**Symptoms:**
- Excel files show error instead of preview
- Word documents fail to load
- PowerPoint presentations don't display

**Solutions:**
```bash
# Check if Microsoft Graph preview endpoint is working
curl -X GET "http://localhost:3001/api/sharepoint-advanced/files/{fileId}/preview" \
  -H "Cookie: session-id=your-session-id"

# Verify SharePoint permissions
# User must have at least "Read" access to SharePoint sites

# Check backend logs for Graph API errors
docker logs sharepoint-ai-backend --tail=100 | grep -E "(preview|Graph|Office)"

# Test with different file
# Try with a simple .docx file first
```

**Root Cause:** Microsoft Graph API permissions or file access restrictions.

---

### 3. Site Discovery Problems

#### **Problem**: SharePoint sites not appearing in dashboard
**Symptoms:**
- Empty file browser
- "No sites found" message
- Created sites don't appear

**Solutions:**
```bash
# Check if user has SharePoint access
# Verify in SharePoint admin center that user has proper permissions

# Check site discovery logs
docker logs sharepoint-ai-backend --tail=100 | grep -E "(sites|discovery|organizational)"

# Manually test site discovery
curl -X GET "http://localhost:3001/api/sharepoint-advanced/drives/root/items/root/children" \
  -H "Cookie: session-id=your-session-id"

# Verify Graph API permissions include:
# - Sites.Read.All
# - Files.Read.All
# - User.Read
```

**Root Cause:** Usually insufficient Microsoft Graph API permissions or SharePoint access rights.

---

### 4. Docker Issues

#### **Problem**: Containers failing to start
**Symptoms:**
- `docker-compose up` fails
- Services show unhealthy status
- Port conflicts

**Solutions:**
```bash
# Check container status
docker-compose ps

# View logs for failed services
docker-compose logs backend
docker-compose logs frontend

# Check for port conflicts
lsof -i :3001  # Backend port
lsof -i :8080  # Frontend port

# Clean restart
docker-compose down
docker system prune -f
docker-compose up -d --build

# Check disk space
df -h
```

---

### 5. Network/CORS Issues

#### **Problem**: API calls failing with CORS errors
**Symptoms:**
- "CORS policy" errors in browser console
- API requests failing from frontend
- Authentication redirects not working

**Solutions:**
```bash
# Check CORS environment variables
echo $CORS_ORIGIN
echo $FRONTEND_PORT

# Verify correct URLs in environment
FRONTEND_PORT=8080 CORS_ORIGIN="http://localhost:8080" docker-compose restart

# For ngrok users, update redirect URI
AZURE_REDIRECT_URI="https://your-ngrok-url.ngrok-free.app/auth/callback" docker-compose restart backend

# Check browser network tab for failing requests
# Look for preflight OPTIONS requests
```

---

## 🔧 Diagnostic Commands

### Check System Health
```bash
# Full system status
docker-compose ps
docker-compose logs --tail=20

# Check backend health
curl http://localhost:3001/health

# Check frontend accessibility
curl http://localhost:8080

# Check ngrok tunnel (if using)
curl https://your-ngrok-url.ngrok-free.app/health
```

### SharePoint API Testing
```bash
# Test authentication endpoint
curl -X GET "http://localhost:3001/auth/me" -v

# Test site discovery
curl -X GET "http://localhost:3001/api/sharepoint-advanced/drives/root/items/root/children"

# Test file preview
curl -X GET "http://localhost:3001/api/sharepoint-advanced/files/{fileId}/preview"
```

### Environment Verification
```bash
# Check all required environment variables
docker-compose exec backend env | grep -E "(AZURE|CLIENT|TENANT|CORS|PORT)"

# Verify database connection
docker-compose exec backend npm run db:status

# Check Redis connection
docker-compose exec backend redis-cli ping
```

---

## 📊 Performance Issues

### **Problem**: Slow file loading or timeouts
**Solutions:**
```bash
# Check backend performance
docker stats sharepoint-ai-backend

# Increase timeout if needed
# Edit docker-compose.yml:
# environment:
#   - REQUEST_TIMEOUT=60000  # 60 seconds

# Check network latency to Microsoft Graph
curl -w "@curl-format.txt" -o /dev/null -s "https://graph.microsoft.com/v1.0/me"

# Monitor memory usage
docker exec sharepoint-ai-backend cat /proc/meminfo
```

---

## 🔍 Debug Mode

### Enable Detailed Logging
```bash
# Backend debug mode
docker-compose exec backend npm run dev

# Frontend debug mode
docker-compose exec frontend npm run dev

# Enable verbose Graph API logging
# Add to backend environment:
GRAPH_DEBUG=true
```

### Common Log Patterns to Look For
```bash
# Authentication success
grep "✅ Authentication successful" backend.log

# File processing
grep "📄\|📊\|🖼️" backend.log

# Graph API calls
grep "Graph API" backend.log

# Error patterns
grep -E "(❌|ERROR|Failed)" backend.log
```

---

## 🚑 Emergency Recovery

### If Everything Breaks
```bash
# Nuclear option - complete reset
docker-compose down -v
docker system prune -af
docker volume prune -f

# Rebuild from scratch
git checkout main
docker-compose build --no-cache
docker-compose up -d

# Restore from last known good state
git log --oneline -10
git checkout <last-good-commit>
docker-compose up -d --build
```

### Backup Current State
```bash
# Backup database
docker-compose exec db pg_dump -U postgres sharepoint_ai > backup.sql

# Backup logs
docker-compose logs > system-logs-$(date +%Y%m%d-%H%M%S).txt

# Export environment
docker-compose config > docker-compose-backup.yml
```

---

## 📞 Getting Help

### Information to Collect Before Reporting Issues
```bash
# System information
docker --version
docker-compose --version
uname -a

# Service status
docker-compose ps
docker-compose logs --tail=50

# Environment snapshot
docker-compose exec backend printenv | grep -v -E "(SECRET|KEY|PASSWORD)"

# Network configuration
docker network ls
docker network inspect sharepoint_project_default
```

### Log Patterns That Indicate Success
```
✅ Authentication successful for user: [User Name]
✅ Found [N] organizational sites
✅ [File Type] preview loaded successfully
🎉 OAuth callback successful
```

### Log Patterns That Indicate Problems
```
❌ Graph API error
❌ Session validation failed
❌ Failed to load [file type]
🚫 File not found in drive
⚠️ Cannot access all organization sites
```

---

## 🔄 Maintenance Tasks

### Regular Health Checks
```bash
# Weekly system cleanup
docker system prune -f

# Monthly log rotation
docker-compose logs --since="30d" > logs-archive-$(date +%Y%m%d).txt
docker-compose restart

# Database maintenance
docker-compose exec db psql -U postgres -d sharepoint_ai -c "VACUUM ANALYZE;"
```

### Performance Monitoring
```bash
# Monitor container resource usage
docker stats --no-stream

# Check API response times
curl -w "%{time_total}\n" -o /dev/null -s http://localhost:3001/health

# Monitor disk space
df -h
docker system df
```

Remember: Most issues are related to authentication configuration or Microsoft Graph API permissions. Always check these first before diving into complex debugging.