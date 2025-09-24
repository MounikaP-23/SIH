const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  // Email/password are required for Student/Teacher/Admin accounts;
  // Parents may login via mobile OTP without email/password.
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    minlength: 6
  },
  mobile: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['Student', 'Teacher', 'Admin', 'Parent'],
    default: 'Student'
  },
  age: {
    type: Number,
    min: 5,
    max: 100
  },
  classLevel: {
    type: Number,
    min: 1,
    max: 12
  },
  // Unique code for Student accounts to be shared with parents for linking
  studentCode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  // For Parent accounts: linked children (Users with role 'Student')
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  languagePreference: {
    type: String,
    enum: ['en', 'hi', 'pa'],
    default: 'en'
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash if password is set/modified
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Generate a unique studentCode for Student users if missing
userSchema.pre('save', async function(next) {
  try {
    if (this.role === 'Student' && !this.studentCode) {
      // Try a few times to generate a unique code
      for (let i = 0; i < 5; i++) {
        const code = generateStudentCode();
        const exists = await mongoose.model('User').findOne({ studentCode: code }).lean();
        if (!exists) {
          this.studentCode = code;
          break;
        }
      }
      if (!this.studentCode) {
        return next(new Error('Failed to generate unique student code'));
      }
    }
    next();
  } catch (err) {
    next(err);
  }
});

function generateStudentCode() {
  // Format: CLS-XXXXXX where X is alphanumeric uppercase
  const part = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  return `CLS-${part}`;
}

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
