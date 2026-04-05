# Finance Dashboard API

A role-based finance backend built for Zorvyn's backend assessment. It lets different types of users interact with financial records based on their role — admins manage everything, analysts read and analyze, viewers only see dashboard summaries.

---

## The problem this solves

Most small finance teams manage money across spreadsheets and disconnected tools with no access control. Anyone can see (or accidentally delete) anything. This backend solves that by enforcing who can do what at the API level — not just at the UI level.

**Real scenario:** A startup has three people who need financial visibility:
- The **CFO** needs to add transactions and manage team access
- The **Finance analyst** needs to read records and pull insights
- An **Investor** should only see high-level dashboard numbers, not raw payroll or supplier data

---

## Tech stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Auth:** JWT (jsonwebtoken + bcryptjs)
- **Validation:** express-validator
- **Rate limiting:** express-rate-limit
- **Tests:** Jest + Supertest
- **Docs:** Swagger UI

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
# Edit .env and fill in your MongoDB URI and JWT secret
```

### 3. Seed demo data (optional but recommended)

```bash
npm run seed
```

This creates three accounts and 20 sample transactions so you can explore everything immediately:

| Email | Password | Role |
|---|---|---|
| admin@zorvyn.com | password123 | admin |
| analyst@zorvyn.com | password123 | analyst |
| viewer@zorvyn.com | password123 | viewer |

### 4. Run the server

```bash
npm run dev      # development (auto-restart on changes)
npm start        # production
```

### 5. Run tests

```bash
npm test
```

### 6. View API docs

Once the server is running, open: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)

---

## Roles and permissions

| Action | Viewer | Analyst | Admin |
|---|---|---|---|
| Login / register | ✅ | ✅ | ✅ |
| View dashboard summary | ✅ | ✅ | ✅ |
| View category breakdown | ✅ | ✅ | ✅ |
| View monthly trends | ✅ | ✅ | ✅ |
| Read transactions | ❌ | ✅ | ✅ |
| Create transactions | ❌ | ❌ | ✅ |
| Update transactions | ❌ | ❌ | ✅ |
| Delete transactions | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

New accounts always start as `viewer`. Admins promote users via `PATCH /api/users/:id/role`.

---

## API endpoints

### Auth
```
POST   /api/auth/register    Register (anyone)
POST   /api/auth/login       Login (rate limited: 10 attempts / 15 min)
GET    /api/auth/me          Get your profile (authenticated)
```

### Users (admin only)
```
GET    /api/users            List all users
GET    /api/users/:id        Get user by ID
PATCH  /api/users/:id/role   Change a user's role
PATCH  /api/users/:id/status Activate or deactivate a user
```

### Transactions (analyst/admin to read, admin to write)
```
GET    /api/transactions            List with filters + pagination
GET    /api/transactions/:id        Get one
POST   /api/transactions            Create (admin)
PATCH  /api/transactions/:id        Update (admin)
DELETE /api/transactions/:id        Soft delete (admin)
```

**Filter params for GET /api/transactions:**
- `type` — `income` or `expense`
- `category` — e.g. `marketing`, `salary`
- `startDate`, `endDate` — ISO format (`2024-01-01`)
- `page`, `limit` — pagination (default: page 1, limit 10)

### Dashboard (all authenticated users)
```
GET    /api/dashboard/summary     Total income, expenses, net balance
GET    /api/dashboard/categories  Spending by category
GET    /api/dashboard/trends      Monthly income vs expense (?months=6)
GET    /api/dashboard/recent      Last 10 transactions (activity feed)
```

---

## Key design decisions

### Why soft delete instead of hard delete?
Financial records should never be permanently deleted. If someone accidentally removes a transaction, it can be recovered. It also keeps the audit trail intact — you can always see what happened even for "removed" entries. The `isDeleted` flag and `deletedAt` timestamp let us filter them from normal queries while keeping the data safe.

### Why RBAC in middleware and not in controllers?
If access control logic lives inside controllers, it's easy to forget to add it to a new endpoint. By putting it in middleware (`requireRole("admin")`), the protection is declared right in the route definition — impossible to miss, easy to audit.

### Why fetch fresh user data on every authenticated request?
JWT tokens are valid until they expire. If an admin deactivates a user, their token would still work until expiry. We do a DB lookup in `requireAuth` to catch this — a small performance cost that's worth the security gain.

### Why MongoDB aggregation pipelines for the dashboard?
Fetching all transactions to JavaScript and summing them there doesn't scale. If there are 100,000 transactions, that's a lot of unnecessary data transfer and memory use. MongoDB handles the math on the server side and returns just the numbers we need.

---

## Assumptions made

1. Run `npm run seed` to populate demo users and transactions. In production, first admin would be bootstrapped during deployment setup.
2. Categories are fixed at the schema level. In a real system these would probably be configurable per company.
3. Soft-deleted transactions are excluded from all queries by default. Recovering them would require an admin-only endpoint (not built, but easy to add).
4. No email verification — out of scope for this assessment.

---

## Project structure

```
src/
├── config/
│   └── database.js          # MongoDB connection
├── models/
│   ├── User.js              # User schema with roles + password hashing
│   └── Transaction.js       # Transaction schema with soft delete
├── middleware/
│   ├── auth.js              # JWT verification
│   ├── roleGuard.js         # RBAC enforcement
│   ├── validate.js          # Input validation rules
│   └── rateLimiter.js       # Brute force protection
├── services/
│   ├── authService.js       # Register and login logic
│   ├── userService.js       # User management
│   ├── transactionService.js # CRUD + filters
│   └── dashboardService.js  # Aggregation pipelines
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
└── app.js                   # Express setup and entry point

tests/
├── testSetup.js             # Test DB helpers
├── auth.test.js             # Auth endpoint tests
├── transactions.test.js     # RBAC + transaction tests
└── dashboard.test.js        # Aggregation + dashboard tests

swagger.yaml                 # API documentation
.env.example                 # Environment variable template
```
