const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// // ✅ UPDATED: Switched from 'service: gmail' to explicit host/port for better compatibility
// const transporter = nodemailer.createTransport({
//   host: 'smtp.gmail.com',
//   port: 587,
//   secure: false, // Must be false for port 587
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   },
//   tls: {
//     rejectUnauthorized: false // Helps bypass some network restrictions on cloud hosts
//   }
// });

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

    // // 3. Email Dispatch Configuration
    // const mailOptions = {
    //   from: `"Assessment System" <${process.env.EMAIL_USER}>`,
    //   to: userEmail, // ✅ Verified: Sends directly to the candidate's email
    //   subject: `Assessment Results: ${userName || userEmail}`,
    //   html: `
    //     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
    //       <div style="background: #4361ee; padding: 20px; color: white; text-align: center;">
    //         <h2 style="margin:0;">Assessment Report</h2>
    //       </div>
    //       <div style="padding: 25px; color: #1e293b;">
    //         <p>Hello <strong>${userName || 'Applicant'}</strong>,</p>
    //         <p>Your assessment has been automatically marked. Here is the breakdown of your performance:</p>
            
    //         <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
    //           <p style="margin: 5px 0;">✅ <strong style="color: #10b981;">Correct:</strong> ${correctCount}</p>
    //           <p style="margin: 5px 0;">❌ <strong style="color: #e63946;">Wrong:</strong> ${wrongCount}</p>
    //           <p style="margin: 5px 0;">⏩ <strong style="color: #ffb703;">Skipped:</strong> ${skippedCount}</p>
    //           <hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 15px 0;"/>
    //           <p style="font-size: 24px; font-weight: bold; text-align: center; margin: 0; color: #1e293b;">
    //             TOTAL SCORE: ${score}%
    //           </p>
    //         </div>
            
    //         <p style="font-size: 14px; color: #64748b; text-align: center;">
    //           This is an automated result. Please do not reply to this email.
    //         </p>
    //       </div>
    //     </div>
    //   `
    // };

    // // ✅ FIX: Send the email WITHOUT 'await' so the function can return the score immediately.
    // // This prevents the connection timeout from blocking the database save.
    // transporter.sendMail(mailOptions).catch(err => {
    //     console.error("Background Email Error (User still submitted):", err.message);
    // });
    
    // Return the summary object to the server.js for database storage and frontend response
    return summary;

  } catch (error) {
    console.error("Marking Service Error:", error);
    throw error;
  }
};

module.exports = { processLocalSubmission };