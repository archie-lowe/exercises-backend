import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import exercisesRouter from './exercise/routes.js';

dotenv.config();

const CORS = process.env.CORS || '*';
const app = express();
app.use(cors({ origin: CORS }));
app.use(express.json()); // Middleware
app.use('/v1/exercises', exercisesRouter)

export default app;