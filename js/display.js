/**
 * Display Module for Split-Flap Display
 * Handles character animations and display state
 */

import { audioSystem } from './audio.js';

const CHARACTERS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:-./';

class SplitFlapDisplay {
    constructor() {
        this.currentTexts = ['', '', '', '', '', ''];
        this.isAnimating = false;
        this.datetimeMode = false;
        this.datetimeInterval = null;
    }

    /**
     * Initialize the display with empty characters
     */
    initialize() {
        for (let lineNum = 1; lineNum <= 6; lineNum++) {
            const line = document.getElementById(`line${lineNum}`);
            line.innerHTML = '';

            for (let i = 0; i < 16; i++) {
                line.appendChild(this.createFlipChar(' '));
            }
        }
        this.currentTexts = ['', '', '', '', '', ''];
    }

    /**
     * Create a flip character element
     */
    createFlipChar(initialChar = ' ') {
        const char = document.createElement('div');
        char.className = 'flip-char';

        const topHalf = document.createElement('div');
        topHalf.className = 'flip-half flip-top';

        const topContent = document.createElement('div');
        topContent.className = 'flip-char-content';
        topContent.textContent = initialChar;
        topHalf.appendChild(topContent);

        const bottomHalf = document.createElement('div');
        bottomHalf.className = 'flip-half flip-bottom';

        const bottomContent = document.createElement('div');
        bottomContent.className = 'flip-char-content';
        bottomContent.textContent = initialChar;
        bottomHalf.appendChild(bottomContent);

        char.appendChild(topHalf);
        char.appendChild(bottomHalf);

        return char;
    }

    /**
     * Flip a single character to a new value
     */
    flipCharacter(charElement, newChar, delay = 0) {
        setTimeout(() => {
            const currentChar = charElement.querySelector('.flip-top .flip-char-content').textContent;

            // Skip if already showing the correct character
            if (currentChar === newChar) return;

            // Create mechanical sequence with intermediate characters
            const sequence = this.generateFlipSequence(currentChar, newChar);

            // Add visual effect
            charElement.classList.add('clicking');

            // Execute flip sequence
            this.executeFlipSequence(charElement, sequence, () => {
                charElement.classList.remove('clicking');
            });

        }, delay);
    }

    /**
     * Generate flip sequence from one character to another
     */
    generateFlipSequence(fromChar, toChar) {
        const fromIndex = CHARACTERS.indexOf(fromChar);
        const toIndex = CHARACTERS.indexOf(toChar);

        // If same character, no animation needed
        if (fromIndex === toIndex) return [];

        const sequence = [];
        let currentIndex = fromIndex;

        // Determine direction (forward or backward through alphabet)
        const forward = (toIndex - fromIndex + CHARACTERS.length) % CHARACTERS.length;
        const backward = (fromIndex - toIndex + CHARACTERS.length) % CHARACTERS.length;
        const useForward = forward <= backward;

        // Generate intermediate steps (3-6 flips for realism)
        const steps = Math.min(Math.max(3, Math.abs(toIndex - fromIndex)), 6);

        for (let i = 1; i <= steps; i++) {
            if (useForward) {
                currentIndex = (fromIndex + Math.floor((forward * i) / steps)) % CHARACTERS.length;
            } else {
                currentIndex = (fromIndex - Math.floor((backward * i) / steps) + CHARACTERS.length) % CHARACTERS.length;
            }

            sequence.push({
                char: CHARACTERS[currentIndex],
                duration: i === steps ? 300 : 150, // Last flip is slower
                isLast: i === steps
            });
        }

        // Ensure final character is correct
        if (sequence[sequence.length - 1].char !== toChar) {
            sequence[sequence.length - 1].char = toChar;
        }

        return sequence;
    }

    /**
     * Execute a flip sequence
     */
    executeFlipSequence(charElement, sequence, onComplete) {
        if (sequence.length === 0) {
            onComplete();
            return;
        }

        let currentStep = 0;

        const doNextFlip = () => {
            if (currentStep >= sequence.length) {
                onComplete();
                return;
            }

            const step = sequence[currentStep];
            const topHalf = charElement.querySelector('.flip-top');
            const bottomHalf = charElement.querySelector('.flip-bottom');
            const topContent = topHalf.querySelector('.flip-char-content');
            const bottomContent = bottomHalf.querySelector('.flip-char-content');

            // Play click sound
            audioSystem.playClick();

            // Update the bottom content to new character
            bottomContent.textContent = step.char;

            // Start flip animation
            topHalf.style.animation = `flipTop ${step.duration}ms ease-in forwards`;
            bottomHalf.style.animation = `flipBottom ${step.duration}ms ease-out ${step.duration}ms forwards`;
            bottomHalf.style.transform = 'rotateX(90deg)';

            // After flip completes, update top half and continue
            setTimeout(() => {
                topContent.textContent = step.char;

                // Reset animations
                topHalf.style.animation = '';
                bottomHalf.style.animation = '';
                bottomHalf.style.transform = '';

                currentStep++;

                // Small pause between flips
                setTimeout(doNextFlip, step.isLast ? 0 : 50);

            }, step.duration * 2);
        };

        doNextFlip();
    }

