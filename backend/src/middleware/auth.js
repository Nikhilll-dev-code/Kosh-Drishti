const jwt = require('jsonwebtoken');
const store = require('../models/store');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not configured. Please set it in the backend .env file.');
}

/**
 * Standardized Error Response Formatter (SRS Section 9.1)
 */
function sendError(res, httpStatus, errorCode, message) {
  const traceId = 'TR-' + Math.random().toString(36).substring(2, 10).toUpperCase();
  console.error(`[API ERROR ${httpStatus}] ${errorCode}: ${message} (Trace: ${traceId})`);
  return res.status(httpStatus).json({
    error_code: errorCode,
    message: message,
    http_status: httpStatus,
    trace_id: traceId
  });
}

/**
 * Optional Auth Middleware (Attaches user if valid token present, doesn't block public requests)
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = { role: 'Public', user_id: 'guest', email: 'guest@public' };
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = store.getUserById(decoded.user_id);
    if (!user || user.status === 'Deactivated') {
      req.user = { role: 'Public', user_id: 'guest', email: 'guest@public' };
      return next();
    }
    req.user = user;
    next();
  } catch (err) {
    req.user = { role: 'Public', user_id: 'guest', email: 'guest@public' };
    next();
  }
}

/**
 * Strict Auth Middleware (Requires valid logged-in user, returns 401 ERR-AUTH-01)
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 401, 'ERR-AUTH-01', 'Your session has expired — please log in again.');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = store.getUserById(decoded.user_id);
    if (!user) {
      return sendError(res, 401, 'ERR-AUTH-01', 'User account not found.');
    }
    if (user.status === 'Pending') {
      return sendError(res, 403, 'ERR-AUTH-03', 'Your account is pending administrator approval.');
    }
    if (user.status === 'Deactivated') {
      return sendError(res, 403, 'ERR-AUTH-03', 'Your account has been deactivated.');
    }
    req.user = user;
    next();
  } catch (err) {
    return sendError(res, 401, 'ERR-AUTH-01', 'Your session has expired — please log in again.');
  }
}

/**
 * RBAC Role Check Middleware (Returns 403 ERR-AUTH-03 if role doesn't meet requirement)
 */
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return sendError(res, 403, 'ERR-AUTH-03', 'You don\'t have permission to do that.');
    }
    next();
  };
}

module.exports = {
  JWT_SECRET,
  sendError,
  optionalAuth,
  requireAuth,
  requireRole
};
