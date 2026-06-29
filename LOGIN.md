# NFA Login

## Start the app

```powershell
cd "c:\desktop\GCU\IIPC\NFA new"
npm run db:init
npm run dev
```

Open http://localhost:3000/login

## Password (all users)

**`password123`**

## Accounts

| Role | Email |
|------|--------|
| Faculty | faculty.cse@gcu.edu.in |
| HOD | hod.cse@gcu.edu.in |
| Club Authority | club.sports@gcu.edu.in |
| IQAC | iqac@gcu.edu.in |
| PMSEB | pmseb@gcu.edu.in |
| COE | coe@gcu.edu.in |
| Registrar | registrar@gcu.edu.in |
| OFC | ofc@gcu.edu.in |

Click any row on the login page to auto-fill.

## Troubleshooting

If login fails:

```powershell
npm run db:init
```

Stop the server (Ctrl+C), then `npm run dev` again.
