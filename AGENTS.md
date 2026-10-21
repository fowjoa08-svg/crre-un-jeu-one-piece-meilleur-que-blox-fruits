# Repository notes (Base44 sandbox)

One Piece 3D RPG. Two runnable projects, each its own compose service:

| Path      | What it is                                | Dev command                | Port |
| --------- | ----------------------------------------- | -------------------------- | ---- |
| `client/` | React + Vite + three.js game              | `npm run dev`              | 5173 |
| `server/` | Express API (accounts + cloud saves)      | `npm run dev` (`node --watch`) | 4000 |

## Running locally

```bash
docker compose -f docker-compose.base44.yml up -d --build
```

Web entry point: <http://localhost:3000>. The API is **not** exposed on its own port:
the Vite dev server proxies `/api` to `api:4000`, so the session cookie stays
same-origin (cookie auth needs that).

- `db` — Postgres 16, schema created from `server/db/init.sql` on the first start of
  a fresh `db_data` volume. If you change `init.sql`, either apply it by hand or drop
  the volume (this deletes all accounts and saves — don't do it casually).
- `api` — needs `JWT_SECRET` (delivered by the platform in `/run/base44/app.env`, which
  compose mounts via `env_file:`). Without it the API exits on purpose.
- `web` — Vite with `usePolling` so hot reload works over the bind mount.

Dependencies are installed into named volumes (`api_node_modules`, `web_node_modules`)
by the service command (`npm ci`) after the bind mounts exist — so `package-lock.json`
must be committed. After changing a manifest, rebuild/restart the service; after
changing only source, hot reload handles it.

## Sandbox-only overrides

Both are gated on `BASE44_PREVIEW_MODE === '1'` and are no-ops when the variable is
unset:

- `client/vite.config.js` allows the sandbox wildcard host
  (`.${BASE44_SANDBOX_HOST_DOMAIN}`) so the preview proxy's rotating host is accepted.
  Vite also appends the platform-provided `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS`.
- Nothing else in the app depends on the flag. Cookie settings are ordinary dev
  settings (`COOKIE_SECURE=0` in compose, since TLS ends at the preview proxy).

## How to check it works

1. `curl -s localhost:3000/api/health` → `{"ok":true}`
2. Open the app, create an account, then press `E` — the HUD shows the
   "Gomu Gomu no Bazooka !" toast and the ability goes on cooldown.
3. Click **Quitter** and log back in: level/gold/position come back from Postgres
   (`GET /api/save`).

## Game systems

- `client/src/game/terrain.js` — the island height field. The height function is
  shared by the terrain mesh, the player and the camera; change it in one place only.
- `client/src/game/world.js` — player/enemy state, combat, XP, save serialization.
- `client/src/game/store.js` — HUD state with a subscribe/notify store (kept out of
  React so the render loop never re-renders the tree per frame).
- Frame rate is uncapped (rAF); the HUD shows the live FPS, so real numbers depend on
  the GPU. The preview automation browser renders WebGL in software and reports a
  single-digit FPS that is not representative of a real machine.
