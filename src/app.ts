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

// CORS options
const corsOptions = {
    origin: 'http://your-allowed-origin.com', // Replace with your allowed origin(s)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],  // Add headers you want to allow ie 'Authorization'
    // credentials: true, // Enable if you need to pass cookies or authentication tokens
  };

// Middlewares
app.use(cors(corsOptions));  // Enable CORS
app.use(express.json());  // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));  // Parse URL-encoded bodies
app.use(helmet()); // Secure your Express apps by setting various HTTP headers
app.use(requestLogger); // HTTP request logger
app.use(limiter); // Rate limiter middleware to limit(Limit each IP to 100 requests per 1 minutes) 


app.use('/api', productRouter);

app.use(errorHandler); // Error handler middleware( should be the last middleware)

export default app;