import QRCode from 'qrcode';
import User, { hashToken } from '../models/User.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { signToken } from '../utils/token.js';
import sendEmail from '../utils/sendEmail.js';
import { uploadBuffer, deleteImage } from '../utils/uploadToCloudinary.js';

const baseUrl = () => process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  isVerified: u.isVerified,
  avatar: u.avatar?.url || null,
  createdAt: u.createdAt,
});

const sendVerificationEmail = async (user) => {
  const raw = user.createToken('verify', 24 * 60);
  await user.save({ validateBeforeSave: false });
  const link = `${baseUrl()}/api/auth/verify-email/${raw}`;
  await sendEmail({
    to: user.email,
    subject: 'Apna email verify karein',
    html: `<p>Salam ${user.name},</p><p>Email verify karne ke liye neeche link par click karein (24 ghante valid):</p><p><a href="${link}">${link}</a></p>`,
  });
};

// 1) SIGNUP
export const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const user = await User.create({ name, email, password });
  await sendVerificationEmail(user);
  res.status(201).json({
    success: true,
    message: 'Account ban gaya. Verification email check karein.',
    token: signToken(user),
    user: publicUser(user),
  });
});

// 2) LOGIN
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Email aur password dono dein', 400);

  const user = await User.findOne({ email }).select('+password +tokenVersion');
  if (!user || !(await user.comparePassword(password))) throw new AppError('Email ya password ghalat hai', 401);

  if (process.env.REQUIRE_VERIFIED === 'true' && !user.isVerified)
    throw new AppError('Pehle apna email verify karein', 403);

  res.json({ success: true, token: signToken(user), user: publicUser(user) });
});

// 3) LOGOUT - tokenVersion barha dete hain, is user ke tamam purane tokens invalid
export const logout = asyncHandler(async (req, res) => {
  req.user.tokenVersion += 1;
  await req.user.save({ validateBeforeSave: false });
  res.json({ success: true, message: 'Logout ho gaye' });
});

// 4) EMAIL VERIFY (email ke link se, GET)
export const verifyEmail = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    verificationToken: hashToken(req.params.token),
    verificationExpires: { $gt: Date.now() },
  }).select('+verificationToken +verificationExpires');
  if (!user) throw new AppError('Link ghalat ya expire ho chuka hai', 400);

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationExpires = undefined;
  await user.save({ validateBeforeSave: false });
  res.json({ success: true, message: 'Email verify ho gaya!' });
});

// 4b) Verification email dobara bhejna
export const resendVerification = asyncHandler(async (req, res) => {
  if (req.user.isVerified) throw new AppError('Email pehle se verified hai', 400);
  await sendVerificationEmail(req.user);
  res.json({ success: true, message: 'Verification email dobara bhej di' });
});

// 5) FORGOT PASSWORD
export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  // Hamesha same jawab - taake koi email guess na kar sake
  const reply = { success: true, message: 'Agar email registered hai to reset link bhej diya gaya hai' };
  if (!user) return res.json(reply);

  const raw = user.createToken('reset', 15);
  await user.save({ validateBeforeSave: false });
  const link = `${process.env.CLIENT_URL || baseUrl()}/reset-password/${raw}`;
  await sendEmail({
    to: user.email,
    subject: 'Password reset',
    html: `<p>Password reset ke liye (15 minute valid):</p><p><a href="${link}">${link}</a></p><p>Token: <code>${raw}</code></p>`,
  });
  res.json(reply);
});

// 6) RESET PASSWORD
export const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password) throw new AppError('Naya password dein', 400);

  const user = await User.findOne({
    resetPasswordToken: hashToken(req.params.token),
    resetPasswordExpires: { $gt: Date.now() },
  }).select('+resetPasswordToken +resetPasswordExpires +tokenVersion');
  if (!user) throw new AppError('Token ghalat ya expire ho chuka hai', 400);

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  user.tokenVersion += 1; // purane tokens band
  await user.save();
  res.json({ success: true, message: 'Password reset ho gaya, ab login karein' });
});

// 7) CHANGE PASSWORD
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new AppError('Purana aur naya password dono dein', 400);

  const user = await User.findById(req.user._id).select('+password +tokenVersion');
  if (!(await user.comparePassword(currentPassword))) throw new AppError('Purana password ghalat hai', 401);

  user.password = newPassword;
  user.tokenVersion += 1;
  await user.save();
  res.json({ success: true, message: 'Password change ho gaya', token: signToken(user) });
});

// 8) GET CURRENT USER
export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: publicUser(req.user) });
});

// BONUS: Avatar upload (Multer + streamifier + Cloudinary)
export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Image select karein (field name: avatar)', 400);
  if (req.user.avatar?.publicId) await deleteImage(req.user.avatar.publicId);

  const result = await uploadBuffer(req.file.buffer);
  req.user.avatar = { url: result.secure_url, publicId: result.public_id };
  await req.user.save({ validateBeforeSave: false });
  res.json({ success: true, avatar: req.user.avatar.url });
});

// BONUS: QR code (user ki profile info ka)
export const getMyQR = asyncHandler(async (req, res) => {
  const payload = JSON.stringify({ id: req.user._id, email: req.user.email });
  const qr = await QRCode.toDataURL(payload);
  res.json({ success: true, qr });
});
