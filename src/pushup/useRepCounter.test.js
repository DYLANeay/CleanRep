import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useRepCounter } from './useRepCounter';

function lm(x, y) {
  return { x, y, z: 0, visibility: 1 };
}

function poseAtAngle(degrees, timestampMs) {
  const radians = (degrees * Math.PI) / 180;
  const landmarks = Array.from({ length: 33 }, () => lm(0, 0));
  landmarks[11] = lm(Math.cos(radians), Math.sin(radians));
  landmarks[13] = lm(0, 0);
  landmarks[15] = lm(1, 0);
  return { landmarks, worldLandmarks: [], timestampMs };
}

describe('useRepCounter', () => {
  it('returns zero counts initially', () => {
    const { result } = renderHook(({ pose }) => useRepCounter(pose), {
      initialProps: { pose: null },
    });
    expect(result.current.validCount).toBe(0);
    expect(result.current.rejectedCount).toBe(0);
    expect(result.current.currentAngle).toBeNull();
  });

  it('counts a valid rep when angle dips below depth and returns to UP', () => {
    const { result, rerender } = renderHook(({ pose }) => useRepCounter(pose), {
      initialProps: { pose: poseAtAngle(170, 0) },
    });
    rerender({ pose: poseAtAngle(80, 100) });
    rerender({ pose: poseAtAngle(170, 200) });
    expect(result.current.validCount).toBe(1);
    expect(result.current.rejectedCount).toBe(0);
    expect(result.current.lastRep?.valid).toBe(true);
  });

  it('marks a shallow rep as rejected', () => {
    const { result, rerender } = renderHook(({ pose }) => useRepCounter(pose), {
      initialProps: { pose: poseAtAngle(170, 0) },
    });
    rerender({ pose: poseAtAngle(100, 100) });
    rerender({ pose: poseAtAngle(170, 200) });
    expect(result.current.validCount).toBe(0);
    expect(result.current.rejectedCount).toBe(1);
    expect(result.current.lastRep?.faults).toEqual(['INSUFFICIENT_DEPTH']);
  });
});
