#!/usr/bin/env bash
# Push .env.local variables to Vercel for all environments (production, preview, development)
# Usage: bash scripts/push-env-to-vercel.sh [env-file]
#
# Prerequisites:
#   1. npm install --save-dev vercel  (already done)
#   2. npx vercel link                (links project to Vercel)
#   3. npx vercel login               (if not already authenticated)

set -euo pipefail

ENV_FILE="${1:-.env.local}"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found"
  exit 1
fi

# Check if vercel is available
if ! npx vercel --version &>/dev/null; then
  echo "ERROR: Vercel CLI not found. Run: npm install --save-dev vercel"
  exit 1
fi

# Check if project is linked
if [ ! -d ".vercel" ]; then
  echo "Project not linked to Vercel. Running 'vercel link'..."
  npx vercel link
fi

# Vars that should NOT be pushed (dev-only or auto-set by Vercel)
SKIP_VARS="NODE_ENV VERCEL_ENV"

# Vars that have dev-only placeholder values — warn but still push
DEV_WARNINGS=""

echo ""
echo "=== Pushing env vars from $ENV_FILE to Vercel ==="
echo ""

count=0
skipped=0
warned=0

while IFS= read -r line || [ -n "$line" ]; do
  # Skip empty lines and comments
  [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue

  # Extract key and value
  key="${line%%=*}"
  value="${line#*=}"

  # Remove surrounding quotes from value
  value="${value#\"}"
  value="${value%\"}"

  # Skip certain vars
  if echo "$SKIP_VARS" | grep -qw "$key"; then
    echo "  SKIP: $key (auto-set by Vercel)"
    ((skipped++)) || true
    continue
  fi

  # Skip empty values
  if [ -z "$value" ]; then
    echo "  SKIP: $key (empty value)"
    ((skipped++)) || true
    continue
  fi

  # Warn about dev-only values
  if [[ "$value" == *"localhost"* || "$value" == *"dev-"*"change-in-production"* ]]; then
    echo "  WARN: $key has a dev-only value — pushing anyway, update in Vercel dashboard"
    ((warned++)) || true
    DEV_WARNINGS="${DEV_WARNINGS}\n  - $key"
  fi

  # Push to all environments
  echo "$value" | npx vercel env add "$key" production --force 2>/dev/null && \
  echo "$value" | npx vercel env add "$key" preview --force 2>/dev/null && \
  echo "$value" | npx vercel env add "$key" development --force 2>/dev/null

  echo "  SET:  $key (all environments)"
  ((count++)) || true

done < "$ENV_FILE"

echo ""
echo "=== Done ==="
echo "  Set: $count variables"
echo "  Skipped: $skipped variables"
echo "  Warnings: $warned variables"

if [ -n "$DEV_WARNINGS" ]; then
  echo ""
  echo "!! The following vars have dev-only values — update them in the Vercel dashboard:"
  echo -e "$DEV_WARNINGS"
  echo ""
  echo "Recommended production values:"
  echo "  NEXT_PUBLIC_APP_URL   → https://yourdomain.com"
  echo "  NEXTAUTH_URL          → https://yourdomain.com"
  echo "  NEXTAUTH_SECRET       → (generate: openssl rand -base64 32)"
  echo "  JWT_ACCESS_SECRET     → (generate: openssl rand -base64 32)"
  echo "  JWT_REFRESH_SECRET    → (generate: openssl rand -base64 32)"
fi

echo ""
echo "Verify with: npx vercel env ls"
