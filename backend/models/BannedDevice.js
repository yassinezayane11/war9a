const mongoose = require('mongoose');

const bannedDeviceSchema = new mongoose.Schema({
  fingerprint: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  userName: { type: String, default: '' },
  userPhone: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  ip: { type: String, default: '' },
  reason: { type: String, default: 'Violation des conditions d\'utilisation' },
  bannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bannedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

bannedDeviceSchema.index({ fingerprint: 1 });
bannedDeviceSchema.index({ isActive: 1, bannedAt: -1 });

module.exports = mongoose.model('BannedDevice', bannedDeviceSchema);
