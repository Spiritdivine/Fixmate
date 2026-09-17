import { z } from 'zod';

export const updateArtisanProfileSchema = z.object({
  body: z.object({
    businessName: z.string().optional(),
    tagline: z.string().optional(),
    bio: z.string().optional(),
    yearsOfExperience: z.number().int().nonnegative().optional(),
    hourlyRate: z.number().positive().optional(),
    state: z.string().optional(),
    lgaCity: z.string().optional(),
    address: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    isAvailable: z.boolean().optional(),
    skillIds: z.array(z.number().int()).optional(),
  }),
});

export const updateClientProfileSchema = z.object({
  body: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    companyName: z.string().optional(),
    state: z.string().optional(),
    city: z.string().optional(),
    address: z.string().optional(),
  }),
});

export const portfolioItemSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    mediaUrls: z.array(z.string().url()).min(1, 'At least one media URL is required'),
    completionDate: z.string().optional(),
  }),
});

export const updatePortfolioItemSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    mediaUrls: z.array(z.string().url()).optional(),
    completionDate: z.string().optional(),
  }),
  params: z.object({
    id: z.string().uuid('Valid portfolio UUID required'),
  }),
});

export const portfolioParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid portfolio UUID required'),
  }),
});

export const createArtisanServiceSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Service title is required'),
    description: z.string().min(10, 'Service description must be at least 10 characters'),
    price: z.number().positive('Price must be greater than 0'),
    deliveryDays: z.number().int().positive().default(1),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateArtisanServiceSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    description: z.string().min(10).optional(),
    price: z.number().positive().optional(),
    deliveryDays: z.number().int().positive().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().uuid('Valid service UUID required'),
  }),
});

export const serviceParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid service UUID required'),
  }),
});

export const kycSubmissionSchema = z.object({
  body: z.object({
    documentType: z.enum(['NIN', 'BVN', 'DRIVERS_LICENSE', 'VOTERS_CARD', 'INTERNATIONAL_PASSPORT']),
    documentNumber: z.string().min(4, 'Document number is required'),
    documentFrontUrl: z.string().url('Front document URL required'),
    documentBackUrl: z.string().url().optional(),
    selfieUrl: z.string().url('Selfie image URL required'),
  }),
});

export const kycReviewSchema = z.object({
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
    rejectionReason: z.string().optional(),
  }),
  params: z.object({
    id: z.string().uuid('Valid KYC submission UUID required'),
  }),
});

export const updateWalletAddressSchema = z.object({
  body: z.object({
    walletAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid EVM address (e.g. 0x...)')
      .or(z.literal(''))
      .nullable(),
  }),
});

export const updateAvailabilitySchema = z.object({
  body: z.object({
    isAvailable: z.boolean(),
  }),
});

export const updateLocationSchema = z.object({
  body: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().optional(),
    state: z.string().optional(),
    lgaCity: z.string().optional(),
  }),
});

export const artisanParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid artisan UUID required'),
  }),
});

export const nearbyArtisansQuerySchema = z.object({
  query: z
    .object({
      lat: z.coerce
        .number({ invalid_type_error: 'Latitude must be a valid number' })
        .min(-90, 'Latitude must be between -90 and 90')
        .max(90, 'Latitude must be between -90 and 90')
        .optional(),
      lng: z.coerce
        .number({ invalid_type_error: 'Longitude must be a valid number' })
        .min(-180, 'Longitude must be between -180 and 180')
        .max(180, 'Longitude must be between -180 and 180')
        .optional(),
      radius: z.coerce
        .number({ invalid_type_error: 'Radius must be a number' })
        .positive('Radius must be greater than zero')
        .max(100, 'Search radius cannot exceed 100km')
        .default(15),
      minLat: z.coerce.number().min(-90).max(90).optional(),
      maxLat: z.coerce.number().min(-90).max(90).optional(),
      minLng: z.coerce.number().min(-180).max(180).optional(),
      maxLng: z.coerce.number().min(-180).max(180).optional(),
      categoryId: z.coerce.number().int().positive().optional(),
      skillId: z.coerce.number().int().positive().optional(),
      minRating: z.coerce.number().min(0).max(5).optional(),
      search: z.string().trim().max(100).optional(),
      isAvailable: z
        .preprocess((val) => {
          if (typeof val === 'string') return val.toLowerCase() === 'true';
          if (typeof val === 'boolean') return val;
          return true;
        }, z.boolean())
        .default(true),
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(50, 'Max 50 items per page').default(20),
    })
    .superRefine((data, ctx) => {
      const hasCenter = data.lat !== undefined && data.lng !== undefined;
      const hasBBox =
        data.minLat !== undefined &&
        data.maxLat !== undefined &&
        data.minLng !== undefined &&
        data.maxLng !== undefined;

      if (!hasCenter && !hasBBox) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Either center coordinates (lat, lng) or viewport bounding box (minLat, maxLat, minLng, maxLng) are required',
          path: ['lat'],
        });
      }

      if (hasBBox) {
        if (data.minLat > data.maxLat) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'minLat cannot be greater than maxLat',
            path: ['minLat'],
          });
        }
        if (data.minLng > data.maxLng) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'minLng cannot be greater than maxLng',
            path: ['minLng'],
          });
        }
      }
    }),
});

