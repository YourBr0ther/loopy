// LoopDeck - Video Loop Station
// A 90s-style video looper for creating layered audio/video compositions

class LoopDeck {
    constructor() {
        this.NUM_FRAMES = 6;
        this.NUM_SCENES = 8;
        this.MAX_DURATION = 240; // 4 minutes in seconds

        this.cameraStream = null;
        this.mediaRecorder = null;
        this.recordingFrameIndex = null;
        this.frames = [];
        this.scenes = new Array(this.NUM_SCENES).fill(null);
        this.timeline = [];
        this.isPlayingTimeline = false;
        this.timelineInterval = null;
        this.currentSegmentIndex = 0;
        this.masterVolume = 0.8;

        this.init();
    }

    init() {
        this.createFrames();
        this.createSceneSlots();
        this.bindEvents();
        this.updateTimelineInfo();
        this.animateVUMeters();
    }

    createFrames() {
        const grid = document.getElementById('frames-grid');
        const togglesContainer = document.getElementById('frame-toggles');

        for (let i = 0; i < this.NUM_FRAMES; i++) {
            // Initialize frame data
            this.frames[i] = {
                blob: null,
                label: `Track ${i + 1}`,
                isPlaying: false
            };

            // Create frame element
            const frame = document.createElement('div');
            frame.className = 'video-frame';
            frame.id = `frame-${i}`;
            frame.innerHTML = `
                <div class="frame-header">
                    <span class="frame-number">CH ${i + 1}</span>
                    <div class="frame-label-container">
                        <input type="text" class="frame-label" value="Track ${i + 1}" data-frame="${i}" placeholder="Label">
                    </div>
                    <div class="frame-status" id="frame-status-${i}"></div>
                </div>
                <div class="frame-video-container">
                    <video class="frame-video" id="frame-video-${i}" loop playsinline></video>
                    <div class="frame-placeholder" id="frame-placeholder-${i}">
                        <span class="frame-placeholder-icon">◉</span>
                        <span>NO RECORDING</span>
                    </div>
                </div>
                <div class="frame-controls">
                    <button class="deck-button primary record-btn" data-frame="${i}">
                        <span class="button-icon">●</span>
                        <span class="button-label">REC</span>
                    </button>
                    <button class="deck-button play-btn" data-frame="${i}" disabled>
                        <span class="button-icon">▶</span>
                        <span class="button-label">PLAY</span>
                    </button>
                    <button class="deck-button stop-btn" data-frame="${i}" disabled>
                        <span class="button-icon">■</span>
                        <span class="button-label">STOP</span>
                    </button>
                    <button class="deck-button danger clear-btn" data-frame="${i}" disabled>
                        <span class="button-icon">⊗</span>
                        <span class="button-label">CLR</span>
                    </button>
                </div>
            `;
            grid.appendChild(frame);

            // Create toggle for segment modal
            const toggle = document.createElement('div');
            toggle.className = 'frame-toggle';
            toggle.innerHTML = `
                <input type="checkbox" id="toggle-frame-${i}" data-frame="${i}">
                <label for="toggle-frame-${i}">CH ${i + 1}</label>
            `;
            togglesContainer.appendChild(toggle);
        }
    }

    createSceneSlots() {
        const slotsContainer = document.getElementById('scene-slots');
        const saveSlotsContainer = document.getElementById('save-slots');

        for (let i = 0; i < this.NUM_SCENES; i++) {
            // Main scene slot
            const slot = document.createElement('div');
            slot.className = 'scene-slot';
            slot.id = `scene-slot-${i}`;
            slot.dataset.scene = i;
            slot.innerHTML = `
                <span class="scene-slot-number">${i + 1}</span>
                <span class="scene-slot-label">EMPTY</span>
            `;
            slotsContainer.appendChild(slot);

            // Save modal slot
            const saveSlot = document.createElement('div');
            saveSlot.className = 'save-slot';
            saveSlot.dataset.scene = i;
            saveSlot.innerHTML = `<span>Slot ${i + 1}</span>`;
            saveSlotsContainer.appendChild(saveSlot);
        }
    }

