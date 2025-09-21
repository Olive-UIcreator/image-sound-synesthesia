/**
 * HSV Mapper - Core mapping logic for HSV to sound parameters
 * Implements the heart of the synesthesia system
 */

class HsvMapper {
    constructor() {
        // Audio parameter ranges
        this.frequencyRange = {
            min: 200,    // Hz
            max: 2000    // Hz
        };
        
        this.volumeRange = {
            min: 0.1,    // 0-1
            max: 0.8     // 0-1
        };
        
        this.attackRange = {
            min: 0.01,   // seconds
            max: 0.1     // seconds
        };
        
        this.releaseRange = {
            min: 0.1,    // seconds
            max: 1.0     // seconds
        };
        
        // Waveform mapping for saturation
        this.waveforms = ['sine', 'triangle', 'sawtooth', 'square'];
        
        // Musical scales for more harmonic results
        this.musicalScales = {
            chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
            major: [0, 2, 4, 5, 7, 9, 11],
            minor: [0, 2, 3, 5, 7, 8, 10],
            pentatonic: [0, 2, 4, 7, 9],
            blues: [0, 3, 5, 6, 7, 10]
        };
        
        this.currentScale = 'pentatonic';
        this.baseFrequency = 220; // A3 note
    }
    
    /**
     * Map HSV values to complete audio parameters
     * @param {Object} hsv - HSV color values {h, s, v}
     * @returns {Object} Complete audio parameters
     */
    mapHsvToAudio(hsv) {
        return {
            frequency: this.mapHueToFrequency(hsv.h),
            volume: this.mapValueToVolume(hsv.v),
            attack: this.mapSaturationToAttack(hsv.s),
            release: this.mapValueToRelease(hsv.v),
            waveform: this.mapSaturationToWaveform(hsv.s),
            timbre: this.mapSaturationToTimbre(hsv.s),
            pan: this.mapHueToPan(hsv.h)
        };
    }
    
    /**
     * Map hue (0-360°) to frequency using musical scales
     * @param {number} hue - Hue value (0-360)
     * @returns {number} Frequency in Hz
     */
    mapHueToFrequency(hue) {
        // Normalize hue to 0-1
        const normalizedHue = hue / 360;
        
        // Map to musical scale
        const scale = this.musicalScales[this.currentScale];
        const scaleIndex = Math.floor(normalizedHue * scale.length);
        const semitone = scale[scaleIndex % scale.length];
        
        // Calculate frequency using equal temperament
        const octave = Math.floor(normalizedHue * 3); // 3 octaves range
        const frequency = this.baseFrequency * Math.pow(2, (octave * 12 + semitone) / 12);
        
        return Math.max(this.frequencyRange.min, Math.min(this.frequencyRange.max, frequency));
    }
    
    /**
     * Map saturation (0-100%) to attack time
     * Higher saturation = faster attack (more immediate, sharper)
     * @param {number} saturation - Saturation value (0-100)
     * @returns {number} Attack time in seconds
     */
    mapSaturationToAttack(saturation) {
        const normalizedSat = saturation / 100;
        // Invert mapping: high saturation = low attack time
        return this.attackRange.min + (1 - normalizedSat) * (this.attackRange.max - this.attackRange.min);
    }
    
    /**
     * Map value/brightness (0-100%) to volume
     * Higher brightness = higher volume
     * @param {number} value - Value/brightness (0-100)
     * @returns {number} Volume level (0-1)
     */
    mapValueToVolume(value) {
        const normalizedValue = value / 100;
        return this.volumeRange.min + normalizedValue * (this.volumeRange.max - this.volumeRange.min);
    }
    
    /**
     * Map value/brightness (0-100%) to release time
     * Higher brightness = longer release (more sustained)
     * @param {number} value - Value/brightness (0-100)
     * @returns {number} Release time in seconds
     */
    mapValueToRelease(value) {
        const normalizedValue = value / 100;
        return this.releaseRange.min + normalizedValue * (this.releaseRange.max - this.releaseRange.min);
    }
    
    /**
     * Map saturation (0-100%) to waveform type
     * Higher saturation = more complex waveforms
     * @param {number} saturation - Saturation value (0-100)
     * @returns {string} Waveform type
     */
    mapSaturationToWaveform(saturation) {
        const normalizedSat = saturation / 100;
        const waveformIndex = Math.floor(normalizedSat * this.waveforms.length);
        return this.waveforms[Math.min(waveformIndex, this.waveforms.length - 1)];
    }
    
    /**
     * Map saturation (0-100%) to timbre characteristics
     * @param {number} saturation - Saturation value (0-100)
     * @returns {Object} Timbre parameters
     */
    mapSaturationToTimbre(saturation) {
        const normalizedSat = saturation / 100;
        
        return {
            // Harmonic content increases with saturation
            harmonicCount: Math.floor(2 + normalizedSat * 8),
            // Filter cutoff frequency
            filterCutoff: 200 + normalizedSat * 1800,
            // Resonance
            resonance: normalizedSat * 0.8
        };
    }
    
