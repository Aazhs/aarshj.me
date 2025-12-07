'use client'

export function CentralIcon() {
  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 md:w-32 md:h-32 z-10 opacity-0 animate-fade-in">
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#00ffff', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#9d00ff', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="20" fill="none" stroke="url(#gradient)" strokeWidth="2" />
        <circle cx="50" cy="50" r="15" fill="url(#gradient)" opacity="0.3" />
        <line x1="30" y1="50" x2="10" y2="50" stroke="url(#gradient)" strokeWidth="1.5" />
        <line x1="70" y1="50" x2="90" y2="50" stroke="url(#gradient)" strokeWidth="1.5" />
        <line x1="50" y1="30" x2="50" y2="10" stroke="url(#gradient)" strokeWidth="1.5" />
        <line x1="50" y1="70" x2="50" y2="90" stroke="url(#gradient)" strokeWidth="1.5" />
        <circle cx="10" cy="50" r="3" fill="#00ffff" />
        <circle cx="90" cy="50" r="3" fill="#00ffff" />
        <circle cx="50" cy="10" r="3" fill="#00ffff" />
        <circle cx="50" cy="90" r="3" fill="#00ffff" />
      </svg>
    </div>
  )
}
