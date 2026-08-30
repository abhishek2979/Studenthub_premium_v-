require('dotenv').config();
const express     = require('express');
const rateLimit   = require('express-rate-limit');
const connectDB   = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

connectDB();

const app = express();
app.set('trust proxy', 1);


const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://studenthub-premium-v.vercel.app', 
  process.env.CLIENT_URL,               // set this in production .env
].filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,                             // raised: 100 auth attempts per 15 min per IP
  skip: (req) => req.method === 'OPTIONS',
  standardHeaders: true,               // returns RateLimit-* headers so the client knows
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests — please wait a few minutes and try again.' },
});
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  skip: (req) => req.method === 'OPTIONS',
});

app.use('/api/auth', authLimiter);
app.use('/api',      apiLimiter);

app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

app.use('/api/auth',        require('./routes/auth'));
app.use('/api/students',    require('./routes/students'));
app.use('/api/attendance',  require('./routes/attendance'));
app.use('/api/results',     require('./routes/results'));
app.use('/api/notes',       require('./routes/notes'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/quiz',        require('./routes/quiz'));


app.use('/api/premium',     require('./routes/premium'));
app.use('/api/videos',      require('./routes/videos'));
app.use('/api/live',        require('./routes/live'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`));
