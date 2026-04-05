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
