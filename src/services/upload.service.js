import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';

const isCloudinaryConfigured =
  Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) &&
  !env.CLOUDINARY_API_KEY.includes('your_api_key') &&
  !env.CLOUDINARY_CLOUD_NAME.includes('your_cloud_name');

// Configure Cloudinary credentials if present
if (isCloudinaryConfigured) {
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

    if (isCloudinaryConfigured) {
      try {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: `artisan/${folder}`,
              resource_type: resourceType,
            },
            (error, res) => {
              if (error) return reject(error);
              resolve(res);
            }
          );
          stream.end(buffer);
        });

        return {
          url: result.secure_url,
          publicId: result.public_id,
          bytes: result.bytes,
          format: result.format,
        };
      } catch (error) {
        console.warn(`⚠️ Cloudinary upload returned error (${error.message}). Falling back to simulated storage in development mode.`);
        if (env.NODE_ENV === 'production') {
          throw ApiError.internal(`Cloudinary upload failed: ${error.message}`);
        }
      }
    }

    // Development / Testnet simulation fallback
    const mockHash = Date.now().toString(36);
    const svgPlaceholder = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%230f172a"/><circle cx="200" cy="130" r="45" fill="%2310b981" opacity="0.2"/><path d="M185 130l10 10 20-20" stroke="%2310b981" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><text x="50%" y="210" dominant-baseline="middle" text-anchor="middle" fill="%23f8fafc" font-family="sans-serif" font-size="14" font-weight="bold">Artifix Verified Photo</text><text x="50%" y="235" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-family="sans-serif" font-size="11">Attachment #${mockHash}</text></svg>`;
    return {
      url: svgPlaceholder,
      publicId: `artisan/${folder}/simulated_${mockHash}`,
      bytes: buffer.length,
      format: 'svg',
      isSimulated: true,
    };
  }
}

export default UploadService;
