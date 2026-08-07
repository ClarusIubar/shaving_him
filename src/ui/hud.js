/**
 * Interface Layer: HUD
 * Updates score, timer, progress bar, razor size label, result overlays, and stage start modal.
 */
import { GamePolicy } from '../domain/game-policy.js';

export class HUD {
    constructor(gamePolicy = new GamePolicy(), doc = typeof document !== 'undefined' ? document : null) {
        this.gamePolicy = gamePolicy;
        this.doc = doc;
        this.scoreEl = this.doc.getElementById('scoreVal');
        this.timerEl = this.doc.getElementById('timerVal');
        this.remainEl = this.doc.getElementById('remainVal');
        this.barFillEl = this.doc.getElementById('progressBarFill');

        // Game Over Overlay
        this.overlayEl = this.doc.getElementById('gameOverlay');
        this.titleEl = this.doc.getElementById('overlayTitle');
        this.finalScoreEl = this.doc.getElementById('overlayFinalScore');
        this.msgEl = this.doc.getElementById('overlayMsg');
        this.detailEl = this.doc.getElementById('overlayDetail');

        // Start Modal Elements
        this.startModalEl = this.doc.getElementById('startModal');
        this.photoInputEl = this.doc.getElementById('photoInput');
        this.dropZoneEl = this.doc.getElementById('uploadDropZone');
        this.previewEl = this.doc.getElementById('photoPreview');
        this.startPresetBtn = this.doc.getElementById('startPresetBtn');
        this.startCustomBtn = this.doc.getElementById('startCustomBtn');

        this.selectedFile = null;
        this.previewUrl = null;

        this.comboBadgeEl = this.doc.getElementById('comboBadge');
        this.comboValEl = this.doc.getElementById('comboVal');
        this.loadingEl = this.doc.getElementById('loadingScreen');
        this.soundToggleBtn = this.doc.getElementById('soundToggleBtn');
        this.exportPngBtn = this.doc.getElementById('exportPngBtn');

        this.initStartModalEvents();
    }

    /**
     * @param {Function} onPresetSelected - invoked with the preset id when the preset button is pressed
     * @param {Function} onCustomFileSelected - invoked with the chosen File when the custom button is pressed
     */
    initStartModalEvents(onPresetSelected = null, onCustomFileSelected = null) {
        if (this.startPresetBtn) {
            this.startPresetBtn.addEventListener('click', () => {
                if (typeof onPresetSelected === 'function') onPresetSelected('preset1');
            });
        }

        if (this.startCustomBtn) {
            this.startCustomBtn.addEventListener('click', () => {
                if (this.selectedFile && typeof onCustomFileSelected === 'function') {
                    onCustomFileSelected(this.selectedFile);
                }
            });
        }

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
        if (!this.doc) return;
        if (!this.loadingEl) {
            this.loadingEl = this.doc.createElement('div');
            this.loadingEl.id = 'loadingScreen';
            this.loadingEl.className = 'loading-screen';
            // Only static markup goes through innerHTML - message/percentage
            // are never interpolated into an HTML string, so they can never
            // be parsed as markup no matter where they end up coming from.
            this.loadingEl.innerHTML = `
                <div class="spinner"></div>
                <div id="loadingMsg" style="font-weight:bold;color:#4ecdc4;font-size:15px;"></div>
                <div style="width:280px;height:8px;background:#252a38;border-radius:4px;overflow:hidden;margin-top:4px;">
                    <div id="loadingBarFill" style="height:100%;background:linear-gradient(90deg, #ff6b6b, #4ecdc4);transition:width 0.2s;"></div>
                </div>
            `;
            this.doc.body.appendChild(this.loadingEl);
        } else {
            this.loadingEl.style.display = 'flex';
        }

        const msgNode = this.doc.getElementById('loadingMsg');
        const fillNode = this.doc.getElementById('loadingBarFill');
        if (msgNode) msgNode.textContent = message;
        if (fillNode) fillNode.style.width = `${percentage}%`;
    }

    hideLoading() {
        if (this.loadingEl) this.loadingEl.style.display = 'none';
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

    showGameOver(snapshot, onRestart) {
        if (!this.overlayEl) return;

        const { finalResult, remainingHairs, percentageCleared } = snapshot || {};
        const { totalScore = 0, timeBonus = 0, allClearBonus = 0 } = finalResult || {};

        if (this.finalScoreEl) this.finalScoreEl.textContent = totalScore;
        // Time/all-clear bonuses are surfaced via detailEl below; there are no
        // dedicated #timeBonus / #allClearBonus elements in index.html.

        const isWin = this.gamePolicy.isVictory(snapshot);

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

        const restartBtn = this.doc.getElementById('restartBtn');
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
