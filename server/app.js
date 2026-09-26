import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import apiRoutes from './routes/index.js';

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  }),
);
app.use(express.json());

app.use('/api', apiRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
