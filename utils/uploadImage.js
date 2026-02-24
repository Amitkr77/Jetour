const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const createUploader = (folderName) => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `jetour/${folderName}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 800, height: 800, crop: 'limit' }]
    }
  });

  const fileFilter = (req, file, cb) => {
    // 🔹 Accept only image files
    if (!file.mimetype.startsWith('image/')) {
      return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname), false);
    }
    cb(null, true);
  };

  return multer({
    storage,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5 MB
    },
    fileFilter
  });
};

module.exports = createUploader;