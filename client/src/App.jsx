import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LazyMotion, domAnimation } from 'framer-motion';
import AppLayout from './components/layout/AppLayout';
import AuthorityLayout from './components/layout/AuthorityLayout';
import AdminLayout from './components/layout/AdminLayout';
import PageLoader from './components/common/PageLoader';
import { useNetworkSync } from './hooks/useNetworkSync';
import { AlertCircle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg border border-slate-100">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-xl font-black text-slate-800 mb-2">Something went wrong</h2>
            <p className="text-slate-500 mb-6">
              {this.state.error ? this.state.error.message : "You need an internet connection to load this page for the first time. Please reconnect and refresh."}
            </p>
            <button onClick={() => window.location.reload()} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-colors">
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const Auth = React.lazy(() => import('./pages/Auth'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const Home = React.lazy(() => import('./pages/Home'));
const Community = React.lazy(() => import('./pages/Community'));
const Petitions = React.lazy(() => import('./pages/Petitions'));
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
const AdminAppeals = React.lazy(() => import('./pages/admin/AdminAppeals'));

// Dynamic Title Component
const DynamicTitle = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let pageName = 'CivicPulse AI';

    if (path === '/') pageName = 'Home | CivicPulse AI';
    else if (path.startsWith('/admin')) pageName = 'Admin Portal | CivicPulse AI';
    else if (path.startsWith('/authority')) pageName = 'Authority Portal | CivicPulse AI';
    else pageName = `${path.split('/')[1].charAt(0).toUpperCase() + path.split('/')[1].slice(1)} | CivicPulse AI`;

    document.title = pageName;
  }, [location.pathname]);

  return null;
};

const NetworkIndicator = () => {
  const { isOnline, isSyncing } = useNetworkSync();
  if (isOnline && !isSyncing) return null;
  return (
    <div className="fixed top-0 left-0 w-full z-[9999] text-center text-[11px] font-black tracking-wider py-1.5 shadow-md uppercase transition-colors"
         style={{ backgroundColor: isOnline ? '#10B981' : '#EF4444', color: 'white' }}>
        {!isOnline ? '⚠️ You are currently offline.' : '🔄 Syncing offline data...'}
    </div>
  );
};

function App() {
  return (
    <LazyMotion features={domAnimation} strict>
      <NetworkIndicator />
      <BrowserRouter>
        <DynamicTitle />
        <Toaster position="top-right" />
        <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
          {/* Citizen Zone */}
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="complaints" element={<MyComplaints />} />
            <Route path="community" element={<Community />} />
            <Route path="petitions" element={<Petitions />} />
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
            <Route path="appeals" element={<AdminAppeals />} />
            {/* The rest of the routes will be added as they are built */}
            <Route path="*" element={<div className="p-8"><h1 className="text-2xl font-bold">Coming Soon</h1><p>This module is under development.</p></div>} />
          </Route>

        </Routes>
        </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
    </LazyMotion>
  );
}

export default App;
