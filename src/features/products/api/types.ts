// ============================================================
// Product Types — Backend-Aligned
// ============================================================
// These types mirror the NestJS entities from the backend.
// Use these in components, NEVER import from mock-api directly.
//
// Backend Entity Mapping:
//   Product (backend) → ProductEntity (frontend)
//   Price (backend) → PriceEntity (frontend)
//   Category (backend) → CategoryEntity (frontend)
//   Distributor (backend) → DistributorEntity (frontend)
// ============================================================

// =========================================
// Backend Entity Types
// =========================================

export interface CategoryEntity {
  CategoryID: number;
  Name: string;
  deletedAt?: Date;
}

export interface DistributorEntity {
  DistributorID: number;
  Name: string;
  Country: string;
  Address: string;
  ContactPhone: string;
  createdAt: Date;
  deletedAt?: Date;
}

export interface PriceEntity {
  PriceID: number;
  Cost: number;
  SellingPrice: number;
  Currency: string;
  createdAt: Date;
  deletedAt?: Date;
  product?: import('./service').ProductEntity;
}

export interface ProductImageEntity {
  ProductImageID: number;
  originalPath: string;
  whatsappPath: string;
  webPath: string;
  thumbPath: string;
  productId?: number;
  productLinkId?: number;
  jobId?: number;
  originalSize?: number;
  createdAt: Date;
}

export interface ProductVariantEntity {
  ProductVariantID: number;
  variantName: string;
  deletedAt?: Date;
}

export interface ProductEntity {
  ProductID: number;
  Name: string;
  NickName: string;
  Description: string;
  Template: string;
  Image: string;
  createdAt: Date;
  deletedAt?: Date;

  // Relations
  distributor?: DistributorEntity;
  categories?: CategoryEntity[];
  productPrices?: PriceEntity[];
  productImages?: ProductImageEntity[];
  productVariants?: ProductVariantEntity[];
}

// =========================================
// API Request/Response Types
// =========================================

export type ProductFilters = {
  page?: number;
  limit?: number;
  categories?: string;
  search?: string;
  sort?: string;
};

export type ProductsResponse = {
  success: boolean;
  time: string;
  message: string;
  total_products: number;
  offset: number;
  limit: number;
  products: ProductEntity[];
};

export type ProductByIdResponse = {
  success: boolean;
  time: string;
  message: string;
  product: ProductEntity;
};

// =========================================
// Form/Mutation Payloads (Frontend → Backend)
// =========================================

export type ProductMutationPayload = {
  name: string;
  nickname?: string;
  description: string;
  template?: string;
  image?: string;
  distributorId: number;
  categoryIds?: number[];
  cost?: number;
  sellingPrice?: number;
  currency?: string;
};

export type ProductUpdatePayload = Partial<ProductMutationPayload>;
