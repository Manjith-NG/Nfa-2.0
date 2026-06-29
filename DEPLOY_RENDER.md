# Deploy NFA on Render — https://nfa-gcu.onrender.com

## Git ↔ Render connection

| Check | Expected |
|-------|----------|
| GitHub repo | https://github.com/NERDS-GEEKS/NFA-2.0 |
| Branch | `main` |
| Latest deploy commit | `9fdc9ea` or newer (Render deploy fix) |

In Render → your service → **Settings → Build & Deploy**:

- **Repository:** `Manjith-NG/Nfa`
- **Branch:** `main`
- **Auto-Deploy:** On

If the repo is not linked, click **Connect account** → GitHub → select **Nfa**.

---

## Why you see “Not Found” (404)

A **404 on every URL** (`/`, `/login`, `/api/...`) usually means:

1. **Wrong service type** — still a **Static Site** with publish directory `dist` (delete that; use **Web Service**), or  
2. **Start command missing / wrong** — app never listens on Render’s `PORT`, or  
3. **Deploy failed** — check **Logs** tab for red errors after build.

This project is **Next.js**. There is **no `dist` folder**.

---

## Correct Render settings (Web Service)

Service name can be `nfa-gcu` → URL `https://nfa-gcu.onrender.com`

| Setting | Value |
|--------|--------|
| **Type** | Web Service |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run render-build` |
| **Start Command** | `npm start` |
| **Publish directory** | *(empty — do not use `dist`)* |

### Environment variables

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Supabase pooler URL (`postgresql://...pooler...:6543/...?pgbouncer=true`) |
| `DIRECT_URL` | Supabase direct URL (`postgresql://...@db....supabase.co:5432/...`) |
| `NEXTAUTH_SECRET` | *(Generate — 32+ chars)* |
| `NEXTAUTH_URL` | `https://nfa-gcu.onrender.com` |
| `UPLOAD_DIR` | `./uploads` |
| `NODE_VERSION` | `20.11.1` |

`NEXTAUTH_URL` must match your URL **exactly** (HTTPS, no trailing `/`).

---

## After fixing settings

1. **Manual Deploy** → Deploy latest commit  
2. Wait until status is **Live** (not Build failed)  
3. Open: **https://nfa-gcu.onrender.com/login**

Demo login: `faculty.cse@gcu.edu.in` / `password123`

---

## Verify deploy worked

In Render **Logs**, you should see:

```text
Starting Next.js on 0.0.0.0:10000
✓ Ready
```

If you only see `Publish directory dist does not exist` → still configured as Static Site.

---

## Push latest code from your PC

```powershell
cd "c:\desktop\GCU\IIPC\NFA new"
git pull origin main
git push origin main
```

Then trigger **Manual Deploy** on Render.
