const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: {
    type: String, required: true, unique: true,
    validate: { validator: v => /^\d{8}$/.test(v), message: 'Phone must be 8 digits' }
  },
  email: { type: String, trim: true, lowercase: true, sparse: true, default: null },
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String, default: null },
  emailVerificationExpires: { type: Date, default: null },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  balance: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true },
  // Promo / referral system
  promoCode: { type: String, unique: true, sparse: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  referralCount: { type: Number, default: 0 },
  // Device fingerprinting
  fingerprint: { type: String },
  userAgent: { type: String },
  lastIP: { type: String },
  lastLoginAt: { type: Date, default: null },
  isBanned: { type: Boolean, default: false },
  banReason: { type: String, default: null },
  bannedAt: { type: Date, default: null },

  // Admin notes
  adminNote: { type: String, default: '' },
  // Notifications
  emailNotifications: {
    newTicket: { type: Boolean, default: true },
    depositUpdates: { type: Boolean, default: true },
    promotions: { type: Boolean, default: true }
  }
}, { timestamps: true });

// Auto-generate promoCode before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') && this.promoCode) return next();

  // Hash password if changed
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }

  // Generate promoCode if new user
  if (!this.promoCode) {
    const suffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    this.promoCode = `WAR9A${suffix}`;
  }

  next();
});

userSchema.methods.comparePassword = function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
