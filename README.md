# Finance Dashboard API

A role-based finance backend built for Zorvyn's backend assessment. It lets different types of users interact with financial records based on their role  admins manage everything, analysts read and analyze, viewers only see dashboard summaries.

---

## The problem this solves

Most small finance teams manage money across spreadsheets and disconnected tools with no access control. Anyone can see or accidentally delete anything. This backend solves that by enforcing who can do what at the API level  not just at the UI level.

Real scenario: a startup has three people who need financial visibility:
- The CFO needs to add transactions and manage team access
- The finance analyst needs to read records and pull insights
- An investor should only see high-level dashboard numbers, not raw payroll or supplier data

---

## Tech stack

- Runtime: Node.js
- Framework: Express.js
- Database: MongoDB with Mongoose
- Auth: JWT (jsonwebtoken + bcryptjs)
- Validation: express-validator
- Rate limiting: express-rate-limit
- Tests: Jest + Supertest
- Docs: Swagger UI

---

## Getting started

### 1. Clone and install

```bash
git clone <repo-url>
cd finance-dashboard-api
npm install
```

### 2. Set up environment

```bash
cp .env.example .env
# Fill in your MongoDB URI and a long random JWT secret
```

### 3. Seed demo data (optional but recommended)

```bash
npm run seed
```

Creates three ready-to-use accounts and 20 sample transactions across 6 months:

| Email | Password | Role |
|---|---|---|
| admin@zorvyn.com | password123 | admin |
| analyst@zorvyn.com | password123 | analyst |
| viewer@zorvyn.com | password123 | viewer |

### 4. Run the server

```bash
npm run dev      # development with auto-restart
npm start        # production
```

### 5. Run tests

```bash
npm test
```

Requires a local MongoDB instance running on port 27017 for the test database.

### 6. View API docs

```
http://localhost:5000/api-docs
```

---

## Roles and permissions

| Action | Viewer | Analyst | Admin |
|---|---|---|---|
| Login / register | yes | yes | yes |
| View dashboard summary | yes | yes | yes |
| View category breakdown | yes | yes | yes |
| View monthly trends | yes | yes | yes |
| View recent activity | yes | yes | yes |
| Read transactions | no | yes | yes |
| Create transactions | no | no | yes |
| Update transactions | no | no | yes |
| Delete transactions | no | no | yes |
| Manage users | no | no | yes |

New accounts always start as viewer. Admins promote users via `PATCH /api/users/:id/role`.

---

## API endpoints

### Auth
```
POST   /api/auth/register    Register a new account
POST   /api/auth/login       Login — rate limited to 10 attempts per 15 min
GET    /api/auth/me          Get the logged-in user's profile
```

### Users — admin only
```
GET    /api/users               List all users
GET    /api/users/:id           Get one user
PATCH  /api/users/:id/role      Change a user's role
PATCH  /api/users/:id/status    Activate or deactivate a user
```

### Transactions  analyst and admin to read, admin to write
```
GET    /api/transactions         List with filters and pagination
GET    /api/transactions/:id     Get one transaction
POST   /api/transactions         Create (admin only)
PATCH  /api/transactions/:id     Update (admin only)
DELETE /api/transactions/:id     Soft delete (admin only)
```

Filter params for GET /api/transactions:
- `type` — income or expense
- `category` — salary, marketing, infrastructure, operations, revenue, investment, refund, tax, other
- `startDate`, `endDate` — ISO format, e.g. 2024-01-01
- `page`, `limit` — pagination, default page 1 and limit 10

### Dashboard  all authenticated users
```
GET    /api/dashboard/summary       Total income, expenses, net balance
GET    /api/dashboard/categories    Spending grouped by category
GET    /api/dashboard/trends        Monthly income vs expense (?months=6)
GET    /api/dashboard/recent        Last 10 transactions
```

---

## Optional enhancements included

The assignment listed these as optional. All of them are implemented:

