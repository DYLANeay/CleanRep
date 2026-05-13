import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useRepCounter } from './useRepCounter';

function lm(x, y, visibility = 1) {
  return { x, y, z: 0, visibility };
}

function plankPose(elbowDeg, timestampMs) {
  const landmarks = Array.from({ length: 33 }, () => lm(0, 0, 0));
  // Horizontal torso, well-visible left side.
  landmarks[11] = lm(0.3, 0.4);
  landmarks[23] = lm(0.7, 0.4);
  // Left arm: shoulder (0.3, 0.4), elbow below at (0.3, 0.6), wrist placed to make `elbowDeg` at the elbow.
  // elbow→shoulder direction = (0, -1). Rotating by θ CCW gives (sin θ, -cos θ).
  const elbow = { x: 0.3, y: 0.6 };
  const theta = (elbowDeg * Math.PI) / 180;
  const wrist = { x: elbow.x + 0.2 * Math.sin(theta), y: elbow.y - 0.2 * Math.cos(theta) };
  landmarks[13] = lm(elbow.x, elbow.y);
  landmarks[15] = lm(wrist.x, wrist.y);
  return { landmarks, worldLandmarks: [], timestampMs };
}

function standingFlexPose(elbowDeg, timestampMs) {
  // Same arm geometry, vertical torso. Posture check should reject.
  const landmarks = Array.from({ length: 33 }, () => lm(0, 0, 0));
  landmarks[11] = lm(0.5, 0.3);
  landmarks[23] = lm(0.5, 0.7);
  const elbow = { x: 0.5, y: 0.5 };
  const theta = (elbowDeg * Math.PI) / 180;
  const wrist = { x: elbow.x + 0.2 * Math.sin(theta), y: elbow.y - 0.2 * Math.cos(theta) };
  landmarks[13] = lm(elbow.x, elbow.y);
  landmarks[15] = lm(wrist.x, wrist.y);
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
    expect(result.current.inPosture).toBe(false);
  });

  it('counts a valid rep when angle dips below depth in a plank posture', () => {
    const { result, rerender } = renderHook(({ pose }) => useRepCounter(pose), {
      initialProps: { pose: plankPose(170, 0) },
    });
    rerender({ pose: plankPose(80, 100) });
    rerender({ pose: plankPose(170, 200) });
    expect(result.current.inPosture).toBe(true);
    expect(result.current.validCount).toBe(1);
    expect(result.current.rejectedCount).toBe(0);
    expect(result.current.lastRep?.valid).toBe(true);
  });

  it('marks a shallow rep as rejected (insufficient depth)', () => {
    const { result, rerender } = renderHook(({ pose }) => useRepCounter(pose), {
      initialProps: { pose: plankPose(170, 0) },
    });
    rerender({ pose: plankPose(100, 100) });
    rerender({ pose: plankPose(170, 200) });
    expect(result.current.validCount).toBe(0);
    expect(result.current.rejectedCount).toBe(1);
    expect(result.current.lastRep?.faults).toContain('INSUFFICIENT_DEPTH');
  });

  it('does NOT count reps when only the arm cycles while standing', () => {
    const { result, rerender } = renderHook(({ pose }) => useRepCounter(pose), {
      initialProps: { pose: standingFlexPose(170, 0) },
    });
    rerender({ pose: standingFlexPose(80, 100) });
    rerender({ pose: standingFlexPose(170, 200) });
    expect(result.current.inPosture).toBe(false);
    expect(result.current.validCount).toBe(0);
    expect(result.current.rejectedCount).toBe(0);
    expect(result.current.lastRep).toBeNull();
  });
});
