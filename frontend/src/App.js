import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tickets from './pages/Tickets';
import Deposit from './pages/Deposit';
import Wallet from './pages/Wallet';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminDeposits from './pages/admin/AdminDeposits';
import AdminTickets from './pages/admin/AdminTickets';
import AdminUsers from './pages/admin/AdminUsers';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  return user ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'admin') return <Navigate to="/" />;
  return children;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/" /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="tickets" element={<Tickets />} />
            <Route path="deposit" element={<Deposit />} />
            <Route path="wallet" element={<Wallet />} />
          </Route>

          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="deposits" element={<AdminDeposits />} />
            <Route path="tickets" element={<AdminTickets />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
        </Routes>
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
