# TransitOps — Smart Transport Operations Platform

A full-stack logistics management platform digitizing vehicle, driver, dispatch, maintenance, and expense management. Built for the Odoo India Hackathon 2026.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript, Vite, Tailwind CSS, Radix UI, Lucide Icons |
| **Backend** | Node.js + Express, TypeScript (ESM), Zod validation |
| **Database** | PostgreSQL 16 via Docker Compose |
| **ORM** | Prisma 6 with type-safe queries and tagged-template raw queries |
| **Auth** | JWT (jsonwebtoken) + bcrypt password hashing |
| **Reports** | CSV export, PDF generation (pdfkit) |
| **AI** | OpenAI API integration for fleet briefings (optional, rules-only fallback) |

## Quick Setup

### Prerequisites
- Node.js ≥ 20
- Docker & Docker Compose

### 1. Start PostgreSQL
```bash
docker compose up -d
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp backend/.env.example backend/.env
# Or create backend/.env with:
# DATABASE_URL=postgresql://transitops:transitops@localhost:5433/transitops?schema=public
# JWT_SECRET=transitops-dev-secret-key-change-in-production
# JWT_EXPIRES_IN=8h
# CORS_ORIGIN=http://localhost:5173,http://localhost:5174,http://localhost:5175
```

### 4. Run database migrations & seed
```bash
cd backend
npx prisma generate
npx prisma migrate deploy
npx tsx prisma/seed.ts   # Seeds 15 vehicles, 15 drivers, 12 trips, fuel/expense/maintenance data
cd ..
```

### 5. Start development servers
```bash
npm run dev
```
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000

### Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Fleet Manager | admin@transitops.in | TransitOps2026! |
| Driver | driver@transitops.in | TransitOps2026! |
| Safety Officer | safety@transitops.in | TransitOps2026! |
| Financial Analyst | finance@transitops.in | TransitOps2026! |

---

## Architecture

### Backend Structure
```
backend/src/
├── config/          # env validation (Zod), Prisma client singleton
├── middleware/       # JWT auth, RBAC, error handler, file upload (Multer)
├── routes/          # Express routers (auth, vehicles, drivers, trips, etc.)
├── controllers/     # Request parsing, response shaping
├── services/        # Business logic, Prisma queries, transaction boundaries
└── utils/           # ApiError class, async handler, pagination
```

### Frontend Structure
```
frontend/src/
├── components/
│   ├── auth/        # Login page
│   ├── dashboard/   # Fleet Manager dashboard, Driver home view
│   ├── vehicles/    # Vehicle registry + document management
│   ├── drivers/     # Driver CRUD + safety score management
│   ├── trips/       # Trip lifecycle (create → dispatch → complete/cancel)
│   ├── finance/     # Fuel logs + expense tracking
│   ├── safety/      # Compliance alerts dashboard
│   ├── reports/     # Financial reports + CSV export
│   ├── maintenance/ # Maintenance log management
│   └── ui/          # Shared components (Button, StatusBadge, SafetySparkline)
├── lib/             # API client, auth utilities, service-specific API helpers
├── types/           # TypeScript type definitions
└── styles/          # Global CSS with CSS variables for theming
```

### Transaction Boundaries

Every state-changing operation that touches multiple tables is wrapped in a `prisma.$transaction()`:

| Operation | Tables Modified | Transaction Scope |
|-----------|----------------|-------------------|
| **Dispatch Trip** | Trip → Dispatched, Vehicle → On_Trip, Driver → On_Trip | Single atomic transaction |
| **Complete Trip** | Trip → Completed + odometer/fuel, Vehicle → Available + odometerKm, Driver → Available | Single atomic transaction |
| **Cancel Dispatched Trip** | Trip → Cancelled, Vehicle → Available, Driver → Available | Single atomic transaction |
| **Open Maintenance** | MaintenanceLog created, Vehicle → In_Shop | Single atomic transaction |
| **Close Maintenance** | MaintenanceLog → Closed + closedAt, Vehicle → Available (unless Retired) | Single atomic transaction |

### Database Constraints

All business rules are enforced at **both** the application layer AND the database level:

