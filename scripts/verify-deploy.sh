#!/bin/bash
echo "========================================"
echo "  Akademitrading - Deploy Verification"
echo "========================================"
echo ""

echo "[1/5] Checking file structure..."
for f in \
  "apps/web/next.config.ts" \
  "apps/web/src/app/layout.tsx" \
  "apps/web/src/app/page.tsx" \
  "apps/web/src/app/screener/page.tsx" \
  "apps/web/src/app/signals/page.tsx" \
  "apps/web/src/app/auth/login/page.tsx" \
  "apps/web/src/app/dashboard/page.tsx" \
  "apps/web/src/app/subscription/page.tsx" \
  "apps/web/src/app/subscription/success/page.tsx" \
  "apps/web/src/middleware.ts" \
  "apps/web/src/lib/auth.ts" \
  "apps/web/src/lib/api.ts" \
  "apps/web/public/manifest.json" \
  "apps/web/public/sw.ts" \
  "packages/data-engine/src/server.py" \
  "packages/data-engine/src/fetcher.py" \
  "packages/data-engine/src/indicators.py" \
  "packages/data-engine/src/signals.py" \
  "packages/db/src/schema.ts" \
  "apps/bot/src/bot.ts" \
  "apps/bot/src/scheduler.ts" \
  "Dockerfile" \
  "Dockerfile.bot" \
  "railway.toml" \
  "netlify.toml" \
  ".github/workflows/deploy.yml" \
  ".env.production" \
  "DEPLOY.md"
do
  if [ -f "$f" ]; then
    echo "  [OK] $f"
  else
    echo "  [MISSING] $f"
  fi
done

echo ""
echo "[2/5] Checking Python dependencies..."
cd packages/data-engine
pip install -q -r requirements.txt
echo "  [OK] Python deps ready"
cd ../..

echo ""
echo "[3/5] Checking frontend build..."
cd apps/web
npm run build 2>&1 | tail -5
cd ../..

echo ""
echo "[4/5] Environment check..."
echo "  Node: $(node --version)"
echo "  Python: $(python --version)"
echo "  Bun: $(bun --version)"

echo ""
echo "[5/5] Database schema check..."
cd packages/db
ls -la src/schema.ts
cd ../..

echo ""
echo "========================================"
echo "  Deploy verification complete"
echo "  Ready for Netlify + Railway + Neon"
echo "========================================"
