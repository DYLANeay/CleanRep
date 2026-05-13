import { useCallback, useEffect, useRef, useState } from 'react';

export function useCamera(constraints = { video: true }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus('idle');
  }, []);

  const start = useCallback(async () => {
    if (streamRef.current) return;
    setStatus('requesting');
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setStatus('streaming');
    } catch (e) {
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setStatus('denied');
        setError('Camera permission denied');
      } else {
        setStatus('error');
        setError(e.message || 'Failed to access camera');
      }
    }
  }, [constraints]);

  useEffect(() => () => stop(), [stop]);

  return { videoRef, status, error, start, stop };
}
