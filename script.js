// State management
const state = {
    screenStream: null,
    webcamStream: null,
    audioStream: null,
    mediaRecorder: null,
    recordedChunks: [],
    isRecording: false,
    isPaused: false,
    startTime: null,
    timerInterval: null,
    settings: {
        position: 'bottom-right',
        shape: 'circle',
        size: 20,
        showWebcam: true,
        webcamBorder: true,
        systemAudio: true,
        micAudio: true
    }
};

// DOM elements
const elements = {
    startBtn: document.getElementById('startBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    stopBtn: document.getElementById('stopBtn'),
    canvas: document.getElementById('compositeCanvas'),
    screenVideo: document.getElementById('screenVideo'),
    webcamVideo: document.getElementById('webcamVideo'),
    statusIndicator: document.getElementById('statusIndicator'),
    statusText: document.querySelector('.status-text'),
    recordingTimer: document.getElementById('recordingTimer'),
    sizeSlider: document.getElementById('sizeSlider'),
    sizeValue: document.getElementById('sizeValue'),
    recordingsSection: document.getElementById('recordingsSection'),
    recordingsList: document.getElementById('recordingsList'),
    showWebcamCheck: document.getElementById('showWebcamCheck'),
    webcamBorderCheck: document.getElementById('webcamBorderCheck'),
    systemAudioCheck: document.getElementById('systemAudioCheck'),
    micAudioCheck: document.getElementById('micAudioCheck')
};

const ctx = elements.canvas.getContext('2d');

// Initialize
function init() {
    setupEventListeners();
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
}

// Setup event listeners
function setupEventListeners() {
    elements.startBtn.addEventListener('click', startRecording);
    elements.pauseBtn.addEventListener('click', togglePause);
    elements.stopBtn.addEventListener('click', stopRecording);
    
    // Position buttons
    document.querySelectorAll('.position-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.position-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.settings.position = btn.dataset.position;
        });
    });
    
    // Shape buttons
    document.querySelectorAll('.shape-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.settings.shape = btn.dataset.shape;
        });
    });
    
    // Size slider
    elements.sizeSlider.addEventListener('input', (e) => {
        state.settings.size = parseInt(e.target.value);
        elements.sizeValue.textContent = `${state.settings.size}%`;
    });
    
    // Checkboxes
    elements.showWebcamCheck.addEventListener('change', (e) => {
        state.settings.showWebcam = e.target.checked;
    });
    
    elements.webcamBorderCheck.addEventListener('change', (e) => {
        state.settings.webcamBorder = e.target.checked;
    });
    
    elements.systemAudioCheck.addEventListener('change', (e) => {
        state.settings.systemAudio = e.target.checked;
    });
    
    elements.micAudioCheck.addEventListener('change', (e) => {
        state.settings.micAudio = e.target.checked;
    });
}

// Update canvas size
function updateCanvasSize() {
    const container = elements.canvas.parentElement;
    const rect = container.getBoundingClientRect();
    elements.canvas.width = 1920;
    elements.canvas.height = 1080;
}

