const path = require('path');
const { writeLog } = require('./logger');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Runs only if no route or static file answered
function notFound(req, res) {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Not found' });
    }
    res.status(404).sendFile(path.join(PUBLIC_DIR, '404.html'));
}

// The 4 parameters tell Express this handles errors
function errorHandler(err, req, res, next) {
    console.error(err);
    writeLog(`[${new Date().toISOString()}] ERROR ${req.method} ${req.path}: ${err.message}`);

    if (res.headersSent) return next(err);

    const status = err.status || 500;
    const message = status < 500 ? err.message : 'Something went wrong on our end.';

    if (req.path.startsWith('/api/')) {
        return res.status(status).json({ error: message });
    }
    res.status(status).send('<h1>Something went wrong</h1><p>Please try again later.</p><a href="/">Back to home</a>');
}

module.exports = { notFound, errorHandler };
