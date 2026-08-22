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
      .regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid EVM address (e.g. 0x...)'),
  }),
});

export const updateAvailabilitySchema = z.object({
  body: z.object({
    isAvailable: z.boolean(),
  }),
});

export const updateLocationSchema = z.object({
  body: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
});

export const artisanParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid artisan UUID required'),
  }),
});
