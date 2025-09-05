# Deployment Guide - SharePoint AI Dashboard

This guide provides comprehensive instructions for deploying the SharePoint AI Dashboard in different environments.

## 📋 Pre-Deployment Checklist

### Prerequisites
- [ ] Docker and Docker Compose installed
- [ ] Node.js 18.x or 20.x (for development)
- [ ] PostgreSQL 16+ accessible (or Docker)
- [ ] Redis 7+ accessible (or Docker)
- [ ] SharePoint Online tenant with registered app
- [ ] OpenAI API key or Azure OpenAI service configured

### Configuration Files
- [ ] Environment files created (`.env.development`, `.env.staging`, `.env.production`)
- [ ] SSL certificates obtained (for production)
- [ ] Backup storage configured (S3 bucket)
- [ ] Monitoring endpoints configured

### Security Requirements
- [ ] Secrets properly configured and encrypted
- [ ] Database passwords are strong (>16 characters)
- [ ] JWT secrets are cryptographically secure (>64 characters)
- [ ] Network security groups configured
- [ ] Firewall rules applied

## 🚀 Deployment Methods

### Method 1: Quick Deployment (Recommended for Testing)

```bash
# Clone repository
git clone <repository-url>
cd sharepoint_project

# Copy and configure environment
cp .env.example .env.development
# Edit .env.development with your settings

# Deploy with Docker Compose
docker-compose --env-file .env.development up -d --build

# Run database migrations
docker-compose --env-file .env.development exec backend npm run migrate

# Check status
docker-compose --env-file .env.development ps
```

### Method 2: Production Deployment Script

```bash
# Make deployment script executable
chmod +x scripts/deploy.sh

# Deploy to production
./scripts/deploy.sh -e production

# Or with custom options
./scripts/deploy.sh -e production --force-rebuild --skip-tests
```

### Method 3: Manual Step-by-Step Deployment

#### Step 1: Environment Setup

```bash
# Create production environment file
cp .env.example .env.production

# Edit configuration (see Configuration section below)
nano .env.production
```

#### Step 2: Build and Test

```bash
# Install dependencies and run tests
cd client && npm install && npm run test
cd ../server && npm install && npm run test

# Build applications
cd ../client && npm run build
cd ../server && npm run build
```

#### Step 3: Deploy Services

```bash
# Start infrastructure services first
docker-compose --env-file .env.production up -d database redis elasticsearch

# Wait for services to be ready (check health)
docker-compose --env-file .env.production ps

# Run database migrations
docker-compose --env-file .env.production exec database psql -U postgres -c "CREATE DATABASE IF NOT EXISTS sharepoint_ai_dashboard;"
docker-compose --env-file .env.production run --rm backend npm run migrate

# Start application services
docker-compose --env-file .env.production up -d backend frontend

# Start monitoring services
docker-compose --env-file .env.production up -d prometheus grafana logstash kibana
```

#### Step 4: Verification

```bash
# Check all services are healthy
docker-compose --env-file .env.production ps

# Test application endpoints
curl -f http://localhost/health || echo "Frontend not ready"
curl -f http://localhost:3001/health || echo "Backend not ready"

# Check logs for any errors
docker-compose --env-file .env.production logs backend --tail=50
```

## ⚙️ Configuration

### Environment Configuration

The application supports three environments with specific configuration files:

#### Development (`.env.development`)
- Debug mode enabled
- Relaxed security settings
- Local database connections
- Verbose logging
- Development ports (3000, 3001)

#### Staging (`.env.staging`)
- Production-like settings
- Moderate security settings
- External database connections
- Standard logging
- Testing endpoints enabled

#### Production (`.env.production`)
- Maximum security settings
- Encrypted connections required
- Production database connections
- Error-level logging only
- Debug features disabled

### Required Environment Variables

#### Application Settings
```env
NODE_ENV=production
APP_NAME=SharePoint AI Dashboard
LOG_LEVEL=warn
```

#### Database Configuration
```env
DB_HOST=database
DB_PORT=5432
DB_NAME=sharepoint_ai_dashboard
DB_USER=sharepointai
DB_PASSWORD=SECURE_PASSWORD_HERE
DB_SSL=true
DB_POOL_MAX=20
```

#### Security Configuration
```env
JWT_SECRET=MINIMUM_64_CHARACTER_SECURE_JWT_SECRET
ENCRYPTION_KEY=32_CHARACTER_ENCRYPTION_KEY_HERE
SESSION_SECRET=SECURE_SESSION_SECRET_HERE
CORS_ORIGINS=https://yourdomain.com
```

#### SharePoint Integration
```env
SHAREPOINT_CLIENT_ID=your_sharepoint_app_id
SHAREPOINT_CLIENT_SECRET=your_sharepoint_app_secret
SHAREPOINT_TENANT_ID=your_azure_tenant_id
```

