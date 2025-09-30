/**
 * MQTT Plugin for Split-Flap Display
 * Connect to MQTT broker for IoT integration
 *
 * Requires: MQTT.js library (https://github.com/mqttjs/MQTT.js)
 * Include in HTML: <script src="https://unpkg.com/mqtt/dist/mqtt.min.js"></script>
 */

import { Plugin } from '../js/plugins.js';

export class MQTTPlugin extends Plugin {
    constructor() {
        super('mqtt', '1.0.0', 'MQTT broker integration for IoT');
        this.client = null;
        this.config = {
            broker: 'ws://localhost:9001',
            topics: {
                display: 'splitflap/display',
                command: 'splitflap/command',
                status: 'splitflap/status'
            },
            clientId: `splitflap_${Math.random().toString(16).substr(2, 8)}`,
            username: null,
            password: null
        };
    }

    async init() {
        if (typeof mqtt === 'undefined') {
            console.error('MQTT.js library not loaded. Include: <script src="https://unpkg.com/mqtt/dist/mqtt.min.js"></script>');
            throw new Error('MQTT.js not available');
        }
        console.log('MQTT plugin initialized');
    }

    async enable() {
        await this.connect();
        console.log('MQTT plugin enabled');
    }

    async disable() {
        await this.disconnect();
        console.log('MQTT plugin disabled');
    }

    /**
     * Configure MQTT connection
     */
    configure(config) {
        this.config = { ...this.config, ...config };
    }

    /**
     * Connect to MQTT broker
     */
    async connect() {
        if (this.client) {
            console.warn('MQTT already connected');
            return;
        }

        return new Promise((resolve, reject) => {
            const options = {
                clientId: this.config.clientId,
                clean: true
            };

            if (this.config.username) {
                options.username = this.config.username;
            }
            if (this.config.password) {
                options.password = this.config.password;
            }

            try {
                this.client = mqtt.connect(this.config.broker, options);

                this.client.on('connect', () => {
                    console.log('✓ MQTT connected to', this.config.broker);
                    this.subscribe();
                    this.publishStatus('online');
                    resolve();
                });

                this.client.on('error', (error) => {
                    console.error('MQTT error:', error);
                    reject(error);
                });

                this.client.on('message', (topic, message) => {
                    this.handleMessage(topic, message.toString());
                });

                this.client.on('close', () => {
                    console.log('MQTT connection closed');
                });

            } catch (error) {
                console.error('MQTT connect failed:', error);
                reject(error);
            }
        });
    }

    /**
     * Disconnect from MQTT broker
     */
    async disconnect() {
        if (this.client) {
            this.publishStatus('offline');
            this.client.end();
            this.client = null;
        }
    }

    /**
     * Subscribe to topics
     */
    subscribe() {
        if (!this.client) return;

        const topics = [
            this.config.topics.display,
            this.config.topics.command
        ];

        topics.forEach(topic => {
            this.client.subscribe(topic, (err) => {
                if (err) {
                    console.error(`Failed to subscribe to ${topic}:`, err);
                } else {
                    console.log(`✓ Subscribed to ${topic}`);
                }
            });
        });
    }

    /**
     * Handle incoming MQTT message
     */
    handleMessage(topic, message) {
        console.log(`MQTT message on ${topic}:`, message);

        try {
            const data = JSON.parse(message);

            if (topic === this.config.topics.display) {
                // Set display content
                if (window.splitflapAPI) {
                    window.splitflapAPI.setDisplay(
                        data.line1 || '',
                        data.line2 || '',
                        data.line3 || '',
                        data.line4 || '',
                        data.line5 || '',
                        data.line6 || ''
                    );
                }
            } else if (topic === this.config.topics.command) {
                // Execute command
                this.executeCommand(data);
            }

        } catch (error) {
            console.error('Failed to parse MQTT message:', error);
        }
    }

    /**
     * Execute command from MQTT
     */
    executeCommand(data) {
        if (!window.splitflapAPI) return;

        switch (data.action) {
            case 'clear':
                window.splitflapAPI.clear();
                break;
            case 'demo':
                window.splitflapAPI.demo();
                break;
            case 'datetime':
                window.splitflapAPI.datetime(data.enable);
                break;
            case 'setLine':
                window.splitflapAPI.setLine(data.lineIndex, data.text);
                break;
            default:
                console.warn('Unknown MQTT command:', data.action);
        }
    }

    /**
     * Publish status
     */
    publishStatus(status) {
        if (!this.client) return;

        const message = JSON.stringify({
            status,
            timestamp: Date.now(),
            clientId: this.config.clientId
        });

        this.client.publish(this.config.topics.status, message, { retain: true });
    }

    /**
     * Publish display state
     */
    publishDisplayState(state) {
        if (!this.client) return;

        const message = JSON.stringify({
            ...state,
            timestamp: Date.now()
        });

        this.client.publish(this.config.topics.status + '/display', message);
    }

    /**
     * Check if connected
     */
    isConnected() {
        return this.client && this.client.connected;
    }
}

// Create instance
export const mqttPlugin = new MQTTPlugin();