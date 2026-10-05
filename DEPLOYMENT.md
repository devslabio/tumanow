# Deploying TumaNow

Two pieces, two platforms:

- **API + database** → [Render](https://render.com) (`apps/api` + a managed Postgres)
- **Web app** → [Vercel](https://vercel.com) (`apps/web`)

They're independent deploys that just need to know each other's URL afterward. Do Render first — you need its URL before Vercel's build can use it.

Mobile isn't part of this: it talks to whatever `API_BASE` you give it at build time (see the README), it doesn't get "deployed" to a host.

---

## 1. Render — API + Postgres

This repo has a `render.yaml` at the root, so Render can set up both the database and the API service from one click instead of you configuring each field by hand.

1. Push this repo to GitHub (if it isn't already).
2. In the Render dashboard: **New → Blueprint**, connect the repo, and select the branch you want deployed (e.g. `main`).
3. Render reads `render.yaml` and shows you two resources: the `tumanow-db` Postgres instance and the `tumanow-api` web service. Approve and create them.
4. It will build and deploy — the Postgres database gets created, `DATABASE_URL` gets wired to the API automatically, and `JWT_SECRET` gets auto-generated. You do **not** need to set either of those yourself.
5. **One thing you do need to set manually**, because it isn't known yet: go to the `tumanow-api` service → **Environment**, and set
   ```
   CORS_ORIGINS=https://your-project.vercel.app
   ```
   (You'll get the real Vercel URL in step 2 below — come back and set this after, then trigger "Manual Deploy" to restart with it. Until you do, the API will refuse to start at all — this is deliberate, not a bug: it's the same safety check that stops anyone from accidentally deploying with the browser-security check wide open.)
6. Once it's live, confirm it: `https://tumanow-api.onrender.com/v1/health` should return `{"status":"ok","service":"tumanow-api"}`, and `https://tumanow-api.onrender.com/docs` should show the API docs.
7. **Seed demo data (optional, one-time):** Render's free plan doesn't give you an SSH shell, so either temporarily add `&& npm run db:seed` to the build command for one deploy then remove it again, or run it from your own machine pointed at the Render database's **External Database URL** (found on the `tumanow-db` page):
   ```bash
   DATABASE_URL="<external-database-url-from-render>" npm run db:seed
   ```

**Schema changes going forward:** this project uses real Prisma migrations (`prisma/migrations/`), not `db push`. The build command runs `prisma migrate deploy`, which applies any migrations that aren't in the database yet — non-destructive, non-interactive, safe to run on every deploy. When you change `schema.prisma` locally, run `npm run db:migrate` (not `db:push`) to generate the new migration file and commit it — that's what the next deploy will apply. Don't mix `db:push` back in once migrations exist; it bypasses the migration history and Prisma will flag "drift" the next time you try to migrate.

**Free-tier note:** Render's free web services spin down after inactivity and take ~30–50s to wake back up on the next request. Fine for a demo, not for anything real — upgrade the plan if that matters to you.

---

## 2. Vercel — Web app

1. In the Vercel dashboard: **Add New → Project**, import the same GitHub repo.
2. When it asks for the **Root Directory**, set it to `apps/web`. Vercel will detect this is an npm workspace and install correctly from the repo root automatically — you don't need to change the install/build commands.
3. Before the first deploy, add an environment variable:
   ```
   NEXT_PUBLIC_API_BASE=https://tumanow-api.onrender.com/v1
   ```
   (use your actual Render URL from step 1). **This has to be set before building, not after** — Next.js bakes `NEXT_PUBLIC_*` values into the compiled JavaScript at build time, so adding it later means rebuilding, not just restarting.
4. Deploy. You'll get a URL like `https://tumanow-xxxx.vercel.app` (or your custom domain if you set one).
5. Go back to Render (step 5 above) and set `CORS_ORIGINS` to this exact URL, then redeploy the API. Until that's done, the web app will load but every API call will fail with a CORS error in the browser console.

---

## 3. Sanity check

Once both sides have the other's URL:

1. Open the Vercel URL, click **Get started**, register a test account.
2. Log in with a demo account (`customer` / `demo1234`, etc.) if you ran the seed step.
3. Create a shipment, confirm it reaches the API (Network tab should show calls to your Render URL succeeding, not CORS-blocked).

If login works but every *other* request 401s with "Invalid or expired token," that's a stale cached token on a *client*, not a server problem — see the mobile troubleshooting note in this conversation's history for what that looks like and how to clear it.

---

## Reference: all API environment variables

| Variable | Required in production? | What it does |
|---|---|---|
| `DATABASE_URL` | Yes | Set automatically by the Render Blueprint |
| `JWT_SECRET` | Yes | Set automatically by the Render Blueprint (auto-generated) |
| `CORS_ORIGINS` | Yes | **You must set this manually** — comma-separated list of allowed browser origins |
| `NODE_ENV` | Yes | Set to `production` by the Blueprint — this is what turns on the required-secrets checks |
| `MESSAGING_MODE` | No | `log` (default, prints instead of sending), `live`, or `off` |
| `AFRICASTALKING_*` | No | Only needed if you want real SMS in `live` mode |
| `SENDGRID_API_KEY` / `EMAIL_FROM` | No | Only needed if you want real email in `live` mode |
| `PAYMENTS_AUTO_CONFIRM` | No | `true` (default) auto-confirms sandbox payments after a delay |

And for the web app: `NEXT_PUBLIC_API_BASE` — the only one it needs, set in Vercel before building.
