// ============================================
// Global State & Utilities
// ============================================

let currentTopic = null;

// Utility: Setup canvas for high DPI displays
function setupHighDPICanvas(canvas, width, height) {
    const dpr = window.devicePixelRatio || 1;
    
    // Set display size (CSS pixels)
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    
    // Set actual size in memory (scaled for DPI)
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    
    // Scale all drawing operations
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    
    return ctx;
}

// Helper function to get responsive QR canvas size
function getQRCanvasSize() {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        // On mobile, use smaller size that fits better
        const maxSize = Math.min(280, window.innerWidth - 80);
        return Math.floor(maxSize);
    }
    return 300;
}

// QR Code library - using real QR code generation
class QRCodeGenerator {
    static generate(text) {
        // Generate real QR code using library, then extract matrix
        const tempDiv = document.createElement('div');
        const qr = new QRCode(tempDiv, {
            text: text,
            width: 200,
            height: 200,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
        
        // Wait for generation and extract canvas data
        const canvas = tempDiv.querySelector('canvas');
        if (!canvas) {
            // Fallback to image
            const img = tempDiv.querySelector('img');
            return this.imageToMatrix(img);
        }
        return this.canvasToMatrix(canvas);
    }
    
    static canvasToMatrix(canvas) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        // Sample to get module size (QR code cell size)
        const moduleSize = Math.floor(width / 29); // Approximate
        const size = Math.floor(width / moduleSize);
        const matrix = [];
        
        for (let i = 0; i < size; i++) {
            const row = [];
            for (let j = 0; j < size; j++) {
                const x = Math.floor(j * moduleSize + moduleSize / 2);
                const y = Math.floor(i * moduleSize + moduleSize / 2);
                const index = (y * width + x) * 4;
                const brightness = data[index]; // R value (grayscale)
                row.push(brightness < 128 ? 1 : 0);
            }
            matrix.push(row);
        }
        
        return matrix;
    }
    
    static imageToMatrix(img) {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        return this.canvasToMatrix(canvas);
    }
    
    static damage(matrix, percentage = 0.2) {
        const damaged = matrix.map(row => [...row]);
        const size = damaged.length;
        const count = Math.floor(size * size * percentage);
        
        for (let i = 0; i < count; i++) {
            const row = Math.floor(Math.random() * size);
            const col = Math.floor(Math.random() * size);
            damaged[row][col] = 1 - damaged[row][col];
        }
        
        return damaged;
    }
    
    static drawQR(canvas, matrix) {
        const ctx = canvas.getContext('2d');
        const size = matrix.length;
        const cellSize = canvas.width / size;
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#000000';
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (matrix[i][j] === 1) {
                    ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
                }
            }
        }
    }
    
    static drawDamagedQR(canvas, matrix, damagedCells) {
        const ctx = canvas.getContext('2d');
        const size = matrix.length;
        const cellSize = canvas.width / size;
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (matrix[i][j] === 1) {
                    if (damagedCells && damagedCells.some(([r, c]) => r === i && c === j)) {
                        ctx.fillStyle = '#ff0080';
                    } else {
                        ctx.fillStyle = '#000000';
                    }
                    ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
                }
            }
        }
    }
}

// ============================================
// Card Interactions & Transitions
// ============================================

function initializeCardInteractions() {
    const cards = document.querySelectorAll('.card');
    const gridContainer = document.querySelector('.grid-container');
    const centralIcon = document.querySelector('.central-icon');
    const gridLines = document.querySelector('.grid-lines');
    
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const topic = card.dataset.topic;
            openDeepDive(topic, card);
        });
    });
}

function openDeepDive(topic, card) {
    currentTopic = topic;
    const deepdiveSection = document.getElementById(`deepdive-${topic}`);
    const gridContainer = document.querySelector('.grid-container');
    const centralIcon = document.querySelector('.central-icon');
    const gridLines = document.querySelector('.grid-lines');
    
    // Get card position
    const rect = card.getBoundingClientRect();
    
    // Hide other cards
    document.querySelectorAll('.card').forEach(c => {
        if (c !== card) {
            c.style.opacity = '0';
            c.style.transform = 'scale(0.8)';
        }
    });
    
    // Animate card expansion
    card.style.position = 'fixed';
    card.style.top = `${rect.top}px`;
    card.style.left = `${rect.left}px`;
    card.style.width = `${rect.width}px`;
    card.style.height = `${rect.height}px`;
    card.style.zIndex = '90';
    
    // Fade out central icon and grid lines
    centralIcon.style.opacity = '0';
    gridLines.style.opacity = '0';
    
    setTimeout(() => {
        card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        card.style.top = '0';
        card.style.left = '0';
        card.style.width = '100vw';
        card.style.height = '100vh';
        card.style.opacity = '0';
    }, 50);
    
    setTimeout(() => {
        gridContainer.style.display = 'none';
        centralIcon.style.display = 'none';
        gridLines.style.display = 'none';
        deepdiveSection.classList.add('active');
        
        // Initialize the specific visualization
        initializeVisualization(topic);
    }, 650);
}

function closeDeepDive() {
    const deepdiveSection = document.querySelector('.deepdive-section.active');
    if (!deepdiveSection) return;
    
    deepdiveSection.classList.remove('active');
    
    setTimeout(() => {
        const gridContainer = document.querySelector('.grid-container');
        const centralIcon = document.querySelector('.central-icon');
        const gridLines = document.querySelector('.grid-lines');
        
        gridContainer.style.display = 'grid';
        centralIcon.style.display = 'block';
        gridLines.style.display = 'block';
        
        // Reset cards
        document.querySelectorAll('.card').forEach(card => {
            card.style.position = 'relative';
            card.style.top = 'auto';
            card.style.left = 'auto';
            card.style.width = 'auto';
            card.style.height = 'auto';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
            card.style.zIndex = 'auto';
        });
        
        centralIcon.style.opacity = '1';
        gridLines.style.opacity = '1';
        
        currentTopic = null;
    }, 100);
}

function initializeVisualization(topic) {
    switch(topic) {
        case 'qr':
            initQRVisualization();
            break;
        case 'trig':
            initTaylorVisualization();
            break;
        case 'gps':
            initGPSVisualization();
            break;
        case 'noise':
            initNoiseVisualization();
            break;
    }
}

// ============================================
// QR Code Visualization
// ============================================

