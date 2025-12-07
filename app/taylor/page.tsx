'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'

export default function TaylorPage() {
  const [terms, setTerms] = useState(1)
  const [resultValue, setResultValue] = useState('0')
  const [binaryInput, setBinaryInput] = useState('')
  
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    drawTaylorSeries()
    
    // Binary animation
    const interval = setInterval(() => {
      const binary = Array(16).fill(0).map(() => Math.random() > 0.5 ? '1' : '0').join(' ')
      setBinaryInput(binary)
    }, 500)
    
    return () => clearInterval(interval)
  }, [terms])

  useEffect(() => {
    const handleResize = () => drawTaylorSeries()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [terms])

  const factorial = (n: number): number => {
    if (n <= 1) return 1
    let result = 1
    for (let i = 2; i <= n; i++) result *= i
    return result
  }

  const taylorSin = (x: number, numTerms: number): number => {
    let result = 0
    for (let n = 0; n < numTerms; n++) {
      const sign = Math.pow(-1, n)
      const numerator = Math.pow(x, 2 * n + 1)
      const denominator = factorial(2 * n + 1)
      result += sign * numerator / denominator
    }
    return result
  }

  const drawTaylorSeries = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')!
    const isMobile = window.innerWidth <= 768
    const width = Math.min(800, window.innerWidth - 40)
    const height = width / 2

    canvas.width = width
    canvas.height = height

    // Clear
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
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

    const centerY = height / 2
    const centerX = width / 2

    // Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, centerY)
    ctx.lineTo(width, centerY)
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(centerX, 0)
    ctx.lineTo(centerX, height)
    ctx.stroke()

    const scale = 60

    // Draw true sin(x)
    ctx.strokeStyle = '#00ffff'
    ctx.lineWidth = 3
    ctx.beginPath()
    
    for (let px = 0; px < width; px++) {
      const x = (px - centerX) / scale
      const y = Math.sin(x)
      const py = centerY - y * scale * 1.5
      
      if (px === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()

    // Draw Taylor approximation
    const colors = ['#ff0080', '#ffff00', '#00ff80', '#ff8000', '#8000ff', '#ff0000', '#00ff00', '#0000ff', '#ff00ff']
    ctx.strokeStyle = colors[(terms - 1) % colors.length]
    ctx.lineWidth = 2
    ctx.beginPath()
    
    for (let px = 0; px < width; px++) {
      const x = (px - centerX) / scale
      const y = taylorSin(x, terms)
      const py = centerY - y * scale * 1.5
      
      if (px === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()

    // Labels
    ctx.fillStyle = '#00ffff'
    ctx.font = isMobile ? '12px sans-serif' : '14px sans-serif'
    ctx.fillText('sin(x)', 10, 20)
    
    ctx.fillStyle = colors[(terms - 1) % colors.length]
    ctx.fillText(`Taylor (${terms} term${terms > 1 ? 's' : ''})`, 10, 40)

    // Update result value
    const testX = Math.PI / 6
    setResultValue(taylorSin(testX, terms).toFixed(6))
  }

  const getFormula = () => {
    const formulas = [
      'sin(x) ≈ x',
      'sin(x) ≈ x - x³/3!',
      'sin(x) ≈ x - x³/3! + x⁵/5!',
      'sin(x) ≈ x - x³/3! + x⁵/5! - x⁷/7!',
      'sin(x) ≈ x - x³/3! + x⁵/5! - x⁷/7! + x⁹/9!',
      'sin(x) ≈ x - x³/3! + x⁵/5! - x⁷/7! + x⁹/9! - x¹¹/11!',
      'sin(x) ≈ x - x³/3! + x⁵/5! - x⁷/7! + x⁹/9! - x¹¹/11! + x¹³/13!',
      'sin(x) ≈ x - x³/3! + ... + x¹⁵/15!',
      'sin(x) ≈ x - x³/3! + ... + x¹⁷/17!'
    ]
    return formulas[terms - 1] || formulas[formulas.length - 1]
  }

  const getErrorData = () => {
    const errors = [
      { terms: 1, error: '16.7%' },
      { terms: 2, error: '0.84%' },
      { terms: 3, error: '0.018%' },
      { terms: 4, error: '0.00027%' },
      { terms: 5, error: '0.0000029%' },
      { terms: 6, error: '0.000000024%' },
      { terms: 7, error: '0.00000000016%' },
      { terms: 8, error: '0.0000000000009%' },
      { terms: 9, error: '< 0.000000000001%' }
    ]
    return errors.slice(0, terms)
  }

  return (
    <div className="min-h-screen bg-dark-bg p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="inline-block mb-8 text-cyan-400 hover:text-cyan-300 transition-colors">
          ← Back to Home
        </Link>

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Computers & Trigonometry
        </h1>
        <p className="text-sm md:text-base text-gray-300 mb-6 md:mb-8">
          How CPUs calculate sin(x) using Taylor series approximations
        </p>

        {/* Taylor Series Visualization */}
        <div className="glass-morphism p-6 md:p-8 rounded-2xl mb-8">
          <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Taylor Series Approximation of sin(x)</h2>
          
          <div className="mb-6">
            <canvas 
              ref={canvasRef} 
              className="w-full border-2 border-cyan-400/20 rounded-lg"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Number of Terms: <span className="text-cyan-400 font-bold">{terms}</span>
            </label>
            <input
              type="range"
              min="1"
              max="9"
              value={terms}
              onChange={(e) => setTerms(parseInt(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider-thumb"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1</span>
              <span>5</span>
              <span>9</span>
            </div>
          </div>

          <div className="bg-black/30 p-4 rounded-lg mb-6 border border-cyan-400/20">
            <div className="text-cyan-400 font-mono text-sm md:text-base break-all">
              {getFormula()}
            </div>
          </div>

          <button
            onClick={() => setTerms(1)}
            className="px-6 py-2 bg-cyan-400/20 hover:bg-cyan-400/30 border border-cyan-400 rounded-lg transition-colors text-sm md:text-base"
          >
            Reset
          </button>
        </div>

        {/* CPU Simulation */}
        <div className="glass-morphism p-6 md:p-8 rounded-2xl mb-8">
          <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Inside the CPU</h2>
          
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {/* Input */}
            <div className="bg-black/30 p-6 rounded-lg border border-purple-400/30">
              <div className="text-xs text-gray-400 mb-2">Input (Binary)</div>
              <div className="font-mono text-green-400 text-xs break-all min-h-[40px]">
                {binaryInput}
              </div>
            </div>

            {/* CPU */}
            <div className="bg-gradient-to-br from-purple-500/20 to-cyan-500/20 p-6 rounded-lg border-2 border-cyan-400 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-purple-400/10 animate-pulse"></div>
              <div className="relative z-10">
                <div className="text-xl font-bold text-center mb-4">ALU</div>
                <div className="space-y-2 text-sm text-center text-gray-300">
                  <div>+ Addition</div>
                  <div>× Multiplication</div>
                  <div>÷ Division</div>
                </div>
              </div>
            </div>

            {/* Output */}
            <div className="bg-black/30 p-6 rounded-lg border border-cyan-400/30">
              <div className="text-xs text-gray-400 mb-2">Output</div>
              <div className="font-mono text-cyan-400 text-lg">
                sin(x) ≈ <span className="text-green-400">{resultValue}</span>
              </div>
            </div>
          </div>

          {/* Error Table */}
          <div className="bg-black/30 p-6 rounded-lg border border-white/10">
            <h3 className="text-lg font-bold mb-4">Approximation Error</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-2 px-4">Terms</th>
                    <th className="text-right py-2 px-4">Max Error</th>
                  </tr>
                </thead>
                <tbody>
                  {getErrorData().map((row, idx) => (
                    <tr 
                      key={idx} 
                      className={`border-b border-white/10 ${row.terms === terms ? 'bg-cyan-400/10' : ''}`}
                    >
                      <td className="py-2 px-4">{row.terms}</td>
                      <td className="py-2 px-4 text-right font-mono text-cyan-400">{row.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="glass-morphism p-6 md:p-8 rounded-2xl">
          <h3 className="text-xl font-bold mb-4">How It Works</h3>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start">
              <span className="text-cyan-400 mr-2">•</span>
              <span><strong>Taylor Series:</strong> Represents complex functions as infinite sums of polynomial terms</span>
            </li>
            <li className="flex items-start">
              <span className="text-cyan-400 mr-2">•</span>
              <span><strong>CPU Efficiency:</strong> More terms = higher accuracy but slower computation</span>
            </li>
            <li className="flex items-start">
              <span className="text-cyan-400 mr-2">•</span>
              <span><strong>Practical Use:</strong> CPUs typically use 5-7 terms for good balance of speed and accuracy</span>
            </li>
            <li className="flex items-start">
              <span className="text-cyan-400 mr-2">•</span>
              <span><strong>Error Reduction:</strong> Each additional term dramatically reduces the approximation error</span>
            </li>
            <li className="flex items-start">
              <span className="text-cyan-400 mr-2">•</span>
              <span><strong>Applications:</strong> Used in graphics rendering, physics simulations, signal processing, and more</span>
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
