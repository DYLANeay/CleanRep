import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import type { PoseEngine } from './PoseEngine';
import type { Pose, PoseFrame } from './types';

const DEFAULT_WASM_BASE = '/mediapipe/wasm';
const DEFAULT_MODEL_PATH = '/mediapipe/models/pose_landmarker_lite.task';

export interface MediaPipePoseEngineOptions {
  wasmBase?: string;
  modelPath?: string;
}

export class MediaPipePoseEngine implements PoseEngine {
  private landmarker: PoseLandmarker | null = null;
  private readonly wasmBase: string;
  private readonly modelPath: string;

  constructor(options: MediaPipePoseEngineOptions = {}) {
    this.wasmBase = options.wasmBase ?? DEFAULT_WASM_BASE;
    this.modelPath = options.modelPath ?? DEFAULT_MODEL_PATH;
  }

  async init(): Promise<void> {
    if (this.landmarker) return;
    const fileset = await FilesetResolver.forVisionTasks(this.wasmBase);
    this.landmarker = await PoseLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: this.modelPath },
      runningMode: 'VIDEO',
      numPoses: 1,
    });
  }

  detect(frame: PoseFrame, timestampMs: number): Pose | null {
    if (!this.landmarker) {
      throw new Error('MediaPipePoseEngine.detect called before init');
    }
    const result = this.landmarker.detectForVideo(frame, timestampMs);
    const landmarks = result.landmarks?.[0];
    if (!landmarks || landmarks.length === 0) return null;
    return {
      landmarks,
      worldLandmarks: result.worldLandmarks?.[0] ?? [],
      timestampMs,
    };
  }

  dispose(): void {
    this.landmarker?.close();
    this.landmarker = null;
  }
}
