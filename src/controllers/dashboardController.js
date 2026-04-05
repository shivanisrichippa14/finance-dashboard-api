const {
  getFinancialSummary,
  getCategoryBreakdown,
  getMonthlyTrends,
  getRecentActivity,
} = require("../services/dashboardService");
const { sendSuccess, sendError } = require("../utils/response");

// Returns total income, expenses, and net balance
const summary = async (req, res) => {
  try {
    const data = await getFinancialSummary();
    return sendSuccess(res, data, "Summary fetched.");
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// Returns spending grouped by category — for pie charts etc.
const categoryBreakdown = async (req, res) => {
  try {
    const data = await getCategoryBreakdown();
    return sendSuccess(res, { breakdown: data }, "Category breakdown fetched.");
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// Returns monthly income vs expense — for trend charts
// Optional ?months=3 query param (default: 6 months back)
const monthlyTrends = async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;

    // Cap at 24 months — anything more is rarely useful for a dashboard
    if (months > 24 || months < 1) {
      return sendError(res, "months param must be between 1 and 24.", 400);
    }

    const data = await getMonthlyTrends(months);
    return sendSuccess(res, { trends: data }, "Monthly trends fetched.");
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// Returns recent transactions for the activity feed
const recentActivity = async (req, res) => {
  try {
    const transactions = await getRecentActivity(10);
    return sendSuccess(
      res,
      { transactions },
      "Recent activity fetched."
    );
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

module.exports = { summary, categoryBreakdown, monthlyTrends, recentActivity };
