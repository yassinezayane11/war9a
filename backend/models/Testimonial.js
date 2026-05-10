const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  avatar: { type: String, default: null },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  text: { type: String, required: true },
  // Associated user (if registered user)
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  // Winning amount shown
  winningAmount: { type: Number, default: 0 },
  // Is verified (real user)
  isVerified: { type: Boolean, default: false },
  // Display on landing page
  isActive: { type: Boolean, default: true },
  // Display order
  order: { type: Number, default: 0 },
  // Admin who added this
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

testimonialSchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model('Testimonial', testimonialSchema);
