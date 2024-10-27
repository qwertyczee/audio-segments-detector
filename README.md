# Audio Segments Detector

A Node.js module for detecting speech segments in audio files. This module analyzes audio files and identifies segments based on energy levels, making it useful for speech detection, silence removal, and audio segmentation tasks.

## Installation

```bash
npm install audio-segments-detector
```

## Features

- Detect speech segments in audio files
- Support for various audio formats (automatically converted to WAV)
- Configurable detection parameters
- TypeScript support
- Promise-based API

## Usage

```javascript
const { detectAudioSegments } = require('audio-segments-detector');

// Basic usage
async function example() {
  try {
    const segments = await detectAudioSegments('path/to/audio.mp3');
    console.log(segments);
    // Output: [{ start: 0, end: 1.5 }, { start: 2.1, end: 3.8 }, ...]
  } catch (error) {
    console.error('Error:', error);
  }
}

// Advanced usage with custom options
async function advancedExample() {
  try {
    const segments = await detectAudioSegments('path/to/audio.wav', {
      threshold: 0.02,
      minSilenceDuration: 700,
      samplingRate: 44100
    });
    console.log(segments);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## API

### detectAudioSegments(audioPath[, options])

Detects audio segments in the specified audio file.

#### Parameters

- `audioPath` (string): Path to the audio file
- `options` (object, optional):
  - `threshold` (number, default: 0.01): Energy threshold for detection
  - `minSilenceDuration` (number, default: 500): Minimum silence duration in milliseconds
  - `samplingRate` (number, default: 16000): Sampling rate in Hz

#### Returns

Promise resolving to an array of segments, where each segment is an object with:
- `start` (number): Start time in seconds
- `end` (number): End time in seconds

## Requirements

- Node.js >= 14.0.0
- FFmpeg (automatically installed via ffmpeg-static)

## License

MIT
