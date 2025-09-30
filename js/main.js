/**
 * Main Module for Split-Flap Display
 * Initializes and coordinates all modules
 */

import { display } from './display.js';
import { audioSystem } from './audio.js';
import { api } from './api.js';

/**
 * Toggle sound on/off
 */
window.toggleSound = function() {
    const currentState = audioSystem.isEnabled();
    audioSystem.setEnabled(!currentState);

    const button = document.getElementById('soundToggle');
    if (button) {
        if (!currentState) {
            button.textContent = '🔊 Sound';
            button.classList.remove('muted');
        } else {
            button.textContent = '🔇 Stumm';
            button.classList.add('muted');
        }
    }
};

/**
 * Create iOS audio unlock button
 */
function createAudioUnlockButton() {
    if (navigator.userAgent.includes('Safari') && navigator.userAgent.includes('Mobile')) {
        const button = document.createElement('div');
        button.id = 'ios-audio-unlock';
        button.innerHTML = '🔊 Touch to Enable Sound';
        button.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #ffd700, #ffed4e);
            color: #000;
            padding: 10px 20px;
            border-radius: 25px;
            font-weight: bold;
            cursor: pointer;
            z-index: 1000;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;

        button.addEventListener('touchstart', function() {
            audioSystem.init();
            button.style.display = 'none';
        });

        document.body.appendChild(button);

        // Hide button after 10 seconds
        setTimeout(() => {
            if (button.parentNode) {
                button.style.display = 'none';
            }
        }, 10000);
    }
}

/**
 * Show default welcome sequence
 */
function showWelcomeSequence() {
    // Only show if no URL params
    if (!window.location.search) {
        setTimeout(() => {
            display.updateLine(1, 'SPLIT FLAP', 0);
            setTimeout(() => {
                display.updateLine(1, 'BEREIT', 0);
            }, 2000);
        }, 800);
    }
}

/**
 * Initialize the application
 */
function init() {
    console.log('🛩️ Split-Flap Display initializing...');

    // Initialize display
    display.initialize();
    console.log('✓ Display initialized');

    // Initialize audio
    const audioEnabled = audioSystem.tryEnableImmediately();
    if (!audioEnabled) {
        audioSystem.setupUserInteractionListeners();
    }
    console.log('✓ Audio system initialized');

    // Initialize API handlers
    api.initialize();
    console.log('✓ API initialized');

    // Create iOS audio unlock button if needed
    createAudioUnlockButton();

    // Show welcome sequence
    showWelcomeSequence();

    console.log('🚀 Split-Flap Display ready!');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}