//src/services/cosmosdbService.ts
import {
    PartitionKeyDefinitionVersion,
    PartitionKeyKind,
    CosmosClient,
    Container,
    CosmosDbDiagnosticLevel,
    VectorEmbeddingPolicy,
    IndexingPolicy,
    VectorIndexType,
    VectorEmbeddingDataType,
    VectorEmbeddingDistanceFunction
} from '@azure/cosmos';
import logger from '../utils/logger';
import config from '../config/env';

class CosmosDB {
    private static instance: CosmosDB;
    private client: CosmosClient;
    private productsContainer!: Container;
    private initialized: boolean = false;
    private initializing: Promise<void> | null = null;

    // Private constructor to prevent direct instantiation
    private constructor() {
        this.client = new CosmosClient({
            endpoint: config.cosmos.endpoint,
            key: config.cosmos.key,
            connectionPolicy: {
                requestTimeout: 10000,
            },
            diagnosticLevel: CosmosDbDiagnosticLevel.debug,
        });
    }

    // Public method to get the singleton instance
    public static getInstance(): CosmosDB {
        if (!CosmosDB.instance) {
            CosmosDB.instance = new CosmosDB();
        }
        return CosmosDB.instance;
    }

    // Initialize the database and containers
    public async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        if (this.initializing) {
            return this.initializing;
        }

        this.initializing = this.init();
        return this.initializing;
    }

    // Internal initialization logic
    private async init(): Promise<void> {
        try {
            // Create database if it doesn't exist
            const { database } = await this.client.databases.createIfNotExists({
                id: config.cosmos.database,
                // throughput: 400 // Adjust as needed or make configurable
            });

            // Initialize productsContainer
            this.productsContainer = await this.createContainerIfNotExists(database, 'productsContainer');

            this.initialized = true;
            logger.info(`Database : ${database.id} initialization successfully`);
            logger.info(`Container : ${this.productsContainer.id} initialization successfully`);
        } catch (error: any) {
            if (error instanceof Error) {
                logger.error('Error initializing CosmosDB:', error.message);
                logger.error('Stack Trace:', error.stack);
            } else {
                logger.error('Unexpected error initializing CosmosDB:', JSON.stringify(error, null, 2));
            }
            throw error;
        }
    }

    // Helper method to create a container if it doesn't exist
    private async createContainerIfNotExists(database: any, containerId: string): Promise<Container> {
        const vectorEmbeddingPolicy: VectorEmbeddingPolicy = {
            vectorEmbeddings: [
                {
                    path: "/imageVector",
                    dataType: VectorEmbeddingDataType.Float32,
                    dimensions: 8,
                    distanceFunction: VectorEmbeddingDistanceFunction.DotProduct,
                },
                {
                    path: "/descriptionVector",
                    dataType: VectorEmbeddingDataType.Float32,
                    dimensions: 10,
                    distanceFunction: VectorEmbeddingDistanceFunction.Cosine,
                },
                {
                    path: "/tagsVector",
                    dataType: VectorEmbeddingDataType.Float32,
                    dimensions: 10, // Adjust dimensions as per your embedding model
                    distanceFunction: VectorEmbeddingDistanceFunction.Cosine,
                },
                {
                    path: "/featuresVector",
                    dataType: VectorEmbeddingDataType.Float32,
                    dimensions: 10, // Adjust dimensions as per your embedding model
                    distanceFunction: VectorEmbeddingDistanceFunction.Cosine,
                },
                {
                    path: "/dimensionsVector",
                    dataType: VectorEmbeddingDataType.Float32,
                    dimensions: 4, // weight, width, height, depth
                    distanceFunction: VectorEmbeddingDistanceFunction.Euclidean, // Suitable for numeric vectors
                },
            ],
        };

        const indexingPolicy: IndexingPolicy = {
            vectorIndexes: [
                { path: "/imageVector", type: VectorIndexType.QuantizedFlat },
                { path: "/descriptionVector", type: VectorIndexType.DiskANN },
                { path: "/tagsVector", type: VectorIndexType.DiskANN },
                { path: "/featuresVector", type: VectorIndexType.DiskANN },
                { path: "/dimensionsVector", type: VectorIndexType.DiskANN },
            ],
            includedPaths: [
                {
                    path: "/*",
                },
            ],
            excludedPaths: [
                {
                    path: "/_etag/?"
                },
                {
                    path: "/_rid/?"
                },
                {
                    path: "/_etag/?"
                },
                {
                    path: "/_attachments/?"
                },
                {
                    path: "/_ts/?"
                },
                {
                    path: "/imageVector/*",
                },
                {
                    path: "/descriptionVector/*",
                },
                {
                    path: "/tagsVector/*",
                },
                {
                    path: "/featuresVector/*",
                },
                {
                    path: "/dimensionsVector/*",
                },
            ]
        };

        const { container } = await database.containers.createIfNotExists({
            id: containerId,
            partitionKey: {
                paths: ["/id"],
                version: PartitionKeyDefinitionVersion.V2,
                kind: PartitionKeyKind.Hash,
            },
            vectorEmbeddingPolicy: vectorEmbeddingPolicy,
            indexingPolicy: indexingPolicy,
        });
        return container;
    }


    // Getters for the containers
    private getContainer(container: Container): Container {
        if (!this.initialized) {
            throw new Error('CosmosDB has not been initialized. Call initialize() first.');
        }
        return container;
    }

    public getProductsContainer(): Container {
        return this.getContainer(this.productsContainer);
    }

}

export default CosmosDB;

