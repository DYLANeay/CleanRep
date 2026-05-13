import { useEffect, useRef, useState } from 'react';
import type { Pose } from '../pose/types';
import { elbowAngle } from './angle';
import { RepCounter, type Rep, type RepCounterConfig, type RepState } from './repCounter';

export interface UseRepCounterResult {
  reps: Rep[];
  validCount: number;
  rejectedCount: number;
  lastRep: Rep | null;
  currentAngle: number | null;
  currentState: RepState;
}

export function useRepCounter(
  pose: Pose | null,
  config?: Partial<RepCounterConfig>,
): UseRepCounterResult {
  const counterRef = useRef<RepCounter>();
  if (!counterRef.current) counterRef.current = new RepCounter(config);

  const [reps, setReps] = useState<Rep[]>([]);
  const [currentAngle, setCurrentAngle] = useState<number | null>(null);
  const [currentState, setCurrentState] = useState<RepState>('UP');

  useEffect(() => {
    if (!pose) return;
    const counter = counterRef.current;
    if (!counter) return;
    const a = elbowAngle(pose);
    if (a === null) return;
    setCurrentAngle(a);
    const rep = counter.update(a, pose.timestampMs);
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
  };
}
