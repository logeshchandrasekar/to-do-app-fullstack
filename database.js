// database.js
const sqlite3 = require('sqlite3').verbose();
const DB_SOURCE = "todo.db";

const db = new sqlite3.Database(DB_SOURCE, (err) => {
    if (err) {
      console.error(err.message);
      throw err;
    } else {
        console.log('Connected to the SQLite database.');
        db.serialize(() => {
            // Users table
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL
            )`, (err) => { if (err) console.error("Error creating 'users' table:", err.message); });

            // Tasks table with new sort_order column
            db.run(`CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                title TEXT NOT NULL,
                priority TEXT NOT NULL DEFAULT 'Medium',
                deadline TEXT,
                completed INTEGER DEFAULT 0,
                createdAt TEXT NOT NULL,
                sort_order INTEGER,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`, (err) => { if (err) console.error("Error creating 'tasks' table:", err.message); });

            // Subtasks table
            db.run(`CREATE TABLE IF NOT EXISTS subtasks (
                id TEXT PRIMARY KEY,
                task_id TEXT NOT NULL,
                title TEXT NOT NULL,
                completed INTEGER DEFAULT 0,
                FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
            )`, (err) => { if (err) console.error("Error creating 'subtasks' table:", err.message); });
        });
    }
});

module.exports = db;
