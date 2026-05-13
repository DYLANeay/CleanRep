import { act, renderHook, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePoseLoop } from './usePoseLoop';

function setupRaf() {
  let pending = [];
  let nextId = 0;
  const raf = vi.fn((cb) => {
    nextId += 1;
    pending.push({ id: nextId, cb });
    return nextId;
  });
  const caf = vi.fn((id) => {
    pending = pending.filter((e) => e.id !== id);
  });
  vi.stubGlobal('requestAnimationFrame', raf);
  vi.stubGlobal('cancelAnimationFrame', caf);
  return {
    raf,
    caf,
    tick(timestamp) {
      const drain = pending;
      pending = [];
      drain.forEach((e) => e.cb(timestamp));
    },
    get pendingCount() {
      return pending.length;
    },
  };
}

function makeEngine(detectResult = null) {
  return {
    init: vi.fn(async () => undefined),
    detect: vi.fn(() => detectResult),
    dispose: vi.fn(),
  };
}

function videoRefFor(readyState = 4) {
  const ref = createRef();
  ref.current = { readyState };
  return ref;
}

describe('usePoseLoop', () => {
  let rafCtl;

  beforeEach(() => {
    rafCtl = setupRaf();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls engine.init on mount and sets ready when it resolves', async () => {
    const engine = makeEngine();
    const ref = videoRefFor();
    const { result } = renderHook(() => usePoseLoop(ref, false, engine));
    expect(engine.init).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(result.current.ready).toBe(true));
  });

  it('does not schedule rAF while disabled', async () => {
    const engine = makeEngine();
    const ref = videoRefFor();
    const { result } = renderHook(() => usePoseLoop(ref, false, engine));
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(rafCtl.raf).not.toHaveBeenCalled();
  });

  it('drives engine.detect each frame while enabled and ready', async () => {
    const pose = { landmarks: [{ x: 0, y: 0, z: 0 }], worldLandmarks: [], timestampMs: 0 };
    const engine = makeEngine(pose);
    const ref = videoRefFor();
    const { result } = renderHook(() => usePoseLoop(ref, true, engine));
    await waitFor(() => expect(result.current.ready).toBe(true));
    await waitFor(() => expect(rafCtl.raf).toHaveBeenCalled());

    act(() => rafCtl.tick(16));
    act(() => rafCtl.tick(32));

    expect(engine.detect).toHaveBeenCalledTimes(2);
    expect(engine.detect).toHaveBeenNthCalledWith(1, ref.current, 16);
    expect(result.current.pose).toEqual({
      landmarks: pose.landmarks,
      worldLandmarks: [],
      timestampMs: 0,
    });
  });

  it('reports fps after a 1-second window', async () => {
    const engine = makeEngine({ landmarks: [], worldLandmarks: [], timestampMs: 0 });
    const ref = videoRefFor();
    const { result } = renderHook(() => usePoseLoop(ref, true, engine));
    await waitFor(() => expect(result.current.ready).toBe(true));
    await waitFor(() => expect(rafCtl.raf).toHaveBeenCalled());

    act(() => rafCtl.tick(0));
    act(() => rafCtl.tick(500));
    act(() => rafCtl.tick(1000));

    expect(result.current.fps).toBe(3);
  });

  it('skips detect when video is not ready', async () => {
    const engine = makeEngine();
    const ref = videoRefFor(0);
    renderHook(() => usePoseLoop(ref, true, engine));
    await waitFor(() => expect(rafCtl.raf).toHaveBeenCalled());

    act(() => rafCtl.tick(16));
    expect(engine.detect).not.toHaveBeenCalled();
  });

  it('disposes the engine on unmount', async () => {
    const engine = makeEngine();
    const ref = videoRefFor();
    const { unmount, result } = renderHook(() => usePoseLoop(ref, true, engine));
    await waitFor(() => expect(result.current.ready).toBe(true));
    unmount();
    expect(engine.dispose).toHaveBeenCalled();
  });

  it('surfaces an error if engine.init rejects', async () => {
    const engine = makeEngine();
    engine.init.mockRejectedValue(new Error('wasm 404'));
    const ref = videoRefFor();
    const { result } = renderHook(() => usePoseLoop(ref, true, engine));
    await waitFor(() => expect(result.current.error).toBe('wasm 404'));
    expect(result.current.ready).toBe(false);
  });
});
