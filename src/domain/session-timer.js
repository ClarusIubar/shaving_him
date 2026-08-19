/**
 * Pure Domain Service: SessionTimer
 * Encapsulates setInterval ticking, unref handling, and start/stop state management.
 */
export class SessionTimer {
    constructor(intervalMs = 1000) {
        this.intervalMs = intervalMs;
        this.timerId = null;
    }

    start(onTick) {
        this.stop();
        if (typeof onTick !== 'function') return;
        this.timerId = setInterval(onTick, this.intervalMs);
        if (this.timerId && typeof this.timerId.unref === 'function') {
            this.timerId.unref();
        }
    }

    stop() {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    }

    get isRunning() {
        return this.timerId !== null;
    }
}
