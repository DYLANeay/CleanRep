import { useEffect, useRef, useState } from 'react';
import { elbowAngle } from './angle';
import { isPushupPosture } from './posture';
import { RepCounter } from './repCounter';

export function useRepCounter(pose, config) {
  const counterRef = useRef();
  if (!counterRef.current) counterRef.current = new RepCounter(config);

  const [reps, setReps] = useState([]);
  const [currentAngle, setCurrentAngle] = useState(null);
  const [currentState, setCurrentState] = useState('UP');
  const [inPosture, setInPosture] = useState(false);

  useEffect(() => {
    if (!pose) return;
    const counter = counterRef.current;
    if (!counter) return;
    const a = elbowAngle(pose);
    if (a === null) return;
    setCurrentAngle(a);
    const posture = isPushupPosture(pose);
    setInPosture(posture);
    const rep = counter.update(a, pose.timestampMs, posture);
    setCurrentState(counter.currentState);
    if (rep) setReps((prev) => [...prev, rep]);
  }, [pose]);

  const validCount = reps.reduce((n, r) => (r.valid ? n + 1 : n), 0);
  return {
    reps,
    validCount,
    rejectedCount: reps.length - validCount,
    lastRep: reps[reps.length - 1] ?? null,
    currentAngle,
    currentState,
    inPosture,
  };
}
