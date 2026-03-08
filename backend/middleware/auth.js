const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Get token from header
  const token = req.header('Authorization');

  // Check if not token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token (Bearer token format is standard)
    const tokenString = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
    
    // In a real app the secret should be in .env, defaulting for hackathon
    const secret = process.env.JWT_SECRET || 'hackathon_secret_key';
    const decoded = jwt.verify(tokenString, secret);

    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
