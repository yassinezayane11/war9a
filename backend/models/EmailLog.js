const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  // Recipient
  to: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  // Email details
  subject: { type: String, required: true },
  type: {
    type: String,
    enum: ['verification', 'welcome', 'deposit_pending', 'deposit_approved', 'deposit_rejected',
           'purchase_confirmation', 'ticket_available', 'password_reset', 'broadcast', 'admin_alert'],
    required: true
  },
  // Brevo message ID
  messageId: { type: String, default: null },
  // Delivery status
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed', 'bounced'],
    default: 'pending'
  },
  // Error message if failed
  error: { type: String, default: null },
  // Open tracking
  openedAt: { type: Date, default: null },
  // Click tracking
  clickedAt: { type: Date, default: null },
  // Campaign ID for broadcasts
  campaignId: { type: String, default: null }
}, { timestamps: true });

emailLogSchema.index({ userId: 1, createdAt: -1 });
emailLogSchema.index({ status: 1, type: 1 });
emailLogSchema.index({ campaignId: 1 });

module.exports = mongoose.model('EmailLog', emailLogSchema);
