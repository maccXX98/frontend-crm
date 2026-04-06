import * as z from 'zod';

const MAX_FILE_SIZE = 5_000_000;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// ============================================================
// Product Form Schema — Backend-Aligned
// ============================================================
// Mirrors CreateProductDto from NestJS backend:
//   Name (required), NickName, Description, Template, Image
//   DistributorID (required), CategoryID[] (optional)
//   Price fields (Cost, SellingPrice, Currency)
// ============================================================

export const productSchema = z.object({
  // Image upload — optional for updates
  image: z
    .any()
    .refine((files) => !files || files?.length === 1, 'Max 1 image allowed.')
    .refine((files) => !files || files?.[0]?.size <= MAX_FILE_SIZE, 'Max file size is 5MB.')
    .refine(
      (files) => !files || ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      '.jpg, .jpeg, .png and .webp files are accepted.'
    )
    .optional(),

  // Product name
  name: z.string().min(2, 'Product name must be at least 2 characters.'),

  // Optional nickname
  nickname: z.string().optional(),

  // Product description
  description: z.string().min(10, 'Description must be at least 10 characters.'),

  // Template field (optional)
  template: z.string().optional(),

  // Distributor selection (required in backend)
  distributorId: z.number({ message: 'Distributor is required' }),

  // Categories (optional array)
  categoryIds: z.array(z.number()).optional(),

  // Price information
  cost: z.number().optional(),
  sellingPrice: z.number().optional(),
  currency: z.string().optional(),
});

export type ProductFormValues = {
  image?: File[] | undefined;
  name: string;
  nickname?: string;
  description: string;
  template?: string;
  distributorId: number;
  categoryIds?: number[];
  cost?: number;
  sellingPrice?: number;
  currency?: string;
};
