import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Naam zaroori hai'], trim: true, maxlength: 60 },
    email: {
      type: String,
      required: [true, 'Email zaroori hai'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Sahi email likhein'],
    },
    password: {
      type: String,
      required: [true, 'Password zaroori hai'],
      minlength: [6, 'Password kam az kam 6 characters ka ho'],
      select: false,
    },
    avatar: { url: String, publicId: String },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String, select: false },
    verificationExpires: { type: Date, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    // logout / password change par barhta hai -> purane tokens invalid ho jate hain
    tokenVersion: { type: Number, default: 0, select: false },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Random token banata hai; DB mein sirf hash save hota hai, raw token email mein jata hai
userSchema.methods.createToken = function (type, minutes) {
  const raw = crypto.randomBytes(32).toString('hex');
  const hashed = crypto.createHash('sha256').update(raw).digest('hex');
  if (type === 'verify') {
    this.verificationToken = hashed;
    this.verificationExpires = Date.now() + minutes * 60 * 1000;
  } else {
    this.resetPasswordToken = hashed;
    this.resetPasswordExpires = Date.now() + minutes * 60 * 1000;
  }
  return raw;
};

export const hashToken = (raw) => crypto.createHash('sha256').update(raw).digest('hex');

export default mongoose.model('User', userSchema);