#### AI Services
```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4

# Or Azure OpenAI (Recommended for enterprise)
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your_azure_openai_key
AZURE_OPENAI_DEPLOYMENT=gpt-4
```

### SSL/TLS Configuration

#### Development
```env
SSL_ENABLED=false
```

#### Production
```env
SSL_ENABLED=true
SSL_CERT_PATH=./certs/production-cert.pem
SSL_KEY_PATH=./certs/production-key.pem
SSL_CA_PATH=./certs/production-ca.pem
```

## 🏗️ Infrastructure Setup

### Docker Compose Services

The application includes the following services:

#### Core Application Services
- **frontend**: React application served by NGINX
- **backend**: Node.js API server
- **database**: PostgreSQL 16 with initialization scripts
- **redis**: Redis for caching and sessions

#### Monitoring Services
- **prometheus**: Metrics collection
- **grafana**: Metrics visualization dashboards
- **elasticsearch**: Log storage and search
- **logstash**: Log processing and parsing
- **kibana**: Log visualization and analysis

#### Service Dependencies
```yaml
backend:
  depends_on:
    database: { condition: service_healthy }
    redis: { condition: service_healthy }

frontend:
  depends_on:
    backend: { condition: service_healthy }
```

### Resource Requirements

#### Minimum Requirements (Development)
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB
- **Network**: 1Mbps

#### Recommended Requirements (Production)
- **CPU**: 4-8 cores
- **RAM**: 16-32GB
- **Storage**: 100GB SSD
- **Network**: 10Mbps+

#### Service Resource Allocation
```yaml
# Example Docker Compose resource limits
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M

  database:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
        reservations:
          cpus: '1.0'
          memory: 1G
```

## 🔧 Environment-Specific Deployments

### Development Environment

```bash
# Quick development setup
cp .env.example .env.development

# Start minimal services for development
docker-compose -f docker-compose.test.yml up -d postgres redis

# Install and run in development mode
cd server && npm install && npm run dev
cd client && npm install && npm run dev
```

**Development URLs:**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Database: localhost:5432

### Staging Environment

```bash
# Configure staging environment
cp .env.example .env.staging
# Edit .env.staging with staging configuration

# Deploy staging environment
docker-compose --env-file .env.staging up -d --build

# Run staging-specific migrations
docker-compose --env-file .env.staging exec backend npm run migrate

# Run smoke tests
./scripts/test-deployment.sh staging
```

**Staging URLs:**
- Frontend: https://staging.sharepoint-ai.company.com
- Backend API: https://staging-api.sharepoint-ai.company.com
- Grafana: https://staging-monitoring.sharepoint-ai.company.com

### Production Environment

```bash
# Configure production environment
cp .env.example .env.production
# CAREFULLY edit .env.production with production settings

# Deploy using deployment script (recommended)
./scripts/deploy.sh -e production

# OR manual deployment
docker-compose --env-file .env.production up -d --build
docker-compose --env-file .env.production exec backend npm run migrate

# Verify deployment
./scripts/verify-deployment.sh production
```

**Production URLs:**
- Frontend: https://sharepoint-ai.company.com
- Backend API: https://api.sharepoint-ai.company.com
- Grafana: https://monitoring.sharepoint-ai.company.com (internal)

## 📊 Post-Deployment Verification

### Health Checks

#### Application Health
```bash
# Frontend health check
curl -f https://sharepoint-ai.company.com/health

# Backend health check
curl -f https://api.sharepoint-ai.company.com/health

# Database connectivity check
docker-compose --env-file .env.production exec backend npm run health:db
```

#### Service Status
```bash
# Check all services
docker-compose --env-file .env.production ps

# Check logs for errors
docker-compose --env-file .env.production logs --tail=100

# Check resource usage
docker stats
```

### Functional Testing

#### Authentication Flow
```bash
# Test SharePoint authentication
curl -X POST https://api.sharepoint-ai.company.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"code": "test_auth_code"}'
```

#### AI Integration
```bash
# Test AI endpoint
curl -X POST https://api.sharepoint-ai.company.com/api/ai/analyze \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "Test document content"}'
```

#### File Upload
```bash
# Test file upload
curl -X POST https://api.sharepoint-ai.company.com/api/documents/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@test-document.pdf"
```

### Performance Verification

#### Load Testing
```bash
# Install k6 for load testing
sudo apt-get install k6

# Run basic load test
k6 run --duration=5m --vus=50 scripts/load-test.js
```

#### Monitoring Verification
- **Grafana Dashboards**: Verify metrics are being collected
- **Prometheus Targets**: Check all targets are healthy
- **Kibana Logs**: Verify logs are being processed
- **Alert Rules**: Test alert firing and notifications

