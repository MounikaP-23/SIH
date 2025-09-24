# Digital Learning Platform

A comprehensive MERN stack web application for digital learning with role-based access for Students, Teachers, and Administrators.

## Features

### 🎓 Student Features
- **Lessons**: Browse and access lessons with filtering by subject and class level
- **Interactive Learning**: View lesson content with text, images, and video support
- **Quizzes**: Take interactive quizzes at the end of lessons
- **Progress Tracking**: Monitor completed lessons and quiz scores
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### 👨‍🏫 Teacher Features
- **Create Lessons**: Add comprehensive lessons with content, videos, and quizzes
- **Manage Content**: View and manage all created lessons
- **Student Tracking**: Monitor student progress and performance
- **Rich Content**: Support for HTML content, images, and video links

### 👨‍💼 Admin Features
- **User Management**: Manage students, teachers, and admin accounts
- **Analytics Dashboard**: View platform statistics and performance metrics
- **Content Oversight**: Monitor all lessons and user activity

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **CORS** for cross-origin requests

### Frontend
- **React.js** with TypeScript
- **React Router** for navigation
- **Bootstrap** for responsive UI
- **Axios** for API calls
- **Context API** for state management

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the server directory:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/digital_learning
JWT_SECRET=your_super_secret_jwt_key_here
```

4. Start the server:
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Database Schema

### Users Collection
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (Student/Teacher/Admin),
  createdAt: Date,
  updatedAt: Date
}
```

### Lessons Collection
```javascript
{
  title: String,
  description: String,
  subject: String (Math/Science/English/Punjabi/Social Studies),
  classLevel: Number (6-12),
  language: String,
  content: String (HTML supported),
  videoLink: String,
  images: [String],
  quiz: {
    questions: [{
      question: String,
      options: [String],
      correctAnswer: Number
    }],
    isActive: Boolean
  },
  createdBy: ObjectId (User),
  createdAt: Date,
  updatedAt: Date
}
```

### Progress Collection
```javascript
{
  student: ObjectId (User),
  lesson: ObjectId (Lesson),
  isCompleted: Boolean,
  quizScore: Number,
  totalQuestions: Number,
  completedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `GET /api/auth/users` - Get all users (Admin only)

### Lessons
- `POST /api/lessons` - Create lesson (Teacher/Admin)
- `GET /api/lessons` - Get all lessons with filters
- `GET /api/lessons/:id` - Get single lesson
- `PUT /api/lessons/:id` - Update lesson (Teacher/Admin)
- `DELETE /api/lessons/:id` - Delete lesson (Teacher/Admin)
- `POST /api/lessons/:id/complete` - Mark lesson as completed (Student)
- `GET /api/lessons/student/progress` - Get student progress

## Usage

### Getting Started
1. Start both backend and frontend servers
2. Open `http://localhost:3000` in your browser
3. Create an account or login with existing credentials
4. Choose your role: Student, Teacher, or Admin

### For Students
- Browse available lessons using filters
- Click on lessons to view content and take quizzes
- Track your progress in the Progress section

### For Teachers
- Create new lessons with rich content
- Add quizzes to test student knowledge
- Monitor student progress and performance

### For Admins
- Manage user accounts and roles
- View platform analytics and statistics
- Oversee all content and user activity

## Features Highlights

### 🎨 Attractive UI Design
- Modern gradient color scheme
- Responsive Bootstrap components
- Smooth animations and transitions
- Intuitive navigation

### 🔐 Secure Authentication
- JWT-based authentication
- Password hashing with bcryptjs
- Role-based access control
- Protected routes

### 📱 Mobile Responsive
- Bootstrap responsive grid system
- Mobile-optimized navigation
- Touch-friendly interface
- Cross-device compatibility

### 🚀 Performance Optimized
- Efficient data fetching
- Context-based state management
- Optimized re-renders
- Fast loading times

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please contact the development team or create an issue in the repository.
