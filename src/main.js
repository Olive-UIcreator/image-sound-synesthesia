/**
 * Main Application - Image-Sound-Synesthesia
 * Orchestrates all components and handles user interactions
 */

class ImageSoundSynesthesia {
    constructor() {
        // Core components
        this.imageProcessor = null;
        this.audioEngine = null;
        this.hsvMapper = null;
        this.interactiveCanvas = null;
        
        // UI elements
        this.elements = {};
        
        // Application state
        this.isInitialized = false;
        this.isPlaying = false;
        this.currentMode = 'single';
        this.currentPixelSize = 50;
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('Initializing Image-Sound-Synesthesia...');
            
            // Get UI elements
            this.getUIElements();
            
            // Initialize core components
            await this.initializeComponents();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup UI
            this.setupUI();
            
            this.isInitialized = true;
            console.log('Application initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }
    
    /**
     * Get references to UI elements
     */
    getUIElements() {
        this.elements = {
            imageUpload: document.getElementById('image-upload'),
            pixelSizeSlider: document.getElementById('pixel-size'),
            pixelSizeValue: document.getElementById('pixel-size-value'),
            modeSelect: document.getElementById('mode-select'),
            playButton: document.getElementById('play-button'),
            canvasOverlay: document.getElementById('canvas-overlay')
        };
        
        // Validate required elements
        const requiredElements = ['imageUpload', 'pixelSizeSlider', 'modeSelect', 'playButton'];
        for (const elementName of requiredElements) {
            if (!this.elements[elementName]) {
                throw new Error(`Required UI element '${elementName}' not found`);
            }
        }
    }
    
    /**
     * Initialize core components
     */
    async initializeComponents() {
        console.log('Initializing components...');
        
        // Initialize HSV mapper
        this.hsvMapper = new HsvMapper();
        console.log('HSV Mapper initialized');
        
        // Initialize audio engine (but don't start it yet)
        this.audioEngine = new AudioEngine();
        console.log('Audio Engine created, will initialize on first user interaction');
        
        // Initialize image processor
        this.imageProcessor = new ImageProcessor();
        console.log('Image Processor initialized');
        
        // Create canvas for image processing
        const canvas = document.createElement('canvas');
        this.imageProcessor.init(canvas);
        console.log('Image Processor canvas initialized');
        
        // Wait a bit for DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Initialize interactive canvas
        this.interactiveCanvas = new InteractiveCanvas(
            'p5-canvas',
            this.imageProcessor,
            this.audioEngine,
            this.hsvMapper
        );
        console.log('Interactive Canvas initialized');
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Image upload
        this.elements.imageUpload.addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });
        
        // Pixel size slider
        this.elements.pixelSizeSlider.addEventListener('input', (e) => {
            this.handlePixelSizeChange(e);
        });
        
        // Mode selection
        this.elements.modeSelect.addEventListener('change', (e) => {
            this.handleModeChange(e);
        });
        
        // Play button
        this.elements.playButton.addEventListener('click', () => {
            this.togglePlayback();
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });
    }
    
    /**
     * Setup initial UI state
     */
    setupUI() {
        // Set initial pixel size
        this.updatePixelSizeDisplay(this.currentPixelSize);
        
        // Set initial mode
        this.elements.modeSelect.value = this.currentMode;
        
        // Update play button state
        this.updatePlayButton();
        
        // Hide canvas overlay initially
        this.elements.canvasOverlay.classList.add('hidden');
    }
    
    /**
     * Handle image upload
     * @param {Event} event - File input change event
     */
    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            console.log('Starting image upload:', file.name);
            this.showLoading('Processing image...');
            
            // Load and process image
            await this.imageProcessor.loadImage(file);
            
            console.log('Image processing completed');
            console.log('Has image:', this.imageProcessor.hasImage());
            console.log('Pixel data length:', this.imageProcessor.getPixelData().length);
            
            // Wait for processing to complete
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Force canvas redraw
            if (this.interactiveCanvas && this.interactiveCanvas.p5Instance) {
                console.log('Forcing canvas redraw...');
                this.interactiveCanvas.p5Instance.redraw();
                
                // Additional redraw after a short delay
                setTimeout(() => {
                    this.interactiveCanvas.p5Instance.redraw();
                }, 100);
            }
            
            // Hide overlay
            this.elements.canvasOverlay.classList.add('hidden');
            
            // Enable play button
            this.elements.playButton.disabled = false;
            
