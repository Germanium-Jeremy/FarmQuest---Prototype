#!/bin/bash

# FarmQuest Server Setup Script
# For restricted servers without Docker

set -e

echo "🌾 FarmQuest Server Setup"
echo "========================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Configuration
APP_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_PORT=3001
NODE_VERSION=20

echo ""
echo "Application directory: $APP_DIR"
echo ""

# Step 1: Check/Install Node.js
echo "Step 1: Checking Node.js..."
echo "---------------------------"

if ! command -v node &> /dev/null; then
    print_warning "Node.js not found. Installing via nvm..."
    
    # Check if nvm is installed
    if [ -f "$HOME/.nvm/nvm.sh" ]; then
        source "$HOME/.nvm/nvm.sh"
    else
        # Install nvm
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
        source "$HOME/.nvm/nvm.sh"
    fi
    
    nvm install $NODE_VERSION
    nvm use $NODE_VERSION
    print_status "Node.js $(node -v) installed"
else
    NODE_CURRENT=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_CURRENT" -lt "$NODE_VERSION" ]; then
        print_warning "Node.js version $NODE_VERSION+ required. Current: $(node -v)"
        echo "Attempting to use nvm..."
        source "$HOME/.nvm/nvm.sh" 2>/dev/null || true
        nvm install $NODE_VERSION 2>/dev/null || true
        nvm use $NODE_VERSION 2>/dev/null || true
    fi
    print_status "Node.js $(node -v) detected"
fi

# Step 2: Install pm2 globally
echo ""
echo "Step 2: Installing pm2..."
echo "------------------------"

if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    print_status "pm2 installed"
else
    print_status "pm2 already installed"
fi

# Step 3: Setup server
echo ""
echo "Step 3: Setting up server..."
echo "---------------------------"

cd "$APP_DIR"

# Install production dependencies
if [ -f "package.json" ]; then
    echo "Installing dependencies..."
    npm ci --production
    print_status "Dependencies installed"
else
    print_error "package.json not found in $APP_DIR"
    exit 1
fi

# Create data directory
mkdir -p data
print_status "Data directory created"

# Create logs directory
mkdir -p logs
print_status "Logs directory created"

# Step 4: Create environment file
echo ""
echo "Step 4: Creating environment file..."
echo "-----------------------------------"

if [ ! -f .env ]; then
    # Generate admin token
    ADMIN_TOKEN=$(openssl rand -hex 16 2>/dev/null || echo "dev-token-$(date +%s)")
    
    cat > .env << EOF
# FarmQuest Server Configuration
PORT=$APP_PORT
DATABASE_URL=$APP_DIR/data/farmquest.db
EMAIL_PROVIDER=smtp
EMAIL_FROM=FarmQuest <rewards@example.com>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=
SMTP_PASS=
ALLOWED_ORIGINS=http://localhost,http://localhost:80,http://localhost:3000,http://127.0.0.1:3000,http://168.231.85.220
ADMIN_TOKEN=$ADMIN_TOKEN
EOF
    print_warning "Created .env file with generated ADMIN_TOKEN"
    echo "Admin token: $ADMIN_TOKEN"
else
    print_status "Environment file exists"
fi

# Step 5: Create PM2 ecosystem file
echo ""
echo "Step 5: Creating PM2 ecosystem file..."
echo "-------------------------------------"

cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'farmquest-server',
      script: './server/dist/server.js',
      cwd: '$APP_DIR',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: $APP_PORT
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '$APP_DIR/logs/error.log',
      out_file: '$APP_DIR/logs/out.log',
      merge_logs: true
    }
  ]
};
EOF
print_status "PM2 ecosystem file created"

# Step 6: Copy admin HTML to public directory
echo ""
echo "Step 6: Setting up admin pages..."
echo "--------------------------------"

mkdir -p public/admin
if [ -f "server-admin/admin.html" ]; then
    cp server-admin/admin.html public/admin/
    print_status "Admin page copied"
elif [ -f "src/admin/admin.html" ]; then
    cp src/admin/admin.html public/admin/
    print_status "Admin page copied"
else
    print_warning "Admin page not found. Dashboard may not work."
fi

# Step 7: Create startup scripts
echo ""
echo "Step 7: Creating startup scripts..."
echo "----------------------------------"

cat > start.sh << 'STARTEOF'
#!/bin/bash
cd "$(dirname "$0")"

# Load nvm if available
if [ -f "$HOME/.nvm/nvm.sh" ]; then
    source "$HOME/.nvm/nvm.sh"
    nvm use 20
fi

# Start with pm2
pm2 start ecosystem.config.js

echo ""
echo "FarmQuest started!"
echo "Server: http://localhost:3001"
echo ""
echo "Check status: pm2 status"
echo "View logs: pm2 logs farmquest-server"
STARTEOF
chmod +x start.sh

cat > stop.sh << 'STOPEOF'
#!/bin/bash
cd "$(dirname "$0")"
pm2 stop farmquest-server
pm2 delete farmquest-server
echo "FarmQuest stopped!"
STOPEOF
chmod +x stop.sh

cat > status.sh << 'STATUSEOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "=== FarmQuest Status ==="
echo ""
echo "PM2 Processes:"
pm2 status
echo ""
echo "Health Check:"
if curl -s http://localhost:3001/api/health | grep -q '"ok":true'; then
    echo "✓ Server is healthy"
else
    echo "✗ Server is not responding"
fi
STATUSEOF
chmod +x status.sh

print_status "Startup scripts created"

echo ""
echo "🎉 Setup completed!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your SMTP settings (for email)"
echo "2. Run: ./start.sh"
echo "3. Access: http://$(hostname -I | awk '{print $1}'):3001"
echo ""
echo "Admin dashboard: http://$(hostname -I | awk '{print $1}'):3001/admin"
echo "Admin token is in .env file"
echo ""
echo "Useful commands:"
echo "  pm2 status              - Check server status"
echo "  pm2 logs farmquest-server - View server logs"
echo "  pm2 restart farmquest-server - Restart server"
echo "  ./stop.sh               - Stop server"
echo "  ./status.sh             - Check status"
