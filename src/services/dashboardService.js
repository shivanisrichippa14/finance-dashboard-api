const { Transaction } = require("../models/Transaction");

// Returns the high-level financial summary:
// total income, total expenses, and net balance.
//
// Why aggregation pipeline instead of fetching all documents and summing in JS?
// Because if there are 50,000 transactions, fetching them all to JS memory is slow and wasteful.
// MongoDB does the math on the server side and returns just the numbers we need.
const getFinancialSummary = async () => {
  const result = await Transaction.aggregate([
    // Step 1: Only look at non-deleted transactions
    { $match: { isDeleted: false } },

    // Step 2: Group by type (income/expense) and sum the amounts
    {
      $group: {
        _id: "$type",
        total: { $sum: "$amount" },
      },
    },
  ]);

  // Turn the array result into an easy-to-use object
  const summary = { totalIncome: 0, totalExpenses: 0, netBalance: 0 };

  result.forEach((item) => {
    if (item._id === "income") summary.totalIncome = item.total;
    if (item._id === "expense") summary.totalExpenses = item.total;
  });

  summary.netBalance = summary.totalIncome - summary.totalExpenses;

  return summary;
};

// Returns total spending per category.
// Real-world use: CFO wants to know "which category is eating our budget?"
const getCategoryBreakdown = async () => {
  const result = await Transaction.aggregate([
    { $match: { isDeleted: false } },

    {
      $group: {
        _id: { type: "$type", category: "$category" },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },

    { $sort: { total: -1 } },
  ]);

  return result.map((item) => ({
    category: item._id.category,
    type: item._id.type,
    total: item.total,
    transactionCount: item.count,
  }));
};

// Returns monthly income vs expense totals for the last N months.
// This is what powers the trend chart on the dashboard.
const getMonthlyTrends = async (monthsBack = 6) => {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - monthsBack);
  startDate.setDate(1); // start from the 1st of that month
  startDate.setHours(0, 0, 0, 0);

  const result = await Transaction.aggregate([
    {
      $match: {
        isDeleted: false,
        date: { $gte: startDate },
      },
    },

    // Group by year + month + type
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
          type: "$type",
        },
        total: { $sum: "$amount" },
      },
    },

    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  // Restructure into a cleaner format: [{month: "Jan 2024", income: X, expense: Y}]
  const monthlyMap = {};

  result.forEach((item) => {
    const key = `${item._id.year}-${String(item._id.month).padStart(2, "0")}`;

    if (!monthlyMap[key]) {
      monthlyMap[key] = { month: key, income: 0, expense: 0 };
    }

    if (item._id.type === "income") monthlyMap[key].income = item.total;
    if (item._id.type === "expense") monthlyMap[key].expense = item.total;
  });

  return Object.values(monthlyMap);
};

// Returns the 10 most recent transactions for a "recent activity" feed
const getRecentActivity = async (limit = 10) => {
  const transactions = await Transaction.find({ isDeleted: false })
    .populate("createdBy", "name")
    .sort({ createdAt: -1 })
    .limit(limit);

  return transactions;
};

module.exports = {
  getFinancialSummary,
  getCategoryBreakdown,
  getMonthlyTrends,
  getRecentActivity,
};
