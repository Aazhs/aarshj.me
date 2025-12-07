'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'

export default function QRCodePage() {
  const [text, setText] = useState('https://aarshj.me')
  const [errorLevel, setErrorLevel] = useState('H')
  const [damagePercentage, setDamagePercentage] = useState(0)
  const [damagedCells, setDamagedCells] = useState<Set<string>>(new Set())
  const [qrMatrix, setQrMatrix] = useState<number[][] | null>(null)
  const [recoveryStatus, setRecoveryStatus] = useState('Perfect')
  const [damagedCount, setDamagedCount] = useState(0)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const damagedCanvasRef = useRef<HTMLCanvasElement>(null)
  const correctedCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    generateQR()
  }, [text, errorLevel])

  const getQRCanvasSize = () => {
    const isMobile = window.innerWidth <= 768
    if (isMobile) {
      const maxSize = Math.min(250, window.innerWidth - 100)
      return Math.max(200, Math.floor(maxSize))
    }
    return 300
  }

  const generateQR = async () => {
    if (!canvasRef.current) return
    
    const QRCode = (await import('qrcode')).default
    const canvasSize = getQRCanvasSize()
    
    const errorLevels = {
      'L': 'L' as const,
      'M': 'M' as const,
      'Q': 'Q' as const,
      'H': 'H' as const,
    }
    
    canvasRef.current.width = canvasSize
    canvasRef.current.height = canvasSize
    
    await QRCode.toCanvas(canvasRef.current, text, {
      width: canvasSize,
      margin: 2,
      errorCorrectionLevel: errorLevels[errorLevel as keyof typeof errorLevels],
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
    
    // Extract matrix
    const ctx = canvasRef.current.getContext('2d')!
    const imageData = ctx.getImageData(0, 0, canvasSize, canvasSize)
    const matrix = extractMatrix(imageData, canvasSize)
    setQrMatrix(matrix)
    
    // Reset damage
    setDamagedCells(new Set())
    setDamagePercentage(0)
    setDamagedCount(0)
    setRecoveryStatus('Perfect')
    
    // Draw to damaged canvas
    if (damagedCanvasRef.current) {
      damagedCanvasRef.current.width = canvasSize
      damagedCanvasRef.current.height = canvasSize
      drawQRMatrix(damagedCanvasRef.current, matrix, new Set())
    }
    
    // Clear corrected canvas
    if (correctedCanvasRef.current) {
      correctedCanvasRef.current.width = canvasSize
      correctedCanvasRef.current.height = canvasSize
      const ctxCorrected = correctedCanvasRef.current.getContext('2d')!
      ctxCorrected.fillStyle = '#f0f0f0'
      ctxCorrected.fillRect(0, 0, canvasSize, canvasSize)
    }
  }

  const extractMatrix = (imageData: ImageData, size: number): number[][] => {
    const data = imageData.data
    const moduleSize = Math.floor(size / 29)
    const matrixSize = Math.floor(size / moduleSize)
    const matrix: number[][] = []
    
    for (let i = 0; i < matrixSize; i++) {
      const row: number[] = []
      for (let j = 0; j < matrixSize; j++) {
        const x = Math.floor(j * moduleSize + moduleSize / 2)
        const y = Math.floor(i * moduleSize + moduleSize / 2)
        const index = (y * size + x) * 4
        const brightness = data[index]
        row.push(brightness < 128 ? 1 : 0)
      }
      matrix.push(row)
    }
    
    return matrix
  }

  const drawQRMatrix = (canvas: HTMLCanvasElement, matrix: number[][], damaged: Set<string>) => {
    const ctx = canvas.getContext('2d')!
    const size = matrix.length
    const cellSize = canvas.width / size
    
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (matrix[i][j] === 1) {
          const cellKey = `${i},${j}`
          if (damaged.has(cellKey)) {
            ctx.fillStyle = '#ff0080'
          } else {
            ctx.fillStyle = '#000000'
          }
          ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize)
        }
      }
    }
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!qrMatrix || !damagedCanvasRef.current) return
    
    const rect = damagedCanvasRef.current.getBoundingClientRect()
    const scaleX = damagedCanvasRef.current.width / rect.width
    const scaleY = damagedCanvasRef.current.height / rect.height
    
    let clientX: number, clientY: number
    if ('touches' in e) {
      if (e.touches.length === 0) return
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    
    const x = (clientX - rect.left) * scaleX
    const y = (clientY - rect.top) * scaleY
    
    const size = qrMatrix.length
    const cellSize = damagedCanvasRef.current.width / size
    const row = Math.floor(y / cellSize)
    const col = Math.floor(x / cellSize)
    
    if (row >= 0 && row < size && col >= 0 && col < size) {
      const cellKey = `${row},${col}`
      const newDamaged = new Set(damagedCells)
      
      if (newDamaged.has(cellKey)) {
        newDamaged.delete(cellKey)
      } else {
        newDamaged.add(cellKey)
      }
      
      setDamagedCells(newDamaged)
      setDamagedCount(newDamaged.size)
      drawQRMatrix(damagedCanvasRef.current, qrMatrix, newDamaged)
      updateRecoveryStatus(newDamaged.size, size * size)
    }
  }

  const applyRandomDamage = () => {
    if (!qrMatrix || !damagedCanvasRef.current) return
    
    const size = qrMatrix.length
    const totalCells = size * size
    const damageCount = Math.floor(totalCells * (damagePercentage / 100))
    
    const newDamaged = new Set<string>()
    while (newDamaged.size < damageCount) {
      const row = Math.floor(Math.random() * size)
      const col = Math.floor(Math.random() * size)
      newDamaged.add(`${row},${col}`)
    }
    
    setDamagedCells(newDamaged)
    setDamagedCount(newDamaged.size)
    drawQRMatrix(damagedCanvasRef.current, qrMatrix, newDamaged)
    updateRecoveryStatus(newDamaged.size, totalCells)
  }

  const clearDamage = () => {
    if (!qrMatrix || !damagedCanvasRef.current || !correctedCanvasRef.current) return
    
    setDamagedCells(new Set())
    setDamagedCount(0)
    setRecoveryStatus('Perfect')
    drawQRMatrix(damagedCanvasRef.current, qrMatrix, new Set())
    
    const ctx = correctedCanvasRef.current.getContext('2d')!
    ctx.fillStyle = '#f0f0f0'
    ctx.fillRect(0, 0, correctedCanvasRef.current.width, correctedCanvasRef.current.height)
  }

  const updateRecoveryStatus = (damaged: number, total: number) => {
    const damagePercent = (damaged / total) * 100
    const maxRecovery = { 'L': 7, 'M': 15, 'Q': 25, 'H': 30 }[errorLevel] || 30
    
    if (damagePercent === 0) {
      setRecoveryStatus('Perfect')
    } else if (damagePercent <= maxRecovery) {
      setRecoveryStatus('Recoverable')
    } else if (damagePercent <= maxRecovery * 1.5) {
      setRecoveryStatus('Marginal')
    } else {
      setRecoveryStatus('Unrecoverable')
    }
  }

  const attemptCorrection = async () => {
    if (!correctedCanvasRef.current) return
    
    // Don't generate recovered QR if unrecoverable
    if (recoveryStatus === 'Unrecoverable') {
      const ctx = correctedCanvasRef.current.getContext('2d')!
      const canvasSize = getQRCanvasSize()
      correctedCanvasRef.current.width = canvasSize
      correctedCanvasRef.current.height = canvasSize
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(0, 0, canvasSize, canvasSize)
      ctx.fillStyle = '#ff4444'
      ctx.font = '16px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Cannot Recover', canvasSize / 2, canvasSize / 2)
      return
    }
    
    const QRCode = (await import('qrcode')).default
    const canvasSize = getQRCanvasSize()
    const errorLevels = { 'L': 'L' as const, 'M': 'M' as const, 'Q': 'Q' as const, 'H': 'H' as const }
    
    correctedCanvasRef.current.width = canvasSize
    correctedCanvasRef.current.height = canvasSize
    
    await QRCode.toCanvas(correctedCanvasRef.current, text, {
      width: canvasSize,
      margin: 2,
      errorCorrectionLevel: errorLevels[errorLevel as keyof typeof errorLevels],
      color: { dark: '#000000', light: '#ffffff' },
    })
  }

  return (
    <div className="min-h-screen bg-dark-bg p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="inline-block mb-8 text-cyan-400 hover:text-cyan-300 transition-colors">
          ← Back to Home
        </Link>

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          QR Codes: Error Correction Magic
        </h1>
        <p className="text-sm md:text-base text-gray-300 mb-6 md:mb-8">
          QR codes use Reed-Solomon error correction to remain readable even when damaged
        </p>

        {/* QR Generator */}
        <div className="glass-morphism p-6 md:p-8 rounded-2xl mb-8">
          <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Interactive QR Code Generator</h2>
          
          <div className="grid md:grid-cols-2 gap-8 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Enter Text or URL:</label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 mb-4"
                placeholder="https://example.com"
              />
              
              <label className="block text-sm font-medium mb-2">Error Correction Level:</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { level: 'L', name: 'Low', desc: '~7%' },
                  { level: 'M', name: 'Medium', desc: '~15%' },
                  { level: 'Q', name: 'Quartile', desc: '~25%' },
                  { level: 'H', name: 'High', desc: '~30%' },
                ].map((opt) => (
                  <button
                    key={opt.level}
                    onClick={() => setErrorLevel(opt.level)}
                    className={`px-4 py-3 rounded-lg border transition-all ${
                      errorLevel === opt.level
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400'
                        : 'bg-white/5 border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="font-bold">{opt.name}</div>
                    <div className="text-xs opacity-70">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center">
              <canvas ref={canvasRef} className="border-2 border-cyan-400/40 rounded-lg bg-white shadow-lg" />
            </div>
          </div>
        </div>

        {/* Error Correction Simulator */}
        <div className="glass-morphism p-6 md:p-8 rounded-2xl mb-8">
          <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Error Correction Simulator</h2>
          <p className="text-gray-300 mb-6">
            Click on the QR code below to damage individual cells, or use the slider to add random damage. 
            Watch Reed-Solomon algorithm work its magic!
          </p>
          
          {/* Damage Controls */}
          <div className="glass-morphism p-6 rounded-xl mb-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <span>Damage Amount: </span>
                  <span className="text-purple-400 font-bold">{damagePercentage}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={damagePercentage}
                  onChange={(e) => setDamagePercentage(parseInt(e.target.value))}
                  className="w-full h-2 bg-gradient-to-r from-green-500/30 via-yellow-500/50 to-red-500/70 rounded-lg"
                />
                <div className="flex gap-2 mt-4">
                  <button onClick={applyRandomDamage} className="flex-1 py-2 px-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg font-semibold hover:opacity-90 text-sm md:text-base">
                    Apply Random Damage
                  </button>
                  <button onClick={clearDamage} className="flex-1 py-2 px-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg font-semibold hover:opacity-90 text-sm md:text-base">
                    Clear Damage
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col justify-center gap-4">
                <div>
                  <div className="text-sm text-gray-400">Damaged Cells:</div>
                  <div className="text-3xl font-bold text-cyan-400">{damagedCount}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Recovery Status:</div>
                  <div className={`text-3xl font-bold ${
                    recoveryStatus === 'Perfect' ? 'text-cyan-400' :
                    recoveryStatus === 'Recoverable' ? 'text-green-400' :
                    recoveryStatus === 'Marginal' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>{recoveryStatus}</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* QR Displays */}
          <div className="flex flex-col items-center gap-6">
            <div className="glass-morphism p-6 rounded-xl w-full max-w-md">
              <h4 className="text-center font-bold mb-4 text-cyan-400">Interactive Damage (Click to toggle cells)</h4>
              <canvas
                ref={damagedCanvasRef}
                onClick={handleCanvasClick}
                onTouchStart={handleCanvasClick}
                className="border-2 border-cyan-400/40 rounded-lg bg-white mx-auto cursor-crosshair"
                style={{ touchAction: 'manipulation' }}
              />
              <p className="text-center text-sm text-gray-400 mt-2">Click on cells to damage/repair them</p>
            </div>
            
            <div className="glass-morphism p-6 rounded-xl w-full max-w-md">
              <div className="flex flex-col items-center gap-4 mb-4">
                <div className="px-6 py-3 bg-gradient-to-r from-purple-500/20 to-purple-500/10 border-2 border-purple-500/60 rounded-xl">
                  <div className="font-bold text-purple-400">Reed-Solomon</div>
                  <div className="text-xs text-gray-400">Error Correction</div>
                </div>
                <button onClick={attemptCorrection} className="py-3 px-6 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg font-semibold hover:opacity-90 text-sm md:text-base">
                  Attempt Recovery
                </button>
              </div>
              
              <h4 className="text-center font-bold mb-4 text-cyan-400">Recovered QR Code</h4>
              <canvas
                ref={correctedCanvasRef}
                className="border-2 border-cyan-400/40 rounded-lg bg-white mx-auto"
              />
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="glass-morphism p-6 md:p-8 rounded-2xl">
          <h3 className="text-xl font-bold mb-4">How Reed-Solomon Works:</h3>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start">
              <span className="text-cyan-400 mr-2">•</span>
              <span><strong>Polynomial Encoding:</strong> Data is encoded as coefficients of a polynomial</span>
            </li>
            <li className="flex items-start">
              <span className="text-cyan-400 mr-2">•</span>
              <span><strong>Redundancy:</strong> Extra error correction codewords are added (up to 30% of data)</span>
            </li>
            <li className="flex items-start">
              <span className="text-cyan-400 mr-2">•</span>
              <span><strong>Syndrome Calculation:</strong> Detects which cells are corrupted</span>
            </li>
            <li className="flex items-start">
              <span className="text-cyan-400 mr-2">•</span>
              <span><strong>Error Locator:</strong> Finds the exact positions of errors</span>
            </li>
            <li className="flex items-start">
              <span className="text-cyan-400 mr-2">•</span>
              <span><strong>Correction:</strong> Uses polynomial math to calculate correct values</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white/5 p-4 rounded-lg border border-white/10">
      <p className="text-sm text-gray-400 mb-1">{title}</p>
      <p className="text-lg font-bold text-cyan-400">{value}</p>
    </div>
  )
}
