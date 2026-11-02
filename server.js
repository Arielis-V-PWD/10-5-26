const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });

const REQUIRED_ENV = ['SESSION_SECRET', 'NASA_API_KEY', 'ADMIN_USERNAME', 'ADMIN_PASSWORD'];
for (const name of REQUIRED_ENV) {
    const value = process.env[name]?.trim();
    if (!value) {
        console.error(`Missing ${name} in .env (or in Render's Environment settings)`);
        process.exit(1);
    }
    process.env[name] = value;
}

const express = require('express');
const session = require('express-session');
const helmet = require('helmet');

const { requestLogger } = require('./middleware/logger');
const { limiter } = require('./middleware/limiters');
const { notFound, errorHandler } = require('./middleware/errors');
const pagesRouter = require('./routes/pages');
const { authRouter, ensureAdmin } = require('./routes/auth');
const guestbookRouter = require('./routes/guestbook');
const spaceRouter = require('./routes/space');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const isProduction = process.env.NODE_ENV === 'production';

// ===== 1. Security and parsing =====
app.set('trust proxy', 1);
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            'img-src': ["'self'", 'data:', 'https://assets.science.nasa.gov']
        }
    }
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(requestLogger);
app.use(limiter);

// ===== 2. Sessions =====
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 15 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction
    }
}));

// ===== 3. Routes =====
app.use(pagesRouter);
app.use(authRouter);
app.use('/api/guestbook', guestbookRouter);
app.use('/api/space', spaceRouter);

// ===== 4. Static files, then errors =====
app.use(express.static(PUBLIC_DIR, { extensions: ['html'] }));
app.use(notFound);
app.use(errorHandler);

// ===== 5. Start =====
ensureAdmin().then(() => {
    app.listen(PORT, () => console.log(`Server live on http://localhost:${PORT}`));
});
