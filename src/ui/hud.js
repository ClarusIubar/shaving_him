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
        this.previewUrl = null;

        this.comboBadgeEl = document.getElementById('comboBadge');
        this.comboValEl = document.getElementById('comboVal');
        this.loadingEl = document.getElementById('loadingScreen');
        this.soundToggleBtn = document.getElementById('soundToggleBtn');
        this.exportPngBtn = document.getElementById('exportPngBtn');

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
                this.dropZoneEl.classList.add('drag-over');
            });

            this.dropZoneEl.addEventListener('dragleave', (e) => {
                e.preventDefault();
                this.dropZoneEl.classList.remove('drag-over');
            });

            this.dropZoneEl.addEventListener('drop', (e) => {
                e.preventDefault();
                this.dropZoneEl.classList.remove('drag-over');
                if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
                    this.handleFileSelected(e.dataTransfer.files[0]);
                }
            });
        }
    }

    handleFileSelected(file) {
        this.selectedFile = file;
        if (this.previewEl) {
            if (this.previewUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) {
                URL.revokeObjectURL(this.previewUrl);
            }
            if (typeof URL !== 'undefined' && URL.createObjectURL) {
                this.previewUrl = URL.createObjectURL(file);
                this.previewEl.src = this.previewUrl;
            }
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

    showLoading(message = '스테이지 생성 중...', percentage = 0) {
        if (typeof document === 'undefined') return;
        if (!this.loadingEl) {
            this.loadingEl = document.createElement('div');
            this.loadingEl.id = 'loadingScreen';
            this.loadingEl.className = 'loading-screen';
            this.loadingEl.innerHTML = `
                <div class="spinner"></div>
                <div id="loadingMsg" style="font-weight:bold;color:#4ecdc4;font-size:15px;">${message}</div>
                <div style="width:280px;height:8px;background:#252a38;border-radius:4px;overflow:hidden;margin-top:4px;">
                    <div id="loadingBarFill" style="width:${percentage}%;height:100%;background:linear-gradient(90deg, #ff6b6b, #4ecdc4);transition:width 0.2s;"></div>
                </div>
            `;
            document.body.appendChild(this.loadingEl);
        } else {
            const msgNode = document.getElementById('loadingMsg');
            const fillNode = document.getElementById('loadingBarFill');
            if (msgNode) msgNode.textContent = message;
            if (fillNode) fillNode.style.width = `${percentage}%`;
            this.loadingEl.style.display = 'flex';
        }
    }

    hideLoading() {
        if (this.loadingEl) this.loadingEl.style.display = 'none';
    }

    updateSoundUI(enabled) {
        if (this.soundToggleBtn) {
            this.soundToggleBtn.textContent = enabled ? '🔊 소리 켬' : '🔇 음소거';
        }
    }

    update(snapshot) {
        if (!snapshot) return;
        if (this.scoreEl) this.scoreEl.textContent = snapshot.score;
        if (this.timerEl) this.timerEl.textContent = snapshot.timeLeft;
        if (this.remainEl) this.remainEl.textContent = snapshot.remainingHairs;
        if (this.barFillEl) this.barFillEl.style.width = `${snapshot.percentageCleared}%`;

        if (this.comboBadgeEl) {
            if (snapshot.comboCount > 1) {
                if (this.comboValEl) this.comboValEl.textContent = snapshot.comboCount;
                this.comboBadgeEl.style.display = 'inline-block';
            } else {
                this.comboBadgeEl.style.display = 'none';
            }
        }
    }

    updateBrushSizeUI(radius) {
        if (typeof document === 'undefined') return;
        const buttons = document.querySelectorAll('.brush-btn');
        buttons.forEach(btn => {
            const btnRadius = parseInt(btn.getAttribute('data-radius'), 10);
            if (btnRadius === radius) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    showGameOver(snapshot, onRestart) {
        if (!this.overlayEl) return;

        const { finalResult, remainingHairs, percentageCleared, status } = snapshot || {};
        const { totalScore = 0, timeBonus = 0, allClearBonus = 0 } = finalResult || {};

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
