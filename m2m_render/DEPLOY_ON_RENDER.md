# 🚀 Deploy Mistake To Magic on Render (Full Stack — Single Service)

Both frontend (React) and backend (Express) run on ONE Render service.

---

## Step 1 — Push Code to GitHub

1. Create a new GitHub repository (public or private)
2. Open terminal in your project folder:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/mistake-to-magic.git
git push -u origin main
```

---

## Step 2 — Create Web Service on Render

1. Go to → https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account → select your repository
4. Fill in these settings:

| Field            | Value                              |
|------------------|------------------------------------|
| Name             | `mistake-to-magic` (or any name)   |
| Region           | Singapore (closest to India)       |
| Branch           | `main`                             |
| Root Directory   | *(leave blank)*                    |
| Runtime          | **Node**                           |
| Build Command    | `npm run render-build`             |
| Start Command    | `npm start`                        |
| Instance Type    | **Free**                           |

---

## Step 3 — Add Environment Variables on Render

In your Render service → **"Environment"** tab → add these:

| Key            | Value                                                              |
|----------------|--------------------------------------------------------------------|
| `MONGO_URI`    | `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/mistake-to-magic?retryWrites=true&w=majority&appName=Cluster0` |
| `JWT_SECRET`   | Any long random string (min 32 chars), e.g. `M2Magic2025SuperSecretKey_xyz_abc` |
| `NODE_ENV`     | `production`                                                       |
| `CLIENT_URL`   | `https://your-app-name.onrender.com` *(fill after first deploy)*  |

**How to get MONGO_URI:**
1. Go to https://cloud.mongodb.com
2. Your cluster → Connect → Drivers → Node.js
3. Copy the string, replace `<password>` with your DB user's password
4. Add `/mistake-to-magic` before the `?`

---

## Step 4 — Deploy

Click **"Create Web Service"** — Render will:
1. Install server dependencies (`cd server && npm install`)
2. Install client dependencies (`cd ../client && npm install`)
3. Build React app (`npm run build`) → outputs to `client/build/`
4. Start Express server which serves the React build + API

Your app will be live at:
```
https://your-app-name.onrender.com
```

---

## Step 5 — Update CLIENT_URL

Once deployed, go back to **Environment** tab on Render and update:
```
CLIENT_URL = https://your-actual-app-name.onrender.com
```
Then click **"Save Changes"** → Render redeploys automatically.

---

## ✅ How It Works (Architecture)

```
Browser → https://your-app.onrender.com
              │
              ▼
         Express Server (port 5000)
              │
         ┌────┴────────────────────┐
         │                         │
    /api/* routes              /* all other routes
    (Auth, Mistakes,           serve client/build/index.html
     Analytics, Exams)         (React Router takes over)
         │
    MongoDB Atlas (cloud)
```

---

## 🔧 Local Development (unchanged)

```bash
# Terminal — from project root
npm run install-all   # install all packages once
npm run dev           # starts both servers
```
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

---

## ⚠️ Important Notes

- **Free Render plan** spins down after 15 min of inactivity — first load may take 30-60 seconds
- **Never push `.env` to GitHub** — it's in `.gitignore`
- MongoDB Atlas → Network Access must have `0.0.0.0/0` (allow all IPs) for Render to connect
