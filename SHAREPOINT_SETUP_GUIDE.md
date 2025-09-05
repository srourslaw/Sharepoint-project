# SharePoint Data Access - Setup Guide

## 🔍 Issue Identified
Your SharePoint AI Dashboard is running successfully but cannot access SharePoint data because the Azure AD App Registration credentials are not configured.

## 📋 Current Status
- ✅ Application is running (Frontend: http://localhost:3000, Backend: http://localhost:3001)
- ✅ Authentication system is working
- ❌ SharePoint API calls are failing due to missing credentials
- ⚠️ Falling back to mock data (which shows "Communication site" and "All Company" folders)

## 🛠️ Step-by-Step Fix

### Step 1: Create Azure AD App Registration

1. **Go to Azure Portal**
   - Visit: https://portal.azure.com
   - Sign in with your organization account (the one with SharePoint access)

2. **Navigate to Azure Active Directory**
   - Search for "Azure Active Directory" in the search bar
   - Click on "App registrations" in the left menu

3. **Create New App Registration**
   - Click "New registration"
   - Fill in the details:
     - **Name**: `SharePoint AI Dashboard`
     - **Supported account types**: `Accounts in this organizational directory only (Single tenant)`
     - **Redirect URI**: Select `Web` and enter: `http://localhost:3001/auth/callback`
   - Click "Register"

4. **Note Down Important Values**
   After registration, you'll see an overview page. Copy these values:
   - **Application (client) ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - **Directory (tenant) ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

5. **Create Client Secret**
   - In your app registration, go to "Certificates & secrets"
   - Click "New client secret"
   - Add description: `SharePoint Dashboard Secret`
   - Set expiration: `24 months`
   - Click "Add"
   - **IMPORTANT**: Copy the secret VALUE immediately (it won't be shown again)

6. **Configure API Permissions**
   - Go to "API permissions"
   - Click "Add a permission"
   - Select "Microsoft Graph"
   - Choose "Delegated permissions"
   - Add these permissions:
     - `Sites.Read.All` - Read items in all site collections
     - `Files.Read.All` - Read all files
     - `User.Read` - Sign in and read user profile
     - `offline_access` - Maintain access to data you have given it access to
   - Click "Add permissions"
   - **IMPORTANT**: Click "Grant admin consent for [Your Organization]"

### Step 2: Update Environment Configuration

Open the file `.env.development` and replace these values:

```bash
# Replace these with your actual values from Step 1
SHAREPOINT_CLIENT_ID=REPLACE_WITH_YOUR_CLIENT_ID
SHAREPOINT_CLIENT_SECRET=REPLACE_WITH_YOUR_CLIENT_SECRET  
SHAREPOINT_TENANT_ID=REPLACE_WITH_YOUR_TENANT_ID

# Also update these (same values)
AZURE_CLIENT_ID=REPLACE_WITH_YOUR_CLIENT_ID
AZURE_CLIENT_SECRET=REPLACE_WITH_YOUR_CLIENT_SECRET
AZURE_TENANT_ID=REPLACE_WITH_YOUR_TENANT_ID

# Frontend needs these too
REACT_APP_SHAREPOINT_CLIENT_ID=REPLACE_WITH_YOUR_CLIENT_ID
REACT_APP_SHAREPOINT_TENANT_ID=REPLACE_WITH_YOUR_TENANT_ID
```

### Step 3: Restart the Application

After updating the environment file:

```bash
# Stop the current Docker containers
docker-compose down

# Restart with the new environment
docker-compose --env-file .env.development up --build
```

### Step 4: Test the Connection

1. **Visit the application**: http://localhost:3000
2. **Click "Sign in with Microsoft"**
3. **Authenticate with your Microsoft account**
4. **You should now see your actual SharePoint sites instead of mock data**

## 🔍 Verification Steps

After setup, you should see:
- Real SharePoint sites in the left sidebar instead of "No SharePoint sites found"
- Actual document libraries and files when you navigate
- AI features working with your real documents

## 🚨 Common Issues & Solutions

### Issue: "Grant admin consent" is grayed out
**Solution**: You need to be an Azure AD administrator or ask your IT admin to grant consent.

### Issue: Still seeing mock data after setup
**Solutions**:
1. Check browser developer tools (F12) → Network tab for API errors
2. Verify `ENABLE_REAL_SHAREPOINT=true` in `.env.development`
3. Restart Docker containers completely
4. Check Docker logs: `docker-compose logs backend`

### Issue: Authentication redirects but fails
**Solutions**:
1. Verify redirect URI exactly matches: `http://localhost:3001/auth/callback`
2. Ensure client secret is correct and not expired
3. Check tenant ID is correct

### Issue: "Insufficient privileges" error
**Solution**: Make sure admin consent was granted for all API permissions.

## 🎯 Expected Result

Once configured correctly, you'll see:
- Your actual SharePoint sites in the navigation
- Real document libraries and files
- AI features working with your documents
- Full functionality as shown in your screenshot but with real data

## 📞 Need Help?

If you encounter issues, please share:
1. Any error messages from the browser console (F12)
2. Docker logs: `docker-compose logs backend`
3. The authentication flow you're experiencing

This will help troubleshoot any remaining issues.