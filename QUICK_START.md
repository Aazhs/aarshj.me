# GitHub Pages Setup - Quick Start

## 🚀 Quick Deploy (Using your existing repository)

Since you already have the `aarshj.me` repository, here's how to deploy the new_website:

### Option 1: Deploy from new_website subdirectory (Recommended)

1. **Update GitHub Actions workflow path** (already done in `.github/workflows/deploy.yml`)

2. **Enable GitHub Pages in repository settings:**
   - Go to: https://github.com/Aazhs/aarshj.me/settings/pages
   - Under "Source": Select "GitHub Actions"

3. **Push the changes:**
   ```bash
   cd /Users/aarsh/Codes/aarshj_website/aarshj.me
   git add new_website/
   git commit -m "Add GitHub Pages deployment for new_website"
   git push origin main
   ```

4. **Monitor deployment:**
   - Go to: https://github.com/Aazhs/aarshj.me/actions
   - Watch the workflow run
   - Site will be live at https://aarshj.me (with your custom domain)

### Option 2: Move to root (if you want new_website as main site)

```bash
cd /Users/aarsh/Codes/aarshj_website/aarshj.me

# Backup old files
mkdir old_site_backup
mv index.html styles.css script.js CNAME old_site_backup/

# Move new_website to root
cp -r new_website/* .
cp -r new_website/.github .

# Update workflow to build from root
# Edit .github/workflows/deploy.yml and remove "working-directory: ./new_website"
```

## ✅ What's Already Configured

- ✓ Static export enabled (`output: 'export'` in next.config.js)
- ✓ Images unoptimized for static hosting
- ✓ CNAME file for custom domain (aarshj.me)
- ✓ .nojekyll file to bypass Jekyll processing
- ✓ GitHub Actions workflow ready
- ✓ API routes disabled (not compatible with static hosting)
- ✓ Mobile-responsive and cross-browser compatible

## 🌐 DNS Configuration

Your domain `aarshj.me` should have these DNS records:

**For apex domain (aarshj.me):**
```
Type: A,     Host: @,   Value: 185.199.108.153
Type: A,     Host: @,   Value: 185.199.109.153
Type: A,     Host: @,   Value: 185.199.110.153
Type: A,     Host: @,   Value: 185.199.111.153
```

**For www subdomain:**
```
Type: CNAME, Host: www, Value: aazhs.github.io
```

## 🔧 Local Testing

Test the production build locally:

```bash
cd new_website

# Install dependencies
npm install

# Build and test
npm run build

# Serve the static files (optional - requires http-server)
npx http-server out -p 8080
```

Then visit: http://localhost:8080

## 📱 Features Working on GitHub Pages

✅ All interactive visualizations
✅ QR Code generator
✅ GPS trilateration simulator  
✅ Noise cancellation demo
✅ Taylor series visualization
✅ Mobile touch interactions
✅ Cross-browser compatibility

## ❌ Features Disabled for Static Hosting

- Server-side analytics API (use Google Analytics or Plausible instead)
- Admin dashboard (server-side authentication not possible)

## 🐛 Troubleshooting

**Site not updating?**
- Check GitHub Actions status
- Clear browser cache (Cmd+Shift+R)
- Wait 2-3 minutes for CDN propagation

**404 errors?**
- Verify CNAME file exists in out/ directory
- Check DNS settings are correct
- Ensure GitHub Pages is enabled

**CSS/JS not loading?**
- Verify `basePath` is NOT set in next.config.js (for custom domains)
- Check browser console for errors
- Ensure `trailingSlash: true` in config

## 📞 Need Help?

Check the detailed guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
