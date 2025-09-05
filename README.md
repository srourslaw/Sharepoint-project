# SharePoint AI Dashboard

A comprehensive AI-powered dashboard for managing and analyzing SharePoint content with advanced analytics, document processing, and intelligent insights.

## 🚀 Features

- **📊 Analytics & Insights**: Comprehensive document usage analytics, AI interaction tracking, and performance metrics
- **🤖 AI Integration**: Powered by OpenAI/Azure OpenAI for document analysis and intelligent content processing
- **🔗 SharePoint Integration**: Native Microsoft SharePoint Online integration with secure authentication
- **📈 Real-time Monitoring**: Built-in monitoring with Prometheus, Grafana, and ELK stack
- **🔒 Enterprise Security**: Comprehensive security features including JWT authentication, rate limiting, and audit logging
- **⚙️ Configurable Settings**: Extensive customization options for AI models, UI preferences, and system behavior
- **🧪 Comprehensive Testing**: Full test coverage including unit, integration, and performance tests
- **🐳 Container Ready**: Fully containerized with Docker and Docker Compose

## 📋 Prerequisites

- **Node.js** 18.x or 20.x
- **Docker** and **Docker Compose**
- **PostgreSQL** 16+ (or use Docker)
- **Redis** 7+ (or use Docker)
- **SharePoint Online** tenant with app registration
- **OpenAI API** key or **Azure OpenAI** service

## 🛠️ Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/srourslaw/Sharepoint-project.git
cd Sharepoint-project

# Copy environment file and configure
cp .env.example .env.development
# Edit .env.development with your configuration
```

### 2. Development Setup

```bash
# Install dependencies
cd client && npm install
cd ../server && npm install

# Start development services
docker-compose -f docker-compose.test.yml up -d postgres redis

# Run database migrations
cd server && npm run migrate

# Start development servers
npm run dev  # In server directory
npm start    # In client directory (new terminal)
```

### 3. Docker Setup (Recommended)

```bash
# Copy environment file
cp .env.example .env.development

# Build and start all services
docker-compose --env-file .env.development up --build

# Run migrations
docker-compose --env-file .env.development exec backend npm run migrate
```

The application will be available at:
- **Frontend**: http://localhost:3000 (development) or http://localhost (production)
- **Backend API**: http://localhost:3001
- **Grafana**: http://localhost:3000 (monitoring)
- **Kibana**: http://localhost:5601 (logging)

## 🏗️ Architecture

### Frontend (React 19.1.1)
- **Framework**: React with TypeScript
- **UI Library**: Material-UI (@mui/material)
- **Charts**: Recharts for data visualization
- **State Management**: React Context + useReducer
- **Authentication**: Azure MSAL for SharePoint integration

### Backend (Node.js + Express)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with connection pooling
- **Cache**: Redis for sessions and caching
- **Authentication**: JWT + Azure AD integration
- **API Documentation**: Swagger/OpenAPI

### Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Web Server**: NGINX with security configurations

## 🔧 Configuration

### Environment Variables

The application uses environment-specific configuration files:

- `.env.development` - Development settings
- `.env.staging` - Staging environment
- `.env.production` - Production environment
- `.env.example` - Template with all available options

### Key Configuration Sections

#### SharePoint Integration
```env
SHAREPOINT_CLIENT_ID=your_client_id
SHAREPOINT_CLIENT_SECRET=your_client_secret
SHAREPOINT_TENANT_ID=your_tenant_id
```

#### AI Services
```env
# OpenAI
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-4

# Or Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your_api_key
```

#### Database
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sharepoint_ai_dashboard
DB_USER=sharepointai
DB_PASSWORD=your_secure_password
```

## 🧪 Testing

### Run Tests

```bash
# Frontend tests
cd client
npm test                  # Run tests
npm run test:coverage    # Run with coverage

# Backend tests
cd server
npm test                  # Run tests
npm run test:coverage    # Run with coverage
```

### Test Categories

- **Unit Tests**: Individual component and function testing
- **Integration Tests**: API endpoint and database integration testing
- **Component Tests**: React component behavior testing
- **Authentication Tests**: Login flow and security testing
- **AI Integration Tests**: AI service integration testing
- **Performance Tests**: Load and performance testing

## 🚀 Deployment

### Using Deployment Script

```bash
# Make script executable
chmod +x scripts/deploy.sh

# Deploy to staging
./scripts/deploy.sh -e staging

# Deploy to production
./scripts/deploy.sh -e production

# Deploy with options
./scripts/deploy.sh -e production --skip-tests --force-rebuild
```

