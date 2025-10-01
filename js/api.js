/**
 * API Module for Split-Flap Display
 * Handles URL parameters, server polling, PostMessage, and JavaScript API
 */

import { display } from './display.js';
import { audioSystem } from './audio.js';
import { config } from './config.js';

class API {
    constructor() {
        this.pollingInterval = 500; // ms
        this.pollingActive = false;
        this.websocket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000; // ms
        this.useWebSocket = true; // Try WebSocket first
    }

    /**
     * Initialize API handlers
     */
    initialize() {
        this.handleURLParams();
        this.setupPostMessageAPI();
        this.setupJavaScriptAPI();
        this.connectToServer();
    }

    /**
     * Handle URL parameters
     */
    handleURLParams() {
        const params = new URLSearchParams(window.location.search);

        // Check sound parameter
        if (params.has('sound')) {
            const soundParam = params.get('sound').toLowerCase();
            const soundEnabled = soundParam !== 'false' && soundParam !== '0' && soundParam !== 'off';
            audioSystem.setEnabled(soundEnabled);

            // Update sound toggle button if it exists
            const soundToggle = document.getElementById('soundToggle');
            if (soundToggle) {
                soundToggle.textContent = soundEnabled ? '🔊 Sound' : '🔇 Stumm';
                soundToggle.classList.toggle('muted', !soundEnabled);
            }
        }

        // Handle display content
        if (params.has('line1') || params.has('line2') || params.has('line3') ||
            params.has('line4') || params.has('line5') || params.has('line6')) {
            const line1 = params.get('line1') || '';
            const line2 = params.get('line2') || '';
            const line3 = params.get('line3') || '';
            const line4 = params.get('line4') || '';
            const line5 = params.get('line5') || '';
            const line6 = params.get('line6') || '';

            setTimeout(() => {
                display.setDisplay(line1, line2, line3, line4, line5, line6);
            }, 1000);
        } else if (params.has('demo')) {
            setTimeout(() => {
                display.startDemo();
            }, 1000);
        } else if (params.has('clear')) {
            setTimeout(() => {
                display.clear();
            }, 1000);
        } else if (params.has('datetime')) {
            setTimeout(() => {
                display.startDateTimeMode();
            }, 1000);
        }
    }

    /**
     * Connect to server (try WebSocket first, fallback to polling)
     */
    connectToServer() {
        if (this.useWebSocket) {
            this.connectWebSocket();
        } else {
            this.pollingActive = true;
            this.pollCommands();
        }
    }

    /**
     * Connect via WebSocket
     */
    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;

        console.log('Connecting to WebSocket:', wsUrl);

        try {
            this.websocket = new WebSocket(wsUrl);

            this.websocket.onopen = () => {
                console.log('✓ WebSocket connected');
                this.reconnectAttempts = 0;
            };

            this.websocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleCommand(data);
            };

            this.websocket.onerror = (error) => {
                console.log('WebSocket error, falling back to polling');
                this.useWebSocket = false;
                this.connectToServer();
            };

