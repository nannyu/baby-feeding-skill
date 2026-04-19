#!/usr/bin/env bash
# Install this repo into OpenClaw workspace skills/ so SKILL.md is discoverable.
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/nannyu/baby-feeding-skill/main/scripts/install-openclaw-skill.sh | bash
# Env overrides:
#   OPENCLAW_WORKSPACE  default: $HOME/.openclaw/workspace
#   BABY_FEEDING_REPO_URL  default: https://github.com/nannyu/baby-feeding-skill.git

set -euo pipefail

OPENCLAW_WORKSPACE="${OPENCLAW_WORKSPACE:-"$HOME/.openclaw/workspace"}"
SKILL_ROOT="${OPENCLAW_WORKSPACE}/skills"
TARGET="${SKILL_ROOT}/baby-feeding"
REPO_URL="${BABY_FEEDING_REPO_URL:-https://github.com/nannyu/baby-feeding-skill.git}"

mkdir -p "${SKILL_ROOT}"

if [[ -d "${TARGET}/.git" ]]; then
  echo "[baby-feeding] Updating existing clone at ${TARGET} ..."
  git -C "${TARGET}" fetch origin
  git -C "${TARGET}" pull --ff-only origin main 2>/dev/null || git -C "${TARGET}" pull --ff-only
else
  echo "[baby-feeding] Cloning into ${TARGET} ..."
  git clone "${REPO_URL}" "${TARGET}"
fi

cd "${TARGET}"

if command -v pnpm >/dev/null 2>&1; then
  echo "[baby-feeding] Using pnpm ..."
  pnpm install
  pnpm run build
else
  echo "[baby-feeding] pnpm not found; using npm ..."
  npm install
  npm run build
fi

echo ""
echo "[baby-feeding] Done. Skill path: ${TARGET}"
echo "[baby-feeding] Next: restart OpenClaw gateway or start a new session, then check: openclaw skills list"
