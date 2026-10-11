/**
 * Brain Map Visualization for OptoGrid Dashboard
 * Renders the brain map with LED positions and handles LED selection
 */
class BrainMapVisualization {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.ledPositions = [];
        this.ledSelectionValue = 0n; // Use BigInt for uint64_t compatibility
        this.ledCheckMask = (1n << 64n) - 1n; // All intact by default (using BigInt for 64-bit)
        
        // LED dimensions
        this.ledWidth = 12;
        this.ledHeight = 23
        
        // Stereotaxic alignment of the LED grid, anchored on LED 2 (bit 1).
        // The default pixel map places LED 2 at ML -1.75 mm, AP 3.1 mm; LED pitch
        // in the map (40 px per 1.0667 mm AP) gives the brain map scale.
        this.pxPerMm = 37.5;
        this.defaultLed2Position = { ml: -1.75, ap: 3.1 };
        this.led2Position = { ...this.defaultLed2Position };
        
        // Drag selection state
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.dragEnd = { x: 0, y: 0 };
        
        this.setupCanvas();
        this.calculateLedPositions();
        this.setupEventListeners();
        this.loadBrainMapImage('brainmap.png');
        this.draw();
    }
    
    setupCanvas() {
        // Set up high DPI canvas
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = 358 * dpr;
        this.canvas.height = 300 * dpr;
        
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = 358 + 'px';
        this.canvas.style.height = 300 + 'px';
        
        this.canvasWidth = 358;
        this.canvasHeight = 300;
    }
    
    calculateLedPositions() {
        // LED positioning parameters - scale based on canvas size
        const scaleX = this.canvasWidth / 358;
        const scaleY = this.canvasHeight / 300;
        
        const xSpace = Math.floor(14 * scaleX);
        const ySpace = Math.floor(40 * scaleY);
        const centerX = Math.floor(172 * scaleX);
        const centerY = Math.floor(10 * scaleY)-1;
        
        // LED pixel coordinates mapping (based on the Qt version)
        const ledPixelMap = {
            // Row 1 (bits 0-7)
            0: [centerX - 11*xSpace + Math.floor(14*scaleX)+4, centerY + 5*ySpace],
            1: [centerX - 5*xSpace + Math.floor(2*scaleX)+3, centerY],
            2: [centerX - 3*xSpace + Math.floor(1*scaleX)+2, centerY],
            3: [centerX - 1*xSpace+1, centerY],
            4: [centerX + 1*xSpace, centerY],
            5: [centerX + 3*xSpace - Math.floor(1*scaleX)-1, centerY],
            6: [centerX + 5*xSpace - Math.floor(2*scaleX)-2, centerY],
            7: [centerX + 11*xSpace - Math.floor(14*scaleX)-3, centerY + 5*ySpace],

            // Row 2 (bits 8-15)
            8: [centerX - 7*xSpace + Math.floor(5*scaleX)+4, centerY + 1*ySpace],
            9: [centerX - 5*xSpace + Math.floor(2*scaleX)+3, centerY + 1*ySpace],
            10: [centerX - 3*xSpace + Math.floor(1*scaleX)+2, centerY + 1*ySpace],
            11: [centerX - 1*xSpace+1, centerY + 1*ySpace],
            12: [centerX + 1*xSpace, centerY + 1*ySpace],
            13: [centerX + 3*xSpace - Math.floor(1*scaleX)-1, centerY + 1*ySpace],
            14: [centerX + 5*xSpace - Math.floor(2*scaleX)-2, centerY + 1*ySpace],
            15: [centerX + 7*xSpace - Math.floor(5*scaleX)-3, centerY + 1*ySpace],

            // Row 3 (bits 16-23)
            16: [centerX - 7*xSpace + Math.floor(5*scaleX)+4, centerY + 2*ySpace],
            17: [centerX - 5*xSpace + Math.floor(2*scaleX)+3, centerY + 2*ySpace],
            18: [centerX - 3*xSpace + Math.floor(1*scaleX)+2, centerY + 2*ySpace],
            19: [centerX - 1*xSpace+1, centerY + 2*ySpace],
            20: [centerX + 1*xSpace, centerY + 2*ySpace],
            21: [centerX + 3*xSpace - Math.floor(1*scaleX)-1, centerY + 2*ySpace],
            22: [centerX + 5*xSpace - Math.floor(2*scaleX)-2, centerY + 2*ySpace],
            23: [centerX + 7*xSpace - Math.floor(5*scaleX)-3, centerY + 2*ySpace],

            // Row 4 (bits 24-31)
            24: [centerX - 7*xSpace + Math.floor(5*scaleX)+4, centerY + 3*ySpace],
            25: [centerX - 5*xSpace + Math.floor(2*scaleX)+3, centerY + 3*ySpace],
            26: [centerX - 3*xSpace + Math.floor(1*scaleX)+2, centerY + 3*ySpace],
            27: [centerX - 1*xSpace+1, centerY + 3*ySpace],
            28: [centerX + 1*xSpace, centerY + 3*ySpace],
            29: [centerX + 3*xSpace - Math.floor(1*scaleX)-1, centerY + 3*ySpace],
            30: [centerX + 5*xSpace - Math.floor(2*scaleX)-2, centerY + 3*ySpace],
            31: [centerX + 7*xSpace - Math.floor(5*scaleX)-3, centerY + 3*ySpace],

            // Row 5 (bits 32-39)
            32: [centerX - 7*xSpace + Math.floor(5*scaleX)+4, centerY + 4*ySpace],
            33: [centerX - 5*xSpace + Math.floor(2*scaleX)+3, centerY + 4*ySpace],
            34: [centerX - 3*xSpace + Math.floor(1*scaleX)+2, centerY + 4*ySpace],
            35: [centerX - 1*xSpace+1, centerY + 4*ySpace],
            36: [centerX + 1*xSpace, centerY + 4*ySpace],
            37: [centerX + 3*xSpace - Math.floor(1*scaleX)-1, centerY + 4*ySpace],
            38: [centerX + 5*xSpace - Math.floor(2*scaleX)-2, centerY + 4*ySpace],
            39: [centerX + 7*xSpace - Math.floor(5*scaleX)-3, centerY + 4*ySpace],

            // Row 6 (bits 40-47)
            40: [centerX - 7*xSpace + Math.floor(5*scaleX)+4, centerY + 5*ySpace],
            41: [centerX - 5*xSpace + Math.floor(2*scaleX)+3, centerY + 5*ySpace],
            42: [centerX - 3*xSpace + Math.floor(1*scaleX)+2, centerY + 5*ySpace],
            43: [centerX - 1*xSpace+1, centerY + 5*ySpace],
            44: [centerX + 1*xSpace, centerY + 5*ySpace],
            45: [centerX + 3*xSpace - Math.floor(1*scaleX)-1, centerY + 5*ySpace],
            46: [centerX + 5*xSpace - Math.floor(2*scaleX)-2, centerY + 5*ySpace],
            47: [centerX + 7*xSpace - Math.floor(5*scaleX)-3, centerY + 5*ySpace],

            // Row 7 (bits 48-55)
            48: [centerX - 7*xSpace + Math.floor(5*scaleX)+4, centerY + 6*ySpace],
            49: [centerX - 5*xSpace + Math.floor(2*scaleX)+3, centerY + 6*ySpace],
            50: [centerX - 3*xSpace + Math.floor(1*scaleX)+2, centerY + 6*ySpace],
            51: [centerX - 1*xSpace+1, centerY + 6*ySpace],
            52: [centerX + 1*xSpace, centerY + 6*ySpace],
            53: [centerX + 3*xSpace - Math.floor(1*scaleX)-1, centerY + 6*ySpace],
            54: [centerX + 5*xSpace - Math.floor(2*scaleX)-2, centerY + 6*ySpace],
            55: [centerX + 7*xSpace - Math.floor(5*scaleX)-3, centerY + 6*ySpace],

            // Row 8 (bits 56-63)
            56: [centerX - 9*xSpace + Math.floor(8*scaleX)+4, centerY + 6*ySpace],
            57: [centerX - 9*xSpace + Math.floor(8*scaleX)+4, centerY + 5*ySpace],
            58: [centerX - 9*xSpace + Math.floor(8*scaleX)+4, centerY + 4*ySpace],
            59: [centerX - 9*xSpace + Math.floor(8*scaleX)+4, centerY + 3*ySpace],
            60: [centerX + 9*xSpace - Math.floor(8*scaleX)-3, centerY + 3*ySpace],
            61: [centerX + 9*xSpace - Math.floor(8*scaleX)-3, centerY + 4*ySpace],
            62: [centerX + 9*xSpace - Math.floor(8*scaleX)-3, centerY + 5*ySpace],
            63: [centerX + 9*xSpace - Math.floor(8*scaleX)-3, centerY + 6*ySpace],
        };

        // Shift the whole grid so LED 2 sits at the requested stereotaxic position
        // (ML increases to the right, AP increases upwards).
        const offsetX = (this.led2Position.ml - this.defaultLed2Position.ml) * this.pxPerMm;
        const offsetY = -(this.led2Position.ap - this.defaultLed2Position.ap) * this.pxPerMm;
        
        // Create LED position objects
        this.ledPositions = [];
        for (let bitPosition = 0; bitPosition < 64; bitPosition++) {
            if (bitPosition in ledPixelMap) {
                const x = ledPixelMap[bitPosition][0] + offsetX;
                const y = ledPixelMap[bitPosition][1] + offsetY;
                const ledPos = {
                    x: x,
                    y: y,
                    bit: bitPosition,
                    coords: [x, y, x + this.ledWidth, y + this.ledHeight],
                    gridX: (bitPosition % 8) + 1,
                    gridY: Math.floor(bitPosition / 8) + 1
                };
                this.ledPositions.push(ledPos);
            }
        }
    }
    
    // Convert a pointer event to canvas coordinates. The canvas element may be resized
    // by CSS; with object-fit: contain its content is scaled uniformly and centred
    // inside the element box. Clamp so drags past the edge still select up to the boundary.
    eventToCanvasCoords(event, clamp = false) {
        const rect = this.canvas.getBoundingClientRect();
        const scale = Math.min(rect.width / this.canvasWidth, rect.height / this.canvasHeight);
        const offsetX = (rect.width - this.canvasWidth * scale) / 2;
        const offsetY = (rect.height - this.canvasHeight * scale) / 2;
        let x = (event.clientX - rect.left - offsetX) / scale;
        let y = (event.clientY - rect.top - offsetY) / scale;
        if (clamp) {
            x = Math.min(Math.max(x, 0), this.canvasWidth);
            y = Math.min(Math.max(y, 0), this.canvasHeight);
        }
        return { x, y };
    }
    
    ledAt(x, y) {
        return this.ledPositions.find(ledPos => {
            const [x1, y1, x2, y2] = ledPos.coords;
            return x >= x1 && x <= x2 && y >= y1 && y <= y2;
        });
    }
    
    setupEventListeners() {
        // Pointer down - start drag selection. Pointer capture keeps move/up events
        // coming to the canvas even when the cursor leaves it.
        this.canvas.addEventListener('pointerdown', (event) => {
            if (event.button !== 0) return;
            event.preventDefault();
            this.canvas.setPointerCapture(event.pointerId);
            
            const point = this.eventToCanvasCoords(event, true);
            this.isDragging = true;
            this.dragStart = point;
            this.dragEnd = point;
        });
        
        // Pointer move - update drag selection or hover cursor
        this.canvas.addEventListener('pointermove', (event) => {
            if (this.isDragging) {
                this.dragEnd = this.eventToCanvasCoords(event, true);
                this.draw();
            } else {
                const { x, y } = this.eventToCanvasCoords(event);
                this.canvas.style.cursor = this.ledAt(x, y) ? 'pointer' : 'crosshair';
            }
        });
        
        // Pointer up - complete drag selection
        this.canvas.addEventListener('pointerup', (event) => {
            if (!this.isDragging) return;
            this.dragEnd = this.eventToCanvasCoords(event, true);
            this.isDragging = false;
            
            // Check if it was a click (minimal movement) or a drag
            const dragDistance = Math.hypot(
                this.dragEnd.x - this.dragStart.x,
                this.dragEnd.y - this.dragStart.y
            );
            
            if (dragDistance < 5) {
                // Treat as click - toggle single LED
                const ledPos = this.ledAt(this.dragEnd.x, this.dragEnd.y);
                if (ledPos) {
                    this.onLedClicked(ledPos.bit);
                }
            } else {
                // Treat as drag - toggle all LEDs in selection box
                this.toggleLedsInBox();
            }
            
            this.draw();
        });
        
        // Pointer cancelled (e.g. window lost focus) - abort drag selection
        this.canvas.addEventListener('pointercancel', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.draw();
            }
        });
    }
    
    setLed2Ap(ap) {
        this.led2Position = { ...this.led2Position, ap };
        this.calculateLedPositions();
        this.draw();
    }
    
    onLedClicked(bitPosition) {
        // Toggle LED selection using BigInt for proper 64-bit handling
        this.ledSelectionValue ^= (1n << BigInt(bitPosition));
        this.draw();
        
        // Notify the main app
        if (window.optoGridApp) {
            window.optoGridApp.onLedClicked(bitPosition);
        }
    }
    
    toggleLedsInBox() {
        // Calculate selection box bounds
        const minX = Math.min(this.dragStart.x, this.dragEnd.x);
        const maxX = Math.max(this.dragStart.x, this.dragEnd.x);
        const minY = Math.min(this.dragStart.y, this.dragEnd.y);
        const maxY = Math.max(this.dragStart.y, this.dragEnd.y);
        
        // Find all LEDs within the selection box
        const ledsToToggle = [];
        for (const ledPos of this.ledPositions) {
            const ledCenterX = ledPos.x + this.ledWidth / 2;
            const ledCenterY = ledPos.y + this.ledHeight / 2;
            
            if (ledCenterX >= minX && ledCenterX <= maxX && 
                ledCenterY >= minY && ledCenterY <= maxY) {
                ledsToToggle.push(ledPos.bit);
            }
        }
        
        // Toggle all selected LEDs and notify for each one
        for (const bit of ledsToToggle) {
            this.ledSelectionValue ^= (1n << BigInt(bit));
            
            // Notify the main app for each LED change
            if (window.optoGridApp) {
                window.optoGridApp.onLedClicked(bit);
            }
        }
    }
    
    drawSelectionBox() {
        const minX = Math.min(this.dragStart.x, this.dragEnd.x);
        const maxX = Math.max(this.dragStart.x, this.dragEnd.x);
        const minY = Math.min(this.dragStart.y, this.dragEnd.y);
        const maxY = Math.max(this.dragStart.y, this.dragEnd.y);
        
        this.ctx.strokeStyle = 'rgba(255, 200, 0, 0.9)';
        this.ctx.fillStyle = 'rgba(255, 255, 0, 0.15)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        
        this.ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
        this.ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
        
        this.ctx.setLineDash([]);
    }
    
    updateLedSelection(value) {
        this.ledSelectionValue = BigInt(value);
        this.draw();
    }
    
    updateLedCheckOverlay(ledCheckMask) {
        // Convert input to BigInt for proper uint64_t handling
        this.ledCheckMask = BigInt(ledCheckMask);
        this.draw();
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        this.drawBrainMapImage();
        this.drawLeds();
        
        if (this.isDragging) {
            this.drawSelectionBox();
        }
    }
    
    
    drawLeds() {
        this.ledPositions.forEach(ledPos => {
            const [x1, y1, x2, y2] = ledPos.coords;
            
            // Draw LED rectangle if selected (using BigInt)
            if (this.ledSelectionValue & (1n << BigInt(ledPos.bit))) {
                this.ctx.fillStyle = 'rgba(0, 190, 255, 1)';
                this.ctx.strokeStyle = 'rgb(0, 190, 255)';
                this.ctx.lineWidth = 2;
                this.ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
                this.ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
            }
            else {
                // Draw unselected LED border
                this.ctx.strokeStyle = 'rgb(0, 190, 255)';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
            }
            
            // Draw X overlay if LED is broken (bit is 0 in check mask)
            const ledBit = BigInt(ledPos.bit);
            const isLedBroken = (this.ledCheckMask & (1n << ledBit)) === 0n;
            
            if (isLedBroken) {
                this.ctx.strokeStyle = 'red';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.moveTo(x1, y1);
                this.ctx.lineTo(x2, y2);
                this.ctx.moveTo(x1, y2);
                this.ctx.lineTo(x2, y1);
                this.ctx.stroke();
                
            }
            
            // Always draw LED number
            this.ctx.fillStyle = 'black';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            const centerX = x1 + (x2 - x1) / 2;
            const centerY = y1 + (y2 - y1) / 2;
            
            this.ctx.fillText((ledPos.bit + 1).toString(), centerX, centerY);
        });
    }
    
    // Method to load actual brain map image when available
    loadBrainMapImage(imagePath) {
        const img = new Image();
        img.onload = () => {
            this.brainMapImage = img;
            this.draw();
        };
        img.onerror = () => {
            console.warn('Could not load brain map image:', imagePath);
        };
        img.src = imagePath;
    }
    
    drawBrainMapImage() {
        if (this.brainMapImage) {
            // Scale image to fit canvas
            const scale = Math.min(this.canvasWidth / this.brainMapImage.width, 
                                 this.canvasHeight / this.brainMapImage.height);
            const width = this.brainMapImage.width * scale;
            const height = this.brainMapImage.height * scale;
            const x = (this.canvasWidth - width) / 2;
            const y = (this.canvasHeight - height) / 2;
            
            this.ctx.drawImage(this.brainMapImage, x, y, width, height);
        }
    }
}