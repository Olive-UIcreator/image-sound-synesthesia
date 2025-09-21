/**
 * Audio Engine - Tone.js Integration
 * Handles real-time audio synthesis based on HSV values
 */

class AudioEngine {
    constructor() {
        this.isInitialized = false;
        this.synths = new Map();
        this.maxSynths = 5; // 減少最大同時播放聲音數量
        this.currentMode = 'single';
        this.scanSounds = new Map(); // For scan mode
        this.masterVolume = 0.3;
        this.needsUserGesture = true;
        
        // 不自動初始化，等待用戶手勢
        console.log('Audio Engine created, waiting for user gesture');
    }
    
    async init() {
        try {
            console.log('Starting audio engine initialization...');
            
            // Initialize Tone.js with user gesture
            console.log('Starting Tone.js...');
            await Tone.start();
            console.log('Tone.js started successfully');
            
            // Create master volume control
            this.masterGain = new Tone.Gain(this.masterVolume).toDestination();
            console.log('Master gain created');
            
            // Create reverb for spatial effect
            this.reverb = new Tone.Reverb({
                decay: 2,
                wet: 0.3
            }).connect(this.masterGain);
            console.log('Reverb created');
            
            this.isInitialized = true;
            console.log('Audio Engine initialized successfully');
        } catch (error) {
            console.error('Failed to initialize audio engine:', error);
            // Set as initialized anyway to prevent blocking
            this.isInitialized = true;
        }
    }
    
    /**
     * Create a synthesizer for a specific HSV value
     * @param {Object} hsv - HSV color values {h, s, v}
     * @param {string} id - Unique identifier for the synth
     * @returns {Tone.Synth} Configured synthesizer
     */
    createSynth(hsv, id) {
        if (!this.isInitialized) return null;
        
        // Map HSV to audio parameters
        const frequency = this.hsvToFrequency(hsv.h);
        const attack = this.hsvToAttack(hsv.s);
        const release = this.hsvToRelease(hsv.v);
        const volume = this.hsvToVolume(hsv.v);
        
        // Create synthesizer with HSV-mapped parameters
        const synth = new Tone.Synth({
            oscillator: {
                type: this.hsvToWaveform(hsv.s)
            },
            envelope: {
                attack: attack,
                decay: 0.2,
                sustain: 0.3,
                release: release
            }
        });
        
        // Connect to effects chain
        synth.connect(this.reverb);
        
        // Store synth with ID for management
        this.synths.set(id, {
            synth: synth,
            frequency: frequency,
            volume: volume,
            hsv: hsv
        });
        
        return synth;
    }
    
    /**
     * Play a single note based on HSV values
     * @param {Object} hsv - HSV color values
     * @param {number} duration - Note duration in seconds (optional, will be calculated from brightness if not provided)
     */
    playNote(hsv, duration = null) {
        if (!this.isInitialized) {
            console.log('Audio engine not initialized, cannot play note');
            return;
        }
        
        console.log('Playing note for HSV:', hsv);
        
        // 根據亮度計算持續時間：亮度越高，持續時間越短（更清脆）
        const calculatedDuration = duration || (0.1 + (100 - hsv.v) / 100 * 0.3); // 0.1-0.4秒
        
        const id = `note_${Date.now()}_${Math.random()}`;
        const synth = this.createSynth(hsv, id);
        
        if (synth) {
            const frequency = this.hsvToFrequency(hsv.h);
            const volume = this.hsvToVolume(hsv.v);
            
            console.log(`Playing note: ${frequency.toFixed(1)}Hz at volume ${volume.toFixed(2)} for ${calculatedDuration.toFixed(2)}s`);
            
            // Play the note
            synth.triggerAttackRelease(frequency, calculatedDuration, Tone.now(), volume);
            
            // Clean up after note ends
            setTimeout(() => {
                this.cleanupSynth(id);
            }, calculatedDuration * 1000 + 500);
        } else {
            console.log('Failed to create synth for note');
        }
    }
    
