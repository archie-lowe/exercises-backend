import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import exercisesRouter from './exercise/routes.js';
import { auth } from 'express-oauth2-jwt-bearer';
import type { Request, Response, NextFunction } from 'express';

dotenv.config();

const checkJwt = auth({
    audience: 'http://localhost:3000',
    issuerBaseURL: `https://dev-l2w4rhih6tqllg35.us.auth0.com/`,
  });
const CORS = process.env.CORS || '*';
const app = express();
// Add this BEFORE your routes
app.use(cors({
    origin: 'http://localhost:5173' // Vite default port
  }));
app.use(cors({ origin: CORS }));
app.use(express.json()); // Middleware
app.use('/v1/exercises', checkJwt, exercisesRouter)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err.name === 'UnauthorizedError') {
      return res.status(401).json({
        error: 'unauthorized',
      });
    }
  
    res.status(err.status || 500).json({
      error: 'server_error',
      message: err.message || 'Internal Server Error'
    });
  });

export default app;