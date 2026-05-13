export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface Pose {
  landmarks: Landmark[];
  worldLandmarks: Landmark[];
  timestampMs: number;
}

export type PoseFrame = HTMLVideoElement | HTMLCanvasElement | ImageBitmap;
