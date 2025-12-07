'use client'

import { useEffect } from 'react'

export function Analytics() {
  useEffect(() => {
    // Track page view - disabled for static GitHub Pages deployment
    // You can integrate with client-side analytics like Google Analytics,
    // Plausible, or other static-site compatible analytics solutions
    const trackPageView = () => {
      try {
        // Example: Log to console for development
        if (process.env.NODE_ENV === 'development') {
          console.log('Page view:', {
            path: window.location.pathname,
            referrer: document.referrer,
            timestamp: new Date().toISOString(),
          })
        }
        
        // TODO: Add your preferred static analytics solution here
        // Examples:
        // - Google Analytics: gtag('event', 'page_view', { page_path: window.location.pathname })
        // - Plausible: plausible('pageview')
        // - Simple Analytics: sa_event('pageview')
      } catch (error) {
        console.error('Analytics error:', error)
      }
    }

    trackPageView()
  }, [])

  return null
}