let qrMatrix = null;
let damagedMatrix = null;
let damagedCells = [];
let qrCodeObjects = {}; // Store QR code instances

function initQRVisualization() {
    let currentErrorLevel = 'H';
    let currentText = 'https://aarshj.me';
    let qrMatrix = null;
    let damagedCells = new Set(); // Use Set for efficient lookups
    let damagePercentage = 0;
    
    // Get elements
    const textInput = document.getElementById('qr-text-input');
    const generateBtn = document.getElementById('generate-qr-btn');
    const levelBtns = document.querySelectorAll('.level-btn');
    const qrCanvas = document.getElementById('qr-canvas');
    const qrDamaged = document.getElementById('qr-damaged');
    const qrCorrected = document.getElementById('qr-corrected');
    const damageSlider = document.getElementById('damage-slider');
    const damagePercentageSpan = document.getElementById('damage-percentage');
    const applyDamageBtn = document.getElementById('apply-damage-btn');
    const clearDamageBtn = document.getElementById('clear-damage-btn');
    const correctBtn = document.getElementById('correct-btn');
    const damagedCountSpan = document.getElementById('damaged-count');
    const recoveryStatusSpan = document.getElementById('recovery-status');
    const scanStatusP = document.getElementById('scan-status');
    
    // Generate initial QR code
    generateQRCode();
    
    // Handle window resize to regenerate QR codes with new size
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (qrMatrix) {
                generateQRCode();
            }
        }, 250);
    });
    
    // Event listeners
    textInput.addEventListener('input', (e) => {
        currentText = e.target.value || 'Empty';
    });
    
    textInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            generateQRCode();
        }
    });
    
    generateBtn.addEventListener('click', generateQRCode);
    
    levelBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            levelBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentErrorLevel = btn.dataset.level;
            generateQRCode();
        });
    });
    
    damageSlider.addEventListener('input', (e) => {
        damagePercentage = parseInt(e.target.value);
        damagePercentageSpan.textContent = damagePercentage + '%';
    });
    
    applyDamageBtn.addEventListener('click', applyRandomDamage);
    clearDamageBtn.addEventListener('click', clearAllDamage);
    correctBtn.addEventListener('click', attemptCorrection);
    
    // Interactive canvas clicking
    qrDamaged.addEventListener('click', handleQRClick);
    qrDamaged.addEventListener('touchstart', handleQRTouch, { passive: false });
    qrDamaged.addEventListener('touchmove', handleQRTouchMove, { passive: false });
    
    function generateQRCode() {
        damagedCells.clear();
        updateDamageStats();
        
        // Generate QR code
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        document.body.appendChild(tempDiv);
        
        const errorLevels = {
            'L': QRCode.CorrectLevel.L,
            'M': QRCode.CorrectLevel.M,
            'Q': QRCode.CorrectLevel.Q,
            'H': QRCode.CorrectLevel.H
        };
        
        try {
            const qr = new QRCode(tempDiv, {
                text: currentText,
                width: 300,
                height: 300,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: errorLevels[currentErrorLevel]
            });
            
            setTimeout(() => {
                const qrCanvasTemp = tempDiv.querySelector('canvas');
                if (qrCanvasTemp) {
                    // Get responsive size
                    const canvasSize = getQRCanvasSize();
                    qrCanvas.width = canvasSize;
                    qrCanvas.height = canvasSize;
                    
                    // Draw to main canvas
                    const ctx = qrCanvas.getContext('2d');
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvasSize, canvasSize);
                    ctx.drawImage(qrCanvasTemp, 0, 0, canvasSize, canvasSize);
                    
                    // Extract matrix
                    qrMatrix = QRCodeGenerator.canvasToMatrix(qrCanvasTemp);
                    
                    // Update info
                    document.getElementById('qr-size-info').textContent = `Size: ${qrMatrix.length}x${qrMatrix.length}`;
                    document.getElementById('qr-capacity-info').textContent = `Capacity: ${currentText.length} chars`;
                    
                    // Set size for other canvases
                    qrDamaged.width = canvasSize;
                    qrDamaged.height = canvasSize;
                    qrCorrected.width = canvasSize;
                    qrCorrected.height = canvasSize;
                    
                    // Draw to damaged canvas (undamaged initially)
                    drawQRWithDamage();
                    
                    // Clear corrected canvas
                    const ctxCorrected = qrCorrected.getContext('2d');
                    ctxCorrected.fillStyle = '#f0f0f0';
                    ctxCorrected.fillRect(0, 0, canvasSize, canvasSize);
                    scanStatusP.textContent = 'Awaiting correction...';
                    scanStatusP.style.color = 'rgba(255,255,255,0.6)';
                }
                document.body.removeChild(tempDiv);
            }, 100);
        } catch (error) {
            console.error('QR generation error:', error);
            document.body.removeChild(tempDiv);
        }
    }
    
    function handleQRClick(e) {
        if (!qrMatrix) return;
        
        const rect = qrDamaged.getBoundingClientRect();
        const scaleX = qrDamaged.width / rect.width;
        const scaleY = qrDamaged.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        toggleQRCell(x, y);
    }
    
    function handleQRTouch(e) {
        if (!qrMatrix) return;
        e.preventDefault();
        
        const rect = qrDamaged.getBoundingClientRect();
        const scaleX = qrDamaged.width / rect.width;
        const scaleY = qrDamaged.height / rect.height;
        const touch = e.touches[0];
        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top) * scaleY;
        
        toggleQRCell(x, y);
    }
    
    function handleQRTouchMove(e) {
        if (!qrMatrix) return;
        e.preventDefault();
        
        const rect = qrDamaged.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        // Don't toggle on move, just handle drag behavior
        // This prevents accidental toggling while scrolling
    }
    
    function toggleQRCell(x, y) {
        
        const size = qrMatrix.length;
        const canvasSize = qrDamaged.width;
        const cellSize = canvasSize / size;
        
        const row = Math.floor(y / cellSize);
        const col = Math.floor(x / cellSize);
        
        if (row >= 0 && row < size && col >= 0 && col < size) {
            const cellKey = `${row},${col}`;
            
            if (damagedCells.has(cellKey)) {
                damagedCells.delete(cellKey);
            } else {
                damagedCells.add(cellKey);
            }
            
            drawQRWithDamage();
            updateDamageStats();
        }
    }
    
    function applyRandomDamage() {
        if (!qrMatrix) return;
        
        damagedCells.clear();
        const size = qrMatrix.length;
        const totalCells = size * size;
        const damageCount = Math.floor(totalCells * (damagePercentage / 100));
        
        while (damagedCells.size < damageCount) {
            const row = Math.floor(Math.random() * size);
            const col = Math.floor(Math.random() * size);
            damagedCells.add(`${row},${col}`);
        }
        
        drawQRWithDamage();
        updateDamageStats();
    }
    
    function clearAllDamage() {
        damagedCells.clear();
        drawQRWithDamage();
        updateDamageStats();
        
        // Clear corrected canvas
        const ctxCorrected = qrCorrected.getContext('2d');
        const canvasSize = qrCorrected.width;
        ctxCorrected.fillStyle = '#f0f0f0';
        ctxCorrected.fillRect(0, 0, canvasSize, canvasSize);
        scanStatusP.textContent = 'Awaiting correction...';
        scanStatusP.style.color = 'rgba(255,255,255,0.6)';
    }
    
    function drawQRWithDamage() {
        if (!qrMatrix) return;
        
        const ctx = qrDamaged.getContext('2d');
        const canvasSize = qrDamaged.width;
        const size = qrMatrix.length;
        const cellSize = canvasSize / size;
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasSize, canvasSize);
        
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const cellKey = `${i},${j}`;
                const isDamaged = damagedCells.has(cellKey);
                
                let fillColor;
                if (isDamaged) {
                    // Damaged cells shown in red
                    fillColor = qrMatrix[i][j] === 1 ? '#ff0080' : '#ffccdd';
                } else {
                    fillColor = qrMatrix[i][j] === 1 ? '#000000' : '#ffffff';
                }
                
                ctx.fillStyle = fillColor;
                ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
            }
        }
    }
    
    function updateDamageStats() {
        const count = damagedCells.size;
        damagedCountSpan.textContent = count;
        
        if (!qrMatrix) {
            recoveryStatusSpan.textContent = 'N/A';
            return;
        }
        
        const size = qrMatrix.length;
        const totalCells = size * size;
        const damagePercent = (count / totalCells) * 100;
        
        const maxRecovery = {
            'L': 7,
            'M': 15,
            'Q': 25,
            'H': 30
        }[currentErrorLevel];
        
        if (damagePercent === 0) {
            recoveryStatusSpan.textContent = 'Perfect';
            recoveryStatusSpan.style.color = '#00ffff';
        } else if (damagePercent <= maxRecovery) {
            recoveryStatusSpan.textContent = 'Recoverable';
            recoveryStatusSpan.style.color = '#00ff80';
        } else if (damagePercent <= maxRecovery * 1.5) {
            recoveryStatusSpan.textContent = 'Marginal';
            recoveryStatusSpan.style.color = '#ffaa00';
        } else {
            recoveryStatusSpan.textContent = 'Unrecoverable';
            recoveryStatusSpan.style.color = '#ff0080';
        }
    }
    
    function attemptCorrection() {
        if (!qrMatrix) return;
        
        correctBtn.disabled = true;
        correctBtn.textContent = '⏳ Correcting...';
        scanStatusP.textContent = 'Running Reed-Solomon algorithm...';
        scanStatusP.style.color = '#ffaa00';
        
        // Simulate correction process
        setTimeout(() => {
            // Generate fresh QR code as "corrected" version
            const tempDiv = document.createElement('div');
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            document.body.appendChild(tempDiv);
            
            const errorLevels = {
                'L': QRCode.CorrectLevel.L,
                'M': QRCode.CorrectLevel.M,
                'Q': QRCode.CorrectLevel.Q,
                'H': QRCode.CorrectLevel.H
            };
            
            const qr = new QRCode(tempDiv, {
                text: currentText,
                width: 300,
                height: 300,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: errorLevels[currentErrorLevel]
            });
            
            setTimeout(() => {
                const qrCanvasTemp = tempDiv.querySelector('canvas');
                if (qrCanvasTemp) {
                    const ctx = qrCorrected.getContext('2d');
                    const canvasSize = qrCorrected.width;
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvasSize, canvasSize);
                    ctx.drawImage(qrCanvasTemp, 0, 0, canvasSize, canvasSize);
                    
                    // Determine success
                    const size = qrMatrix.length;
                    const totalCells = size * size;
                    const damagePercent = (damagedCells.size / totalCells) * 100;
                    const maxRecovery = {
                        'L': 7, 'M': 15, 'Q': 25, 'H': 30
                    }[currentErrorLevel];
                    
                    if (damagePercent <= maxRecovery) {
                        scanStatusP.textContent = '✅ Recovery Successful! QR code is scannable.';
                        scanStatusP.style.color = '#00ff80';
                    } else {
                        scanStatusP.textContent = '⚠️ Too much damage. Recovery failed.';
                        scanStatusP.style.color = '#ff0080';
                        
                        // Show corrupted version
                        ctx.fillStyle = 'rgba(255, 0, 128, 0.2)';
                        ctx.fillRect(0, 0, 300, 300);
                    }
                }
                document.body.removeChild(tempDiv);
                
                correctBtn.disabled = false;
                correctBtn.textContent = '✨ Attempt Recovery';
            }, 100);
        }, 1500);
    }
}

