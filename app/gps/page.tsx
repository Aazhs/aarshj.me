'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'

interface Satellite {
  x: number
  y: number
  color: string
  dragging?: boolean
  clickStartTime?: number
  startX?: number
  startY?: number
  clickStartX?: number
  clickStartY?: number
}

interface Receiver {
  x: number
  y: number
  dragging?: boolean
}

export default function GPSPage() {
  const [showSpheres, setShowSpheres] = useState(false)
  const [sphereStates, setSphereStates] = useState([false, false, false, false])
  const [satellites, setSatellites] = useState<Satellite[]>([])
  const [receiver, setReceiver] = useState<Receiver>({ x: 0, y: 0 })
  const [earthCenter, setEarthCenter] = useState({ x: 0, y: 0 })
  const [earthRadius, setEarthRadius] = useState(0)
  const [distances, setDistances] = useState(['--', '--', '--', '--'])
  const [positionStatus, setPositionStatus] = useState('Drag receiver to see distances')
  const [draggingObject, setDraggingObject] = useState<any>(null)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    initializeObjects()
    const handleResize = () => initializeObjects()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    drawScene()
    updateDistances()
  }, [satellites, receiver, showSpheres, sphereStates])

  const initializeObjects = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const isMobile = window.innerWidth <= 768
    const width = Math.min(900, window.innerWidth - 40)
    const height = width * 0.72

    // Set display size
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'

    // Set actual size in memory (scaled for retina)
    const scale = window.devicePixelRatio || 1
    canvas.width = width * scale
    canvas.height = height * scale

    const centerX = (width * scale) / 2
    const centerY = (height * scale) / 2
    const radius = Math.min(width * scale, height * scale) * 0.22

    setEarthCenter({ x: centerX, y: centerY })
    setEarthRadius(radius)

    setSatellites([
      { x: centerX + radius * 2.2, y: centerY - radius * 1.3, color: '#ff0080' },
      { x: centerX - radius * 1.8, y: centerY - radius * 1.6, color: '#00ff80' },
      { x: centerX + radius * 0.8, y: centerY + radius * 2.3, color: '#ffaa00' },
      { x: centerX - radius * 2.1, y: centerY + radius * 1.1, color: '#00ffff' }
    ])

    setReceiver({
      x: centerX + radius * 0.4,
      y: centerY - radius * 0.6
    })
  }

  const updateDistances = () => {
    const newDistances = satellites.map(sat => {
      const dist = Math.sqrt(
        Math.pow(receiver.x - sat.x, 2) + 
        Math.pow(receiver.y - sat.y, 2)
      )
      return `${(dist * 20).toFixed(0)} km`
    })
    setDistances(newDistances)

    // Update position status
    const avgDist = satellites.reduce((sum, sat) => {
      const dist = Math.sqrt(Math.pow(receiver.x - sat.x, 2) + Math.pow(receiver.y - sat.y, 2))
      return sum + dist
    }, 0) / satellites.length
    
    if (avgDist < earthRadius * 2) {
      setPositionStatus('Good satellite coverage')
    } else {
      setPositionStatus('Satellites too far - poor accuracy')
    }
  }

  const drawScene = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')!
    const width = canvas.width
    const height = canvas.height

    // Clear
    ctx.fillStyle = 'rgba(10, 10, 31, 0.95)'
    ctx.fillRect(0, 0, width, height)

    // Draw distance spheres
    satellites.forEach((sat, idx) => {
      if (!sphereStates[idx] && !showSpheres) return

      const dist = Math.sqrt(
        Math.pow(receiver.x - sat.x, 2) + 
        Math.pow(receiver.y - sat.y, 2)
      )

      ctx.strokeStyle = sat.color
      ctx.lineWidth = 2
      ctx.globalAlpha = 0.4
      ctx.setLineDash([5, 5])
      
      ctx.beginPath()
      ctx.arc(sat.x, sat.y, dist, 0, Math.PI * 2)
      ctx.stroke()

      ctx.globalAlpha = 0.08
      ctx.fillStyle = sat.color
      ctx.fill()

      ctx.globalAlpha = 1
      ctx.setLineDash([])
    })

    // Draw Earth
    ctx.strokeStyle = '#00ffff'
    ctx.lineWidth = 3
    ctx.shadowBlur = 15
    ctx.shadowColor = '#00ffff'
    
    ctx.beginPath()
    ctx.arc(earthCenter.x, earthCenter.y, earthRadius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.shadowBlur = 0

    ctx.fillStyle = 'rgba(0, 100, 150, 0.15)'
    ctx.fill()

    // Latitude lines
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)'
    ctx.lineWidth = 1
    for (let i = 1; i < 5; i++) {
      const r = earthRadius * Math.sin((i / 5) * Math.PI)
      const y = earthRadius * Math.cos((i / 5) * Math.PI)
      
      ctx.beginPath()
      ctx.ellipse(earthCenter.x, earthCenter.y - y, r, r * 0.3, 0, 0, Math.PI * 2)
      ctx.stroke()
      
      ctx.beginPath()
      ctx.ellipse(earthCenter.x, earthCenter.y + y, r, r * 0.3, 0, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Longitude lines
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI
      const rx = Math.abs(Math.cos(angle)) * earthRadius
      
      ctx.beginPath()
      ctx.ellipse(earthCenter.x, earthCenter.y, rx, earthRadius, angle, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Draw signal lines
    satellites.forEach((sat, idx) => {
      if (!sphereStates[idx] && !showSpheres) return

      ctx.strokeStyle = sat.color
      ctx.lineWidth = 1
      ctx.globalAlpha = 0.3
      ctx.setLineDash([3, 3])
      
      ctx.beginPath()
      ctx.moveTo(sat.x, sat.y)
      ctx.lineTo(receiver.x, receiver.y)
      ctx.stroke()
      
      ctx.setLineDash([])
      ctx.globalAlpha = 1
    })

    // Draw satellites
    satellites.forEach((sat, idx) => {
      ctx.fillStyle = sat.color
      ctx.shadowBlur = 15
      ctx.shadowColor = sat.color
      
      ctx.beginPath()
      ctx.arc(sat.x, sat.y, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      // Label
      ctx.fillStyle = '#fff'
      ctx.font = '12px sans-serif'
      ctx.fillText(`S${idx + 1}`, sat.x + 12, sat.y - 8)
    })

    // Draw receiver
    ctx.fillStyle = '#fff'
    ctx.shadowBlur = 20
    ctx.shadowColor = '#fff'
    
    ctx.beginPath()
    ctx.arc(receiver.x, receiver.y, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    ctx.strokeStyle = '#00ffff'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(receiver.x, receiver.y, 10, 0, Math.PI * 2)
    ctx.stroke()
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    checkDraggable(x, y)
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const touch = e.touches[0]
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (touch.clientX - rect.left) * scaleX
    const y = (touch.clientY - rect.top) * scaleY

    checkDraggable(x, y)
  }

  const checkDraggable = (x: number, y: number) => {
    const scale = window.devicePixelRatio || 1
    const hitRadius = 20 * scale
    
    // Check satellites
    for (let i = 0; i < satellites.length; i++) {
      const sat = satellites[i]
      const dist = Math.sqrt(Math.pow(x - sat.x, 2) + Math.pow(y - sat.y, 2))
      if (dist < hitRadius) {
        const newSats = [...satellites]
        newSats[i] = {
          ...sat,
          clickStartTime: Date.now(),
          startX: sat.x,
          startY: sat.y,
        }
        setSatellites(newSats)
        setDraggingObject({ type: 'satellite', index: i })
        return
      }
    }

    // Check receiver
    const distReceiver = Math.sqrt(Math.pow(x - receiver.x, 2) + Math.pow(y - receiver.y, 2))
    if (distReceiver < 15 * scale) {
      setDraggingObject({ type: 'receiver' })
      return
    }

    // Click on Earth to move receiver
    const distFromCenter = Math.sqrt(Math.pow(x - earthCenter.x, 2) + Math.pow(y - earthCenter.y, 2))
    if (distFromCenter <= earthRadius) {
      setReceiver({ x, y })
      setDraggingObject({ type: 'receiver' })
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingObject) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    if (draggingObject.type === 'receiver') {
      const dx = x - earthCenter.x
      const dy = y - earthCenter.y
      const distFromCenter = Math.sqrt(dx * dx + dy * dy)

      if (distFromCenter <= earthRadius) {
        setReceiver({ x, y })
      } else {
        const angle = Math.atan2(dy, dx)
        setReceiver({
          x: earthCenter.x + Math.cos(angle) * earthRadius,
          y: earthCenter.y + Math.sin(angle) * earthRadius
        })
      }
    } else if (draggingObject.type === 'satellite') {
      const newSats = [...satellites]
      newSats[draggingObject.index] = { ...newSats[draggingObject.index], x, y }
      setSatellites(newSats)
    }
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!draggingObject) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const touch = e.touches[0]
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (touch.clientX - rect.left) * scaleX
    const y = (touch.clientY - rect.top) * scaleY

    if (draggingObject.type === 'receiver') {
      const dx = x - earthCenter.x
      const dy = y - earthCenter.y
      const distFromCenter = Math.sqrt(dx * dx + dy * dy)

      if (distFromCenter <= earthRadius) {
        setReceiver({ x, y })
      } else {
        const angle = Math.atan2(dy, dx)
        setReceiver({
          x: earthCenter.x + Math.cos(angle) * earthRadius,
          y: earthCenter.y + Math.sin(angle) * earthRadius
        })
      }
    } else if (draggingObject.type === 'satellite') {
      const newSats = [...satellites]
      newSats[draggingObject.index] = { ...newSats[draggingObject.index], x, y }
      setSatellites(newSats)
    }
  }

  const handleMouseUp = () => {
    if (draggingObject && draggingObject.type === 'satellite') {
      const sat = satellites[draggingObject.index]
      const timeDiff = Date.now() - (sat.clickStartTime || 0)
      const moveDist = Math.sqrt(
        Math.pow(sat.x - (sat.startX || sat.x), 2) + 
        Math.pow(sat.y - (sat.startY || sat.y), 2)
      )

      // Click to toggle sphere (only if minimal movement)
      if (moveDist < 10 && timeDiff < 400) {
        const newStates = [...sphereStates]
        newStates[draggingObject.index] = !newStates[draggingObject.index]
        setSphereStates(newStates)
        
        // Update show all button state
        const allOn = newStates.every(state => state)
        setShowSpheres(allOn)
      }
      
      // Clean up temporary properties
      const newSats = [...satellites]
      const { clickStartTime, startX, startY, ...cleanSat } = newSats[draggingObject.index]
      newSats[draggingObject.index] = cleanSat
      setSatellites(newSats)
    }

    setDraggingObject(null)
  }

  const toggleAllSpheres = () => {
    const newShow = !showSpheres
    setShowSpheres(newShow)
    setSphereStates([newShow, newShow, newShow, newShow])
  }

  const randomizeSatellites = () => {
    const minDist = earthRadius * 1.5
    const maxDist = earthRadius * 2.5

    const newSats = satellites.map(sat => {
      const angle = Math.random() * Math.PI * 2
      const dist = minDist + Math.random() * (maxDist - minDist)
      return {
        ...sat,
        x: earthCenter.x + Math.cos(angle) * dist,
        y: earthCenter.y + Math.sin(angle) * dist
      }
    })
    setSatellites(newSats)
  }

  const reset = () => {
    setShowSpheres(false)
    setSphereStates([false, false, false, false])
    initializeObjects()
    setPositionStatus('Drag receiver to see distances')
  }

  return (
    <div className="min-h-screen bg-dark-bg p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="inline-block mb-8 text-cyan-400 hover:text-cyan-300 transition-colors">
          ← Back to Home
        </Link>

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          GPS & Trilateration
        </h1>
        <p className="text-sm md:text-base text-gray-300 mb-6 md:mb-8">
          GPS uses trilateration with at least 4 satellites to pinpoint your exact position
        </p>

        {/* Interactive Simulator */}
        <div className="glass-morphism p-6 md:p-8 rounded-2xl mb-8">
          <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Interactive Trilateration Simulator</h2>
          
          {/* Info Panels */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-black/30 p-4 rounded-lg border border-white/10">
              <h3 className="font-bold mb-3">Satellites</h3>
              <div className="space-y-2">
                {satellites.map((sat, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ background: sat.color }}
                      />
                      <span className="text-sm">SAT-{idx + 1}:</span>
                    </div>
                    <span className="text-cyan-400 font-mono text-sm">{distances[idx]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-black/30 p-4 rounded-lg border border-white/10">
              <h3 className="font-bold mb-3">Your Position</h3>
              <div className="text-gray-300 text-sm">{positionStatus}</div>
            </div>
          </div>

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            className="w-full border-2 border-cyan-400/20 rounded-lg mb-6 cursor-grab active:cursor-grabbing"
            style={{ touchAction: 'none' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
            onTouchCancel={handleMouseUp}
          />

          {/* Controls */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={toggleAllSpheres}
              className="px-4 py-2 bg-cyan-400/20 hover:bg-cyan-400/30 border border-cyan-400 rounded-lg transition-colors text-sm md:text-base"
            >
              {showSpheres ? 'Hide' : 'Show'} Distance Spheres
            </button>
            <button
              onClick={randomizeSatellites}
              className="px-4 py-2 bg-purple-400/20 hover:bg-purple-400/30 border border-purple-400 rounded-lg transition-colors text-sm md:text-base"
            >
              Randomize Satellites
            </button>
            <button
              onClick={reset}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors text-sm md:text-base"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Info Section */}
        <div className="glass-morphism p-6 md:p-8 rounded-2xl">
          <h3 className="text-xl font-bold mb-4">How to Use</h3>
          <ul className="space-y-3 text-gray-300 mb-6">
            <li className="flex items-start">
              <span className="text-cyan-400 mr-2">•</span>
              <span><strong>Drag the white receiver</strong> (on Earth) to change your position</span>
            </li>
            <li className="flex items-start">
              <span className="text-cyan-400 mr-2">•</span>
              <span><strong>Drag satellites</strong> to see how their positions affect signal coverage</span>
            </li>
            <li className="flex items-start">
              <span className="text-cyan-400 mr-2">•</span>
              <span><strong>Click satellites</strong> to toggle individual distance spheres</span>
            </li>
            <li className="flex items-start">
              <span className="text-cyan-400 mr-2">•</span>
              <span><strong>Show Spheres</strong> to visualize the distance to each satellite</span>
            </li>
            <li className="flex items-start">
              <span className="text-cyan-400 mr-2">•</span>
              <span><strong>Need 4 satellites:</strong> 3 for position (x,y,z) + 1 for clock synchronization</span>
            </li>
          </ul>

          <h3 className="text-xl font-bold mb-4">How GPS Works</h3>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start">
              <span className="text-cyan-400 mr-2">•</span>
              <span><strong>Trilateration vs Triangulation:</strong> GPS uses trilateration (distance-based) not triangulation (angle-based)</span>
            </li>
            <li className="flex items-start">
              <span className="text-cyan-400 mr-2">•</span>
              <span><strong>Distance Spheres:</strong> Each satellite creates a sphere of possible locations based on signal travel time</span>
            </li>
            <li className="flex items-start">
              <span className="text-cyan-400 mr-2">•</span>
              <span><strong>Intersection Point:</strong> Your position is where all spheres intersect</span>
            </li>
            <li className="flex items-start">
              <span className="text-cyan-400 mr-2">•</span>
              <span><strong>4th Satellite:</strong> Needed to correct for clock errors in your device</span>
            </li>
            <li className="flex items-start">
              <span className="text-cyan-400 mr-2">•</span>
              <span><strong>Real GPS:</strong> Uses 24-32 satellites orbiting Earth at ~20,000 km altitude</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
