'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'

export default function NoisePage() {
  const [phaseShiftDegrees, setPhaseShiftDegrees] = useState(180)
  const [isAnimating, setIsAnimating] = useState(false)
  const [cancellationLevel, setCancellationLevel] = useState('Perfect Cancellation: 100.0%')
  const [cancellationColor, setCancellationColor] = useState('#00ffff')
  
  const originalRef = useRef<HTMLCanvasElement>(null)
  const invertedRef = useRef<HTMLCanvasElement>(null)
  const resultRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()
  const noisePhaseRef = useRef(0)
  const phaseShiftRef = useRef(180)

  useEffect(() => {
    phaseShiftRef.current = phaseShiftDegrees
    resizeCanvases()
    drawAllWaves()
    
    const handleResize = () => {
      resizeCanvases()
      if (!isAnimating) drawAllWaves()
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  useEffect(() => {
    phaseShiftRef.current = phaseShiftDegrees
    updateCancellationLevel()
    if (!isAnimating) {
      drawAllWaves()
    }
  }, [phaseShiftDegrees])

  useEffect(() => {
    if (isAnimating) {
      animate()
    }
  }, [isAnimating])

  const resizeCanvases = () => {
    const canvases = [originalRef, invertedRef, resultRef]
    const width = Math.min(800, window.innerWidth - 40)
    
    canvases.forEach(ref => {
      if (ref.current) {
        ref.current.width = width
        ref.current.height = 180
      }
    })
    
    drawAllWaves()
  }

  const drawAllWaves = () => {
    const phaseShiftRadians = (phaseShiftRef.current * Math.PI) / 180
    drawNoiseWave(originalRef.current, false, 0)
    drawNoiseWave(invertedRef.current, true, phaseShiftRadians)
    drawResultWave(phaseShiftRadians)
  }

  const drawNoiseWave = (canvas: HTMLCanvasElement | null, inverted: boolean, shift: number) => {
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const width = canvas.width
    const height = canvas.height

    // Clear
    ctx.fillStyle = 'rgba(10, 10, 31, 0.95)'
    ctx.fillRect(0, 0, width, height)

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
    
    for (let i = 0; i <= 8; i++) {
      const x = (width / 8) * i
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    // Center line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, height / 2)
    ctx.lineTo(width, height / 2)
    ctx.stroke()

    // Draw wave
    ctx.strokeStyle = inverted ? '#9d00ff' : '#00b8ff'
    ctx.lineWidth = 3
    ctx.shadowBlur = 10
    ctx.shadowColor = inverted ? '#9d00ff' : '#00b8ff'
    ctx.beginPath()

    const amplitude = height * 0.35
    const frequency = 4
    const phase = noisePhaseRef.current

    for (let x = 0; x < width; x++) {
      const t = (x / width) * Math.PI * frequency + phase
      
      const effectivePhase = inverted ? shift : 0
      let y = Math.sin(t * 2 + effectivePhase) * 0.5
      y += Math.sin(t * 3.5 + effectivePhase) * 0.25
      y += Math.sin(t * 5 + effectivePhase) * 0.15
      y += Math.sin(t * 7.5 + effectivePhase) * 0.1

      const py = height / 2 - y * amplitude

      if (x === 0) ctx.moveTo(x, py)
      else ctx.lineTo(x, py)
    }
    ctx.stroke()
    ctx.shadowBlur = 0

    // Label
    ctx.fillStyle = inverted ? '#9d00ff' : '#00b8ff'
    ctx.font = 'bold 12px sans-serif'
    ctx.fillText(inverted ? 'Anti-Noise' : 'Original', 10, 20)
  }

  const drawResultWave = (currentPhaseShift: number) => {
    const canvas = resultRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const width = canvas.width
    const height = canvas.height

    // Clear
    ctx.fillStyle = 'rgba(10, 10, 31, 0.95)'
    ctx.fillRect(0, 0, width, height)

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
    
    for (let i = 0; i <= 8; i++) {
      const x = (width / 8) * i
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    // Center line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, height / 2)
    ctx.lineTo(width, height / 2)
    ctx.stroke()

    // Draw result wave (superposition)

    const amplitude = height * 0.35
    const frequency = 4
    const phase = noisePhaseRef.current

    // Draw original and anti-noise waves faintly
    ctx.strokeStyle = 'rgba(0, 184, 255, 0.2)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let x = 0; x < width; x++) {
      const t = (x / width) * Math.PI * frequency + phase
      let y = Math.sin(t * 2) * 0.5 + Math.sin(t * 3.5) * 0.25 + Math.sin(t * 5) * 0.15 + Math.sin(t * 7.5) * 0.1
      const py = height / 2 - y * amplitude
      if (x === 0) ctx.moveTo(x, py)
      else ctx.lineTo(x, py)
    }
    ctx.stroke()

    ctx.strokeStyle = 'rgba(157, 0, 255, 0.2)'
    ctx.beginPath()
    for (let x = 0; x < width; x++) {
      const t = (x / width) * Math.PI * frequency + phase
      let y = Math.sin(t * 2 + currentPhaseShift) * 0.5 + Math.sin(t * 3.5 + currentPhaseShift) * 0.25 + Math.sin(t * 5 + currentPhaseShift) * 0.15 + Math.sin(t * 7.5 + currentPhaseShift) * 0.1
      const py = height / 2 - y * amplitude
      if (x === 0) ctx.moveTo(x, py)
      else ctx.lineTo(x, py)
    }
    ctx.stroke()
    
    // Draw resultant wave
    ctx.strokeStyle = '#00ffff'
    ctx.lineWidth = 3
    ctx.shadowBlur = 15
    ctx.shadowColor = '#00ffff'
    ctx.beginPath()

    for (let x = 0; x < width; x++) {
      const t = (x / width) * Math.PI * frequency + phase

      let y1 = Math.sin(t * 2) * 0.5 + Math.sin(t * 3.5) * 0.25 + Math.sin(t * 5) * 0.15 + Math.sin(t * 7.5) * 0.1
      let y2 = Math.sin(t * 2 + currentPhaseShift) * 0.5 + Math.sin(t * 3.5 + currentPhaseShift) * 0.25 + Math.sin(t * 5 + currentPhaseShift) * 0.15 + Math.sin(t * 7.5 + currentPhaseShift) * 0.1

      const ySum = y1 + y2
      const py = height / 2 - ySum * amplitude

      if (x === 0) ctx.moveTo(x, py)
      else ctx.lineTo(x, py)
    }
    ctx.stroke()
    ctx.shadowBlur = 0

    // Label
    ctx.fillStyle = '#00ffff'
    ctx.font = 'bold 12px sans-serif'
    ctx.fillText('Resultant', 10, 20)

    // Show SILENCE if near perfect cancellation
    const degrees = (currentPhaseShift * 180) / Math.PI
    const normalizedDegrees = degrees % 360
    const deviationFrom180 = Math.abs(normalizedDegrees - 180)
    const actualCancellation = 100 - (deviationFrom180 / 180) * 100

    if (actualCancellation > 95) {
      ctx.fillStyle = '#00ffff'
      ctx.font = 'bold 24px sans-serif'
      ctx.textAlign = 'center'
      ctx.shadowBlur = 20
      ctx.shadowColor = '#00ffff'
      ctx.fillText('SILENCE', width / 2, height / 2)
      ctx.shadowBlur = 0
      ctx.textAlign = 'left'
    }
  }

  const updateCancellationLevel = () => {
    const normalizedDegrees = phaseShiftDegrees % 360
    const deviationFrom180 = Math.abs(normalizedDegrees - 180)
    const cancellation = 100 - (deviationFrom180 / 180) * 100

    if (cancellation > 95) {
      setCancellationLevel(`Perfect Cancellation: ${cancellation.toFixed(1)}%`)
      setCancellationColor('#00ffff')
    } else if (cancellation > 50) {
      setCancellationLevel(`Partial Cancellation: ${cancellation.toFixed(1)}%`)
      setCancellationColor('#ffaa00')
    } else {
      setCancellationLevel(`Poor Cancellation: ${cancellation.toFixed(1)}%`)
      setCancellationColor('#ff0080')
    }
  }

  const animate = () => {
    if (!isAnimating) return

    const phaseShiftRadians = (phaseShiftRef.current * Math.PI) / 180
    drawNoiseWave(originalRef.current, false, 0)
    drawNoiseWave(invertedRef.current, true, phaseShiftRadians)
    drawResultWave(phaseShiftRadians)

    noisePhaseRef.current += 0.03

    animationFrameRef.current = requestAnimationFrame(animate)
  }

  const handlePlay = () => {
    setIsAnimating(true)
    animate()
  }

  const handleStop = () => {
    setIsAnimating(false)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }

  const handleReset = () => {
    setPhaseShiftDegrees(180)
  }

  const handlePhaseChange = (value: number) => {
    phaseShiftRef.current = value
    setPhaseShiftDegrees(value)
  }

  return (
    <div className="min-h-screen bg-dark-bg p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="inline-block mb-8 text-cyan-400 hover:text-cyan-300 transition-colors">
          ← Back to Home
        </Link>

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Noise Cancellation
        </h1>
        <p className="text-sm md:text-base text-gray-300 mb-6 md:mb-8">
          Active Noise Cancellation works by generating an anti-noise wave 180° out of phase
        </p>

        {/* Wave Physics Lab */}
        <div className="glass-morphism p-6 md:p-8 rounded-2xl mb-8">
          <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Wave Physics Laboratory</h2>

          {/* Original Wave */}
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-3 text-cyan-400">1. Original Noise Wave (Ambient Sound)</h3>
            <canvas 
              ref={originalRef}
              className="w-full border-2 border-cyan-400/20 rounded-lg"
            />
          </div>

          {/* Anti-Noise Wave */}
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-3 text-purple-400">2. Anti-Noise Wave (Generated by ANC System)</h3>
            <canvas 
              ref={invertedRef}
              className="w-full border-2 border-purple-400/20 rounded-lg mb-4"
            />
            
            <div className="bg-black/30 p-4 rounded-lg border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">
                  Phase Shift:
                </label>
                <span className="text-cyan-400 font-bold">{phaseShiftDegrees}°</span>
              </div>
              
              <input
                type="range"
                min="0"
                max="360"
                value={phaseShiftDegrees}
                onChange={(e) => handlePhaseChange(parseInt(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider-thumb mb-2"
              />
              
              <div className="flex justify-between text-xs text-gray-400">
                <span>0°</span>
                <span>90°</span>
                <span>180°</span>
                <span>270°</span>
                <span>360°</span>
              </div>
            </div>
          </div>

          {/* Resultant Wave */}
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-3 text-green-400">3. Resultant Wave (Superposition)</h3>
            <canvas 
              ref={resultRef}
              className="w-full border-2 border-green-400/20 rounded-lg mb-3"
            />
            <div 
              className="text-center font-bold text-lg"
              style={{ color: cancellationColor }}
            >
              {cancellationLevel}
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handlePlay}
              disabled={isAnimating}
              className="px-4 md:px-6 py-2 bg-green-400/20 hover:bg-green-400/30 border border-green-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
            >
              Play Animation
            </button>
            <button
              onClick={handleStop}
              disabled={!isAnimating}
              className="px-4 md:px-6 py-2 bg-red-400/20 hover:bg-red-400/30 border border-red-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
            >
              Pause
            </button>
            <button
              onClick={handleReset}
              className="px-4 md:px-6 py-2 bg-cyan-400/20 hover:bg-cyan-400/30 border border-cyan-400 rounded-lg transition-colors text-sm md:text-base"
            >
              Reset Phase
            </button>
          </div>
        </div>

        {/* Info Section */}
        <div className="glass-morphism p-6 md:p-8 rounded-2xl">
          <h3 className="text-xl font-bold mb-4">How It Works</h3>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start">
              <span className="text-cyan-400 mr-2">•</span>
              <span><strong>Original Wave:</strong> The blue wave represents ambient noise (like engine hum or background chatter)</span>
            </li>
            <li className="flex items-start">
              <span className="text-cyan-400 mr-2">•</span>
              <span><strong>Anti-Noise Wave:</strong> The purple wave is generated by the ANC microphone and DSP, inverted 180°</span>
            </li>
            <li className="flex items-start">
              <span className="text-cyan-400 mr-2">•</span>
              <span><strong>Phase Shift Control:</strong> Adjust the slider to see what happens when the anti-noise is not perfectly aligned</span>
            </li>
            <li className="flex items-start">
              <span className="text-cyan-400 mr-2">•</span>
              <span><strong>Perfect Cancellation:</strong> At 180° phase shift, the waves completely cancel each other out!</span>
            </li>
            <li className="flex items-start">
              <span className="text-cyan-400 mr-2">•</span>
              <span><strong>Superposition Principle:</strong> When two waves meet, their amplitudes add together algebraically</span>
            </li>
            <li className="flex items-start">
              <span className="text-cyan-400 mr-2">•</span>
              <span><strong>Destructive Interference:</strong> When peaks align with troughs (180° out of phase), waves cancel</span>
            </li>
            <li className="flex items-start">
              <span className="text-cyan-400 mr-2">•</span>
              <span><strong>Real-World ANC:</strong> Modern headphones use DSP to analyze and invert noise in real-time</span>
            </li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: #00ffff;
          cursor: pointer;
          border-radius: 50%;
          box-shadow: 0 0 10px #00ffff;
        }
        
        .slider-thumb::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #00ffff;
          cursor: pointer;
          border-radius: 50%;
          border: none;
          box-shadow: 0 0 10px #00ffff;
        }
      `}</style>
    </div>
  )
}
