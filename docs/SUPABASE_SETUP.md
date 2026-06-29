# Supabase Setup for NFA

## Project

- **Project ref:** `uuqzhbzovurnlbiuazgh`
- **URL:** https://uuqzhbzovurnlbiuazgh.supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/uuqzhbzovurnlbiuazgh

## Cursor MCP

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=uuqzhbzovurnlbiuazgh"
    }
  }
}
```

Then **Cursor Settings → MCP → Supabase → Connect** and sign in.

## Connect the app

1. Open **Project Settings → Database** in Supabase.
2. Copy your **Database password** (reset if needed).
3. Run:

```bash
npm run setup:env YOUR_DATABASE_PASSWORD
```

Or edit `.env` and replace `YOUR_DB_PASSWORD` in both `DATABASE_URL` and `DIRECT_URL`.

4. Push schema and seed:

```bash
npm run db:push
npm run db:seed
npm run dev
```

## SQL setup (alternative)

Run in Supabase SQL Editor, in order:

1. `supabase/fix-now.sql` (only if resetting a broken DB)
2. `supabase/schema.sql`
3. `supabase/seed-master-data.sql`
4. `supabase/org-master.sql`
5. `supabase/naac-metrics.sql`

Then run `npm run db:seed` for demo users with passwords.

## Login (demo accounts)

Password for all accounts: **`password123`**

| Role | Email |
|------|-------|
| Faculty | faculty.cse@gcu.edu.in |
| HOD | hod.cse@gcu.edu.in |
| Registrar | registrar@gcu.edu.in |
| IQAC | iqac@gcu.edu.in |

## Security note

RLS is disabled on NFA tables because the app uses Prisma with a direct database connection. Restrict database access in production; do not commit `.env`.
