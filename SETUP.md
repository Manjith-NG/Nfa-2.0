# Quick setup (fix "Database not configured")

Your `.env` must contain your **real** Supabase database password (not `YOUR_DB_PASSWORD`).

## Option A — Interactive (easiest)

```powershell
cd "c:\desktop\GCU\IIPC\NFA new"
npm run dev
```

When prompted, paste the password from:
https://supabase.com/dashboard/project/uuqzhbzovurnlbiuazgh/settings/database

## Option B — One command

```powershell
cd "c:\desktop\GCU\IIPC\NFA new"
node scripts/setup-env.mjs "YOUR_PASSWORD_HERE"
npm run test:db
npm run dev
```

Use quotes around the password if it contains special characters.

## Login after setup

- Email: `faculty.cse@gcu.edu.in`
- Password: `password123`

## Verify database

Open http://localhost:3000/api/health/db — should show `{"ok":true,"users":8}`