    /**
     * Update a single line
     */
    updateLine(lineIndex, newText, startDelay = 0) {
        const line = document.getElementById(`line${lineIndex + 1}`);
        const chars = line.querySelectorAll('.flip-char');

        newText = newText.toUpperCase().padEnd(16, ' ').substring(0, 16);
        const oldText = this.currentTexts[lineIndex].padEnd(16, ' ').substring(0, 16);

        // Only flip characters that actually changed
        chars.forEach((char, index) => {
            if (newText[index] !== oldText[index]) {
                this.flipCharacter(char, newText[index], startDelay + index * 80);
            }
        });

        this.currentTexts[lineIndex] = newText.trimEnd();
    }

    /**
     * Set all lines at once
     */
    setDisplay(line1 = '', line2 = '', line3 = '', line4 = '', line5 = '', line6 = '') {
        if (this.isAnimating) return;

        audioSystem.init(); // Ensure audio works
        this.isAnimating = true;

        // Skip line 0 if datetime mode is active
        if (!this.datetimeMode) {
            this.updateLine(0, line1, 0);
        }

        this.updateLine(1, line2, 200);
        this.updateLine(2, line3, 400);
        this.updateLine(3, line4, 600);
        this.updateLine(4, line5, 800);
        this.updateLine(5, line6, 1000);

        setTimeout(() => {
            this.isAnimating = false;
        }, 3500);
    }

    /**
     * Set a specific line
     */
    setLine(lineIndex, text) {
        if (lineIndex >= 0 && lineIndex <= 5 && !this.isAnimating) {
            // Prevent overwriting line 0 if datetime mode is active
            if (lineIndex === 0 && this.datetimeMode) {
                console.warn('Cannot overwrite line 0 while datetime mode is active');
                return;
            }
            this.updateLine(lineIndex, text);
        }
    }

    /**
     * Clear all lines
     */
    clear() {
        if (this.isAnimating) return;

        if (this.datetimeMode) {
            this.stopDateTimeMode();
        }

        audioSystem.init();
        this.isAnimating = true;

        for (let i = 0; i < 6; i++) {
            this.updateLine(i, '');
        }

        setTimeout(() => {
            this.isAnimating = false;
        }, 2500);
    }

    /**
     * Start demo sequence
     */
    startDemo() {
        if (this.isAnimating) return;

        if (this.datetimeMode) {
            this.stopDateTimeMode();
        }

        audioSystem.init();
        this.isAnimating = true;

        const demoSequence = [
            ['FLUGHAFEN', 'MUENCHEN', 'TERMINAL 2', 'ABFLUG', 'GATE A15', '12:30'],
            ['LH 441', 'NACH FRANKFURT', 'BOARDING NOW', 'GATE B7', 'PÜNKTLICH', ''],
            ['AIR FRANCE', 'NACH PARIS', 'VERSPAETUNG', '+25 MINUTEN', 'GATE C3', '14:45'],
            ['LUFTHANSA', 'NACH BERLIN', 'LETZTER AUFRUF', 'GATE A2', 'SOFORT', ''],
            ['GUTEN FLUG', 'AUF WIEDERSEHEN', 'DANKE', 'SCHÖNEN TAG', '', '']
        ];

        let step = 0;

        const nextDemoStep = () => {
            if (step < demoSequence.length) {
                const [line1, line2, line3, line4, line5, line6] = demoSequence[step];

                this.updateLine(0, line1, 0);
                this.updateLine(1, line2, 200);
                this.updateLine(2, line3, 400);
                this.updateLine(3, line4, 600);
                this.updateLine(4, line5, 800);
                this.updateLine(5, line6, 1000);

                step++;
                setTimeout(nextDemoStep, 5000);
            } else {
                setTimeout(() => {
                    this.isAnimating = false;
                }, 2000);
            }
        };

        nextDemoStep();
    }

    /**
     * Format current date and time
     */
    formatDateTime() {
        const now = new Date();

        // Format date as DD.MM.YYYY
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const dateStr = `${day}.${month}.${year}`;

        // Format time as HH:MM:SS
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const timeStr = `${hours}:${minutes}:${seconds}`;

        // Create top line with date left, time right
        const padding = 16 - dateStr.length - timeStr.length;
        const topLine = dateStr + ' '.repeat(Math.max(1, padding)) + timeStr;

        return topLine.substring(0, 16);
    }

    /**
     * Start datetime display mode
     */
    startDateTimeMode() {
        if (this.datetimeInterval) {
            clearInterval(this.datetimeInterval);
        }

        this.datetimeMode = true;
        console.log('DateTime mode enabled');

        // Update immediately
        this.updateDateTimeDisplay();

        // Update every second
        this.datetimeInterval = setInterval(() => this.updateDateTimeDisplay(), 1000);
    }

    /**
     * Stop datetime display mode
     */
    stopDateTimeMode() {
        if (this.datetimeInterval) {
            clearInterval(this.datetimeInterval);
            this.datetimeInterval = null;
        }

        this.datetimeMode = false;
        console.log('DateTime mode disabled');
    }

    /**
     * Update datetime display
     */
    updateDateTimeDisplay() {
        if (!this.datetimeMode) return;

        const dateTimeStr = this.formatDateTime();

        // Only update if different
        if (this.currentTexts[0] !== dateTimeStr) {
            this.updateLine(0, dateTimeStr, 0);
        }
    }

    /**
     * Get current display state
     */
    getCurrentDisplay() {
        return [...this.currentTexts];
    }

    /**
     * Check if animating
     */
    getIsAnimating() {
        return this.isAnimating;
    }

    /**
     * Check if datetime mode is active
     */
    isDateTimeModeActive() {
        return this.datetimeMode;
    }
}

// Export singleton instance
export const display = new SplitFlapDisplay();