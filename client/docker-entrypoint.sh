#!/bin/sh
set -e

# Create env-config.js with default values if it doesn't exist
if [ ! -f /usr/share/nginx/html/env-config.js ]; then
    cat > /usr/share/nginx/html/env-config.js << 'EOF'
window.env = {
  REACT_APP_API_BASE_URL: 'http://localhost:3001',
  REACT_APP_SHAREPOINT_CLIENT_ID: '',
  REACT_APP_SHAREPOINT_TENANT_ID: '',
  REACT_APP_AI_API_ENDPOINT: 'http://localhost:3001/api/ai',
  REACT_APP_ENVIRONMENT: 'production'
};
EOF
fi

# Start nginx
exec nginx -g "daemon off;"