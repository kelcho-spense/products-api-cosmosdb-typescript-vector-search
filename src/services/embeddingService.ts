//src/services/embeddingService.ts
import axios from 'axios';
import config from '../config/env';

/**
 * Generates a vector embedding for a given text using OpenAI's Embedding API.
 * @param text The input text to embed.
 * @returns An array of numbers representing the embedding vector.
 */
export async function generateTextVector(text: string): Promise<number[]> {
    const response = await axios.post(config.azureOpenAi.models.embedding.endPoint,
        { input: text },
        {
            headers: {
                'Content-Type': 'application/json',
                'api-key': config.azureOpenAi.apiKey,
            }
        });

    const vector = response.data.data[0].embedding;
    return vector;
}



