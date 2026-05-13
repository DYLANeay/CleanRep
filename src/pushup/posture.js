//epaule gauche, hanche gacuhe
const LEFT_TORSO = [11, 23];
//epaule droite, hanche droite
const RIGHT_TORSO = [12, 24];

//identique à angle.js
const LEFT_ARM = [11, 13, 15];
const RIGHT_ARM = [12, 14, 16];

function sumVisibility(pose, indices) {
  let sum = 0;
  for (const i of indices) sum += pose.landmarks[i]?.visibility ?? 1;
  return sum;
}

//calcul l'inclinaison du torse en degrés en choisissant le côté avec la meilleure visibilité totale (épaule + hanche)
export function torsoTiltDeg(pose) {
  const useLeft = sumVisibility(pose, LEFT_TORSO) >= sumVisibility(pose, RIGHT_TORSO);
  const [si, hi] = useLeft ? LEFT_TORSO : RIGHT_TORSO;
  //s = shoulders, h = hips
  const s = pose.landmarks[si];
  const h = pose.landmarks[hi];
  if (!s || !h) return null;
  const dx = h.x - s.x;
  const dy = h.y - s.y;
  if (dx === 0 && dy === 0) return null;
  return (Math.atan2(Math.abs(dy), Math.abs(dx)) * 180) / Math.PI;
}

//verifie que le poignet est bien en dessous de l'épaule
export function wristBelowShoulder(pose) {
  const useLeft = sumVisibility(pose, LEFT_ARM) >= sumVisibility(pose, RIGHT_ARM);
  const arm = useLeft ? LEFT_ARM : RIGHT_ARM;
  const shoulder = pose.landmarks[arm[0]];
  const wrist = pose.landmarks[arm[2]];
  if (!shoulder || !wrist) return false;
  return wrist.y > shoulder.y;
}

//deafault config pour la posture "pushup"
export const DEFAULT_POSTURE_CONFIG = {
  maxTorsoTiltDeg: 35,
  requireWristBelowShoulder: true,
};

export function isPushupPosture(pose, config = {}) {
  const cfg = { ...DEFAULT_POSTURE_CONFIG, ...config };
  const tilt = torsoTiltDeg(pose);
  if (tilt === null) return false;
  if (tilt > cfg.maxTorsoTiltDeg) return false;
  if (cfg.requireWristBelowShoulder && !wristBelowShoulder(pose)) return false;
  return true;
}