### Manual Deployment

```bash
# 1. Build and test
npm run build    # In both client and server
npm run test     # Run all tests

# 2. Deploy with Docker Compose
docker-compose --env-file .env.production up -d --build

# 3. Run migrations
docker-compose --env-file .env.production exec backend npm run migrate
```

### CI/CD Pipeline

The project includes GitHub Actions workflows for:
- **Continuous Integration**: Automated testing and building
- **Security Scanning**: Dependency and container vulnerability scanning
- **Deployment**: Automated deployment to staging and production
- **Performance Testing**: Automated performance testing on staging

## 📊 Monitoring

### Available Dashboards

- **Application Metrics**: Response times, error rates, throughput
- **System Metrics**: CPU, memory, disk usage
- **Security Metrics**: Authentication attempts, suspicious activity
- **Business Metrics**: Document processing, user activity, AI usage costs

### Accessing Monitoring

- **Grafana**: http://localhost:3000 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Kibana**: http://localhost:5601

## 🔒 Security

### Security Features

- ✅ **JWT Authentication** with refresh tokens
- ✅ **Azure AD Integration** for SharePoint access
- ✅ **Rate Limiting** on all API endpoints
- ✅ **Input Validation** and sanitization
- ✅ **HTTPS Enforced** in production
- ✅ **Security Headers** configured
- ✅ **Audit Logging** for all actions
- ✅ **Container Security** with non-root users

### Security Checklist

See [security/security-checklist.md](security/security-checklist.md) for a complete security checklist and compliance requirements.

## 📖 API Documentation

API documentation is available via Swagger UI:
- **Development**: http://localhost:3001/api-docs
- **Staging**: https://staging-api.company.com/api-docs

### Key API Endpoints

```
GET    /api/health              - Health check
POST   /api/auth/login          - User authentication
GET    /api/sharepoint/sites    - Get SharePoint sites
POST   /api/ai/analyze          - AI document analysis
GET    /api/analytics/usage     - Usage analytics
POST   /api/documents/upload    - File upload
```

## 🛠️ Development

### Project Structure

```
sharepoint_project/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── types/         # TypeScript definitions
│   │   ├── utils/         # Utility functions
│   │   └── tests/         # Frontend tests
│   └── Dockerfile
├── server/                 # Node.js backend
│   ├── src/               # Source code
│   ├── migrations/        # Database migrations
│   ├── tests/            # Backend tests
│   └── Dockerfile
├── database/              # Database initialization
├── monitoring/            # Monitoring configuration
│   ├── prometheus/        # Prometheus config
│   └── grafana/          # Grafana dashboards
├── logging/               # Logging configuration
│   └── logstash/         # Logstash pipelines
├── security/              # Security configurations
├── scripts/               # Deployment scripts
└── docker-compose.yml     # Container orchestration
```

### Adding New Features

1. **Create Components**: Add React components in `client/src/components/`
2. **Define Types**: Update TypeScript definitions in `client/src/types/`
3. **Add API Endpoints**: Create Express routes in `server/src/routes/`
4. **Write Tests**: Add comprehensive tests for all new functionality
5. **Update Documentation**: Update README and API documentation

### Code Style

- **TypeScript**: Strict type checking enabled
- **ESLint**: Configured for both frontend and backend
- **Prettier**: Code formatting (run `npm run lint:fix`)
- **Testing**: Jest for unit tests, Supertest for API tests

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Workflow

1. **Install dependencies**: `npm install` in both client and server
2. **Run tests**: `npm test` before committing
3. **Check linting**: `npm run lint` and fix any issues
4. **Update types**: Ensure TypeScript definitions are current
5. **Test integration**: Run full integration tests before PR

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Create GitHub issues for bugs and feature requests
- **Security**: Report security issues privately to security@company.com

## 🔄 Changelog

### Version 1.0.0 (Current)

- ✅ Initial release with complete feature set
- ✅ Full SharePoint integration
- ✅ AI-powered document analysis
- ✅ Comprehensive analytics dashboard
- ✅ Enterprise-grade security
- ✅ Production-ready deployment configuration
- ✅ Complete monitoring and logging setup
- ✅ Extensive testing coverage

### Upcoming Features

- 🔄 Real-time collaboration features
- 🔄 Advanced AI model fine-tuning
- 🔄 Mobile app companion
- 🔄 Advanced workflow automation
- 🔄 Enhanced reporting capabilities

---

**Built with ❤️ for modern SharePoint environments**
