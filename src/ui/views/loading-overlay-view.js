/**
 * UI View: LoadingOverlayView
 * Renders modal loading spinner and progress bar with safe DOM manipulation (XSS-safe).
 */

export class LoadingOverlayView {
    constructor(doc = typeof document !== 'undefined' ? document : null) {
        this.doc = doc;
        this.loadingEl = this.doc ? this.doc.getElementById('loadingScreen') : null;
    }

    show(message = '스테이지 생성 중...', percentage = 0) {
        if (!this.doc) return;
        if (!this.loadingEl) {
            this.loadingEl = this.doc.createElement('div');
            this.loadingEl.id = 'loadingScreen';
            this.loadingEl.className = 'loading-screen';
            this.loadingEl.innerHTML = `
                <div class="spinner"></div>
                <div id="loadingMsg" style="font-weight:bold;color:#4ecdc4;font-size:15px;"></div>
                <div style="width:280px;height:8px;background:#252a38;border-radius:4px;overflow:hidden;margin-top:4px;">
                    <div id="loadingBarFill" style="height:100%;background:linear-gradient(90deg, #ff6b6b, #4ecdc4);transition:width 0.2s;"></div>
                </div>
            `;
            if (this.doc.body) {
                this.doc.body.appendChild(this.loadingEl);
            }
        } else {
            this.loadingEl.style.display = 'flex';
        }

        const msgNode = this.doc.getElementById('loadingMsg');
        const fillNode = this.doc.getElementById('loadingBarFill');
        if (msgNode) msgNode.textContent = message;
        if (fillNode) fillNode.style.width = `${percentage}%`;
    }

    hide() {
        if (this.loadingEl) this.loadingEl.style.display = 'none';
    }
}
