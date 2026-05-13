import { describe, expect, it } from 'vitest';
import { angleAt, elbowAngle } from './angle';

function lm(x, y, visibility = 1) {
  return { x, y, z: 0, visibility };
}

function makePose(landmarks) {
  return { landmarks, worldLandmarks: [], timestampMs: 0 };
}

describe('angleAt', () => {
  it('returns 180° for a straight line through the vertex', () => {
    expect(angleAt(lm(0, 0), lm(1, 0), lm(2, 0))).toBeCloseTo(180);
  });

  it('returns 90° for a perpendicular L', () => {
    expect(angleAt(lm(0, 1), lm(0, 0), lm(1, 0))).toBeCloseTo(90);
  });

  it('returns 0° when both arms point the same direction', () => {
    expect(angleAt(lm(1, 0), lm(0, 0), lm(1, 0))).toBeCloseTo(0);
  });

  it('handles degenerate zero-length vectors as 0', () => {
    expect(angleAt(lm(0, 0), lm(0, 0), lm(1, 0))).toBe(0);
  });
});

describe('elbowAngle', () => {
  function poseWith(left, right) {
    const landmarks = Array.from({ length: 33 }, () => lm(0, 0, 1));
    if (left[11]) landmarks[11] = left[11];
    if (left[13]) landmarks[13] = left[13];
    if (left[15]) landmarks[15] = left[15];
    if (right[12]) landmarks[12] = right[12];
    if (right[14]) landmarks[14] = right[14];
    if (right[16]) landmarks[16] = right[16];
    return makePose(landmarks);
  }

  it('uses left arm when its average visibility ≥ right', () => {
    const pose = poseWith(
      { 11: lm(0, 1, 0.9), 13: lm(0, 0, 0.9), 15: lm(1, 0, 0.9) },
      { 12: lm(0, 1, 0.1), 14: lm(0, 0, 0.1), 16: lm(0, 1, 0.1) },
    );
    expect(elbowAngle(pose)).toBeCloseTo(90);
  });

  it('uses right arm when its visibility is higher', () => {
    const pose = poseWith(
      { 11: lm(0, 1, 0.1), 13: lm(0, 0, 0.1), 15: lm(0, 1, 0.1) },
      { 12: lm(0, 1, 0.9), 14: lm(0, 0, 0.9), 16: lm(1, 0, 0.9) },
    );
    expect(elbowAngle(pose)).toBeCloseTo(90);
  });

  it('returns null when required landmarks are missing', () => {
    const landmarks = Array.from({ length: 12 }, () => lm(0, 0));
    expect(elbowAngle(makePose(landmarks))).toBeNull();
  });
});
