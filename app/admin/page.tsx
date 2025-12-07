'use client'

import Link from 'next/link'

export default function AdminPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg px-4">
      <div className="max-w-md w-full glass-morphism p-8 rounded-2xl text-center">
        <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
        <p className="text-gray-300 mb-6">
          The admin dashboard is not available in the static GitHub Pages deployment.
        </p>
        <p className="text-sm text-gray-400 mb-8">
          For analytics, consider integrating client-side solutions like Google Analytics, Plausible, or Simple Analytics.
        </p>
        <Link 
          href="/" 
          className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  )
}
