# TransitOps

Smart Transport Operations Platform built with PostgreSQL + Prisma + Express + React + TypeScript for the Odoo hackathon plan.

## Person A Scope

This repo is currently structured for Person A: Vehicle Registry, Driver Management, Maintenance workflow, and Safety Officer compliance views. Trip Management, Fuel/Expense, Reports, and AI Insights belong to Person B and are intentionally not implemented here.

## Phase 1 Foundation

- Express + TypeScript backend skeleton
- PostgreSQL connection via Prisma Client
- Docker Compose PostgreSQL service
- JWT auth and role-based middleware for the four planned roles
- Vite + React + TypeScript frontend skeleton
- Tailwind design tokens for the dark-mode-first TransitOps UI
- Shared API client and layout shell

## Quick Start

```bash
npm install
cp .env.example backend/.env
docker compose up -d
npm run prisma:migrate --workspace backend
npm run dev
```

Backend: `http://localhost:4000`

Frontend: `http://localhost:5173`

## Architecture Notes

The backend is organized into `routes`, `controllers`, `services`, `models`, and `middleware` so Person A modules can be added without colliding with Person B's vertical slice. Multi-row business rules, such as opening or closing maintenance records, must use `prisma.$transaction(...)` once those endpoints are implemented.
