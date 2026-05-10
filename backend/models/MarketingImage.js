const mongoose = require('mongoose');

const marketingImageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  // Cloudinary image URL
  imageUrl: { type: String, required: true },
  // Cloudinary public_id for deletion
  publicId: { type: String, required: true },
  // Display order
  order: { type: Number, default: 0 },
  // Is active on landing page
  isActive: { type: Boolean, default: true },
  // Link when clicked (optional)
  link: { type: String, default: null },
  // Display duration in seconds (for carousel)
  duration: { type: Number, default: 5 },
  // Uploaded by
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

marketingImageSchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model('MarketingImage', marketingImageSchema);
