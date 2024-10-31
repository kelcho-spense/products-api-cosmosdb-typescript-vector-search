//src/routes/productsRoutes.ts
import express, { Request, Response } from "express";
import {
    createProduct,
    getProductById,
    getProducts,
    searchProductsByDescriptionVector,
    searchProductsByFeaturesVector,
    searchProductsByTagsVector
} from "../controllers/productController";

const productRouter = express.Router();


// Create a new product
productRouter.post('/products', (req: Request, res: Response) => {
    createProduct(req, res);
});

// Get all products
productRouter.get('/products', (req: Request, res: Response) => {
    getProducts(req, res);
});

// Get a product by ID
productRouter.get('/products/:id', (req: Request, res: Response) => {
    getProductById(req, res);
});

// VECTOR SEARCH ROUTES

// Search products by description vector
productRouter.post('/products/search/description', (req: Request, res: Response) => {
    searchProductsByDescriptionVector(req, res);
});

// Search products by tags vector
productRouter.post('/products/search/tags', (req: Request, res: Response) => {
    searchProductsByTagsVector(req, res);
});

// Search products by features vector
productRouter.post('/products/search/features', (req: Request, res: Response) => {
    searchProductsByFeaturesVector(req, res);
});



export default productRouter;