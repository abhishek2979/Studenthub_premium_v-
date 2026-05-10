# StudentHub

A web app I built for managing student-teacher stuff like attendance, results, assignments etc. Made this as a personal project to learn full stack development.

## Why I built this

In our college (NIT Agartala) teachers still manage attendance and results in excel sheets and whatsapp groups. Thought it would be a good idea to build something proper for it. Also wanted to practice React and Node.js so this seemed like a good project.

## What it does

**For teachers**
- Add students and manage their profiles
- Mark attendance day by day
- Upload results / marks
- Share notes as PDFs
- Create assignments and check submissions
- Make quizzes with auto grading
- Upload video lectures (premium)
- Schedule live classes with google meet or zoom link (premium)

**For students**
- Check their attendance
- See results and a performance graph
- Download notes and assignments
- Submit assignments
- Give quizzes
- Watch recorded lectures
- Join live classes

## Tech stack

- React + Vite (frontend)
- Node.js + Express (backend)
- MongoDB Atlas (database)
- Cloudinary (file/video storage)
- JWT for auth
- Google OAuth for teacher login

Frontend runs on localhost:5173 and backend on localhost:5000

## Environment variables

Copy `backend/.env.example` to `backend/.env` and fill in:
- MongoDB connection string
- JWT secret
- Google OAuth credentials (from Google Cloud Console)
- Cloudinary credentials (from cloudinary.com)

## Premium feature

Added a subscription system where teachers can pay to unlock extra features. Two plans:
- Premium 1 (₹499/month) - upload video lectures
- Premium 2 (₹999/month) - video lectures + live class scheduling

Payment is mock right now (just clicks through). Will integrate Razorpay properly later.

## Deployment

- Frontend → Vercel
- Backend → Render
- DB → MongoDB Atlas

## What I learned

- How JWT auth works end to end
- Handling file uploads with multer and cloudinary
- React context for state management
- Building REST APIs with Express
- MongoDB aggregation for attendance/result stats

## Future improvements if I continue this

- Mobile app version
- Real payment integration
- Push notifications when teacher uploads something
- Better video player with progress tracking