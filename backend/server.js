const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ✅ Import the Marking Service
const { processLocalSubmission } = require('./services/markingService');

const app = express();

// ✅ Allowed your specific Static Site Frontend to communicate with this backend
app.use(cors({
  origin: 'https://customer-care-assessment-app-1.onrender.com', 
  credentials: true
}));

app.use(express.json());

// ✅ Health Check Routes for Render deployment success
app.get('/', (req, res) => {
  res.status(200).send('Server is running');
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Atlas Connection Successful');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

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
  correctCount: { type: Number, default: 0 }, 
  wrongCount: { type: Number, default: 0 },    
  skippedCount: { type: Number, default: 0 }, 
  completed: { type: Boolean, default: false },
  assessmentDate: { type: Date, default: Date.now }
});

const questionSchema = new mongoose.Schema({
  id: Number,
  question: String,
  options: [String],
  category: { type: String, default: "general" },
  answer: String,
  weight: { type: Number, default: 1 },
  explanation: String
});

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  lastLogin: { type: Date, default: Date.now },
  role: { type: String, default: 'user' },
  overallScore: { type: Number, default: 0 },
  correctCount: { type: Number, default: 0 },
  wrongCount: { type: Number, default: 0 },
  skippedCount: { type: Number, default: 0 },
  testSubmitted: { type: Boolean, default: false }
});

const adminSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'admin' }
});

const adminLogSchema = new mongoose.Schema({
  email: String,
  timestamp: { type: Date, default: Date.now },
  status: { type: String, default: 'Authorized Access' }
});

const userProgressSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  currentQuestionIndex: { type: Number, default: 0 },
  timeRemaining: { type: Number, default: 1800 },
  answers: { type: Object, default: {} },
  startTime: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now }
});

// Create Models
const UserResponse = mongoose.model('UserResponse', userResponseSchema);
const Question = mongoose.model('Question', questionSchema);
const User = mongoose.model('User', userSchema);
const Admin = mongoose.model('Admin', adminSchema);
const AdminLog = mongoose.model('AdminLog', adminLogSchema);
const UserProgress = mongoose.model('UserProgress', userProgressSchema);

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

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

// Initialize Admin User
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

// Initialize Questions
const initializeQuestions = async () => {
  try {
    const questionCount = await Question.countDocuments();
    if (questionCount === 0) {
      const questionsPath = path.join(__dirname, 'questions.json');
      if (fs.existsSync(questionsPath)) {
        const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
        await Question.insertMany(questionsData);
      }
    }
  } catch (error) {}
};

// Admin Login
app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const newLog = new AdminLog({ email: admin.email });
    await newLog.save();

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

// Admin Audit Logs Endpoint
app.get('/api/admin/admin-logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const logs = await AdminLog.find().sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Delete Admin Log Record
app.delete('/api/admin/admin-logs/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await AdminLog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Log entry deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete log' });
  }
});

// User Login
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

    const existingProgress = await UserProgress.findOne({ email });
    if (!existingProgress) {
      await UserProgress.create({ email, currentQuestionIndex: 0, timeRemaining: 1800, answers: {} });
    }

    const token = jwt.sign({ email, name, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ message: 'Login recorded', token });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record login' });
  }
});

app.post('/api/save-progress', authenticateToken, async (req, res) => {
  const { currentQuestionIndex, timeRemaining, answers } = req.body;
  try {
    await UserProgress.findOneAndUpdate(
      { email: req.user.email },
      { currentQuestionIndex, timeRemaining, answers, lastUpdated: new Date() },
      { upsert: true, new: true }
    );
    res.json({ message: 'Progress saved' });
  } catch (error) { res.status(500).json({ error: 'Save failed' }); }
});

app.get('/api/user-progress', authenticateToken, async (req, res) => {
  try {
    const progress = await UserProgress.findOne({ email: req.user.email });
    if (progress) {
      const timeElapsed = Math.floor((new Date() - progress.lastUpdated) / 1000);
      const actualTimeRemaining = Math.max(0, progress.timeRemaining - timeElapsed);
      res.json({ ...progress._doc, timeRemaining: actualTimeRemaining, hasProgress: true });
    } else {
      res.json({ hasProgress: false });
    }
  } catch (error) { res.status(500).json({ error: 'Fetch failed' }); }
});

app.get('/api/questions', authenticateToken, async (req, res) => {
  try {
    const questions = await Question.find().sort({ id: 1 });
    res.json(questions);
  } catch (error) { res.status(500).json({ error: 'Fetch failed' }); }
});

// Submit Route
app.post('/api/submit', authenticateToken, async (req, res) => {
  const { answers } = req.body;
  try {
    const userEmail = req.user.email;
    const userName = req.user.name || "Candidate";

    const summary = await processLocalSubmission(userEmail, userName, answers);

    const submission = new UserResponse({
      applicantName: userName,
      email: userEmail,
      responses: Object.entries(answers).map(([id, ans]) => ({ questionId: id, answer: ans })),
      overallScore: summary.score,
      correctCount: summary.correctCount,
      wrongCount: summary.wrongCount,
      skippedCount: summary.skippedCount,
      completed: true
    });
    await submission.save();

    await User.findOneAndUpdate(
      { email: userEmail },
      { 
        correctCount: summary.correctCount,
        wrongCount: summary.wrongCount,
        skippedCount: summary.skippedCount,
        overallScore: summary.score,
        testSubmitted: true,
        lastLogin: new Date()
      }
    );
    
    await UserProgress.deleteOne({ email: userEmail });
    
    res.json({ 
      message: 'Assessment submitted and results emailed', 
      score: summary.score, 
      metrics: {
        correct: summary.correctCount,
        wrong: summary.wrongCount,
        skipped: summary.skippedCount
      }
    });
  } catch (error) { 
    console.error("Submit error:", error);
    res.status(500).json({ error: 'Submit failed' }); 
  }
});

app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().sort({ lastLogin: -1 });
    res.json(users);
  } catch (error) { res.status(500).json({ error: 'Fetch failed' }); }
});

app.delete('/api/admin/users/:email', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userEmail = req.params.email;
    await Promise.all([
      User.deleteOne({ email: userEmail }),
      UserProgress.deleteOne({ email: userEmail }),
      UserResponse.deleteMany({ email: userEmail })
    ]);
    res.json({ message: 'User deleted' });
  } catch (error) { res.status(500).json({ error: 'Delete failed' }); }
});

connectDB().then(async () => {
  await initializeAdmin();
  await initializeQuestions();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));