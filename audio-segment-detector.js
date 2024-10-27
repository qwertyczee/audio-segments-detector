const fs = require('fs');
const { decode } = require('wav-decoder');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);

class SentenceDetector {
    constructor(threshold = 0.01, minSilenceDurationMs = 500, samplingRate = 16000) {
        this.threshold = threshold;
        this.minSilenceSamples = (samplingRate * minSilenceDurationMs) / 1000;
        this.samplingRate = samplingRate;
        this.timestamps = [];
        this.triggered = false;
        this.silenceCounter = 0;
        this.minGapSamples = (samplingRate * 500) / 1000;
    }

    detectEnergy(samples) {
        return samples.reduce((sum, sample) => sum + sample ** 2, 0) / samples.length;
    }

    processAudioChunk(chunk, currentSample) {
        const energy = this.detectEnergy(chunk);

        if (energy > this.threshold && !this.triggered) {
            this.triggered = true;
            this.silenceCounter = 0;
            const start = currentSample / this.samplingRate;

            if (this.timestamps.length > 0 && this.timestamps[this.timestamps.length - 1].end > start) {
                this.timestamps[this.timestamps.length - 1].end = start;
            }

            this.timestamps.push({ start });
        } else if (energy < this.threshold && this.triggered) {
            this.silenceCounter += chunk.length;

            if (this.silenceCounter >= this.minSilenceSamples) {
                this.triggered = false;
                const end = (currentSample + this.silenceCounter) / this.samplingRate;

                const lastTimestamp = this.timestamps[this.timestamps.length - 1];
                if (end - lastTimestamp.start >= this.minGapSamples / this.samplingRate) {
                    lastTimestamp.end = end;
                } else {
                    lastTimestamp.end = lastTimestamp.start + this.minGapSamples / this.samplingRate;
                }

                this.silenceCounter = 0;
            }
        }
    }

    getTimestamps() {
        return this.timestamps;
    }

    adjustTimestamps(totalDurationSeconds) {
        if (this.timestamps.length === 0) return;

        this.timestamps[0].start = 0;
        this.timestamps[this.timestamps.length - 1].end = totalDurationSeconds;
    }
}

async function processWavFile(filePath) {
    try {
        const buffer = fs.readFileSync(filePath);
        const decoded = await decode(buffer);
        const { channelData, sampleRate } = decoded;
        const samples = channelData[0];

        const detector = new SentenceDetector(0.01, 500, sampleRate);

        for (let i = 0; i < samples.length; i += 4096) {
            const chunk = samples.slice(i, i + 4096);
            detector.processAudioChunk(chunk, i);
        }

        const totalDurationSeconds = samples.length / sampleRate;
        detector.adjustTimestamps(totalDurationSeconds);

        return detector.getTimestamps();
    } catch (error) {
        return { error: "Error processing WAV file: " + error.message };
    }
}

async function processAudioFile(filePath) {
    try {
        const fileType = filePath.split('.').pop().toLowerCase();
        let result;

        if (fileType !== 'wav') {
            const tempWavPath = `${filePath}.wav`;
            result = await new Promise((resolve, reject) => {
                ffmpeg(filePath)
                    .toFormat('wav')
                    .save(tempWavPath)
                    .on('end', async () => {
                        result = await processWavFile(tempWavPath);
                        resolve(result);
                    })
                    .on('error', (err) => {
                        reject({ error: "Error during conversion: " + err.message });
                    });
            });
        } else {
            result = await processWavFile(filePath);
        }
        return result;
    } catch (error) {
        return { error: "Error while processing the audio file: " + error.message };
    }
}

async function audio_segments(audioPath) {
    try {
        const result = await processAudioFile(audioPath);
        return result;
    } catch (err) {
        return { error: 'Error: ' + err.message };
    }
}

module.exports = { audio_segments };
