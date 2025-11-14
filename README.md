# 🎬 Demo Recorder

A modern, feature-rich screen recording application with customizable webcam overlay. Perfect for creating demos, tutorials, presentations, and more!

## ✨ Features

- **Screen Recording**: Capture your entire screen or specific windows
- **Webcam Overlay**: Show yourself while recording with a customizable webcam feed
- **Audio Recording**: Record system audio and/or microphone input
- **Customizable Position**: Place webcam in 9 different positions (corners, edges, center)
- **Multiple Shapes**: Choose between circle, rounded rectangle, or square webcam shapes
- **Adjustable Size**: Scale webcam overlay from 10% to 40% of screen size
- **Stylish Border**: Optional colored border around webcam
- **Pause/Resume**: Pause recording and resume whenever you want
- **Recording Timer**: See exactly how long you've been recording
- **Download Recordings**: Save your recordings as WebM video files
- **Modern UI**: Beautiful, dark-themed interface with smooth animations

## 🚀 Quick Start

### Prerequisites

- A modern web browser (Chrome, Edge, or Opera recommended)
- HTTPS or localhost (required for media APIs)

### Running Locally

1. **Clone or download this repository**

2. **Serve the files using a local server**:

   **Option 1: Using Python**
   ```bash
   # Python 3
   python3 -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```

   **Option 2: Using Node.js (http-server)**
   ```bash
   npx http-server -p 8000
   ```

   **Option 3: Using PHP**
   ```bash
   php -S localhost:8000
   ```

3. **Open your browser** and navigate to:
   ```
   http://localhost:8000
   ```

4. **Start Recording**:
   - Click "Start Recording"
   - Grant screen sharing permission
   - Grant camera permission (optional)
   - Grant microphone permission (optional)
   - Your recording will begin!

## 🎮 Usage Guide

### Recording Controls

- **▶️ Start Recording**: Begin a new recording session
- **⏸️ Pause**: Temporarily pause recording
- **⏹️ Stop**: End recording and save the video

### Customization Options

#### 📍 Webcam Position
Choose from 9 positions:
- Top: Left, Center, Right
- Middle: Left, Center, Right
- Bottom: Left, Center, Right

#### 🔷 Webcam Shape
- **Circle**: Classic circular webcam overlay
- **Rounded**: Modern rounded rectangle
- **Square**: Traditional square shape

#### 📏 Webcam Size
Adjust the size slider to change webcam overlay size from 10% to 40% of the screen width.

#### 🎤 Audio Settings
- **System Audio**: Record sounds from your computer
- **Microphone**: Record your voice

#### ⚙️ Additional Options
- **Show Webcam**: Toggle webcam visibility
- **Webcam Border**: Add/remove colored border around webcam

### Managing Recordings

After stopping a recording:
- **▶️ Play**: Open recording in a new tab to preview
- **⬇️ Download**: Save the recording to your computer

## 🔧 Technical Details

### Browser Compatibility

| Browser | Screen Capture | Audio | Webcam | Status |
|---------|---------------|-------|--------|--------|
| Chrome 94+ | ✅ | ✅ | ✅ | Fully Supported |
| Edge 94+ | ✅ | ✅ | ✅ | Fully Supported |
| Opera 80+ | ✅ | ✅ | ✅ | Fully Supported |
| Firefox 90+ | ✅ | ⚠️ | ✅ | System audio limited |
| Safari 14+ | ⚠️ | ❌ | ✅ | Limited support |

### Technologies Used

- **HTML5 Canvas**: For compositing video streams
- **MediaRecorder API**: For recording video
- **getUserMedia API**: For webcam and microphone access
- **getDisplayMedia API**: For screen capture
- **WebRTC**: For real-time media processing
- **Modern CSS**: Grid, Flexbox, and Custom Properties

### Video Format

- **Container**: WebM
- **Video Codec**: VP9 (fallback to VP8)
- **Audio Codec**: Opus
- **Resolution**: Up to 1920x1080 (Full HD)
- **Frame Rate**: 30 FPS
- **Bitrate**: 5 Mbps

## 🎨 Customization

### Changing Colors

Edit the CSS variables in `style.css`:

```css
:root {
    --primary-color: #6366f1;
    --primary-hover: #4f46e5;
    --secondary-color: #8b5cf6;
    --danger-color: #ef4444;
    /* ... more colors */
}
```

### Modifying Recording Quality

In `script.js`, adjust the MediaRecorder options:

```javascript
const options = {
    mimeType: 'video/webm;codecs=vp9,opus',
    videoBitsPerSecond: 5000000  // Change bitrate here
};
```

### Canvas Resolution

Change the canvas dimensions in `script.js`:

```javascript
elements.canvas.width = 1920;  // Width
elements.canvas.height = 1080; // Height
```

## 🐛 Troubleshooting

### Recording Not Starting

1. Ensure you're using HTTPS or localhost
2. Check browser permissions (camera, microphone, screen)
3. Try a different browser (Chrome/Edge recommended)

### No Audio in Recording

1. Make sure "System Audio" checkbox is enabled
2. When sharing screen, select "Share audio" in the dialog
3. Check browser audio permissions

### Webcam Not Showing

1. Verify camera is not being used by another application
2. Check browser camera permissions
3. Ensure "Show Webcam" option is checked

### Performance Issues

1. Close unnecessary browser tabs
2. Reduce webcam size percentage
3. Lower recording resolution in code
4. Use Chrome/Edge for better performance

## 📝 Known Limitations

- System audio capture not supported in all browsers
- Safari has limited screen capture support
- Recording large resolutions may impact performance
- WebM format may require conversion for some video editors

## 🔒 Privacy

- All recording happens locally in your browser
- No data is sent to any server
- Recordings are stored only in your browser until downloaded
- Camera/screen access only used during active recording

## 📄 License

MIT License - Feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 💡 Tips for Best Results

1. **Close unnecessary applications** to improve performance
2. **Use Chrome or Edge** for best compatibility
3. **Test audio settings** before important recordings
4. **Position webcam carefully** to not obstruct important content
5. **Record in a quiet environment** for better audio quality
6. **Good lighting** helps webcam video quality
7. **Close warning/notification banners** before starting

## 🎓 Use Cases

- **Product Demos**: Showcase your software or app
- **Tutorials**: Create step-by-step guides
- **Presentations**: Record your presentations with narration
- **Bug Reports**: Show developers exactly what's happening
- **Course Content**: Create educational videos
- **Social Media**: Share quick how-to videos

## 🌟 Future Enhancements

Potential features for future versions:
- Multiple audio source mixing
- Real-time filters and effects
- Drawing/annotation tools
- Countdown timer before recording
- Custom keyboard shortcuts
- MP4 export option
- Cloud storage integration
- Video trimming/editing

---

Made with ❤️ for content creators and educators

