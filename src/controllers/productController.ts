// src/controllers/productController.ts
import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';
import { productSchema, Product, productIDSchema, featuresSchema, tagsSchema } from '../schemas/productSchema';
import { generateTextVector } from '../services/embeddingService';
import logger from '../utils/logger';


/**
 * 
 * @param req The request object.
 * @param res The response object to send back the fetched products.
 * @returns The list of products.
 */
export const getProducts = async (req: Request, res: Response) => {
    // Access productService from app.locals
    const { productService } = req.app.locals.services;

    try {
        const products = await productService.getProducts();
        return res.status(200).json({
            status: 'success',
            data: products,
        });
    } catch (error: any) {
        logger.error('Error getting products:', error.message);
        return res.status(500).json({
            status: 'error',
            message: 'Internal Server Error',
        });
    }
};
/**
 * 
 * @param req The request object containing product data. ie product id
 * @param res The response object to send back the fetched product.
 * @returns The product associated with the given id.
 */
export const getProductById = async (req: Request, res: Response) => {
    // Access productService from app.locals
    const { productService } = req.app.locals.services;
    const { id } = req.params;
    
    // use zod to validate the id
    const parseIDResult = productIDSchema.safeParse({ id });
    if (!parseIDResult.success) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid product ID, should be a valid UUID',
        });
    }

    try {
        const product = await productService.getProductById(parseIDResult.data.id);

        if (!product) {
            return res.status(404).json({
                status: 'error',
                message: 'Product not found',
            });
        }

        return res.status(200).json({
            status: 'success',
            data: product,
        });
    } catch (error: any) {
        logger.error('Error getting product:', error.message);
        return res.status(500).json({
            status: 'error',
            message: 'Internal Server Error',
        });
    }
};

/**
 * Creates a new product with vector embeddings.
 * @param req The request object containing product data.
 * @param res The response object to send back the created product.
 */
export const createProduct = async (req: Request, res: Response) => {
    const { productService } = req.app.locals.services;

    // zod validation for a new product
    const parseResult = productSchema.safeParse(req.body);
    if (!parseResult.success) {
        const errors = parseResult.error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
        }));

        return res.status(400).json({
            status: 'error',
            errors,
        });
    }

    const product: Product = parseResult.data;

    try {
        if (!product.id) {
            product.id = uuidv4();
        }

        // Generate description vector
        if (product.description) {
            product.descriptionVector = await generateTextVector(product.description);
        }

        // Generate tags vector
        if (product.tags && product.tags.length > 0) {
            const tagsText = product.tags.join(' ');
            product.tagsVector = await generateTextVector(tagsText);
        }

        // Generate features vector
        if (product.features) {
            product.featuresVector = await generateTextVector(product.features);
        }

        const createdProduct = await productService.addProduct(product);

        return res.status(201).json({
            status: 'success',
            data: createdProduct,
        });
    } catch (error: any) {
        logger.error('Error creating product:', error.message);
        return res.status(500).json({
            status: 'error',
            message: 'Internal Server Error',
        });
    }
};

/**
 * Searches for products based on a tags vector.
 * @param req The request object containing the query vector.
 * @param res The response object to send back the search results.
 */
export const searchProductsByTagsVector = async (req: Request, res: Response) => {
    const { productService } = req.app.locals.services;
    const { queryTags, top } = req.body;
    // zod validation
    const parsedTags = tagsSchema.safeParse({ tags: queryTags });
    if (!parsedTags.data) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid tags. It should be an array of strings ie "queryVector" : ["item","item2"].',
        });
    }

    const tagsText = parsedTags.data.tags.join(' ');  // Convert the tags array to a single string
    const tagsVector = await generateTextVector(tagsText); // Generate the tags vector

    const topResults = top && Number.isInteger(top) && top > 0 ? top : 10;  // Get the top results ie 10 results

    try {
        const results = await productService.searchProductsByTagsVector(tagsVector, topResults);
        return res.status(200).json({
            status: 'success',
            data: results,
        });
    } catch (error: any) {
        logger.error('Error searching products by tags:', error.message);
        return res.status(500).json({
            status: 'error',
            message: 'Internal Server Error',
        });
    }
};

/**
 * Searches for products based on a features vector.
 * @param req The request object containing the query vector.
 * @param res The response object to send back the search results.
 */
export const searchProductsByFeaturesVector = async (req: Request, res: Response) => {
    const { productService } = req.app.locals.services;
    const { queryFeatures, top } = req.body;
    // zod validation
    const parsedFeature = featuresSchema.safeParse({ tags: queryFeatures });
    if (!parsedFeature.success) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid features. It should be an array of strings ie "queryVector" : ["item","item2"].',
        });
    }

    const tagsText = parsedFeature.data.tags.join(' ');
    const featuresVector = await generateTextVector(tagsText);

    const topResults = top && Number.isInteger(top) && top > 0 ? top : 10;

    try {
        const results = await productService.searchProductsByFeaturesVector(featuresVector, topResults);
        return res.status(200).json({
            status: 'success',
            data: results,
        });
    } catch (error: any) {
        logger.error('Error searching products by features:', error.message);
        return res.status(500).json({
            status: 'error',
            message: 'Internal Server Error',
        });
    }
};

/**
 * Searches for products based on a description vector.
 * @param req The request object containing the query vector.
 * @param res The response object to send back the search results.
 */

export const searchProductsByDescriptionVector = async (req: Request, res: Response) => {
    const { productService } = req.app.locals.services;
    const { queryDescription, top } = req.body;

    const descriptionVector = await generateTextVector(queryDescription);

    const topResults = top && Number.isInteger(top) && top > 0 ? top : 10;

    try {
        const results = await productService.searchProductsByDescriptionVector(descriptionVector, topResults);
        return res.status(200).json({
            status: 'success',
            data: results,
        });
    } catch (error: any) {
        logger.error('Error searching products by description:', error.message);
        return res.status(500).json({
            status: 'error',
            message: 'Internal Server Error',
        });
    }
};

