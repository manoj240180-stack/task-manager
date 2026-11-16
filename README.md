# Task Management Application

A full-stack task manager where each user registers, logs in and manages their own tasks.

## Tech stack
- **Frontend:** HTML, CSS, vanilla JavaScript (responsive, light and dark mode)
- **Backend:** Node.js, Express
- **Database:** MongoDB Atlas with Mongoose
- **Auth:** JWT tokens, passwords hashed with bcrypt
- **Hosting:** Render

## Features
- Register and log in with email and password
- Create, view, edit and delete tasks (title, description, status, priority, due date)
- Filter tasks by status: To do, In progress, Done
- Authorization: every task belongs to one user, and nobody can read or change another user's tasks
- Input validation and rate limiting on the login routes
- Works on phones, tablets and desktops

## API
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Log in and get a token |
| GET | `/api/auth/me` | Current user (token required) |
| GET | `/api/tasks?status=` | List my tasks |
| POST | `/api/tasks` | Create a task |
| PUT | `/api/tasks/:id` | Update my task |
| DELETE | `/api/tasks/:id` | Delete my task |

Task routes need the header `Authorization: Bearer <token>`.

## Run locally
1. Install Node.js 18 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and set `MONGODB_URI` (use the database name `taskmanager`) and `JWT_SECRET`.
4. Run `npm start` and open http://localhost:3000.

## Deploy on Render
1. Push the project to GitHub.
2. Create a Web Service. Build command `npm install`, start command `npm start`.
3. Add the environment variables `MONGODB_URI` and `JWT_SECRET`.
4. In MongoDB Atlas, allow network access from `0.0.0.0/0`.

## Live demo
https://task-manager-1-2k8p.onrender.com
