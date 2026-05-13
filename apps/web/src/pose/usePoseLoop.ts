import { useEffect, useRef, useState } from 'react';
import type { PoseEngine } from './PoseEngine';
import type { Pose } from './types';

export interface UsePoseLoopResult {
  pose: Pose | null;
  fps: number;
  ready: boolean;
  error: string | null;
}

export function usePoseLoop(
  videoRef: React.RefObject<HTMLVideoElement>,
  enabled: boolean,
  engine: PoseEngine,
): UsePoseLoopResult {
  const [pose, setPose] = useState<Pose | null>(null);
  const [fps, setFps] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rafRef = useRef<number | null>(null);
  const frameCount = useRef(0);
  const fpsWindowStart = useRef(0);

  useEffect(() => {
    let cancelled = false;
    engine
      .init()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load pose engine');
        }
      });
    return () => {
      cancelled = true;
      engine.dispose();
      setReady(false);
    };
  }, [engine]);

  useEffect(() => {
    if (!enabled || !ready) return;
    const video = videoRef.current;
    if (!video) return;

    const tick = (timestampMs: number) => {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        try {
          setPose(engine.detect(video, timestampMs));
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Pose detect failed');
          return;
        }
        frameCount.current += 1;
        if (fpsWindowStart.current === 0) fpsWindowStart.current = timestampMs;
        const elapsed = timestampMs - fpsWindowStart.current;
        if (elapsed >= 1000) {
          setFps(Math.round((frameCount.current * 1000) / elapsed));
          frameCount.current = 0;
          fpsWindowStart.current = timestampMs;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      frameCount.current = 0;
      fpsWindowStart.current = 0;
    };
  }, [enabled, ready, engine, videoRef]);

  return { pose, fps, ready, error };
}
