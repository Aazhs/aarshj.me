#!/bin/bash

echo "🚀 Setting up Next.js Digital Mathscape..."
echo ""

# Navigate to new_website directory
cd "$(dirname "$0")"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate password hash
echo ""
echo "🔐 Generating admin password hash..."
HASH=$(node -e "console.log(require('bcryptjs').hashSync('admin123', 10))")

# Update .env.local
echo "ADMIN_PASSWORD_HASH=$HASH" > .env.local
echo "ENABLE_ANALYTICS=true" >> .env.local

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Default admin password: admin123"
echo "   ⚠️  CHANGE THIS IMMEDIATELY in production!"
echo ""
echo "To start development server:"
echo "  cd new_website"
echo "  npm run dev"
echo ""
echo "Then open http://localhost:3000"
echo "Admin dashboard: http://localhost:3000/admin"
echo ""