            this.websocket.onclose = () => {
                console.log('WebSocket closed');
                if (this.useWebSocket && this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
                    setTimeout(() => this.connectWebSocket(), this.reconnectDelay);
                } else {
                    console.log('Switching to polling mode');
                    this.useWebSocket = false;
                    this.connectToServer();
                }
            };
        } catch (error) {
            console.log('WebSocket not supported, using polling');
            this.useWebSocket = false;
            this.connectToServer();
        }
    }

    /**
     * Handle command from server (WebSocket or polling)
     */
    handleCommand(data) {
        if (data.action === 'setDisplay') {
            console.log('Received setDisplay command:', data);
            display.setDisplay(
                data.line1 || '', data.line2 || '', data.line3 || '',
                data.line4 || '', data.line5 || '', data.line6 || ''
            );
        } else if (data.action === 'clear') {
            console.log('Received clear command');
            display.clear();
        } else if (data.action === 'demo') {
            console.log('Received demo command');
            display.startDemo();
        } else if (data.action === 'datetime') {
            console.log('Received datetime command:', data.enable);
            if (data.enable) {
                display.startDateTimeMode();
            } else {
                display.stopDateTimeMode();
            }
        } else if (data.action === 'state') {
            console.log('Received state:', data.data);
            // Could sync state here if needed
        }
    }

    /**
     * Poll server for commands (fallback)
     */
    pollCommands() {
        if (!this.pollingActive) return;

        fetch('/api/commands')
            .then(response => response.json())
            .then(data => {
                this.handleCommand(data);
            })
            .catch(error => {
                // Silently fail if server is not available
            })
            .finally(() => {
                // Continue polling
                setTimeout(() => this.pollCommands(), this.pollingInterval);
            });
    }

    /**
     * Stop polling
     */
    stopPolling() {
        this.pollingActive = false;
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
    }

    /**
     * Setup PostMessage API for iframe communication
     */
    setupPostMessageAPI() {
        window.addEventListener('message', (event) => {
            const { action, data } = event.data;

            switch (action) {
                case 'setDisplay':
                    display.setDisplay(
                        data.line1, data.line2, data.line3,
                        data.line4, data.line5, data.line6
                    );
                    break;
                case 'setLine':
                    display.setLine(data.lineIndex, data.text);
                    break;
                case 'clear':
                    display.clear();
                    break;
                case 'demo':
                    display.startDemo();
                    break;
                case 'datetime':
                    if (data.enable) {
                        display.startDateTimeMode();
                    } else {
                        display.stopDateTimeMode();
                    }
                    break;
                case 'toggleSound':
                    const currentState = audioSystem.isEnabled();
                    audioSystem.setEnabled(!currentState);
                    break;
                case 'getState':
                    event.source.postMessage({
                        type: 'splitflapState',
                        display: display.getCurrentDisplay(),
                        isAnimating: display.getIsAnimating(),
                        datetimeMode: display.isDateTimeModeActive(),
                        soundEnabled: audioSystem.isEnabled()
                    }, event.origin);
                    break;
                case 'customCommand':
                    // Handle custom commands from admin UI
                    const { command, params } = event.data;
                    if (command && window.splitflapAPI[command]) {
                        window.splitflapAPI[command](...(params || []));
                    }
                    break;
                case 'setFlipSpeed':
                    // Update flip speed
                    if (event.data.speed) {
                        config.setTiming('flipDuration', event.data.speed);
                        console.log(`Flip speed updated to ${event.data.speed}ms`);
                    }
                    break;
            }
        });
    }

    /**
     * Setup JavaScript API
     */
    setupJavaScriptAPI() {
        window.splitflapAPI = {
            // Set text on a specific line (0-5)
            setLine: (lineIndex, text) => {
                display.setLine(lineIndex, text);
            },

            // Set all lines at once
            setDisplay: (line1 = '', line2 = '', line3 = '', line4 = '', line5 = '', line6 = '') => {
                display.setDisplay(line1, line2, line3, line4, line5, line6);
            },

            // Clear all lines
            clear: () => {
                display.clear();
            },

            // Start demo sequence
            demo: () => {
                display.startDemo();
            },

            // Enable/disable datetime mode
            datetime: (enable = true) => {
                if (enable) {
                    display.startDateTimeMode();
                } else {
                    display.stopDateTimeMode();
                }
            },

            // Toggle sound
            toggleSound: () => {
                const currentState = audioSystem.isEnabled();
                audioSystem.setEnabled(!currentState);
            },

            // Get current display state
            getCurrentDisplay: () => {
                return display.getCurrentDisplay();
            },

            // Check if animation is running
            isAnimating: () => {
                return display.getIsAnimating();
            },

            // Check if datetime mode is active
            isDateTimeMode: () => {
                return display.isDateTimeModeActive();
            },

            // Check if sound is enabled
            isSoundEnabled: () => {
                return audioSystem.isEnabled();
            },

            // Start scrolling text on a specific line
            startScrolling: (lineIndex, text, loop = true) => {
                display.modes.startScrolling(lineIndex, text, loop);
            },

            // Start marquee text across all lines
            startMarquee: (text, loop = true) => {
                display.modes.startMarquee(text, loop);
            },

            // Stop all animated modes
            stopAllModes: () => {
                display.modes.stopAllModes();
            }
        };
    }
}

// Export singleton instance
export const api = new API();