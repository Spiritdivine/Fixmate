import { Router } from 'express';
import multer from 'multer';
import { UploadService } from '../services/upload.service.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { ApiResponse } from '../utils/api-response.js';
import { ApiError } from '../utils/api-error.js';

const router = Router();

// Configure Multer with memory storage and 10MB file limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
      'video/mp4',
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}. Allowed: images, PDFs, MP4 videos.`));
    }
  },
});

// Single file upload
router.post('/single', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) throw ApiError.badRequest('File is required in "file" form field');
    const folder = req.body.folder || 'general';
    const result = await UploadService.uploadBuffer(req.file.buffer, folder);
    res.status(201).json(new ApiResponse(201, result, 'File uploaded successfully'));
  } catch (error) {
    next(error);
  }
});

// Multiple files upload (up to 5 files for proof/evidence)
router.post('/multiple', authenticate, upload.array('files', 5), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw ApiError.badRequest('Files are required in "files" form field');
    }
    const folder = req.body.folder || 'evidence';
    const uploadPromises = req.files.map((file) => UploadService.uploadBuffer(file.buffer, folder));
    const results = await Promise.all(uploadPromises);

    res.status(201).json(new ApiResponse(201, results, 'Files uploaded successfully'));
  } catch (error) {
    next(error);
  }
});

export default router;
