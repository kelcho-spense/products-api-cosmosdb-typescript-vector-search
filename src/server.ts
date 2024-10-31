//server/src/server.ts
import config from './config/env';
import logger from './utils/logger';
import CosmosDB from './services/cosmosdbService';
import initializeServices from './services/index';

import app from './app';



// Start server
const startServer = async () => {
    try {
        // Initialize CosmosDB
        const CosmosInstance = CosmosDB.getInstance();
        await CosmosInstance.initialize();

        // Initialize services after CosmosDB is initialized
        const services = initializeServices();
        
        // Attach services to app.locals for access in controllers
        app.locals.services = services;

        const PORT = config.port;

        app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        logger.error('Failed to initialize Cosmos DB:', error);
        process.exit(1);
    }
};

startServer();