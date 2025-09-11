# 🚀 Claude Talimat DevOps Guide

## 📋 Overview

This guide covers the complete DevOps implementation for the Claude Talimat İş Güvenliği Yönetim Sistemi, including CI/CD pipelines, automated deployments, environment management, and blue-green deployments.

## 🏗️ DevOps Architecture

### **CI/CD Pipeline**
- **GitHub Actions**: Automated testing, building, and deployment
- **Multi-environment support**: Development, Staging, Production
- **Security scanning**: Trivy vulnerability scanner, Snyk security checks
- **Automated testing**: Unit tests, integration tests, E2E tests
- **Docker image building**: Multi-architecture support (AMD64, ARM64)

### **Environment Management**
- **Development**: Local development with hot reload
- **Staging**: Pre-production testing environment
- **Production**: Blue-green deployment strategy
- **Environment-specific configurations**: Separate configs for each environment

### **Deployment Strategies**
- **Development**: Direct deployment with hot reload
- **Staging**: Automated deployment with testing
- **Production**: Blue-green deployment with zero downtime

## 🔧 Setup Instructions

### **1. Prerequisites**

```bash
# Install required tools
sudo apt-get update
sudo apt-get install -y docker.io docker-compose git curl jq

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER
```

### **2. Environment Configuration**

```bash
# Copy environment files
cp env.example .env
cp env.dev .env.dev
cp env.staging .env.staging
cp env.production .env.production

# Update environment variables
nano .env
```

### **3. GitHub Actions Setup**

1. **Fork the repository** to your GitHub account
2. **Set up secrets** in GitHub repository settings:
   - `POSTGRES_PASSWORD`: Database password
   - `JWT_SECRET`: JWT secret key
   - `OPENAI_API_KEY`: OpenAI API key
   - `ANTHROPIC_API_KEY`: Anthropic API key
   - `SMTP_HOST`: SMTP server host
   - `SMTP_PORT`: SMTP server port
   - `SMTP_USER`: SMTP username
   - `SMTP_PASS`: SMTP password
   - `GRAFANA_PASSWORD`: Grafana admin password
   - `SNYK_TOKEN`: Snyk security token

3. **Enable GitHub Actions** in repository settings

## 🚀 Deployment Commands

### **Development Environment**

```bash
# Deploy to development
./scripts/deploy.sh dev deploy

# Check status
./scripts/deploy.sh dev status

# Run health checks
./scripts/health-check.sh dev quick
```

### **Staging Environment**

```bash
# Deploy to staging
./scripts/deploy.sh staging deploy

# Check status
./scripts/deploy.sh staging status

# Run comprehensive health checks
./scripts/health-check.sh staging comprehensive
```

### **Production Environment (Blue-Green)**

```bash
# Deploy using blue-green strategy
./scripts/blue-green-deploy.sh deploy

# Check status of both environments
./scripts/blue-green-deploy.sh status

# Run health checks on active environment
./scripts/blue-green-deploy.sh health
```

## 🔄 CI/CD Pipeline

### **Pipeline Stages**

1. **Code Quality**
   - Linting (ESLint, Prettier)
   - Type checking (TypeScript)
   - Code formatting validation

2. **Testing**
   - Unit tests (Jest, Vitest)
   - Integration tests
   - E2E tests (Playwright)

3. **Security Scanning**
   - Trivy vulnerability scanner
   - Snyk security checks
   - Dependency vulnerability scanning

4. **Building**
   - Docker image building
   - Multi-architecture support
   - Image optimization

5. **Deployment**
   - Environment-specific deployment
   - Health checks
   - Rollback capabilities

### **Pipeline Triggers**

- **Push to main**: Deploy to production (blue-green)
- **Push to staging**: Deploy to staging
- **Push to develop**: Deploy to development
- **Pull Request**: Run tests and security scans

## 🌍 Environment Management

### **Development Environment**

**Configuration**: `docker-compose.dev.yml`
- **Purpose**: Local development and testing
- **Features**: Hot reload, debug mode, mock APIs
- **Ports**: 
  - Frontend: 3000
  - API Gateway: 8080
  - Services: 8003-8007
  - Database: 5433
  - Redis: 6380

**Environment Variables**: `env.dev`
```bash
NODE_ENV=development
LOG_LEVEL=debug
HOT_RELOAD=true
DEBUG_MODE=true
```

### **Staging Environment**

**Configuration**: `docker-compose.staging.yml`
- **Purpose**: Pre-production testing
- **Features**: Production-like setup, performance monitoring
- **Ports**: Same as development
- **Security**: Enhanced security headers, rate limiting

**Environment Variables**: `env.staging`
```bash
NODE_ENV=staging
LOG_LEVEL=info
PERFORMANCE_MONITORING=true
```

### **Production Environment**

**Configuration**: `docker-compose.prod.yml`, `docker-compose.blue.yml`, `docker-compose.green.yml`
- **Purpose**: Live production environment
- **Features**: Blue-green deployment, high availability
- **Security**: Maximum security, rate limiting, monitoring

**Environment Variables**: `env.production`
```bash
NODE_ENV=production
LOG_LEVEL=warn
SECURITY_HEADERS=true
RATE_LIMITING=true
```

## 🔵🟢 Blue-Green Deployment

### **How It Works**

1. **Blue Environment**: Current production environment
2. **Green Environment**: New production environment
3. **Traffic Switch**: Seamless switching between environments
4. **Zero Downtime**: No service interruption during deployment

