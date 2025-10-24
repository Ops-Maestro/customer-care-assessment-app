const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Atlas Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDB();

// Define Schemas
const userResponseSchema = new mongoose.Schema({
  applicantName: String,
  email: String,
  responses: [{
    questionId: String,
    questionText: String,
    answer: String,
    timestamp: { type: Date, default: Date.now }
  }],
  overallScore: Number,
  completed: { type: Boolean, default: false },
  assessmentDate: { type: Date, default: Date.now }
});

// UPDATED QUESTION SCHEMA - Matches your questions.json structure
const questionSchema = new mongoose.Schema({
  id: Number,
  question: String,           // Changed from questionText to question
  options: [String],
  category: { type: String, default: "general" },
  answer: String,             // Changed from correctAnswer to answer
  weight: { type: Number, default: 1 },
  explanation: String         // Added to match your JSON
});

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  lastLogin: { type: Date, default: Date.now },
  role: { type: String, default: 'user' }
});

const adminSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'admin' }
});

// NEW: User Progress Schema for resume functionality
const userProgressSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  currentQuestionIndex: { type: Number, default: 0 },
  timeRemaining: { type: Number, default: 1800 }, // 30 minutes in seconds
  answers: { type: Object, default: {} },
  startTime: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now }
});

// Create Models
const UserResponse = mongoose.model('UserResponse', userResponseSchema);
const Question = mongoose.model('Question', questionSchema);
const User = mongoose.model('User', userSchema);
const Admin = mongoose.model('Admin', adminSchema);
const UserProgress = mongoose.model('UserProgress', userProgressSchema); // NEW

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// ✅ Initialize Admin User
const initializeAdmin = async () => {
  try {
    const existingAdmin = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
      const admin = new Admin({
        username: 'admin',
        email: process.env.ADMIN_EMAIL,
        password: hashedPassword,
        role: 'admin'
      });
      await admin.save();
      console.log('Default admin user created');
    }
  } catch (error) {
    console.error('Error initializing admin:', error);
  }
};

// ✅ Initialize Questions - Automatically populate if database is empty
const initializeQuestions = async () => {
  try {
    const questionCount = await Question.countDocuments();
    if (questionCount === 0) {
      console.log('No questions found in database, populating from questions.json...');
      
      const questionsPath = path.join(__dirname, 'questions.json');
      if (fs.existsSync(questionsPath)) {
        const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
        await Question.insertMany(questionsData);
        console.log(`Successfully populated ${questionsData.length} questions from questions.json`);
      } else {
        console.log('questions.json file not found');
      }
    } else {
      console.log(`Database already has ${questionCount} questions`);
    }
  } catch (error) {
    console.error('Error initializing questions:', error);
  }
};

// ✅ Admin Login
app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Admin login successful',
      token,
      user: { email: admin.email, role: admin.role }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// ✅ User Login (with JWT) - UPDATED with progress initialization
