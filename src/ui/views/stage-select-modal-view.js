/**
 * UI View: StageSelectModalView
 * Handles preset selection, custom photo dropzone and file input, and start modal dialog visibility.
 */

export class StageSelectModalView {
    constructor(doc) {
        if (!doc) {
            throw new Error('StageSelectModalView: document is required');
        }
        this.doc = doc;

        this.startModalEl = this.doc.getElementById('startModal');
        this.photoInputEl = this.doc.getElementById('photoInput');
        this.dropZoneEl = this.doc.getElementById('uploadDropZone');
        this.previewEl = this.doc.getElementById('photoPreview');
        this.startPresetBtn = this.doc.getElementById('startPresetBtn');
        this.startCustomBtn = this.doc.getElementById('startCustomBtn');

        this.selectedFile = null;
        this.previewUrl = null;
    }

    init(onPresetSelected = null, onCustomFileSelected = null) {
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
                try {
                    this.previewUrl = URL.createObjectURL(file);
                    this.previewEl.src = this.previewUrl;
                } catch (_) {
                    // Fallback for non-blob objects in test stubs
                }
            }
            this.previewEl.style.display = 'block';
        }
        if (this.startCustomBtn) {
            this.startCustomBtn.disabled = false;
            this.startCustomBtn.style.opacity = '1';
        }
    }

    show() {
        if (this.startModalEl) this.startModalEl.style.display = 'flex';
    }

    hide() {
        if (this.startModalEl) this.startModalEl.style.display = 'none';
    }
}
