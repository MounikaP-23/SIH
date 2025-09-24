const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// In-memory OTP store for development (mobile -> { code, expiresAt })
const otpStore = new Map();

// @route   POST /api/auth/otp/request
// @desc    Request OTP for mobile (Parent login)
// @access  Public
router.post('/otp/request', async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile) return res.status(400).json({ message: 'Mobile is required' });
    const code = ('' + Math.floor(100000 + Math.random() * 900000)).slice(-6);
    const expiresAt = Date.now() + 5 * 60 * 1000;
    otpStore.set(mobile, { code, expiresAt });
    // For dev: return the code in response; in production send via SMS
    return res.json({ message: 'OTP sent', code });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/otp/verify
// @desc    Verify OTP and login/create Parent user
// @access  Public
router.post('/otp/verify', async (req, res) => {
  try {
    const { mobile, code, name, preferredLanguage } = req.body;
    if (!mobile || !code) return res.status(400).json({ message: 'Mobile and code are required' });
    const entry = otpStore.get(mobile);
    if (!entry) return res.status(400).json({ message: 'Request OTP first' });
    if (Date.now() > entry.expiresAt) return res.status(400).json({ message: 'OTP expired' });
    if (entry.code !== code) return res.status(400).json({ message: 'Invalid OTP' });

    // Find or create Parent user by mobile
    let user = await User.findOne({ mobile });
    if (!user) {
      user = new User({
        name: name || 'Parent',
        mobile,
        role: 'Parent',
        languagePreference: preferredLanguage || 'en',
      });
      await user.save();
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'default_jwt_secret_key_123456789',
      { expiresIn: '7d' }
    );

    // One-time use
    otpStore.delete(mobile);

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        mobile: user.mobile,
        languagePreference: user.languagePreference,
        children: user.children || []
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/auth/me
// @desc    Update current user profile (e.g., language preference)
// @access  Private
router.patch('/me', auth, async (req, res) => {
  try {
    // Remove classLevel from allowed updates for students to keep it fixed
    const allowed = ['languagePreference', 'name', 'age'];
    if (req.user.role !== 'Student') {
      allowed.push('classLevel');
    }
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        age: user.age,
        classLevel: user.classLevel,
        languagePreference: user.languagePreference
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/signup
// @desc    Register user
// @access  Public
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role, age, classLevel, languagePreference } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create user
    const user = new User({
      name,
      email,
      password,
      role: role || 'Student',
      age,
      classLevel,
      languagePreference
    });

    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'default_jwt_secret_key_123456789',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        age: user.age,
        classLevel: user.classLevel,
        languagePreference: user.languagePreference,
        studentCode: user.studentCode
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'default_jwt_secret_key_123456789',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        age: user.age,
        classLevel: user.classLevel,
        languagePreference: user.languagePreference,
        studentCode: user.studentCode
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      age: req.user.age,
      classLevel: req.user.classLevel,
      languagePreference: req.user.languagePreference,
      studentCode: req.user.studentCode
    }
  });
});

// @route   GET /api/auth/users
// @desc    Get all users (Admin only)
// @access  Private
router.get('/users', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/teacher/students
// @desc    Get all students (Teacher/Admin)
// @access  Private
router.get('/teacher/students', auth, authorize('Teacher', 'Admin'), async (req, res) => {
  try {
    const students = await User.find({ role: 'Student' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/parent/link-child
// @desc    Link a child to parent using studentCode
// @access  Private (Parent)
router.post('/parent/link-child', auth, authorize('Parent'), async (req, res) => {
  try {
    const { studentCode } = req.body;
    if (!studentCode) return res.status(400).json({ message: 'Student code is required' });

    // Find student by studentCode
    const student = await User.findOne({ studentCode, role: 'Student' });
    if (!student) return res.status(404).json({ message: 'Student not found with this code' });

    // Check if already linked
    if (req.user.children.includes(student._id)) {
      return res.status(400).json({ message: 'Child already linked' });
    }

    // Add to parent's children
    req.user.children.push(student._id);
    await req.user.save();

    res.json({ message: 'Child linked successfully', child: { id: student._id, name: student.name, studentCode: student.studentCode } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/parent/children
// @desc    Get parent's children with details
// @access  Private (Parent)
router.get('/parent/children', auth, authorize('Parent'), async (req, res) => {
  try {
    const parent = await User.findById(req.user._id).populate('children', 'name email age classLevel studentCode');
    res.json({ children: parent.children });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
