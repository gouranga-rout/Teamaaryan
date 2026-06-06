# Team Aaryan — Full Stack Setup Guide

## 📁 Project Structure

```
teamaaryan-new/
├── backend/          → Node.js + Express + MongoDB
└── frontend/         → React + Vite
```

---

## 🔧 STEP 1 — Setup MongoDB Atlas

1. Go to https://cloud.mongodb.com
2. Create a free cluster
3. Create a database user (username + password)
4. Whitelist IP: 0.0.0.0/0 (allow all)
5. Copy your connection string:
   mongodb+srv://<user>:<pass>@cluster.mongodb.net/teamaaryan

---

## ☁️ STEP 2 — Setup Cloudinary

1. Go to https://cloudinary.com (free account)
2. From Dashboard, copy:
   - Cloud Name
   - API Key
   - API Secret

---

## ⚙️ STEP 3 — Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit .env with your real values:

```
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=any_random_long_string

CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

ADMIN_EMAIL=mraarya***@gmail.com
ADMIN_PASSWORD=YourPassword123
ADMIN_USERNAME=aaryan
ADMIN_FULL_NAME=Aaryan
ADMIN_REFERRAL_LINK=https://richind.org/checkout?slug=starter-package&referrer_code=RINDQMB1KG
```

Start the backend:
```bash
npm run dev
```

On first run, admin is auto-created in MongoDB!

---

## 🎨 STEP 4 — Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Edit .env:
```
VITE_API_URL=http://localhost:5000
```

Copy your original assets into frontend/public/:
```
public/
├── presentation.mp4
├── assets/profile.png
├── earnings/proof-1.jpg ... proof-9.jpg
├── offer/Jim_Corbett.jpg
├── legal_docs/RICHIND_ISO.jpg, RICHIND_UDYAM.png, RICHIND_GST.png
├── packages-list/STARTER_PKG.png ... PREMIUM-PRO_PKG.png
└── social-icons/fb.png, ig.png, wa.png, in.png, GitHub.png
```

Start the frontend:
```bash
npm run dev
```

---

## 🚀 STEP 5 — First Login (Admin)

1. Open http://localhost:5173/login
2. Login with your admin email + password from .env
3. You will be redirected to /admin dashboard
4. Your admin account already has username: aaryan
5. Visit http://localhost:5173/aaryan — your page is live!

---

## 🌐 STEP 6 — Deploy

### Backend → Render.com
1. Push backend folder to GitHub
2. Create new Web Service on Render
3. Add all .env variables in Render dashboard
4. Deploy!

### Frontend → Vercel
1. Push frontend folder to GitHub
2. Import on Vercel
3. Add env variable: VITE_API_URL=https://your-render-url.onrender.com
4. Deploy!

---

## 🔄 How The System Works

```
teamaaryan.com/aaryan   → Aaryan's referral links (your page)
teamaaryan.com/rahul    → Rahul's referral links
teamaaryan.com/xyz      → NOT FOUND → falls back to Aaryan's links

/login    → Admin → /admin dashboard
          → User  → /dashboard

/register → User fills form → pending
/admin    → Admin approves/rejects

/dashboard → User sees their link + click graph
/admin     → Full CMS: users, media, pending requests
```

---

## 📋 API Reference

Method | Endpoint              | Access | Description
-------|-----------------------|--------|------------
POST   | /api/auth/login       | Public | Login
POST   | /api/auth/register    | Public | Submit request
GET    | /api/user/:username   | Public | Get referral link
POST   | /api/user/:username/click | Public | Track visit
GET    | /api/media            | Public | Get banner + proofs
GET    | /api/dashboard/stats  | User   | Click analytics
GET    | /api/admin/requests   | Admin  | Pending requests
GET    | /api/admin/users      | Admin  | All users + clicks
PUT    | /api/admin/approve/:id| Admin  | Approve user
PUT    | /api/admin/reject/:id | Admin  | Reject/suspend user
DELETE | /api/admin/users/:id  | Admin  | Delete user
GET    | /api/admin/media      | Admin  | Get media
POST   | /api/admin/media/banner| Admin | Upload banner
POST   | /api/admin/media/proof | Admin | Upload proof (max 20)
DELETE | /api/admin/media/:id  | Admin  | Delete media
