const fs = require('fs');
const { decode } = require('wav-decoder');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);

class AudioSegmentsDetector {
    constructor(options = {}) {
        this.threshold = options.threshold || 0.01;
        this.minSilenceDurationMs = options.minSilenceDuration || 500;
        this.samplingRate = options.samplingRate || 16000;
        this.minSilenceSamples = (this.samplingRate * this.minSilenceDurationMs) / 1000;
        this.timestamps = [];
        this.triggered = false;
        this.silenceCounter = 0;
        this.minGapSamples = (this.samplingRate * 500) / 1000;
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

    async processWavFile(filePath) {
        try {
        const buffer = fs.readFileSync(filePath);
        const decoded = await decode(buffer);
        const { channelData, sampleRate } = decoded;
        const samples = channelData[0];

        for (let i = 0; i < samples.length; i += 4096) {
            const chunk = samples.slice(i, i + 4096);
            this.processAudioChunk(chunk, i);
        }

        const totalDurationSeconds = samples.length / sampleRate;
        this.adjustTimestamps(totalDurationSeconds);

        return this.getTimestamps();
        } catch (error) {
            throw new Error(`Error processing WAV file: ${error.message}`);
        }
    }

    async processFile(filePath) {
        try {
        const fileType = filePath.split('.').pop().toLowerCase();
        
        if (fileType !== 'wav') {
            const tempWavPath = `${filePath}.wav`;
            return new Promise((resolve, reject) => {
            ffmpeg(filePath)
                .toFormat('wav')
                .save(tempWavPath)
                .on('end', async () => {
                    try {
                        const result = await this.processWavFile(tempWavPath);
                        fs.unlinkSync(tempWavPath);
                        resolve(result);
                    } catch (err) {
                        reject(err);
                    }
                })
                .on('error', (err) => {
                    reject(new Error(`Error during conversion: ${err.message}`));
                });
            });
        }
        
        return await this.processWavFile(filePath);
        } catch (error) {
            throw new Error(`Error processing audio file: ${error.message}`);
        }
    }
}

module.exports = { AudioSegmentsDetector };