// Start recording
async function startRecording() {
    try {
        updateStatus('Requesting permissions...');
        
        // Get screen stream
        state.screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                cursor: 'always',
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            },
            audio: state.settings.systemAudio
        });
        console.log('Screen stream obtained:', state.screenStream.getTracks().map(t => t.kind));
        
        // Get webcam stream
        try {
            state.webcamStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });
            console.log('Webcam stream obtained');
        } catch (err) {
            console.warn('Webcam not available:', err);
            state.settings.showWebcam = false;
        }
        
        // Get microphone audio if needed
        if (state.settings.micAudio) {
            try {
                state.audioStream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: false
                });
            } catch (err) {
                console.warn('Microphone not available:', err);
            }
        }
        
        // Setup video elements
        elements.screenVideo.srcObject = state.screenStream;
        if (state.webcamStream) {
            elements.webcamVideo.srcObject = state.webcamStream;
        }
        
        // Wait for videos to be ready and play them
        await Promise.all([
            new Promise(resolve => {
                elements.screenVideo.onloadedmetadata = () => {
                    elements.screenVideo.play().then(resolve).catch(err => {
                        console.error('Screen video play error:', err);
                        resolve();
                    });
                };
            }),
            state.webcamStream ? new Promise(resolve => {
                elements.webcamVideo.onloadedmetadata = () => {
                    elements.webcamVideo.play().then(resolve).catch(err => {
                        console.error('Webcam video play error:', err);
                        resolve();
                    });
                };
            }) : Promise.resolve()
        ]);
        
        // Small delay to ensure video frames are available
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Update UI to show we're preparing
        state.isRecording = true;
        updateRecordingButtons();
        
        // Start compositing before capturing the stream
        startCompositing();
        
        // Wait a bit for the canvas to have some frames
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Create combined audio track
        const audioTracks = [];
        if (state.settings.systemAudio && state.screenStream.getAudioTracks().length > 0) {
            audioTracks.push(...state.screenStream.getAudioTracks());
        }
        if (state.settings.micAudio && state.audioStream) {
            audioTracks.push(...state.audioStream.getAudioTracks());
        }
        
        // Get canvas stream and add audio
        const canvasStream = elements.canvas.captureStream(30);
        audioTracks.forEach(track => canvasStream.addTrack(track));
        
        // Start recording
        const options = {
            mimeType: 'video/webm;codecs=vp9,opus',
            videoBitsPerSecond: 5000000
        };
        
        // Fallback for Safari/browsers that don't support vp9
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options.mimeType = 'video/webm';
        }
        
        state.mediaRecorder = new MediaRecorder(canvasStream, options);
        state.recordedChunks = [];
        
        state.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                state.recordedChunks.push(event.data);
                console.log('Data chunk received:', event.data.size, 'bytes. Total chunks:', state.recordedChunks.length);
            } else {
                console.warn('Received empty data chunk');
            }
        };
        
        state.mediaRecorder.onstop = handleRecordingStop;
        
        state.mediaRecorder.start(1000); // Collect data every second
        console.log('MediaRecorder started. State:', state.mediaRecorder.state);
        console.log('Canvas stream tracks:', canvasStream.getTracks().map(t => `${t.kind}: ${t.enabled}`));
        
        // Update UI
        state.startTime = Date.now();
        startTimer();
        updateStatus('Recording', 'recording');
        
        // Handle screen share stop
        state.screenStream.getVideoTracks()[0].onended = () => {
            stopRecording();
        };
        
    } catch (err) {
        console.error('Error starting recording:', err);
        alert('Failed to start recording. Please make sure you granted all necessary permissions.');
        updateStatus('Ready to Record');
        cleanup();
    }
}

