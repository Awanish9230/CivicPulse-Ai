import React, { ReactNode, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LazyMotion, domAnimation } from 'framer-motion';
import {
  AlertCircle, Building2, Map, Tag, CheckSquare, MessageSquare,
  MessageCircle, Bell, FileText, ShieldAlert, Database, Webhook,
  Link2, History, Settings
} from 'lucide-react';
import AppLayout from './components/layout/AppLayout';
import AuthorityLayout from './components/layout/AuthorityLayout';
import AdminLayout from './components/layout/AdminLayout';
import PageLoader from './components/common/PageLoader';
import ModuleUnderConstruction from './components/common/ModuleUnderConstruction';
import { useNetworkSync } from './hooks/useNetworkSync';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
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

const Auth = React.lazy(() => import('./pages/auth/Auth'));
const ForgotPassword = React.lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/auth/ResetPassword'));
const Home = React.lazy(() => import('./pages/home/Home'));
const Community = React.lazy(() => import('./pages/community/Community'));
const Petitions = React.lazy(() => import('./pages/petitions/Petitions'));
const Profile = React.lazy(() => import('./pages/profile/Profile'));
const Notifications = React.lazy(() => import('./pages/notifications/Notifications'));
const MyComplaints = React.lazy(() => import('./pages/complaints/MyComplaints'));
const Dashboard = React.lazy(() => import('./pages/dashboard/Dashboard'));

const AuthorityTasks = React.lazy(() => import('./pages/authority/tasks/AuthorityTasks'));
const AuthorityAnalytics = React.lazy(() => import('./pages/authority/analytics/AuthorityAnalytics'));
const AuthoritySettings = React.lazy(() => import('./pages/authority/settings/AuthoritySettings'));
const ManageMembers = React.lazy(() => import('./pages/authority/members/ManageMembers'));
const AuthorityChat = React.lazy(() => import('./pages/authority/chat/AuthorityChat'));

const AdminDashboard = React.lazy(() => import('./pages/admin/dashboard/AdminDashboard'));
const ManageUsers = React.lazy(() => import('./pages/admin/users/ManageUsers'));
const ManageAuthorities = React.lazy(() => import('./pages/admin/authorities/ManageAuthorities'));
const ManageComplaints = React.lazy(() => import('./pages/admin/complaints/ManageComplaints'));
const AdminAIDashboard = React.lazy(() => import('./pages/admin/ai/AdminAIDashboard'));
const AdminAnalytics = React.lazy(() => import('./pages/admin/analytics/AdminAnalytics'));
const AdminBroadcasts = React.lazy(() => import('./pages/admin/broadcasts/AdminBroadcasts'));
const AdminMonitor = React.lazy(() => import('./pages/admin/monitor/AdminMonitor'));
const AuditLogs = React.lazy(() => import('./pages/admin/audit/AuditLogs'));
const AdminAppeals = React.lazy(() => import('./pages/admin/appeals/AdminAppeals'));

const ADMIN_PLACEHOLDER_ROUTES = [
  { path: 'departments', title: 'Departments Management', description: 'Configure city departments and jurisdictions.', icon: Building2 },
  { path: 'locations', title: 'Locations & Wards', description: 'Manage city wards, zones, and geographic boundaries.', icon: Map },
  { path: 'categories', title: 'Complaint Categories', description: 'Manage complaint types and SLA resolution targets.', icon: Tag },
  { path: 'tasks', title: 'Task Management', description: 'Monitor and reassign department tasks.', icon: CheckSquare },
  { path: 'community', title: 'Community Moderation', description: 'Moderate community chat channels and user reports.', icon: MessageSquare },
  { path: 'feedback', title: 'Feedback & Reviews', description: 'Review citizen feedback on resolved complaints.', icon: MessageCircle },
  { path: 'notifications', title: 'System Notifications', description: 'Manage notification templates and delivery logs.', icon: Bell },
  { path: 'reports', title: 'Reports & Exports', description: 'Generate and download municipal compliance reports.', icon: FileText },
  { path: 'security', title: 'Security Center', description: 'Monitor security alerts, failed logins, and access rules.', icon: ShieldAlert },
  { path: 'database', title: 'Database Metrics', description: 'Monitor database health and storage.', icon: Database },
  { path: 'api', title: 'API & Webhooks', description: 'Manage API keys and webhook integrations.', icon: Webhook },
  { path: 'integrations', title: 'Third-Party Integrations', description: 'Connect external municipal systems and services.', icon: Link2 },
  { path: 'backups', title: 'Database Backups', description: 'Schedule and restore system backups.', icon: History },
  { path: 'settings', title: 'Global Settings', description: 'Configure system-wide parameters.', icon: Settings },
];

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
    <div
      className="fixed top-0 left-0 w-full z-[9999] text-center text-[11px] font-black tracking-wider py-1.5 shadow-md uppercase transition-colors"
      style={{ backgroundColor: isOnline ? '#10B981' : '#EF4444', color: 'white' }}
    >
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

              <Route path="/" element={<AppLayout />}>
                <Route index element={<Home />} />
                <Route path="complaints" element={<MyComplaints />} />
                <Route path="community" element={<Community />} />
                <Route path="petitions" element={<Petitions />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="profile" element={<Profile />} />
                <Route path="dashboard" element={<Dashboard />} />
              </Route>

              <Route path="/authority" element={<AuthorityLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="tasks" element={<AuthorityTasks />} />
                <Route path="chat" element={<AuthorityChat />} />
                <Route path="members" element={<ManageMembers />} />
                <Route path="analytics" element={<AuthorityAnalytics />} />
                <Route path="settings" element={<AuthoritySettings />} />
              </Route>

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
                <Route path="appeals" element={<AdminAppeals />} />
                {ADMIN_PLACEHOLDER_ROUTES.map((route) => (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={
                      <ModuleUnderConstruction
                        title={route.title}
                        description={route.description}
                        icon={route.icon}
                      />
                    }
                  />
                ))}
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
