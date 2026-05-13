import { useEffect, useRef, useState } from 'react';

export function usePoseLoop(videoRef, enabled, engine) {
  const [pose, setPose] = useState(null);
  const [fps, setFps] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  const rafRef = useRef(null);
  const frameCount = useRef(0);
  const fpsWindowStart = useRef(null);

  useEffect(() => {
    let cancelled = false;
    engine
      .init()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((e) => {
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

    const tick = (timestampMs) => {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        try {
          setPose(engine.detect(video, timestampMs));
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Pose detect failed');
          return;
        }
        frameCount.current += 1;
        if (fpsWindowStart.current === null) fpsWindowStart.current = timestampMs;
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
      fpsWindowStart.current = null;
    };
  }, [enabled, ready, engine, videoRef]);

  return { pose, fps, ready, error };
}
