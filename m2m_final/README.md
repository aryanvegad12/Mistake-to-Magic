# 🎯 Mistake To Magic — MERN Stack

> **AI-powered mistake tracker for Class 11 & 12 students — Board Exams, JEE & NEET**

Built with **MongoDB + Express + React + Node.js**

---

## 📁 Project Structure

```
mistake-to-magic/
├── server/                  ← Express + MongoDB Backend
│   ├── config/db.js         ← MongoDB connection
│   ├── models/
│   │   ├── User.js          ← User model (auth, streak, points)
│   │   ├── Mistake.js       ← Mistake model (spaced repetition)
│   │   └── Exam.js          ← Exam countdown model
│   ├── middleware/auth.js   ← JWT protection middleware
│   ├── routes/
│   │   ├── auth.js          ← Register, Login, Profile, Change Password
│   │   ├── mistakes.js      ← Full CRUD + revise + due
│   │   ├── exams.js         ← Exam CRUD
│   │   └── analytics.js     ← Summary, charts, heatmap
│   ├── server.js            ← Express app entry
│   ├── .env.example         ← Copy this → .env
│   └── package.json
│
├── client/                  ← React Frontend
│   ├── public/index.html
│   └── src/
│       ├── context/AuthContext.jsx   ← Global auth state
│       ├── utils/api.js              ← Axios + interceptors
│       ├── components/Navbar.jsx     ← Shared navbar
│       ├── pages/
│       │   ├── Landing.jsx           ← Home page
│       │   ├── Login.jsx             ← Login
│       │   ├── Register.jsx          ← Register
│       │   ├── Dashboard.jsx         ← Log mistake + stats
│       │   ├── Journal.jsx           ← View/search/filter/revise
│       │   ├── Analytics.jsx         ← Charts + insights
│       │   ├── AICoach.jsx           ← AI-powered guidance
│       │   ├── ExamCountdown.jsx     ← Exam timer
│       │   └── Profile.jsx           ← Edit profile + password
│       ├── App.jsx                   ← Routes + auth guards
│       ├── index.js
│       └── package.json
│
├── package.json             ← Root (runs both together)
└── README.md
```

---

## ⚙️ SETUP — Step by Step

### Step 1 — Prerequisites

Make sure you have installed:
- **Node.js** v18+ → https://nodejs.org
- **MongoDB Atlas** (free cloud DB) → https://cloud.mongodb.com

### Step 2 — Get MongoDB URI

1. Go to https://cloud.mongodb.com → Create free account
2. Create a **free cluster** (M0 tier)
3. Under "Database Access" → Add a user with a password
4. Under "Network Access" → Add `0.0.0.0/0` (allow all IPs)
5. Click "Connect" → "Drivers" → Copy the connection string
6. It looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/`

### Step 3 — Configure Environment

```bash
cd server
cp .env.example .env
```

Open `.env` and fill in:
```
PORT=5000
MONGO_URI=mongodb+srv://YOUR_USER:YOUR_PASS@cluster0.xxxxx.mongodb.net/mistake-to-magic
JWT_SECRET=any_long_random_string_here_min_32_characters
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### Step 4 — Install All Dependencies

```bash
# From root folder:
npm run install-all
```

This installs packages for root, server, and client in one command.

### Step 5 — Run the Full App

```bash
# From root folder:
npm run dev
```

This starts both servers simultaneously:
- **Backend API**: http://localhost:5000
- **React Frontend**: http://localhost:3000

Open http://localhost:3000 in your browser!

---

## 🔗 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new student |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user (protected) |
| PUT | `/api/auth/profile` | Update profile (protected) |
| PUT | `/api/auth/change-password` | Change password (protected) |

### Mistakes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/mistakes` | Get all (with filters: subject, type, severity, search, dueOnly, page, limit) |
| POST | `/api/mistakes` | Create new mistake |
| GET | `/api/mistakes/due` | Get mistakes due for revision |
| GET | `/api/mistakes/:id` | Get single mistake |
| PUT | `/api/mistakes/:id` | Update mistake |
| PUT | `/api/mistakes/:id/revise` | Mark as revised (spaced repetition) |
| DELETE | `/api/mistakes/:id` | Delete mistake |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/summary` | Full analytics data |
| GET | `/api/analytics/heatmap` | 90-day activity heatmap |

### Exams
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/exams` | Get all exams |
| POST | `/api/exams` | Add exam |
| PUT | `/api/exams/:id` | Update exam |
| DELETE | `/api/exams/:id` | Delete exam |

---

## 🚀 Deploying to Production

### Backend → Render (Free)
1. Push code to GitHub
2. Go to https://render.com → New Web Service
3. Connect your GitHub repo
4. Set Root Directory: `server`
5. Build Command: `npm install`
6. Start Command: `node server.js`
7. Add environment variables (MONGO_URI, JWT_SECRET, CLIENT_URL, NODE_ENV=production)

### Frontend → Vercel (Free)
1. Go to https://vercel.com → New Project
2. Connect GitHub repo
3. Set Root Directory: `client`
4. Framework: Create React App
5. Add environment variable: `REACT_APP_API_URL=https://your-render-url.onrender.com/api`
6. Deploy!

---

## ✨ Features

- 🔐 **JWT Authentication** — Secure login/register with bcrypt password hashing
- 📔 **Mistake Journal** — Full CRUD with subject, type, severity, tags
- 🔔 **Spaced Repetition** — Automatic revision scheduling (1 → 3 → 7 → 14 → 30 days)
- 📊 **Analytics Dashboard** — Charts by subject, type, 7-day trend
- 🤖 **AI Coach** — Personalised insights based on actual mistake data
- ⏰ **Exam Countdown** — Track JEE/NEET/Board exam dates
- 🏆 **Gamification** — Points, streaks, achievement badges
- 📤 **CSV Export** — Download full mistake journal
- 🔍 **Search & Filter** — By subject, type, severity, keyword, due date
- 📱 **Mobile Responsive** — Works on all devices

---

## 🛡️ Security Features

- Helmet.js for HTTP headers
- Rate limiting (200/15min general, 20/15min for auth)
- JWT token expiry (30 days)
- bcrypt password hashing (12 salt rounds)
- Input validation with express-validator
- CORS configured for specific origin

---

*Made with ❤️ for Class 11 & 12 students across India*
