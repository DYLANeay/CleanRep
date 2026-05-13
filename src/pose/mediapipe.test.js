import { beforeEach, describe, expect, it, vi } from 'vitest';

const { detectForVideo, close, createFromOptions, forVisionTasks } = vi.hoisted(() => {
  const detectForVideo = vi.fn();
  const close = vi.fn();
  const createFromOptions = vi.fn(async () => ({ detectForVideo, close }));
  const forVisionTasks = vi.fn(async () => ({}));
  return { detectForVideo, close, createFromOptions, forVisionTasks };
});

vi.mock('@mediapipe/tasks-vision', () => ({
  FilesetResolver: { forVisionTasks },
  PoseLandmarker: { createFromOptions },
}));

import { MediaPipePoseEngine } from './mediapipe';

describe('MediaPipePoseEngine', () => {
  beforeEach(() => {
    forVisionTasks.mockClear();
    createFromOptions.mockClear();
    detectForVideo.mockReset();
    close.mockClear();
  });

  it('init resolves and wires the fileset + landmarker', async () => {
    const engine = new MediaPipePoseEngine({
      wasmBase: '/custom/wasm',
      modelPath: '/custom/model.task',
    });
    await engine.init();
    expect(forVisionTasks).toHaveBeenCalledWith('/custom/wasm');
    expect(createFromOptions).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        baseOptions: { modelAssetPath: '/custom/model.task' },
        runningMode: 'VIDEO',
        numPoses: 1,
      }),
    );
  });

  it('init is idempotent — second call does not re-create the landmarker', async () => {
    const engine = new MediaPipePoseEngine();
    await engine.init();
    await engine.init();
    expect(createFromOptions).toHaveBeenCalledTimes(1);
  });

  it('detect throws when called before init', () => {
    const engine = new MediaPipePoseEngine();
    expect(() => engine.detect({}, 0)).toThrow(/before init/);
  });

  it('detect returns null when MediaPipe finds no landmarks', async () => {
    detectForVideo.mockReturnValue({ landmarks: [], worldLandmarks: [] });
    const engine = new MediaPipePoseEngine();
    await engine.init();
    expect(engine.detect({}, 100)).toBeNull();
  });

  it('detect returns a Pose with landmarks and timestamp', async () => {
    const landmarks = [{ x: 0.1, y: 0.2, z: 0.3, visibility: 0.9 }];
    const worldLandmarks = [{ x: 1, y: 2, z: 3 }];
    detectForVideo.mockReturnValue({
      landmarks: [landmarks],
      worldLandmarks: [worldLandmarks],
    });
    const engine = new MediaPipePoseEngine();
    await engine.init();
    const pose = engine.detect({}, 250);
    expect(pose).toEqual({ landmarks, worldLandmarks, timestampMs: 250 });
  });

  it('dispose closes the landmarker and allows re-init', async () => {
    const engine = new MediaPipePoseEngine();
    await engine.init();
    engine.dispose();
    expect(close).toHaveBeenCalledTimes(1);
    await engine.init();
    expect(createFromOptions).toHaveBeenCalledTimes(2);
  });
});