    /**
     * Map hue (0-360°) to stereo pan position
     * @param {number} hue - Hue value (0-360)
     * @returns {number} Pan position (-1 to 1)
     */
    mapHueToPan(hue) {
        // Map hue to stereo field
        return Math.sin((hue * Math.PI) / 180);
    }
    
    /**
     * Get color information for display
     * @param {Object} hsv - HSV color values
     * @returns {Object} Display information
     */
    getColorInfo(hsv) {
        const audioParams = this.mapHsvToAudio(hsv);
        
        return {
            hsv: hsv,
            rgb: this.hsvToRgb(hsv.h, hsv.s, hsv.v),
            audio: audioParams,
            description: this.generateColorDescription(hsv)
        };
    }
    
    /**
     * Convert HSV to RGB for display (精確版本)
     * @param {number} h - Hue (0-360)
     * @param {number} s - Saturation (0-100)
     * @param {number} v - Value (0-100)
     * @returns {Object} RGB values
     */
    hsvToRgb(h, s, v) {
        // 確保輸入值在正確範圍內
        h = Math.max(0, Math.min(360, h));
        s = Math.max(0, Math.min(100, s));
        v = Math.max(0, Math.min(100, v));
        
        // 轉換為 0-1 範圍
        h = h / 360;
        s = s / 100;
        v = v / 100;
        
        let r, g, b;
        
        if (s === 0) {
            // 無飽和度時為灰色
            r = g = b = v;
        } else {
            const i = Math.floor(h * 6);
            const f = h * 6 - i;
            const p = v * (1 - s);
            const q = v * (1 - s * f);
            const t = v * (1 - s * (1 - f));
            
            switch (i % 6) {
                case 0: r = v; g = t; b = p; break;
                case 1: r = q; g = v; b = p; break;
                case 2: r = p; g = v; b = t; break;
                case 3: r = p; g = q; b = v; break;
                case 4: r = t; g = p; b = v; break;
                case 5: r = v; g = p; b = q; break;
            }
        }
        
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }
    
    /**
     * Generate human-readable color description
     * @param {Object} hsv - HSV color values
     * @returns {string} Color description
     */
    generateColorDescription(hsv) {
        const hueNames = [
            'Red', 'Orange', 'Yellow', 'Lime', 'Green', 'Cyan',
            'Blue', 'Purple', 'Magenta', 'Pink'
        ];
        
        const hueIndex = Math.floor(hsv.h / 36);
        const hueName = hueNames[hueIndex] || 'Red';
        
        const saturationDesc = hsv.s > 80 ? 'vivid' : hsv.s > 50 ? 'moderate' : 'muted';
        const brightnessDesc = hsv.v > 80 ? 'bright' : hsv.v > 50 ? 'medium' : 'dark';
        
        return `${brightnessDesc} ${saturationDesc} ${hueName}`;
    }
    
    /**
     * Set the musical scale for frequency mapping
     * @param {string} scaleName - Scale name
     */
    setScale(scaleName) {
        if (this.musicalScales[scaleName]) {
            this.currentScale = scaleName;
        }
    }
    
    /**
     * Set the base frequency for the scale
     * @param {number} frequency - Base frequency in Hz
     */
    setBaseFrequency(frequency) {
        this.baseFrequency = Math.max(100, Math.min(1000, frequency));
    }
    
    /**
     * Get available musical scales
     * @returns {Array} Array of scale names
     */
    getAvailableScales() {
        return Object.keys(this.musicalScales);
    }
    
    /**
     * Get current scale name
     * @returns {string} Current scale name
     */
    getCurrentScale() {
        return this.currentScale;
    }
    
    /**
     * Calculate harmonic frequency for a given base frequency and harmonic number
     * @param {number} baseFreq - Base frequency
     * @param {number} harmonic - Harmonic number (1 = fundamental, 2 = octave, etc.)
     * @returns {number} Harmonic frequency
     */
    getHarmonicFrequency(baseFreq, harmonic) {
        return baseFreq * harmonic;
    }
    
    /**
     * Generate chord frequencies for scan mode
     * @param {Array} pixels - Array of pixel data
     * @returns {Array} Array of frequency objects
     */
    generateChordFrequencies(pixels) {
        return pixels.map(pixel => {
            const audioParams = this.mapHsvToAudio(pixel.hsv);
            return {
                frequency: audioParams.frequency,
                volume: audioParams.volume,
                attack: audioParams.attack,
                release: audioParams.release,
                waveform: audioParams.waveform,
                pan: audioParams.pan,
                hsv: pixel.hsv
            };
        });
    }
}

// Export for use in other modules
window.HsvMapper = HsvMapper;
