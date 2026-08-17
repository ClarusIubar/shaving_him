/**
 * Interface Layer: HUD
 * Aggregates StatsHUDView, StageSelectModalView, LoadingOverlayView, and GameOverOverlayView into a unified UI facade.
 */
import { GamePolicy } from '../domain/game-policy.js';
import { StatsHUDView } from './views/stats-hud-view.js';
import { StageSelectModalView } from './views/stage-select-modal-view.js';
import { LoadingOverlayView } from './views/loading-overlay-view.js';
import { GameOverOverlayView } from './views/game-over-overlay-view.js';

export class HUD {
    constructor(gamePolicy = new GamePolicy(), doc = typeof document !== 'undefined' ? document : null) {
        if (!doc) {
            throw new Error('HUD: document is required');
        }
        this.gamePolicy = gamePolicy;
        this.doc = doc;

        this.statsView = new StatsHUDView(this.doc);
        this.modalView = new StageSelectModalView(this.doc);
        this.loadingView = new LoadingOverlayView(this.doc);
        this.gameOverView = new GameOverOverlayView(this.doc);

        this.initStartModalEvents();
    }

    // Stats View Element Getters & Setters
    get scoreEl() { return this.statsView.scoreEl; }
    set scoreEl(el) { this.statsView.scoreEl = el; }

    get timerEl() { return this.statsView.timerEl; }
    set timerEl(el) { this.statsView.timerEl = el; }

    get remainEl() { return this.statsView.remainEl; }
    set remainEl(el) { this.statsView.remainEl = el; }

    get barFillEl() { return this.statsView.barFillEl; }
    set barFillEl(el) { this.statsView.barFillEl = el; }

    get comboBadgeEl() { return this.statsView.comboBadgeEl; }
    set comboBadgeEl(el) { this.statsView.comboBadgeEl = el; }

    get comboValEl() { return this.statsView.comboValEl; }
    set comboValEl(el) { this.statsView.comboValEl = el; }

    get soundToggleBtn() { return this.statsView.soundToggleBtn; }
    set soundToggleBtn(el) { this.statsView.soundToggleBtn = el; }

    get exportPngBtn() { return this.statsView.exportPngBtn; }
    set exportPngBtn(el) { this.statsView.exportPngBtn = el; }

    // Start Modal Element Getters & Setters
    get startModalEl() { return this.modalView.startModalEl; }
    set startModalEl(el) { this.modalView.startModalEl = el; }

    get photoInputEl() { return this.modalView.photoInputEl; }
    set photoInputEl(el) { this.modalView.photoInputEl = el; }

    get dropZoneEl() { return this.modalView.dropZoneEl; }
    set dropZoneEl(el) { this.modalView.dropZoneEl = el; }

    get previewEl() { return this.modalView.previewEl; }
    set previewEl(el) { this.modalView.previewEl = el; }

    get startPresetBtn() { return this.modalView.startPresetBtn; }
    set startPresetBtn(el) { this.modalView.startPresetBtn = el; }

    get startCustomBtn() { return this.modalView.startCustomBtn; }
    set startCustomBtn(el) { this.modalView.startCustomBtn = el; }

    get selectedFile() { return this.modalView.selectedFile; }
    set selectedFile(f) { this.modalView.selectedFile = f; }

    get previewUrl() { return this.modalView.previewUrl; }
    set previewUrl(url) { this.modalView.previewUrl = url; }

    // Loading Screen Element Getter & Setter
    get loadingEl() { return this.loadingView.loadingEl; }
    set loadingEl(el) { this.loadingView.loadingEl = el; }

    // Game Over Overlay Element Getters & Setters
    get overlayEl() { return this.gameOverView.overlayEl; }
    set overlayEl(el) { this.gameOverView.overlayEl = el; }

    get titleEl() { return this.gameOverView.titleEl; }
    set titleEl(el) { this.gameOverView.titleEl = el; }

    get finalScoreEl() { return this.gameOverView.finalScoreEl; }
    set finalScoreEl(el) { this.gameOverView.finalScoreEl = el; }

    get msgEl() { return this.gameOverView.msgEl; }
    set msgEl(el) { this.gameOverView.msgEl = el; }

    get detailEl() { return this.gameOverView.detailEl; }
    set detailEl(el) { this.gameOverView.detailEl = el; }

    initStartModalEvents(onPresetSelected = null, onCustomFileSelected = null) {
        this.modalView.init(onPresetSelected, onCustomFileSelected);
    }

    handleFileSelected(file) {
        this.modalView.handleFileSelected(file);
    }

    showStartModal() {
        this.modalView.show();
    }

    hideStartModal() {
        this.modalView.hide();
    }

    showLoading(message = '스테이지 생성 중...', percentage = 0) {
        this.loadingView.show(message, percentage);
    }

    hideLoading() {
        this.loadingView.hide();
    }

    updateSoundUI(enabled) {
        this.statsView.updateSoundUI(enabled);
    }

    updateBrushSizeUI(radius) {
        this.statsView.updateBrushSizeUI(radius);
    }

    update(snapshot) {
        this.statsView.update(snapshot);
    }

    showGameOver(snapshot, onRestart) {
        const isWin = this.gamePolicy.isVictory(snapshot);
        this.gameOverView.show(snapshot, isWin, onRestart);
    }

    hideOverlay() {
        this.gameOverView.hide();
    }
}
