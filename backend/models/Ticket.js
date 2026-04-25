const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  team1: { type: String, required: true },
  team2: { type: String, required: true },
  betType: { type: String, required: true },
  odds: { type: Number, required: true, min: 1 }
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
  purchaseCount: { type: Number, default: 0 },
  category: { type: String, default: 'Football' },
  eventDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);
