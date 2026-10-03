const jwt = require("jsonwebtoken");

const middleWare = async (req, res, next) => {
  try {
    // 1. Read token from cookie FIRST, fallback to Authorization header
    let token = req.cookies?.token;

    if (!token && req.headers["authorization"]) {
      const authHeader = req.headers["authorization"];
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      return res.status(401).send({
        message: "No token provided",
        success: false,
      });
    }

    // 2. Verify token
    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
      if (err) {
        return res.status(401).send({
          message: "Unauthorized Access",
          success: false,
        });
      }

      if (!req.body || typeof req.body !== "object") {
        req.body = {};
      }

      req.userId = decoded.userId || decoded.id;
      req.role = decoded.role; // <-- Added req.role from JWT token
      req.body.userId = req.userId;
      
      next();
    });
  } catch (error) {
    return res.status(401).send({
      message: "Auth error",
      success: false,
    });
  }
};

module.exports = middleWare;