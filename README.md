# CleanRep

Webcam-based pushup counter and form validator. Everything runs on-device — the
camera feed never leaves the browser.

## Prerequisites

- Node.js >= 20
- pnpm 9 (`corepack enable && corepack prepare pnpm@9 --activate`)

## Quickstart

```bash
pnpm install
pnpm dev
```

Open http://localhost:5173, click *Start camera*, and start doing pushups.

## Scripts

| Command          | What it does                              |
| ---------------- | ----------------------------------------- |
| `pnpm dev`       | Vite dev server on `:5173`                |
| `pnpm build`     | Typecheck + production build              |
| `pnpm typecheck` | TypeScript checks                         |
| `pnpm lint`      | ESLint                                    |
| `pnpm test`      | Vitest                                    |
| `pnpm format`    | Prettier write                            |

## Layout

```
src/
  camera/       getUserMedia hook
  pose/         PoseEngine interface + MediaPipe adapter + rAF loop
  overlay/      Canvas skeleton overlay
  pushup/       Elbow angle math + rep state machine + form rule
public/
  mediapipe/    Vendored WASM + pose model
```
