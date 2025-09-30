/**
 * Display Modes Module for Split-Flap Display
 * Advanced display modes: Scrolling, Marquee, Blink, Fade
 */

import { config } from './config.js';

export class DisplayModes {
    constructor(display) {
        this.display = display;
        this.activeMode = null;
        this.modeIntervals = new Map();
    }

    /**
     * Stop all active modes
     */
    stopAllModes() {
        // Stop all intervals
        for (const [name, interval] of this.modeIntervals) {
            clearInterval(interval);
            console.log(`Stopped mode: ${name}`);
        }
        this.modeIntervals.clear();
        this.activeMode = null;
    }

    /**
     * Scrolling mode - scroll long text horizontally
     */
    startScrolling(lineIndex, text, loop = true) {
        this.stopAllModes();

        if (text.length <= 16) {
            // Text fits, just display it
            this.display.updateLine(lineIndex, text);
            return;
        }

        this.activeMode = 'scrolling';
        let position = 0;
        const paddedText = text + '    '; // Add spacing at end

        const scroll = () => {
            const visible = paddedText.substring(position, position + 16).padEnd(16, ' ');
            this.display.updateLine(lineIndex, visible, 0);

            position++;
            if (position >= paddedText.length) {
                if (loop) {
                    position = 0;
                } else {
                    this.stopAllModes();
                }
            }
        };

        // Initial display
        scroll();

        // Start scrolling
        const interval = setInterval(scroll, config.getTiming('scrollSpeed'));
        this.modeIntervals.set('scrolling', interval);
    }

    /**
     * Marquee mode - continuous scrolling text across all lines
     */
    startMarquee(text, loop = true) {
        this.stopAllModes();

        this.activeMode = 'marquee';

        // Create long scrolling text with spacing
        const spacing = '        '; // 8 spaces between repeats
        const scrollText = loop ? text + spacing : text + spacing.repeat(6);

        let position = 0;
        const totalChars = 6 * 16; // All 6 lines

        const scroll = () => {
            // Distribute text across all 6 lines
            for (let lineIndex = 0; lineIndex < 6; lineIndex++) {
                const start = position + (lineIndex * 16);
                let visible = '';

                for (let i = 0; i < 16; i++) {
                    const charIndex = (start + i) % scrollText.length;
                    visible += scrollText[charIndex];
                }

                this.display.updateLine(lineIndex, visible, 0);
            }

            position++;
            if (!loop && position >= scrollText.length) {
                this.stopAllModes();
            }
        };

        // Initial display
        scroll();

        // Start marquee
        const interval = setInterval(scroll, config.getTiming('marqueeSpeed'));
        this.modeIntervals.set('marquee', interval);
    }

    /**
     * Blink mode - blink specific lines
     */
    startBlink(lineIndices, text = null) {
        this.stopAllModes();

        this.activeMode = 'blink';

        // Store original text
        const originalTexts = lineIndices.map(idx => this.display.currentTexts[idx]);
        let visible = true;

        const blink = () => {
            visible = !visible;

            lineIndices.forEach((idx, i) => {
                if (visible) {
                    this.display.updateLine(idx, text || originalTexts[i], 0);
                } else {
                    this.display.updateLine(idx, '', 0);
                }
            });
        };

        const interval = setInterval(blink, config.getTiming('blinkInterval'));
        this.modeIntervals.set('blink', interval);
    }

    /**
     * Wave effect - animate text appearing character by character across lines
     */
    async startWave(texts) {
        this.stopAllModes();

        this.activeMode = 'wave';

        // Ensure we have 6 texts
        const paddedTexts = [...texts];
        while (paddedTexts.length < 6) paddedTexts.push('');

        // Clear all lines first
        for (let i = 0; i < 6; i++) {
            this.display.updateLine(i, '', 0);
        }

        // Reveal character by character
        for (let charPos = 0; charPos < 16; charPos++) {
            await new Promise(resolve => setTimeout(resolve, 50));

            for (let lineIdx = 0; lineIdx < 6; lineIdx++) {
                const text = paddedTexts[lineIdx];
                const visible = text.substring(0, charPos + 1).padEnd(16, ' ');
                this.display.updateLine(lineIdx, visible, 0);
            }
        }

        this.activeMode = null;
    }

    /**
     * Typewriter effect - type text one character at a time
     */
    async startTypewriter(lineIndex, text, cursorChar = '_') {
        this.stopAllModes();

        this.activeMode = 'typewriter';

        // Clear line
        this.display.updateLine(lineIndex, '', 0);

        // Type character by character
        for (let i = 0; i <= text.length && i < 16; i++) {
            await new Promise(resolve => setTimeout(resolve, 100));

            const visible = text.substring(0, i);
            const cursor = i < text.length && i < 16 ? cursorChar : '';
            this.display.updateLine(lineIndex, visible + cursor, 0);
        }

        // Remove cursor
        await new Promise(resolve => setTimeout(resolve, 200));
        this.display.updateLine(lineIndex, text, 0);

        this.activeMode = null;
    }

    /**
     * Rainbow effect - cycle through different text on a line
     */
    startRainbow(lineIndex, texts, delay = 1000) {
        this.stopAllModes();

        this.activeMode = 'rainbow';
        let currentIndex = 0;

        const cycle = () => {
            this.display.updateLine(lineIndex, texts[currentIndex], 0);
            currentIndex = (currentIndex + 1) % texts.length;
        };

        // Initial display
        cycle();

        // Start cycling
        const interval = setInterval(cycle, delay);
        this.modeIntervals.set('rainbow', interval);
    }

    /**
     * Countdown mode - countdown from a number
     */
    startCountdown(lineIndex, from, to = 0, step = 1, interval = 1000) {
        this.stopAllModes();

        this.activeMode = 'countdown';
        let current = from;

        const count = () => {
            this.display.updateLine(lineIndex, current.toString(), 0);

            if (step > 0) {
                current -= step;
                if (current < to) {
                    this.stopAllModes();
                    // Optional: trigger event
                    console.log('Countdown finished!');
                }
            } else {
                current += Math.abs(step);
                if (current > to) {
                    this.stopAllModes();
                }
            }
        };

        // Initial display
        count();

        // Start countdown
        const countInterval = setInterval(count, interval);
        this.modeIntervals.set('countdown', countInterval);
    }

    /**
     * Get active mode
     */
    getActiveMode() {
        return this.activeMode;
    }

    /**
     * Check if a mode is active
     */
    isActive() {
        return this.activeMode !== null;
    }
}

export default DisplayModes;