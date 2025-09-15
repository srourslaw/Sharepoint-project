# Network Configuration Guide

## ✅ WORKING CONFIGURATION - USE THIS

The SharePoint AI Dashboard works perfectly with **localhost** configuration. **NO EXTERNAL TUNNELING NEEDED**.

### Current Working Setup
```bash
FRONTEND_PORT=8080 CORS_ORIGIN="http://localhost:8080" docker-compose up -d
```

**Access URL**: http://localhost:8080

## 🚫 WHAT NOT TO DO

### Never Use ngrok for Development
**WRONG**: Previous suggestions to use ngrok were misguided and unnecessary.

```bash
# ❌ DON'T DO THIS
ngrok http 3001
AZURE_REDIRECT_URI="https://xxxxx.ngrok-free.app/auth/callback"
```

### Why ngrok is NOT needed:
1. **Azure OAuth works with localhost** - Microsoft explicitly supports `http://localhost` redirects
2. **Adds unnecessary complexity** - Extra tunnel layer introduces potential failures
3. **Session complications** - External URLs can cause cookie/session issues
4. **Development overhead** - Requires managing tunnel URLs and configuration changes

## 📋 Correct Azure App Registration

### Redirect URIs (in Azure Portal)
```
http://localhost:3001/auth/callback
```

### Environment Variables
```bash
# Frontend
FRONTEND_PORT=8080
CORS_ORIGIN="http://localhost:8080"

# Backend OAuth
AZURE_CLIENT_ID=fd3b804c-5ac4-4e00-8359-f6712fc1e634
AZURE_CLIENT_SECRET=[your-secret]
AZURE_TENANT_ID=a68d3c04-09fe-4a33-a02c-e880c1a7504d
AZURE_REDIRECT_URI=http://localhost:3001/auth/callback
```

## 🔧 Authentication Flow

1. **User visits**: http://localhost:8080
2. **Backend OAuth**: http://localhost:3001/auth/login
3. **Microsoft redirects to**: http://localhost:3001/auth/callback
4. **Frontend callback**: http://localhost:8080/?sessionId=xxx&auth=success
5. **Session established**: 24-hour duration with automatic token refresh

## 📱 Browser Compatibility

### ✅ Confirmed Working
- Chrome (all versions)
- Safari (regular and private browsing)
- Firefox (regular and private browsing)
- Edge

### No Special Configuration Needed
- No hosts file changes
- No network settings modifications
- No firewall rules
- No proxy configuration

## 🚨 Common Mistakes to Avoid

1. **Don't change from localhost to 127.0.0.1** - Stick with localhost
2. **Don't use different ports** - 8080 for frontend, 3001 for backend
3. **Don't add external tunneling** - ngrok, localtunnel, etc. are unnecessary
4. **Don't modify macOS network settings** - The default configuration works

## 🛠️ Troubleshooting

### If Authentication Loops Occur
1. **Check container health**: `docker-compose ps`
2. **Restart services**: `FRONTEND_PORT=8080 CORS_ORIGIN="http://localhost:8080" docker-compose restart`
3. **Clear browser data**: Only as last resort, not typically needed

### Session Issues
- Sessions last 24 hours automatically
- Tokens refresh automatically every 55 minutes
- No manual intervention required

## 📝 Development Commands

### Start System
```bash
FRONTEND_PORT=8080 CORS_ORIGIN="http://localhost:8080" docker-compose up -d
```

### Check Status
```bash
docker-compose ps
```

### View Logs
```bash
docker logs sharepoint-ai-backend --tail=20
docker logs sharepoint-ai-frontend --tail=20
```

## 🔍 Why This Works

Microsoft Azure OAuth2 explicitly supports localhost development:
- RFC 8252 compliance for native applications
- Special treatment for `http://localhost` in redirect validation
- No TLS requirement for localhost development
- Automatic port flexibility for development scenarios

## 📚 References

- [Microsoft OAuth2 Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)
- [RFC 8252: OAuth 2.0 for Native Apps](https://tools.ietf.org/html/rfc8252#section-8.3)
- [Azure App Registration Guide](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)

---

**Last Updated**: 2025-09-15
**Status**: ✅ Production Ready
**Authentication**: ✅ Loops Fixed
**Network**: ✅ Localhost Only