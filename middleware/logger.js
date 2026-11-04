const fs = require('fs');
const path = require('path');

// '..' means "up one folder", so server.log stays next to server.js
const LOG_FILE = path.join(__dirname, '..', 'server.log');

// Trim the log file if it has gotten too big
if (fs.existsSync(LOG_FILE) && fs.statSync(LOG_FILE).size > 128 * 1024) {
    const recentLines = fs.readFileSync(LOG_FILE, 'utf8').split('\n').slice(-100);
    fs.writeFileSync(LOG_FILE, recentLines.join('\n'));
}

// Prints a line and saves it to server.log
function writeLog(line) {
    console.log(line);
    fs.appendFile(LOG_FILE, line + '\n', (err) => {
        if (err) console.error('Log write failed:', err);
    });
}

// Logs every request
function requestLogger(req, res, next) {
    writeLog(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
}

module.exports = { writeLog, requestLogger };
