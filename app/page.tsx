'use client'

import Link from 'next/link'
import { CentralIcon } from '@/components/CentralIcon'

export default function Home() {
  const cards = [
    {
      id: 'qr',
      title: 'QR Codes',
      description: 'Error correction through Reed-Solomon codes',
    },
    {
      id: 'taylor',
      title: 'Computers & Trigonometry',
      description: 'Taylor series approximations in CPUs',
    },
    {
      id: 'gps',
      title: 'GPS & Triangulation',
      description: 'Trilateration in 3D space',
    },
    {
      id: 'noise',
      title: 'Noise Cancellation',
      description: 'Destructive interference & DSP',
    },
  ]

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-radial from-purple-900/20 via-transparent to-cyan-900/20 pointer-events-none" />
      
      {/* Central icon */}
      <CentralIcon />
      
      {/* Grid container */}
      <div className="relative z-20 grid grid-cols-1 md:grid-cols-2 min-h-screen gap-0.5 p-0.5">
        {cards.map((card, index) => (
          <Link
            key={card.id}
            href={`/${card.id}`}
            className="group relative glass-morphism hover:bg-opacity-80 transition-all duration-300 hover:scale-[1.02] cursor-pointer overflow-hidden min-h-[250px] md:min-h-0"
            style={{
              animationDelay: `${1.3 + index * 0.2}s`,
              opacity: 0,
              animation: 'fadeInCard 0.6s ease-out forwards',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative h-full flex flex-col items-center justify-center p-6 md:p-8 text-center">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                {card.title}
              </h2>
              <p className="text-sm md:text-base lg:text-lg text-gray-300 max-w-md">
                {card.description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <style jsx>{`
        @keyframes fadeInCard {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  )
}
