const fs = require('fs');
const path = require('path');

const processLocalSubmission = async (userEmail, userName, submittedAnswers) => {
  try {
    // 1. Load questions from local JSON for marking (Source of Truth)
    const questionsPath = path.join(__dirname, '../questions.json');
    const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
    
    // ✅ Updated variable names to match system-wide naming (correctCount, wrongCount, skippedCount)
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;

    // 2. Automated Marking Logic
    // Maps through your JSON questions and compares against user's 'submittedAnswers' object
    questions.forEach((q) => {
      // Look up the answer provided by the user using the question's ID
      const userAnswer = submittedAnswers[q.id];
      
      if (!userAnswer || userAnswer.trim() === "") {
        // If the answer is missing or an empty string, it is marked as skipped
        skippedCount++;
      } else if (userAnswer === q.answer) { 
        // Correct if the submitted string exactly matches the 'answer' field in JSON
        correctCount++;
      } else {
        // Wrong if the user provided an answer that does not match
        wrongCount++;
      }
    });

    // Calculate overall percentage score
    const totalQuestions = questions.length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    
    // ✅ Summary keys updated to match your Database Schema and Frontend
    const summary = { 
      correctCount, 
      wrongCount, 
      skippedCount, 
      score 
    };

    // 3. Automated Email Dispatch (DISABLED)
    // As per current project status, emails will be handled manually via the Admin Dashboard 
    // using the data stored in MongoDB.

    // Return the summary object to the server.js for database storage and frontend response
    return summary;

  } catch (error) {
    console.error("Marking Service Error:", error);
    throw error;
  }
};

module.exports = { processLocalSubmission };