// server.js
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const db = require('./database.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { xpForPriority, computeLevel, applyStreakOnCompletion, todayStr } = require('./gamification.js');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this';
if (!process.env.JWT_SECRET) {
    console.warn('⚠️  JWT_SECRET env var not set — using an insecure fallback. Set JWT_SECRET in your environment (e.g. Render dashboard) before going to production.');
}

// --- Middleware ---
app.use(cors());
app.use(express.json());
// The React app is built (npm run build --prefix client) into public_dist/ and served as static files.
app.use(express.static(path.join(__dirname, 'public_dist')));

// --- Basic in-memory rate limiter (per IP+route) to slow down brute-force login/register attempts ---
const rateLimitStore = new Map();
const rateLimit = (maxAttempts, windowMs) => (req, res, next) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const entry = rateLimitStore.get(key);
    if (!entry || now - entry.start > windowMs) {
        rateLimitStore.set(key, { count: 1, start: now });
        return next();
    }
    entry.count += 1;
    if (entry.count > maxAttempts) {
        const retryAfterSec = Math.ceil((entry.start + windowMs - now) / 1000);
        res.set('Retry-After', String(retryAfterSec));
        return res.status(429).json({ message: 'Too many attempts. Please try again later.' });
    }
    next();
};

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- Auth Routes ---
app.post('/register', rateLimit(8, 15 * 60 * 1000), (req, res) => {
    let { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required." });
    email = email.trim().toLowerCase();
    if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters." });
    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);
    const id = uuidv4();
    const sql = 'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)';
    db.run(sql, [id, email, password_hash], function(err) {
        if (err) {
            if (err.code === 'SQLITE_CONSTRAINT') return res.status(409).json({ message: "Email already exists." });
            return res.status(500).json({ "error": err.message });
        }
        res.status(201).json({ message: "User created successfully." });
    });
});

app.post('/login', rateLimit(10, 15 * 60 * 1000), (req, res) => {
    let { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required." });
    email = email.trim().toLowerCase();
    const sql = "SELECT * FROM users WHERE email = ?";
    db.get(sql, [email], (err, user) => {
        if (err || !user || !bcrypt.compareSync(password, user.password_hash)) {
            return res.status(400).json({ message: "Invalid email or password." });
        }
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    });
});

// Returns the logged-in user's gamification snapshot (xp/level/streak) plus task totals for the dashboard.
app.get('/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await new Promise((resolve, reject) =>
            db.get('SELECT xp, streak_count, longest_streak, last_completed_date FROM users WHERE id = ?', [userId], (err, row) => err ? reject(err) : resolve(row))
        );
        const tasks = await new Promise((resolve, reject) =>
            db.all('SELECT priority, completed, completedAt FROM tasks WHERE user_id = ?', [userId], (err, rows) => err ? reject(err) : resolve(rows))
        );

        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const active = total - completed;
        const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

        const priorityBreakdown = { High: 0, Medium: 0, Low: 0 };
        tasks.forEach(t => { if (priorityBreakdown[t.priority] !== undefined) priorityBreakdown[t.priority] += 1; });

        // Last 7 days (including today), each with a count of tasks completed that day.
        const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setUTCDate(d.getUTCDate() - i);
            days.push({ date: todayStr(d), label: dayLabels[d.getUTCDay()], completed: 0 });
        }
        tasks.forEach(t => {
            if (!t.completedAt) return;
            const dateStr = t.completedAt.slice(0, 10);
            const day = days.find(d => d.date === dateStr);
            if (day) day.completed += 1;
        });

        const { level, xpIntoLevel, xpForNextLevel } = computeLevel(user?.xp ?? 0);

        res.json({
            totals: { total, active, completed, completionRate },
            priorityBreakdown,
            weekly: days,
            gamification: {
                xp: user?.xp ?? 0,
                level,
                xpIntoLevel,
                xpForNextLevel,
                streak: user?.streak_count ?? 0,
                longestStreak: user?.longest_streak ?? 0,
            },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Task & Subtask Routes ---

app.get('/tasks', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { status, sortBy, search } = req.query;
    let sql = "SELECT * FROM tasks WHERE user_id = ?";
    const params = [userId];

    if (search) { sql += ' AND title LIKE ?'; params.push(`%${search}%`); }
    if (status === 'active') { sql += ' AND completed = 0'; }
    else if (status === 'completed') { sql += ' AND completed = 1'; }

    switch (sortBy) {
        case 'priority': sql += " ORDER BY CASE priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 3 ELSE 4 END, sort_order ASC"; break;
        case 'deadline': sql += " ORDER BY CASE WHEN deadline IS NULL THEN 1 ELSE 0 END, deadline, sort_order ASC"; break;
        case 'createdAt': sql += " ORDER BY createdAt DESC"; break;
        default: sql += " ORDER BY sort_order ASC"; break; // Default to custom order
    }

    try {
        const tasks = await new Promise((resolve, reject) => db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows)));
        const taskIds = tasks.map(t => t.id);
        const subtasksSql = `SELECT * FROM subtasks WHERE task_id IN (${taskIds.map(() => '?').join(',')})`;
        const subtasks = taskIds.length > 0 ? await new Promise((resolve, reject) => db.all(subtasksSql, taskIds, (err, rows) => err ? reject(err) : resolve(rows))) : [];
        const tasksWithSubtasks = tasks.map(task => ({ ...task, completed: !!task.completed, subtasks: subtasks.filter(st => st.task_id === task.id).map(st => ({...st, completed: !!st.completed})) }));
        res.json(tasksWithSubtasks);
    } catch (err) { res.status(500).json({ "error": err.message }); }
});

