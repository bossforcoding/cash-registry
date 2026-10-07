#!/usr/bin/env bash
# Build the demo (no Supabase credentials) and publish it to GitHub Pages.
set -euo pipefail
cd "$(dirname "$0")"
# Next.js also reads .env* files: refuse to build if any of them sets
# Supabase credentials, so real keys can never end up in the public demo.
if grep -qsE '^\s*NEXT_PUBLIC_SUPABASE_(URL|ANON_KEY)\s*=\s*\S' .env .env.local .env.production .env.production.local; then
  echo "Supabase credentials found in an .env file: remove them before deploying the demo." >&2
  exit 1
fi
rm -rf .next out
# Unset credentials so the build always runs in demo mode.
env -u NEXT_PUBLIC_SUPABASE_URL -u NEXT_PUBLIC_SUPABASE_ANON_KEY \
  NEXT_PUBLIC_BASE_PATH=/cash-registry npm run build
touch out/.nojekyll   # keep the _next/ folder (Jekyll drops _ dirs)
cd out
git init -q -b gh-pages
git add -A
git commit -q -m "Deploy demo"
git push -f https://github.com/bossforcoding/cash-registry.git gh-pages
rm -rf .git
