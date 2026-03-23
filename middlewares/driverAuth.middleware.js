// middlewares/auth.middleware.js
const jwt = require("jsonwebtoken");

const authenticateDriver = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.driver = decoded;
        next();
    } catch {
        return res.status(401).json({ error: "Invalid token" });
    }
};

module.exports = { authenticateDriver };