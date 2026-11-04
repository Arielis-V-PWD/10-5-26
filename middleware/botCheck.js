const { writeLog } = require('./logger');

const MIN_FILL_TIME = 2000; // 2 seconds, in milliseconds

function logBot(req, reason) {
    writeLog(`[${new Date().toISOString()}] BOT BLOCKED (${reason}) from ${req.ip} on ${req.path}`);
}

// Blocks bot submissions; bots get a fake "success"
function botCheck(req, res, next) {
    if (req.body.website) {
        logBot(req, 'honeypot filled');
        return res.status(201).json({});
    }

    const loadedAt = req.session.formLoadedAt;
    if (!loadedAt || Date.now() - loadedAt < MIN_FILL_TIME) {
        logBot(req, 'submitted too fast');
        return res.status(201).json({});
    }

    next();
}

module.exports = { botCheck };
