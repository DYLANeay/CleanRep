import { useMemo } from 'react';
import { useCamera } from './camera/useCamera';
import { SkeletonOverlay } from './overlay/SkeletonOverlay';
import { MediaPipePoseEngine } from './pose/mediapipe';
import { usePoseLoop } from './pose/usePoseLoop';
import { useRepCounter } from './pushup/useRepCounter';

const stageStyle = {
  position: 'relative',
  display: 'inline-block',
  lineHeight: 0,
};

const overlayStyle = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
};

export function App() {
  const { videoRef, status: camStatus, error: camError, start, stop } = useCamera();
  const engine = useMemo(() => new MediaPipePoseEngine(), []);
  const {
    pose,
    fps,
    ready: engineReady,
    error: engineError,
  } = usePoseLoop(videoRef, camStatus === 'streaming', engine);
  const { validCount, rejectedCount, currentAngle, currentState, lastRep, inPosture } =
    useRepCounter(pose);

  return (
    <main>
      <h1>CleanRep</h1>
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
      <section>
        <h2>Reps</h2>
        <p>Valid: {validCount}</p>
        <p>Rejected: {rejectedCount}</p>
        <p>State: {currentState}</p>
        <p>Posture: {inPosture ? 'ok' : 'not in plank'}</p>
        <p>Elbow angle: {currentAngle === null ? '—' : `${currentAngle.toFixed(1)}°`}</p>
        {lastRep && !lastRep.valid && (
          <p role="alert">Last rep rejected: {lastRep.faults.join(', ')}</p>
        )}
      </section>
    </main>
  );
}
