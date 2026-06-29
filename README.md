# NFA – Note For Approval System

Enterprise-grade university approval management for Garden City University. Multi-level workflows for **Academic** and **Club** requests with role-based dashboards, analytics, authority management, audit logs, and notifications.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS (enterprise ERP design system) |
| Charts | Recharts |
| Auth | NextAuth.js (JWT, credentials) |
| Database | PostgreSQL + Prisma ORM |
| Validation | Zod |

## Quick Start

### Prerequisites

- Node.js 20+

### Setup

```bash
# Install dependencies
npm install

# Configure environment (optional — defaults work)
cp .env.example .env

# Create local database + demo users
npm run db:init

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo Accounts (password: `password123`)

| Role | Email |
|------|-------|
| Faculty (CSE) | faculty.cse@gcu.edu.in |
| HOD (CSE) | hod.cse@gcu.edu.in |
| Club Authority | club.sports@gcu.edu.in |
| IQAC | iqac@gcu.edu.in |
| PMSEB | pmseb@gcu.edu.in |
| COE | coe@gcu.edu.in |
| Registrar | registrar@gcu.edu.in |
| OFC | ofc@gcu.edu.in |

## Approval Workflows

### Academic

```
Faculty/HOD → HOD → IQAC → PMSEB → COE → Registrar → OFC → Completed
```

### Club (skips HOD)

```
Faculty → Club Authority → IQAC → PMSEB → COE → Registrar → OFC → Completed
```

## Business Rules Implemented

- **Faculty**: Own requests only; no department/analytics access
- **HOD**: Department academic requests only; cannot approve club requests; can raise own requests
- **Club Authority**: Assigned clubs only; configurable by Registrar/OFC
- **IQAC / PMSEB / COE**: Queue after HOD or Club Authority approval
- **Registrar / OFC**: Full visibility, analytics, authority reassignment, audit logs

## Project Structure

```
src/
├── app/
│   ├── (app)/          # Authenticated routes (sidebar layout)
│   │   ├── dashboard/  # Role-based dashboards
│   │   ├── requests/   # Raise, list, detail, department
│   │   ├── approvals/  # Approval queue & history
│   │   ├── analytics/  # Executive analytics
│   │   ├── authorities/
│   │   ├── clubs/
│   │   ├── notifications/
│   │   ├── audit-logs/
│   │   └── reports/
│   ├── api/            # REST API routes
│   └── login/
├── components/
│   ├── dashboard/      # Per-role dashboard widgets
│   ├── layout/         # Sidebar, topbar, app shell
│   ├── requests/       # Form & detail views
│   └── ui/             # KPI cards, timeline, badges, tables
└── lib/
    ├── workflow/       # Approval engine & timeline
    ├── services/       # Request & approval business logic
    ├── rbac.ts         # Permissions & access rules
    ├── audit.ts
    └── notifications.ts
prisma/
├── schema.prisma       # Full normalized schema
└── seed.ts
docs/
└── ARCHITECTURE.md     # Detailed architecture & ER logic
```

## API Overview

| Endpoint | Description |
|----------|-------------|
| `GET/POST /api/requests` | List/create requests |
| `GET /api/requests/[id]` | Request detail + timeline |
| `POST /api/requests/[id]/approve` | Approve / reject / resend |
| `GET /api/dashboard/stats` | Role-scoped KPI stats |
| `GET /api/analytics` | Registrar/OFC analytics |
| `GET/POST /api/authorities` | Authority mapping |
| `GET/POST /api/clubs/authorities` | Club authority assignment |
| `GET/PATCH /api/notifications` | Notifications |
| `GET /api/audit-logs` | Audit trail |

## Status Color Coding

| Status | Color |
|--------|-------|
| Approved | Green |
| Pending | Orange |
| Rejected | Red |
| Resend | Yellow |
| Under Review | Blue |
| Forwarded | Violet |
| Completed | Emerald |

## Documentation

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for database ER logic, workflow engine design, RBAC matrix, and extension guide.

## Production Checklist

- [ ] Set strong `NEXTAUTH_SECRET`
- [ ] Use managed PostgreSQL with SSL
- [ ] Configure file upload storage (S3/Azure Blob)
- [ ] Enable rate limiting on API routes
- [ ] Set up email/SMS notification provider
- [ ] Run `prisma migrate deploy` in CI/CD

## License

Proprietary – Garden City University IIPC
