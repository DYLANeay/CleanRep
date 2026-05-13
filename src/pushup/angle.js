//calculate the angle at point b formed by points a and c
export function angleAt(a, b, c) {
  const bax = a.x - b.x;
  const bay = a.y - b.y;
  const bcx = c.x - b.x;
  const bcy = c.y - b.y;
  //manitude soit longueur du vecteur ba / bc
  const magA = Math.hypot(bax, bay);
  const magC = Math.hypot(bcx, bcy);
  //logique : si un des deux vecteurs a une magnitude nulle, l'angle est de 0°
  if (magA === 0 || magC === 0) return 0;
  //calcul du cosinus de l'angle à l'aide du produit scalaire
  const cos = Math.max(-1, Math.min(1, (bax * bcx + bay * bcy) / (magA * magC)));
  //calcul de l'angle en radians à l'aide de la fonction arccos, puis conversion en degrés
  return (Math.acos(cos) * 180) / Math.PI;
}

//11, 13, 15 sont les indices des landmarks de l'épaule, du coude et du poignet pour le bras gauche
//12, 14, 16 sont les indices des landmarks de l'épaule, du coude et du poignet pour le bras droit
const LEFT_ARM = [11, 13, 15];
const RIGHT_ARM = [12, 14, 16];

//calcule la visibilité moyenne des landmarks spécifiés par les indices
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

//calcul l'angle du coude en choisissant le bras avec la meilleure visibilité moyenne
export function elbowAngle(pose) {
  const arm =
    avgVisibility(pose, LEFT_ARM) >= avgVisibility(pose, RIGHT_ARM) ? LEFT_ARM : RIGHT_ARM;
  const shoulder = pose.landmarks[arm[0]];
  const elbow = pose.landmarks[arm[1]];
  const wrist = pose.landmarks[arm[2]];
  if (!shoulder || !elbow || !wrist) return null;
  return angleAt(shoulder, elbow, wrist);
}
