# LoopDeck - Video Loop Station

A web-based video loop station inspired by 90s tape deck aesthetics. Create layered audio/video compositions by recording up to 6 video loops from your camera and arranging them into full-length songs.

![LoopDeck](https://img.shields.io/badge/LoopDeck-Video%20Loop%20Station-orange)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

### 🎥 6 Video Loop Channels
- Record video loops directly from your webcam
- Each channel has independent play/stop controls
- Label each channel for easy identification
- Visual indicators show recording and playback status

### 💾 Scene Memory (8 Slots)
- Save your current recording setup to memory slots
- Recall saved scenes instantly for re-recording or playback
- Perfect for iterating on your compositions

### 🎵 Timeline Staging
- Build full-length songs (up to 4 minutes) by arranging segments
- Each segment can include any combination of channels
- Set custom duration for each segment
- Visual playback indicator shows current position

### 🎛️ Master Controls
- Play/stop all channels simultaneously
- Master volume control
- VU meters for visual audio feedback

## Tech Stack

- **Pure HTML5/CSS3/JavaScript** - No build step required
- **MediaRecorder API** - For video/audio capture
- **getUserMedia API** - For camera access
- **GitHub Pages** - For hosting

## Usage

1. **Start Camera**: Click the "CAMERA" button to enable your webcam
2. **Record Loops**: Click "REC" on any channel to start recording, click again to stop
3. **Play Loops**: Use individual channel controls or "PLAY ALL LOOPS" for simultaneous playback
4. **Save Scenes**: Store your current setup in one of 8 memory slots
5. **Build Timeline**: Add segments with different channel combinations to create a full song

## Browser Support

- Chrome (recommended)
- Firefox
- Edge
- Safari (limited support)

**Note**: Requires camera and microphone permissions.

## Design Philosophy

The UI is inspired by professional audio equipment from the early 1990s:
- Dark metallic surfaces with chrome accents
- LED indicators and VU meters
- Mechanical button aesthetics
- Retro digital displays using the VT323 and Orbitron fonts

## Assumptions & Decisions

- **Video Format**: Uses WebM format (with VP9/VP8 codec) as it has the best browser support for MediaRecorder
- **Looping**: Videos loop infinitely until manually stopped
- **Scene Storage**: Scenes are stored in memory (not persisted to localStorage) to avoid storage limits with video blobs
- **Timeline Playback**: Segments play sequentially; active channels play simultaneously within each segment
- **Maximum Duration**: Timeline limited to 4 minutes to keep compositions manageable

## Local Development

Simply open `index.html` in a web browser. No build step or server required.

For testing with a local server:
```bash
python -m http.server 8000
# or
npx serve
```

## License

MIT License - Feel free to use, modify, and distribute.

---

*© 1994 LoopDeck Industries* - A fictional retro brand for a modern web app
