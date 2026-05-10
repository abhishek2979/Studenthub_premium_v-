# StudentHub

A school management system I built for teachers and students. Teachers can manage students, attendance, results, assignments, notes and quizzes. Students get their own dashboard to view everything.

Also added a premium system where teachers can pay to unlock video lecture uploads and live class scheduling.

## Tech Stack

- **Frontend** - React + Vite
- **Backend** - Node.js, Express
- **Database** - MongoDB Atlas
- **Auth** - JWT + Google OAuth (teachers), username/password (students)
- **File storage** - Cloudinary

## Running locally

```bash
# install dependencies
npm run install:all

# start backend (port 5000)
npm run backend

# start frontend (port 5173)
npm run frontend
```

Make sure you have a `.env` file in the `backend/` folder. Copy `.env.example` and fill in your values.

## Features

**Teacher dashboard**
- Add/manage students
- Mark attendance
- Upload results
- Create assignments with PDF
- Notes for students
- Quiz builder
- Video lectures (Premium 1)
- Live class scheduling (Premium 2)

**Student dashboard**
- View attendance
- Check results and performance charts
- Download assignments
- Submit assignments
- Take quizzes
- Watch video lectures
- Join live classes

## Premium

Two plans available:
- Premium 1 (₹499/mo) - upload video lectures by subject and day
- Premium 2 (₹999/mo) - everything in P1 + schedule live classes with meeting links

Payment is currently mock (auto-confirms). Razorpay integration is ready to plug in, just needs API keys.

## Deployment

- Frontend on Vercel
- Backend on Render
- DB on MongoDB Atlas

