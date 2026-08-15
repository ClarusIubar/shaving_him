/**
 * UI View: StatsHUDView
 * Renders gameplay statistics (score, timer, remaining hairs, progress bar, combo badge, brush/sound controls).
 */

export class StatsHUDView {
    constructor(doc = typeof document !== 'undefined' ? document : null) {
        this.doc = doc;
        if (!this.doc) {
            this.scoreEl = null;
            this.timerEl = null;
            this.remainEl = null;
            this.barFillEl = null;
            this.comboBadgeEl = null;
            this.comboValEl = null;
            this.soundToggleBtn = null;
            this.exportPngBtn = null;
            return;
        }

        this.scoreEl = this.doc.getElementById('scoreVal');
        this.timerEl = this.doc.getElementById('timerVal');
        this.remainEl = this.doc.getElementById('remainVal');
        this.barFillEl = this.doc.getElementById('progressBarFill');
        this.comboBadgeEl = this.doc.getElementById('comboBadge');
        this.comboValEl = this.doc.getElementById('comboVal');
        this.soundToggleBtn = this.doc.getElementById('soundToggleBtn');
        this.exportPngBtn = this.doc.getElementById('exportPngBtn');
    }

    update(snapshot) {
        if (!snapshot) return;
        const { score, timeLeft, remainingHairs, percentageCleared, comboCount = 1 } = snapshot;

        if (this.scoreEl) this.scoreEl.textContent = score;
        if (this.timerEl) this.timerEl.textContent = timeLeft;
        if (this.remainEl) this.remainEl.textContent = remainingHairs;
        if (this.barFillEl) this.barFillEl.style.width = `${percentageCleared}%`;

        if (this.comboValEl) this.comboValEl.textContent = comboCount;
        if (this.comboBadgeEl) {
            if (this.comboBadgeEl.classList) {
                if (comboCount > 1) {
                    this.comboBadgeEl.classList.add('active');
                } else {
                    this.comboBadgeEl.classList.remove('active');
                }
            }
            if (this.comboBadgeEl.style) {
                this.comboBadgeEl.style.display = comboCount > 1 ? 'inline-block' : 'none';
            }
        }
    }

    updateSoundUI(enabled) {
        if (this.soundToggleBtn) {
            this.soundToggleBtn.textContent = enabled ? '🔊 소리 켬' : '🔇 음소거';
        }
    }

    updateBrushSizeUI(radius) {
        if (!this.doc) return;
        const brushBtns = this.doc.querySelectorAll('.brush-btn');
        if (!brushBtns || typeof brushBtns.forEach !== 'function') return;

        brushBtns.forEach(btn => {
            if (!btn || !btn.classList) return;
            const rAttr = btn.getAttribute('data-radius');
            if (parseInt(rAttr, 10) === radius) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
}
