// ============================================
// Global State & Utilities
// ============================================

let currentTopic = null;

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
    // Generate initial QR codes using the library
    const qrCanvas = document.getElementById('qr-canvas');
    const qrDamaged = document.getElementById('qr-damaged');
    const qrCorrected = document.getElementById('qr-corrected');
    
    // Generate QR code directly on canvas
    generateRealQRCode(qrCanvas, 'https://aarshj.me');
    
    // Create initial QR for damaged/corrected workflow
    setTimeout(() => {
        // Extract matrix from the generated QR
        qrMatrix = QRCodeGenerator.canvasToMatrix(qrCanvas);
        QRCodeGenerator.drawQR(qrDamaged, qrMatrix);
        QRCodeGenerator.drawQR(qrCorrected, qrMatrix);
    }, 100);
    
    // Damage button
    const damageBtn = document.getElementById('damage-btn');
    damageBtn.addEventListener('click', damageAndCorrectQR);
}

function generateRealQRCode(canvas, text) {
    // Clear canvas
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Create temp container for QR generation
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);
    
    const qr = new QRCode(tempDiv, {
        text: text,
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
    
    // Wait for QR generation
    setTimeout(() => {
        const qrCanvas = tempDiv.querySelector('canvas');
        if (qrCanvas) {
            ctx.drawImage(qrCanvas, 0, 0, 200, 200);
        }
        document.body.removeChild(tempDiv);
    }, 50);
}

function damageAndCorrectQR() {
    // Reset state
    const qrCorrectedContainer = document.getElementById('qr-corrected-container');
    qrCorrectedContainer.style.opacity = '0';
    qrCorrectedContainer.style.visibility = 'hidden';
    
    // Generate damaged cells
    damagedCells = [];
    const size = qrMatrix.length;
    const damageCount = Math.floor(size * size * 0.15);
    
    for (let i = 0; i < damageCount; i++) {
        const row = Math.floor(Math.random() * size);
        const col = Math.floor(Math.random() * size);
        damagedCells.push([row, col]);
    }
    
    // Draw damaged QR
    const qrDamaged = document.getElementById('qr-damaged');
    const damagedData = qrMatrix.map((row, i) => 
        row.map((cell, j) => {
            if (damagedCells.some(([r, c]) => r === i && c === j)) {
                return 1 - cell;
            }
            return cell;
        })
    );
    
    QRCodeGenerator.drawDamagedQR(qrDamaged, damagedData, damagedCells);
    
    // Animate correction process
    const steps = document.querySelectorAll('.process-step');
    const progressBars = document.querySelectorAll('.progress-bar');
    
    steps.forEach(step => {
        step.classList.remove('active');
    });
    progressBars.forEach(bar => {
        bar.classList.remove('filling');
        bar.style.width = '0';
    });
    
    // Step 1: Detecting errors
    setTimeout(() => {
        steps[0].classList.add('active');
        setTimeout(() => progressBars[0].classList.add('filling'), 100);
    }, 200);
    
    // Step 2: Reed-Solomon calculation
    setTimeout(() => {
        steps[1].classList.add('active');
        setTimeout(() => progressBars[1].classList.add('filling'), 100);
    }, 1200);
    
    // Step 3: Reconstructing data with progressive correction
    setTimeout(() => {
        steps[2].classList.add('active');
        setTimeout(() => progressBars[2].classList.add('filling'), 100);
        
        // Progressive correction animation
        const qrCorrected = document.getElementById('qr-corrected');
        let correctedCount = 0;
        const totalDamaged = damagedCells.length;
        
        const correctionInterval = setInterval(() => {
            correctedCount++;
            const percentCorrected = correctedCount / totalDamaged;
            
            // Draw partially corrected QR
            const partiallyCorrected = damagedData.map((row, i) => 
                row.map((cell, j) => {
                    const damageIndex = damagedCells.findIndex(([r, c]) => r === i && c === j);
                    if (damageIndex !== -1 && damageIndex < correctedCount) {
                        // This cell has been corrected
                        return qrMatrix[i][j];
                    }
                    return cell;
                })
            );
            
            // Find remaining damaged cells
            const remainingDamaged = damagedCells.slice(correctedCount);
            QRCodeGenerator.drawDamagedQR(qrDamaged, partiallyCorrected, remainingDamaged);
            
            if (correctedCount >= totalDamaged) {
                clearInterval(correctionInterval);
                // Show final corrected QR - generate a fresh scannable QR code
                setTimeout(() => {
                    generateRealQRCode(qrCorrected, 'https://aarshj.me');
                    setTimeout(() => {
                        qrCorrectedContainer.style.transition = 'all 0.5s ease';
                        qrCorrectedContainer.style.opacity = '1';
                        qrCorrectedContainer.style.visibility = 'visible';
                    }, 100);
                }, 200);
            }
        }, 50);
    }, 2200);
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

function initGPSVisualization() {
    const canvas = document.getElementById('globe-canvas');
    const startBtn = document.getElementById('start-trilateration');
    const resetBtn = document.getElementById('reset-trilateration');
    
    // Resize canvas for mobile
    resizeGlobeCanvas();
    window.addEventListener('resize', resizeGlobeCanvas);
    
    drawGlobe(canvas);
    
    startBtn.addEventListener('click', startTrilateration);
    resetBtn.addEventListener('click', () => {
        gpsAnimationState = 'idle';
        if (gpsAnimationFrame) {
            cancelAnimationFrame(gpsAnimationFrame);
        }
        drawGlobe(canvas);
        document.getElementById('gps-status').textContent = 'Click "Start Trilateration" to begin';
    });
}

function resizeGlobeCanvas() {
    const canvas = document.getElementById('globe-canvas');
    if (!canvas) return;
    
    const container = canvas.parentElement;
    const maxWidth = Math.min(800, container.clientWidth - 40);
    canvas.width = maxWidth;
    canvas.height = maxWidth * 0.75;
    
    if (gpsAnimationState === 'idle') {
        drawGlobe(canvas);
    }
}

function drawGlobe(canvas, satellites = null, spheres = null, targetPoint = null) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.25;
    
    // Clear
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, width, height);
    
    // Draw Earth
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    
    // Main circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Latitude lines
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
        const r = radius * Math.sin((i / 5) * Math.PI);
        const y = radius * Math.cos((i / 5) * Math.PI);
        
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - y, r, r * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + y, r, r * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Longitude lines
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI;
        const rx = Math.abs(Math.cos(angle)) * radius;
        
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, rx, radius, angle, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Draw satellites
    const defaultSatellites = [
        { x: centerX + radius * 1.8, y: centerY - radius * 1.2, color: '#ff0080' },
        { x: centerX - radius * 1.5, y: centerY - radius * 1.5, color: '#00ff80' },
        { x: centerX + radius * 0.5, y: centerY + radius * 2, color: '#ffff00' },
        { x: centerX - radius * 1.8, y: centerY + radius * 0.8, color: '#00ffff' }
    ];
    
    const sats = satellites || defaultSatellites;
    sats.forEach((sat, idx) => {
        ctx.fillStyle = sat.color;
        ctx.strokeStyle = sat.color;
        ctx.lineWidth = 2;
        
        // Satellite icon
        ctx.beginPath();
        ctx.arc(sat.x, sat.y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Solar panels
        ctx.fillRect(sat.x - 15, sat.y - 3, 10, 6);
        ctx.fillRect(sat.x + 5, sat.y - 3, 10, 6);
        
        // Label
        ctx.font = '12px JetBrains Mono';
        ctx.fillText(`S${idx + 1}`, sat.x - 10, sat.y - 15);
    });
    
    // Draw spheres
    if (spheres) {
        spheres.forEach((sphere, idx) => {
            if (sphere.radius > 0) {
                ctx.strokeStyle = sphere.color;
                ctx.lineWidth = 2;
                ctx.globalAlpha = 0.3;
                
                ctx.beginPath();
                ctx.arc(sphere.x, sphere.y, sphere.radius, 0, Math.PI * 2);
                ctx.stroke();
                
                ctx.globalAlpha = 0.05;
                ctx.fillStyle = sphere.color;
                ctx.fill();
                
                ctx.globalAlpha = 1;
            }
        });
    }
    
    // Draw target point
    if (targetPoint) {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        ctx.arc(targetPoint.x, targetPoint.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Pulsing effect
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(targetPoint.x, targetPoint.y, 15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
}

function startTrilateration() {
    const canvas = document.getElementById('globe-canvas');
    const statusText = document.getElementById('gps-status');
    
    gpsAnimationState = 'animating';
    
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.25;
    
    const satellites = [
        { x: centerX + radius * 1.8, y: centerY - radius * 1.2, color: '#ff0080' },
        { x: centerX - radius * 1.5, y: centerY - radius * 1.5, color: '#00ff80' },
        { x: centerX + radius * 0.5, y: centerY + radius * 2, color: '#ffff00' },
        { x: centerX - radius * 1.8, y: centerY + radius * 0.8, color: '#00ffff' }
    ];
    
    const targetPoint = { x: centerX + radius * 0.3, y: centerY - radius * 0.5 };
    
    let currentSatellite = 0;
    let sphereRadius = 0;
    const spheres = [
        { x: satellites[0].x, y: satellites[0].y, radius: 0, color: satellites[0].color },
        { x: satellites[1].x, y: satellites[1].y, radius: 0, color: satellites[1].color },
        { x: satellites[2].x, y: satellites[2].y, radius: 0, color: satellites[2].color },
        { x: satellites[3].x, y: satellites[3].y, radius: 0, color: satellites[3].color }
    ];
    
    function animate() {
        if (currentSatellite < 4) {
            const sat = satellites[currentSatellite];
            const targetDist = Math.sqrt(
                Math.pow(targetPoint.x - sat.x, 2) + 
                Math.pow(targetPoint.y - sat.y, 2)
            );
            
            sphereRadius += 5;
            spheres[currentSatellite].radius = sphereRadius;
            
            drawGlobe(canvas, satellites, spheres, null);
            
            if (sphereRadius >= targetDist) {
                sphereRadius = 0;
                currentSatellite++;
                
                const messages = [
                    'Satellite 1: Creating sphere of possible locations...',
                    'Satellite 2: Narrowing down to a circle...',
                    'Satellite 3: Reducing to two possible points...',
                    'Satellite 4: Locked on! Exact position determined.'
                ];
                statusText.textContent = messages[currentSatellite - 1] || messages[3];
            }
            
            gpsAnimationFrame = requestAnimationFrame(animate);
        } else {
            // Show final target
            drawGlobe(canvas, satellites, spheres, targetPoint);
            statusText.textContent = 'Trilateration complete! Position locked.';
            gpsAnimationState = 'complete';
        }
    }
    
    statusText.textContent = 'Satellite 1: Emitting signal pulse...';
    animate();
}

// ============================================
// Noise Cancellation Visualization
// ============================================

let noiseAnimationFrame = null;
let noiseAnimating = false;
let noisePhase = 0;

function initNoiseVisualization() {
    const playBtn = document.getElementById('play-noise');
    const stopBtn = document.getElementById('stop-noise');
    
    const originalCanvas = document.getElementById('noise-original');
    const invertedCanvas = document.getElementById('noise-inverted');
    const resultCanvas = document.getElementById('noise-result');
    
    // Resize canvases for mobile
    resizeNoiseCanvases();
    window.addEventListener('resize', resizeNoiseCanvases);
    
    // Initial static draw
    drawNoiseWave(originalCanvas, 0, false);
    drawNoiseWave(invertedCanvas, 0, true);
    drawResultWave(resultCanvas, 0);
    
    playBtn.addEventListener('click', () => {
        noiseAnimating = true;
        animateNoiseWaves();
    });
    
    stopBtn.addEventListener('click', () => {
        noiseAnimating = false;
        if (noiseAnimationFrame) {
            cancelAnimationFrame(noiseAnimationFrame);
        }
    });
}

function resizeNoiseCanvases() {
    const canvases = ['noise-original', 'noise-inverted', 'noise-result'];
    canvases.forEach(id => {
        const canvas = document.getElementById(id);
        if (!canvas) return;
        
        const container = canvas.parentElement;
        const maxWidth = Math.min(600, container.clientWidth - 40);
        canvas.width = maxWidth;
        canvas.height = 120;
    });
    
    if (!noiseAnimating) {
        drawNoiseWave(document.getElementById('noise-original'), 0, false);
        drawNoiseWave(document.getElementById('noise-inverted'), 0, true);
        drawResultWave(document.getElementById('noise-result'), 0);
    }
}

function drawNoiseWave(canvas, phase, inverted = false) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, width, height);
    
    // Draw center line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    
    // Draw complex noise wave
    ctx.strokeStyle = inverted ? '#9d00ff' : '#ff0080';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let x = 0; x < width; x++) {
        const t = (x / width) * Math.PI * 4 + phase;
        
        // Complex wave combining multiple frequencies
        let y = Math.sin(t * 2) * 0.3;
        y += Math.sin(t * 3.5) * 0.15;
        y += Math.sin(t * 5) * 0.1;
        y += Math.sin(t * 7.5) * 0.05;
        
        if (inverted) {
            y = -y;
        }
        
        const py = height / 2 - y * height * 0.4;
        
        if (x === 0) {
            ctx.moveTo(x, py);
        } else {
            ctx.lineTo(x, py);
        }
    }
    ctx.stroke();
}

function drawResultWave(canvas, phase) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, width, height);
    
    // Draw center line (silence)
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Draw "Silence" text
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 20px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText('SILENCE', width / 2, height / 2 - 20);
}

function animateNoiseWaves() {
    if (!noiseAnimating) return;
    
    const originalCanvas = document.getElementById('noise-original');
    const invertedCanvas = document.getElementById('noise-inverted');
    const resultCanvas = document.getElementById('noise-result');
    
    drawNoiseWave(originalCanvas, noisePhase, false);
    drawNoiseWave(invertedCanvas, noisePhase, true);
    drawResultWave(resultCanvas, noisePhase);
    
    noisePhase += 0.05;
    
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

// Handle window resize for all canvases
window.addEventListener('resize', () => {
    if (currentTopic === 'trig') {
        resizeTaylorCanvas();
    } else if (currentTopic === 'gps') {
        resizeGlobeCanvas();
    } else if (currentTopic === 'noise') {
        resizeNoiseCanvases();
    }
});
