import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

app.set('trust proxy', 1); // Render proxy ke peeche rate-limit sahi chale
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use('/api', apiLimiter);

app.get('/', (req, res) => res.json({ success: true, message: 'Auth API chal rahi hai' }));
app.use('/api/auth', authRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
