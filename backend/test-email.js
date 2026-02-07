const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmail() {
  console.log("--- Starting Email Connection Test ---");
  
  // Create transporter using your .env credentials
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Setup test email data
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER, // Sending a test to yourself
    subject: 'System Test: Email Service Integration',
    text: 'If you are reading this, your Gmail App Password and Nodemailer configuration are working perfectly.',
    html: '<h3>System Integration Successful</h3><p>The <b>Admin Dashboard</b> is now ready to dispatch results to candidates.</p>'
  };

  try {
    // Verify connection configuration
    await transporter.verify();
    console.log("✅ Connection: Server is ready to take our messages");

    // Send the test email
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Success: Email sent: " + info.response);
    console.log("--- Check your inbox at " + process.env.EMAIL_USER + " ---");
  } catch (error) {
    console.error("❌ Error: Verification failed. Details below:");
    console.error(error);
    console.log("\nTroubleshooting tips:");
    console.log("1. Ensure 2FA is enabled on your Gmail.");
    console.log("2. Confirm 'pymsqgtqziknvjrz' is a 16-character App Password.");
    console.log("3. Ensure no firewall is blocking port 465 or 587.");
  }
}

testEmail();