const rateLimit = require('express-rate-limit');

// Every request: 100 per 10 seconds, per visitor
const limiter = rateLimit({
    windowMs: 10 * 1000,
    limit: 100,
    message: { error: 'Too many requests. Please wait 10 seconds.' }
});

// Login and register: 10 tries per 15 minutes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    message: { error: 'Too many login attempts. Please wait 15 minutes and try again.' }
});

// Guestbook posts: keep the project’s current short-form throttle
const postLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 3,
    keyGenerator: (req) => req.session.userId,
    message: { error: 'You are posting too fast. Please wait a minute.' }
});

// NASA lookups: 10 per minute
const spaceLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    message: { error: 'Too many space lookups. Please wait a minute.' }
});

module.exports = { limiter, authLimiter, postLimiter, spaceLimiter };
