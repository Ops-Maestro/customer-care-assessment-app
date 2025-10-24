# Customer Care Assessment App

**A full-stack web application designed to test and evaluate candidates applying for customer care roles. The app administers timed assessments and provides an admin dashboard to monitor results.**

## 🚀 Tech Stack

**Frontend**
- React 18 - UI framework

- React Router DOM - Client-side routing

- Axios - HTTP client for API calls

- CSS-in-JS - Styling with JavaScript objects

**Backend**
- Node.js - Runtime environment

- Express.js - Web application framework

- MongoDB Atlas - Cloud database

- Mongoose - MongoDB object modeling

- JWT - JSON Web Tokens for authentication

- bcryptjs - Password hashing

- CORS - Cross-origin resource sharing

- dotenv - Environment variable management

## 📋 What It Does

### For Candidates (Users)
- Secure login with name and email

- 30-minute timed assessment

- Multiple-choice questions

- Auto-save progress during test

- Submit answers with summary

## For Administrators
- Secure admin login

- Dashboard to view all registered users

- Monitor test submissions

- Track user activity and login times

## 🏗️ Architecture

**Frontend Structure**

```text
frontend/
├── public/
│   └── index.html
├── src/
│   ├── pages/
│   │   ├── App.jsx (Main test interface)
│   │   ├── Login.jsx (User login)
│   │   ├── AdminLogin.jsx (Admin authentication)
│   │   └── AdminDashboard.jsx (Admin panel)
│   ├── services/
│   │   └── api.js (API service with JWT interceptor)
│   └── index.js (App entry point with routing)
```
**Backend Structure**

```text
backend/
├── server.js (Main server file)
├── migrate-questions.js (Migration Script)
├── package.json
├── .env.example (Environment variables template)
├── questions.js (stores users questions)
├── users.json (stores users data)
└── (MongoDB models defined in server.js)
```
### 🔐 Authentication Flow

**User Authentication**

1. User enters name and email

2. Backend creates/updates user in MongoDB

3. JWT token generated and returned

4. Token stored in localStorage for subsequent requests

**Admin Authentication**

1. Admin enters email and password

2. Backend verifies against stored credentials

3. JWT token with admin role generated

4. Admin access granted to protected routes

**API Protection**

1. JWT tokens required for all protected routes

2. Automatic token inclusion via axios interceptors

3. Token expiration handling

4. Role-based access control (user vs admin)

## 🗄️ Database Schema

**User Model**
```javascript
{
  name: String,
  email: String (unique),
  lastLogin: Date,
  role: String (default: 'user')
}
```
**UserResponse Model**
```javascript
{
  applicantName: String,
  email: String,
  responses: [{
    questionId: String,
    questionText: String,
    answer: String,
    timestamp: Date
  }],
  overallScore: Number,
  completed: Boolean,
  assessmentDate: Date
}
```
**Question Model**
```javascript
{
  questionText: String,
  options: [String],
  category: String,
  correctAnswer: String,
  weight: Number
}
```
**Admin Model**
```javascript
{
  username: String,
  email: String (unique),
  password: String (hashed),
  role: String (default: 'admin')
}
```
## 🔧 Debug & Maintenance Routes
Important: Use these routes to troubleshoot and manage questions

```text
# Test current questions status
https://customer-care-assessment-app.onrender.com/debug-questions

# Populate questions from questions.json file
https://customer-care-assessment-app.onrender.com/populate-questions
```

You can migrate your questions to MongoDB using these commands:

```bash
cd backend
node migrate-questions.js
```

## 🛠️ Local Development Setup

**Prerequisites**

* Node.js (v14 or higher)

* MongoDB Atlas account

* Git

### Backend Setup
1. Clone and setup backend

```bash
cd backend
npm install
```
2. Configure environment variables