- JWT authentication with bcrypt password hashing and token expiry
- Pagination on transaction listing with totalPages and hasNextPage
- Soft delete  transactions are never permanently removed, just flagged
- Rate limiting  10 login attempts per 15 minutes, 100 API requests per minute
- 34 Jest and Supertest integration tests across auth, RBAC, transactions, dashboard, and users
- Swagger UI documentation at /api-docs with request and response schemas for all endpoints
- Seed script for instant demo data with npm run seed

---

## Key design decisions

### Why soft delete instead of hard delete?
Financial records should never be permanently removed. If someone accidentally deletes a transaction, it can be recovered. The isDeleted flag and deletedAt timestamp exclude records from normal queries while keeping the data in the database for audit purposes. This is standard practice in any financial system.

### Why RBAC in middleware instead of controllers?
If access control logic lives inside controllers, it is easy to forget when adding a new endpoint. Declaring requireRole("admin") directly in the route definition makes permissions visible at a glance and impossible to accidentally skip.

### Why fetch fresh user data on every authenticated request?
JWT tokens are valid until they expire. If an admin deactivates a user, their existing token would still work until expiry. The requireAuth middleware fetches the user from the database on every request to catch this  a small performance cost that is worth the security gain.

### Why MongoDB aggregation pipelines for the dashboard?
Fetching all transactions into JavaScript memory and summing them there does not scale. With 100,000 records that becomes a significant data transfer and memory problem. MongoDB aggregation handles the math on the server side and returns only the numbers needed.

### Why a constants file for roles and categories?
Without a central constants file, the string "admin" would be typed in 6 different files. One typo silently breaks a role check. Importing from src/config/constants.js means a typo is caught immediately as a reference error.

---

## Assumptions made

1. Categories are fixed at the schema level. In a real system these would be configurable per company.
2. Soft-deleted transactions are excluded from all queries by default. A recovery endpoint is not built but would be straightforward to add.
3. No email verification — out of scope for this assessment.
4. The first admin account is created via the seed script. In production this would be handled during deployment onboarding.

---

## Tradeoffs considered

- MongoDB over a relational database: chosen for flexibility in the transaction schema and because aggregation pipelines are well suited for the dashboard summary queries. The tradeoff is weaker relational integrity  a deleted user's transactions still reference their ID.
- JWT over sessions: stateless tokens scale better but cannot be invalidated before expiry. Mitigated by the per-request DB lookup in requireAuth that catches deactivated users.
- Fixed categories over a dynamic category system: simpler to implement and validate, but less flexible for different companies. Documented as an assumption.
- In-memory rate limiting over Redis: simpler setup, but limits reset if the server restarts. Acceptable for a single-server assessment setup.

---

## Project structure

```
src/
├── config/
│   ├── database.js          # MongoDB connection
│   ├── constants.js         # Roles and categories — single source of truth
│   └── validateEnv.js       # Crashes early if required env vars are missing
├── models/
│   ├── User.js              # User schema with roles and password hashing
│   └── Transaction.js       # Transaction schema with soft delete and indexes
├── middleware/
│   ├── auth.js              # JWT verification and deactivated user check
│   ├── roleGuard.js         # RBAC enforcement
│   ├── validate.js          # Input validation rules for all routes
│   └── rateLimiter.js       # Brute force and abuse protection
├── services/
│   ├── authService.js       # Register and login logic
│   ├── userService.js       # User management with self-demotion guard
│   ├── transactionService.js # CRUD, filters, pagination, soft delete
│   └── dashboardService.js  # MongoDB aggregation pipelines
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── transactionController.js
│   └── dashboardController.js
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── transactionRoutes.js
│   └── dashboardRoutes.js
├── utils/
│   ├── response.js          # Consistent success and error response format
│   └── catchAsync.js        # Wraps async handlers to remove try/catch boilerplate
└── app.js                   # Express setup and entry point

tests/
├── testSetup.js             # Test database connection helpers
├── auth.test.js             # Auth endpoint tests
├── transactions.test.js     # RBAC and transaction tests
├── users.test.js            # User management tests
└── dashboard.test.js        # Aggregation and dashboard tests

seed.js                      # Demo data script
swagger.yaml                 # API documentation
.env.example                 # Environment variable template
```
