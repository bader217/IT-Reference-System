const ADMIN_ROLES = new Set(['manager', 'admin']);
const CONTENT_ROLES = new Set(['employee', 'manager', 'admin']);

function getRequestUser(req) {
    const rawId = req.header('x-user-id');
    const role = (req.header('x-user-role') || '').trim();
    const username = (req.header('x-user-name') || '').trim();
    const id = Number(rawId);

    if (!Number.isFinite(id) || id <= 0 || !role) return null;

    return { id, role, username };
}

function requireAuth(req, res, next) {
    const user = getRequestUser(req);
    if (!user) {
        return res.status(401).json({ success: false, message: 'غير مصرح' });
    }
    req.user = user;
    next();
}

function requireAdmin(req, res, next) {
    const user = req.user || getRequestUser(req);
    if (!user || !ADMIN_ROLES.has(user.role)) {
        return res.status(403).json({ success: false, message: 'ممنوع' });
    }
    req.user = user;
    next();
}

function requireContentManager(req, res, next) {
    const user = req.user || getRequestUser(req);
    if (!user || !CONTENT_ROLES.has(user.role)) {
        return res.status(403).json({ success: false, message: 'ممنوع' });
    }
    req.user = user;
    next();
}

module.exports = {
    requireAuth,
    requireAdmin,
    requireContentManager
};