app.post('/tasks', authenticateToken, (req, res) => {
    const { title, deadline, priority } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required.' });
    const newTask = { id: uuidv4(), user_id: req.user.id, title: title.trim(), priority: priority || 'Medium', deadline: deadline || null, completed: 0, createdAt: new Date().toISOString(), sort_order: Date.now() }; // Add sort_order
    const sql = 'INSERT INTO tasks (id, user_id, title, priority, deadline, completed, createdAt, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const params = [newTask.id, newTask.user_id, newTask.title, newTask.priority, newTask.deadline, newTask.completed, newTask.createdAt, newTask.sort_order];
    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ "error": err.message });
        res.status(201).json({ ...newTask, completed: false, subtasks: [] });
    });
});

// NEW: Route to handle reordering
app.post('/tasks/reorder', authenticateToken, (req, res) => {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
        return res.status(400).json({ message: "orderedIds must be an array." });
    }

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        const sql = 'UPDATE tasks SET sort_order = ? WHERE id = ? AND user_id = ?';
        orderedIds.forEach((id, index) => {
            db.run(sql, [index, id, req.user.id]);
        });
        db.run("COMMIT", (err) => {
            if (err) {
                db.run("ROLLBACK");
                return res.status(500).json({ error: err.message });
            }
            res.status(200).json({ message: "Tasks reordered successfully." });
        });
    });
});

