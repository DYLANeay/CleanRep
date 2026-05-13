export function angleAt(a, b, c) {
  const bax = a.x - b.x;
  const bay = a.y - b.y;
  const bcx = c.x - b.x;
  const bcy = c.y - b.y;
  const magA = Math.hypot(bax, bay);
  const magC = Math.hypot(bcx, bcy);
  if (magA === 0 || magC === 0) return 0;
  const cos = Math.max(-1, Math.min(1, (bax * bcx + bay * bcy) / (magA * magC)));
  return (Math.acos(cos) * 180) / Math.PI;
}

const LEFT_ARM = [11, 13, 15];
const RIGHT_ARM = [12, 14, 16];

function avgVisibility(pose, indices) {
  let sum = 0;
  let n = 0;
  for (const i of indices) {
    const v = pose.landmarks[i]?.visibility;
    if (v !== undefined) {
      sum += v;
      n += 1;
    }
  }
  return n === 0 ? 1 : sum / n;
}

export function elbowAngle(pose) {
  const arm = avgVisibility(pose, LEFT_ARM) >= avgVisibility(pose, RIGHT_ARM) ? LEFT_ARM : RIGHT_ARM;
  const shoulder = pose.landmarks[arm[0]];
  const elbow = pose.landmarks[arm[1]];
  const wrist = pose.landmarks[arm[2]];
  if (!shoulder || !elbow || !wrist) return null;
  return angleAt(shoulder, elbow, wrist);
}
