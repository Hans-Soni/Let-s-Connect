import * as keys from '../lib/keyRotation.js';
import User from '../models/User.js';

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    if (!token) return res.status(401).json({ message: 'Unauthorized - No token provided' });

    const decoded = keys.verifyJwt(token);
    if (!decoded) return res.status(401).json({ message: 'Unauthorized - Invalid token' });

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    req.user = user;
    next();
  } catch (error) {
    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError' ||
      error.message === 'JWT key version expired or unknown'
    ) {
      return res.status(401).json({ message: 'Unauthorized - Invalid or expired token' });
    }
    console.log('Error in protectRoute middleware:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