app.post('/api/login', async (req, res) => {
  const { name, email } = req.body;
  
  if (!email || !name) return res.status(400).json({ error: 'Name and Email required' });

  try {
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      existingUser.name = name;
      existingUser.lastLogin = new Date();
      await existingUser.save();
    } else {
      const newUser = new User({ name, email });
      await newUser.save();
    }

    // Initialize progress if doesn't exist
    const existingProgress = await UserProgress.findOne({ email });
    if (!existingProgress) {
      await UserProgress.create({ 
        email, 
        currentQuestionIndex: 0, 
        timeRemaining: 1800,
        answers: {}
      });
    }

    // Generate JWT for user
    const token = jwt.sign(
      { email, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ 
      message: 'Login recorded',
      token 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record login' });
  }
});

// ✅ NEW: Save user progress
app.post('/api/save-progress', authenticateToken, async (req, res) => {
  const { currentQuestionIndex, timeRemaining, answers } = req.body;

  try {
    await UserProgress.findOneAndUpdate(
      { email: req.user.email },
      {
        currentQuestionIndex,
        timeRemaining,
        answers,
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );
    res.json({ message: 'Progress saved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

// ✅ NEW: Get user progress
app.get('/api/user-progress', authenticateToken, async (req, res) => {
  try {
    const progress = await UserProgress.findOne({ email: req.user.email });
    
    if (progress) {
      // Calculate actual time remaining considering server time
      const timeElapsed = Math.floor((new Date() - progress.lastUpdated) / 1000);
      const actualTimeRemaining = Math.max(0, progress.timeRemaining - timeElapsed);
      
      res.json({
        currentQuestionIndex: progress.currentQuestionIndex,
        timeRemaining: actualTimeRemaining,
        answers: progress.answers || {},
        hasProgress: true
      });
    } else {
      res.json({ 
        currentQuestionIndex: 0,
        timeRemaining: 1800,
        answers: {},
        hasProgress: false 
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// ✅ Protected Routes with JWT
app.get('/api/questions', authenticateToken, async (req, res) => {
  try {
    const questions = await Question.find();
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

app.post('/api/submit', authenticateToken, async (req, res) => {
  const { answers, overallScore } = req.body;

  try {
    const submission = new UserResponse({
      applicantName: req.user.email, // From JWT
      email: req.user.email,
      responses: answers,
      overallScore: overallScore || 0,
      completed: true
    });

    await submission.save();
    
    // Clear user progress after submission
    await UserProgress.deleteOne({ email: req.user.email });
    
    res.json({ message: 'Submission saved to MongoDB' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save submission' });
  }
});

// ✅ Admin-only routes
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().sort({ lastLogin: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/admin/submissions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const submissions = await UserResponse.find().sort({ assessmentDate: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// ✅ NEW: Delete user and all associated data
app.delete('/api/admin/users/:email', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userEmail = req.params.email;
    
    // Delete user from all collections
    const [userResult, progressResult, responseResult] = await Promise.all([
      User.deleteOne({ email: userEmail }),
      UserProgress.deleteOne({ email: userEmail }),
      UserResponse.deleteOne({ email: userEmail })
    ]);

    const deletedCount = 
      (userResult.deletedCount || 0) + 
      (progressResult.deletedCount || 0) + 
      (responseResult.deletedCount || 0);

    res.json({ 
      message: `User ${userEmail} deleted successfully`,
      deletedFrom: {
        users: userResult.deletedCount,
        progress: progressResult.deletedCount,
        responses: responseResult.deletedCount
      },
      totalDeleted: deletedCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ✅ NEW: Bulk delete users
app.post('/api/admin/users/bulk-delete', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { emails } = req.body;
    
    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({ error: 'Emails array required' });
    }

    const results = await Promise.all(
      emails.map(async (email) => {
        const [userResult, progressResult, responseResult] = await Promise.all([
          User.deleteOne({ email }),
          UserProgress.deleteOne({ email }),
          UserResponse.deleteOne({ email })
        ]);

        return {
          email,
          deletedFrom: {
            users: userResult.deletedCount,
            progress: progressResult.deletedCount,
            responses: responseResult.deletedCount
          }
        };
      })
    );

    res.json({ 
      message: `Bulk deletion completed`,
      results 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete users' });
  }
});

// ✅ DEBUG ROUTES - For testing
app.get('/debug-questions', async (req, res) => {
  try {
    const questions = await Question.find();
    res.json({
      totalQuestions: questions.length,
      questions: questions.slice(0, 5), // Show first 5
      sampleQuestion: questions[0] || 'No questions found'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Quick fix route to populate questions manually
app.get('/populate-questions', async (req, res) => {
  try {
    const questionsPath = path.join(__dirname, 'questions.json');
    
    if (!fs.existsSync(questionsPath)) {
      return res.status(404).json({ error: 'questions.json file not found' });
    }
    
    const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
    
    // Clear existing questions
    await Question.deleteMany({});
    
    // Insert all questions
    await Question.insertMany(questionsData);
    
    res.json({ 
      message: `Populated ${questionsData.length} questions successfully`,
      count: questionsData.length 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// HEALTH CHECK ROUTE
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Initialize admin and questions on startup
connectDB().then(async () => {
  await initializeAdmin();
  await initializeQuestions();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});