import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

// Protected routes: Authorization: Bearer <token>
export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new AppError('Login zaroori hai', 401);

  let decoded;
  try {
    decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
  } catch {
    throw new AppError('Token ghalat ya expire ho chuka hai', 401);
  }

  const user = await User.findById(decoded.id).select('+tokenVersion');
  if (!user) throw new AppError('User maujood nahi', 401);
  if (user.tokenVersion !== decoded.tv) throw new AppError('Token invalid hai, dobara login karein', 401);

  req.user = user;
  next();
});