    /**
     * Start continuous sound for scan mode
     * @param {Object} hsv - HSV color values
     * @param {string} columnId - Column identifier
     */
    startScanSound(hsv, columnId) {
        if (!this.isInitialized || this.currentMode !== 'scan') return;
        
        // Stop existing sound for this column
        this.stopScanSound(columnId);
        
        const synth = this.createSynth(hsv, columnId);
        if (synth) {
            const frequency = this.hsvToFrequency(hsv.h);
            const volume = this.hsvToVolume(hsv.v);
            
            // Start continuous tone
            synth.triggerAttack(frequency, Tone.now(), volume);
            this.scanSounds.set(columnId, synth);
        }
    }
    
    /**
     * Stop continuous sound for scan mode
     * @param {string} columnId - Column identifier
     */
    stopScanSound(columnId) {
        const synthData = this.synths.get(columnId);
        if (synthData) {
            synthData.synth.triggerRelease();
            this.cleanupSynth(columnId);
        }
        this.scanSounds.delete(columnId);
    }
    
    /**
     * Stop all scan mode sounds
     */
    stopAllScanSounds() {
        console.log('Stopping all scan sounds...');
        this.scanSounds.forEach((synth, columnId) => {
            console.log(`Stopping scan sound for column: ${columnId}`);
            this.stopScanSound(columnId);
        });
        this.scanSounds.clear();
        console.log('All scan sounds stopped');
    }
    
    /**
     * Set the current mode (single or scan)
     * @param {string} mode - 'single' or 'scan'
     */
    setMode(mode) {
        this.currentMode = mode;
        
        if (mode === 'single') {
            this.stopAllScanSounds();
        }
    }
    
    /**
     * Set master volume
     * @param {number} volume - Volume level (0-1)
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.rampTo(this.masterVolume, 0.1);
        }
    }
    
    /**
     * Convert HSV hue to frequency
     * @param {number} hue - Hue value (0-360)
     * @returns {number} Frequency in Hz
     */
    hsvToFrequency(hue) {
        // Map 0-360 degrees to 200-2000 Hz (musical range)
        const minFreq = 200;
        const maxFreq = 2000;
        return minFreq + (hue / 360) * (maxFreq - minFreq);
    }
    
    /**
     * Convert HSV saturation to attack time
     * @param {number} saturation - Saturation value (0-100)
     * @returns {number} Attack time in seconds
     */
    hsvToAttack(saturation) {
        // Higher saturation = faster attack (more immediate)
        return 0.01 + (saturation / 100) * 0.1;
    }
    
    /**
     * Convert HSV value to release time
     * @param {number} value - Value/brightness (0-100)
     * @returns {number} Release time in seconds
     */
    hsvToRelease(value) {
        // Higher brightness = longer release
        return 0.1 + (value / 100) * 1.0;
    }
    
    /**
     * Convert HSV value to volume
     * @param {number} value - Value/brightness (0-100)
     * @returns {number} Volume level (0-1)
     */
    hsvToVolume(value) {
        // Map 0-100 to 0.1-0.8 volume range
        return 0.1 + (value / 100) * 0.7;
    }
    
    /**
     * Convert HSV saturation to waveform type
     * @param {number} saturation - Saturation value (0-100)
     * @returns {string} Waveform type
     */
    hsvToWaveform(saturation) {
        // Map saturation to different waveforms
        if (saturation < 25) return 'sine';
        if (saturation < 50) return 'triangle';
        if (saturation < 75) return 'sawtooth';
        return 'square';
    }
    
    /**
     * Clean up synthesizer resources
     * @param {string} id - Synthesizer ID
     */
    cleanupSynth(id) {
        const synthData = this.synths.get(id);
        if (synthData) {
            synthData.synth.dispose();
            this.synths.delete(id);
        }
    }
    
    /**
     * Clean up all synthesizers
     */
    dispose() {
        this.synths.forEach((synthData, id) => {
            this.cleanupSynth(id);
        });
        
        if (this.reverb) {
            this.reverb.dispose();
        }
        
        if (this.masterGain) {
            this.masterGain.dispose();
        }
    }
}

// Export for use in other modules
window.AudioEngine = AudioEngine;
