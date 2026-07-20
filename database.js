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
            // Users table — includes gamification stats (xp/streak) directly on the user record
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                xp INTEGER NOT NULL DEFAULT 0,
                streak_count INTEGER NOT NULL DEFAULT 0,
                longest_streak INTEGER NOT NULL DEFAULT 0,
                last_completed_date TEXT
            )`, (err) => { if (err) console.error("Error creating 'users' table:", err.message); });

            // Tasks table with sort_order + completedAt (needed for weekly stats/charts)
            db.run(`CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                title TEXT NOT NULL,
                priority TEXT NOT NULL DEFAULT 'Medium',
                deadline TEXT,
                completed INTEGER DEFAULT 0,
                createdAt TEXT NOT NULL,
                completedAt TEXT,
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

            // --- Lightweight migration helper for existing databases created before gamification was added ---
            // SQLite errors on ALTER TABLE ADD COLUMN if the column already exists, so we check first.
            const ensureColumn = (table, column, definition) => {
                db.all(`PRAGMA table_info(${table})`, [], (err, columns) => {
                    if (err) return console.error(`Error reading schema for '${table}':`, err.message);
                    const exists = columns.some(c => c.name === column);
                    if (!exists) {
                        db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`, (alterErr) => {
                            if (alterErr) console.error(`Error adding column '${column}' to '${table}':`, alterErr.message);
                            else console.log(`Migrated: added '${column}' to '${table}'.`);
                        });
                    }
                });
            };
            ensureColumn('users', 'xp', 'INTEGER NOT NULL DEFAULT 0');
            ensureColumn('users', 'streak_count', 'INTEGER NOT NULL DEFAULT 0');
            ensureColumn('users', 'longest_streak', 'INTEGER NOT NULL DEFAULT 0');
            ensureColumn('users', 'last_completed_date', 'TEXT');
            ensureColumn('tasks', 'completedAt', 'TEXT');
        });
    }
});

module.exports = db;
