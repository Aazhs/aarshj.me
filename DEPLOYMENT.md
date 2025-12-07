# Deploy to GitHub Pages

This guide explains how to deploy the new_website to GitHub Pages.

## Automatic Deployment (Recommended)

The repository includes a GitHub Actions workflow that automatically builds and deploys the site when you push to the main branch.

### Setup Steps:

1. **Enable GitHub Pages:**
   - Go to your repository settings
   - Navigate to "Pages" section
   - Under "Source", select "GitHub Actions"

2. **Push your code:**
   ```bash
   git add .
   git commit -m "Configure for GitHub Pages deployment"
   git push origin main
   ```

3. **Wait for deployment:**
   - Go to the "Actions" tab in your repository
   - Watch the deployment workflow run
   - Once complete, your site will be live at `https://yourusername.github.io/repository-name/`

### Custom Domain (aarshj.me)

If using a custom domain:

1. **Update next.config.js:**
   - The `basePath` is already commented out (correct for custom domains)
   - Keep it as is

2. **Add CNAME file:**
   ```bash
   echo "aarshj.me" > new_website/public/CNAME
   ```

3. **Configure DNS:**
   - Add these DNS records for your domain:
     - Type: A, Host: @, Value: 185.199.108.153
     - Type: A, Host: @, Value: 185.199.109.153
     - Type: A, Host: @, Value: 185.199.110.153
     - Type: A, Host: @, Value: 185.199.111.153
     - Type: CNAME, Host: www, Value: yourusername.github.io

4. **Enable HTTPS:**
   - In repository settings > Pages
   - Check "Enforce HTTPS" (after DNS propagation)

## Manual Deployment

If you prefer to deploy manually:

```bash
cd new_website

# Install dependencies
npm install

# Build the site
npm run build

# The static files will be in the 'out' directory
# You can upload these to any static hosting service
```

## Important Notes

### API Routes Disabled
Since GitHub Pages only supports static sites, the following features are disabled:
- Analytics tracking API (`/api/analytics/track`)
- Admin dashboard API (`/api/admin/stats`)

To add analytics, integrate client-side solutions like:
- Google Analytics
- Plausible Analytics
- Simple Analytics
- Vercel Analytics (if hosting on Vercel instead)

### File Structure After Build
```
out/
├── index.html           # Homepage
├── qr/
│   └── index.html      # QR Codes page
├── taylor/
│   └── index.html      # Taylor Series page
├── gps/
│   └── index.html      # GPS page
├── noise/
│   └── index.html      # Noise Cancellation page
├── admin/
│   └── index.html      # Admin page (static message)
├── _next/              # Next.js static assets
└── .nojekyll           # Tells GitHub Pages not to process with Jekyll
```

### Troubleshooting

**Build fails:**
- Make sure all dependencies are installed: `npm install`
- Check Node.js version (requires Node 18+)
- Review build logs in GitHub Actions

**404 errors:**
- If using a subdirectory (not custom domain), uncomment and set `basePath` in `next.config.js`
- Ensure `trailingSlash: true` is set in `next.config.js`

**Styles not loading:**
- Check browser console for errors
- Verify `images: { unoptimized: true }` is in `next.config.js`
- Clear browser cache

**Deployment not updating:**
- Check if GitHub Actions workflow completed successfully
- May take a few minutes for changes to propagate
- Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

## Development

To run locally:

```bash
cd new_website
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build Configuration

The site is configured in `next.config.js`:
- `output: 'export'` - Enables static HTML export
- `images: { unoptimized: true }` - Disables Next.js image optimization (not supported in static export)
- `trailingSlash: true` - Adds trailing slashes to URLs for better compatibility

## License

See the main repository LICENSE file.