// Start compositing video streams
function startCompositing() {
    console.log('Starting compositing...');
    let animationId = null;
    
    function draw() {
        if (!state.isRecording && !state.isPaused) {
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
            return;
        }
        
        // Clear canvas
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, elements.canvas.width, elements.canvas.height);
        
        // Draw screen video
        try {
            if (elements.screenVideo.readyState >= 2) { // HAVE_CURRENT_DATA or better
                ctx.drawImage(elements.screenVideo, 0, 0, elements.canvas.width, elements.canvas.height);
            }
        } catch (err) {
            console.error('Error drawing screen:', err);
        }
        
        // Draw webcam if enabled
        if (state.settings.showWebcam && state.webcamStream && elements.webcamVideo.readyState >= 2) {
            try {
                const webcamSize = (elements.canvas.width * state.settings.size) / 100;
                let webcamWidth = webcamSize;
                let webcamHeight = webcamSize;
                
                // For circle shape, keep it square (equal width and height)
                // For other shapes, use aspect ratio
                if (state.settings.shape !== 'circle') {
                    webcamHeight = webcamSize * (9/16); // Maintain 16:9 aspect ratio
                }
                
                const position = calculateWebcamPosition(webcamWidth, webcamHeight);
                
                // Save context state
                ctx.save();
                
                // Create clipping path based on shape
                ctx.beginPath();
                switch (state.settings.shape) {
                    case 'circle':
                        ctx.arc(
                            position.x + webcamWidth / 2,
                            position.y + webcamHeight / 2,
                            webcamWidth / 2,
                            0,
                            Math.PI * 2
                        );
                        break;
                    case 'rounded':
                        roundRect(ctx, position.x, position.y, webcamWidth, webcamHeight, 20);
                        break;
                    case 'square':
                        ctx.rect(position.x, position.y, webcamWidth, webcamHeight);
                        break;
                }
                ctx.clip();
                
                // Draw webcam video
                // For circle, we need to scale the video to cover the circular area
                if (state.settings.shape === 'circle') {
                    // Get video dimensions
                    const videoAspect = elements.webcamVideo.videoWidth / elements.webcamVideo.videoHeight;
                    const targetAspect = 1; // Circle is square
                    
                    let drawWidth = webcamWidth;
                    let drawHeight = webcamHeight;
                    let drawX = position.x;
                    let drawY = position.y;
                    
                    // Scale to cover the square area
                    if (videoAspect > targetAspect) {
                        // Video is wider, scale by height
                        drawWidth = webcamHeight * videoAspect;
                        drawX = position.x - (drawWidth - webcamWidth) / 2;
                    } else {
                        // Video is taller, scale by width
                        drawHeight = webcamWidth / videoAspect;
                        drawY = position.y - (drawHeight - webcamHeight) / 2;
                    }
                    
                    ctx.drawImage(elements.webcamVideo, drawX, drawY, drawWidth, drawHeight);
                } else {
                    // For rectangle/rounded shapes, draw normally
                    ctx.drawImage(elements.webcamVideo, position.x, position.y, webcamWidth, webcamHeight);
                }
                
                // Restore context
                ctx.restore();
                
                // Draw border if enabled
                if (state.settings.webcamBorder) {
                    ctx.strokeStyle = '#6366f1';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    switch (state.settings.shape) {
                        case 'circle':
                            // Draw border slightly inside to prevent clipping
                            ctx.arc(
                                position.x + webcamWidth / 2,
                                position.y + webcamHeight / 2,
                                (webcamWidth / 2) - 2, // Adjust for line width
                                0,
                                Math.PI * 2
                            );
                            break;
                        case 'rounded':
                            roundRect(ctx, position.x + 2, position.y + 2, webcamWidth - 4, webcamHeight - 4, 20);
                            break;
                        case 'square':
                            ctx.rect(position.x + 2, position.y + 2, webcamWidth - 4, webcamHeight - 4);
                            break;
                    }
                    ctx.stroke();
                }
            } catch (err) {
                console.error('Error drawing webcam:', err);
            }
        }
        
        animationId = requestAnimationFrame(draw);
    }
    
    draw();
}

// Calculate webcam position based on settings
function calculateWebcamPosition(width, height) {
    const padding = 40;
    const canvasWidth = elements.canvas.width;
    const canvasHeight = elements.canvas.height;
    
    const positions = {
        'top-left': { x: padding, y: padding },
        'top-center': { x: (canvasWidth - width) / 2, y: padding },
        'top-right': { x: canvasWidth - width - padding, y: padding },
        'middle-left': { x: padding, y: (canvasHeight - height) / 2 },
        'middle-center': { x: (canvasWidth - width) / 2, y: (canvasHeight - height) / 2 },
        'middle-right': { x: canvasWidth - width - padding, y: (canvasHeight - height) / 2 },
        'bottom-left': { x: padding, y: canvasHeight - height - padding },
        'bottom-center': { x: (canvasWidth - width) / 2, y: canvasHeight - height - padding },
        'bottom-right': { x: canvasWidth - width - padding, y: canvasHeight - height - padding }
    };
    
    return positions[state.settings.position];
}

