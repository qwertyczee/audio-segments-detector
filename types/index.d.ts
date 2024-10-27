declare module 'audio-segments-detector' {
    export interface AudioSegment {
        start: number;
        end: number;
    }
    
    export interface DetectorOptions {
        threshold?: number;
        minSilenceDuration?: number;
        samplingRate?: number;
    }
    
    export class AudioSegmentsDetector {
        constructor(options?: DetectorOptions);
        processFile(filePath: string): Promise<AudioSegment[]>;
    }
    
    export function detectAudioSegments(
        audioPath: string,
        options?: DetectorOptions
    ): Promise<AudioSegment[]>;
}