app.put('/tasks/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { title, deadline, completed, priority } = req.body;
    const userId = req.user.id;

    try {
        const existing = await new Promise((resolve, reject) =>
            db.get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [id, userId], (err, row) => err ? reject(err) : resolve(row))
        );
        if (!existing) return res.status(404).json({ message: "Task not found or you don't have permission." });

        const completedInt = typeof completed === 'boolean' ? (completed ? 1 : 0) : undefined;
        const isCompletingNow = completedInt === 1 && !existing.completed;
        const isUncompletingNow = completedInt === 0 && !!existing.completed;
        const completedAt = isCompletingNow ? new Date().toISOString() : (isUncompletingNow ? null : undefined);

        const sql = `UPDATE tasks SET title = COALESCE(?, title), deadline = COALESCE(?, deadline), completed = COALESCE(?, completed), priority = COALESCE(?, priority), completedAt = COALESCE(?, completedAt) WHERE id = ? AND user_id = ?`;
        // Note: completedAt needs to be explicitly nullable on uncomplete, so we handle that case separately below.
        const params = [title, deadline, completedInt, priority, isCompletingNow ? completedAt : undefined, id, userId];
        await new Promise((resolve, reject) => db.run(sql, params, function(err) { err ? reject(err) : resolve(this); }));
        if (isUncompletingNow) {
            await new Promise((resolve, reject) => db.run('UPDATE tasks SET completedAt = NULL WHERE id = ?', [id], (err) => err ? reject(err) : resolve()));
        }

        // --- Gamification side-effects ---
        let gamificationDelta = null;
        if (isCompletingNow || isUncompletingNow) {
            const effectivePriority = priority || existing.priority;
            const delta = xpForPriority(effectivePriority) * (isCompletingNow ? 1 : -1);
            const user = await new Promise((resolve, reject) =>
                db.get('SELECT xp, streak_count, longest_streak, last_completed_date FROM users WHERE id = ?', [userId], (err, row) => err ? reject(err) : resolve(row))
            );
            const newXp = Math.max(0, (user?.xp ?? 0) + delta);

            if (isCompletingNow) {
                const streakUpdate = applyStreakOnCompletion(user);
                await new Promise((resolve, reject) => db.run(
                    'UPDATE users SET xp = ?, streak_count = ?, longest_streak = ?, last_completed_date = ? WHERE id = ?',
                    [newXp, streakUpdate.streak_count, streakUpdate.longest_streak, streakUpdate.last_completed_date, userId],
                    (err) => err ? reject(err) : resolve()
                ));
                gamificationDelta = { xpDelta: delta, ...computeLevel(newXp), streak: streakUpdate.streak_count };
            } else {
                // Undo: only roll back XP, leave streak history intact (see gamification.js for rationale).
                await new Promise((resolve, reject) => db.run('UPDATE users SET xp = ? WHERE id = ?', [newXp, userId], (err) => err ? reject(err) : resolve()));
                gamificationDelta = { xpDelta: delta, ...computeLevel(newXp), streak: user?.streak_count ?? 0 };
            }
        }

        res.status(200).json({ message: "Task updated successfully.", gamification: gamificationDelta });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/tasks/:id', authenticateToken, (req, res) => {
    const sql = 'DELETE FROM tasks WHERE id = ? AND user_id = ?';
    db.run(sql, [req.params.id, req.user.id], function(err) {
        if (err) return res.status(500).json({ "error": err.message });
        if (this.changes === 0) return res.status(404).json({ message: "Task not found or you don't have permission." });
        res.status(204).send();
    });
});

// Subtask Routes
app.post('/tasks/:taskId/subtasks', authenticateToken, (req, res) => {
    const { taskId } = req.params;
    const { title } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required.' });
    // Verify the parent task actually belongs to this user before attaching a subtask to it
    db.get('SELECT id FROM tasks WHERE id = ? AND user_id = ?', [taskId, req.user.id], (err, task) => {
        if (err) return res.status(500).json({ "error": err.message });
        if (!task) return res.status(404).json({ message: "Task not found or you don't have permission." });
        const newSubtask = { id: uuidv4(), task_id: taskId, title: title.trim(), completed: 0 };
        const sql = 'INSERT INTO subtasks (id, task_id, title, completed) VALUES (?, ?, ?, ?)';
        db.run(sql, [newSubtask.id, newSubtask.task_id, newSubtask.title, newSubtask.completed], function(err) {
            if (err) return res.status(500).json({ "error": err.message });
            res.status(201).json({ ...newSubtask, completed: false });
        });
    });
});

app.put('/subtasks/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { completed } = req.body;
    const completedInt = typeof completed === 'boolean' ? (completed ? 1 : 0) : undefined;
    // Only update the subtask if it belongs to a task owned by this user
    const sql = `UPDATE subtasks SET completed = ? WHERE id = ? AND task_id IN (SELECT id FROM tasks WHERE user_id = ?)`;
    db.run(sql, [completedInt, id, req.user.id], function(err) {
        if (err) return res.status(500).json({ "error": err.message });
        if (this.changes === 0) return res.status(404).json({ message: "Subtask not found or you don't have permission." });
        res.status(200).json({ message: "Subtask updated." });
    });
});

app.delete('/subtasks/:id', authenticateToken, (req, res) => {
    // Only delete the subtask if it belongs to a task owned by this user
    const sql = 'DELETE FROM subtasks WHERE id = ? AND task_id IN (SELECT id FROM tasks WHERE user_id = ?)';
    db.run(sql, [req.params.id, req.user.id], function(err) {
        if (err) return res.status(500).json({ "error": err.message });
        if (this.changes === 0) return res.status(404).json({ message: "Subtask not found or you don't have permission." });
        res.status(204).send();
    });
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
