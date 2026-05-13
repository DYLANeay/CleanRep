import { describe, expect, it } from 'vitest';
import { RepCounter } from './repCounter';

describe('RepCounter', () => {
  it('starts in UP with no reps', () => {
    const c = new RepCounter();
    expect(c.currentState).toBe('UP');
    expect(c.update(170, 0)).toBeNull();
  });

  it('counts a valid rep when going down past 90° and back up past 160°', () => {
    const c = new RepCounter();
    expect(c.update(170, 0)).toBeNull();
    expect(c.update(120, 100)).toBeNull();
    expect(c.update(100, 200)).toBeNull();
    expect(c.update(80, 300)).toBeNull();
    expect(c.update(120, 400)).toBeNull();
    const rep = c.update(170, 500);
    expect(rep).not.toBeNull();
    expect(rep).toMatchObject({
      index: 0,
      startedAt: 100,
      endedAt: 500,
      minElbowAngle: 80,
      valid: true,
      faults: [],
    });
    expect(c.currentState).toBe('UP');
  });

  it('marks the rep as INSUFFICIENT_DEPTH when min angle stays above the depth threshold', () => {
    const c = new RepCounter();
    c.update(170, 0);
    c.update(100, 100);
    c.update(95, 200);
    const rep = c.update(170, 300);
    expect(rep).not.toBeNull();
    expect(rep?.valid).toBe(false);
    expect(rep?.faults).toEqual(['INSUFFICIENT_DEPTH']);
  });

  it('counts multiple reps sequentially', () => {
    const c = new RepCounter();
    const seq = [170, 100, 80, 170, 100, 80, 170];
    const reps = seq.map((a, i) => c.update(a, i * 100)).filter((r) => r !== null);
    expect(reps).toHaveLength(2);
    expect(reps[0]?.index).toBe(0);
    expect(reps[1]?.index).toBe(1);
  });

  it('ignores small jitter that does not cross thresholds', () => {
    const c = new RepCounter();
    for (const a of [170, 165, 168, 172, 169]) expect(c.update(a, 0)).toBeNull();
    expect(c.currentState).toBe('UP');
  });

  it('reset clears state and rep index', () => {
    const c = new RepCounter();
    c.update(170, 0);
    c.update(80, 100);
    c.update(170, 200);
    c.reset();
    expect(c.currentState).toBe('UP');
    const next = c.update(170, 0);
    expect(next).toBeNull();
    c.update(80, 100);
    const rep = c.update(170, 200);
    expect(rep?.index).toBe(0);
  });

  it('honors custom thresholds', () => {
    const c = new RepCounter({ upThreshold: 150, downThreshold: 120, depthThreshold: 100 });
    c.update(155, 0);
    expect(c.update(110, 100)).toBeNull();
    expect(c.currentState).toBe('DOWN');
    const rep = c.update(160, 200);
    expect(rep?.valid).toBe(false);
    expect(rep?.minElbowAngle).toBe(110);
  });
});
