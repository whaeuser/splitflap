/**
 * Configuration Module for Split-Flap Display
 * Centralized configuration and customization
 */

export class Config {
    constructor() {
        // Character sets
        this.characterSets = {
            basic: ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:-./',
            german: ' ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜß0123456789:-.',
            french: ' ABCDEFGHIJKLMNOPQRSTUVWXYZÀÂÆÇÉÈÊËÎÏÔŒÙÛÜŸ0123456789:-.',
            extended: ' ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜßÀÂÆÇÉÈÊËÎÏÔŒÙÛÜŸ0123456789:-./!?@#$%&*+=',
            custom: '' // Can be set by user
        };

        // Active character set
        this.activeCharacterSet = 'basic';

        // Animation timing (ms)
        this.timing = {
            flipDuration: 300,        // Duration of single flip
            characterStagger: 80,     // Delay between characters
            lineStagger: 200,         // Delay between lines
            flipPause: 50,           // Pause between intermediate flips
            scrollSpeed: 100,        // Scroll speed (ms per character)
            marqueeSpeed: 80,        // Marquee speed
            blinkInterval: 500       // Blink interval
        };

        // Display configuration
        this.display = {
            lines: 6,
            charactersPerLine: 16,
            maxQueueSize: 10        // Max queued animations
        };

        // Feature flags
        this.features = {
            animationQueue: true,
            requestAnimationFrame: true,
            pluginSystem: true
        };
    }

    /**
     * Get active character set
     */
    getCharacters() {
        if (this.activeCharacterSet === 'custom' && this.characterSets.custom) {
            return this.characterSets.custom;
        }
        return this.characterSets[this.activeCharacterSet] || this.characterSets.basic;
    }

    /**
     * Set character set
     */
    setCharacterSet(name) {
        if (this.characterSets[name] !== undefined) {
            this.activeCharacterSet = name;
            return true;
        }
        return false;
    }

    /**
     * Set custom character set
     */
    setCustomCharacters(chars) {
        this.characterSets.custom = chars;
        this.activeCharacterSet = 'custom';
    }

    /**
     * Update timing
     */
    setTiming(key, value) {
        if (this.timing[key] !== undefined) {
            this.timing[key] = value;
            return true;
        }
        return false;
    }

    /**
     * Get timing value
     */
    getTiming(key) {
        return this.timing[key];
    }

    /**
     * Export configuration
     */
    export() {
        return {
            activeCharacterSet: this.activeCharacterSet,
            characterSets: { ...this.characterSets },
            timing: { ...this.timing },
            display: { ...this.display },
            features: { ...this.features }
        };
    }

    /**
     * Import configuration
     */
    import(config) {
        if (config.activeCharacterSet) this.activeCharacterSet = config.activeCharacterSet;
        if (config.characterSets) this.characterSets = { ...this.characterSets, ...config.characterSets };
        if (config.timing) this.timing = { ...this.timing, ...config.timing };
        if (config.display) this.display = { ...this.display, ...config.display };
        if (config.features) this.features = { ...this.features, ...config.features };
    }
}

// Export singleton instance
export const config = new Config();