import * as keys from '../lib/keyRotation.js';
import User from '../models/User.js';

export const socketAuthMiddleware = async (socket, next) => {
  try {
    let token = socket.handshake.query.token;
    if (!token) {
      token = socket.handshake.headers.cookie
        ?.split('; ')
        .find((row) => row.startsWith('jwt='))
        ?.split('=')[1];
    }

    if (!token) {
      console.log('Socket connection rejected: No token provided');
      return next(new Error('Unauthorized - No Token Provided'));
    }

    // verify the token against the rotating key ring
    const decoded = keys.verifyJwt(token);
    if (!decoded) {
      console.log('Socket connection rejected: Invalid token');
      return next(new Error('Unauthorized - Invalid Token'));
    }

    // find the user from db
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      console.log('Socket connection rejected: User not found');
      return next(new Error('User not found'));
    }

    // attach user info to socket
    socket.user = user;
    socket.userId = user._id.toString();

    console.log(`Socket authenticated for user: ${user.fullName} (${user._id})`);

    next();
  } catch (error) {
    console.log('Error in socket authentication:', error.message);
    next(new Error('Unauthorized - Authentication failed'));
  }
};
