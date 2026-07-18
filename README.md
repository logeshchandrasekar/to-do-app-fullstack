# TaskFlow Web App — Full Stack

**Live demo :** [Task-Flow Web App](https://taskflow-multiuser-webapp.onrender.com/)

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)

>  **This is my first full-stack tech project** — a complete CRUD application built and deployed end to end. First time wiring up a database, authentication, and a live backend by myself.

## About

A user-friendly Task management (to-do) web application with account-based authentication, task and subtask management, priority levels, deadlines, and drag-and-drop reordering. Built with a Node.js/Express backend, SQLite database, and a vanilla JS frontend — deployed live on Render.

## Features

- User registration and login with hashed passwords (bcrypt) and JWT-based sessions
- Full CRUD on tasks: create, edit, complete, delete
- Subtasks per task
- Priority levels (High / Medium / Low) and optional deadlines
- Search, filter (active / completed), and sort (by priority, deadline, or created date)
- Drag-and-drop manual reordering (SortableJS)
- Light / dark theme toggle
- Fully deployed and live on Render

## Tech Stack

**Backend:** Node.js, Express 5, SQLite3, bcryptjs, jsonwebtoken, uuid, cors

**Frontend:** HTML, vanilla JavaScript, Tailwind CSS (CDN), SortableJS

## Getting Started

```bash
git clone https://github.com/logeshchandrasekar/to-do-app-fullstack.git
cd to-do-app-fullstack
npm install
npm start
```

The app runs at `http://localhost:3000`.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Create a new user account |
| POST | `/login` | Authenticate and receive a JWT |
| GET | `/tasks` | Get all tasks for the logged-in user (supports search, status filter, sort) |
| POST | `/tasks` | Create a new task |
| PUT | `/tasks/:id` | Update a task |
| DELETE | `/tasks/:id` | Delete a task |
| POST | `/tasks/reorder` | Save custom task order |
| POST | `/tasks/:taskId/subtasks` | Add a subtask to a task |
| PUT | `/subtasks/:id` | Update a subtask |
| DELETE | `/subtasks/:id` | Delete a subtask |

## A Note on Data Persistence

This app uses SQLite for simplicity. Render's free-tier web services use an ephemeral filesystem, so the database resets on restart or redeploy — expect demo data to be temporary rather than permanent.

## Roadmap / Improvements

Things I'm actively working on as I learn:

- [ ] Add rate limiting on login/register
- [ ] Move to a persistent database (e.g. Postgres) for real data retention

## Contact

- **Email:** logeshwarchandrasekar@gmail.com
- **LinkedIn:** [linkedin.com/in/logesh-chandrasekar08](https://linkedin.com/in/logesh-chandrasekar08)
- **GitHub:** [github.com/logeshchandrasekar](https://github.com/logeshchandrasekar)
