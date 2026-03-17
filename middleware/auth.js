function isAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
}

function isNotAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
        res.redirect('/dashboard');
    } else {
        next();
    }
}

module.exports = {
    isAuthenticated,
    isNotAuthenticated,
};
