import { describe, expect, it } from 'vitest';
import { isPushupPosture, torsoTiltDeg, wristBelowShoulder } from './posture';

function lm(x, y, visibility = 1) {
  return { x, y, z: 0, visibility };
}

function pose(overrides = {}) {
  const landmarks = Array.from({ length: 33 }, () => lm(0, 0, 0));
  for (const [i, p] of Object.entries(overrides)) landmarks[Number(i)] = p;
  return { landmarks, worldLandmarks: [], timestampMs: 0 };
}

describe('torsoTiltDeg', () => {
  it('returns ~0° for a horizontal torso (plank)', () => {
    const p = pose({
      11: lm(0.3, 0.4),
      23: lm(0.7, 0.4),
      12: lm(0.3, 0.4, 0.1),
      24: lm(0.7, 0.4, 0.1),
    });
    expect(torsoTiltDeg(p)).toBeCloseTo(0);
  });

  it('returns ~90° for a vertical torso (standing)', () => {
    const p = pose({
      11: lm(0.5, 0.3),
      23: lm(0.5, 0.7),
    });
    expect(torsoTiltDeg(p)).toBeCloseTo(90);
  });

  it('returns ~45° for a diagonal torso', () => {
    const p = pose({
      11: lm(0.3, 0.3),
      23: lm(0.7, 0.7),
    });
    expect(torsoTiltDeg(p)).toBeCloseTo(45);
  });

  it('returns null when shoulder and hip are missing', () => {
    expect(torsoTiltDeg(pose())).toBeNull();
  });

  it('picks the side with higher landmark visibility', () => {
    const p = pose({
      11: lm(0.5, 0.3, 0.1),
      23: lm(0.5, 0.7, 0.1),
      12: lm(0.3, 0.4, 0.9),
      24: lm(0.7, 0.4, 0.9),
    });
    expect(torsoTiltDeg(p)).toBeCloseTo(0);
  });
});

describe('wristBelowShoulder', () => {
  it('is true when wrist is below shoulder in image coords', () => {
    const p = pose({
      11: lm(0.4, 0.3),
      13: lm(0.4, 0.5),
      15: lm(0.4, 0.7),
    });
    expect(wristBelowShoulder(p)).toBe(true);
  });

  it('is false when wrist is above shoulder', () => {
    const p = pose({
      11: lm(0.4, 0.5),
      13: lm(0.4, 0.3),
      15: lm(0.4, 0.1),
    });
    expect(wristBelowShoulder(p)).toBe(false);
  });

  it('picks the arm with higher visibility', () => {
    const p = pose({
      11: lm(0.4, 0.5, 0.1),
      13: lm(0.4, 0.4, 0.1),
      15: lm(0.4, 0.3, 0.1),
      12: lm(0.6, 0.3, 0.9),
      14: lm(0.6, 0.5, 0.9),
      16: lm(0.6, 0.7, 0.9),
    });
    expect(wristBelowShoulder(p)).toBe(true);
  });
});

describe('isPushupPosture', () => {
  it('accepts horizontal torso with wrist below shoulder', () => {
    const p = pose({
      11: lm(0.3, 0.4),
      23: lm(0.7, 0.4),
      13: lm(0.3, 0.55),
      15: lm(0.3, 0.7),
    });
    expect(isPushupPosture(p)).toBe(true);
  });

  it('rejects vertical torso (standing)', () => {
    const p = pose({
      11: lm(0.5, 0.3),
      23: lm(0.5, 0.7),
      13: lm(0.55, 0.4),
      15: lm(0.6, 0.5),
    });
    expect(isPushupPosture(p)).toBe(false);
  });

  it('rejects horizontal torso when wrist is above shoulder', () => {
    const p = pose({
      11: lm(0.3, 0.4),
      23: lm(0.7, 0.4),
      13: lm(0.3, 0.3),
      15: lm(0.3, 0.2),
    });
    expect(isPushupPosture(p)).toBe(false);
  });

  it('respects a relaxed wrist requirement', () => {
    const p = pose({
      11: lm(0.3, 0.4),
      23: lm(0.7, 0.4),
      13: lm(0.3, 0.3),
      15: lm(0.3, 0.2),
    });
    expect(isPushupPosture(p, { requireWristBelowShoulder: false })).toBe(true);
  });

  it('respects a custom max tilt', () => {
    const p = pose({
      11: lm(0.3, 0.3),
      23: lm(0.7, 0.7),
      13: lm(0.3, 0.55),
      15: lm(0.3, 0.7),
    });
    expect(isPushupPosture(p)).toBe(false);
    expect(isPushupPosture(p, { maxTorsoTiltDeg: 60 })).toBe(true);
  });
});
