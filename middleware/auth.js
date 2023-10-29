// Import required modules
const jwt = require("jsonwebtoken");
require("dotenv").config(); // Load environment variables from a .env file

// Authentication middleware function
function auth(req, res, next) {
  const token = req.header("x-auth-token"); // Get the token from request headers

  // Check for token presence
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    // Verify the token using the secret from environment variables
    const decoded = jwt.verify(token, process.env.jwtSecret);
    // Add user information from the token payload to the request object
    req.user = decoded;
    // Call the next middleware function in the chain
    next();
  } catch (e) {
    // Handle token verification errors
    res.status(400).json({ msg: "Token is not valid" });
  }
}

module.exports = auth; // Export the authentication middleware function for use in other parts of the application
