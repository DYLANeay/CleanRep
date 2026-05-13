import { POSE_CONNECTIONS } from './connections';

export function drawSkeleton(ctx, pose, opts) {
  const {
    width,
    height,
    minVisibility = 0.5,
    lineColor = '#00ff88',
    pointColor = '#ffffff',
    lineWidth = 3,
    pointRadius = 4,
  } = opts;

  const visible = (i) => (pose.landmarks[i]?.visibility ?? 1) >= minVisibility;

  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = lineColor;
  for (const [a, b] of POSE_CONNECTIONS) {
    const la = pose.landmarks[a];
    const lb = pose.landmarks[b];
    if (!la || !lb || !visible(a) || !visible(b)) continue;
    ctx.beginPath();
    ctx.moveTo(la.x * width, la.y * height);
    ctx.lineTo(lb.x * width, lb.y * height);
    ctx.stroke();
  }

  ctx.fillStyle = pointColor;
  for (let i = 0; i < pose.landmarks.length; i++) {
    if (!visible(i)) continue;
    const p = pose.landmarks[i];
    if (!p) continue;
    ctx.beginPath();
    ctx.arc(p.x * width, p.y * height, pointRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}
