/**
 * Interactive Canvas - p5.js based interactive canvas component
 * Handles mouse interactions and visual feedback for both single and scan modes
 */

class InteractiveCanvas {
    constructor(containerId, imageProcessor, audioEngine, hsvMapper) {
        this.containerId = containerId;
        this.imageProcessor = imageProcessor;
        this.audioEngine = audioEngine;
        this.hsvMapper = hsvMapper;
        
        this.p5Instance = null;
        this.currentMode = 'single';
        this.isPlaying = false;
        this.mousePosition = { x: 0, y: 0 };
        this.hoveredPixel = null;
        this.scanColumn = -1;
        this.visualFeedback = true;
        
        this.init();
    }
    
    /**
     * Initialize the p5.js canvas
     */
    init() {
        console.log('Initializing InteractiveCanvas...');
        console.log('Looking for container:', this.containerId);
        
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Container with id '${this.containerId}' not found`);
            console.log('Available elements:', document.querySelectorAll('[id]'));
            return;
        }
        
        console.log('Container found:', container);
        
        // Create p5 instance
        this.p5Instance = new p5((p) => {
            this.setupP5(p);
        }, container);
        
        console.log('p5 instance created:', this.p5Instance);
    }
    
    /**
     * Setup p5.js sketch
     * @param {p5} p - p5 instance
     */
    setupP5(p) {
        p.setup = () => {
            const container = document.getElementById(this.containerId);
            if (!container) {
                console.error('Container not found:', this.containerId);
                return;
            }
            
            // 使用容器尺寸，但設定最大尺寸
            const maxWidth = 600;
            const maxHeight = 500;
            
            const canvas = p.createCanvas(maxWidth, maxHeight);
            canvas.parent(this.containerId);
            
            // Set canvas styles
            canvas.style('border-radius', '10px');
            canvas.style('cursor', 'crosshair');
            canvas.style('max-width', '100%');
            canvas.style('height', 'auto');
            
            // Set background to white (no gray frame)
            p.background(255);
            
            // Draw placeholder text
            this.drawPlaceholder(p);
            
            console.log('p5.js canvas created successfully');
        };
        
        p.draw = () => {
            // 只在有圖像時才繪製
            if (!this.imageProcessor.hasImage()) {
                p.background(255);
                this.drawPlaceholder(p);
                return;
            }
            
            // 清除背景為白色
            p.background(255);
            
            // 繪製像素化圖像
            this.drawPixelatedImage(p);
            
            // 繪製視覺回饋
            if (this.visualFeedback) {
                this.drawVisualFeedback(p);
            }
        };
        
        p.mousePressed = () => {
            if (!this.imageProcessor.hasImage() || !this.isPlaying) return;
            
            if (this.currentMode === 'single') {
                // 計算圖片在畫布中的居中位置
                const dimensions = this.imageProcessor.getDimensions();
                const imageWidth = dimensions.width;
                const imageHeight = dimensions.height;
                const canvasWidth = p.width;
                const canvasHeight = p.height;
                
                const offsetX = (canvasWidth - imageWidth) / 2;
                const offsetY = (canvasHeight - imageHeight) / 2;
                
                // 調整滑鼠位置以對應實際圖片位置
                const adjustedMouseX = p.mouseX - offsetX;
                const adjustedMouseY = p.mouseY - offsetY;
                
                this.handleSingleClick(p, adjustedMouseX, adjustedMouseY);
            }
        };
        
        p.mouseMoved = () => {
            if (!this.imageProcessor.hasImage()) return;
            
            this.mousePosition.x = p.mouseX;
            this.mousePosition.y = p.mouseY;
            
            // 計算圖片在畫布中的居中位置
            const dimensions = this.imageProcessor.getDimensions();
            const imageWidth = dimensions.width;
            const imageHeight = dimensions.height;
            const canvasWidth = p.width;
            const canvasHeight = p.height;
            
            const offsetX = (canvasWidth - imageWidth) / 2;
            const offsetY = (canvasHeight - imageHeight) / 2;
            
            // 調整滑鼠位置以對應實際圖片位置
            const adjustedMouseX = p.mouseX - offsetX;
            const adjustedMouseY = p.mouseY - offsetY;
            
            // Update hovered pixel
            this.hoveredPixel = this.imageProcessor.getPixelAt(adjustedMouseX, adjustedMouseY);
            
            if (this.currentMode === 'scan' && this.isPlaying) {
                this.handleScanMove(p);
            }
        };
        
        p.mouseReleased = () => {
            if (this.currentMode === 'scan' && this.isPlaying) {
                this.handleScanRelease();
            }
        };
        
        p.mouseExited = () => {
            this.hoveredPixel = null;
            if (this.currentMode === 'scan' && this.isPlaying) {
                this.handleScanRelease();
            }
        };
    }
    
    /**
     * Draw placeholder content when no image is loaded
     * @param {p5} p - p5 instance
     */
    drawPlaceholder(p) {
        p.fill(150);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(18);
        p.text('Upload an image to begin', p.width / 2, p.height / 2);
        
        p.textSize(14);
        p.text('Supported formats: JPG, PNG, GIF, WebP', p.width / 2, p.height / 2 + 30);
    }
    
    /**
     * Draw the pixelated image from image processor
     * @param {p5} p - p5 instance
     */
    drawPixelatedImage(p) {
        const pixelData = this.imageProcessor.getPixelData();
        const pixelSize = this.imageProcessor.getPixelSize();
        const dimensions = this.imageProcessor.getDimensions();
        
        if (!pixelData || pixelData.length === 0) {
            console.log('No pixel data available');
            return;
        }
        
        // 計算圖片在畫布中的居中位置
        const imageWidth = dimensions.width;
        const imageHeight = dimensions.height;
        const canvasWidth = p.width;
        const canvasHeight = p.height;
        
        const offsetX = (canvasWidth - imageWidth) / 2;
        const offsetY = (canvasHeight - imageHeight) / 2;
        
        for (let y = 0; y < pixelData.length; y++) {
            for (let x = 0; x < pixelData[y].length; x++) {
                const pixel = pixelData[y][x];
                if (!pixel || !pixel.rgb) continue;
                
                const rgb = pixel.rgb;
                
                // 繪製圓形像素（緊密排列，無間距）
                p.fill(rgb.r, rgb.g, rgb.b);
                p.noStroke();
                p.ellipse(
                    pixel.pixelX + offsetX + pixelSize/2, 
                    pixel.pixelY + offsetY + pixelSize/2, 
                    pixelSize, // 恢復原始大小，緊密排列
                    pixelSize
                );
                
                // 繪製細微邊框
                p.stroke(0, 0, 0, 20);
                p.strokeWeight(0.5);
                p.noFill();
                p.ellipse(
                    pixel.pixelX + offsetX + pixelSize/2, 
                    pixel.pixelY + offsetY + pixelSize/2, 
                    pixelSize,
                    pixelSize
                );
            }
        }
    }
    
    /**
     * Draw visual feedback for user interactions
     * @param {p5} p - p5 instance
     */
    drawVisualFeedback(p) {
        // Draw hover effect
        if (this.hoveredPixel) {
            const pixelSize = this.imageProcessor.getPixelSize();
            const dimensions = this.imageProcessor.getDimensions();
            
            // 計算圖片在畫布中的居中位置
            const imageWidth = dimensions.width;
            const imageHeight = dimensions.height;
            const canvasWidth = p.width;
            const canvasHeight = p.height;
            
            const offsetX = (canvasWidth - imageWidth) / 2;
            const offsetY = (canvasHeight - imageHeight) / 2;
            
            // Highlight hovered pixel (加上偏移量，只顯示邊框)
            p.stroke(255, 255, 0, 200);
            p.strokeWeight(2);
            p.noFill(); // 移除填充，只顯示邊框
            p.ellipse(
                this.hoveredPixel.pixelX + offsetX + pixelSize/2,
                this.hoveredPixel.pixelY + offsetY + pixelSize/2,
                pixelSize,
                pixelSize
            );
            
            // Draw HSV info
            this.drawHsvInfo(p, this.hoveredPixel);
        }
        
        // Draw scan mode indicator
        if (this.currentMode === 'scan' && this.isPlaying) {
            this.drawScanIndicator(p);
        }
    }
    
    /**
     * Draw HSV information overlay (顯示在圖片下緣)
     * @param {p5} p - p5 instance
     * @param {Object} pixel - Pixel data
     */
    drawHsvInfo(p, pixel) {
        const hsv = pixel.hsv;
        const rgb = this.hsvMapper.hsvToRgb(hsv.h, hsv.s, hsv.v);
        
        // 計算圖片在畫布中的位置
        const dimensions = this.imageProcessor.getDimensions();
        const imageWidth = dimensions.width;
        const imageHeight = dimensions.height;
        const canvasWidth = p.width;
        const canvasHeight = p.height;
        
        const offsetX = (canvasWidth - imageWidth) / 2;
        const offsetY = (canvasHeight - imageHeight) / 2;
        
        // 在圖片下緣顯示一行文字，確保在畫布範圍內
        const textY = offsetY + imageHeight + 25;
        const textX = offsetX + imageWidth / 2;
        
        // 對於直式圖片，如果文字會超出畫布，則顯示在畫布底部
        let finalTextY = textY;
        if (textY > p.height - 20) {
            finalTextY = p.height - 10;
        }
        
        // 確保文字不會超出畫布範圍
        const safeTextY = Math.min(finalTextY, p.height - 10);
        const safeTextX = Math.max(10, Math.min(textX, p.width - 10));
        
        // Draw text with precise values (一行顯示，使用選取顏色，無背景)
        p.fill(rgb.r, rgb.g, rgb.b);
        p.textAlign(p.CENTER);
        p.textSize(12);
        p.textFont('monospace'); // 使用等寬字體
        p.noStroke(); // 確保沒有邊框
        p.text(
            `H:${hsv.h.toFixed(1)}° S:${hsv.s.toFixed(1)}% V:${hsv.v.toFixed(1)}% | R:${rgb.r} G:${rgb.g} B:${rgb.b}`,
            safeTextX,
            safeTextY
        );
    }
    
    /**
     * Get contrast color for text (黑色或白色)
     * @param {number} r - Red value
     * @param {number} g - Green value  
     * @param {number} b - Blue value
     * @returns {Array} RGB color array
     */
    getContrastColor(r, g, b) {
        // 計算亮度
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        // 如果背景較亮，使用黑色文字；如果背景較暗，使用白色文字
        return brightness > 128 ? [0, 0, 0] : [255, 255, 255];
    }
    
    /**
     * Draw scan mode indicator
     * @param {p5} p - p5 instance
     */
    drawScanIndicator(p) {
        if (this.scanColumn >= 0) {
            const pixelSize = this.imageProcessor.getPixelSize();
            const x = this.scanColumn * pixelSize;
            
            // Draw scan line
            p.stroke(255, 0, 0, 200);
            p.strokeWeight(2);
            p.line(x, 0, x, p.height);
            
            // Draw scan area highlight
            p.fill(255, 0, 0, 30);
            p.noStroke();
            p.rect(x, 0, pixelSize, p.height);
        }
    }
    
    /**
     * Handle single click in single mode
     * @param {p5} p - p5 instance
     * @param {number} mouseX - Adjusted mouse X position
     * @param {number} mouseY - Adjusted mouse Y position
     */
    handleSingleClick(p, mouseX, mouseY) {
        const pixel = this.imageProcessor.getPixelAt(mouseX, mouseY);
        if (pixel) {
            // 設定 hoveredPixel 以便顯示色彩資訊
            this.hoveredPixel = pixel;
            
            // Play sound for this pixel (使用動態持續時間)
            this.audioEngine.playNote(pixel.hsv);
            
            // Visual feedback
            this.showClickFeedback(p, pixel);
        }
    }
    
    /**
     * Handle mouse movement in scan mode
     * @param {p5} p - p5 instance
     */
    handleScanMove(p) {
        const newColumn = Math.floor(p.mouseX / this.imageProcessor.getPixelSize());
        
        if (newColumn !== this.scanColumn) {
            // Stop previous column sounds
            if (this.scanColumn >= 0) {
                this.audioEngine.stopScanSound(this.scanColumn);
            }
            
            // Start new column sounds (限制同時播放的聲音數量)
            this.scanColumn = newColumn;
            const columnPixels = this.imageProcessor.getColumnPixels(p.mouseX);
            
            // 限制同時播放的聲音數量，避免當機
            const maxSimultaneousSounds = 5;
            const step = Math.max(1, Math.floor(columnPixels.length / maxSimultaneousSounds));
            
            columnPixels.forEach((pixel, index) => {
                if (pixel && index % step === 0) {
                    // Stagger the sounds slightly for chord effect
                    setTimeout(() => {
                        this.audioEngine.startScanSound(pixel.hsv, `${this.scanColumn}_${index}`);
                    }, (index / step) * 50);
                }
            });
        }
    }
    
    /**
     * Handle mouse release in scan mode
     */
    handleScanRelease() {
        if (this.scanColumn >= 0) {
            this.audioEngine.stopScanSound(this.scanColumn);
            this.scanColumn = -1;
        }
    }
    
    /**
     * Show click feedback animation (disabled)
     * @param {p5} p - p5 instance
     * @param {Object} pixel - Pixel data
     */
    showClickFeedback(p, pixel) {
        // 移除點擊反饋動畫
        return;
    }
    
    /**
     * Set the current interaction mode
     * @param {string} mode - 'single' or 'scan'
     */
    setMode(mode) {
        this.currentMode = mode;
        
        // Stop any ongoing scan sounds
        if (mode === 'single') {
            this.handleScanRelease();
        }
        
        // Update audio engine mode
        this.audioEngine.setMode(mode);
    }
    
    /**
     * Set playing state
     * @param {boolean} playing - Whether the canvas is in playing mode
     */
    setPlaying(playing) {
        this.isPlaying = playing;
        
        if (!playing) {
            console.log('Canvas stopped playing - releasing scan sounds');
            this.handleScanRelease();
            // 確保停止所有掃描聲音
            if (this.audioEngine) {
                this.audioEngine.stopAllScanSounds();
            }
        }
    }
    
    /**
     * Toggle visual feedback
     * @param {boolean} enabled - Whether to show visual feedback
     */
    setVisualFeedback(enabled) {
        this.visualFeedback = enabled;
    }
    
    /**
     * Update canvas when image changes
     */
    updateImage() {
        console.log('Updating canvas...');
        if (this.p5Instance && this.p5Instance.redraw) {
            console.log('Calling p5 redraw');
            this.p5Instance.redraw();
        } else {
            console.error('p5Instance not available for redraw');
        }
    }
    
    /**
     * Get current mouse position
     * @returns {Object} Mouse position {x, y}
     */
    getMousePosition() {
        return this.mousePosition;
    }
    
    /**
     * Get currently hovered pixel
     * @returns {Object|null} Hovered pixel data
     */
    getHoveredPixel() {
        return this.hoveredPixel;
    }
    
    /**
     * Resize canvas to fit container
     */
    resizeCanvas() {
        if (this.p5Instance && this.p5Instance.resizeCanvas) {
            const container = document.getElementById(this.containerId);
            if (container) {
                this.p5Instance.resizeCanvas(container.offsetWidth, container.offsetHeight);
            }
        }
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        if (this.p5Instance && this.p5Instance.remove) {
            this.p5Instance.remove();
        }
    }
}

// Export for use in other modules
window.InteractiveCanvas = InteractiveCanvas;
