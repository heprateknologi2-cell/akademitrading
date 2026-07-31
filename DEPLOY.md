# Deploy Akademitrading

Semua layanan menggunakan **free tier**.

## Arsitektur Deploy

| Komponen | Platform | Gratis? |
|----------|----------|---------|
| Frontend (Next.js PWA) | Netlify | ✅ 100GB bandwidth/bln |
| Backend API (Python FastAPI) | Railway | ✅ $5 credit/bln |
| Telegram Bot | Railway (sama dengan backend) | ✅ |
| Database (PostgreSQL) | Neon.tech | ✅ 0.5GB free |
| Cache (Redis) | Upstash | ✅ 10k req/hari |
| Payment (Midtrans) | Sandbox (gratis) | ✅ |

## Langkah Deploy

### 1. Siapkan Akun (5 menit)

```bash
# Buat akun di semua platform
- Netlify:    https://app.netlify.com/signup
- Railway:    https://railway.app
- Neon:       https://neon.tech
- Midtrans:   https://midtrans.com (sandbox gratis)
- GitHub:     (sudah ada)
```

### 2. Database (Neon) — 5 menit

1. Login ke [Neon.tech](https://neon.tech)
2. Klik "New Project" → pilih "Akademitrading"
3. Pilih region (Singapore untuk latensi rendah dari Indonesia)
4. Copy **Connection String** (format: `postgres://...`)
5. Catat URL-nya

### 3. Frontend → Netlify (3 menit)

```bash
# Jalankan build dulu
cd apps/web
npm run build
```

1. Login ke [Netlify](https://app.netlify.com)
2. "Add new site" → "Import existing repo"
3. Pilih repo GitHub `akademitrading`
4. Build config is in `netlify.toml` (auto-detected):
   - **Base directory**: `apps/web`
   - **Build command**: `npm run build`
   - **Node version**: 20

5. Tambah environment variables di Netlify dashboard:
```
NEXT_PUBLIC_API_URL=https://api.akademitrading.com
NEXTAUTH_SECRET=<random-string>
NEXTAUTH_URL=https://akademitrading.com
NEXT_PUBLIC_GOOGLE_ENABLED=true
```

6. Klik "Deploy site"

7. (Optional) Hubungkan domain kustom: `akademitrading.com`

### 4. Backend → Railway (5 menit)

1. Login ke [Railway](https://railway.app)
2. "New Project" → "Deploy from GitHub Repo"
3. Pilih repo `akademitrading`
4. Railway akan deteksi `Dockerfile` (backend)
5. Tambah environment variables:
```
DATABASE_URL=postgres://... (dari Neon)
YAHOO_PERIOD=3mo
FETCH_INTERVAL_HOURS=6
```

6. Railway akan auto-deploy dan assign URL: `https://backend-xxx.up.railway.app`

### 5. Bot → Railway (sama dengan backend)

Tambahkan sebagai service kedua di Railway project yang sama:
- **Service name**: `bot`
- **Dockerfile**: `Dockerfile.bot`
- **Environment**: sama + `BOT_TOKEN` dari @BotFather

### 6. Update API URL

Update `NEXT_PUBLIC_API_URL` di Netlify dengan URL Railway backend:
```
NEXT_PUBLIC_API_URL=https://backend-xxx.up.railway.app
```

### 7. Verifikasi Deploy

```bash
# Cek health
curl https://api.akademitrading.com/health

# Cek screener
curl "https://api.akademitrading.com/api/screener?limit=5"

# Cek signals
curl https://api.akademitrading.com/api/signals/today

# Cek PWA
https://akademitrading.com
```

## Update Deploy (Setiap Push)

```bash
git add .
git commit -m "update"
git push origin main
```

Semua platform akan auto-deploy via CI/CD.

## Struktur Akhir

```
akademitrading/
├── apps/
│   ├── web/           → Next.js PWA → Netlify
│   └── bot/           → Telegram Bot → Railway
├── packages/
│   ├── data-engine/   → Python FastAPI → Railway
│   ├── db/            → Drizzle schema
│   └── shared/        → TypeScript types
├── netlify.toml       → Netlify config
├── Dockerfile         → Backend container
├── Dockerfile.bot     → Bot container
├── railway.toml       → Railway config
├── .env.production    → Template env production
└── .github/workflows/deploy.yml → CI/CD
```

## Cost Breakdown

| Service | Monthly Cost | Notes |
|---------|-------------|-------|
| Netlify | $0 | 100GB bandwidth, unlimited forms |
| Railway | $0 | $5 credit, cukup untuk hobby scale |
| Neon | $0 | 0.5GB storage, 10k queries/bln |
| Upstash Redis | $0 | 10k req/hari |
| Midtrans Sandbox | $0 | Test mode saja |
| **Total** | **$0** | **Seluruhnya gratis** |
```
