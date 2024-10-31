# Enhancing E-Commerce Product Search with Vector Similarity in Azure Cosmos DB

![](./images/vector%20search.drawio.png)

In the competitive landscape of e-commerce, delivering precise and relevant search results is crucial for enhancing user experience and driving sales. Traditional keyword-based search methods often struggle to grasp the nuanced intentions behind user queries. This is where **vector similarity search** comes into play, leveraging advanced embedding techniques to provide more accurate and context-aware search results. In this blog, we'll walk you through implementing vector similarity search in an e-commerce products API using **Azure Cosmos DB for NoSQL** and **TypeScript(JavaScript)**.

## Table of Contents

1. [Introduction to Vector Similarity Search](#introduction-to-vector-similarity-search)
2. [Overview of Azure Cosmos DB Vector Search](#overview-of-azure-cosmos-db-vector-search)
3. [Prerequisites](#prerequisites)
4. [Registering for Azure Cosmos DB Vector Search Preview](#registering-for-azure-cosmos-db-vector-search-preview)
5. [Setting Up Azure Cosmos DB Container for Vector Search](#setting-up-azure-cosmos-db-container-for-vector-search)
    - [Creating the Database and Container](#creating-the-database-and-container)
    - [Defining Vector Embedding Policy](#defining-vector-embedding-policy)
    - [Adding Vector Indexes to the Indexing Policy](#adding-vector-indexes-to-the-indexing-policy)
6. [Building the Products API with Vector Search](#building-the-products-api-with-vector-search)
    - [Project Setup](#project-setup)
    - [Configuring Environment Variables](#configuring-environment-variables)
    - [Setting Up the Server](#setting-up-the-server)
    - [Implementing Logging](#implementing-logging)
    - [Defining Routes](#defining-routes)
    - [Implementing Controllers and Services](#implementing-controllers-and-services)
    - [Generating Vector Embeddings](#generating-vector-embeddings)
    - [Initializing CosmosDB Service](#initializing-cosmosdb-service)
7. [Testing the API](#testing-the-api)
    - [Creating a Product](#creating-a-product)
    - [Retrieving Products](#retrieving-products)
    - [Performing Vector Similarity Searches](#performing-vector-similarity-searches)
8. [Conclusion](#conclusion)

---

## Introduction to Vector Similarity Search
![](./images/vector%20database.drawio.png)
Vector similarity search is a powerful technique that transforms data into high-dimensional vectors (embeddings) and enables the comparison of these vectors to find similarities. In the context of e-commerce, this allows for more intelligent product searches, recommendations, and categorization by understanding the semantic meaning behind product descriptions, tags, and features.
### Embeddings
![](./images/Embeddings.drawio.png)
Modern machine learning models can be trained to convert raw data into embeddings, represented as arrays (or vectors) of floating point numbers of fixed dimensionality. What makes embeddings useful in practice is that the position of an embedding in vector space captures some of the semantics of the data, depending on the type of model and how it was trained. Points that are close to each other in vector space are considered similar (or appear in similar contexts), and points that are far away are considered dissimilar.

Large datasets of multi-modal data (text, audio, images, etc.) can be converted into embeddings with the appropriate model. Projecting the vectors' principal components in 2D space results in groups of vectors that represent similar concepts clustering together, as shown below.
### Indexes
Embeddings for a given dataset are made searchable via an index. The index is constructed by using data structures that store the embeddings such that it's very efficient to perform scans and lookups on them
### Brute force search
![](./images/Brute%20force%20search.drawio.png)
The simplest way to perform vector search is to perform a brute force search, without an index, where the distance between the query vector and all the vectors in the database are computed, with the top-k closest vectors returned. This is equivalent to a k-nearest neighbours (kNN) search in vector space.

As you can imagine, the brute force approach is not scalable for datasets larger than a few hundred thousand vectors, as the latency of the search grows linearly with the size of the dataset. This is where approximate nearest neighbour (ANN) algorithms come in.

## Overview of Azure Cosmos DB Vector Search

**Azure Cosmos DB for NoSQL** now offers a vector search feature in preview, designed to handle high-dimensional vectors efficiently and accurately at any scale. This feature allows you to store vectors directly within your documents alongside traditional schema-free data. By colocating data and vectors, Azure Cosmos DB ensures efficient indexing and searching, simplifying data management and enhancing AI application architectures.

Key capabilities include:

- **Vector Embedding Policies:** Define how vectors are generated and stored within your documents.
- **Vector Indexing:** Optimize data retrieval based on vector similarities using various indexing methods.
- **Vector Distance Functions:** Utilize metrics like Cosine, Dot Product, and Euclidean to measure similarity.

By integrating vector similarity search into your e-commerce API, you can significantly enhance the relevance and personalization of search results.

### What is a Vector Store?

A vector store or vector database is designed to store and manage vector embeddings—mathematical representations of data in a high-dimensional space. Each dimension corresponds to a feature of the data, and a vector's position represents its characteristics. This enables efficient similarity comparisons for various data types, including text, images, audio, and more.

### How Does a Vector Store Work?

Vector stores use vector search algorithms to index and query embeddings. These algorithms help find similar items based on data characteristics rather than exact matches. This technique is invaluable for applications like searching similar text, finding related images, making recommendations, and detecting anomalies. Vector search measures the distance between data vectors and a query vector, retrieving the most semantically similar results.

Azure Cosmos DB's integrated vector database allows embeddings to be stored, indexed, and queried alongside original data, eliminating the need for separate vector databases and enhancing data consistency, scalability, and performance.

## Prerequisites

Before diving into the implementation, ensure you have the following:

- **Azure Cosmos DB for NoSQL Account:** If you don't have one, [create a free account](https://azure.microsoft.com/en-us/services/cosmos-db/) or use an existing Azure subscription.
- **Azure Cosmos DB JavaScript SDK:** Version **4.1.0** or later.
- **Node.js and TypeScript:** Familiarity with these technologies is essential.
- **Vector Search Preview Registration:** Required to access vector search features.

## Registering for Azure Cosmos DB Vector Search Preview

Vector search in Azure Cosmos DB is currently in preview and requires explicit registration. Follow these steps to enroll:

1. **Navigate to Azure Portal:**
   - Go to your Azure Cosmos DB for NoSQL resource page.

2. **Access Features Pane:**
   - Select the **"Features"** pane under the **"Settings"** menu.

3. **Enable Vector Search:**
   - Find **"Vector Search in Azure Cosmos DB for NoSQL."**
   - Read the feature description to ensure it meets your requirements.
   - Click **"Enable"** to enroll in the preview.

*Note: The vector search feature is only supported on new containers. Existing containers cannot be retrofitted with vector search capabilities.*

**Alternative via Azure CLI:**

```bash
az cosmosdb update \
     --resource-group <resource-group-name> \
     --name <account-name> \
     --capabilities EnableNoSQLVectorSearch
```

*The registration request will be auto-approved, but it may take several minutes to take effect.*

## Setting Up Azure Cosmos DB Container for Vector Search

### Creating the Database and Container

Assume we're building an internet-based store for smart home devices. Each product has properties like `Name`, `Brand`, `SKU`, `Category`, and `Description`. We'll also define vector embeddings for `descriptionVector`, `tagsVector`, and `featuresVector` to enable vector-based searches.

**Example JSON Structure:**

```json
{
  "name": "Smart LED Light Bulb",
  "brand": "BrightHome",
  "sku": "SKU-1002",
  "category": "Home Automation",
  "price": 19.99,
  "currency": "USD",
  "stock": 500,
  "description": "Illuminate your home with BrightHome Smart LED Light Bulbs. Control brightness and color temperature via smartphone or voice commands.",
  "features": "Wi-Fi Enabled, Voice Control Compatible, Energy Efficient, Adjustable Brightness, Long Lifespan, Easy Installation",
  "rating": 4.3,
  "reviewsCount": 850,
  "tags": [
    "lighting",
    "smart home",
    "LED",
    "energy-efficient",
    "voice-control"
  ],
  "imageUrl": "https://example.com/images/products/SKU-1002.jpg",
  "manufacturer": "BrightHome Technologies",
  "model": "BH-SMART-LB",
  "releaseDate": "2023-07-20",
  "warranty": "1 year",
  "dimensions": {
    "weight": "75g",
    "width": "6.5cm",
    "height": "11cm",
    "depth": "6.5cm"
  },
  "color": "White",
  "material": "Glass and Plastic",
  "origin": "Germany",
  "id": "a2555d74-686a-4c34-af2b-c63fa2b9ed2f"
}
```

### Defining Vector Embedding Policy

The vector embedding policy informs the Cosmos DB query engine how to handle vector properties. It specifies the path, data type, dimensions, and distance function for each vector.

**JavaScript Example:**

```javascript
const vectorEmbeddingPolicy = {
  vectorEmbeddings: [
    {
      path: "/descriptionVector",
      dataType: "float32",
      dimensions: 1536,
      distanceFunction: "cosine",
    },
    {
      path: "/tagsVector",
      dataType: "float32",
      dimensions: 1536,
      distanceFunction: "cosine",
    },
    {
      path: "/featuresVector",
      dataType: "float32",
      dimensions: 1536,
      distanceFunction: "cosine",
    },
  ],
};
```

### Adding Vector Indexes to the Indexing Policy

Vector indexes optimize the storage and retrieval of vector data. You must define these indexes during container creation.

**JavaScript Example:**

```javascript
const indexingPolicy = {
  vectorIndexes: [
    { path: "/descriptionVector", type: "diskANN" },
    { path: "/tagsVector", type: "diskANN" },
    { path: "/featuresVector", type: "diskANN" },
  ],
  includedPaths: [
    {
      path: "/*",
    },
  ],
  excludedPaths: [
    {
      path: "/descriptionVector/*",
    },
    {
      path: "/tagsVector/*",
    },
    {
      path: "/featuresVector/*",
    },
  ],
};
```

*Note: During early preview, vector indexes can't be modified once created. If changes are needed, create a new container with the updated vector index policy.*

### Creating the Container

With the embedding and indexing policies defined, create the container:

**JavaScript Example:**

```javascript
const containerName = "vector-embedding-container";

// Create container
const { resource: containerdef } = await database.containers.createIfNotExists({
  id: containerName,
  vectorEmbeddingPolicy: vectorEmbeddingPolicy,
  indexingPolicy: indexingPolicy,
});
```

*Important:* Vector search is only supported on new containers. Ensure both the vector embedding policy and vector indexing policy are set during container creation.

## Building the Products API with Vector Search

We'll build a **TypeScript**-based API using **Express** that interacts with Azure Cosmos DB to perform vector similarity searches.

### Folder Structure
  
```plaintext
📦 products-api-cosmosdb-typescript-vector-search
 ┣ 📂 src
 ┃ ┣ 📂 config
 ┃ ┃ ┗ 📜 env.ts
 ┃ ┣ 📂 controllers
 ┃ ┃ ┗ 📜 productController.ts
 ┃ ┣ 📂 logs
 ┃ ┃ ┗ 📜 access.log
 ┃ ┣ 📂 middlewares
 ┃ ┃ ┣ 📜 errorHandler.ts
 ┃ ┃ ┣ 📜 log.ts
 ┃ ┃ ┗ 📜 rateLimiterHandler.ts
 ┃ ┣ 📂 routes
 ┃ ┃ ┗ 📜 productsRoutes.ts
 ┃ ┣ 📂 schemas
 ┃ ┃ ┗ 📜 productSchema.ts
 ┃ ┣ 📂 services
 ┃ ┃ ┣ 📜 cosmosdbService.ts
 ┃ ┃ ┣ 📜 embeddingService.ts
 ┃ ┃ ┣ 📜 index.ts
 ┃ ┃ ┗ 📜 productService.ts
 ┃ ┣ 📂 utils
 ┃ ┃ ┗ 📜 app.ts
 ┃ ┗ 📜 server.ts
 ┣ 📜 .env
 ┣ 📜 .gitignore
 ┣ 📜 app.http
 ┣ 📜 package.json
 ┣ 📜 pnpm-lock.yaml
 ┣ 📜 README.md
 ┗ 📜 tsconfig.json

```

### Project Setup

**`package.json`:**

```json
{
  "name": "products-api-cosmosdb-typescript-vector-search",
  "version": "1.0.0",
  "description": "a Products API using Express and TypeScript, and integrate Azure Cosmos DB (with vector search capabilities) for managing product data. We'll also implement vector search, enabling us to query items based on vector similarity.",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "rimraf dist && tsc",
    "start": "node dist/server.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/morgan": "^1.9.9",
    "@types/multer": "^1.4.12",
    "@types/node": "^22.7.9",
    "@types/uuid": "^10.0.0",
    "rimraf": "^6.0.1",
    "tsx": "^4.19.1",
    "typescript": "^5.6.3"
  },
  "dependencies": {
    "@azure/cosmos": "^4.1.1",
    "axios": "^1.7.7",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.1",
    "express-rate-limit": "^7.4.1",
    "helmet": "^8.0.0",
    "morgan": "^1.10.0",
    "multer": "1.4.5-lts.1",
    "pino": "^9.5.0",
    "pino-pretty": "^11.3.0",
    "rotating-file-stream": "^3.2.5",
    "uuid": "^10.0.0",
    "zod": "^3.23.8"
  }
}

```

**`tsconfig.json`:**

```json
{
  "compilerOptions": {
    /* Language and Environment */
    "target": "ES2022",
    /* Modules */
    "module": "CommonJS",
    "rootDir": "./src",
    "outDir": "./dist",
    "moduleResolution": "node",
    /* Interop Constraints */
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "allowSyntheticDefaultImports": true,
    /* Type Checking */
    "strict": true,
    /* Completeness */
    "skipLibCheck": true
  },
  "exclude": [
    "node_modules",
    "dist"
  ],
  "include": [
    "src/**/*.ts"
  ]
}
```

### Configuring Environment Variables

Create a `.env` file to manage sensitive configurations:

**`.env`:**

```env
# Azure Cosmos DB Configuration
AZURE_COSMOS_DB_ENDPOINT=https://<your-cosmosdb-account>.documents.azure.com:443/
AZURE_COSMOS_DB_KEY=<your-cosmosdb-key>
AZURE_COSMOS_DB=<your-database-name>

# Azure OpenAI Configuration
AZURE_OPENAI_API_KEY=<your-openai-api-key>

# Azure OpenAI Text Embedding Model Configuration
AZURE_OPENAI_TEXT_EMBEDDING_MODEL_ENDPOINT=https://<your-openai-endpoint>.openai.azure.com/openai/deployments/<your-embedding-model-deployment>/embeddings?api-version=2023-05-15

```

*Ensure you replace placeholder values with your actual credentials.*

### Setting Up the Server

**`src/server.ts`:**

```typescript
import config from './config/env';
import logger from './utils/logger';
import CosmosDB from './services/cosmosdbService';
import initializeServices from './services/index';

import app from './app';

// Start server
const startServer = async () => {
  try {
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
```

### Implementing Logging

**`src/utils/logger.ts`:**

```typescript
import pino from 'pino'

const logger = pino({
  base: {
    pid: false
  },
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
})

export default logger;
```

*Using **Pino** for efficient and structured logging.*

### Defining Routes

**`src/routes/productsRoutes.ts`:**

```typescript
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

// VECTOR SEARCH

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
```

### Implementing Controllers and Services

**`src/controllers/productController.ts`:**

```typescript
import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';
import { productSchema, Product } from '../schemas/productSchema';
import { generateTextVector } from '../services/embeddingService';

// Get all products
export const getProducts = async (req: Request, res: Response) => {
  const { productService } = req.app.locals.services;

  try {
    const products = await productService.getProducts();
    return res.status(200).json({
      status: 'success',
      data: products,
    });
  } catch (error: any) {
    console.error('Error getting products:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
    });
  }
};

// Get product by ID
export const getProductById = async (req: Request, res: Response) => {
  const { productService } = req.app.locals.services;
  const { id } = req.params;

  try {
    const product = await productService.getProductById(id);

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
    console.error('Error getting product:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
    });
  }
};

// Create a new product with vector embeddings
export const createProduct = async (req: Request, res: Response) => {
  const { productService } = req.app.locals.services;

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
    console.error('Error creating product:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
    });
  }
};

// Search products by tags vector
export const searchProductsByTagsVector = async (req: Request, res: Response) => {
  const { productService } = req.app.locals.services;
  const { queryVector, top } = req.body;

  const tagsText = queryVector.join(' ');
  const tagsVector = await generateTextVector(tagsText);

  // Validate the request body
  if (!Array.isArray(tagsVector) || !tagsVector.every(num => typeof num === 'number')) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid queryVector. It should be an array of numbers.',
    });
  }

  const topResults = top && Number.isInteger(top) && top > 0 ? top : 10;

  try {
    const results = await productService.searchProductsByTagsVector(tagsVector, topResults);
    return res.status(200).json({
      status: 'success',
      data: results,
    });
  } catch (error: any) {
    console.error('Error searching products by tags:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
    });
  }
};

// Search products by features vector
export const searchProductsByFeaturesVector = async (req: Request, res: Response) => {
  const { productService } = req.app.locals.services;
  const { queryVector, top } = req.body;

  const featuresText = queryVector.join(' ');
  const featuresVector = await generateTextVector(featuresText);

  // Validate the request body
  if (!Array.isArray(featuresVector) || !featuresVector.every(num => typeof num === 'number')) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid queryVector. It should be an array of numbers.',
    });
  }

  const topResults = top && Number.isInteger(top) && top > 0 ? top : 10;

  try {
    const results = await productService.searchProductsByFeaturesVector(featuresVector, topResults);
    return res.status(200).json({
      status: 'success',
      data: results,
    });
  } catch (error: any) {
    console.error('Error searching products by features:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
    });
  }
};

// Search products by description vector
export const searchProductsByDescriptionVector = async (req: Request, res: Response) => {
  const { productService } = req.app.locals.services;
  const { queryVector, top } = req.body;

  const descriptionText = queryVector.join(' ');
  const descriptionVector = await generateTextVector(descriptionText);

  // Validate the request body
  if (!Array.isArray(descriptionVector) || !descriptionVector.every(num => typeof num === 'number')) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid queryVector. It should be an array of numbers.',
    });
  }

  const topResults = top && Number.isInteger(top) && top > 0 ? top : 10;

  try {
    const results = await productService.searchProductsByDescriptionVector(descriptionVector, topResults);
    return res.status(200).json({
      status: 'success',
      data: results,
    });
  } catch (error: any) {
    console.error('Error searching products by description:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
    });
  }
};
```

**`src/services/productService.ts`:**

```typescript
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
            const { resource } = await this.container.item(id).read();
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

```

**`src/services/index.ts`:**

```typescript
import ProductService from './productService';
import CosmosDB from './cosmosdbService';

// Initialize services
const initializeServices = () => {
  const cosmosInstance = CosmosDB.getInstance();
  return {
    productService: new ProductService(),
    // Add other services here
  };
};

export default initializeServices;
```

### Generating Vector Embeddings

To perform vector similarity searches, we need to generate embeddings for product descriptions, tags, and features. We'll use **Azure OpenAI's Embedding API** for this purpose.

**`src/services/embeddingService.ts`:**

```typescript
import axios from 'axios';
import config from '../config/env';

/**
 * Generates a vector embedding for a given text using OpenAI's Embedding API.
 * @param text The input text to embed.
 * @returns An array of numbers representing the embedding vector.
 */
export async function generateTextVector(text: string): Promise<number[]> {
  const response = await axios.post(config.azureOpenAi.models.embeddingEndpoint,
    {
      input: text,
      // model: config.azureOpenAi.models.embedding, // Ensure this model is supported
    }, {
    headers: {
      'Content-Type': 'application/json',
      'api-key': config.azureOpenAi.apiKey,
    }
  });

  const vector = response.data.data[0].embedding;
  return vector;
}
```

*This service takes input text and returns its vector embedding, which is then stored in Cosmos DB.*

### Initializing CosmosDB Service

**`src/services/cosmosdbService.ts`:**

```typescript
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
          path: "/descriptionVector",
          dataType: VectorEmbeddingDataType.Float32,
          dimensions: 1536,
          distanceFunction: VectorEmbeddingDistanceFunction.Cosine,
        },
        {
          path: "/tagsVector",
          dataType: VectorEmbeddingDataType.Float32,
          dimensions: 1536,
          distanceFunction: VectorEmbeddingDistanceFunction.Cosine,
        },
        {
          path: "/featuresVector",
          dataType: VectorEmbeddingDataType.Float32,
          dimensions: 1536,
          distanceFunction: VectorEmbeddingDistanceFunction.Cosine,
        },
      ],
    };

    const indexingPolicy: IndexingPolicy = {
      vectorIndexes: [
        { path: "/descriptionVector", type: VectorIndexType.DiskANN },
        { path: "/tagsVector", type: VectorIndexType.DiskANN },
        { path: "/featuresVector", type: VectorIndexType.DiskANN },
      ],
      includedPaths: [
        {
          path: "/*",
        },
      ],
      excludedPaths: [
        {
          path: "/descriptionVector/*",
        },
        {
          path: "/tagsVector/*",
        },
        {
          path: "/featuresVector/*",
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
```

*This service ensures a singleton instance of CosmosDB, initializes the database and containers with the necessary vector policies and indexes.*

## Defining Product Schema

**`src/schemas/productSchema.ts`:**

```typescript
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
  tagsVector: z.array(z.number()).optional(),
  featuresVector: z.array(z.number()).optional(),
});

export type Product = z.infer<typeof productSchema>;
```

*Using **Zod** for schema validation ensures that incoming data adheres to the expected structure.*

## Configuring Environment Variables

**`src/config/env.ts`:**

```typescript
import dotenv from 'dotenv';

dotenv.config();

// Default to 8000 if not set
export const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8000;

// Cosmos DB Configuration
export const COSMOS_ENDPOINT = process.env.AZURE_COSMOS_DB_ENDPOINT as string;
export const COSMOS_KEY = process.env.AZURE_COSMOS_DB_KEY as string;
export const COSMOS_DB = process.env.AZURE_COSMOS_DB as string;

// Azure OpenAI Configuration
export const OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY as string;
export const OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT as string;
export const OPENAI_TEXT_EMBEDDING_MODEL = process.env.AZURE_OPENAI_TEXT_EMBEDDING_MODEL as string;
export const OPENAI_TEXT_EMBEDDING_MODEL_ENDPOINT = process.env.AZURE_OPENAI_TEXT_EMBEDDING_MODEL_ENDPOINT as string;

// List of required environment variables
const requiredEnvVars = [
  'AZURE_COSMOS_DB_ENDPOINT',
  'AZURE_COSMOS_DB_KEY',
  'AZURE_COSMOS_DB',
  'AZURE_OPENAI_API_KEY',
  'AZURE_OPENAI_ENDPOINT',
  'AZURE_OPENAI_TEXT_EMBEDDING_MODEL',
  'AZURE_OPENAI_TEXT_EMBEDDING_MODEL_ENDPOINT',
];

// Function to validate environment variables
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`Missing required env variable: ${varName}`);
  }
});

// Configuration object
const config = {
  port: PORT,
  cosmos: {
    endpoint: COSMOS_ENDPOINT,
    key: COSMOS_KEY,
    database: COSMOS_DB,
  },
  azureOpenAi: {
    apiKey: OPENAI_API_KEY,
    endpoint: OPENAI_ENDPOINT,
    models: {
      embedding: OPENAI_TEXT_EMBEDDING_MODEL,
      embeddingEndpoint: OPENAI_TEXT_EMBEDDING_MODEL_ENDPOINT,
    }
  }
}

export default config;
```

*This configuration ensures that all necessary environment variables are set and accessible throughout the application.*

### Setting Up the Express Application

**`src/app.ts`:**

```typescript
//
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import requestLogger from './middlewares/log';
import productRouter from './routes/productsRoutes';
import { errorHandler } from './middlewares/errorHandler';
import limiter from './middlewares/rateLimiterHandler';

// Create Express server
const app: Application = express();

// Middlewares
app.use(cors());  // Enable CORS
app.use(express.json());  // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));  // Parse URL-encoded bodies
app.use(helmet()); // Secure your Express apps by setting various HTTP headers
app.use(requestLogger); // HTTP request logger
app.use(limiter); // Rate limiter middleware to limit(Limit each IP to 100 requests per 1 minutes) 


app.use('/api', productRouter);

app.use(errorHandler); // Error handler middleware( should be the last middleware)

export default app;
```

*This sets up the Express application with necessary middlewares and routes.*

## Testing the API

With the API fully set up, let's explore how to interact with it using various endpoints.

### Creating a Product

**Endpoint:** `POST http://localhost:8000/api/products`

**Headers:**

```
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "Smart LED Light Bulb",
  "brand": "BrightHome",
  "sku": "SKU-1002",
  "category": "Home Automation",
  "price": 19.99,
  "currency": "USD",
  "stock": 500,
  "description": "Illuminate your home with BrightHome Smart LED Light Bulbs. Control brightness and color temperature via smartphone or voice commands.",
  "features": "Wi-Fi Enabled, Voice Control Compatible, Energy Efficient, Adjustable Brightness, Long Lifespan, Easy Installation",
  "rating": 4.3,
  "reviewsCount": 850,
  "tags": [
    "lighting",
    "smart home",
    "LED",
    "energy-efficient",
    "voice-control"
  ],
  "imageUrl": "https://example.com/images/products/SKU-1002.jpg",
  "manufacturer": "BrightHome Technologies",
  "model": "BH-SMART-LB",
  "releaseDate": "2023-07-20",
  "warranty": "1 year",
  "dimensions": {
    "weight": "75g",
    "width": "6.5cm",
    "height": "11cm",
    "depth": "6.5cm"
  },
  "color": "White",
  "material": "Glass and Plastic",
  "origin": "Germany"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "id": "a2555d74-686a-4c34-af2b-c63fa2b9ed2f",
    "name": "Smart LED Light Bulb",
    "brand": "BrightHome",
    "sku": "SKU-1002",
    "category": "Home Automation",
    "price": 19.99,
    "currency": "USD",
    "stock": 500,
    "description": "Illuminate your home with BrightHome Smart LED Light Bulbs. Control brightness and color temperature via smartphone or voice commands.",
    "features": "Wi-Fi Enabled, Voice Control Compatible, Energy Efficient, Adjustable Brightness, Long Lifespan, Easy Installation",
    "rating": 4.3,
    "reviewsCount": 850,
    "tags": [
      "lighting",
      "smart home",
      "LED",
      "energy-efficient",
      "voice-control"
    ],
    "imageUrl": "https://example.com/images/products/SKU-1002.jpg",
    "manufacturer": "BrightHome Technologies",
    "model": "BH-SMART-LB",
    "releaseDate": "2023-07-20",
    "warranty": "1 year",
    "dimensions": {
      "weight": "75g",
      "width": "6.5cm",
      "height": "11cm",
      "depth": "6.5cm"
    },
    "color": "White",
    "material": "Glass and Plastic",
    "origin": "Germany",
    "descriptionVector": [/* generated vector */],
    "tagsVector": [/* generated vector */],
    "featuresVector": [/* generated vector */]
  }
}
```

*Upon creation, the API generates vector embeddings for the description, tags, and features, storing them alongside the product data.*

### Retrieving Products

**Endpoint:** `GET http://localhost:8000/api/products`

**Headers:**

```
Accept: application/json
```

**Response:**

```json
{
  "status": "success",
  "data": [
    {
      "id": "a2555d74-686a-4c34-af2b-c63fa2b9ed2f",
      "name": "Smart LED Light Bulb",
      "brand": "BrightHome",
      "sku": "SKU-1002",
      "category": "Home Automation",
      "price": 19.99,
      "currency": "USD",
      "stock": 500,
      "description": "Illuminate your home with BrightHome Smart LED Light Bulbs. Control brightness and color temperature via smartphone or voice commands.",
      "features": "Wi-Fi Enabled, Voice Control Compatible, Energy Efficient, Adjustable Brightness, Long Lifespan, Easy Installation",
      "rating": 4.3,
      "reviewsCount": 850,
      "tags": [
        "lighting",
        "smart home",
        "LED",
        "energy-efficient",
        "voice-control"
      ],
      "imageUrl": "https://example.com/images/products/SKU-1002.jpg",
      "manufacturer": "BrightHome Technologies",
      "model": "BH-SMART-LB",
      "releaseDate": "2023-07-20",
      "warranty": "1 year",
      "dimensions": {
        "weight": "75g",
        "width": "6.5cm",
        "height": "11cm",
        "depth": "6.5cm"
      },
      "color": "White",
      "material": "Glass and Plastic",
      "origin": "Germany",
      "descriptionVector": [/* vector */],
      "tagsVector": [/* vector */],
      "featuresVector": [/* vector */]
    },
    // More products...
  ]
}
```

### Performing Vector Similarity Searches

Vector similarity searches allow users to find products that are semantically similar to their queries. Below are examples of how to perform such searches.

#### Search by Tags Vector

**Endpoint:** `POST http://localhost:8000/api/products/search/tags`

**Headers:**

```
Content-Type: application/json
```

**Request Body:**

```json
{
  "queryVector": ["lighting", "smart home"],
  "top": 5
}
```

**Response:**

```json
{
  "status": "success",
  "data": [
    {
      "id": "a2555d74-686a-4c34-af2b-c63fa2b9ed2f",
      "name": "Smart LED Light Bulb",
      "brand": "BrightHome",
      "sku": "SKU-1002",
      // Other product details...
      "SimilarityScore": 0.95
    },
    // Top 5 similar products...
  ]
}
```

#### Search by Features Vector

**Endpoint:** `POST http://localhost:8000/api/products/search/features`

**Headers:**

```
Content-Type: application/json
```

**Request Body:**

```json
{
  "queryVector": ["Wi-Fi Enabled", "Voice Control"],
  "top": 2
}
```

**Response:**

```json
{
  "status": "success",
  "data": [
    {
      "id": "a2555d74-686a-4c34-af2b-c63fa2b9ed2f",
      "name": "Smart LED Light Bulb",
      "brand": "BrightHome",
      "sku": "SKU-1002",
      // Other product details...
      "SimilarityScore": 0.92
    },
    // Top 2 similar products...
  ]
}
```

#### Search by Description Vector

**Endpoint:** `POST http://localhost:8000/api/products/search/description`

**Headers:**

```
Content-Type: application/json
```

**Request Body:**

```json
{
  "queryVector": ["energy efficient smart lighting"],
  "top": 10
}
```

**Response:**

```json
{
  "status": "success",
  "data": [
    {
      "id": "a2555d74-686a-4c34-af2b-c63fa2b9ed2f",
      "name": "Smart LED Light Bulb",
      "brand": "BrightHome",
      "sku": "SKU-1002",
      // Other product details...
      "SimilarityScore": 0.98
    },
    // Top 10 similar products...
  ]
}
```

*These searches utilize the vector embeddings to retrieve products that closely match the semantic intent of the query, providing more relevant results compared to traditional keyword searches.*

## Conclusion

Integrating vector similarity search into your e-commerce API using Azure Cosmos DB enhances the search functionality by understanding the semantic relationships between products and user queries. This leads to improved user satisfaction, higher engagement, and increased sales. By leveraging Azure's robust infrastructure and advanced embedding techniques, you can stay ahead in the competitive e-commerce landscape.

**Key Takeaways:**

- **Vector Embeddings:** Transforming textual and categorical data into high-dimensional vectors enables nuanced similarity comparisons.
- **Azure Cosmos DB Vector Search:** Offers efficient indexing and querying capabilities tailored for vector data.
- **API Integration:** Seamlessly integrating vector search into your API enhances the overall search experience.
- **Scalability:** Azure Cosmos DB ensures that your vector search capabilities scale with your growing product catalog.

Embark on implementing vector similarity search in your e-commerce platform to deliver smarter and more intuitive search experiences for your users.