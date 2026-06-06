# Pro Match

Full-stack dating app where users discover and match only with people from the
**same profession** — with paid options to explore other professions and see who
likes you.

- `src/` — React Native (Expo) frontend (the "PRISM" design system: every
  profession has a signature gradient + emoji)
- `backend/` — Express + MongoDB (Mongoose) API, real-time chat over Socket.IO

---

## Quick start (one command) ⭐

From the project root:

```bash
npm install
npm run dev
```

That single command:

1. Starts **Docker** + a **MongoDB** container (`promatch-mongo`, auto-restarts on reboot)
2. **Seeds** demo data (profiles to swipe, people who like you, a ready match)
3. Starts the **backend** in the background (`http://<your-LAN-IP>:4000`)
4. Starts **Expo** in the foreground — so the **QR code shows** and keyboard
   shortcuts (`r` to reload, etc.) work — with the dev-login bypass enabled and
   the API URL auto-pointed at your machine's LAN IP (so Expo Go on a physical
   phone just works)

Then **scan the QR** with Expo Go (or press `a` / `i` for an emulator) and tap
**“Skip login (dev)”** on the Welcome screen. You land in as a demo
*Software Engineer* with everything populated.

> Press **Ctrl+C** once to stop Expo; the backend is shut down automatically too.
> Backend logs stream to `/tmp/promatch-backend.log` (`tail -f` it if needed).

### Variants

| Command | What it does |
|---|---|
| `npm run dev` | Mongo + **re-seeded** backend + Expo (fresh demo data each run) |
| `npm run dev:no-seed` | Same, but **keeps** existing DB data (your swipes/matches persist) |

### Requirements
- **Node 18+** and **Docker Desktop** installed (the script starts Docker for you).
- For a physical phone: it must be on the **same Wi-Fi** as this machine.

---

## Running pieces individually (optional)

If you'd rather run things by hand:

```bash
# Backend only (expects Mongo already running)
npm run backend            # start
npm run backend:seeded     # seed + start
npm run seed               # just (re)seed

# Frontend only — set the API URL + dev bypass yourself
EXPO_PUBLIC_API_URL=http://<LAN-IP>:4000 EXPO_PUBLIC_DEV_BYPASS_AUTH=true npm start
```

### MongoDB without the helper script
The backend needs `MONGODB_URI` in `backend/.env` (copied from `.env.example` on
first `npm run dev`). Point it at any Mongo — a local `mongod`, the Docker
container, or a free MongoDB Atlas cluster:

```
MONGODB_URI=mongodb://127.0.0.1:27017/promatch
```

---

## Configuration notes

- **API URL** ([src/constants/api.ts](src/constants/api.ts)) resolves in order:
  `EXPO_PUBLIC_API_URL` env var → Android-emulator loopback (`10.0.2.2`) → LAN IP
  fallback. `npm run dev` sets the env var automatically.
- **Dev login bypass** is gated behind `EXPO_PUBLIC_DEV_BYPASS_AUTH=true`
  ([src/constants/config.ts](src/constants/config.ts)) — production builds never
  show it. `npm run dev` sets it for you.
- **Stub layers** (safe to run with no keys): OTP SMS (`AUTH_DEV_MODE`), image
  storage (local disk), and Razorpay payments (`BILLING_DEV_MODE` →
  `/billing/dev/grant` simulates purchases). Flip these off in `backend/.env`
  once real providers are wired.

## Troubleshooting

- **“Network request failed” in the app** → the backend isn't running, or your
  phone isn't on the same Wi-Fi. Re-run `npm run dev` and confirm the printed
  *API URL* is reachable from your phone's browser.
- **“Port 8081 already in use”** → the launcher auto-clears stale Metro/backend
  processes; if you started Expo manually elsewhere, stop it first.
- **Docker not reachable** → open Docker Desktop once, then re-run `npm run dev`.
