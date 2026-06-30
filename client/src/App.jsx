import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppLayout from './components/layout/AppLayout';
import AuthorityLayout from './components/layout/AuthorityLayout';
import AdminLayout from './components/layout/AdminLayout';
import PageLoader from './components/common/PageLoader';

const Auth = React.lazy(() => import('./pages/Auth'));
const Home = React.lazy(() => import('./pages/Home'));
const Community = React.lazy(() => import('./pages/Community'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
const MyComplaints = React.lazy(() => import('./pages/MyComplaints'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));

const AuthorityTasks = React.lazy(() => import('./pages/authority/AuthorityTasks'));
const AuthorityAnalytics = React.lazy(() => import('./pages/authority/AuthorityAnalytics'));
const AuthoritySettings = React.lazy(() => import('./pages/authority/AuthoritySettings'));
const ManageMembers = React.lazy(() => import('./pages/authority/ManageMembers'));
const AuthorityChat = React.lazy(() => import('./pages/authority/AuthorityChat'));

const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const ManageUsers = React.lazy(() => import('./pages/admin/ManageUsers'));
const ManageAuthorities = React.lazy(() => import('./pages/admin/ManageAuthorities'));
const ManageComplaints = React.lazy(() => import('./pages/admin/ManageComplaints'));
const AdminAIDashboard = React.lazy(() => import('./pages/admin/AdminAIDashboard'));
const AdminAnalytics = React.lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminBroadcasts = React.lazy(() => import('./pages/admin/AdminBroadcasts'));
const AdminMonitor = React.lazy(() => import('./pages/admin/AdminMonitor'));
const AuditLogs = React.lazy(() => import('./pages/admin/AuditLogs'));
const ManageDepartments = React.lazy(() => import('./pages/admin/ManageDepartments'));
const ManageLocations = React.lazy(() => import('./pages/admin/ManageLocations'));
const ManageCategories = React.lazy(() => import('./pages/admin/ManageCategories'));
const AdminTasks = React.lazy(() => import('./pages/admin/AdminTasks'));
const AdminCommunity = React.lazy(() => import('./pages/admin/AdminCommunity'));
const AdminFeedback = React.lazy(() => import('./pages/admin/AdminFeedback'));
const AdminNotifications = React.lazy(() => import('./pages/admin/AdminNotifications'));
const AdminReports = React.lazy(() => import('./pages/admin/AdminReports'));
const SecurityCenter = React.lazy(() => import('./pages/admin/SecurityCenter'));
const DatabaseManager = React.lazy(() => import('./pages/admin/DatabaseManager'));
const APIManager = React.lazy(() => import('./pages/admin/APIManager'));
const Integrations = React.lazy(() => import('./pages/admin/Integrations'));
const Backups = React.lazy(() => import('./pages/admin/Backups'));
const AdminSettings = React.lazy(() => import('./pages/admin/AdminSettings'));
// Dynamic Title Component
const DynamicTitle = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let pageName = 'CivicPulse AI';

    if (path === '/') pageName = 'Home | CivicPulse AI';
    else if (path === '/auth') pageName = 'Sign In | CivicPulse AI';
    else if (path.includes('/complaints')) pageName = 'My Complaints | CivicPulse AI';
    else if (path.includes('/community')) pageName = 'Community | CivicPulse AI';
    else if (path.includes('/notifications')) pageName = 'Notifications | CivicPulse AI';
    else if (path.includes('/profile')) pageName = 'Profile | CivicPulse AI';
    else if (path.includes('/dashboard')) pageName = 'Dashboard | CivicPulse AI';
    else if (path.includes('/authority')) pageName = 'Authority Portal | CivicPulse AI';
    else if (path.includes('/admin')) pageName = 'Admin Portal | CivicPulse AI';

    document.title = pageName;
  }, [location.pathname]);

  return null;
};

function App() {
  return (
    <BrowserRouter>
      <DynamicTitle />
      <Toaster position="top-right" />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          
          {/* Citizen Zone */}
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="complaints" element={<MyComplaints />} />
            <Route path="community" element={<Community />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
            <Route path="dashboard" element={<Dashboard />} />
          </Route>

          {/* Authority Zone */}
          <Route path="/authority" element={<AuthorityLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="tasks" element={<AuthorityTasks />} />
            <Route path="chat" element={<AuthorityChat />} />
            <Route path="members" element={<ManageMembers />} />
            <Route path="analytics" element={<AuthorityAnalytics />} />
            <Route path="settings" element={<AuthoritySettings />} />
          </Route>

          {/* Admin Zone */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="authorities" element={<ManageAuthorities />} />
            <Route path="citizens" element={<ManageUsers />} />
            <Route path="complaints" element={<ManageComplaints />} />
            <Route path="ai" element={<AdminAIDashboard />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="broadcasts" element={<AdminBroadcasts />} />
            <Route path="monitor" element={<AdminMonitor />} />
            <Route path="audit" element={<AuditLogs />} />
            <Route path="departments" element={<ManageDepartments />} />
            <Route path="locations" element={<ManageLocations />} />
            <Route path="categories" element={<ManageCategories />} />
            <Route path="tasks" element={<AdminTasks />} />
            <Route path="community" element={<AdminCommunity />} />
            <Route path="feedback" element={<AdminFeedback />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="security" element={<SecurityCenter />} />
            <Route path="database" element={<DatabaseManager />} />
            <Route path="api" element={<APIManager />} />
            <Route path="integrations" element={<Integrations />} />
            <Route path="backups" element={<Backups />} />
            <Route path="settings" element={<AdminSettings />} />
            {/* The rest of the routes will be added as they are built */}
            <Route path="*" element={<div className="p-8"><h1 className="text-2xl font-bold">Coming Soon</h1><p>This module is under development.</p></div>} />
          </Route>

        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