// Helper function to draw rounded rectangle
function roundRect(ctx, x, y, width, height, radius) {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
}

// Toggle pause
function togglePause() {
    if (!state.mediaRecorder) return;
    
    if (state.isPaused) {
        state.mediaRecorder.resume();
        state.isPaused = false;
        updateStatus('Recording', 'recording');
        elements.pauseBtn.innerHTML = '<span class="btn-icon">⏸️</span> <span class="btn-text">Pause</span>';
    } else {
        state.mediaRecorder.pause();
        state.isPaused = true;
        updateStatus('Paused', 'paused');
        elements.pauseBtn.innerHTML = '<span class="btn-icon">▶️</span> <span class="btn-text">Resume</span>';
    }
}

// Stop recording
function stopRecording() {
    if (!state.mediaRecorder) return;
    
    state.mediaRecorder.stop();
    stopTimer();
    state.isRecording = false;
    state.isPaused = false;
}

// Handle recording stop
function handleRecordingStop() {
    const blob = new Blob(state.recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toLocaleString();
    const duration = formatTime(Math.floor((Date.now() - state.startTime) / 1000));
    
    // Add to recordings list
    addRecording(url, blob, timestamp, duration);
    
    // Cleanup
    cleanup();
    updateRecordingButtons();
    updateStatus('Ready to Record');
    elements.recordingTimer.textContent = '00:00';
}

// Add recording to list
function addRecording(url, blob, timestamp, duration) {
    elements.recordingsSection.style.display = 'block';
    
    const item = document.createElement('div');
    item.className = 'recording-item';
    
    item.innerHTML = `
        <div class="recording-info">
            <div class="recording-name">Recording - ${timestamp}</div>
            <div class="recording-meta">Duration: ${duration} • Size: ${formatBytes(blob.size)}</div>
        </div>
        <div class="recording-actions">
            <button class="btn btn-primary btn-small play-btn">▶️ Play</button>
            <button class="btn btn-secondary btn-small download-btn">⬇️ Download</button>
        </div>
    `;
    
    const playBtn = item.querySelector('.play-btn');
    const downloadBtn = item.querySelector('.download-btn');
    
    playBtn.addEventListener('click', () => {
        window.open(url, '_blank');
    });
    
    downloadBtn.addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = url;
        a.download = `demo-recording-${Date.now()}.webm`;
        a.click();
    });
    
    elements.recordingsList.insertBefore(item, elements.recordingsList.firstChild);
}

// Timer functions
function startTimer() {
    state.timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
        elements.recordingTimer.textContent = formatTime(elapsed);
    }, 1000);
}

function stopTimer() {
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Format bytes
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Update status
function updateStatus(text, status = '') {
    elements.statusText.textContent = text;
    elements.statusIndicator.className = 'status-indicator';
    if (status) {
        elements.statusIndicator.classList.add(status);
    }
}

// Update recording buttons
function updateRecordingButtons() {
    elements.startBtn.disabled = state.isRecording;
    elements.pauseBtn.disabled = !state.isRecording;
    elements.stopBtn.disabled = !state.isRecording;
}

// Cleanup
function cleanup() {
    if (state.screenStream) {
        state.screenStream.getTracks().forEach(track => track.stop());
        state.screenStream = null;
    }
    
    if (state.webcamStream) {
        state.webcamStream.getTracks().forEach(track => track.stop());
        state.webcamStream = null;
    }
    
    if (state.audioStream) {
        state.audioStream.getTracks().forEach(track => track.stop());
        state.audioStream = null;
    }
    
    elements.screenVideo.srcObject = null;
    elements.webcamVideo.srcObject = null;
    
    // Clear canvas
    ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, elements.canvas.width, elements.canvas.height);
}

// Initialize on load
window.addEventListener('DOMContentLoaded', init);

