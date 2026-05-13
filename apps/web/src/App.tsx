import { useEffect, useState } from 'react';

type HealthStatus = 'loading' | 'ok' | 'error';

export function App() {
  const [status, setStatus] = useState<HealthStatus>('loading');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/v1/health')
      .then((r) => r.json())
      .then((data: { ok: boolean }) => {
        if (!cancelled) setStatus(data.ok ? 'ok' : 'error');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main>
      <h1>CleanRep</h1>
      <p>API: {status}</p>
    </main>
  );
}
