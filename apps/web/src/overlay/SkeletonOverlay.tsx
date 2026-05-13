import { useEffect, useRef } from 'react';
import type { Pose } from '../pose/types';
import { drawSkeleton } from './drawSkeleton';

export interface SkeletonOverlayProps {
  pose: Pose | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  className?: string;
}

export function SkeletonOverlay({ pose, videoRef, className }: SkeletonOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const width = video.videoWidth || video.clientWidth;
    const height = video.videoHeight || video.clientHeight;
    if (!width || !height) return;
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    if (pose) drawSkeleton(ctx, pose, { width, height });
  }, [pose, videoRef]);

  return <canvas ref={canvasRef} className={className} />;
}
