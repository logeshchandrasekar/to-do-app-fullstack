// src/pages/Home.jsx
import Dashboard from './Dashboard';
import Tasks from './Tasks';

export default function Home() {
    return (
        <div className="space-y-10">
            <Dashboard />
            <Tasks />
        </div>
    );
}
