// server/src/services/index.ts

import ProductService from './productService';
import CosmosDB from './cosmosdbService';

// Ensure CosmosDB is initialized before creating services
const initializeServices = () => {
    const cosmosInstance = CosmosDB.getInstance();
    // You can perform any additional service initialization here if needed
    return {
        productService: new ProductService(),
        // Add other services here
    };
};

export default initializeServices;