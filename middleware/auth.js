// For API routes: JavaScript gets a clear JSON error
function requireAuth(req, res, next) {
    if (!req.session?.userId) {
        return res.status(401).json({ error: 'Please log in first.' });
    }
    next();
}

// For pages: people get sent to the login page
function requireLoginPage(req, res, next) {
    if (!req.session?.userId) {
        return res.redirect('/');
    }
    next();
}

// For admin-only pages: everyone else goes back to the home page
function requireAdminPage(req, res, next) {
    if (req.session.role !== 'admin') {
        return res.redirect('/');
    }
    next();
}

module.exports = { requireAuth, requireLoginPage, requireAdminPage };