- **UNIQUE** constraints on `Vehicle.regNumber`, `Driver.licenseNumber`, `User.email`
- **CHECK** constraints: `cargoWeightKg > 0`, `maxLoadCapacityKg > 0`, `safetyScore 0-100`, non-negative costs/amounts
- **Foreign keys** on all relationship columns with appropriate `ON DELETE` behavior
- **Indexes** on frequently queried columns (`status`, `vehicleId`, `driverId`, `licenseExpiryDate`)

### Error Handling

Every error response follows the `{ field, message }` format:
- **Zod validation errors** → 400 with field path and validation message
- **ApiError** → appropriate status code with field-level context
- **Prisma constraint violations** → caught and translated to user-friendly messages
- **Multer file errors** → 400 with file-specific message
- **Unhandled errors** → 500 with sanitized message in production

---

## RBAC (Role-Based Access Control)

Each role has a genuinely different experience:

| Role | Default View | Accessible Modules |
|------|-------------|-------------------|
| **Fleet Manager** | Full KPI Dashboard | All modules |
| **Driver** | My Trips (focused view) | Trips only |
| **Safety Officer** | Compliance Alerts | Safety, Vehicles, Drivers |
| **Financial Analyst** | Financial Reports | Reports, Finance, Vehicles |

Backend routes enforce role restrictions via `requireRoles()` middleware — wrong-role access returns 403.

---

## Business Rules Checklist

| # | Rule | Backend | DB Constraint |
|---|------|---------|---------------|
| 1 | Vehicle regNumber unique | ✅ P2002 → field error | ✅ UNIQUE |
| 2 | Only Available vehicles in dispatch pool | ✅ WHERE status='Available' | — |
| 3 | Expired/Suspended drivers cannot be assigned | ✅ Checked at create + dispatch | — |
| 4 | On_Trip vehicle/driver cannot be double-assigned | ✅ Status check before assignment | — |
| 5 | Cargo weight ≤ vehicle capacity | ✅ Application check with specific error | ✅ CHECK > 0 |
| 6 | Dispatch: Trip+Vehicle+Driver in single transaction | ✅ prisma.$transaction | — |
| 7 | Complete: Trip+Vehicle+Driver+odometer in transaction | ✅ prisma.$transaction | — |
| 8 | Cancel Dispatched: restore statuses in transaction | ✅ prisma.$transaction | — |
| 9 | Open maintenance: create log + Vehicle→In_Shop | ✅ prisma.$transaction | — |
| 10 | Close maintenance: log→Closed + Vehicle→Available (unless Retired) | ✅ prisma.$transaction | — |

---

## Feature Checklist (Mandatory Deliverables)

- [x] Vehicle Registry CRUD with document management
- [x] Driver Management CRUD with safety score tracking
- [x] Trip Management full lifecycle (Draft → Dispatched → Completed/Cancelled)
- [x] Maintenance workflow (Open → Close with vehicle status transitions)
- [x] Fuel & Expense logging with per-vehicle cost aggregation
- [x] Fleet Manager KPI Dashboard (utilization %, active trips, cost breakdown)
- [x] Financial Reports with CSV export and vehicle cost analysis
- [x] Safety/Compliance Alerts (license expiry, document expiry, suspended drivers)
- [x] AI Fleet Insights (OpenAI integration with rules-only fallback)
- [x] 4 role-based views (Fleet Manager, Driver, Safety Officer, Financial Analyst)
- [x] JWT authentication with bcrypt password hashing
- [x] Dark mode + light mode with CSS variable theming
- [x] Pagination on all list endpoints
- [x] Loading skeletons and empty states
- [x] Server-side validation (Zod) with field-level error responses
- [x] Database-level constraints (CHECK, UNIQUE, FK, indexes)
- [x] Comprehensive seed data (15 vehicles, 15 drivers, 12 trips, fuel/expense/maintenance)
- [x] PDF compliance report generation

---

## Security

- **Passwords**: bcrypt hashed with 12 salt rounds
- **Auth**: JWT tokens with configurable expiration
- **RBAC**: `requireRoles()` middleware on every protected route
- **SQL Injection**: Prisma parameterized queries exclusively (no string concatenation)
- **Rate Limiting**: `express-rate-limit` on login route
- **CORS**: Explicitly configured allowed origins
- **Helmet**: Security headers via `helmet` middleware
- **File Upload**: Type + size restrictions via Multer

---

## Team

Built by a 2-person student team for the Odoo India Hackathon 2026.
