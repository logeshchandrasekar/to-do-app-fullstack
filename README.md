# TaskFlow — your task manager, gamified

**Live demo:** [TaskFlow Web App](https://taskflow-multiuser-webapp.onrender.com/)

## Tech Stack :

**Backend -**
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)

**Frontend -**
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=FFD62E)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)


-- A single-page task management web app with account-based authentication — turn completing your tasks list into XP, levels, and daily streaks, all on one continuous scrolling page.

> **This is the first full CRUD application I built** — my first time wiring up a database, authentication, and a fully deployed live backend by myself.

---

## Features

- Account-based authentication with hashed passwords (bcrypt) and JWT sessions
- Full task CRUD with subtasks, priority levels, and optional deadlines
- Search, status filters, and sorting — including manual drag-to-reorder
- XP and leveling system with daily completion streaks
- Live dashboard: completion stats, weekly activity chart, priority breakdown
- Light / dark theme toggle
- Single-page layout — dashboard and task list live on one continuous scroll, no page reloads
- Fully deployed and live on Render

---

## Screenshots

### Dashboard
![TaskFlow dashboard](assets/Taskflow%20dashboard.png)
The page opens straight into a live overview — total, active, and completed task counts with a completion rate, a weekly completion chart, a priority breakdown donut, and the current streak and level/XP progress. This sits at the top of the single scrolling page, right above the task list.

---

### My Tasks
![TaskFlow task list](assets/Taskflow%20taskbar.png)
Scrolling down the same page reveals the task list — search, status filters (All / Active / Completed), sort options, and each task shown with its priority and deadline. Completing a task here instantly updates the XP, streak, and stats above without a page change.

---

## Getting Started

```
git clone https://github.com/logeshchandrasekar/taskflow-webapp.git
cd taskflow-webapp
npm install
npm run build
npm start
```

The app runs at `http://localhost:3000`. Demo it yourself by registering a new account — there's no seeded login.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Create a new user account |
| POST | `/login` | Authenticate and receive a JWT |
| GET | `/stats` | Get XP, level, streak, and dashboard stats |
| GET | `/tasks` | Get tasks (supports search, status filter, sort) |
| POST | `/tasks` | Create a task |
| PUT | `/tasks/:id` | Update a task (completing it awards XP and streak) |
| DELETE | `/tasks/:id` | Delete a task |
| POST | `/tasks/reorder` | Save custom task order |
| POST | `/tasks/:taskId/subtasks` | Add a subtask |
| PUT | `/subtasks/:id` | Update a subtask |
| DELETE | `/subtasks/:id` | Delete a subtask |

## A Note on Data Persistence

This app uses SQLite for simplicity. Render's free-tier web services use an ephemeral filesystem, so the database resets on restart or redeploy — expect demo data to be temporary rather than permanent.

## Status

Live and deployed on Render — my first full CRUD application, still actively expanding as I learn full-stack development.

---

## Contact

- **Email:** logeshwarchandrasekar@gmail.com
- **LinkedIn:** [linkedin.com/in/logesh-chandrasekar08](https://linkedin.com/in/logesh-chandrasekar08)
- **GitHub:** [github.com/logeshchandrasekar](https://github.com/logeshchandrasekar)
