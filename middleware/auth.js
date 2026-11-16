const jwt = require("jsonwebtoken");

// Checks the "Authorization: Bearer <token>" header and sets req.userId
module.exports = function auth(req, res, next) {
  const header = req.get("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Please log in first." });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.id;
    next();
  } catch (err) {
    res.status(401).json({ error: "Your session has expired. Please log in again." });
  }
};
