const asyncHandler      = require('express-async-handler');
const { OAuth2Client }  = require('google-auth-library');
const User              = require('../models/User');
const { generateToken } = require('../utils/generateToken');
 
const googleAuth = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    res.status(400); throw new Error('Google credential is required');
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    res.status(500); throw new Error('Server misconfiguration: GOOGLE_CLIENT_ID is not set in .env');
  }

  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken:  credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    console.error('[Google Auth] Token verification failed:', err.message);
    let msg = 'Google sign-in failed — please try again';
    if (err.message?.includes('Token used too late'))  msg = 'Token expired — please sign in again';
    if (err.message?.includes('Invalid token'))        msg = 'Invalid Google token — check GOOGLE_CLIENT_ID in .env matches your Google Console';
    if (err.message?.includes('audience'))             msg = 'Client ID mismatch — make sure VITE_GOOGLE_CLIENT_ID (frontend) and GOOGLE_CLIENT_ID (backend) are identical';
    res.status(401); throw new Error(msg);
  }

  const { sub: googleId, email, name, picture } = payload;

  if (!email) { res.status(400); throw new Error('Google account has no email'); }

  // Block if this email is already a student account
  const existingStudent = await User.findOne({ email, role: 'student' });
  if (existingStudent) {
    res.status(403);
    throw new Error('This email is already registered as a student account');
  }

  // Find or create the teacher
  let teacher = await User.findOne({ googleId });

  if (!teacher) {
    const byEmail = await User.findOne({ email: email.toLowerCase(), role: 'teacher' });
    if (byEmail) {
      if (!byEmail.googleId) byEmail.googleId = googleId;
      byEmail.googleEmail = email;
      if (picture && !byEmail.avatar) byEmail.avatar = picture;
      byEmail.lastLogin = new Date();
      try { await byEmail.save(); } catch (e) { /* ignore dup key on googleId */ }
      teacher = byEmail;
    } else {
      try {
        teacher = await User.create({
          name, email: email.toLowerCase(), googleId,
          googleEmail: email,
          avatar:   picture || '',
          role:     'teacher',
          lastLogin: new Date(),
        });
        console.log(`[Google Auth] New teacher account created: ${email}`);
      } catch (createErr) {
        if (createErr.code === 11000) {
          // Duplicate - find and return existing account
          teacher = await User.findOne({ email: email.toLowerCase() });
          if (!teacher) { res.status(409); throw new Error('Account conflict — please try again'); }
          if (teacher.role !== 'teacher') { res.status(403); throw new Error('This email is already a student account'); }
          if (!teacher.googleId) { teacher.googleId = googleId; teacher.lastLogin = new Date(); await teacher.save({ validateBeforeSave: false }); }
        } else throw createErr;
      }
    }
  } else {
    teacher.name      = name;
    teacher.lastLogin = new Date();
    if (picture) teacher.avatar = picture;
    await teacher.save();
  }

  if (!teacher.isActive) {
    res.status(403); throw new Error('Account deactivated. Contact admin.');
  }

  const token = generateToken(teacher._id, teacher.role);
  console.log(`[Google Auth] Teacher signed in: ${email}`);
  res.json({ success: true, token, user: sanitize(teacher) });
});

const teacherRegister = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400); throw new Error('Name, email, and password are required');
  }
  if (password.length < 6) {
    res.status(400); throw new Error('Password must be at least 6 characters');
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    res.status(409); throw new Error('An account with this email already exists');
  }

  const teacher = await User.create({
    name:  name.trim(),
    email: email.toLowerCase().trim(),
    password,
    role: 'teacher',
    lastLogin: new Date(),
  });

  console.log(`[Teacher Register] New teacher created via email: ${email}`);
  const token = generateToken(teacher._id, teacher.role);
  res.status(201).json({ success: true, token, user: sanitize(teacher) });
});

const teacherLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400); throw new Error('Email and password are required');
  }

  const teacher = await User.findOne({
    email: email.toLowerCase().trim(),
    role:  'teacher',
  }).select('+password');

  if (!teacher || !teacher.password) {
    res.status(401); throw new Error('Invalid email or password');
  }

  const match = await teacher.matchPassword(password);
  if (!match) {
    res.status(401); throw new Error('Invalid email or password');
  }

  if (!teacher.isActive) {
    res.status(403); throw new Error('Account deactivated. Contact admin.');
  }

  teacher.lastLogin = new Date();
  await teacher.save({ validateBeforeSave: false });

  const token = generateToken(teacher._id, teacher.role);
  console.log(`[Teacher Login] Email sign-in: ${email}`);
  res.json({ success: true, token, user: sanitize(teacher) });
});

