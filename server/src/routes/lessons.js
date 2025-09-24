const express = require('express');
const Lesson = require('../models/Lesson');
const Progress = require('../models/Progress');
const { auth, authorize } = require('../middleware/auth');
const QuizAttempt = require('../models/QuizAttempt');
const User = require('../models/User');

const router = express.Router();

// @route   POST /api/lessons
// @desc    Create a lesson
// @access  Private (Teacher/Admin)
router.post('/', auth, authorize('Teacher', 'Admin'), async (req, res) => {
  try {
    const lessonData = {
      ...req.body,
      createdBy: req.user._id
    };

    const lesson = new Lesson(lessonData);
    await lesson.save();

    // Find all students with the lesson's classLevel
    const students = await User.find({ role: 'Student', classLevel: lesson.classLevel });

    // Create Progress entries for each student linking to the lesson
    const progressEntries = students.map(student => ({
      student: student._id,
      lesson: lesson._id,
      isCompleted: false,
      quizScore: 0,
      totalQuestions: lesson.quiz?.questions?.length || 0,
      timeSpentSeconds: 0
    }));

    // Insert progress entries in bulk
    const Progress = require('../models/Progress');
    await Progress.insertMany(progressEntries);

    res.status(201).json(lesson);
  } catch (error) {
    console.error('Create lesson failed:', error);
    console.error(error.stack);
    // Mongoose validation error
    if (error?.name === 'ValidationError') {
      const details = Object.values(error.errors).map((e) => e.message).join(', ');
      return res.status(400).json({ message: `Validation error: ${details}` });
    }
    // Payload too large or other server errors
    const status = error?.type === 'entity.too.large' ? 413 : 500;
    return res.status(status).json({ message: error?.message || 'Server error while creating lesson' });
  }
});

// @route   GET /api/lessons
// @desc    Get all lessons with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { subject, classLevel, language, category, contentType } = req.query;
    const filter = {};

    if (subject) filter.subject = subject;
    if (classLevel) filter.classLevel = parseInt(classLevel);
    if (language) filter.language = language;
    if (category) filter.category = category;
    if (contentType) filter.contentType = contentType;

    const lessons = await Lesson.find(filter)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json(lessons);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/lessons/:id
// @desc    Get single lesson
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id)
      .populate('createdBy', 'name');

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    res.json(lesson);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/lessons/:id
// @desc    Update lesson
// @access  Private (Teacher/Admin)
router.put('/:id', auth, authorize('Teacher', 'Admin'), async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    // Check if user created this lesson or is admin
    if (lesson.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized to update this lesson' });
    }

    const updatedLesson = await Lesson.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name');

    res.json(updatedLesson);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Error updating lesson' });
  }
});

