// server/src/services/productService.ts

import { Container } from '@azure/cosmos';
import CosmosDB from '../services/cosmosdbService';
import { Product } from '../schemas/productSchema';

class ProductService {
    private container: Container;

    constructor() {
        const cosmosDB = CosmosDB.getInstance();
        this.container = cosmosDB.getProductsContainer();
    }

    /**
     * Adds a new product to the Cosmos DB container.
     * @param product The validated product to add.
     * @returns The created product resource.
     */
    public async addProduct(product: Product) {
        const { resource } = await this.container.items.create<Product>(product);
        return resource;
    }

    /**
     * Retrieves a product by its ID.
     * @param id The ID of the product.
     * @returns The retrieved product or null if not found.
     */
    public async getProductById(id: string) {
        try {
            const { resource } = await this.container.item(id, id).read<Product>();
            return resource;
        } catch (error: any) {
            if (error.code === 404) {
                return null;
            }
            throw error;
        }
    }

    /**
     * Retrieves all products from the Cosmos DB container.
     * @returns An array of products.
     */
    public async getProducts() {
        const { resources } = await this.container.items
            .query("SELECT c.id, c.name, c.brand, c.sku, c.category, c.price, c.currency, c.stock, c.description, c.features, c.rating, c.reviewsCount, c.tags, c.imageUrl, c.manufacturer, c.model, c.releaseDate, c.warranty, c.dimensions, c.color, c.material, c.origin FROM c")
            .fetchAll();
        return resources;
    }

    /**
     * Searches for products similar to the provided description vector.
     * @param queryVector The vector representing the search query.
     * @param top The number of top similar products to retrieve.
     * @returns An array of products with similarity scores.
     */

    public async searchProductsByDescriptionVector(queryVector: number[], top: number = 10) {
        const querySpec = {
            query: `
                SELECT TOP @top 
                c.id, 
                    c.name, 
                    c.brand, 
                    c.sku, 
                    c.category, 
                    c.price, 
                    c.currency, 
                    c.stock, 
                    c.description, 
                    c.features, 
                    c.rating, 
                    c.reviewsCount, 
                    c.tags, 
                    c.imageUrl, 
                    c.manufacturer, 
                    c.model, 
                    c.releaseDate, 
                    c.warranty, 
                    c.dimensions, 
                    c.color, 
                    c.material, 
                    c.origin, 
                VectorDistance(c.descriptionVector, @queryVector) AS SimilarityScore
                FROM c
                ORDER BY VectorDistance(c.descriptionVector, @queryVector)
                `,
            parameters: [
                { name: "@queryVector", value: queryVector },
                { name: "@top", value: top }
            ]
        };

        const { resources } = await this.container.items.query(querySpec).fetchAll();
        return resources;
    }

    /**
     * Searches for products similar to the provided tags vector.
     * @param queryVector The vector representing the tags search query.
     * @param top The number of top similar products to retrieve.
     * @returns An array of products with similarity scores.
     */
    public async searchProductsByTagsVector(queryVector: number[], top: number = 10) {
        const querySpec = {
            query: `
                SELECT TOP @top 
                    c.id, 
                    c.name, 
                    c.brand, 
                    c.sku, 
                    c.category, 
                    c.price, 
                    c.currency, 
                    c.stock, 
                    c.description, 
                    c.features, 
                    c.rating, 
                    c.reviewsCount, 
                    c.tags, 
                    c.imageUrl, 
                    c.manufacturer, 
                    c.model, 
                    c.releaseDate, 
                    c.warranty, 
                    c.dimensions, 
                    c.color, 
                    c.material, 
                    c.origin, 
                    VectorDistance(c.tagsVector, @queryVector) AS SimilarityScore
                FROM c
                ORDER BY VectorDistance(c.tagsVector, @queryVector)
            `,
            parameters: [
                { name: "@queryVector", value: queryVector },
                { name: "@top", value: top }
            ]
        };

        const { resources } = await this.container.items.query(querySpec).fetchAll();
        return resources;
    }

    /**
     * Searches for products similar to the provided features vector.
     * @param queryVector The vector representing the features search query.
     * @param top The number of top similar products to retrieve.
     * @returns An array of products with similarity scores.
     */
    public async searchProductsByFeaturesVector(queryVector: number[], top: number = 10) {
        const querySpec = {
            query: `
                SELECT TOP @top 
                    c.id, 
                    c.name, 
                    c.brand, 
                    c.sku, 
                    c.category, 
                    c.price, 
                    c.currency, 
                    c.stock, 
                    c.description, 
                    c.features, 
                    c.rating, 
                    c.reviewsCount, 
                    c.tags, 
                    c.imageUrl, 
                    c.manufacturer, 
                    c.model, 
                    c.releaseDate, 
                    c.warranty, 
                    c.dimensions, 
                    c.color, 
                    c.material, 
                    c.origin, 
                    VectorDistance(c.featuresVector, @queryVector) AS SimilarityScore
                FROM c
                ORDER BY VectorDistance(c.featuresVector, @queryVector)
            `,
            parameters: [
                { name: "@queryVector", value: queryVector },
                { name: "@top", value: top }
            ]
        };

        const { resources } = await this.container.items.query(querySpec).fetchAll();
        return resources;
    }
}

export default ProductService;
