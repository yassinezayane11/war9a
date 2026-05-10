import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Tickets = lazy(() => import('./pages/Tickets'));
const Deposit = lazy(() => import('./pages/Deposit'));
const Wallet = lazy(() => import('./pages/Wallet'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminDeposits = lazy(() => import('./pages/admin/AdminDeposits'));
const AdminTickets = lazy(() => import('./pages/admin/AdminTickets'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminBannedDevices = lazy(() => import('./pages/admin/AdminBannedDevices'));
const AdminMarketingImages = lazy(() => import('./pages/admin/AdminMarketingImages'));
const AdminTestimonials = lazy(() => import('./pages/admin/AdminTestimonials'));
const AdminEmailBroadcast = lazy(() => import('./pages/admin/AdminEmailBroadcast'));
const Layout = lazy(() => import('./components/Layout'));
const AdminLayout = lazy(() => import('./components/AdminLayout'));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-dark-900">
    <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'admin') return <Navigate to="/" />;
  return children;
}

function PublicRoute({ children }) {
  const { loading } = useAuth();
  if (loading) return <PageLoader />;
  return children;
}

function LandingRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? <Navigate to="/" /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            {/* Protected routes (top-level) */}
            <Route path="/tickets" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Tickets />} />
            </Route>
            <Route path="/deposit" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Deposit />} />
            </Route>
            <Route path="/wallet" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Wallet />} />
            </Route>

            {/* Protected User Routes */}
            <Route path="/dashboard" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="tickets" element={<Tickets />} />
              <Route path="deposit" element={<Deposit />} />
              <Route path="wallet" element={<Wallet />} />
            </Route>

            {/* Also support / as protected for backwards compatibility */}
            <Route path="/app" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="tickets" element={<Tickets />} />
              <Route path="deposit" element={<Deposit />} />
              <Route path="wallet" element={<Wallet />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="deposits" element={<AdminDeposits />} />
              <Route path="tickets" element={<AdminTickets />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="banned-devices" element={<AdminBannedDevices />} />
              <Route path="marketing" element={<AdminMarketingImages />} />
              <Route path="testimonials" element={<AdminTestimonials />} />
              <Route path="email-broadcast" element={<AdminEmailBroadcast />} />
            </Route>

            {/* Legacy route redirect */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        theme="dark"
        toastStyle={{ background: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: '12px' }}
      />
    </AuthProvider>
  );
}
