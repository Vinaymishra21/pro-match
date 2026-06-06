#!/usr/bin/env bash
# One-command dev launcher for Pro Match.
#
#   npm run dev          → Mongo (Docker) + seeded backend + Expo, all wired up
#   npm run dev -- --no-seed   → same, but keep existing DB data
#
# It auto-detects your machine's LAN IP so Expo Go on a physical phone can reach
# the backend, ensures Docker + MongoDB are running, then launches the backend
# and Expo together with the dev-login bypass enabled.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# --- config ---------------------------------------------------------------
MONGO_CONTAINER="promatch-mongo"
MONGO_IMAGE="mongo:7"
BACKEND_PORT="4000"
# Docker Desktop socket on Linux (falls back to the default daemon socket).
DESKTOP_SOCK="$HOME/.docker/desktop/docker.sock"
SEED=1
for arg in "$@"; do
  [ "$arg" = "--no-seed" ] && SEED=0
done

say() { printf "\033[1;36m▸ %s\033[0m\n" "$1"; }
warn() { printf "\033[1;33m! %s\033[0m\n" "$1"; }

# Free a TCP port by killing whatever's listening on it (used for stale Metro
# on 8081 and a stale backend on 4000 left over from a previous run).
free_port() {
  local port="$1"
  local pids
  pids="$(lsof -ti tcp:"$port" 2>/dev/null || true)"
  if [ -n "$pids" ]; then
    warn "Port $port busy — stopping stale process(es)…"
    # shellcheck disable=SC2086
    kill $pids 2>/dev/null || true
    sleep 1
    pids="$(lsof -ti tcp:"$port" 2>/dev/null || true)"
    [ -n "$pids" ] && kill -9 $pids 2>/dev/null || true
  fi
}

# --- detect LAN IP --------------------------------------------------------
# Clear stale servers from a previous run so the launch is always clean.
free_port "$BACKEND_PORT"
free_port 8081

LAN_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
if [ -z "${LAN_IP:-}" ]; then
  LAN_IP="127.0.0.1"
  warn "Could not detect a LAN IP; using 127.0.0.1 (emulator/simulator only)."
fi
API_URL="http://${LAN_IP}:${BACKEND_PORT}"

# --- pick a working docker socket ----------------------------------------
docker_ok() { docker ps >/dev/null 2>&1; }
if ! docker_ok; then
  if [ -S "$DESKTOP_SOCK" ]; then
    export DOCKER_HOST="unix://$DESKTOP_SOCK"
  fi
fi

# --- ensure Docker daemon is up ------------------------------------------
if ! docker_ok; then
  say "Starting Docker Desktop…"
  systemctl --user start docker-desktop 2>/dev/null || true
  export DOCKER_HOST="unix://$DESKTOP_SOCK"
  for _ in $(seq 1 20); do
    docker_ok && break
    sleep 3
  done
fi
if ! docker_ok; then
  warn "Docker is not reachable. Start Docker Desktop manually, then re-run."
  exit 1
fi

# --- ensure Mongo container is up ----------------------------------------
if docker ps --format '{{.Names}}' | grep -q "^${MONGO_CONTAINER}$"; then
  say "MongoDB already running."
elif docker ps -a --format '{{.Names}}' | grep -q "^${MONGO_CONTAINER}$"; then
  say "Starting existing MongoDB container…"
  docker start "$MONGO_CONTAINER" >/dev/null
else
  say "Creating MongoDB container…"
  docker run -d --name "$MONGO_CONTAINER" --restart unless-stopped -p 27017:27017 "$MONGO_IMAGE" >/dev/null
fi
# Survive future reboots.
docker update --restart unless-stopped "$MONGO_CONTAINER" >/dev/null 2>&1 || true

# Wait until Mongo answers a ping.
say "Waiting for MongoDB…"
for _ in $(seq 1 20); do
  if docker exec "$MONGO_CONTAINER" mongosh --quiet --eval "db.runCommand({ping:1}).ok" 2>/dev/null | grep -q 1; then
    break
  fi
  sleep 2
done

# --- backend .env (create from example on first run) ---------------------
if [ ! -f backend/.env ]; then
  say "Creating backend/.env from example…"
  cp backend/.env.example backend/.env
fi

# --- seed (optional) ------------------------------------------------------
if [ "$SEED" = "1" ]; then
  say "Seeding demo data…"
  npm --prefix backend run seed || warn "Seed failed (continuing)."
fi

# --- launch backend (background) + Expo (foreground) ---------------------
# Expo must run in the FOREGROUND so it owns the terminal (TTY) and can render
# the QR code + accept interactive keys (r = reload, etc.). The backend runs in
# the background; we stop it automatically when Expo exits / you press Ctrl+C.
export EXPO_PUBLIC_API_URL="$API_URL"
export EXPO_PUBLIC_DEV_BYPASS_AUTH="true"

say "Starting backend (background)…"
# Point uploaded-image URLs at the same LAN IP the app uses, so photos load on a
# physical phone (not the Android-emulator 10.0.2.2 address).
export PUBLIC_BASE_URL="$API_URL"
# Run in its own process group so we can kill nodemon AND its child node server.
setsid npm --prefix backend run dev > /tmp/promatch-backend.log 2>&1 &
BACKEND_PID=$!

cleanup() {
  printf "\n"
  say "Shutting down backend…"
  # Kill the whole process group (nodemon + node child).
  kill -- "-${BACKEND_PID}" 2>/dev/null || kill "$BACKEND_PID" 2>/dev/null || true
  # Belt-and-suspenders: free the port in case anything lingers.
  lsof -ti tcp:"${BACKEND_PORT}" 2>/dev/null | xargs -r kill -9 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# Wait for the backend to answer before opening Expo.
for _ in $(seq 1 20); do
  curl -s --max-time 2 "http://127.0.0.1:${BACKEND_PORT}/health" >/dev/null 2>&1 && break
  sleep 1
done
if curl -s --max-time 2 "http://127.0.0.1:${BACKEND_PORT}/health" >/dev/null 2>&1; then
  say "Backend ready."
else
  warn "Backend not responding yet — check /tmp/promatch-backend.log"
fi

printf "\033[1;32m   API URL : %s\033[0m\n" "$API_URL"
printf "\033[1;32m   Dev login: tap “Skip login (dev)” on the Welcome screen\033[0m\n"
say "Starting Expo — scan the QR below with Expo Go"

# Foreground Expo → QR code shows, keyboard shortcuts work. Backend log streams
# to /tmp/promatch-backend.log (tail it in another terminal if you need it).
npx expo start -c
