import { useEffect, useState } from 'react';
import { useCamera } from './camera/useCamera';

type HealthStatus = 'loading' | 'ok' | 'error';

export function App() {
  const [apiStatus, setApiStatus] = useState<HealthStatus>('loading');
  const { videoRef, status: camStatus, error: camError, start, stop } = useCamera();

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
        <video ref={videoRef} autoPlay playsInline muted />
        <div>
          <button onClick={start} disabled={camStatus === 'streaming' || camStatus === 'requesting'}>
            Start camera
          </button>
          <button onClick={stop} disabled={camStatus !== 'streaming'}>
            Stop camera
          </button>
        </div>
      </section>
    </main>
  );
}
