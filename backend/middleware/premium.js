// middleware/premium.js
// Usage:  router.use(protect, requirePremium("premium1"))
//         router.use(protect, requirePremium("premium2"))
//
// premium2 teachers can also access premium1 routes (super-set).
// In development (NODE_ENV=development) the check is bypassed so you can
// test video/live features without completing a payment first.

const requirePremium = (minPlan) => (req, res, next) => {
  const user = req.user;

  if (!user) {
    res.status(401);
    return next(new Error("Not authorized"));
  }

  if (user.role !== "teacher") {
    res.status(403);
    return next(new Error("Only teachers can access premium features"));
  }

  
  if (process.env.NODE_ENV === "development") return next();

  const hasValidPlan = user.premiumActive && user.premiumExpiry && user.premiumExpiry > new Date();
  if (!hasValidPlan) {
    res.status(403);
    return next(new Error("Premium plan required. Please subscribe to continue."));
  }

  const planRank = { premium1: 1, premium2: 2 };
  const required = planRank[minPlan] || 1;
  const current  = planRank[user.premiumPlan] || 0;

  if (current < required) {
    res.status(403);
    return next(new Error(`This feature requires ${minPlan === "premium2" ? "Premium 2" : "Premium 1"} plan.`));
  }

  next();
};

module.exports = { requirePremium };
