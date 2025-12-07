import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'analytics-data.json')

export async function POST(request: Request) {
  try {
    const { password } = await request.json()
    
    // Simple direct password check - CHANGE THIS IN PRODUCTION
    if (password !== 'admin123') {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }
    
    // Read analytics data
    let data = []
    try {
      if (fs.existsSync(DATA_FILE)) {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8')
        data = JSON.parse(fileContent)
      }
    } catch (error) {
      console.error('Error reading analytics:', error)
    }
    
    // Calculate statistics
    const stats = {
      totalVisits: data.length,
      uniqueVisitors: new Set(data.map((d: any) => d.userAgent)).size,
      pageViews: data.filter((d: any) => d.event === 'page_view').length,
      recentVisits: data.slice(-100).reverse(),
      topPages: getTopPages(data),
      visitsByHour: getVisitsByHour(data),
      referrers: getTopReferrers(data),
    }
    
    return NextResponse.json(stats)
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

function getTopPages(data: any[]) {
  const counts: Record<string, number> = {}
  data.forEach(d => {
    if (d.path) {
      counts[d.path] = (counts[d.path] || 0) + 1
    }
  })
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([path, count]) => ({ path, count }))
}

function getVisitsByHour(data: any[]) {
  const hours = Array(24).fill(0)
  data.forEach(d => {
    const hour = new Date(d.timestamp).getHours()
    hours[hour]++
  })
  return hours
}

function getTopReferrers(data: any[]) {
  const counts: Record<string, number> = {}
  data.forEach(d => {
    if (d.referrer && d.referrer !== '') {
      counts[d.referrer] = (counts[d.referrer] || 0) + 1
    }
  })
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([referrer, count]) => ({ referrer, count }))
}
