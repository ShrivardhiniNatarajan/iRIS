#!/bin/bash

# ─────────────────────────────────────────────────────────────────────────────
# iRIS NoteGen — Start Script
# Runs the Node.js backend (port 3001) and Vite frontend (port 5173)
# ─────────────────────────────────────────────────────────────────────────────

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/iRIS"

# Colours
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
RESET='\033[0m'

# ── Cleanup on exit ──────────────────────────────────────────────────────────
cleanup() {
  echo -e "\n${YELLOW}Shutting down...${RESET}"
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  echo -e "${GREEN}All processes stopped. Goodbye!${RESET}"
  exit 0
}
trap cleanup SIGINT SIGTERM

# ── Preflight checks ─────────────────────────────────────────────────────────
echo -e "${BOLD}${CYAN}"
echo "  ██╗██████╗ ██╗███████╗ "
echo "  ██║██╔══██╗██║██╔════╝ "
echo "  ██║██████╔╝██║███████╗ "
echo "  ██║██╔══██╗██║╚════██║ "
echo "  ██║██║  ██║██║███████║ "
echo "  ╚═╝╚═╝  ╚═╝╚═╝╚══════╝ NoteGen"
echo -e "${RESET}"

# Check Node.js
if ! command -v node &>/dev/null; then
  echo -e "${RED}✗ Node.js not found. Please install Node.js (https://nodejs.org).${RESET}"
  exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${RESET}"

# Check npm
if ! command -v npm &>/dev/null; then
  echo -e "${RED}✗ npm not found.${RESET}"
  exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v)${RESET}"

# ── Install dependencies if needed ───────────────────────────────────────────
echo ""
if [ ! -d "$BACKEND_DIR/node_modules" ]; then
  echo -e "${YELLOW}Installing backend dependencies...${RESET}"
  (cd "$BACKEND_DIR" && npm install --silent)
  echo -e "${GREEN}✓ Backend deps installed${RESET}"
fi

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo -e "${YELLOW}Installing frontend dependencies...${RESET}"
  (cd "$FRONTEND_DIR" && npm install --silent)
  echo -e "${GREEN}✓ Frontend deps installed${RESET}"
fi

# ── Check for .env file ──────────────────────────────────────────────────────
if [ ! -f "$BACKEND_DIR/.env" ]; then
  echo -e "\n${YELLOW}⚠  No backend/.env file found.${RESET}"
  echo -e "   Copying .env.example → .env (mock mode — no real AI without GEMINI_API_KEY)"
  cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
fi

# ── Start backend ────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}Starting backend...${RESET}"
(cd "$BACKEND_DIR" && node server.js) &
BACKEND_PID=$!

# Wait for backend to be ready
for i in {1..20}; do
  if curl -s http://localhost:3001/health &>/dev/null; then
    echo -e "${GREEN}✓ Backend ready → http://localhost:3001${RESET}"
    break
  fi
  if [ $i -eq 20 ]; then
    echo -e "${RED}✗ Backend failed to start. Check backend logs above.${RESET}"
    kill "$BACKEND_PID" 2>/dev/null
    exit 1
  fi
  sleep 0.5
done

# ── Start frontend ────────────────────────────────────────────────────────────
echo -e "${BOLD}Starting frontend...${RESET}"
(cd "$FRONTEND_DIR" && npm run dev -- --open) &
FRONTEND_PID=$!

# ── Ready banner ─────────────────────────────────────────────────────────────
sleep 2
echo ""
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}${GREEN}  🚀 iRIS NoteGen is running!${RESET}"
echo -e "${GREEN}  Frontend → http://localhost:5173${RESET}"
echo -e "${GREEN}  Backend  → http://localhost:3001${RESET}"
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${YELLOW}  Press Ctrl+C to stop both servers${RESET}"
echo ""

# ── Keep alive ───────────────────────────────────────────────────────────────
wait "$BACKEND_PID" "$FRONTEND_PID"
