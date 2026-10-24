import multer from 'multer';
import AppError from '../utils/AppError.js';

export default multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) =>
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new AppError('Sirf image upload karein', 400)),
});
