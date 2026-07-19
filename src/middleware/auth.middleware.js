function protect(req, res, next) {
  req.user = {
    id: req.headers['user-id'],
    role: req.headers['role'],
    email: req.headers['email']
  };
  next();
}

function adminOnly(req, res, next) {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    const error = new Error("Access denied: Administrator privileges required");
    error.status = 403;
    next(error);
  }
}

module.exports = { protect, adminOnly };