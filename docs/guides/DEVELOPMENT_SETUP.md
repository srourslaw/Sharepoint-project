# Development Setup 💻

Complete guide for setting up a development environment for the SharePoint AI Dashboard.

## 📋 **Prerequisites**

### **Required Software**
- **Node.js**: Version 18+ ([Download](https://nodejs.org))
- **npm**: Version 9+ (comes with Node.js)
- **Git**: Version 2.30+ ([Download](https://git-scm.com))
- **Docker**: Version 20+ ([Download](https://docker.com))
- **Docker Compose**: Version 2.0+ (included with Docker Desktop)

### **Recommended Tools**
- **Visual Studio Code**: Primary IDE with extensions
- **Postman**: API testing
- **pgAdmin**: PostgreSQL management
- **Redis Insight**: Redis management

### **System Requirements**
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 5GB free space
- **OS**: Windows 10+, macOS 10.15+, Ubuntu 20.04+

---

## 🚀 **Quick Start**

### **1. Clone Repository**
```bash
git clone https://github.com/thakralone/sharepoint-ai-dashboard.git
cd sharepoint-ai-dashboard
```

### **2. Environment Setup**
```bash
# Copy environment templates
cp .env.example .env
cp client/.env.example client/.env.local
cp server/.env.example server/.env

# Edit environment files with your values
```

### **3. Install Dependencies**
```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install

# Install server dependencies
cd ../server && npm install

# Return to root
cd ..
```

### **4. Start Development Environment**
```bash
# Option A: Full Docker Development
docker-compose -f docker-compose.dev.yml up -d

# Option B: Hybrid Development (recommended)
# Database & Redis in Docker
docker-compose up -d db redis

# Frontend & Backend locally
npm run dev
```

### **5. Verify Setup**
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **Database**: localhost:5432
- **Redis**: localhost:6379

---

## 🛠 **Detailed Setup**

### **Frontend Development**
```bash
cd client

# Install dependencies
npm install

# Available scripts
npm run dev         # Development server (Vite)
npm run build       # Production build
npm run preview     # Preview production build
npm run lint        # ESLint checking
npm run type-check  # TypeScript checking
```

### **Backend Development**
```bash
cd server

# Install dependencies
npm install

# Available scripts
npm run dev         # Development with nodemon
npm run build       # TypeScript compilation
npm run start       # Production server
npm run test        # Run tests
npm run db:migrate  # Database migrations
npm run db:seed     # Seed test data
```

---

## 🗄️ **Database Setup**

### **PostgreSQL Setup**
```bash
# Using Docker (recommended)
docker-compose up -d db

# Manual setup (if not using Docker)
createdb sharepoint_ai_dev
psql sharepoint_ai_dev < server/sql/schema.sql
```

### **Database Migrations**
```bash
cd server

# Create new migration
npm run migration:create -- --name add_user_preferences

# Run migrations
npm run migrate

# Rollback migration
npm run migrate:rollback

# Check migration status
npm run migrate:status
```

### **Seed Data**
```bash
# Add development data
npm run db:seed

# Reset database
npm run db:reset
```

---

## 🔧 **Configuration**

### **Environment Variables**

**Root `.env`**
```env
# Development environment
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/sharepoint_ai_dev
REDIS_URL=redis://localhost:6379

# API URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001

# Azure AD Configuration
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_TENANT_ID=your-tenant-id

# JWT Configuration
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d

# OpenAI Configuration
OPENAI_API_KEY=your-openai-key

# Google AI Configuration
GOOGLE_API_KEY=your-gemini-key
```

**Client `.env.local`**
```env
VITE_API_URL=http://localhost:3001/api
VITE_AZURE_CLIENT_ID=your-client-id
VITE_AZURE_TENANT_ID=your-tenant-id
VITE_ENVIRONMENT=development
```

**Server `.env`**
```env
PORT=3001
CORS_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://user:password@localhost:5432/sharepoint_ai_dev
REDIS_URL=redis://localhost:6379
SESSION_SECRET=your-session-secret
LOG_LEVEL=debug
```

---

## 🎨 **VS Code Setup**

### **Recommended Extensions**
Install these extensions for optimal development experience:

```json
{
  "recommendations": [
    "ms-typescript.vscode-typescript",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-vscode.vscode-json",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-docker",
    "ms-vscode.vscode-postgres",
    "humao.rest-client"
  ]
}
```

### **VS Code Settings**
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.env": true
  }
}
```

### **Debugging Configuration**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Frontend",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/client/src",
      "sourceMapPathOverrides": {
        "webpack:///src/*": "${webRoot}/*"
      }
    },
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/server/src/index.ts",
      "outFiles": ["${workspaceFolder}/server/dist/**/*.js"],
      "envFile": "${workspaceFolder}/server/.env",
      "runtimeArgs": ["-r", "ts-node/register"]
    }
  ]
}
```

---

## 🧪 **Testing Setup**

### **Frontend Testing**
```bash
cd client

# Unit tests with Jest
npm run test

# Integration tests
npm run test:integration

# E2E tests with Playwright
npm run test:e2e

# Coverage report
npm run test:coverage
```

### **Backend Testing**
```bash
cd server

# Unit tests
npm run test

# Integration tests
npm run test:integration

# API tests
npm run test:api

# Load testing
npm run test:load
```

### **Test Database**
```bash
# Create test database
createdb sharepoint_ai_test

# Run migrations for test DB
NODE_ENV=test npm run migrate

# Seed test data
NODE_ENV=test npm run seed
```

---

## 🐳 **Docker Development**

### **Development Docker Compose**
```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  frontend:
    build:
      context: ./client
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./client:/app
      - /app/node_modules
    environment:
      - CHOKIDAR_USEPOLLING=true

  backend:
    build:
      context: ./server
      dockerfile: Dockerfile.dev
    ports:
      - "3001:3001"
    volumes:
      - ./server:/app
      - /app/node_modules
    depends_on:
      - db
      - redis
```

### **Development Commands**
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose logs -f frontend backend

# Rebuild services
docker-compose -f docker-compose.dev.yml build --no-cache

# Clean up
docker-compose -f docker-compose.dev.yml down -v
```

---

## 🔄 **Development Workflow**

### **Branch Strategy**
```
main                 # Production-ready code
├── develop          # Development integration
├── feature/*        # Feature development
├── bugfix/*         # Bug fixes
├── hotfix/*         # Production hotfixes
└── release/*        # Release preparation
```

### **Git Workflow**
```bash
# Start feature development
git checkout develop
git pull origin develop
git checkout -b feature/sidebar-improvements

# Make changes and commit
git add .
git commit -m "feat: improve sidebar interaction"

# Push and create pull request
git push origin feature/sidebar-improvements
# Create PR on GitHub

# After review and merge
git checkout develop
git pull origin develop
git branch -d feature/sidebar-improvements
```

### **Commit Convention**
```
feat: new feature
fix: bug fix
docs: documentation changes
style: code style changes
refactor: code refactoring
test: test additions/modifications
chore: maintenance tasks

Example:
feat(sidebar): add click-to-toggle functionality
fix(api): resolve authentication timeout issue
docs(readme): update installation instructions
```

---

## 🚦 **Code Quality**

### **ESLint Configuration**
```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "no-console": "warn",
    "@typescript-eslint/no-unused-vars": "error",
    "prefer-const": "error"
  }
}
```

### **Prettier Configuration**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

### **Pre-commit Hooks**
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run test"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

---

## 🔍 **Debugging**

### **Frontend Debugging**
- **React DevTools**: Browser extension for React debugging
- **Redux DevTools**: For state management debugging
- **Network Tab**: Monitor API calls
- **Console Logs**: Strategic logging for development

### **Backend Debugging**
- **Node.js Inspector**: Built-in debugging
- **Winston Logging**: Structured logging system
- **Postman**: API endpoint testing
- **Database Logs**: PostgreSQL query debugging

### **Common Issues & Solutions**

**Port Already in Use**
```bash
# Find process using port
lsof -ti:3000
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

**Module Not Found**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Database Connection Issues**
```bash
# Check database status
docker-compose logs db

# Reset database
docker-compose down -v
docker-compose up -d db
```

---

## 🚀 **Production Build**

### **Frontend Build**
```bash
cd client
npm run build

# Output in dist/ directory
# Copy to web server or CDN
```

### **Backend Build**
```bash
cd server
npm run build

# Output in dist/ directory
# Deploy with PM2 or Docker
```

### **Docker Production Build**
```bash
# Build production images
docker-compose build

# Deploy with production config
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📚 **Additional Resources**

### **Documentation**
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://typescriptlang.org/docs)
- [Material-UI Docs](https://mui.com)
- [Node.js Guides](https://nodejs.org/en/docs/guides)
- [Express.js Guide](https://expressjs.com/en/guide)

### **Tools & Utilities**
- [Postman Collections](../api/postman-collection.json)
- [Database Schema](../technical/DATABASE.md)
- [API Reference](../api/API_REFERENCE.md)
- [Deployment Guide](DEPLOYMENT.md)

---

*Happy coding! The development environment is optimized for productivity and ease of use.*