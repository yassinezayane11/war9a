const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  team1: { type: String, required: true },
  team2: { type: String, required: true },
  betType: { type: String, required: true },
  odds: { type: Number, required: true, min: 1 },
  matchDate: { type: Date, required: true },
  league: { type: String, default: '' }
});

const ticketSchema = new mongoose.Schema({
  title: { type: String, required: true },
  matches: [matchSchema],
  globalOdds: { type: Number, required: true },
  price: { type: Number, required: true, min: 0 },
  description: { type: String, default: '' },
  successProbability: { type: Number, min: 0, max: 100 },
  showOdds: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  isExpired: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  archivedAt: { type: Date, default: null },
  expirationDate: { type: Date, required: true },
  firstMatchDate: { type: Date, required: true },
  purchaseCount: { type: Number, default: 0 },
  category: { type: String, default: 'Football' },
  eventDate: { type: Date },
  // Winning ticket showcase
  isWinning: { type: Boolean, default: false },
  winningAmount: { type: Number, default: 0 },
  wonAt: { type: Date, default: null },
  // Ticket image
  image: { type: String, default: null }
}, { timestamps: true });

// Index for expiration queries
ticketSchema.index({ isExpired: 1, isArchived: 1 });
ticketSchema.index({ isWinning: 1, wonAt: -1 });

module.exports = mongoose.model('Ticket', ticketSchema);
