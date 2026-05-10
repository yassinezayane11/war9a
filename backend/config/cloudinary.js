const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Storage for deposit screenshots
const depositStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'war9a/deposits',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit' }, { quality: 'auto' }],
    public_id: (req, file) => `deposit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  }
});

// Storage for marketing images
const marketingStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'war9a/marketing',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1920, height: 1080, crop: 'limit' }, { quality: 'auto' }],
    public_id: (req, file) => `marketing_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  }
});

// Storage for ticket images
const ticketStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'war9a/tickets',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }, { quality: 'auto' }],
    public_id: (req, file) => `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  }
});

// Delete image from Cloudinary
async function deleteImage(publicId) {
  try {
    if (!publicId) return { success: false, error: 'No public_id provided' };
    const result = await cloudinary.uploader.destroy(publicId);
    return { success: result.result === 'ok', result };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return { success: false, error: error.message };
  }
}

// Get optimized image URL
function getOptimizedUrl(url, options = {}) {
  if (!url) return null;
  if (!url.includes('cloudinary.com')) return url;

  const { width = 800, height = null, quality = 'auto' } = options;

  // Insert transformation parameters
  const transformations = [`q_${quality}`];
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (width || height) transformations.push('c_limit');

  // Replace /upload/ with /upload/transformations/
  return url.replace('/upload/', `/upload/${transformations.join(',')}/`);
}

module.exports = {
  cloudinary,
  depositStorage,
  marketingStorage,
  ticketStorage,
  deleteImage,
  getOptimizedUrl
};