**Create backend/.env:**

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your_super_secure_jwt_secret
PORT=5000
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=admin123
```
3. Start backend server

```bash
npm run start
```
**✅ Should show: "MongoDB Atlas Connected" and "Backend server running on port 5000"**

### Frontend Setup

1. Setup frontend

```bash
cd frontend
npm install
```
2. Configure environment variables
**Create frontend/.env:**

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ADMIN_EMAIL=johndoe@gmail.com
REACT_APP_ADMIN_PASSWORD=john123
```
3. Start frontend development server

```bash
npm run start
```
**✅ Should open: http://localhost:3000**

## 🧪 Testing the Application

### 1. Test Backend API

```bash
# Health check
curl http://localhost:5000/health

# User login test
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "test@example.com"}'

# Admin login test  
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@gmail.com", "password": "admin123"}'
```

### 2. Test Frontend Flows

**Candidate Testing:**

1. Visit http://localhost:3000/login

2. Enter: Name = "John Doe", Email = "john@example.com"

3. Complete the assessment

4. Submit answers

**Admin Testing:**

1. Visit http://localhost:3000/admin

2. Login with: Email = "admin@gmail.com", Password = "admin123"

3. View users and submissions in dashboard

### 3. Verify Data Flow

1. Check MongoDB Atlas for user records

2. Verify JWT tokens in browser localStorage

3. Monitor API calls in browser Network tab

## 🌐 API Endpoints

**Public Routes**

* GET /health - Server health check

* POST /api/login - User login

* POST /api/admin/login - Admin login

**Protected User Routes**

* GET /api/questions - Get assessment questions (requires user JWT)

* POST /api/submit - Submit test answers (requires user JWT)

**Protected Admin Routes**

* GET /api/admin/users - Get all users (requires admin JWT)

* GET /api/admin/submissions - Get all submissions (requires admin JWT)

## 🔧 Deployment

**Environment Variables for Production()**

**Backend (website.com):**

```env
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_production_jwt_secret
PORT=10000
ADMIN_EMAIL=user@example.com
ADMIN_PASSWORD=your_password_here
```
**Frontend (website.com):**

```env
REACT_APP_API_URL=https://your-backend-service.com
REACT_APP_ADMIN_EMAIL=user@example.com
REACT_APP_ADMIN_PASSWORD=your_password_here
```

## 🚀 Features

**Core Features**

* ✅ User registration and authentication

* ✅ Admin authentication and authorization

* ✅ Timed assessment with auto-submit

* ✅ Progress saving during test

* ✅ Admin dashboard for monitoring

* ✅ MongoDB data persistence

* ✅ JWT-based API security

**Security Features**

* ✅ JWT token-based aut**hentication

* ✅ Protected API routes

* ✅ Environment variable configuration

* ✅ CORS protection

* ✅ Password hashing (admin)

## 📝 Future Enhancements

### Planned Improvements

* Email notifications for completed assessments

* Advanced scoring and analytics

* Question categories and weighted scoring

* Candidate result reporting

* Bulk question import/export

* Real-time admin notifications

### Security Improvements Needed

* Input validation and sanitization

* Rate limiting

* HTTPS enforcement

* Secure headers with Helmet.js

* JWT refresh token mechanism

## 🐛 Troubleshooting

### Common Issues

**Backend won't start:**

* Check MongoDB connection string

* Verify environment variables

* Ensure port 5000 is available


**Frontend can't connect to backend:**

* Verify REACT_APP_API_URL in frontend .env

* Check backend is running on correct port

* Look for CORS errors in browser console

**Login not working:**

* Check browser console for errors

* Verify API responses in Network tab

* Confirm JWT tokens in localStorage

**Admin login fails:**

* Verify admin credentials in backend .env

* Check MongoDB for admin user creation

* Test admin login with curl first

## 🤝 Contributing

1. Fork the repository

2. Create a feature branch

3. Make changes with proper testing

4. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🚀 Deployment Ready
**The application is designed to be easily deployable to various cloud platforms:**

* Render.com (currently deployed)

* AWS (EC2, Elastic Beanstalk, S3 + CloudFront)

* Heroku

* DigitalOcean

* Vercel (frontend) + Railway (backend)

**All environment configurations are centralized and the app follows cloud-native best practices.**