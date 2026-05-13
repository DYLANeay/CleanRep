import { useEffect, useMemo, useState } from 'react';
import { useCamera } from './camera/useCamera';
import { SkeletonOverlay } from './overlay/SkeletonOverlay';
import { MediaPipePoseEngine } from './pose/mediapipe';
import { usePoseLoop } from './pose/usePoseLoop';

type HealthStatus = 'loading' | 'ok' | 'error';

const stageStyle: React.CSSProperties = {
  position: 'relative',
  display: 'inline-block',
  lineHeight: 0,
};

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
};

export function App() {
  const [apiStatus, setApiStatus] = useState<HealthStatus>('loading');
  const { videoRef, status: camStatus, error: camError, start, stop } = useCamera();
  const engine = useMemo(() => new MediaPipePoseEngine(), []);
  const {
    pose,
    fps,
    ready: engineReady,
    error: engineError,
  } = usePoseLoop(videoRef, camStatus === 'streaming', engine);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/v1/health')
      .then((r) => r.json())
      .then((data: { ok: boolean }) => {
        if (!cancelled) setApiStatus(data.ok ? 'ok' : 'error');
      })
      .catch(() => {
        if (!cancelled) setApiStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main>
      <h1>CleanRep</h1>
      <p>API: {apiStatus}</p>
      <section>
        <h2>Camera</h2>
        <p>Status: {camStatus}</p>
        {camError && <p role="alert">{camError}</p>}
        <div style={stageStyle}>
          <video ref={videoRef} autoPlay playsInline muted />
          <SkeletonOverlay pose={pose} videoRef={videoRef} style={overlayStyle} />
        </div>
        <div>
          <button onClick={start} disabled={camStatus === 'streaming' || camStatus === 'requesting'}>
            Start camera
          </button>
          <button onClick={stop} disabled={camStatus !== 'streaming'}>
            Stop camera
          </button>
        </div>
      </section>
      <section>
        <h2>Pose</h2>
        <p>Engine: {engineReady ? 'ready' : 'loading…'}</p>
        {engineError && <p role="alert">{engineError}</p>}
        <p>FPS: {fps}</p>
        <p>Landmarks: {pose?.landmarks.length ?? 0}</p>
      </section>
      <style>{`.overlay { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }`}</style>
    </main>
  );
}
