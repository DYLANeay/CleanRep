import type { Pose, PoseFrame } from './types';

export interface PoseEngine {
  init(): Promise<void>;
  detect(frame: PoseFrame, timestampMs: number): Pose | null;
  dispose(): void;
}