### **Deployment Process**

1. **Deploy to Green**: Deploy new version to green environment
2. **Health Checks**: Verify green environment is healthy
3. **Traffic Switch**: Route traffic from blue to green
4. **Verification**: Monitor green environment
5. **Cleanup**: Stop blue environment after successful switch

### **Rollback Process**

1. **Detect Issues**: Monitor green environment
2. **Switch Back**: Route traffic back to blue
3. **Investigate**: Debug issues in green environment
4. **Fix and Redeploy**: Fix issues and redeploy

## 📊 Monitoring and Health Checks

### **Health Check Endpoints**

- **Frontend**: `http://localhost:3000`
- **API Gateway**: `http://localhost:8080/health`
- **Auth Service**: `http://localhost:8004/health`
- **Analytics Service**: `http://localhost:8003/health`
- **Instruction Service**: `http://localhost:8005/health`
- **AI Service**: `http://localhost:8006/health`
- **Notification Service**: `http://localhost:8007/health`

### **Monitoring Stack**

- **Prometheus**: Metrics collection
- **Grafana**: Dashboards and visualization
- **Node Exporter**: System metrics
- **cAdvisor**: Container metrics
- **Custom Metrics**: Application-specific metrics

### **Health Check Scripts**

```bash
# Quick health check
./scripts/health-check.sh dev quick

# Comprehensive health check
./scripts/health-check.sh staging comprehensive

# Continuous monitoring
./scripts/health-check.sh production monitor 30
```

## 🔒 Security Features

### **Container Security**
- **Base Images**: Alpine Linux for minimal attack surface
- **Non-root Users**: Containers run as non-root users
- **Resource Limits**: CPU and memory limits per container
- **Security Scanning**: Automated vulnerability scanning

### **Network Security**
- **Network Isolation**: Docker networks for service isolation
- **TLS/SSL**: HTTPS encryption for all communications
- **Rate Limiting**: API rate limiting and DDoS protection
- **CORS**: Cross-origin resource sharing configuration

### **Application Security**
- **JWT Tokens**: Secure authentication
- **Input Validation**: Comprehensive input validation
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Cross-site scripting prevention

## 📈 Performance Optimization

### **Container Optimization**
- **Multi-stage Builds**: Optimized Docker images
- **Layer Caching**: Efficient layer caching
- **Image Compression**: Compressed images for faster deployment
- **Resource Limits**: Proper resource allocation

### **Database Optimization**
- **Connection Pooling**: Efficient database connections
- **Indexing**: Optimized database indexes
- **Query Optimization**: Efficient database queries
- **Caching**: Redis caching for frequently accessed data

### **Network Optimization**
- **Load Balancing**: Nginx load balancing
- **CDN Ready**: Content delivery network support
- **Compression**: Gzip compression for responses
- **Keep-Alive**: HTTP keep-alive connections

## 🚨 Troubleshooting

### **Common Issues**

1. **Container Won't Start**
   ```bash
   # Check container logs
   docker logs <container_name>
   
   # Check container status
   docker ps -a
   ```

2. **Health Check Failures**
   ```bash
   # Run health check script
   ./scripts/health-check.sh dev comprehensive
   
   # Check service logs
   tail -f logs/<service>/app.log
   ```

3. **Database Connection Issues**
   ```bash
   # Check database status
   docker-compose ps postgres
   
   # Check database logs
   docker logs claude-talimat_postgres_1
   ```

4. **Port Conflicts**
   ```bash
   # Check port usage
   netstat -tulpn | grep :<port>
   
   # Kill process using port
   sudo kill -9 <pid>
   ```

### **Debug Commands**

```bash
# Check all containers
docker ps -a

# Check container logs
docker logs <container_name>

# Execute command in container
docker exec -it <container_name> /bin/sh

# Check resource usage
docker stats

# Check network
docker network ls
docker network inspect claude-network
```

## 📚 Best Practices

### **Development**
- **Feature Branches**: Use feature branches for development
- **Code Reviews**: Require code reviews before merging
- **Testing**: Write comprehensive tests
- **Documentation**: Keep documentation updated

### **Deployment**
- **Blue-Green**: Use blue-green deployment for production
- **Health Checks**: Always run health checks after deployment
- **Rollback Plan**: Have a rollback plan ready
- **Monitoring**: Monitor deployments closely

### **Security**
- **Secrets Management**: Use environment variables for secrets
- **Regular Updates**: Keep dependencies updated
- **Security Scanning**: Run security scans regularly
- **Access Control**: Implement proper access controls

### **Monitoring**
- **Logs**: Centralize and monitor logs
- **Metrics**: Collect and analyze metrics
- **Alerts**: Set up alerts for critical issues
- **Dashboards**: Use dashboards for visualization

## 🔄 Maintenance

### **Regular Tasks**
- **Security Updates**: Update dependencies and base images
- **Backup Verification**: Verify backups are working
- **Log Rotation**: Rotate logs to prevent disk space issues
- **Performance Monitoring**: Monitor and optimize performance

### **Scheduled Maintenance**
- **Weekly**: Security scans, dependency updates
- **Monthly**: Performance reviews, capacity planning
- **Quarterly**: Security audits, disaster recovery tests

## 📞 Support

For DevOps-related issues:
1. Check the troubleshooting section
2. Review logs and health checks
3. Check GitHub Issues
4. Contact the development team

---

**Last Updated**: 2024-01-XX  
**Version**: v1.0.0  
**Status**: ✅ COMPLETE
