const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, AuditLog } = require('../lib/prisma');
const { Op } = require('sequelize');

const signup = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const userRole = role || 'ENGINEERING';

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email, password_hash, role: userRole });

    await AuditLog.create({
      user_id: user.id,
      action: 'SIGNUP',
      affected_type: 'USER',
      affected_id: user.id,
      smart_summary: `User ${name} signed up as ${userRole}`,
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      success: true,
      data: { id: user.id, name: user.name, email: user.email, role: user.role, token },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or inactive account' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    await AuditLog.create({
      user_id: user.id,
      action: 'LOGIN',
      affected_type: 'USER',
      affected_id: user.id,
      smart_summary: `User ${user.name} logged in`,
    });

    res.status(200).json({
      success: true,
      data: { id: user.id, name: user.name, email: user.email, role: user.role, token },
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: { id: req.user.userId },
      attributes: ['id', 'name', 'email', 'role', 'is_active', 'created_at'],
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if user exists or not for security, just send success
      return res.status(200).json({ success: true, message: 'If that email is in our database, we will send a password reset link.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = await bcrypt.hash(resetToken, 10);
    
    // Set token and expiry (1 hour)
    await user.update({
      reset_token: resetTokenHash,
      reset_token_expires: new Date(Date.now() + 3600000)
    });

    const resetLink = `http://localhost:5173/reset-password/${resetToken}?email=${encodeURIComponent(email)}`;
    console.log(`\n\n=================================================`);
    console.log(`🔑 PASSWORD RESET LINK REQUESTED FOR: ${email}`);
    console.log(`🔗 Link: ${resetLink}`);
    console.log(`=================================================\n\n`);

    res.status(200).json({ 
      success: true, 
      message: 'If that email is in our database, we will send a password reset link.',
      dev_reset_link: resetLink
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, token, newPassword } = req.body;

    const user = await User.findOne({ 
      where: { 
        email,
        reset_token: { [Op.not]: null },
        reset_token_expires: { [Op.gt]: new Date() }
      } 
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token' });
    }

    const isValid = await bcrypt.compare(token, user.reset_token);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token' });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);
    
    await user.update({
      password_hash,
      reset_token: null,
      reset_token_expires: null
    });

    await AuditLog.create({
      user_id: user.id,
      action: 'UPDATE_PASSWORD',
      affected_type: 'USER',
      affected_id: user.id,
      smart_summary: `User ${user.name} reset their password via forgot password flow`,
    });

    res.status(200).json({ success: true, message: 'Password has been successfully reset. You can now login.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login, getMe, forgotPassword, resetPassword };
