//src/schemas/productSchema.ts
import { z } from 'zod';

export const productSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string(),
    brand: z.string(),
    sku: z.string(),
    category: z.string(),
    price: z.number(),
    currency: z.string(),
    stock: z.number(),
    description: z.string(),
    features: z.string(),
    rating: z.number(),
    reviewsCount: z.number(),
    tags: z.array(z.string()),
    imageUrl: z.string().url(),
    manufacturer: z.string(),
    model: z.string(),
    releaseDate: z.string(), 
    warranty: z.string(),
    dimensions: z.object({
        weight: z.string(),
        width: z.string(),
        height: z.string(),
        depth: z.string(),
    }).optional(),
    color: z.string(),
    material: z.string(),
    origin: z.string(),
    descriptionVector: z.array(z.number()).optional(),
    imageVector: z.array(z.number()).optional(),
    tagsVector: z.array(z.number()).optional(),
    featuresVector: z.array(z.number()).optional(),
    dimensionsVector: z.array(z.number()).optional(),
});

export const productIDSchema = z.object({
    id: z.string().uuid(),
});

export const tagsSchema = z.object({
    tags: z.array(z.string()),
});

export const featuresSchema = z.object({
    tags: z.array(z.string()),
});




export type Product = z.infer<typeof productSchema>;
export type ProductID = z.infer<typeof productIDSchema>;
export type Tags = z.infer<typeof tagsSchema>;
