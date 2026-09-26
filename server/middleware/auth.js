import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyToken } from '../utils/tokens.js';

export const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) throw new ApiError(401, 'Please log in to continue.');
  const payload = verifyToken(token);
  if (payload.purpose !== 'access') throw new ApiError(401, 'Please log in to continue.');
  const user = await User.findById(payload.sub);
  if (!user) throw new ApiError(401, 'Please log in to continue.');
  req.user = user;
  next();
});

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new ApiError(403, 'You do not have permission to perform this action.'));
      return;
    }
    next();
  };
}
