# Stacy's Green Wall

Standalone playable — **not** part of stacys-model.

Living wall + soft neon diamond. Leaves grow over the sign; swipe them clear; more coverage darkens the scene.

## Live

**https://brandonslayton.github.io/stacys-green-wall/**

## Local

```bash
cd stacys-green-wall
python -m http.server 8091
# http://localhost:8091/
```

## Files

| Path | Role |
|------|------|
| `index.html` | Playable workbench |
| `js/greenWall.js` | Leaves, sign, overgrowth sim |
| `js/kit.js` | Tiny Three helpers (this site only) |
| `js/brand.js` | Font stacks |
| `images/` | Optional brand assets |

No dependency on the venue model repo.