// @route   DELETE /api/lessons/:id
// @desc    Delete lesson
// @access  Private (Teacher/Admin)
router.delete('/:id', auth, authorize('Teacher', 'Admin'), async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    // Check if user created this lesson or is admin
    if (lesson.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized to delete this lesson' });
    }

    await Lesson.findByIdAndDelete(req.params.id);
    res.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/lessons/:id/complete
// @desc    Mark lesson as completed for student
// @access  Private (Student)
router.post('/:id/complete', auth, async (req, res) => {
  try {
    const { quizScore, totalQuestions, timeSpentSeconds } = req.body;
    const lessonId = req.params.id;
    const studentId = req.user._id;

    // Check if lesson exists
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    // Update or create progress
    const progress = await Progress.findOneAndUpdate(
      { student: studentId, lesson: lessonId },
      {
        student: studentId,
        lesson: lessonId,
        isCompleted: true,
        quizScore: quizScore || 0,
        totalQuestions: totalQuestions || 0,
        timeSpentSeconds: timeSpentSeconds || 0,
        completedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Record this as a quiz attempt as well (to support averages and history)
    if (typeof quizScore === 'number' && typeof totalQuestions === 'number') {
      try {
        await QuizAttempt.create({
          student: studentId,
          lesson: lessonId,
          score: quizScore,
          totalQuestions: totalQuestions
        });
      } catch (e) {
        console.error('Failed to create QuizAttempt:', e?.message);
      }
    }

    res.json(progress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/lessons/student/progress
// @desc    Get student's progress
// @access  Private (Student)
router.get('/student/progress', auth, async (req, res) => {
  try {
    const studentId = req.user._id;

    const progress = await Progress.find({ student: studentId })
      .populate('lesson', 'title subject classLevel')
      .sort({ completedAt: -1 })
      .lean();

    // Compute averages for this student's attempts per lesson
    const lessonIds = progress.map(p => p.lesson?._id).filter(Boolean);
    const attemptsAgg = await QuizAttempt.aggregate([
      { $match: { student: studentId, lesson: { $in: lessonIds } } },
      { $group: {
          _id: '$lesson',
          attemptsCount: { $sum: 1 },
          totalScore: { $sum: '$score' },
          totalQuestions: { $sum: '$totalQuestions' } // optional informational
        } }
    ]);

    const attemptsMap = new Map();
    attemptsAgg.forEach(a => {
      const avg = a.attemptsCount > 0 ? Math.round((a.totalScore / a.attemptsCount) * 100) / 100 : 0;
      attemptsMap.set(String(a._id), { attemptsCount: a.attemptsCount, averageScore: avg });
    });

    const enriched = progress.map(p => {
      const extra = attemptsMap.get(String(p.lesson?._id)) || { attemptsCount: 0, averageScore: 0 };
      return { ...p, attemptsCount: extra.attemptsCount, averageScore: extra.averageScore };
    });

    res.json(enriched);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/lessons/teacher/students-progress
// @desc    Teacher: view students' progress for lessons they created
// @access  Private (Teacher/Admin)
router.get('/teacher/students-progress', auth, authorize('Teacher', 'Admin'), async (req, res) => {
  try {
    // Find lessons created by this teacher
    const lessons = await Lesson.find({ createdBy: req.user._id }).select('_id title');
    const lessonIds = lessons.map(l => l._id);

    // Fetch progress for those lessons
    const progress = await Progress.find({ lesson: { $in: lessonIds } })
      .populate('student', 'name email classLevel')
      .populate('lesson', 'title subject classLevel')
      .sort({ updatedAt: -1 });

    res.json({ lessons, progress });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/lessons/student/quizzes
// @desc    Get quizzes available for the logged-in student's class
// @access  Private (Student)
router.get('/student/quizzes', auth, async (req, res) => {
  try {
    const classLevel = req.user.classLevel;
    const filter = {
      'quiz.isActive': { $ne: false },
      'quiz.questions.0': { $exists: true }
    };
    if (classLevel) {
      filter.classLevel = classLevel;
    }

    const quizzes = await Lesson.find(filter)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json(quizzes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/lessons/parent/children-progress
// @desc    Parent: view children's progress
// @access  Private (Parent)
router.get('/parent/children-progress', auth, authorize('Parent'), async (req, res) => {
  try {
    const parent = await User.findById(req.user._id).populate('children', '_id name classLevel');
    const childrenIds = parent.children.map(c => c._id);

    // Fetch progress for children
    const progress = await Progress.find({ student: { $in: childrenIds } })
      .populate('student', 'name classLevel')
      .populate('lesson', 'title subject classLevel')
      .sort({ updatedAt: -1 });

    // Group by child
    const childrenProgress = {};
    parent.children.forEach(child => {
      childrenProgress[child._id] = {
        child: child,
        progress: progress.filter(p => p.student._id.toString() === child._id.toString())
      };
    });

    res.json({ childrenProgress });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/lessons/sync-progress
// @desc    Sync offline progress data
// @access  Private
router.post('/sync-progress', auth, async (req, res) => {
  try {
    const { progress } = req.body;
    const studentId = req.user._id;
    const syncedProgress = [];

    for (const progressItem of progress) {
      // Update or create progress record
      const updatedProgress = await Progress.findOneAndUpdate(
        { student: studentId, lesson: progressItem.lesson },
        {
          student: studentId,
          lesson: progressItem.lesson,
          isCompleted: progressItem.isCompleted,
          quizScore: progressItem.quizScore || 0,
          totalQuestions: progressItem.totalQuestions || 0,
          timeSpentSeconds: progressItem.timeSpentSeconds || 0,
          completedAt: progressItem.completedAt ? new Date(progressItem.completedAt) : new Date()
        },
        { upsert: true, new: true }
      );

      syncedProgress.push(updatedProgress);
    }

    res.json({ 
      message: 'Progress synced successfully', 
      syncedCount: syncedProgress.length,
      progress: syncedProgress 
    });
  } catch (error) {
    console.error('Progress sync error:', error);
    res.status(500).json({ message: 'Failed to sync progress' });
  }
});

module.exports = router;
