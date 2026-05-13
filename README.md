# CleanRep

Compteur de pompes par webcam. Tout tourne dans le navigateur, le flux vidéo ne quitte pas l'appareil.

L'app détecte la pose, calcule l'angle du coude, compte les reps via une machine à états, et rejette celles dont la posture ou la profondeur ne sont pas bonnes.

## Stack

React 18 + Vite 5, MediaPipe Tasks Vision (`pose_landmarker_lite`, modèle et WASM servis depuis `public/`), Vitest, ESLint + Prettier.

## Démarrage

Node.js >= 20, pnpm 9.

```bash
pnpm install
pnpm dev
```

Ouvrir http://localhost:5173, cliquer sur *Start camera*.

Scripts utiles : `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm format`.

## Arborescence

```
src/
  camera/       Hook getUserMedia
  pose/         Adaptateur MediaPipe + boucle rAF
  overlay/      Overlay canvas du squelette
  pushup/       Angles, posture, machine à états des reps
public/mediapipe/ WASM + modèle vendorisés
```

## Quelques choix

- Moteur de pose derrière une petite classe (`init` / `detect` / `dispose`), facile à mocker et à remplacer.
- Logique métier (angle, posture, compteur) en JS pur, testable sans DOM.
- Rep validée si l'angle du coude descend sous 110°, atteint au moins 90° de profondeur, et remonte au-dessus de 160°, posture maintenue. Sinon rejet avec motif (`INSUFFICIENT_DEPTH`, `POSTURE_LOST`).
- À chaque frame, le bras (et le torse) le plus visible est utilisé.
- `usePoseLoop` tourne sur `requestAnimationFrame` et expose un FPS glissant sur 1s.
- Aucun appel réseau pendant l'usage.

## Limites

Modèle `lite` (latence vs précision), pas de calibration, seuils taillés pour une vue de côté, une seule pose à la fois.
