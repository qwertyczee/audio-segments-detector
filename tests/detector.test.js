const { detectAudioSegments, AudioSegmentsDetector } = require('../src');
const path = require('path');

describe('AudioSegmentsDetector', () => {
    test('should detect segments in WAV file', async () => {
        const testFile = path.join(__dirname, 'fixtures/test.wav');
        const segments = await detectAudioSegments(testFile);
        
        expect(Array.isArray(segments)).toBe(true);
        segments.forEach(segment => {
            expect(segment).toHaveProperty('start');
            expect(segment).toHaveProperty('end');
            expect(segment.start).toBeLessThan(segment.end);
        });
    });

    test('should handle custom options', async () => {
        const detector = new AudioSegmentsDetector({
            threshold: 0.02,
            minSilenceDuration: 700,
            samplingRate: 44100
        });

        expect(detector.threshold).toBe(0.02);
        expect(detector.minSilenceDurationMs).toBe(700);
        expect(detector.samplingRate).toBe(44100);
    });

    test('should throw error for non-existent file', async () => {
        await expect(detectAudioSegments('non-existent.wav'))
            .rejects
            .toThrow('Error processing audio file');
    });
});
