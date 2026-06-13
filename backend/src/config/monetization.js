// Single source of truth for all pricing / limits. Change values here only.
module.exports = {
  // Pro subscription plans. `id` is what the client sends; both unlock full Pro.
  PRO_PLANS: [
    { id: 'weekly', label: 'Weekly', priceInr: 99, periodDays: 7 },
    { id: 'monthly', label: 'Monthly', priceInr: 299, periodDays: 30, popular: true }
  ],

  // Legacy single-plan constants (kept for any old references; = monthly).
  PRO_PRICE_INR: 299,
  PRO_PERIOD_DAYS: 30,

  // Cross-profession discovery (the USP funnel)
  FREE_WEEKLY_PROFESSION_UNLOCKS: 2, // free users may open 2 other-profession decks per week

  // Credits wallet — 1 credit = ₹1. A spot-reveal costs 10 credits (≈ ₹10).
  CREDIT_VALUE_INR: 1,
  REVEAL_COST_CREDITS: 10,

  // Purchasable credit packs (priced for India; bonus credits scale with size)
  CREDIT_PACKS: [
    { id: 'pack_50', priceInr: 50, credits: 50 },
    { id: 'pack_100', priceInr: 100, credits: 110 },
    { id: 'pack_200', priceInr: 200, credits: 240 }
  ]
};
