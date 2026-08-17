/**
 * UI View: StatsHUDView
 * Renders gameplay statistics (score, timer, remaining hairs, progress bar, combo badge, brush/sound controls).
 */

export class StatsHUDView {
    constructor(doc) {
        if (!doc) {
            throw new Error('StatsHUDView: document is required');
        }
        this.doc = doc;

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
        const { score, timeLeft, remainingHairs, percentageCleared, comboCount } = snapshot;

        this.scoreEl.textContent = score;
        this.timerEl.textContent = timeLeft;
        this.remainEl.textContent = remainingHairs;
        this.barFillEl.style.width = `${percentageCleared}%`;

        this.comboValEl.textContent = comboCount;
        const isComboActive = comboCount > 1;
        this.comboBadgeEl.classList.toggle('active', isComboActive);
        this.comboBadgeEl.style.display = isComboActive ? 'inline-block' : 'none';
    }

    updateSoundUI(enabled) {
        this.soundToggleBtn.textContent = enabled ? '🔊 소리 켬' : '🔇 음소거';
    }

    updateBrushSizeUI(radius) {
        const brushBtns = this.doc.querySelectorAll('.brush-btn');
        brushBtns.forEach(btn => {
            const rAttr = btn.getAttribute('data-radius');
            if (parseInt(rAttr, 10) === radius) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
}
