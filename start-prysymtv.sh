#!/usr/bin/env bash
# PrysymTV local dev launcher — starts API + frontend, frees blocked ports first.
set -euo pipefail

PROJECT_ROOT="/home/hostyler/Desktop/PROJECTS/PrysymTV"
FRONTEND_PORT=3000
API_PORT=4000

API_PID=""
FRONTEND_PID=""

free_port() {
  local port="$1"
  local pids=""

  if command -v lsof >/dev/null 2>&1; then
    pids="$(lsof -ti:"${port}" -sTCP:LISTEN 2>/dev/null || true)"
  elif command -v fuser >/dev/null 2>&1; then
    fuser "${port}/tcp" 2>/dev/null || true
    sleep 0.5
    return 0
  fi

  if [ -n "${pids}" ]; then
    echo "  Port ${port} in use (PID: ${pids}) — stopping..."
    # shellcheck disable=SC2086
    kill ${pids} 2>/dev/null || true
    sleep 0.5
    # shellcheck disable=SC2086
    kill -9 ${pids} 2>/dev/null || true
    sleep 0.3
  fi
}

cleanup() {
  echo ""
  echo "Stopping PrysymTV dev servers..."
  if [ -n "${API_PID}" ] && kill -0 "${API_PID}" 2>/dev/null; then
    kill "${API_PID}" 2>/dev/null || true
  fi
  if [ -n "${FRONTEND_PID}" ] && kill -0 "${FRONTEND_PID}" 2>/dev/null; then
    kill "${FRONTEND_PID}" 2>/dev/null || true
  fi
  free_port "${API_PORT}"
  free_port "${FRONTEND_PORT}"
  free_port 3000
}

trap cleanup EXIT INT TERM

if [ ! -d "${PROJECT_ROOT}" ]; then
  echo "Project not found: ${PROJECT_ROOT}"
  read -r -p "Press Enter to close..."
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required for the API. Install it first: npm install -g pnpm"
  read -r -p "Press Enter to close..."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required for the frontend."
  read -r -p "Press Enter to close..."
  exit 1
fi

echo "=== PrysymTV dev environment ==="
echo "Project: ${PROJECT_ROOT}"
echo ""

echo "Freeing ports..."
free_port "${API_PORT}"
free_port "${FRONTEND_PORT}"
free_port 3000
echo "Ports ready."
echo ""

cd "${PROJECT_ROOT}/api"
echo "Starting API (pnpm start:dev) on http://localhost:${API_PORT} ..."
pnpm start:dev &
API_PID=$!

cd "${PROJECT_ROOT}"
echo "Starting frontend (npm run dev) on http://localhost:${FRONTEND_PORT} ..."
PORT="${FRONTEND_PORT}" npm run dev &
FRONTEND_PID=$!

echo ""
echo "----------------------------------------"
echo "  Frontend: http://localhost:${FRONTEND_PORT}"
echo "  API:      http://localhost:${API_PORT}"
echo "----------------------------------------"
echo "Press Ctrl+C in this window to stop both."
echo ""

# Keep this window open while either process is running.
while kill -0 "${API_PID}" 2>/dev/null || kill -0 "${FRONTEND_PID}" 2>/dev/null; do
  if ! kill -0 "${API_PID}" 2>/dev/null; then
    echo "API process exited."
    break
  fi
  if ! kill -0 "${FRONTEND_PID}" 2>/dev/null; then
    echo "Frontend process exited."
    break
  fi
  sleep 1
done

wait "${API_PID}" 2>/dev/null || true
wait "${FRONTEND_PID}" 2>/dev/null || true

echo ""
read -r -p "Servers stopped. Press Enter to close..."
