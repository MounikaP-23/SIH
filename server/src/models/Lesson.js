const mongoose = require('mongoose');

const quizQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  options: [{
    type: String,
    required: true
  }],
  correctAnswer: {
    type: Number,
    required: true,
    min: 0,
    max: 3
  }
});

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true,
    enum: ['Math', 'Science', 'English', 'Punjabi', 'Social Studies', 'Computer Science']
  },
  category: {
    type: String,
    enum: ['Digital Skills', 'School Subjects', 'Life Skills'],
    required: true
  },
  classLevel: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  language: {
    type: String,
    enum: ['en', 'hi', 'pa'],
    default: 'en'
  },
  contentType: {
    type: String,
    enum: ['text', 'video', 'image', 'mixed'],
    default: 'text'
  },
  content: {
    type: String,
    required: true
  },
  // Optional translations for multilingual content
  translations: {
    hi: {
      title: { type: String },
      description: { type: String },
      content: { type: String },
    },
    pa: {
      title: { type: String },
      description: { type: String },
      content: { type: String },
    }
  },
  videoLink: {
    type: String
  },
  images: [{
    type: String
  }],
  attachments: [{
    type: String
  }],
  quiz: {
    questions: [quizQuestionSchema],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Lesson', lessonSchema);