            console.log('Image loaded and displayed successfully');
            
        } catch (error) {
            console.error('Failed to load image:', error);
            this.showError('Failed to load image. Please try a different file.');
        }
    }
    
    /**
     * Handle pixel size change
     * @param {Event} event - Slider input event
     */
    handlePixelSizeChange(event) {
        const newSize = parseInt(event.target.value);
        this.currentPixelSize = newSize;
        
        console.log('Pixel size changed to:', newSize);
        
        // Update display first
        this.updatePixelSizeDisplay(newSize);
        
        // Update image processor if image is loaded
        if (this.imageProcessor && this.imageProcessor.hasImage()) {
            this.imageProcessor.setPixelSize(newSize);
            
            // Update canvas
            this.interactiveCanvas.updateImage();
            
            console.log('Image reprocessed with new pixel size');
        }
    }
    
    /**
     * Handle mode change
     * @param {Event} event - Select change event
     */
    handleModeChange(event) {
        const newMode = event.target.value;
        this.currentMode = newMode;
        
        // Update interactive canvas
        this.interactiveCanvas.setMode(newMode);
        
        // Update audio engine
        this.audioEngine.setMode(newMode);
        
        console.log(`Mode changed to: ${newMode}`);
    }
    
    /**
     * Toggle playback state
     */
    async togglePlayback() {
        // 如果是第一次開始播放，先初始化音頻引擎
        if (!this.isPlaying && !this.audioEngine.isInitialized) {
            console.log('First playback - initializing audio engine...');
            try {
                await this.audioEngine.init();
                console.log('Audio engine initialized successfully');
            } catch (error) {
                console.error('Failed to initialize audio engine:', error);
                this.showError('Failed to initialize audio. Please try again.');
                return;
            }
        }
        
        this.isPlaying = !this.isPlaying;
        
        // 如果停止播放，停止所有聲音
        if (!this.isPlaying) {
            console.log('Stopping all audio...');
            this.audioEngine.stopAllScanSounds();
        }
        
        // Update interactive canvas
        this.interactiveCanvas.setPlaying(this.isPlaying);
        
        // Update UI
        this.updatePlayButton();
        
        console.log(`Playback ${this.isPlaying ? 'started' : 'stopped'}`);
    }
    
    /**
     * Handle window resize
     */
    handleWindowResize() {
        // Resize interactive canvas
        this.interactiveCanvas.resizeCanvas();
    }
    
    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyboard(event) {
        // Prevent default for our shortcuts
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case ' ':
                    event.preventDefault();
                    this.togglePlayback();
                    break;
                case 'm':
                    event.preventDefault();
                    this.toggleMode();
                    break;
            }
        }
    }
    
    /**
     * Toggle between single and scan mode
     */
    toggleMode() {
        const newMode = this.currentMode === 'single' ? 'scan' : 'single';
        this.elements.modeSelect.value = newMode;
        this.handleModeChange({ target: { value: newMode } });
    }
    
    /**
     * Update pixel size display
     * @param {number} size - Pixel size
     */
    updatePixelSizeDisplay(size) {
        if (this.elements.pixelSizeValue) {
            this.elements.pixelSizeValue.textContent = size;
        }
    }
    
    /**
     * Update play button state
     */
    updatePlayButton() {
        const button = this.elements.playButton;
        
        if (this.isPlaying) {
            button.textContent = 'Stop Playing';
            button.classList.add('pulse');
        } else {
            button.textContent = 'Start Playing';
            button.classList.remove('pulse');
        }
        
        // Disable if no image loaded
        button.disabled = !this.imageProcessor.hasImage();
    }
    
    /**
     * Show loading message
     * @param {string} message - Loading message
     */
    showLoading(message) {
        this.elements.canvasOverlay.textContent = message;
        this.elements.canvasOverlay.classList.remove('hidden');
    }
    
    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        this.elements.canvasOverlay.textContent = message;
        this.elements.canvasOverlay.classList.remove('hidden');
        this.elements.canvasOverlay.style.color = '#e74c3c';
    }
    
    /**
     * Get application state
     * @returns {Object} Current application state
     */
    getState() {
        return {
            isInitialized: this.isInitialized,
            isPlaying: this.isPlaying,
            currentMode: this.currentMode,
            currentPixelSize: this.currentPixelSize,
            hasImage: this.imageProcessor ? this.imageProcessor.hasImage() : false
        };
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        if (this.interactiveCanvas) {
            this.interactiveCanvas.dispose();
        }
        
        if (this.audioEngine) {
            this.audioEngine.dispose();
        }
        
        console.log('Application disposed');
    }
}

// Initialize application when script loads
const app = new ImageSoundSynesthesia();

// Export for debugging
window.ImageSoundSynesthesia = ImageSoundSynesthesia;
window.app = app;
