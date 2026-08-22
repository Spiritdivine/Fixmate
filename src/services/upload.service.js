import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';

// Configure Cloudinary credentials if present
if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export class UploadService {
  /**
   * Uploads an in-memory buffer directly to Cloudinary or returns a simulated CDN URL
   * @param {Buffer} buffer - File buffer from multer
   * @param {string} folder - Folder name in Cloudinary (e.g. 'artisan_proofs', 'avatars', 'kyc')
   * @param {string} resourceType - 'image' | 'video' | 'raw' | 'auto'
   */
  static async uploadBuffer(buffer, folder = 'artisan_uploads', resourceType = 'auto') {
    if (!buffer) {
      throw ApiError.badRequest('No file buffer provided for upload');
    }

    if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: `artisan/${folder}`,
            resource_type: resourceType,
          },
          (error, result) => {
            if (error) return reject(ApiError.internal(`Cloudinary upload failed: ${error.message}`));
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              bytes: result.bytes,
              format: result.format,
            });
          }
        );
        stream.end(buffer);
      });
    }

    // Development / Testnet simulation fallback
    const mockHash = Date.now().toString(36);
    return {
      url: `https://res.cloudinary.com/demo/image/upload/v1/artisan/${folder}/simulated_${mockHash}.jpg`,
      publicId: `artisan/${folder}/simulated_${mockHash}`,
      bytes: buffer.length,
      format: 'jpg',
      isSimulated: true,
    };
  }
}

export default UploadService;
