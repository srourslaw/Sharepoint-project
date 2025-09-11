# Frontend Dockerfile
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build arguments for environment
ARG REACT_APP_API_BASE_URL
ARG REACT_APP_SHAREPOINT_CLIENT_ID
ARG REACT_APP_SHAREPOINT_TENANT_ID
ARG REACT_APP_AI_API_ENDPOINT
ARG REACT_APP_ENVIRONMENT

# Set environment variables
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
ENV REACT_APP_SHAREPOINT_CLIENT_ID=$REACT_APP_SHAREPOINT_CLIENT_ID
ENV REACT_APP_SHAREPOINT_TENANT_ID=$REACT_APP_SHAREPOINT_TENANT_ID
ENV REACT_APP_AI_API_ENDPOINT=$REACT_APP_AI_API_ENDPOINT
ENV REACT_APP_ENVIRONMENT=$REACT_APP_ENVIRONMENT

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache curl

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx-security.conf /etc/nginx/conf.d/security.conf

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy environment template and startup script
COPY env-template.js /usr/share/nginx/html/env-template.js
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create env-config.js with default values
RUN cat > /usr/share/nginx/html/env-config.js << 'EOF'
window.env = {
  REACT_APP_API_BASE_URL: 'http://localhost:3001',
  REACT_APP_SHAREPOINT_CLIENT_ID: '',
  REACT_APP_SHAREPOINT_TENANT_ID: '',
  REACT_APP_AI_API_ENDPOINT: 'http://localhost:3001/api/ai',
  REACT_APP_ENVIRONMENT: 'production'
};
EOF

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set ownership and permissions
RUN chown -R nextjs:nodejs /usr/share/nginx/html
RUN chmod -R 755 /usr/share/nginx/html
RUN chown -R nextjs:nodejs /var/cache/nginx
RUN chown -R nextjs:nodejs /var/log/nginx
RUN chown -R nextjs:nodejs /etc/nginx/conf.d
RUN touch /var/run/nginx.pid
RUN chown -R nextjs:nodejs /var/run/nginx.pid

# Run as root for nginx to work properly
# USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Expose port
EXPOSE 80

# Start nginx with custom entrypoint for environment variable injection
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]