    bindEvents() {
        // Camera controls
        document.getElementById('start-camera').addEventListener('click', () => this.startCamera());
        document.getElementById('camera-select').addEventListener('change', (e) => this.switchCamera(e.target.value));

        // Frame controls
        document.querySelectorAll('.record-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleRecord(parseInt(e.currentTarget.dataset.frame)));
        });

        document.querySelectorAll('.play-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.playFrame(parseInt(e.currentTarget.dataset.frame)));
        });

        document.querySelectorAll('.stop-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.stopFrame(parseInt(e.currentTarget.dataset.frame)));
        });

        document.querySelectorAll('.clear-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.clearFrame(parseInt(e.currentTarget.dataset.frame)));
        });

        document.querySelectorAll('.frame-label').forEach(input => {
            input.addEventListener('change', (e) => {
                const frameIndex = parseInt(e.target.dataset.frame);
                this.frames[frameIndex].label = e.target.value;
            });
        });

        // Scene controls
        document.querySelectorAll('.scene-slot').forEach(slot => {
            slot.addEventListener('click', (e) => this.loadScene(parseInt(e.currentTarget.dataset.scene)));
        });

        document.getElementById('save-scene').addEventListener('click', () => this.openSaveModal());
        document.getElementById('clear-all').addEventListener('click', () => this.clearAllFrames());

        document.querySelectorAll('.save-slot').forEach(slot => {
            slot.addEventListener('click', (e) => this.saveScene(parseInt(e.currentTarget.dataset.scene)));
        });

        // Timeline controls
        document.getElementById('add-segment').addEventListener('click', () => this.openSegmentModal());
        document.getElementById('play-timeline').addEventListener('click', () => this.playTimeline());
        document.getElementById('stop-timeline').addEventListener('click', () => this.stopTimeline());
        document.getElementById('clear-timeline').addEventListener('click', () => this.clearTimeline());
        document.getElementById('confirm-segment').addEventListener('click', () => this.addSegment());
        document.getElementById('cancel-segment').addEventListener('click', () => this.closeSegmentModal());

        // Master controls
        document.getElementById('play-all').addEventListener('click', () => this.playAllFrames());
        document.getElementById('stop-all').addEventListener('click', () => this.stopAllFrames());
        document.getElementById('master-volume').addEventListener('input', (e) => this.setMasterVolume(e.target.value / 100));

        // Modal controls
        document.getElementById('close-segment-modal').addEventListener('click', () => this.closeSegmentModal());
        document.getElementById('close-scene-modal').addEventListener('click', () => this.closeSaveModal());

        // Close modals on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }

    async startCamera() {
        try {
            // Get available cameras
            const devices = await navigator.mediaDevices.enumerateDevices();
            const cameras = devices.filter(d => d.kind === 'videoinput');

            // Populate camera select
            const select = document.getElementById('camera-select');
            select.innerHTML = '<option value="">Select Camera</option>';
            cameras.forEach((camera, index) => {
                const option = document.createElement('option');
                option.value = camera.deviceId;
                option.textContent = camera.label || `Camera ${index + 1}`;
                select.appendChild(option);
            });

            // Start with first camera
            if (cameras.length > 0) {
                await this.switchCamera(cameras[0].deviceId);
                select.value = cameras[0].deviceId;
            }
        } catch (err) {
            console.error('Camera access error:', err);
            alert('Could not access camera. Please ensure camera permissions are granted.');
        }
    }

    async switchCamera(deviceId) {
        if (!deviceId) return;

        // Stop existing stream
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
        }

        try {
            this.cameraStream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: deviceId } },
                audio: true
            });

            document.getElementById('camera-preview').srcObject = this.cameraStream;
        } catch (err) {
            console.error('Camera switch error:', err);
        }
    }

    handleRecord(frameIndex) {
        if (this.recordingFrameIndex !== null) {
            // Stop current recording
            if (this.recordingFrameIndex === frameIndex) {
                this.stopRecording();
            }
            return;
        }

        this.startRecording(frameIndex);
    }

    startRecording(frameIndex) {
        if (!this.cameraStream) {
            alert('Please start the camera first.');
            return;
        }

        this.recordingFrameIndex = frameIndex;
        const chunks = [];

        // Determine supported MIME type
        const mimeTypes = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm',
            'video/mp4'
        ];

        let selectedMimeType = '';
        for (const mimeType of mimeTypes) {
            if (MediaRecorder.isTypeSupported(mimeType)) {
                selectedMimeType = mimeType;
                break;
            }
        }

        try {
            this.mediaRecorder = new MediaRecorder(this.cameraStream, {
                mimeType: selectedMimeType || undefined
            });
        } catch (err) {
            console.error('MediaRecorder error:', err);
            this.mediaRecorder = new MediaRecorder(this.cameraStream);
        }

        this.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunks.push(e.data);
            }
        };

        this.mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: selectedMimeType || 'video/webm' });
            this.frames[frameIndex].blob = blob;
            this.updateFrameUI(frameIndex);
            this.recordingFrameIndex = null;
            document.getElementById('rec-indicator').classList.remove('active');

            // Update record button
            const btn = document.querySelector(`.record-btn[data-frame="${frameIndex}"]`);
            btn.querySelector('.button-label').textContent = 'REC';
        };

        this.mediaRecorder.start(100);
        document.getElementById('rec-indicator').classList.add('active');

        // Update button text
        const btn = document.querySelector(`.record-btn[data-frame="${frameIndex}"]`);
        btn.querySelector('.button-label').textContent = 'STOP';
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
    }

    updateFrameUI(frameIndex) {
        const frame = this.frames[frameIndex];
        const video = document.getElementById(`frame-video-${frameIndex}`);
        const placeholder = document.getElementById(`frame-placeholder-${frameIndex}`);
        const status = document.getElementById(`frame-status-${frameIndex}`);
        const playBtn = document.querySelector(`.play-btn[data-frame="${frameIndex}"]`);
        const stopBtn = document.querySelector(`.stop-btn[data-frame="${frameIndex}"]`);
        const clearBtn = document.querySelector(`.clear-btn[data-frame="${frameIndex}"]`);

        if (frame.blob) {
            video.src = URL.createObjectURL(frame.blob);
            placeholder.style.display = 'none';
            status.classList.add('has-video');
            playBtn.disabled = false;
            stopBtn.disabled = false;
            clearBtn.disabled = false;
        } else {
            video.src = '';
            placeholder.style.display = 'flex';
            status.classList.remove('has-video');
            status.classList.remove('playing');
            playBtn.disabled = true;
            stopBtn.disabled = true;
            clearBtn.disabled = true;
        }
    }

    playFrame(frameIndex) {
        const frame = this.frames[frameIndex];
        if (!frame.blob) return;

        const video = document.getElementById(`frame-video-${frameIndex}`);
        const status = document.getElementById(`frame-status-${frameIndex}`);

        video.volume = this.masterVolume;
        video.play();
        frame.isPlaying = true;
        status.classList.add('playing');

        video.onended = () => {
            if (frame.isPlaying) {
                video.play();
            }
        };
    }

    stopFrame(frameIndex) {
        const frame = this.frames[frameIndex];
        const video = document.getElementById(`frame-video-${frameIndex}`);
        const status = document.getElementById(`frame-status-${frameIndex}`);

        video.pause();
        video.currentTime = 0;
        frame.isPlaying = false;
        status.classList.remove('playing');
    }

    clearFrame(frameIndex) {
        this.stopFrame(frameIndex);
        this.frames[frameIndex].blob = null;
        this.updateFrameUI(frameIndex);
    }

    playAllFrames() {
        for (let i = 0; i < this.NUM_FRAMES; i++) {
            if (this.frames[i].blob) {
                this.playFrame(i);
            }
        }
    }

    stopAllFrames() {
        for (let i = 0; i < this.NUM_FRAMES; i++) {
            this.stopFrame(i);
        }
    }

    clearAllFrames() {
        if (confirm('Clear all recordings?')) {
            for (let i = 0; i < this.NUM_FRAMES; i++) {
                this.clearFrame(i);
            }
        }
    }

    setMasterVolume(volume) {
        this.masterVolume = volume;
        for (let i = 0; i < this.NUM_FRAMES; i++) {
            const video = document.getElementById(`frame-video-${i}`);
            video.volume = volume;
        }
    }

    // Scene Management
    openSaveModal() {
        const modal = document.getElementById('scene-save-modal');
        const slots = document.querySelectorAll('.save-slot');

        slots.forEach((slot, i) => {
            slot.classList.toggle('has-data', this.scenes[i] !== null);
            slot.querySelector('span').textContent = this.scenes[i] !== null
                ? `Slot ${i + 1} (Used)`
                : `Slot ${i + 1}`;
        });

        modal.classList.add('active');
    }

    closeSaveModal() {
        document.getElementById('scene-save-modal').classList.remove('active');
    }

    saveScene(sceneIndex) {
        // Save current frame data (as blob references and labels)
        const sceneData = this.frames.map(frame => ({
            blob: frame.blob,
            label: frame.label
        }));

        this.scenes[sceneIndex] = sceneData;

        // Update scene slot UI
        const slot = document.getElementById(`scene-slot-${sceneIndex}`);
        slot.classList.add('has-data');
        slot.querySelector('.scene-slot-label').textContent = 'SAVED';

        // Update save slot UI
        const saveSlot = document.querySelector(`.save-slot[data-scene="${sceneIndex}"]`);
        saveSlot.classList.add('has-data');
        saveSlot.querySelector('span').textContent = `Slot ${sceneIndex + 1} (Used)`;

        this.closeSaveModal();
    }

    loadScene(sceneIndex) {
        const sceneData = this.scenes[sceneIndex];
        if (!sceneData) return;

        // Stop all playback first
        this.stopAllFrames();

        // Load scene data into frames
        sceneData.forEach((data, i) => {
            this.frames[i].blob = data.blob;
            this.frames[i].label = data.label;

            // Update label input
            const labelInput = document.querySelector(`.frame-label[data-frame="${i}"]`);
            labelInput.value = data.label;

            this.updateFrameUI(i);
        });

        // Update active scene indicator
        document.querySelectorAll('.scene-slot').forEach(s => s.classList.remove('active'));
        document.getElementById(`scene-slot-${sceneIndex}`).classList.add('active');
    }

    // Timeline Management
    openSegmentModal() {
        document.getElementById('segment-modal').classList.add('active');
        document.getElementById('segment-duration').value = 10;

        // Reset checkboxes and disable those without recordings
        document.querySelectorAll('#frame-toggles input').forEach((checkbox, i) => {
            checkbox.checked = false;
            checkbox.disabled = !this.frames[i].blob;
        });
    }

    closeSegmentModal() {
        document.getElementById('segment-modal').classList.remove('active');
    }

    addSegment() {
        const duration = parseInt(document.getElementById('segment-duration').value);
        const activeFrames = [];

        document.querySelectorAll('#frame-toggles input:checked').forEach(checkbox => {
            activeFrames.push(parseInt(checkbox.dataset.frame));
        });

        if (activeFrames.length === 0) {
            alert('Please select at least one channel.');
            return;
        }

        // Check total duration
        const currentDuration = this.timeline.reduce((sum, seg) => sum + seg.duration, 0);
        if (currentDuration + duration > this.MAX_DURATION) {
            alert(`Cannot add segment. Maximum duration is ${this.MAX_DURATION / 60} minutes.`);
            return;
        }

        const segment = {
            duration,
            activeFrames,
            id: Date.now()
        };

        this.timeline.push(segment);
        this.renderTimeline();
        this.updateTimelineInfo();
        this.closeSegmentModal();
    }

    renderTimeline() {
        const track = document.getElementById('timeline-track');
        track.innerHTML = '';

        this.timeline.forEach((segment, index) => {
            const el = document.createElement('div');
            el.className = 'timeline-segment';
            el.dataset.index = index;

            const channelDots = Array.from({ length: this.NUM_FRAMES }, (_, i) => {
                const isActive = segment.activeFrames.includes(i);
                return `<div class="segment-channel-dot ${isActive ? 'active' : ''}"></div>`;
            }).join('');

            el.innerHTML = `
                <div class="segment-duration">${segment.duration}s</div>
                <div class="segment-channels">${channelDots}</div>
                <button class="segment-delete" data-index="${index}">×</button>
            `;

            track.appendChild(el);
        });

        // Bind delete buttons
        document.querySelectorAll('.segment-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeSegment(parseInt(e.currentTarget.dataset.index));
            });
        });
    }

    removeSegment(index) {
        this.timeline.splice(index, 1);
        this.renderTimeline();
        this.updateTimelineInfo();
    }

    clearTimeline() {
        if (confirm('Clear the entire timeline?')) {
            this.timeline = [];
            this.renderTimeline();
            this.updateTimelineInfo();
        }
    }

    updateTimelineInfo() {
        const totalDuration = this.timeline.reduce((sum, seg) => sum + seg.duration, 0);
        const minutes = Math.floor(totalDuration / 60);
        const seconds = totalDuration % 60;

        document.getElementById('timeline-duration').textContent =
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} / 04:00`;
        document.getElementById('segment-count').textContent =
            `${this.timeline.length} segment${this.timeline.length !== 1 ? 's' : ''}`;
    }

    playTimeline() {
        if (this.timeline.length === 0) {
            alert('Add segments to the timeline first.');
            return;
        }

        this.isPlayingTimeline = true;
        this.currentSegmentIndex = 0;
        document.getElementById('play-timeline').disabled = true;

        this.playTimelineSegment();
    }

    playTimelineSegment() {
        if (!this.isPlayingTimeline || this.currentSegmentIndex >= this.timeline.length) {
            this.stopTimeline();
            return;
        }

        const segment = this.timeline[this.currentSegmentIndex];

        // Update visual indicator
        document.querySelectorAll('.timeline-segment').forEach((el, i) => {
            el.classList.toggle('playing', i === this.currentSegmentIndex);
        });

        // Stop all frames first
        this.stopAllFrames();

        // Play active frames for this segment
        segment.activeFrames.forEach(frameIndex => {
            if (this.frames[frameIndex].blob) {
                this.playFrame(frameIndex);
            }
        });

        // Move to next segment after duration
        this.timelineInterval = setTimeout(() => {
            this.currentSegmentIndex++;
            this.playTimelineSegment();
        }, segment.duration * 1000);
    }

    stopTimeline() {
        this.isPlayingTimeline = false;
        clearTimeout(this.timelineInterval);
        this.stopAllFrames();

        document.getElementById('play-timeline').disabled = false;
        document.querySelectorAll('.timeline-segment').forEach(el => {
            el.classList.remove('playing');
        });
    }

    // VU Meter Animation
    animateVUMeters() {
        const vuLeft = document.querySelector('#vu-left .vu-bar');
        const vuRight = document.querySelector('#vu-right .vu-bar');

        const animate = () => {
            // Check if any audio is playing
            let maxLevel = 0;
            for (let i = 0; i < this.NUM_FRAMES; i++) {
                const video = document.getElementById(`frame-video-${i}`);
                if (!video.paused) {
                    maxLevel = Math.max(maxLevel, 0.5 + Math.random() * 0.5);
                }
            }

            if (maxLevel > 0) {
                const levelL = maxLevel * (0.7 + Math.random() * 0.3) * 100;
                const levelR = maxLevel * (0.7 + Math.random() * 0.3) * 100;
                vuLeft.style.width = `${levelL}%`;
                vuRight.style.width = `${levelR}%`;
            } else {
                vuLeft.style.width = '0%';
                vuRight.style.width = '0%';
            }

            requestAnimationFrame(animate);
        };

        animate();
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    window.loopDeck = new LoopDeck();
});
