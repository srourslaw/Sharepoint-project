# SharePoint AI Dashboard - Debugging Methodology

## Standard Debugging Process for Frontend API Issues

When fixing frontend API errors (404s, etc.), always follow these systematic steps:

### Step 1: Real-time Log Monitoring
```bash
# Always monitor backend logs in real-time during debugging
docker logs -f sharepoint-ai-backend

# Filter for specific errors
docker logs -f sharepoint-ai-backend | grep -E "404|profile|error|ERROR|❌"
```

### Step 2: Identify the Exact Issue
1. **Frontend Console Errors**: Check browser console for exact API calls failing
2. **Backend Log Analysis**: Monitor real-time logs to see what endpoints are being called
3. **Source Code Investigation**: Find which files are making the problematic API calls

### Step 3: Fix Application (Example: Settings Page Fix)

**Problem Identified**: 
- Frontend was calling `/api/sharepoint/user/profile` (404 error)
- Backend only has `/api/sharepoint-advanced/me/profile` endpoint

**Files Modified**:
```
/client/src/hooks/useSharePointSettings.ts:114
```

**Change Made**:
```typescript
// BEFORE (caused 404):
const userResponse = await api.get('/api/sharepoint/user/profile');

// AFTER (working):
const userResponse = await api.get('/api/sharepoint-advanced/me/profile');
```

### Step 4: Complete Docker Rebuild Process

**Critical**: Frontend build cache can persist even with `--no-cache` flags. Use complete system reset:

```bash
# 1. Stop all containers and remove volumes
docker-compose down -v --remove-orphans

# 2. Clear all Docker system cache
docker system prune -f --volumes

# 3. Clear local build cache
rm -rf ./client/dist ./client/node_modules/.vite ./client/.vite

# 4. Rebuild with no cache
docker-compose build --no-cache --pull

# 5. Start fresh containers
docker-compose up -d
```

### Step 5: Verify Fix with Real-time Monitoring
```bash
# Monitor logs during testing
docker logs -f sharepoint-ai-backend | grep -E "profile|user|✅|❌"

# Navigate to the fixed page and verify:
# - No 404 errors in browser console
# - Backend logs show successful API calls
# - Page loads correctly
```

### Step 6: Documentation and Git Commit

**Document in this file**:
- Problem description
- Root cause analysis  
- Files modified
- Exact changes made
- Verification steps

**Git Commit Process**:
```bash
git add .
git commit -m "FIX: Settings page API endpoint - changed /api/sharepoint/user/profile to /api/sharepoint-advanced/me/profile

🔧 Problem: Frontend calling non-existent /api/sharepoint/user/profile endpoint
🔧 Solution: Updated useSharePointSettings.ts:114 to use correct /api/sharepoint-advanced/me/profile
🔧 Method: Complete Docker system rebuild resolved persistent build cache issues

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

## Issue Resolution History

### Settings Page Fix (Completed ✅)
- **Date**: 2025-09-10
- **Problem**: 404 error for `/api/sharepoint/user/profile`
- **Root Cause**: Wrong API endpoint in useSharePointSettings.ts:114
- **Solution**: Changed to `/api/sharepoint-advanced/me/profile`
- **Fix Method**: Complete Docker system rebuild with cache clearing
- **Status**: ✅ Resolved - Settings page now loads correctly

### People & Sharing Page API Fix (Completed ✅)
- **Date**: 2025-09-10  
- **Problem**: Expected 404 errors similar to Settings page
- **Investigation**: Real-time log monitoring during page access
- **Result**: No issues found - page working correctly with existing endpoints
- **Backend Logs**: Successfully showing "✅ Found user profile: Hussein Srour" and people data
- **Status**: ✅ Already Working - No fix required

### HTML Validation Errors Fix (Completed ✅)
- **Date**: 2025-09-10
- **Problem**: React HTML validation errors: `<div>` cannot be a descendant of `<p>` causing hydration errors
- **Root Cause**: MUI components creating invalid HTML nesting structure
- **Affected Pages**: Analytics and People & Sharing pages  
- **Files Modified**:
  - `/client/src/components/pages/AnalyticsPage.tsx:235-237`
  - `/client/src/components/pages/PeoplePage.tsx:353-361, 403-411, 515-525`
- **Technical Details**:
  - **Issue 1**: `<Typography variant="body1">` (renders as `<p>`) containing `<Chip>` (renders as `<div>`)
  - **Issue 2**: `<ListItemText secondary={<Box><Typography>...}>` creating nested `<p>` inside `<p>`
- **Solutions Applied**:
  - **AnalyticsPage**: Replaced `<Typography>` + `<Chip>` with `<Box>` layout using flexbox
  - **PeoplePage**: Replaced `<Box>` + `<Typography>` with `<React.Fragment>` + `<span>` elements
- **Fix Method**: Complete Docker system rebuild to ensure changes were deployed
- **Build Verification**: New JavaScript file `index-DihhVZCP.js` confirmed successful rebuild
- **Status**: ✅ Resolved - All HTML validation errors eliminated from browser console

## Key Lessons Learned

1. **Always use real-time log monitoring** - Essential for debugging API issues
2. **Complete Docker rebuilds required** - Frontend build cache is extremely persistent
3. **Systematic verification** - Test each page after fixes to ensure no regressions
4. **Document everything** - Include problem, solution, and verification steps
5. **Progressive debugging** - Fix one issue at a time with full verification

## Available Backend Endpoints (Reference)

### User Profile Endpoints:
- ✅ `/api/sharepoint-advanced/me/profile` - Get current user profile
- ❌ `/api/sharepoint/user/profile` - DOES NOT EXIST (common mistake)

### People & Sharing Endpoints:
- ✅ `/api/sharepoint-advanced/me/people` - Get organization people
- ✅ `/api/sharepoint-advanced/me/invitations` - Get pending invitations

### File Management Endpoints:
- ✅ `/api/sharepoint-advanced/drives/root/items/root/children` - Get files
- ✅ `/api/sharepoint-advanced/drives/{driveId}/items/{itemId}/children` - Get folder contents

### All Company Subsite Fix (Reference):
The All Company folder access was fixed using progressive fallback strategy:
1. Method 1: Direct subsite path (fails)
2. Method 2: Colon format (works) - `/sites/netorgft18344752.sharepoint.com:/sites/allcompany`
3. Method 3: Search through subsites (fallback)