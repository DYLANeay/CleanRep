import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

const DEFAULT_WASM_BASE = '/mediapipe/wasm';
const DEFAULT_MODEL_PATH = '/mediapipe/models/pose_landmarker_lite.task';

export class MediaPipePoseEngine {
  constructor(options = {}) {
    this.landmarker = null;
    this.wasmBase = options.wasmBase ?? DEFAULT_WASM_BASE;
    this.modelPath = options.modelPath ?? DEFAULT_MODEL_PATH;
  }

  async init() {
    if (this.landmarker) return;
    const fileset = await FilesetResolver.forVisionTasks(this.wasmBase);
    this.landmarker = await PoseLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: this.modelPath },
      runningMode: 'VIDEO',
      numPoses: 1,
    });
  }

  detect(frame, timestampMs) {
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

  dispose() {
    this.landmarker?.close();
    this.landmarker = null;
  }
}
