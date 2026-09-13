# TumaNow

Multi-company courier & delivery management platform for Rwanda and beyond.

**Stack:** Next.js · NestJS · PostgreSQL · Prisma

## Quick start

```bash
# Local Postgres (no Docker required)
# DATABASE_URL=postgresql://tumanow:tumanow@127.0.0.1:5432/tumanow

npm install
npm run db:push
npm run db:seed

npm run api:dev    # http://127.0.0.1:3345/v1
npm run web:dev    # http://127.0.0.1:3006
```

- Web: http://127.0.0.1:3006
- API: http://127.0.0.1:3345/v1
- OpenAPI: http://127.0.0.1:3345/docs

## Demo accounts

| Role | Login | Password |
|------|-------|----------|
| Platform admin | `admin` | `demo1234` |
| Operator (RITCO) | `ritcoadmin` | `demo1234` |
| Operator (Volcano) | `volcano` | `demo1234` |
| Customer | `customer` | `demo1234` |
| Rider | `rider` | `demo1234` |

Demo tracking: `TN-2026-00001234`

## Mobile app (Flutter)

One app for **customers and riders** — UI switches by role after login.  
SitBites-style stack: **Riverpod + go_router + Dio + SharedPreferences**.

```bash
# API must be running on 3345
npm run api:dev

cd apps/mobile
flutter run --dart-define=API_BASE=http://127.0.0.1:3345/v1
```

| Role | Demo login | Password | Opens |
|------|------------|----------|-------|
| Customer | `customer` | `demo1234` | Home / shipments / track |
| Rider | `rider` | `demo1234` | Jobs / history |

iOS simulator talking to Mac localhost: use `http://127.0.0.1:3345/v1`.  
Android emulator: `http://10.0.2.2:3345/v1`.

## Happy path to try

1. **Customer** → New shipment wizard → optional COD → match → create  
2. **Operator** → Approve (COD skips prepaid pay) → Assign driver + vehicle  
3. Statuses → Generate/Verify POD (COD auto-collects) → Settle COD  
4. Track publicly at `/track`  
5. **Mobile (rider login)** → Jobs → status / POD / COD collect

Also: Fleet (`/operator/vehicles`), branches CRUD, returns (customer + operator), profile, dashboard period filters (7/14/30d).

Payments initiate as `PROCESSING`, SMS prompt is logged in the API console, then auto-confirm to `PAID` (`PAYMENTS_AUTO_CONFIRM=true`). Notifications fan out to in-app inbox + SMS/email stubs (`MESSAGING_MODE=log`).

## Monorepo

```
apps/web          Next.js (App Router, Tailwind 4)
apps/api          NestJS (JWT + permission RBAC)
apps/mobile       Flutter (customer + rider, role-based UI)
packages/database Prisma schema + seed
```
