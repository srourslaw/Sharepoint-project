# Quick Start Guide 🚀

Get the SharePoint AI Dashboard running in under 5 minutes!

## 🏃‍♂️ **Instant Setup**

### **Prerequisites**
- Docker & Docker Compose installed
- 8GB RAM minimum
- 2GB free disk space

### **⚡ 3-Command Setup**

```bash
# 1. Clone & Navigate
git clone https://github.com/thakralone/sharepoint-ai-dashboard.git
cd sharepoint-ai-dashboard

# 2. Quick Start
FRONTEND_PORT=8080 CORS_ORIGIN="http://localhost:8080" docker-compose up -d

# 3. Open Application
open http://localhost:8080
```

## ✅ **Verify Installation**

### **Check Services**
```bash
docker-compose ps
```
Should show all services as "Up":
- `sharepoint-ai-frontend` (Port 8080)
- `sharepoint-ai-backend` (Port 3001)
- `sharepoint-ai-db` (PostgreSQL)
- `sharepoint-ai-redis` (Cache)

### **Test Frontend**
Visit http://localhost:8080 - you should see the SharePoint AI Dashboard with:
- Purple-themed header with Thakral One branding
- Resizable sidebar with navigation options
- Main content area with file browser
- Responsive design that adapts to screen size

### **Test Backend API**
```bash
curl http://localhost:3001/api/health
# Should return: {"status":"ok","timestamp":"..."}
```

## 🎯 **First Steps**

### **1. Explore the Interface**
- **Sidebar Navigation**: Click items to navigate between sections
- **Resizable Sidebar**: Click the edge dots to collapse/expand
- **Search**: Use the search field to filter content
- **File Browser**: Browse through folders and files

### **2. Test Key Features**
- **Context Menus**: Right-click on files for options
- **File Preview**: Click on documents to preview them
- **Responsive Design**: Resize your browser window
- **AI Panel**: Access AI features from the right panel

### **3. Check Logs (Optional)**
```bash
# Frontend logs
docker logs sharepoint-ai-frontend --tail=20

# Backend logs
docker logs sharepoint-ai-backend --tail=20
```

## 🛠 **Development Mode**

### **For Active Development**
```bash
# Start in development mode with hot reload
cd client
npm install
npm run dev

# In another terminal - start backend
cd server
npm install
npm run dev
```

## 🐛 **Common Issues**

### **Port Already in Use**
```bash
# Change the port
FRONTEND_PORT=9000 docker-compose up -d
# Then visit http://localhost:9000
```

### **Services Won't Start**
```bash
# Clean restart
docker-compose down
docker-compose up -d --build
```

### **Permission Issues (Linux/Mac)**
```bash
sudo docker-compose up -d
```

## 🎉 **Success!**

You should now have:
- ✅ SharePoint AI Dashboard running at http://localhost:8080
- ✅ Modern, professional interface with resizable sidebar
- ✅ All backend services operational
- ✅ Ready for SharePoint integration

## 📚 **Next Steps**

1. **[User Guide](USER_GUIDE.md)** - Learn to use all features
2. **[Development Setup](DEVELOPMENT_SETUP.md)** - Set up for development
3. **[API Reference](../api/API_REFERENCE.md)** - Explore the API
4. **[Configuration](../technical/CONFIGURATION.md)** - Customize settings

## 💡 **Pro Tips**

- **Bookmark** http://localhost:8080 for easy access
- **Try the sidebar resize** by clicking the elegant edge dots
- **Test mobile view** by resizing your browser window
- **Use search** to quickly find files and folders
- **Right-click files** to see context menu options

---

*Need help? Check our [Troubleshooting Guide](TROUBLESHOOTING.md) or create an issue on GitHub.*