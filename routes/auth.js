const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authLimiter } = require('../middleware/limiters');
const { validateCredentials } = require('../utils/validation');

const router = express.Router();

function startSession(req, user, rememberMe) {
    return new Promise((resolve, reject) => {
        req.session.regenerate((err) => {
            if (err) return reject(err);
            req.session.userId = user.id;
            req.session.username = user.username;
            req.session.role = user.role;
            if (rememberMe) {
                req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000;
            }
            resolve();
        });
    });
}

router.post('/register', authLimiter, async (req, res) => {
    const { username, password } = req.body;
    const error = validateCredentials(username, password);
    if (error) {
        return res.status(400).json({ error });
    }

    const cleanName = username.trim().toLowerCase();
    if (await db.getUserByUsername(cleanName)) {
        return res.status(409).json({ error: 'That username is already taken.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await db.addUser({ username: cleanName, passwordHash });

    await startSession(req, user);
    res.status(201).json({ username: user.username });
});

router.post('/login', authLimiter, async (req, res) => {
    const { username, password, rememberMe } = req.body;
    if (typeof username !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    const user = await db.getUserByUsername(username.trim());
    const passwordOk = user && await bcrypt.compare(password, user.passwordHash);

    if (!passwordOk) {
        return res.status(401).json({ error: 'Incorrect username or password.' });
    }

    await startSession(req, user, rememberMe);
    res.json({ success: true, username: user.username, role: user.role });
});

router.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ success: true });
    });
});

router.get('/api/whoami', (req, res) => {
    if (!req.session.userId) {
        return res.json({ loggedIn: false });
    }
    res.json({
        loggedIn: true,
        userId: req.session.userId,
        username: req.session.username,
        role: req.session.role
    });
});

async function ensureAdmin() {
    const existing = await db.getUserByUsername(process.env.ADMIN_USERNAME);
    if (existing) return;

    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    await db.addUser({ username: process.env.ADMIN_USERNAME, passwordHash, role: 'admin' });
    console.log('Created admin account');
}

module.exports = { authRouter: router, ensureAdmin };
