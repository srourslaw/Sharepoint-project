#!/bin/sh
set -e

# Generate env-config.js with runtime environment variables
cat > /usr/share/nginx/html/env-config.js << EOF
window.__RUNTIME_CONFIG__ = {
  REACT_APP_API_BASE_URL: '${REACT_APP_API_BASE_URL:-http://127.0.0.1:3001}',
  REACT_APP_SHAREPOINT_CLIENT_ID: '${REACT_APP_SHAREPOINT_CLIENT_ID:-}',
  REACT_APP_SHAREPOINT_TENANT_ID: '${REACT_APP_SHAREPOINT_TENANT_ID:-}',
  REACT_APP_AI_API_ENDPOINT: '${REACT_APP_AI_API_ENDPOINT:-http://127.0.0.1:3001/api/ai}',
  REACT_APP_ENVIRONMENT: '${REACT_APP_ENVIRONMENT:-production}'
};
EOF

# Start nginx
exec nginx -g "daemon off;"