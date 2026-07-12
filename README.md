# TransitOps Smart Transport Operations Platform

MERN + TypeScript transport operations platform for managing fleet assets, drivers, dispatch, maintenance, expenses, and analytics.

## First Person B Slice

This first-hour commit starts the Operations & Analytics lane with a focused backend foundation for Trip Management:

- Express API skeleton with health check.
- Mongoose models for vehicles, drivers, and trips.
- Draft trip creation endpoint.
- Business-rule validation for dispatch readiness:
  - vehicles must be available
  - drivers must be available
  - suspended or expired-license drivers are blocked
  - cargo cannot exceed vehicle load capacity
- Unit tests around the trip validation rules.

## Scripts

```bash
npm install
npm run dev
npm test
```

## Environment

Create `server/.env` when running locally:

```bash
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/transitops
```

