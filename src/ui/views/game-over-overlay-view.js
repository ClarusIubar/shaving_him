/**
 * UI View: GameOverOverlayView
 * Displays endgame victory/defeat modal overlay with score breakdown and restart trigger.
 */

export class GameOverOverlayView {
    constructor(doc = typeof document !== 'undefined' ? document : null) {
        this.doc = doc;
        if (!this.doc) {
            this.overlayEl = null;
            this.titleEl = null;
            this.finalScoreEl = null;
            this.msgEl = null;
            this.detailEl = null;
            return;
        }

        this.overlayEl = this.doc.getElementById('gameOverlay');
        this.titleEl = this.doc.getElementById('overlayTitle');
        this.finalScoreEl = this.doc.getElementById('overlayFinalScore');
        this.msgEl = this.doc.getElementById('overlayMsg');
        this.detailEl = this.doc.getElementById('overlayDetail');
    }

    show(snapshot, isWin, onRestart) {
        if (!this.overlayEl) return;

        const { finalResult, remainingHairs = 0, percentageCleared = 0 } = snapshot || {};
        const { totalScore = 0, timeBonus = 0, allClearBonus = 0 } = finalResult || {};

        if (this.finalScoreEl) this.finalScoreEl.textContent = totalScore;

        if (isWin) {
            if (this.titleEl) {
                this.titleEl.textContent = '🎉 완벽한 면도!';
                this.titleEl.style.color = '#4ecdc4';
            }
            if (this.msgEl) this.msgEl.textContent = '모든 털을 완벽히 제거했습니다! ✨';
        } else if (percentageCleared >= 80) {
            if (this.titleEl) {
                this.titleEl.textContent = '👏 깔끔해요!';
                this.titleEl.style.color = '#4ecdc4';
            }
            if (this.msgEl) this.msgEl.textContent = `${remainingHairs}개 남음`;
        } else {
            if (this.titleEl) {
                this.titleEl.textContent = '😅 아쉬워요!';
                this.titleEl.style.color = '#ff6b6b';
            }
            if (this.msgEl) this.msgEl.textContent = `${remainingHairs}개 남음`;
        }

        if (this.detailEl) {
            this.detailEl.textContent = `제거율 ${percentageCleared}% | 시간 보너스 +${timeBonus} | 올클리어 +${allClearBonus}`;
        }

        this.overlayEl.style.display = 'flex';

        const restartBtn = this.doc ? this.doc.getElementById('restartBtn') : null;
        if (restartBtn) {
            restartBtn.onclick = () => {
                this.hide();
                if (typeof onRestart === 'function') onRestart();
            };
        }
    }

    hide() {
        if (this.overlayEl) this.overlayEl.style.display = 'none';
    }
}
