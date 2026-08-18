/**
 * Interface Layer: InputManager
 * Encapsulates all DOM keyboard shortcuts, brush size selectors, sound toggles, and modal control bindings.
 * Conforms to Single Responsibility Principle (SRP) and Fail-Fast lifecycle management.
 */

export const KEY_BRUSH_RADIUS_MAP = Object.freeze({
    '1': 1,
    '2': 3,
    '3': 5,
    '4': 7
});

export class InputManager {
    /**
     * @param {Object} options
     * @param {Document} options.doc
     * @param {Window} [options.win]
     * @param {BrushController} [options.brushController]
     * @param {GameOrchestrator} [options.orchestrator]
     * @param {HUD} [options.hud]
     * @param {SoundEffects} [options.sound]
     * @param {Object} [options.keyMap]
     */
    constructor({
        doc = typeof document !== 'undefined' ? document : null,
        win = typeof window !== 'undefined' ? window : null,
        brushController = null,
        orchestrator = null,
        hud = null,
        sound = null,
        keyMap = KEY_BRUSH_RADIUS_MAP
    } = {}) {
        if (!doc) {
            throw new Error('InputManager: document is required');
        }
        this.doc = doc;
        this.win = win;
        this.brushController = brushController;
        this.orchestrator = orchestrator;
        this.hud = hud;
        this.sound = sound;
        this.keyMap = keyMap;
        this.unsubscribers = [];

        this.bindEvents();
    }

    bindEvents() {
        // 1. Sound toggle button in HUD
        if (this.hud && this.hud.soundToggleBtn && this.sound) {
            const onSoundClick = () => {
                const enabled = this.sound.toggle();
                this.hud.updateSoundUI(enabled);
            };
            this.hud.soundToggleBtn.addEventListener('click', onSoundClick);
            this.unsubscribers.push(() => {
                if (this.hud && this.hud.soundToggleBtn) {
                    this.hud.soundToggleBtn.removeEventListener('click', onSoundClick);
                }
            });
        }

        // 2. Synchronize HUD brush button highlight when brush radius changes
        if (this.brushController && typeof this.brushController.onRadiusChange === 'function' && this.hud) {
            this.brushController.onRadiusChange(radius => {
                this.hud.updateBrushSizeUI(radius);
            });
        }

        // 3. Brush size selector buttons
        const brushBtns = this.doc.querySelectorAll('.brush-btn');
        if (brushBtns && typeof brushBtns.forEach === 'function') {
            brushBtns.forEach(btn => {
                const onBtnClick = (e) => {
                    brushBtns.forEach(b => b.classList && b.classList.remove('active'));
                    if (e.target && e.target.classList) e.target.classList.add('active');
                    const radiusAttr = e.target ? e.target.getAttribute('data-radius') : '1';
                    const radius = parseInt(radiusAttr, 10) || 1;
                    if (this.brushController) {
                        this.brushController.setRadius(radius);
                    }
                };
                btn.addEventListener('click', onBtnClick);
                this.unsubscribers.push(() => btn.removeEventListener('click', onBtnClick));
            });
        }

        // 4. Global Keyboard Shortcuts
        if (this.win && typeof this.win.addEventListener === 'function') {
            const onKeyDown = (e) => {
                const activeEl = this.doc.activeElement;
                const tag = activeEl ? activeEl.tagName.toLowerCase() : '';
                if (tag === 'input' || tag === 'textarea' || (activeEl && activeEl.isContentEditable)) return;

                const radius = this.keyMap[e.key];
                if (radius !== undefined) {
                    if (this.brushController) {
                        this.brushController.setRadius(radius);
                    }
                } else if ((e.key === 'r' || e.key === 'R') && this.orchestrator) {
                    this.orchestrator.restart();
                }
            };
            this.win.addEventListener('keydown', onKeyDown);
            this.unsubscribers.push(() => this.win.removeEventListener('keydown', onKeyDown));
        }

        // 5. Change Stage Button in HUD
        const changeStageBtn = this.doc.getElementById('changeStageBtn');
        if (changeStageBtn && this.hud) {
            const onChangeStageClick = () => {
                if (this.orchestrator) {
                    this.orchestrator.stopTimer();
                }
                this.hud.showStartModal();
            };
            changeStageBtn.addEventListener('click', onChangeStageClick);
            this.unsubscribers.push(() => changeStageBtn.removeEventListener('click', onChangeStageClick));
        }
    }

    destroy() {
        for (let i = 0; i < this.unsubscribers.length; i++) {
            this.unsubscribers[i]();
        }
        this.unsubscribers = [];
    }
}
