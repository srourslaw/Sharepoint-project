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

### AI Chat 500 Errors & Token Limit Fix (Completed ✅)
- **Date**: 2025-09-11
- **Problem**: AI chat returning 500 Internal Server Error when processing documents
- **Root Cause Analysis**:
  - Backend logs showed: "This model's maximum context length is 8192 tokens. However, your messages resulted in 50278 tokens"
  - OpenAI GPT-4o-mini model has 8,192 token context limit but document content was 50,278 tokens
  - Large SharePoint documents were exceeding AI model's context window
- **Files Modified**:
  - `/server/src/routes/aiFeatures.ts:453-520` - Implemented intelligent content chunking
- **Technical Solution - Smart Content Chunking Algorithm**:
  ```typescript
  // Set safe token limit (6000 tokens, leaving room for system prompt and response)
  const MAX_CONTEXT_TOKENS = 6000;
  
  if (documentContext.length > MAX_CONTEXT_TOKENS) {
    // 1. Split document into paragraphs (minimum 50 characters)
    const paragraphs = documentContext.split('\n\n').filter(p => p.trim().length > 50);
    
    // 2. Extract keywords from user question for relevance scoring
    const questionKeywords = sanitizedResult.sanitizedValue.toLowerCase().split(' ')
      .filter(word => word.length > 3);
    
    // 3. Score paragraphs by relevance to user's question
    const scoredParagraphs = paragraphs.map(paragraph => {
      const lowerParagraph = paragraph.toLowerCase();
      const score = questionKeywords.reduce((acc, keyword) => {
        return acc + (lowerParagraph.includes(keyword) ? 2 : 0);
      }, 0);
      return { paragraph, score, length: paragraph.length };
    }).sort((a, b) => b.score - a.score);
    
    // 4. Select most relevant content within token limit
    for (const item of scoredParagraphs) {
      if (currentLength + item.length <= MAX_CONTEXT_TOKENS) {
        selectedContent += item.paragraph + '\n\n';
        currentLength += item.length;
      }
    }
    
    // 5. Add explanatory note about content selection
    processedDocumentContext = selectedContent + 
      '\n\n[Note: This is a curated selection of the most relevant content from your documents, optimized for your specific question.]';
  }
  ```
- **Benefits of This Approach**:
  - **Intelligent Selection**: Prioritizes content most relevant to user's question
  - **Quality Preservation**: Maintains document context and meaning
  - **Token Efficiency**: Stays within model limits while maximizing useful content
  - **User Transparency**: Informs users when content has been optimized
- **Fix Method**: Complete Docker rebuild with TypeScript error fixes
- **Verification**: Real-time log monitoring confirmed successful AI responses
- **Status**: ✅ Resolved - AI chat now handles large documents without 500 errors

### AI Quick Actions Cards Design Enhancement (Completed ✅)
- **Date**: 2025-09-11
- **Problem**: AI pre-question cards and Quick Actions cards lacked modern professional design
- **Files Modified**:
  - `/client/src/components/QuickActionBar.tsx:148-424` - Complete design overhaul
- **Design Improvements Applied**:
  - **Modern Color Palette**:
    ```typescript
    // Vivid gradient color scheme
    'analysis': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'    // Indigo to purple
    'summary': 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)'     // Purple to pink
    'extraction': 'linear-gradient(135deg, #10b981 0%, #059669 100%)'  // Emerald gradients
    'translation': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' // Amber gradients
    'comparison': 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'  // Cyan gradients
    ```
  - **Advanced Animations**:
    - Smooth hover transforms with `translateY(-4px)` elevation
    - Progressive shadow depth on interaction
    - Color-coded category borders with gradient overlays
  - **Professional Typography**:
    - Inter font family for modern appearance
    - Gradient text for headings using `backgroundClip: 'text'`
    - Optimized letter spacing and line heights
- **Status**: ✅ Completed - Cards now have modern, professional appearance

### Dashboard Theme Modernization (Completed ✅)
- **Date**: 2025-09-11
- **Problem**: Dashboard used basic Microsoft-style colors lacking modern vivid appearance
- **Files Modified**:
  - `/client/src/contexts/ThemeContext.tsx:44-265` - Complete theme overhaul
- **Theme Enhancements**:
  - **Modern Vivid Color Palette**:
    ```typescript
    primary: { main: '#6366f1' }      // Modern indigo
    secondary: { main: '#10b981' }    // Modern emerald
    success: { main: '#10b981' }      // Emerald
    warning: { main: '#f59e0b' }      // Amber
    info: { main: '#06b6d4' }         // Cyan
    error: { main: '#ef4444' }        // Modern red
    ```
  - **Gradient Backgrounds**:
    - Light mode: `linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)`
    - Dark mode: `linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)`
  - **Enhanced Component Styling**:
    - Cards with gradient backgrounds and enhanced shadows
    - Buttons with gradient fills and hover animations
    - Text fields with interactive elevation effects
    - Modern typography with gradient text headers
- **Status**: ✅ Completed - Dashboard now features modern vivid design throughout