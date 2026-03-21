const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const signup = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Default to 'ENGINEERING' if role not provided, or reject depending on business rules.
    // For this system, we'll allow specifying role during signup for easy testing.
    const userRole = role || 'ENGINEERING';

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash,
        role: userRole,
      },
    });

    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        action: 'SIGNUP',
        affected_type: 'USER',
        affected_id: user.id,
        smart_summary: `User ${name} signed up as ${userRole}`
      }
    });

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

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

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or inactive account' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        action: 'LOGIN',
        affected_type: 'USER',
        affected_id: user.id,
        smart_summary: `User ${user.name} logged in`
      }
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
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, name: true, email: true, role: true, is_active: true, created_at: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login, getMe };
