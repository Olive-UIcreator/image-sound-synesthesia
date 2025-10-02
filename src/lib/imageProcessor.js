/**
 * Image Processor - Handles image loading, pixelation, and HSV conversion
 * Provides core functionality for transforming images into playable soundscapes
 */

class ImageProcessor {
    constructor() {
        this.originalImage = null;
        this.pixelatedImage = null;
        this.pixelData = [];
        this.pixelSize = 50;
        this.maxPixelSize = 100;
        this.minPixelSize = 10;
        this.canvas = null;
        this.ctx = null;
    }
    
    /**
     * Initialize the image processor with a canvas
     * @param {HTMLCanvasElement} canvas - Canvas element for image processing
     */
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }
    
    /**
     * Load and process an image file
     * @param {File} file - Image file to process
     * @returns {Promise<boolean>} Success status
     */
    async loadImage(file) {
        return new Promise((resolve, reject) => {
            if (!file || !file.type.startsWith('image/')) {
                reject(new Error('Invalid file type'));
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    this.originalImage = img;
                    this.processImage();
                    resolve(true);
                };
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }
    
    /**
     * Process the loaded image with current pixel size
     */
    processImage() {
        if (!this.originalImage || !this.canvas) return;
        
        // 固定畫布尺寸
        const canvasWidth = 600;
        const canvasHeight = 500;
        
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        
        // 計算圖片縮放尺寸，保持寬高比
        const aspectRatio = this.originalImage.width / this.originalImage.height;
        let imageWidth, imageHeight;
        
        if (aspectRatio > canvasWidth / canvasHeight) {
            // 橫向圖片：以寬度為準
            imageWidth = canvasWidth;
            imageHeight = canvasWidth / aspectRatio;
        } else {
            // 直向圖片：以高度為準
            imageHeight = canvasHeight;
            imageWidth = canvasHeight * aspectRatio;
        }
        
        // 計算居中位置
        const offsetX = (canvasWidth - imageWidth) / 2;
        const offsetY = (canvasHeight - imageHeight) / 2;
        
        // 清除畫布並設置白色背景
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // 繪製圖片到居中位置
        this.ctx.drawImage(this.originalImage, offsetX, offsetY, imageWidth, imageHeight);
        
        // 儲存圖片實際尺寸和位置
        this.imageWidth = imageWidth;
        this.imageHeight = imageHeight;
        this.imageOffsetX = offsetX;
        this.imageOffsetY = offsetY;
        
        // Apply pixelation effect
        this.applyPixelation();
        
        // Extract pixel data
        this.extractPixelData();
        
        console.log(`Image processed: ${imageWidth}x${imageHeight}, offset: (${offsetX}, ${offsetY}), aspect ratio: ${aspectRatio.toFixed(2)}`);
    }
    
    /**
     * Apply pixelation effect to the canvas
     */
    applyPixelation() {
        if (!this.canvas || !this.ctx) return;
        
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Calculate grid dimensions
        const gridWidth = Math.ceil(width / this.pixelSize);
        const gridHeight = Math.ceil(height / this.pixelSize);
        
        // Create pixelated version
        for (let gridY = 0; gridY < gridHeight; gridY++) {
            for (let gridX = 0; gridX < gridWidth; gridX++) {
                // Calculate average color for this grid cell
                const avgColor = this.calculateAverageColor(
                    data, width, height,
                    gridX * this.pixelSize, gridY * this.pixelSize,
                    this.pixelSize
                );
                
                // Fill the grid cell with average color
                this.fillGridCell(gridX, gridY, avgColor);
            }
        }
    }
    
    /**
     * Calculate average color for a grid cell
     * @param {Uint8ClampedArray} data - Image data
     * @param {number} width - Image width
     * @param {number} height - Image height
     * @param {number} startX - Grid cell start X
     * @param {number} startY - Grid cell start Y
     * @param {number} cellSize - Size of grid cell
     * @returns {Object} Average RGB color
     */
    calculateAverageColor(data, width, height, startX, startY, cellSize) {
        let r = 0, g = 0, b = 0, count = 0;
        
        const endX = Math.min(startX + cellSize, width);
        const endY = Math.min(startY + cellSize, height);
        
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const index = (y * width + x) * 4;
                r += data[index];
                g += data[index + 1];
                b += data[index + 2];
                count++;
            }
        }
        
        return {
            r: Math.round(r / count),
            g: Math.round(g / count),
            b: Math.round(b / count)
        };
    }
    
    /**
     * Fill a grid cell with the specified color
     * @param {number} gridX - Grid X coordinate
     * @param {number} gridY - Grid Y coordinate
     * @param {Object} color - RGB color object
     */
    fillGridCell(gridX, gridY, color) {
        const x = gridX * this.pixelSize;
        const y = gridY * this.pixelSize;
        
        this.ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
        this.ctx.fillRect(x, y, this.pixelSize, this.pixelSize);
        
        // Add subtle border for better visibility
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, this.pixelSize, this.pixelSize);
    }
    
    /**
     * Extract pixel data from the pixelated image
     */
    extractPixelData() {
        if (!this.canvas || !this.ctx) return;
        
        this.pixelData = [];
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        const gridWidth = Math.ceil(width / this.pixelSize);
        const gridHeight = Math.ceil(height / this.pixelSize);
        
        for (let gridY = 0; gridY < gridHeight; gridY++) {
            this.pixelData[gridY] = [];
            for (let gridX = 0; gridX < gridWidth; gridX++) {
                const pixelX = gridX * this.pixelSize;
                const pixelY = gridY * this.pixelSize;
                
                // Get color from center of pixel block
                const centerX = Math.min(pixelX + Math.floor(this.pixelSize / 2), width - 1);
                const centerY = Math.min(pixelY + Math.floor(this.pixelSize / 2), height - 1);
                const index = (centerY * width + centerX) * 4;
                
                const rgb = {
                    r: data[index],
                    g: data[index + 1],
                    b: data[index + 2]
                };
                
                const hsv = this.rgbToHsv(rgb.r, rgb.g, rgb.b);
                
                this.pixelData[gridY][gridX] = {
                    rgb: rgb,
                    hsv: hsv,
                    gridX: gridX,
                    gridY: gridY,
                    pixelX: pixelX,
                    pixelY: pixelY
                };
            }
        }
    }
    
    /**
     * Convert RGB to HSV
     * @param {number} r - Red value (0-255)
     * @param {number} g - Green value (0-255)
     * @param {number} b - Blue value (0-255)
     * @returns {Object} HSV values
     */
    rgbToHsv(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const diff = max - min;
        
        let h = 0;
        let s = max === 0 ? 0 : diff / max;
        let v = max;
        
        if (diff !== 0) {
            if (max === r) {
                h = ((g - b) / diff) % 6;
            } else if (max === g) {
                h = (b - r) / diff + 2;
            } else {
                h = (r - g) / diff + 4;
            }
        }
        
        h = Math.round(h * 60);
        if (h < 0) h += 360;
        
        return {
            h: h,
            s: Math.round(s * 100),
            v: Math.round(v * 100)
        };
    }
    
    /**
     * Set pixel size and reprocess image
     * @param {number} size - New pixel size
     */
    setPixelSize(size) {
        this.pixelSize = Math.max(this.minPixelSize, Math.min(this.maxPixelSize, size));
        if (this.originalImage) {
            this.processImage();
        }
    }
    
    /**
     * Get pixel data at specific coordinates
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {Object|null} Pixel data or null if out of bounds
     */
    getPixelAt(x, y) {
        if (!this.pixelData.length) return null;
        
        const gridX = Math.floor(x / this.pixelSize);
        const gridY = Math.floor(y / this.pixelSize);
        
        if (gridY >= 0 && gridY < this.pixelData.length &&
            gridX >= 0 && gridX < this.pixelData[gridY].length) {
            return this.pixelData[gridY][gridX];
        }
        
        return null;
    }
    
    /**
     * Get all pixels in a column for scan mode
     * @param {number} x - X coordinate
     * @returns {Array} Array of pixel data in the column
     */
    getColumnPixels(x) {
        if (!this.pixelData.length) return [];
        
        const gridX = Math.floor(x / this.pixelSize);
        const columnPixels = [];
        
        if (gridX >= 0 && gridX < this.pixelData[0].length) {
            for (let gridY = 0; gridY < this.pixelData.length; gridY++) {
                columnPixels.push(this.pixelData[gridY][gridX]);
            }
        }
        
        return columnPixels;
    }
    
    /**
     * Get image dimensions
     * @returns {Object} Width, height, and offsets
     */
    getDimensions() {
        return {
            width: this.imageWidth || 0,
            height: this.imageHeight || 0,
            offsetX: this.imageOffsetX || 0,
            offsetY: this.imageOffsetY || 0,
            canvasWidth: this.canvas ? this.canvas.width : 0,
            canvasHeight: this.canvas ? this.canvas.height : 0
        };
    }
    
    /**
     * Check if image is loaded
     * @returns {boolean} True if image is loaded
     */
    hasImage() {
        return this.originalImage !== null && this.pixelData.length > 0;
    }
    
    /**
     * Get current pixel size
     * @returns {number} Current pixel size
     */
    getPixelSize() {
        return this.pixelSize;
    }
    
    /**
     * Get pixel data array
     * @returns {Array} 2D array of pixel data
     */
    getPixelData() {
        return this.pixelData;
    }
}

// Export for use in other modules
window.ImageProcessor = ImageProcessor;
