const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// MongoDB Schemas (updated to match your JSON structure)
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
  lastLogin: { type: Date, default: Date.now }
});

const UserResponse = mongoose.model('UserResponse', userResponseSchema);
const Question = mongoose.model('Question', questionSchema);
const User = mongoose.model('User', userSchema);

// File paths
const USERS_FILE = path.join(__dirname, 'users.json');
const SUBMISSIONS_FILE = path.join(__dirname, 'submissions.json');
const QUESTIONS_FILE = path.join(__dirname, 'questions.json');

function readJSON(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf8');
    const parsedData = JSON.parse(data || '[]');
    console.log(`Read ${parsedData.length} items from ${filePath}`);
    return parsedData;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
}

async function migrateData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Migrate Questions - USE EXACT JSON STRUCTURE
    console.log('Migrating questions...');
    const questionsData = readJSON(QUESTIONS_FILE);
    
    if (questionsData.length > 0) {
      console.log(`Found ${questionsData.length} questions in JSON file`);
      
      // Clear existing questions
      await Question.deleteMany({});
      console.log('Cleared existing questions');
      
      // Insert questions exactly as they are in JSON
      await Question.insertMany(questionsData);
      console.log(`Successfully migrated ${questionsData.length} questions`);
      
      // Verify migration
      const count = await Question.countDocuments();
      console.log(`Total questions in database: ${count}`);
    } else {
      console.log('No questions found in questions.json file');
    }

    // Migrate Users
    console.log('Migrating users...');
    const usersData = readJSON(USERS_FILE);
    if (usersData.length > 0) {
      for (const user of usersData) {
        await User.findOneAndUpdate(
          { email: user.email },
          { 
            name: user.name, 
            email: user.email, 
            lastLogin: new Date(user.lastLogin) 
          },
          { upsert: true, new: true }
        );
      }
      console.log(`Migrated ${usersData.length} users`);
    }

    // Migrate Submissions
    console.log('Migrating submissions...');
    const submissionsData = readJSON(SUBMISSIONS_FILE);
    if (submissionsData.length > 0) {
      for (const submission of submissionsData) {
        await UserResponse.findOneAndUpdate(
          { email: submission.user },
          {
            applicantName: submission.user,
            email: submission.user,
            responses: Object.entries(submission.answers).map(([questionId, answer]) => ({
              questionId,
              questionText: `Question ${questionId}`,
              answer,
              timestamp: new Date(submission.submittedAt)
            })),
            overallScore: 0,
            completed: true,
            assessmentDate: new Date(submission.submittedAt)
          },
          { upsert: true, new: true }
        );
      }
      console.log(`Migrated ${submissionsData.length} submissions`);
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateData();