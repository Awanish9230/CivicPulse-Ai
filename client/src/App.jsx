import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppLayout from './components/layout/AppLayout';
import AuthorityLayout from './components/layout/AuthorityLayout';
import AdminLayout from './components/layout/AdminLayout';

import Auth from './pages/Auth';
import Home from './pages/Home';
import Community from './pages/Community';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import MyComplaints from './pages/MyComplaints';
import Dashboard from './pages/Dashboard';

// Placeholders for missing Authority Routes
const AuthorityTasks = () => <div className="p-8"><h1 className="text-2xl font-bold">Assigned Tasks</h1></div>;
const AuthorityAnalytics = () => <div className="p-8"><h1 className="text-2xl font-bold">Analytics & Reports</h1></div>;
const AuthoritySettings = () => <div className="p-8"><h1 className="text-2xl font-bold">Authority Settings</h1></div>;

// Placeholders for missing Admin Routes
const AdminMonitor = () => <div className="p-8"><h1 className="text-2xl font-bold">System Monitor</h1></div>;
const AdminAuthorities = () => <div className="p-8"><h1 className="text-2xl font-bold">Manage Authorities</h1></div>;
const AdminBroadcasts = () => <div className="p-8"><h1 className="text-2xl font-bold">Global Broadcasts</h1></div>;
const AdminSettings = () => <div className="p-8"><h1 className="text-2xl font-bold">System Settings</h1></div>;

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/auth" element={<Auth />} />
        
        {/* Citizen Zone */}
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="complaints" element={<MyComplaints />} />
          <Route path="community" element={<Community />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Authority Zone */}
        <Route path="/authority" element={<AuthorityLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="tasks" element={<AuthorityTasks />} />
          <Route path="analytics" element={<AuthorityAnalytics />} />
          <Route path="settings" element={<AuthoritySettings />} />
        </Route>

        {/* Admin Zone */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminMonitor />} />
          <Route path="authorities" element={<AdminAuthorities />} />
          <Route path="broadcasts" element={<AdminBroadcasts />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
