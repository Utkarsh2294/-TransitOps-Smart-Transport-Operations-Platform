# TransitOps - Smart Transport Operations Platform

TransitOps is a comprehensive, full-stack fleet management and transport operations platform designed to streamline the logistics lifecycle. By bringing together vehicle telemetry, personnel compliance, financial analytics, and intelligent insights into a unified interface, TransitOps enables transportation companies to optimize their operations and reduce overhead.

## Key Features

TransitOps provides a dynamic, role-based experience tailored to the specific needs of different stakeholders within a transport organization:

- **Role-Based Access Control (RBAC):** Customized workspaces and permissions for Fleet Managers, Drivers, Safety Officers, and Financial Analysts.
- **Intelligent Dashboards:** Real-time metrics, attention queues, and actionable AI-driven fleet insights.
- **Vehicle & Maintenance Registry:** End-to-end tracking of vehicle lifecycles, fuel efficiency trends, compliance documents, and preventative maintenance schedules.
- **Driver & Safety Management:** Centralized driver benches, license expiry tracking, and safety incident logging with automated risk scoring.
- **Trip Dispatch & Logistics:** Comprehensive trip planning, real-time status tracking, and "Planned vs. Actual" deviance scorecards for cost and fuel efficiency.
- **Financial Analytics:** Granular tracking of recurring expenses, fuel logs (with receipt attachments), and multi-dimensional cost breakdowns using interactive charts.
- **Reporting & Compliance:** Automated report snapshots, downloadable CSV cost exports, and compliance PDF generation for regulatory adherence.

## Technology Stack

The platform is built using a modern, scalable architecture designed for high performance and maintainability:

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (featuring a responsive, dark/light mode adaptable Bento-Grid UI)
- **Data Visualization:** Recharts
- **Icons:** Lucide React

### Backend
- **Runtime:** Node.js with Express
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT (JSON Web Tokens) with bcrypt password hashing
- **File Handling:** Multer (for document and receipt uploads)

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Utkarsh2294/-TransitOps-Smart-Transport-Operations-Platform.git
   cd -TransitOps-Smart-Transport-Operations-Platform
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend` directory with the following variables:
   ```env
   NODE_ENV="development"
   PORT=4000
   DATABASE_URL="postgresql://user:password@localhost:5432/transitops?schema=public"
   JWT_SECRET="your_super_secret_jwt_key_here_minimum_20_chars"
   JWT_EXPIRES_IN="8h"
   CORS_ORIGIN="http://localhost:5173"
   ```
   Run database migrations and seed the database with initial demo data:
   ```bash
   npx prisma migrate dev
   npx tsx prisma/seed.ts
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```
   Create a `.env` file in the `frontend` directory:
   ```env
   VITE_API_BASE_URL="http://localhost:4000/api"
   ```

### Running the Application

Start the backend server:
```bash
cd backend
npm run dev
```

Start the frontend development server:
```bash
cd frontend
npm run dev
```

Access the application at `http://localhost:5173`. 

### Demo Credentials
If you have run the database seed script, you can log in using the following test accounts (Password for all: `TransitOps2026!`):
- **Fleet Manager:** `manager@transitops.com`
- **Driver:** `driver@transitops.com`
- **Safety Officer:** `safety@transitops.com`
- **Financial Analyst:** `finance@transitops.com`

## Architecture Overview

TransitOps follows a clean, decoupled client-server architecture:
- **RESTful API:** The Node.js/Express backend exposes a strictly typed REST API, safeguarded by role-based middleware.
- **Service Layer Pattern:** Business logic (e.g., trip lifecycle state machines, safety score calculations, recurring expense triggers) is isolated in dedicated service modules.
- **Component-Driven UI:** The React frontend utilizes highly reusable, stateless components adhering to a unified design system. API calls are centralized through a custom typed request wrapper for consistent error handling and token injection.

## License

This project is proprietary and confidential. Unauthorized copying of this file, via any medium, is strictly prohibited.
