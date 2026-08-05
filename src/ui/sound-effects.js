/**
 * Interface Layer: SoundEffects
 * Synthesizes real-time razor shave scratch sound, combo chimes, and win fanfare using Web Audio API.
 * Zero external audio file dependencies (0B asset load).
 */
export class SoundEffects {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.noiseBuffer = null;
    }

    init() {
        if (typeof window === 'undefined') return;
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
                this.createNoiseBuffer();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
    }

    createNoiseBuffer() {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 0.05; // 50ms buffer
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1; // White noise
        }
        this.noiseBuffer = buffer;
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    playShaveSound() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx || !this.noiseBuffer) return;

        try {
            const whiteNoise = this.ctx.createBufferSource();
            whiteNoise.buffer = this.noiseBuffer;

            // Bandpass filter to make it sound like crisp razor friction
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(2200, this.ctx.currentTime);
            filter.Q.setValueAtTime(3.0, this.ctx.currentTime);

            const gain = this.ctx.createGain();
            const now = this.ctx.currentTime;
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

            whiteNoise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            whiteNoise.start(now);
            whiteNoise.stop(now + 0.04);
        } catch (e) {
            // Silence any audio context policy errors
        }
    }

    playComboSound(comboCount = 2) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            const baseFreq = 523.25; // C5 note
            const pitchShift = Math.min(comboCount * 45, 600);
            const freq = baseFreq + pitchShift;

            const now = this.ctx.currentTime;
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.12);
        } catch (e) {
            // Silence any audio context policy errors
        }
    }

    playWinSound() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        try {
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            notes.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const now = this.ctx.currentTime + idx * 0.1;

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now);

                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now);
                osc.stop(now + 0.25);
            });
        } catch (e) {
            // Silence any audio context policy errors
        }
    }
}
