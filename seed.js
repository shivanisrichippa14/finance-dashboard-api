// Run this to get a working demo instantly:
//   node seed.js
//
// It creates three users (one per role) and 20 sample transactions
// so you can test the dashboard and filters without manually adding data.

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { User } = require("./src/models/User");
const { Transaction } = require("./src/models/Transaction");

// --- Demo users ---
// Passwords are all "password123" for easy testing
const demoUsers = [
  {
    name: "Admin User",
    email: "admin@zorvyn.com",
    password: "password123",
    role: "admin",
  },
  {
    name: "Finance Analyst",
    email: "analyst@zorvyn.com",
    password: "password123",
    role: "analyst",
  },
  {
    name: "Investor Viewer",
    email: "viewer@zorvyn.com",
    password: "password123",
    role: "viewer",
  },
];

// --- Demo transactions spread over the last 6 months ---
// Mix of income and expenses across different categories
const buildDemoTransactions = (adminId) => [
  // Income
  { amount: 85000, type: "income", category: "revenue", description: "Q2 SaaS subscriptions", date: new Date("2025-10-01"), createdBy: adminId },
  { amount: 12000, type: "income", category: "investment", description: "Angel round tranche 2", date: new Date("2025-10-15"), createdBy: adminId },
  { amount: 91000, type: "income", category: "revenue", description: "Q3 SaaS subscriptions", date: new Date("2026-01-01"), createdBy: adminId },
  { amount: 5500,  type: "income", category: "refund",   description: "AWS credit refund", date: new Date("2026-01-20"), createdBy: adminId },
  { amount: 9800,  type: "income", category: "revenue",  description: "Enterprise client onboarding fee", date: new Date("2026-02-10"), createdBy: adminId },
  { amount: 78000, type: "income", category: "revenue",  description: "Q4 SaaS subscriptions", date: new Date("2026-03-01"), createdBy: adminId },

  // Expenses
  { amount: 32000, type: "expense", category: "salary",         description: "Engineering team — October", date: new Date("2025-10-31"), createdBy: adminId },
  { amount: 4200,  type: "expense", category: "infrastructure", description: "AWS monthly bill", date: new Date("2025-10-05"), createdBy: adminId },
  { amount: 8500,  type: "expense", category: "marketing",      description: "Google Ads — Q2 campaign", date: new Date("2025-11-12"), createdBy: adminId },
  { amount: 32000, type: "expense", category: "salary",         description: "Engineering team — November", date: new Date("2025-11-30"), createdBy: adminId },
  { amount: 1200,  type: "expense", category: "operations",     description: "Office supplies and tools", date: new Date("2025-11-08"), createdBy: adminId },
  { amount: 3600,  type: "expense", category: "infrastructure", description: "AWS monthly bill", date: new Date("2025-12-05"), createdBy: adminId },
  { amount: 14000, type: "expense", category: "marketing",      description: "LinkedIn ads + influencer", date: new Date("2025-12-20"), createdBy: adminId },
  { amount: 32000, type: "expense", category: "salary",         description: "Engineering team — December", date: new Date("2025-12-31"), createdBy: adminId },
  { amount: 32000, type: "expense", category: "salary",         description: "Engineering team — January", date: new Date("2026-01-31"), createdBy: adminId },
  { amount: 4100,  type: "expense", category: "infrastructure", description: "AWS monthly bill", date: new Date("2026-01-05"), createdBy: adminId },
  { amount: 6000,  type: "expense", category: "tax",            description: "Quarterly advance tax", date: new Date("2026-02-15"), createdBy: adminId },
  { amount: 32000, type: "expense", category: "salary",         description: "Engineering team — February", date: new Date("2026-02-28"), createdBy: adminId },
  { amount: 2200,  type: "expense", category: "operations",     description: "Legal and compliance fees", date: new Date("2026-03-03"), createdBy: adminId },
  { amount: 32000, type: "expense", category: "salary",         description: "Engineering team — March", date: new Date("2026-03-31"), createdBy: adminId },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Wipe existing seed data so this script is safe to run multiple times
    await User.deleteMany({ email: { $in: demoUsers.map((u) => u.email) } });
    console.log("Cleared existing demo users");

    // Create users — the model's pre-save hook will hash passwords automatically
    const createdUsers = await User.insertMany(
      await Promise.all(
        demoUsers.map(async (u) => ({
          ...u,
          password: await bcrypt.hash(u.password, 12),
        }))
      )
    );

    const admin = createdUsers.find((u) => u.role === "admin");
    console.log(`Created ${createdUsers.length} demo users`);

    // Clear old seeded transactions (identified by createdBy = admin)
    await Transaction.deleteMany({ createdBy: admin._id });

    const transactions = buildDemoTransactions(admin._id);
    await Transaction.insertMany(transactions);
    console.log(`Created ${transactions.length} demo transactions`);

    console.log("\n--- Login credentials ---");
    console.log("Admin:    admin@zorvyn.com    / password123");
    console.log("Analyst:  analyst@zorvyn.com  / password123");
    console.log("Viewer:   viewer@zorvyn.com   / password123");
    console.log("\nDone! Start the server and hit /api-docs to explore.");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
};

seed();