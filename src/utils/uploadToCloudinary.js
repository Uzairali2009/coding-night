import streamifier from 'streamifier';
import cloudinary from '../config/cloudinary.js';

// Multer ka buffer -> stream -> Cloudinary
export const uploadBuffer = (buffer, folder = 'avatars') =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'image' }, (err, result) =>
      err ? reject(err) : resolve(result)
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });

export const deleteImage = (publicId) => cloudinary.uploader.destroy(publicId);
