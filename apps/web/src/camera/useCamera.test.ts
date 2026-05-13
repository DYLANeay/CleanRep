import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCamera } from './useCamera';

function makeStream(): MediaStream {
  const track = { stop: vi.fn() } as unknown as MediaStreamTrack;
  return {
    getTracks: () => [track],
  } as unknown as MediaStream;
}

describe('useCamera', () => {
  const getUserMedia = vi.fn();

  beforeEach(() => {
    Object.defineProperty(globalThis.navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });
    getUserMedia.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts in idle state', () => {
    const { result } = renderHook(() => useCamera());
    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBeNull();
  });

  it('transitions to streaming on successful getUserMedia', async () => {
    getUserMedia.mockResolvedValue(makeStream());
    const { result } = renderHook(() => useCamera());
    await act(async () => {
      await result.current.start();
    });
    await waitFor(() => expect(result.current.status).toBe('streaming'));
  });

  it('reports denied state when permission is refused', async () => {
    const err = new DOMException('denied', 'NotAllowedError');
    getUserMedia.mockRejectedValue(err);
    const { result } = renderHook(() => useCamera());
    await act(async () => {
      await result.current.start();
    });
    expect(result.current.status).toBe('denied');
    expect(result.current.error).toMatch(/permission/i);
  });

  it('reports error state for non-permission failures', async () => {
    getUserMedia.mockRejectedValue(new DOMException('boom', 'NotFoundError'));
    const { result } = renderHook(() => useCamera());
    await act(async () => {
      await result.current.start();
    });
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('boom');
  });

  it('stop() releases tracks and returns to idle', async () => {
    const stream = makeStream();
    getUserMedia.mockResolvedValue(stream);
    const { result } = renderHook(() => useCamera());
    await act(async () => {
      await result.current.start();
    });
    await waitFor(() => expect(result.current.status).toBe('streaming'));
    act(() => result.current.stop());
    expect(result.current.status).toBe('idle');
    expect((stream.getTracks()[0] as unknown as { stop: ReturnType<typeof vi.fn> }).stop).toHaveBeenCalled();
  });
});