// ============================================
// Taylor Series Visualization
// ============================================

let taylorAnimationFrame = null;

function initTaylorVisualization() {
    const canvas = document.getElementById('taylor-canvas');
    const slider = document.getElementById('terms-slider');
    const termsValue = document.getElementById('terms-value');
    const formulaDisplay = document.getElementById('taylor-formula');
    const binaryInput = document.getElementById('binary-input');
    const cpuResult = document.getElementById('result-value');
    const errorTbody = document.getElementById('error-tbody');
    const resetBtn = document.getElementById('reset-taylor');
    
    // Set canvas size for mobile
    resizeTaylorCanvas();
    window.addEventListener('resize', resizeTaylorCanvas);
    
    slider.addEventListener('input', (e) => {
        const terms = parseInt(e.target.value);
        termsValue.textContent = terms;
        drawTaylorSeries(canvas, terms);
        updateFormula(formulaDisplay, terms);
        animateCPU(terms);
        updateErrorTable(errorTbody, terms);
    });
    
    resetBtn.addEventListener('click', () => {
        slider.value = 1;
        termsValue.textContent = 1;
        drawTaylorSeries(canvas, 1);
        updateFormula(formulaDisplay, 1);
        animateCPU(1);
        updateErrorTable(errorTbody, 1);
    });
    
    // Initial draw
    drawTaylorSeries(canvas, 1);
    updateFormula(formulaDisplay, 1);
    updateErrorTable(errorTbody, 1);
    
    // Animate binary input
    setInterval(() => {
        const binary = Array(16).fill().map(() => Math.random() > 0.5 ? '1' : '0').join(' ');
        binaryInput.textContent = binary;
    }, 500);
}

