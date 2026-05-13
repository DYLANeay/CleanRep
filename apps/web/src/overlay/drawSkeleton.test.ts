import { describe, expect, it, vi } from 'vitest';
import type { Landmark, Pose } from '../pose/types';
import { POSE_CONNECTIONS } from './connections';
import { drawSkeleton } from './drawSkeleton';

function fakeCtx() {
  return {
    lineWidth: 0,
    strokeStyle: '',
    fillStyle: '',
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    clearRect: vi.fn(),
  } as unknown as CanvasRenderingContext2D & {
    beginPath: ReturnType<typeof vi.fn>;
    moveTo: ReturnType<typeof vi.fn>;
    lineTo: ReturnType<typeof vi.fn>;
    stroke: ReturnType<typeof vi.fn>;
    arc: ReturnType<typeof vi.fn>;
    fill: ReturnType<typeof vi.fn>;
  };
}

function makePose(landmarks: Landmark[]): Pose {
  return { landmarks, worldLandmarks: [], timestampMs: 0 };
}

function fullPose(visibility = 1): Pose {
  const landmarks = Array.from({ length: 33 }, (_, i) => ({
    x: i / 33,
    y: 1 - i / 33,
    z: 0,
    visibility,
  }));
  return makePose(landmarks);
}

describe('drawSkeleton', () => {
  it('draws every connection when all landmarks are visible', () => {
    const ctx = fakeCtx();
    drawSkeleton(ctx, fullPose(), { width: 100, height: 200 });
    expect(ctx.stroke).toHaveBeenCalledTimes(POSE_CONNECTIONS.length);
    expect(ctx.fill).toHaveBeenCalledTimes(33);
  });

  it('scales normalized landmark coords by width/height', () => {
    const ctx = fakeCtx();
    const pose = makePose([
      { x: 0.25, y: 0.5, z: 0, visibility: 1 },
      { x: 0.75, y: 0.5, z: 0, visibility: 1 },
    ]);
    // Use a custom connection set by patching POSE_CONNECTIONS — easier: just test via arc on point[0]
    drawSkeleton(ctx, pose, { width: 400, height: 200 });
    expect(ctx.arc).toHaveBeenCalledWith(100, 100, 4, 0, Math.PI * 2);
    expect(ctx.arc).toHaveBeenCalledWith(300, 100, 4, 0, Math.PI * 2);
  });

  it('skips landmarks below the visibility threshold', () => {
    const ctx = fakeCtx();
    const pose = fullPose(0.2);
    drawSkeleton(ctx, pose, { width: 100, height: 100, minVisibility: 0.5 });
    expect(ctx.stroke).not.toHaveBeenCalled();
    expect(ctx.fill).not.toHaveBeenCalled();
  });

  it('skips a connection if either endpoint is below visibility', () => {
    const ctx = fakeCtx();
    const landmarks = Array.from({ length: 33 }, () => ({
      x: 0.5,
      y: 0.5,
      z: 0,
      visibility: 1,
    }));
    landmarks[12] = { x: 0.5, y: 0.5, z: 0, visibility: 0.1 };
    drawSkeleton(ctx, makePose(landmarks), { width: 100, height: 100, minVisibility: 0.5 });
    // Connections that touch index 12: [11,12],[12,24],[12,14] — 3 omitted
    expect(ctx.stroke).toHaveBeenCalledTimes(POSE_CONNECTIONS.length - 3);
  });

  it('treats missing visibility as fully visible', () => {
    const ctx = fakeCtx();
    const pose = makePose(
      Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0 })),
    );
    drawSkeleton(ctx, pose, { width: 100, height: 100 });
    expect(ctx.fill).toHaveBeenCalledTimes(33);
  });
});