## 🔒 Security Hardening

### Pre-Production Security Checklist

#### Network Security
- [ ] Firewall rules configured to block unnecessary ports
- [ ] SSL/TLS certificates installed and configured
- [ ] Database access restricted to application servers only
- [ ] Redis password authentication enabled
- [ ] Internal services not exposed to internet

#### Application Security
- [ ] Debug mode disabled in production
- [ ] Error messages don't expose sensitive information
- [ ] Rate limiting configured and tested
- [ ] Input validation enabled on all endpoints
- [ ] Security headers configured in NGINX

#### Access Control
- [ ] Strong passwords for all service accounts
- [ ] JWT secrets are cryptographically secure
- [ ] API keys properly encrypted and stored
- [ ] Database user has minimal required permissions
- [ ] Container processes run as non-root users

### Security Monitoring

#### Log Analysis
```bash
# Monitor authentication attempts
docker-compose --env-file .env.production logs backend | grep "auth"

# Monitor failed requests
docker-compose --env-file .env.production logs frontend | grep "error"

# Monitor security events
docker-compose --env-file .env.production logs backend | grep "security"
```

#### Security Alerts
Configure alerts for:
- Multiple failed authentication attempts
- Unusual API usage patterns
- High error rates
- Suspicious IP addresses
- Database connection failures

## 🔄 Maintenance and Updates

### Regular Maintenance Tasks

#### Daily
- [ ] Check service health status
- [ ] Review error logs
- [ ] Monitor resource usage
- [ ] Verify backup completion

#### Weekly
- [ ] Update security patches
- [ ] Review performance metrics
- [ ] Clean up old log files
- [ ] Test backup restore procedures

#### Monthly
- [ ] Update application dependencies
- [ ] Review and rotate secrets
- [ ] Conduct security scans
- [ ] Performance optimization review

### Update Procedures

#### Application Updates
```bash
# Pull latest changes
git pull origin main

# Rebuild and deploy
./scripts/deploy.sh -e production --force-rebuild

# Verify update
./scripts/verify-deployment.sh production
```

#### Database Migrations
```bash
# Run new migrations
docker-compose --env-file .env.production exec backend npm run migrate

# Verify migration status
docker-compose --env-file .env.production exec backend npm run migrate:status
```

#### Container Updates
```bash
# Pull latest base images
docker-compose --env-file .env.production pull

# Rebuild with updated base images
docker-compose --env-file .env.production up -d --build
```

## 📞 Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check container status
docker-compose --env-file .env.production ps

# View detailed logs
docker-compose --env-file .env.production logs [service-name] --tail=100

# Check resource usage
docker stats

# Restart specific service
docker-compose --env-file .env.production restart [service-name]
```

#### Database Connection Issues
```bash
# Test database connectivity
docker-compose --env-file .env.production exec backend npm run health:db

# Check database logs
docker-compose --env-file .env.production logs database --tail=50

# Verify database credentials
docker-compose --env-file .env.production exec database psql -U $DB_USER -d $DB_NAME -c "SELECT version();"
```

#### Performance Issues
```bash
# Check resource usage
docker stats

# Analyze slow queries
docker-compose --env-file .env.production logs database | grep "slow"

# Review application metrics in Grafana
# http://localhost:3000/dashboards
```

### Recovery Procedures

#### Service Recovery
```bash
# Stop all services
docker-compose --env-file .env.production down

# Clean up containers and volumes (CAUTION: This will delete data)
docker system prune -a --volumes

# Restore from backup
./scripts/restore-backup.sh [backup-date]

# Restart services
docker-compose --env-file .env.production up -d
```

#### Database Recovery
```bash
# Stop application services
docker-compose --env-file .env.production stop backend frontend

# Restore database from backup
docker-compose --env-file .env.production exec database pg_restore -U postgres -d sharepoint_ai_dashboard /backup/latest.dump

# Restart application services
docker-compose --env-file .env.production start backend frontend
```

## 📧 Support and Contacts

### Emergency Contacts
- **System Administrator**: admin@company.com
- **DevOps Team**: devops@company.com
- **Security Team**: security@company.com
- **On-call Phone**: +1-XXX-XXX-XXXX

### Support Resources
- **Documentation**: https://docs.sharepoint-ai.company.com
- **Status Page**: https://status.sharepoint-ai.company.com
- **Issue Tracking**: https://github.com/company/sharepoint-ai-dashboard/issues
- **Chat Support**: #sharepoint-ai-support on Slack

---

This deployment guide provides comprehensive instructions for setting up the SharePoint AI Dashboard in any environment. For additional support or questions, please contact the development team.