function resizeTaylorCanvas() {
    const canvas = document.getElementById('taylor-canvas');
    if (!canvas) return;
    
    const container = canvas.parentElement;
    const maxWidth = Math.min(800, container.clientWidth - 40);
    canvas.width = maxWidth;
    canvas.height = maxWidth / 2;
    
    const terms = parseInt(document.getElementById('terms-slider').value);
    drawTaylorSeries(canvas, terms);
}

function drawTaylorSeries(canvas, numTerms) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    const centerY = height / 2;
    const centerX = width / 2;
    
    // Horizontal lines
    for (let i = 0; i <= 4; i++) {
        const y = (height / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    
    // Vertical lines
    for (let i = 0; i <= 8; i++) {
        const x = (width / 8) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    
    // Draw axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();
    
    // Scale
    const scale = 60;
    const xRange = width / scale;
    
    // Draw true sin(x)
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    for (let px = 0; px < width; px++) {
        const x = (px - centerX) / scale;
        const y = Math.sin(x);
        const py = centerY - y * scale * 1.5;
        
        if (px === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }
    ctx.stroke();
    
    // Draw Taylor approximation
    const colors = ['#ff0080', '#ffff00', '#00ff80', '#ff8000', '#8000ff', '#ff0000', '#00ff00', '#0000ff', '#ff00ff'];
    
    ctx.strokeStyle = colors[(numTerms - 1) % colors.length];
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let px = 0; px < width; px++) {
        const x = (px - centerX) / scale;
        const y = taylorSin(x, numTerms);
        const py = centerY - y * scale * 1.5;
        
        if (px === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }
    ctx.stroke();
    
    // Labels
    ctx.fillStyle = '#00ffff';
    ctx.font = '14px JetBrains Mono';
    ctx.fillText('sin(x)', 10, 20);
    
    ctx.fillStyle = colors[(numTerms - 1) % colors.length];
    ctx.fillText(`Taylor (${numTerms} term${numTerms > 1 ? 's' : ''})`, 10, 40);
}

function taylorSin(x, terms) {
    let result = 0;
    for (let n = 0; n < terms; n++) {
        const sign = Math.pow(-1, n);
        const numerator = Math.pow(x, 2 * n + 1);
        const denominator = factorial(2 * n + 1);
        result += sign * numerator / denominator;
    }
    return result;
}

function factorial(n) {
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

function updateFormula(element, terms) {
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
    ];
    
    element.textContent = formulas[terms - 1] || formulas[formulas.length - 1];
}

function animateCPU(terms) {
    const chipGlow = document.querySelector('.chip-glow');
    const resultValue = document.getElementById('result-value');
    
    chipGlow.classList.add('active');
    
    // Simulate calculation
    let currentTerm = 0;
    const interval = setInterval(() => {
        currentTerm++;
        const approx = taylorSin(Math.PI / 4, currentTerm);
        resultValue.textContent = approx.toFixed(6);
        
        if (currentTerm >= terms) {
            clearInterval(interval);
            setTimeout(() => chipGlow.classList.remove('active'), 1000);
        }
    }, 200);
}

function updateErrorTable(tbody, maxTerms) {
    tbody.innerHTML = '';
    
    for (let terms = 1; terms <= maxTerms; terms++) {
        let maxError = 0;
        for (let x = -Math.PI; x <= Math.PI; x += 0.1) {
            const actual = Math.sin(x);
            const approx = taylorSin(x, terms);
            const error = Math.abs(actual - approx);
            maxError = Math.max(maxError, error);
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${terms}</td>
            <td>${maxError.toExponential(3)}</td>
        `;
        tbody.appendChild(row);
    }
}

// ============================================
// GPS Trilateration Visualization
// ============================================

let gpsAnimationFrame = null;
let gpsAnimationState = 'idle';
let showSpheres = false;
let satelliteSphereStates = [false, false, false, false]; // Individual sphere visibility
let draggingObject = null;
let satellites = [];
let receiverPos = null;
let earthCenter = null;
let earthRadius = 0;

function initGPSVisualization() {
    const canvas = document.getElementById('globe-canvas');
    const showSpheresBtn = document.getElementById('show-spheres');
    const autoLocateBtn = document.getElementById('auto-locate');
    const randomizeBtn = document.getElementById('randomize-satellites');
    const resetBtn = document.getElementById('reset-trilateration');
    
    // Resize canvas for mobile
    resizeGlobeCanvas();
    window.addEventListener('resize', resizeGlobeCanvas);
    
    initializeGPSObjects(canvas);
    drawGPSScene(canvas);
    
    // Mouse/touch interaction
    canvas.addEventListener('mousedown', handleGPSMouseDown);
    canvas.addEventListener('mousemove', handleGPSMouseMove);
    canvas.addEventListener('mouseup', handleGPSMouseUp);
    canvas.addEventListener('touchstart', handleGPSTouchStart);
    canvas.addEventListener('touchmove', handleGPSTouchMove);
    canvas.addEventListener('touchend', handleGPSMouseUp);
    
    showSpheresBtn.addEventListener('click', () => {
        showSpheres = !showSpheres;
        if (showSpheres) {
            // Turn on all spheres
            satelliteSphereStates = [true, true, true, true];
        } else {
            // Turn off all spheres
            satelliteSphereStates = [false, false, false, false];
        }
        showSpheresBtn.textContent = showSpheres ? '🌐 Hide Distance Spheres' : '🌐 Show Distance Spheres';
        drawGPSScene(canvas);
    });
    
    autoLocateBtn.addEventListener('click', () => {
        animateAutoLocate(canvas);
    });
    
    randomizeBtn.addEventListener('click', () => {
        randomizeSatellites(canvas);
    });
    
    resetBtn.addEventListener('click', () => {
        showSpheres = false;
        satelliteSphereStates = [false, false, false, false];
        showSpheresBtn.textContent = '🌐 Show Distance Spheres';
        initializeGPSObjects(canvas);
        drawGPSScene(canvas);
        document.getElementById('position-status').textContent = 'Drag receiver to see distances';
    });
}

function initializeGPSObjects(canvas) {
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.22;
    
    earthCenter = { x: centerX, y: centerY };
    earthRadius = radius;
    
    // Initialize satellites in orbit positions
    satellites = [
        { x: centerX + radius * 2.2, y: centerY - radius * 1.3, color: '#ff0080', dragging: false },
        { x: centerX - radius * 1.8, y: centerY - radius * 1.6, color: '#00ff80', dragging: false },
        { x: centerX + radius * 0.8, y: centerY + radius * 2.3, color: '#ffaa00', dragging: false },
        { x: centerX - radius * 2.1, y: centerY + radius * 1.1, color: '#00ffff', dragging: false }
    ];
    
    // Initialize receiver on Earth's surface
    receiverPos = { 
        x: centerX + radius * 0.4, 
        y: centerY - radius * 0.6,
        dragging: false 
    };
}

function randomizeSatellites(canvas) {
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const minDist = earthRadius * 1.5;
    const maxDist = earthRadius * 2.5;
    
    satellites.forEach(sat => {
        const angle = Math.random() * Math.PI * 2;
        const dist = minDist + Math.random() * (maxDist - minDist);
        sat.x = centerX + Math.cos(angle) * dist;
        sat.y = centerY + Math.sin(angle) * dist;
    });
    
    drawGPSScene(canvas);
}

function resizeGlobeCanvas() {
    const canvas = document.getElementById('globe-canvas');
    if (!canvas) return;
    
    const container = canvas.parentElement;
    const maxWidth = Math.min(900, container.clientWidth - 40);
    canvas.width = maxWidth;
    canvas.height = maxWidth * 0.72;
    
    if (gpsAnimationState === 'idle') {
        initializeGPSObjects(canvas);
        drawGPSScene(canvas);
    }
}

function handleGPSMouseDown(e) {
    const canvas = e.target;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    checkDraggableObjects(x, y, e);
}

function handleGPSTouchStart(e) {
    e.preventDefault();
    const canvas = e.target;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    checkDraggableObjects(x, y, e);
}

let satelliteClickTime = 0;

function checkDraggableObjects(x, y, event) {
    const currentTime = Date.now();
    const isQuickClick = (currentTime - satelliteClickTime) < 250; // 250ms for click vs drag
    
    // Check satellites - differentiate between click (toggle sphere) and drag (move satellite)
    for (let i = 0; i < satellites.length; i++) {
        const sat = satellites[i];
        const dist = Math.sqrt(Math.pow(x - sat.x, 2) + Math.pow(y - sat.y, 2));
        if (dist < 20) {
            // Start dragging - will determine if click or drag on mouseup
            sat.dragging = true;
            sat.clickStartTime = currentTime;
            sat.startX = sat.x;
            sat.startY = sat.y;
            sat.clickStartX = x;
            sat.clickStartY = y;
            draggingObject = sat;
            draggingObject.satIndex = i;
            return;
        }
    }
    
    // Check receiver
    const distReceiver = Math.sqrt(Math.pow(x - receiverPos.x, 2) + Math.pow(y - receiverPos.y, 2));
    if (distReceiver < 15) {
        receiverPos.dragging = true;
        draggingObject = receiverPos;
        return;
    }
    
    // Check if clicking anywhere on Earth to move receiver there
    const distFromCenter = Math.sqrt(Math.pow(x - earthCenter.x, 2) + Math.pow(y - earthCenter.y, 2));
    if (distFromCenter <= earthRadius) {
        receiverPos.dragging = true;
        draggingObject = receiverPos;
        receiverPos.x = x;
        receiverPos.y = y;
    }
}

function handleGPSMouseMove(e) {
    const canvas = e.target;
    if (!draggingObject) {
        // Change cursor on hover
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        let hovering = false;
        for (let sat of satellites) {
            const dist = Math.sqrt(Math.pow(x - sat.x, 2) + Math.pow(y - sat.y, 2));
            if (dist < 20) {
                hovering = true;
                canvas.style.cursor = 'pointer'; // Pointer for clickable satellites
                return;
            }
        }
        const distReceiver = Math.sqrt(Math.pow(x - receiverPos.x, 2) + Math.pow(y - receiverPos.y, 2));
        if (distReceiver < 15) hovering = true;
        
        // Also check if hovering over Earth
        const distFromCenter = Math.sqrt(Math.pow(x - earthCenter.x, 2) + Math.pow(y - earthCenter.y, 2));
        if (distFromCenter <= earthRadius) hovering = true;
        
        canvas.style.cursor = hovering ? 'grab' : 'default';
        return;
    }
    
    canvas.style.cursor = 'grabbing';
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (draggingObject === receiverPos) {
        // Allow receiver to be placed anywhere within Earth
        const dx = x - earthCenter.x;
        const dy = y - earthCenter.y;
        const distFromCenter = Math.sqrt(dx * dx + dy * dy);
        
        // Keep receiver within Earth's bounds
        if (distFromCenter <= earthRadius) {
            receiverPos.x = x;
            receiverPos.y = y;
        } else {
            // Clamp to Earth's surface if dragged outside
            const angle = Math.atan2(dy, dx);
            receiverPos.x = earthCenter.x + Math.cos(angle) * earthRadius;
            receiverPos.y = earthCenter.y + Math.sin(angle) * earthRadius;
        }
    } else {
        draggingObject.x = x;
        draggingObject.y = y;
    }
    
    drawGPSScene(canvas);
}

function handleGPSTouchMove(e) {
    e.preventDefault();
    if (!draggingObject) return;
    
    const canvas = e.target;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    if (draggingObject === receiverPos) {
        // Allow receiver to be placed anywhere within Earth
        const dx = x - earthCenter.x;
        const dy = y - earthCenter.y;
        const distFromCenter = Math.sqrt(dx * dx + dy * dy);
        
        // Keep receiver within Earth's bounds
        if (distFromCenter <= earthRadius) {
            receiverPos.x = x;
            receiverPos.y = y;
        } else {
            // Clamp to Earth's surface if dragged outside
            const angle = Math.atan2(dy, dx);
            receiverPos.x = earthCenter.x + Math.cos(angle) * earthRadius;
            receiverPos.y = earthCenter.y + Math.sin(angle) * earthRadius;
        }
    } else {
        draggingObject.x = x;
        draggingObject.y = y;
    }
    
    drawGPSScene(canvas);
}

function handleGPSMouseUp(e) {
    if (draggingObject && draggingObject.satIndex !== undefined) {
        const sat = draggingObject;
        const i = draggingObject.satIndex;
        
        // Check if this was a click (minimal movement and quick)
        const timeDiff = Date.now() - sat.clickStartTime;
        const moveDist = Math.sqrt(
            Math.pow(sat.x - sat.startX, 2) + 
            Math.pow(sat.y - sat.startY, 2)
        );
        
        // If moved less than 5 pixels and released quickly, treat as click
        if (moveDist < 5 && timeDiff < 300) {
            // Toggle this satellite's sphere visibility
            satelliteSphereStates[i] = !satelliteSphereStates[i];
            
            // Update the show all button state
            const allOn = satelliteSphereStates.every(state => state);
            const allOff = satelliteSphereStates.every(state => !state);
            showSpheres = allOn;
            
            const showSpheresBtn = document.getElementById('show-spheres');
            if (allOn) {
                showSpheresBtn.textContent = '🌐 Hide Distance Spheres';
            } else if (allOff) {
                showSpheresBtn.textContent = '🌐 Show Distance Spheres';
            } else {
                showSpheresBtn.textContent = '🌐 Toggle All Spheres';
            }
            
            const canvas = document.getElementById('globe-canvas');
            drawGPSScene(canvas);
        }
    }
    
    if (draggingObject) {
        draggingObject.dragging = false;
        draggingObject = null;
    }
    const canvas = document.getElementById('globe-canvas');
    if (canvas) canvas.style.cursor = 'default';
}

function drawGPSScene(canvas) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear
    ctx.fillStyle = 'rgba(10, 10, 31, 0.95)';
    ctx.fillRect(0, 0, width, height);
    
    // Draw distance spheres first (behind everything)
    if (showSpheres || satelliteSphereStates.some(state => state)) {
        satellites.forEach((sat, idx) => {
            // Only draw sphere if this satellite's sphere is enabled
            if (!satelliteSphereStates[idx]) return;
            
            const dist = Math.sqrt(
                Math.pow(receiverPos.x - sat.x, 2) + 
                Math.pow(receiverPos.y - sat.y, 2)
            );
            
            ctx.strokeStyle = sat.color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.4;
            ctx.setLineDash([5, 5]);
            
            ctx.beginPath();
            ctx.arc(sat.x, sat.y, dist, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.globalAlpha = 0.08;
            ctx.fillStyle = sat.color;
            ctx.fill();
            
            ctx.globalAlpha = 1;
            ctx.setLineDash([]);
        });
    }
    
    // Draw Earth
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00ffff';
    
    ctx.beginPath();
    ctx.arc(earthCenter.x, earthCenter.y, earthRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Earth fill
    ctx.fillStyle = 'rgba(0, 100, 150, 0.15)';
    ctx.fill();
    
    // Latitude lines
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
        const r = earthRadius * Math.sin((i / 5) * Math.PI);
        const y = earthRadius * Math.cos((i / 5) * Math.PI);
        
        ctx.beginPath();
        ctx.ellipse(earthCenter.x, earthCenter.y - y, r, r * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.ellipse(earthCenter.x, earthCenter.y + y, r, r * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Longitude lines
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI;
        const rx = Math.abs(Math.cos(angle)) * earthRadius;
        
        ctx.beginPath();
        ctx.ellipse(earthCenter.x, earthCenter.y, rx, earthRadius, angle, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Draw signal lines from satellites to receiver
    satellites.forEach((sat, idx) => {
        const dist = Math.sqrt(
            Math.pow(receiverPos.x - sat.x, 2) + 
            Math.pow(receiverPos.y - sat.y, 2)
        );
        
        ctx.strokeStyle = sat.color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.4;
        ctx.setLineDash([3, 3]);
        
        ctx.beginPath();
        ctx.moveTo(sat.x, sat.y);
        ctx.lineTo(receiverPos.x, receiverPos.y);
        ctx.stroke();
        
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
    });
    
    // Draw satellites
    satellites.forEach((sat, idx) => {
        ctx.fillStyle = sat.color;
        ctx.strokeStyle = sat.color;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = sat.color;
        
        // Add ring around satellite if its sphere is visible
        if (satelliteSphereStates[idx]) {
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(sat.x, sat.y, 16, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
        
        // Satellite body
        ctx.beginPath();
        ctx.arc(sat.x, sat.y, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        // Solar panels
        ctx.fillRect(sat.x - 20, sat.y - 4, 12, 8);
        ctx.fillRect(sat.x + 8, sat.y - 4, 12, 8);
        
        // Label
        ctx.font = 'bold 11px JetBrains Mono';
        ctx.fillStyle = sat.color;
        ctx.textAlign = 'center';
        ctx.fillText(`SAT-${idx + 1}`, sat.x, sat.y - 20);
    });
    
    // Draw receiver on Earth
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ffffff';
    
    ctx.beginPath();
    ctx.arc(receiverPos.x, receiverPos.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Pulsing ring
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(receiverPos.x, receiverPos.y, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    
    // Receiver icon
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📍', receiverPos.x, receiverPos.y - 25);
    
    // Update distance readouts
    updateDistanceReadouts();
}

function updateDistanceReadouts() {
    satellites.forEach((sat, idx) => {
        const dist = Math.sqrt(
            Math.pow(receiverPos.x - sat.x, 2) + 
            Math.pow(receiverPos.y - sat.y, 2)
        );
        
        const distKm = (dist / 2).toFixed(1); // Scale for visualization
        const readout = document.querySelector(`.sat-readout[data-sat="${idx}"] .sat-distance`);
        if (readout) {
            readout.textContent = `${distKm} km`;
        }
    });
    
    document.getElementById('position-status').textContent = 'Position calculated from satellite distances';
}

function animateAutoLocate(canvas) {
    gpsAnimationState = 'animating';
    document.getElementById('position-status').textContent = 'Calculating position...';
    
    let step = 0;
    const maxSteps = 60;
    
    // Random target position on Earth
    const targetAngle = Math.random() * Math.PI * 2;
    const targetPos = {
        x: earthCenter.x + Math.cos(targetAngle) * earthRadius,
        y: earthCenter.y + Math.sin(targetAngle) * earthRadius
    };
    
    const startPos = { x: receiverPos.x, y: receiverPos.y };
    
    function animate() {
        step++;
        const progress = step / maxSteps;
        const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
        
        receiverPos.x = startPos.x + (targetPos.x - startPos.x) * easeProgress;
        receiverPos.y = startPos.y + (targetPos.y - startPos.y) * easeProgress;
        
        drawGPSScene(canvas);
        
        if (step < maxSteps) {
            requestAnimationFrame(animate);
        } else {
            gpsAnimationState = 'idle';
            document.getElementById('position-status').textContent = 'Position locked! 🎯';
        }
    }
    
    animate();
}


// ============================================
// Noise Cancellation Visualization
// ============================================

let noiseAnimationFrame = null;
let noiseAnimating = false;
let noisePhase = 0;
let phaseShift = Math.PI; // Default 180 degrees

function initNoiseVisualization() {
    const playBtn = document.getElementById('play-noise');
    const stopBtn = document.getElementById('stop-noise');
    const resetBtn = document.getElementById('reset-phase');
    const phaseSlider = document.getElementById('phase-shift');
    const phaseValue = document.getElementById('phase-value');
    
    const originalCanvas = document.getElementById('noise-original');
    const invertedCanvas = document.getElementById('noise-inverted');
    const resultCanvas = document.getElementById('noise-result');
    
    // Resize canvases for mobile
    resizeNoiseCanvases();
    window.addEventListener('resize', resizeNoiseCanvases);
    
    // Initial static draw
    drawNoiseWave(originalCanvas, 0, false, 0);
    drawNoiseWave(invertedCanvas, 0, true, phaseShift);
    drawResultWave(resultCanvas, 0, phaseShift);
    
    // Phase shift slider
    phaseSlider.addEventListener('input', (e) => {
        const degrees = parseInt(e.target.value);
        phaseShift = (degrees * Math.PI) / 180;
        phaseValue.textContent = degrees + '°';
        
        // Redraw all waves
        if (!noiseAnimating) {
            drawNoiseWave(originalCanvas, noisePhase, false, 0);
            drawNoiseWave(invertedCanvas, noisePhase, true, phaseShift);
            drawResultWave(resultCanvas, noisePhase, phaseShift);
        }
        
        updateCancellationLevel(degrees);
    });
    
    playBtn.addEventListener('click', () => {
        noiseAnimating = true;
        playBtn.disabled = true;
        stopBtn.disabled = false;
        animateNoiseWaves();
    });
    
    stopBtn.addEventListener('click', () => {
        noiseAnimating = false;
        playBtn.disabled = false;
        stopBtn.disabled = true;
        if (noiseAnimationFrame) {
            cancelAnimationFrame(noiseAnimationFrame);
        }
    });
    
    resetBtn.addEventListener('click', () => {
        phaseSlider.value = 180;
        phaseShift = Math.PI;
        phaseValue.textContent = '180°';
        updateCancellationLevel(180);
        
        if (!noiseAnimating) {
            drawNoiseWave(originalCanvas, noisePhase, false, 0);
            drawNoiseWave(invertedCanvas, noisePhase, true, phaseShift);
            drawResultWave(resultCanvas, noisePhase, phaseShift);
        }
    });
    
    // Initial cancellation level
    updateCancellationLevel(180);
}

function updateCancellationLevel(degrees) {
    const cancellationSpan = document.getElementById('cancellation-level');
    
    // Calculate cancellation percentage
    // Perfect cancellation at 180°, worst at 0° and 360°
    const normalizedDegrees = degrees % 360;
    // Use cos for the deviation from 180°
    const deviationFrom180 = Math.abs(normalizedDegrees - 180);
    const actualCancellation = 100 - (deviationFrom180 / 180) * 100;
    
    if (actualCancellation > 95) {
        cancellationSpan.textContent = `Perfect Cancellation: ${actualCancellation.toFixed(1)}%`;
        cancellationSpan.style.color = '#00ffff';
    } else if (actualCancellation > 50) {
        cancellationSpan.textContent = `Partial Cancellation: ${actualCancellation.toFixed(1)}%`;
        cancellationSpan.style.color = '#ffaa00';
    } else {
        cancellationSpan.textContent = `Poor Cancellation: ${actualCancellation.toFixed(1)}%`;
        cancellationSpan.style.color = '#ff0080';
    }
}

function resizeNoiseCanvases() {
    const canvases = ['noise-original', 'noise-inverted', 'noise-result'];
    canvases.forEach(id => {
        const canvas = document.getElementById(id);
        if (!canvas) return;
        
        const container = canvas.parentElement;
        const maxWidth = Math.min(800, container.clientWidth - 40);
        canvas.width = maxWidth;
        canvas.height = 180;
    });
    
    if (!noiseAnimating) {
        drawNoiseWave(document.getElementById('noise-original'), noisePhase, false, 0);
        drawNoiseWave(document.getElementById('noise-inverted'), noisePhase, true, phaseShift);
        drawResultWave(document.getElementById('noise-result'), noisePhase, phaseShift);
    }
}

function drawNoiseWave(canvas, phase, inverted = false, customPhaseShift = 0) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear with dark background
    ctx.fillStyle = 'rgba(10, 10, 31, 0.95)';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
        const y = (height / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    
    // Vertical grid lines
    for (let i = 0; i <= 8; i++) {
        const x = (width / 8) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    
    // Draw center line (zero axis)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    
    // Draw the wave
    ctx.strokeStyle = inverted ? '#9d00ff' : '#00b8ff';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = inverted ? '#9d00ff' : '#00b8ff';
    ctx.beginPath();
    
    const amplitude = height * 0.35;
    const frequency = 4; // Number of complete waves to show
    
    for (let x = 0; x < width; x++) {
        const t = (x / width) * Math.PI * frequency + phase;
        
        // Complex wave combining multiple frequencies (realistic noise)
        let y = Math.sin(t * 2) * 0.5;
        y += Math.sin(t * 3.5) * 0.25;
        y += Math.sin(t * 5) * 0.15;
        y += Math.sin(t * 7.5) * 0.1;
        
        // Apply phase shift for anti-noise wave
        const effectivePhase = inverted ? customPhaseShift : 0;
        y = Math.sin(t * 2 + effectivePhase) * 0.5 +
            Math.sin(t * 3.5 + effectivePhase) * 0.25 +
            Math.sin(t * 5 + effectivePhase) * 0.15 +
            Math.sin(t * 7.5 + effectivePhase) * 0.1;
        
        const py = height / 2 - y * amplitude;
        
        if (x === 0) {
            ctx.moveTo(x, py);
        } else {
            ctx.lineTo(x, py);
        }
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Add labels
    ctx.fillStyle = inverted ? '#9d00ff' : '#00b8ff';
    ctx.font = 'bold 12px JetBrains Mono';
    ctx.fillText(inverted ? 'Anti-Noise' : 'Original', 10, 20);
}

function drawResultWave(canvas, phase, currentPhaseShift) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear with dark background
    ctx.fillStyle = 'rgba(10, 10, 31, 0.95)';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
        const y = (height / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    
    // Vertical grid lines
    for (let i = 0; i <= 8; i++) {
        const x = (width / 8) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    
    // Draw center line (zero axis)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    
    // Draw both original waves faintly for reference
    const amplitude = height * 0.35;
    const frequency = 4;
    
    // Draw original wave faintly
    ctx.strokeStyle = 'rgba(0, 184, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < width; x++) {
        const t = (x / width) * Math.PI * frequency + phase;
        let y = Math.sin(t * 2) * 0.5 +
                Math.sin(t * 3.5) * 0.25 +
                Math.sin(t * 5) * 0.15 +
                Math.sin(t * 7.5) * 0.1;
        const py = height / 2 - y * amplitude;
        if (x === 0) ctx.moveTo(x, py);
        else ctx.lineTo(x, py);
    }
    ctx.stroke();
    
    // Draw anti-noise wave faintly
    ctx.strokeStyle = 'rgba(157, 0, 255, 0.2)';
    ctx.beginPath();
    for (let x = 0; x < width; x++) {
        const t = (x / width) * Math.PI * frequency + phase;
        let y = Math.sin(t * 2 + currentPhaseShift) * 0.5 +
                Math.sin(t * 3.5 + currentPhaseShift) * 0.25 +
                Math.sin(t * 5 + currentPhaseShift) * 0.15 +
                Math.sin(t * 7.5 + currentPhaseShift) * 0.1;
        const py = height / 2 - y * amplitude;
        if (x === 0) ctx.moveTo(x, py);
        else ctx.lineTo(x, py);
    }
    ctx.stroke();
    
    // Draw resultant wave (superposition)
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00ffff';
    ctx.beginPath();
    
    for (let x = 0; x < width; x++) {
        const t = (x / width) * Math.PI * frequency + phase;
        
        // Original wave
        let y1 = Math.sin(t * 2) * 0.5 +
                 Math.sin(t * 3.5) * 0.25 +
                 Math.sin(t * 5) * 0.15 +
                 Math.sin(t * 7.5) * 0.1;
        
        // Anti-noise wave with phase shift
        let y2 = Math.sin(t * 2 + currentPhaseShift) * 0.5 +
                 Math.sin(t * 3.5 + currentPhaseShift) * 0.25 +
                 Math.sin(t * 5 + currentPhaseShift) * 0.15 +
                 Math.sin(t * 7.5 + currentPhaseShift) * 0.1;
        
        // Superposition
        const ySum = y1 + y2;
        const py = height / 2 - ySum * amplitude;
        
        if (x === 0) {
            ctx.moveTo(x, py);
        } else {
            ctx.lineTo(x, py);
        }
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Add label
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 12px JetBrains Mono';
    ctx.fillText('Resultant', 10, 20);
    
    // Show "SILENCE" text if near perfect cancellation
    const degrees = (currentPhaseShift * 180) / Math.PI;
    const normalizedDegrees = degrees % 360;
    const deviationFrom180 = Math.abs(normalizedDegrees - 180);
    const actualCancellation = 100 - (deviationFrom180 / 180) * 100;
    
    if (actualCancellation > 95) {
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 24px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ffff';
        ctx.fillText('✨ SILENCE ✨', width / 2, height / 2);
        ctx.shadowBlur = 0;
        ctx.textAlign = 'left';
    }
}

function animateNoiseWaves() {
    if (!noiseAnimating) return;
    
    const originalCanvas = document.getElementById('noise-original');
    const invertedCanvas = document.getElementById('noise-inverted');
    const resultCanvas = document.getElementById('noise-result');
    
    drawNoiseWave(originalCanvas, noisePhase, false, 0);
    drawNoiseWave(invertedCanvas, noisePhase, true, phaseShift);
    drawResultWave(resultCanvas, noisePhase, phaseShift);
    
    noisePhase += 0.03;
    
    noiseAnimationFrame = requestAnimationFrame(animateNoiseWaves);
}


// ============================================
// Initialize Everything
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize card interactions
    initializeCardInteractions();
    
    // Close button handlers
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', closeDeepDive);
    });
    
    // Handle escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && currentTopic) {
            closeDeepDive();
        }
    });
    
    // Prevent scrolling on main page
    const gridContainer = document.querySelector('.grid-container');
    if (gridContainer) {
        document.body.style.overflow = 'hidden';
    }
});

// Handle window resize for all canvases with debouncing
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (currentTopic === 'trig') {
            resizeTaylorCanvas();
        } else if (currentTopic === 'gps') {
            resizeGlobeCanvas();
        } else if (currentTopic === 'noise') {
            resizeNoiseCanvases();
        }
    }, 150); // Debounce resize events
}, { passive: true });

// Add orientation change handler for mobile
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        if (currentTopic === 'trig') {
            resizeTaylorCanvas();
        } else if (currentTopic === 'gps') {
            resizeGlobeCanvas();
        } else if (currentTopic === 'noise') {
            resizeNoiseCanvases();
        }
    }, 200); // Delay to allow viewport adjustment
}, { passive: true });
