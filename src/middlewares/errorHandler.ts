// server/src/middleware/errorHandler.ts

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

interface ErrorResponse {
    status: 'error';
    message: string;
    errors?: Array<{ path: string; message: string }>;
}

export const errorHandler = (
    err: any,
    req: Request,
    res: Response<ErrorResponse>,
    next: NextFunction
) => {
    logger.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Internal Server Error',
    });
};
