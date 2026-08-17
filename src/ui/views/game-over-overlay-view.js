/**
 * UI View: GameOverOverlayView
 * Displays endgame victory/defeat modal overlay with score breakdown and restart trigger.
 */

export class GameOverOverlayView {
    constructor(doc) {
        if (!doc) {
            throw new Error('GameOverOverlayView: document is required');
        }
        this.doc = doc;

        this.overlayEl = this.doc.getElementById('gameOverlay');
        this.titleEl = this.doc.getElementById('overlayTitle');
        this.finalScoreEl = this.doc.getElementById('overlayFinalScore');
        this.msgEl = this.doc.getElementById('overlayMsg');
        this.detailEl = this.doc.getElementById('overlayDetail');
    }

    show(snapshot, isWin, onRestart) {
        const { finalResult, remainingHairs, percentageCleared } = snapshot;
        const { totalScore, timeBonus, allClearBonus } = finalResult;

        this.finalScoreEl.textContent = totalScore;

        if (isWin) {
            this.titleEl.textContent = '🎉 완벽한 면도!';
            this.titleEl.style.color = '#4ecdc4';
            this.msgEl.textContent = '모든 털을 완벽히 제거했습니다! ✨';
        } else if (percentageCleared >= 80) {
            this.titleEl.textContent = '👏 깔끔해요!';
            this.titleEl.style.color = '#4ecdc4';
            this.msgEl.textContent = `${remainingHairs}개 남음`;
        } else {
            this.titleEl.textContent = '😅 아쉬워요!';
            this.titleEl.style.color = '#ff6b6b';
            this.msgEl.textContent = `${remainingHairs}개 남음`;
        }

        this.detailEl.textContent = `제거율 ${percentageCleared}% | 시간 보너스 +${timeBonus} | 올클리어 +${allClearBonus}`;
        this.overlayEl.style.display = 'flex';

        const restartBtn = this.doc.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.onclick = () => {
                this.hide();
                if (typeof onRestart === 'function') onRestart();
            };
        }
    }

    hide() {
        this.overlayEl.style.display = 'none';
    }
}
