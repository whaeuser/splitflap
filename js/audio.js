/**
 * Audio System for Split-Flap Display
 * Generates realistic mechanical click sounds using Web Audio API
 */

class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.soundEnabled = true;
    }

    /**
     * Initialize audio context
     */
    init() {
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log('Audio context initialized');
            } catch (e) {
                console.log('Audio not supported:', e);
                this.soundEnabled = false;
            }
        }
    }

    /**
     * Enable or disable sound
     */
    setEnabled(enabled) {
        this.soundEnabled = enabled;
        if (enabled && !this.audioContext) {
            this.init();
        }
    }

    /**
     * Check if sound is enabled
     */
    isEnabled() {
        return this.soundEnabled;
    }

    /**
     * Play mechanical click sound
     */
    playClick() {
        if (!this.soundEnabled) {
            return;
        }

        if (!this.audioContext) {
            console.log('No audio context available');
            return;
        }

        if (this.audioContext.state === 'suspended') {
            console.log('Audio context suspended, trying to resume...');
            this.audioContext.resume().then(() => {
                console.log('Audio context resumed');
                this.playActualSound();
            }).catch(e => {
                console.log('Failed to resume audio context:', e);
            });
            return;
        }

        this.playActualSound();
    }

    /**
     * Generate and play the actual click sound
     */
    playActualSound() {
        try {
            const now = this.audioContext.currentTime;

            // 1. Initial impact (sharp click)
            const impact = this.audioContext.createOscillator();
            const impactGain = this.audioContext.createGain();
            const impactFilter = this.audioContext.createBiquadFilter();

            impact.connect(impactFilter);
            impactFilter.connect(impactGain);
            impactGain.connect(this.audioContext.destination);

            impact.type = 'square';
            impact.frequency.setValueAtTime(800, now);
            impact.frequency.exponentialRampToValueAtTime(120, now + 0.015);

            impactFilter.type = 'highpass';
            impactFilter.frequency.setValueAtTime(400, now);

            impactGain.gain.setValueAtTime(0, now);
            impactGain.gain.linearRampToValueAtTime(0.12, now + 0.002);
            impactGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

            impact.start(now);
            impact.stop(now + 0.025);

            // 2. Mechanical resonance (metallic ring)
            const resonance = this.audioContext.createOscillator();
            const resonanceGain = this.audioContext.createGain();
            const resonanceFilter = this.audioContext.createBiquadFilter();

            resonance.connect(resonanceFilter);
            resonanceFilter.connect(resonanceGain);
            resonanceGain.connect(this.audioContext.destination);

            resonance.type = 'triangle';
            resonance.frequency.setValueAtTime(1800, now + 0.005);
            resonance.frequency.exponentialRampToValueAtTime(900, now + 0.04);

            resonanceFilter.type = 'bandpass';
            resonanceFilter.frequency.setValueAtTime(1500, now);
            resonanceFilter.Q.setValueAtTime(8, now);

            resonanceGain.gain.setValueAtTime(0, now + 0.005);
            resonanceGain.gain.linearRampToValueAtTime(0.06, now + 0.01);
            resonanceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

            resonance.start(now + 0.005);
            resonance.stop(now + 0.06);

            // 3. Damping noise (plastic/metal contact)
            const noise = this.audioContext.createOscillator();
            const noiseGain = this.audioContext.createGain();
            const noiseFilter = this.audioContext.createBiquadFilter();

            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(this.audioContext.destination);

            noise.type = 'sawtooth';
            noise.frequency.setValueAtTime(350, now + 0.01);
            noise.frequency.exponentialRampToValueAtTime(80, now + 0.05);

            noiseFilter.type = 'lowpass';
            noiseFilter.frequency.setValueAtTime(600, now);
            noiseFilter.Q.setValueAtTime(1, now);

            noiseGain.gain.setValueAtTime(0, now + 0.01);
            noiseGain.gain.linearRampToValueAtTime(0.04, now + 0.015);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

            noise.start(now + 0.01);
            noise.stop(now + 0.08);

            // 4. Subtle motor/mechanism sound
            const motor = this.audioContext.createOscillator();
            const motorGain = this.audioContext.createGain();
            const motorFilter = this.audioContext.createBiquadFilter();

            motor.connect(motorFilter);
            motorFilter.connect(motorGain);
            motorGain.connect(this.audioContext.destination);

            motor.type = 'sawtooth';
            motor.frequency.setValueAtTime(60, now);
            motor.frequency.linearRampToValueAtTime(40, now + 0.1);

            motorFilter.type = 'highpass';
            motorFilter.frequency.setValueAtTime(30, now);

            motorGain.gain.setValueAtTime(0, now);
            motorGain.gain.linearRampToValueAtTime(0.02, now + 0.02);
            motorGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

            motor.start(now);
            motor.stop(now + 0.12);

        } catch (e) {
            console.log('Sound generation failed:', e);
        }
    }

    /**
     * Try to enable audio immediately (for desktop browsers)
     */
    tryEnableImmediately() {
        if (!this.soundEnabled) return;

        // iOS Safari requires user interaction
        if (navigator.userAgent.includes('Safari') && navigator.userAgent.includes('Mobile')) {
            console.log('iOS Safari detected, waiting for user interaction');
            return false;
        }

        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log('Audio context created immediately');
            }

            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(() => {
                    console.log('Audio context resumed successfully');
                }).catch(() => {
                    console.log('Audio context resume failed, waiting for user interaction');
                });
            }
            return true;
        } catch (e) {
            console.log('Immediate audio failed:', e.message);
            return false;
        }
    }

    /**
     * Setup listeners for user interaction to enable audio
     */
    setupUserInteractionListeners() {
        const enableAudioOnInteraction = (event) => {
            console.log('User interaction detected:', event.type);

            if (!this.audioContext) {
                try {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    console.log('Audio context created on user interaction');
                } catch (e) {
                    console.log('Failed to create audio context:', e);
                    return;
                }
            }

            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(() => {
                    console.log('Audio context resumed on user interaction');
                    // Test sound
                    setTimeout(() => {
                        if (this.soundEnabled) {
                            this.playActualSound();
                        }
                    }, 100);
                }).catch((e) => {
                    console.log('Failed to resume audio context:', e);
                });
            }

            // Remove listeners after successful activation
            document.removeEventListener('click', enableAudioOnInteraction);
            document.removeEventListener('keydown', enableAudioOnInteraction);
            document.removeEventListener('touchstart', enableAudioOnInteraction);
            document.removeEventListener('touchend', enableAudioOnInteraction);

            console.log('Audio interaction listeners removed');
        };

        // Add comprehensive interaction listeners
        document.addEventListener('click', enableAudioOnInteraction, { passive: true });
        document.addEventListener('keydown', enableAudioOnInteraction, { passive: true });
        document.addEventListener('touchstart', enableAudioOnInteraction, { passive: true });
        document.addEventListener('touchend', enableAudioOnInteraction, { passive: true });

        console.log('Audio interaction listeners added');
    }
}

// Export singleton instance
export const audioSystem = new AudioSystem();