const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400); throw new Error('Username and password are required');
  }

  const user = await User.findOne({
    username: username.toLowerCase().trim(),
    role: 'student',
  }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401); throw new Error('Invalid username or password');
  }
  if (!user.isActive) {
    res.status(403); throw new Error('Account deactivated. Contact your teacher.');
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id, user.role);
  res.json({ success: true, token, user: sanitize(user) });
});

const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: sanitize(req.user) });
});

const updateProfile = asyncHandler(async (req, res) => {
  ['name', 'phone', 'subject', 'department'].forEach(f => {
    if (req.body[f] !== undefined) req.user[f] = req.body[f];
  });
  if (req.file) {
    req.user.avatar        = req.file.path;
    req.user.avatarPublicId = req.file.filename;
  }
  await req.user.save();
  res.json({ success: true, user: sanitize(req.user) });
});

const changePassword = asyncHandler(async (req, res) => {
  // Block Google-only teachers (they have no password)
  if (req.user.role === 'teacher' && req.user.googleId && !req.user.password) {
    res.status(400); throw new Error('Your account uses Google sign-in — use Forgot Password if you also have email login');
  }
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) { res.status(400); throw new Error('Both passwords required'); }
  if (newPassword.length < 6) { res.status(400); throw new Error('Min 6 characters'); }

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) {
    res.status(400); throw new Error('Current password is incorrect');
  }
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password changed successfully' });
});

// strip sensitive fields before sending to client
const sanitize = u => ({
  _id:       u._id,
  name:      u.name,
  email:     u.email,
  username:  u.username,
  role:      u.role,
  avatar:    u.avatar,
  rollNo:    u.rollNo,
  class:     u.class,
  phone:     u.phone,
  subject:   u.subject,
  department:u.department,
  isActive:  u.isActive,
  lastLogin: u.lastLogin,
  createdAt: u.createdAt,
  googleId:  u.googleId ? true : false,
  studentRef: u.studentRef,
  createdBy: u.createdBy,
  // Premium fields
  premiumPlan:   u.premiumPlan   || null,
  premiumExpiry: u.premiumExpiry || null,
  premiumActive: !!(u.premiumActive && u.premiumExpiry && u.premiumExpiry > new Date()),
});

const crypto = require('crypto');

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) { res.status(400); throw new Error('Email is required'); }

  const user = await User.findOne({ email: email.toLowerCase(), role: 'teacher' });
  // Always respond success — don't reveal if email exists (security)
  if (!user || user.googleId) {
    return res.json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
  }

  // Generate a secure token
  const token   = crypto.randomBytes(32).toString('hex');
  const expiry  = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  user.resetToken       = token;
  user.resetTokenExpiry = expiry;
  await user.save({ validateBeforeSave: false });

  // Build reset URL
  const clientUrl  = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetUrl   = `${clientUrl}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

  
  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from:    `"StudentHub" <${process.env.SMTP_USER}>`,
      to:      user.email,
      subject: 'Reset your StudentHub password',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9f8f6;border-radius:12px">
          <h2 style="color:#1a1916;margin-bottom:8px">Password Reset</h2>
          <p style="color:#6b6a67">Hi ${user.name},</p>
          <p style="color:#6b6a67">Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
          <a href="${resetUrl}" style="display:inline-block;margin:20px 0;padding:12px 28px;background:#1a1916;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
            Reset Password
          </a>
          <p style="color:#aaa;font-size:12px">If you didn't request this, ignore this email. Your password won't change.</p>
        </div>
      `,
    });
  } catch (mailErr) {
    console.error('SMTP error:', mailErr.message);
    // Don't fail the request — just log it. Admins without SMTP can see the token in DB.
  }

  res.json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, email, password } = req.body;
  if (!token || !email || !password) { res.status(400); throw new Error('Token, email and new password are required'); }
  if (password.length < 6) { res.status(400); throw new Error('Password must be at least 6 characters'); }

  const user = await User.findOne({
    email:            email.toLowerCase(),
    resetToken:       token,
    resetTokenExpiry: { $gt: new Date() }, // not expired
  }).select('+password');

  if (!user) { res.status(400); throw new Error('Reset link is invalid or has expired'); }

  user.password         = password;
  user.resetToken       = null;
  user.resetTokenExpiry = null;
  await user.save();

  res.json({ success: true, message: 'Password reset successfully. You can now sign in.' });
});

module.exports = {
  googleAuth, teacherRegister, teacherLogin,
  login, getMe, updateProfile, changePassword,
  forgotPassword, resetPassword,
};
