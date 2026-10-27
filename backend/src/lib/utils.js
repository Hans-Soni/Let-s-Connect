import * as keys from './keyRotation.js';
import { ENV } from './env.js';

/**
 * Issues a 15-minute JWT (signed by the current rotating key) and sets it as an httpOnly cookie.
 * Cookie max-age is deliberately kept at 1 day so the browser keeps it around for the
 * silent-refresh flow (checkAuth); the short JWT expiry enforces the actual session window.
 */
export const generateToken = (userId, res) => {
  const token = keys.signJwt({ userId });

  res.cookie('jwt', token, {
    maxAge: 24 * 60 * 60 * 1000, // cookie persists 1 day in browser so silent-refresh can work
    httpOnly: true,               // prevent XSS attacks: cross-site scripting
    sameSite: ENV.NODE_ENV !== 'development' ? 'none' : 'strict', // CSRF protection
    secure: ENV.NODE_ENV !== 'development',
    partitioned: true,
  });

  return token;
};
