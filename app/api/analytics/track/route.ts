import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'analytics-data.json')

interface AnalyticsEvent {
  event: string
  path: string
  referrer?: string
  userAgent?: string
  timestamp: string
}

function getAnalyticsData(): AnalyticsEvent[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error reading analytics data:', error)
  }
  return []
}

function saveAnalyticsData(data: AnalyticsEvent[]) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error saving analytics data:', error)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as AnalyticsEvent
    
    const data = getAnalyticsData()
    data.push(body)
    
    // Keep only last 10,000 events
    if (data.length > 10000) {
      data.splice(0, data.length - 10000)
    }
    
    saveAnalyticsData(data)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 })
  }
}
