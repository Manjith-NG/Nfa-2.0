# Deploy NFA on Render — https://nfa-2-0v1.onrender.com

## Fix “Database not connected” on login

Render must reach your **Supabase** database. Easiest setup:

### Render → Environment → add these

| Key | Value |
|-----|--------|
| `SUPABASE_DB_PASSWORD` | Your Supabase **database password** (Dashboard → Settings → Database) |
| `NEXTAUTH_URL` | `https://nfa-2-0v1.onrender.com` (exact URL, no trailing `/`) |
| `NEXTAUTH_SECRET` | Generate a long random string (32+ chars) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://uuqzhbzovurnlbiuazgh.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your publishable key from Supabase |
| `UPLOAD_DIR` | `./uploads` |

`SUPABASE_DB_PASSWORD` is enough — the build script auto-finds `DATABASE_URL` and `DIRECT_URL`.

**Or** set `DATABASE_URL` + `DIRECT_URL` manually (see `.env.example`).

Then **Manual Deploy** → Deploy latest commit.

### Verify

- Health: `https://nfa-2-0v1.onrender.com/api/health/db` → `{ "ok": true, "users": ... }`
- Login: `faculty.cse@gcu.edu.in` / `password123`

### Web Service settings

| Setting | Value |
|--------|--------|
| **Build Command** | `npm install && npm run render-build` |
| **Start Command** | `npm start` |
| **Publish directory** | *(empty)* |

Repository: https://github.com/Manjith-NG/Nfa-2.0
