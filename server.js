// server.js
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const db = require('./database.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your-super-secret-key-change-this';

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static('public'));// Serve static files from 'public' directory

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
app.post('/register', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required." });
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

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const sql = "SELECT * FROM users WHERE email = ?";
    db.get(sql, [email], (err, user) => {
        if (err || !user || !bcrypt.compareSync(password, user.password_hash)) {
            return res.status(400).json({ message: "Invalid email or password." });
        }
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    });
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

app.put('/tasks/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { title, deadline, completed, priority } = req.body;
    const sql = `UPDATE tasks SET title = COALESCE(?, title), deadline = COALESCE(?, deadline), completed = COALESCE(?, completed), priority = COALESCE(?, priority) WHERE id = ? AND user_id = ?`;
    const completedInt = typeof completed === 'boolean' ? (completed ? 1 : 0) : undefined;
    const params = [title, deadline, completedInt, priority, id, req.user.id];
    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ "error": err.message });
        if (this.changes === 0) return res.status(404).json({ message: "Task not found or you don't have permission." });
        res.status(200).json({ message: "Task updated successfully." });
    });
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
    const newSubtask = { id: uuidv4(), task_id: taskId, title: title.trim(), completed: 0 };
    const sql = 'INSERT INTO subtasks (id, task_id, title, completed) VALUES (?, ?, ?, ?)';
    db.run(sql, [newSubtask.id, newSubtask.task_id, newSubtask.title, newSubtask.completed], function(err) {
        if (err) return res.status(500).json({ "error": err.message });
        res.status(201).json({ ...newSubtask, completed: false });
    });
});

app.put('/subtasks/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { completed } = req.body;
    const completedInt = typeof completed === 'boolean' ? (completed ? 1 : 0) : undefined;
    const sql = `UPDATE subtasks SET completed = ? WHERE id = ?`;
    db.run(sql, [completedInt, id], function(err) {
        if (err) return res.status(500).json({ "error": err.message });
        if (this.changes === 0) return res.status(404).json({ message: "Subtask not found." });
        res.status(200).json({ message: "Subtask updated." });
    });
});

app.delete('/subtasks/:id', authenticateToken, (req, res) => {
    const sql = 'DELETE FROM subtasks WHERE id = ?';
    db.run(sql, [req.params.id], function(err) {
        if (err) return res.status(500).json({ "error": err.message });
        if (this.changes === 0) return res.status(404).json({ message: "Subtask not found." });
        res.status(204).send();
    });
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
