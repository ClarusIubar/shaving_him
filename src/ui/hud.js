/**
 * Interface Layer: HUD
 * Updates score, timer, progress bar, razor size label, result overlays, and stage start modal.
 */
import { SessionStatus } from '../domain/shave-session.js';

export class HUD {
    constructor() {
        this.scoreEl = document.getElementById('scoreVal');
        this.timerEl = document.getElementById('timerVal');
        this.remainEl = document.getElementById('remainVal');
        this.barFillEl = document.getElementById('progressBarFill');

        // Game Over Overlay
        this.overlayEl = document.getElementById('gameOverlay');
        this.titleEl = document.getElementById('overlayTitle');
        this.finalScoreEl = document.getElementById('overlayFinalScore');
        this.msgEl = document.getElementById('overlayMsg');
        this.detailEl = document.getElementById('overlayDetail');

        // Start Modal Elements
        this.startModalEl = document.getElementById('startModal');
        this.photoInputEl = document.getElementById('photoInput');
        this.dropZoneEl = document.getElementById('uploadDropZone');
        this.previewEl = document.getElementById('photoPreview');
        this.startPresetBtn = document.getElementById('startPresetBtn');
        this.startCustomBtn = document.getElementById('startCustomBtn');

        this.selectedFile = null;
        this.initStartModalEvents();
    }

    initStartModalEvents() {
        if (this.dropZoneEl && this.photoInputEl) {
            this.dropZoneEl.addEventListener('click', () => this.photoInputEl.click());

            this.photoInputEl.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    this.handleFileSelected(e.target.files[0]);
                }
            });

            // Drag and Drop support
            this.dropZoneEl.addEventListener('dragover', (e) => {
                e.preventDefault();
                this.dropZoneEl.style.borderColor = '#4ecdc4';
            });

            this.dropZoneEl.addEventListener('drop', (e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    this.handleFileSelected(e.dataTransfer.files[0]);
                }
            });
        }
    }

    handleFileSelected(file) {
        this.selectedFile = file;
        if (this.previewEl) {
            const url = URL.createObjectURL(file);
            this.previewEl.src = url;
            this.previewEl.style.display = 'block';
        }
        if (this.startCustomBtn) {
            this.startCustomBtn.disabled = false;
            this.startCustomBtn.style.opacity = '1';
        }
    }

    showStartModal() {
        if (this.startModalEl) this.startModalEl.style.display = 'flex';
    }

    hideStartModal() {
        if (this.startModalEl) this.startModalEl.style.display = 'none';
    }

    update(snapshot) {
        if (!snapshot) return;
        if (this.scoreEl) this.scoreEl.textContent = snapshot.score;
        if (this.timerEl) this.timerEl.textContent = snapshot.timeLeft;
        if (this.remainEl) this.remainEl.textContent = snapshot.remainingHairs;
        if (this.barFillEl) this.barFillEl.style.width = `${snapshot.percentageCleared}%`;
    }

    showGameOver(snapshot, onRestart) {
        if (!this.overlayEl) return;

        const { finalResult, remainingHairs, percentageCleared, status } = snapshot;
        const { totalScore, timeBonus, allClearBonus } = finalResult;

        if (this.finalScoreEl) this.finalScoreEl.textContent = totalScore;

        if (status === SessionStatus.WON || percentageCleared === 100) {
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

        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.onclick = () => {
                this.hideOverlay();
                if (onRestart) onRestart();
            };
        }
    }

    hideOverlay() {
        if (this.overlayEl) this.overlayEl.style.display = 'none';
    }
}
