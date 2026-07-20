// gamification.js
// Small, self-contained helpers for TaskFlow's XP / level / streak system.
// Kept separate from server.js so the "game design" numbers are easy to find and tune.

const XP_BY_PRIORITY = { High: 25, Medium: 15, Low: 10 };
const XP_PER_LEVEL = 100; // flat curve: every 100 XP is a new level

function xpForPriority(priority) {
    return XP_BY_PRIORITY[priority] ?? XP_BY_PRIORITY.Medium;
}

function computeLevel(xp) {
    const safeXp = Math.max(0, xp || 0);
    const level = Math.floor(safeXp / XP_PER_LEVEL) + 1;
    const xpIntoLevel = safeXp % XP_PER_LEVEL;
    return { level, xpIntoLevel, xpForNextLevel: XP_PER_LEVEL };
}

// today/yesterday are compared as plain 'YYYY-MM-DD' strings (UTC) to avoid timezone drift.
function todayStr(date = new Date()) {
    return date.toISOString().slice(0, 10);
}

function daysBetween(aStr, bStr) {
    const a = new Date(aStr + 'T00:00:00Z');
    const b = new Date(bStr + 'T00:00:00Z');
    return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

// Called whenever a task transitions to completed=true.
// Only ever *advances* the streak — undoing a completion later does not unwind it,
// which keeps the logic simple and avoids punishing a genuine same-day toggle mistake.
function applyStreakOnCompletion(user, now = new Date()) {
    const today = todayStr(now);
    let { streak_count: streak, longest_streak: longest, last_completed_date: last } = user;

    if (last === today) {
        // Already logged activity today — no change.
    } else if (last && daysBetween(last, today) === 1) {
        streak += 1; // consecutive day
    } else {
        streak = 1; // gap in activity (or first ever completion) — streak restarts
    }
    longest = Math.max(longest || 0, streak);
    return { streak_count: streak, longest_streak: longest, last_completed_date: today };
}

module.exports = { xpForPriority, computeLevel, applyStreakOnCompletion, todayStr, XP_PER_LEVEL };
