# The Digital Mathscape

Exploring the mathematics behind everyday technology through interactive visualizations.

🌐 **Live Site**: [aarshj.me](https://aarshj.me)

## Features

- 🎯 **Interactive Visualizations**: Hands-on demos of QR codes, GPS, noise cancellation, and more
- 📱 **Mobile-First Design**: Fully responsive with touch-optimized interactions
- 🌍 **Cross-Browser Compatible**: Works seamlessly across all modern browsers
- ⚡ **Static & Fast**: Built with Next.js static export for blazing-fast performance
- 🎨 **Modern Stack**: Next.js 14, TypeScript, Tailwind CSS
- 🔧 **GitHub Pages Ready**: Automated deployment with GitHub Actions

## Interactive Demos

### QR Codes & Error Correction
- Generate QR codes with customizable error correction levels
- Interactive damage simulator showing Reed-Solomon error correction in action
- Click to damage individual cells and watch recovery magic happen

### GPS & Trilateration
- Visual demonstration of how GPS determines your location
- Drag satellites and receiver to see distance calculations in real-time
- Interactive 3D trilateration visualization

### Noise Cancellation
- Watch destructive interference cancel sound waves
- Adjust phase shift to see perfect cancellation at 180°
- Real-time wave superposition visualization

### Computers & Trigonometry
- See how CPUs calculate sin(x) using Taylor series
- Adjust the number of terms to see approximation improve
- Real-time error analysis and visualization

## Getting Started

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
```

The static site will be generated in the `out/` directory.

## Deployment

This site is configured for automatic deployment to GitHub Pages.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Quick Deploy

1. Enable GitHub Pages in repository settings (Source: GitHub Actions)
2. Push to main branch
3. Site deploys automatically to aarshj.me

## Project Structure

```
├── app/
│   ├── qr/             # QR Code error correction demo
│   ├── taylor/         # Taylor series visualization
│   ├── gps/            # GPS trilateration simulator
│   ├── noise/          # Noise cancellation demo
│   ├── admin/          # Admin page (static for GitHub Pages)
│   ├── layout.tsx      # Root layout with analytics
│   └── page.tsx        # Homepage with card grid
├── components/
│   ├── Analytics.tsx   # Client-side analytics component
│   └── CentralIcon.tsx # Animated central icon
├── public/
│   ├── CNAME           # Custom domain configuration
│   └── .nojekyll       # GitHub Pages optimization
├── .github/
│   └── workflows/
│       └── deploy.yml  # Automated deployment workflow
└── old_site_backup/    # Previous version backup
```

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: GitHub Pages (Static Export)
- **Canvas**: HTML5 Canvas for interactive visualizations
- **QR Generation**: qrcode library

## Analytics

For static GitHub Pages deployment, consider integrating:
- Google Analytics
- Plausible Analytics  
- Simple Analytics

See `components/Analytics.tsx` for integration points.

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## License

MIT License - See LICENSE file for details

## Contributing

Contributions welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ for math and technology enthusiasts

```bash
npm run build
```

## Environment Variables

Create `.env.local`:

```env
ADMIN_PASSWORD_HASH=your-hash-here
ENABLE_ANALYTICS=true
```

## Migration from Old Site

The old static site is preserved in the parent directory. This Next.js version provides:

- Better performance through code splitting
- Mobile optimization
- Built-in analytics
- Easier maintenance and updates
- TypeScript for type safety

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: bcryptjs
- **Analytics**: Custom (file-based storage)

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
