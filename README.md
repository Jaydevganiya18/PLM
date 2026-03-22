# PLM / ECO Management System

A complete full-stack Engineering Change Order (ECO) Management System with controlled Product and BoM versioning.

## Tech Stack
- **Backend**: Node.js + Express.js + Sequelize ORM + MySQL
- **Frontend**: React 18 + Vite + Tailwind CSS + React Router v6
- **Auth**: JWT + bcrypt

## Prerequisites
- Node.js 18+
- MySQL 8+ (running locally or remote)
- npm

---

## Setup Instructions

### 1. Clone the repo
```bash
git clone <your-repo-url>
cd PLM
```

### 2. Backend Setup

```bash
cd backend-node
npm install
```

#### Configure Environment Variables
Copy the `.env.example` and fill in your values:
```bash
copy .env.example .env
```

Edit `.env` (make sure your MySQL credentials match):
```env
DATABASE_URL="mysql://root:password@localhost:3306/plm_db"
PORT=5000
JWT_SECRET="super-secret-jwt-key-change-me-in-production"
FRONTEND_URL="http://localhost:5173"
```

#### Create the Database
Open your MySQL client and run:
```sql
CREATE DATABASE plm_db;
```

#### Synchronize Database & Auto-Generate Fake Data (Seed)
*Note: Sequelize automatically creates tables when the server starts, but a completely blank system is hard to use. To generate sample test data so you can log in, test workflows, and view lists, run the seed script:*

```bash
npm run seed
```

**What the seed script does:**
1. Truncates all tables safely (clears old data).
2. Generates the default User roles (`Admin`, `Engineering`, `Operations`, `Approver`).
3. Sets up the 2-stage ECO Workflow in the `EcoStages` and `ApprovalRules` tables.
4. Uses `faker.js` to automatically insert realistic test data:
   - ~160 Products (with ~400 total Product Versions & Audit Logs)
   - ~155 BoMs & their internal components
   - ~300 ECOs representing various realistic lifecycle states (Created, Pending, Approved, Rejected, Applied).
   - Generates historical Audit log entries for the above data.

#### Start Backend server
```bash
npm run dev
```

The backend API will run on: **http://localhost:5000**

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

#### Configure Environment Variable
```bash
copy .env.example .env
```

The default `.env` already points `VITE_API_URL` to `http://localhost:5000/api`.

#### Start Frontend
```bash
npm run dev
```

The frontend will run on: **http://localhost:5173**

---

## Sample Login Credentials (from Seed)

| Role        | Email                  | Password     | Description |
|-------------|------------------------|--------------|-------------|
| Admin       | admin@plm.com          | password123  | Full system access. |
| Engineering | eng1@plm.com           | password123  | Can create Products, BoMs, and ECO Drafts. |
| Approver    | approver1@plm.com      | password123  | Required to approve ECOs during the Approval stage. |
| Operations  | ops1@plm.com           | password123  | Read-only access to Active (Applied) BoMs and Products. |

---

## Role-Based Access

| Feature                       | ADMIN | ENGINEERING | APPROVER | OPERATIONS |
|-------------------------------|-------|-------------|----------|------------|
| Dashboard                     | ✅   | ✅          | ✅       | ✅        |
| Products (Read)               | ✅   | ✅          | ✅       | Active only|
| Products (Create/Edit/Archive)| ✅   | ❌          | ❌       | ❌        |
| BoMs (Read)                   | ✅   | ✅          | ✅       | Active only|
| BoMs (Create/Edit/Archive)    | ✅   | ❌          | ❌       | ❌        |
| ECOs (View)                   | ✅   | Own ECOs   | Queue   | ❌        |
| ECOs (Create/Edit Draft)      | ✅   | ✅          | ❌       | ❌        |
| ECOs (Approve/Reject)         | ✅   | ❌          | ✅       | ❌        |
| Settings                      | ✅   | ❌          | ❌       | ❌        |
| Reports                       | ✅   | ❌          | ❌       | ❌        |
| Audit Logs                    | ✅   | ❌          | ❌       | ❌        |

---

## Simplified ECO Workflow

ECOs run through a dynamic pipeline based on `EcoStages`. By default, the seed creates a fast two-step workflow:

```
DRAFT [Created by Eng]
  ↓ (Start)
Engineering Review [Start Stage]
  ↓ (Validate - No approval needed)
Approval [Final Stage]
  ↓ (1 Approval Required by Approver/Admin)
APPLIED [Changes are merged into Master Data]

* Rejection at any stage moves the ECO to REJECTED.
```

---

## Design Decisions

1. **Sequelize ORM**: Switched from Prisma to Sequelize to fix MySQL index limits, better handle robust migrations, and raw query flexibility.
2. **JWT Auth**: Stateless authentication stored locally. Passwords securely hashed with bcrypt.
3. **JSON Tree Snapshots**: ECOs take a deep JSON copy of the original object (Product or BoM) and store the proposed changes concurrently. Diff computation and rollbacks are fast.
4. **Master Data Updates**: When an ECO is APPLIED (`version_update=true`), old entity versions are archived immediately, and the new version is incremented and becomes ACTIVE automatically.
5. **Operations Filtering**: The backend enforces that users with the `OPERATIONS` role can ONLY read records where `status = ACTIVE` or `APPLIED`.
6. **Built-in Forgot Password**: Reset tokens are generated securely (crypto), stored temporarily, and emailed to the user as a magic link for recovery.

---

## Project Structure

```
PLM/
├── backend-node/
│   ├── src/
│   │   ├── controllers/     # Route handlers processing business logic
│   │   ├── middleware/      # Auth, RBAC, Error handling middleware
│   │   ├── models/          # Sequelize Models representing the DB Schema
│   │   ├── routes/          # Express API route endpoints
│   │   ├── services/        # Centralized advanced business logic (e.g. ECO resolution)
│   │   ├── db.js            # Sequelize client connection setup
│   │   ├── seed.js          # Master data auto-generation script
│   │   └── server.js        # Main initialization
│   └── .env                 # Environment config
├── frontend/
│   ├── src/
│   │   ├── api/             # Setup for Axios with auth interceptors
│   │   ├── components/      # Common UI (Sidebar, StatusBadge, TopNav)
│   │   ├── context/         # AuthContext state provider
│   │   ├── pages/           # View logic mapping to routes
│   │   └── App.jsx          # Route declarations mapping URLs to components
│   └── .env                 # Vite environment variables config
└── README.md
```
