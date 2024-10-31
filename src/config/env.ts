// src/config/env.ts
import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

// Define the schema for environment variables using zod
const EnvSchema = z.object({
    PORT: z.coerce.number().default(8000), // Set default to 8000
    AZURE_COSMOS_DB_ENDPOINT: z.string({
        required_error: "AZURE_COSMOS_DB_ENDPOINT is required",
        invalid_type_error: "AZURE_COSMOS_DB_ENDPOINT must be a string",
    }),
    AZURE_COSMOS_DB_KEY: z.string({
        required_error: "AZURE_COSMOS_DB_KEY is required",
        invalid_type_error: "AZURE_COSMOS_DB_KEY must be a string",
    }),
    AZURE_COSMOS_DB: z.string({
        required_error: "AZURE_COSMOS_DB is required",
        invalid_type_error: "AZURE_COSMOS_DB must be a string",
    }),
    AZURE_OPENAI_API_KEY: z.string({
        required_error: "AZURE_OPENAI_API_KEY is required",
        invalid_type_error: "AZURE_OPEN_AI_API_KEY must be a string",
    }),
    AZURE_OPENAI_TEXT_EMBEDDING_MODEL_ENDPOINT: z.string({
        required_error: "AZURE_OPENAI_TEXT_EMBEDDING_MODEL_ENDPOINT is required",
        invalid_type_error: "AZURE_OPENAI_TEXT_EMBEDDING_MODEL_ENDPOINT must be a string",
    }),
});

// Parse and validate the environment variables
export const env = EnvSchema.parse(process.env);


// Configuration object consolidating all settings
const config = {
    port: env.PORT,
    cosmos: {
        endpoint: env.AZURE_COSMOS_DB_ENDPOINT,
        key: env.AZURE_COSMOS_DB_KEY,
        database: env.AZURE_COSMOS_DB,
    },
    azureOpenAi: {
        apiKey: env.AZURE_OPENAI_API_KEY,
        models: {
            embedding: {
                endPoint: env.AZURE_OPENAI_TEXT_EMBEDDING_MODEL_ENDPOINT
            },
        },
    },
};


export default config;
