const { AudioSegmentsDetector } = require('./detector');

/**
 * Detects audio segments in an audio file
 * @param {string} audioPath - Path to the audio file
 * @param {Object} [options] - Detection options
 * @param {number} [options.threshold=0.01] - Energy threshold for detection
 * @param {number} [options.minSilenceDuration=500] - Minimum silence duration in ms
 * @param {number} [options.samplingRate=16000] - Sampling rate in Hz
 * @returns {Promise<Array<{start: number, end: number}>>} Array of segments with start and end times in seconds
 */
async function detectAudioSegments(audioPath, options = {}) {
    const detector = new AudioSegmentsDetector(options);
    return detector.processFile(audioPath);
}

module.exports = {
    detectAudioSegments,
    AudioSegmentsDetector
};