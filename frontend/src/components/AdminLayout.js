import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminNav = ({ to, icon, label, end }) => (
  <NavLink to={to} end={end}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
        isActive ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                 : 'text-gray-400 hover:text-white hover:bg-dark-600'
      }`
    }>
    <span className="text-lg">{icon}</span>
    <span>{label}</span>
  </NavLink>
);

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-dark-600">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white">⚙️</div>
          <div>
            <div className="font-display text-xl text-white tracking-wider">ADMIN</div>
            <div className="text-xs text-purple-400">war9a.tn</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <AdminNav to="/admin" icon="📊" label="Dashboard" end />
        <AdminNav to="/admin/deposits" icon="💰" label="Dépôts" />
        <AdminNav to="/admin/tickets" icon="🎫" label="Tickets" />
        <AdminNav to="/admin/users" icon="👥" label="Utilisateurs" />
        <div className="pt-4 border-t border-dark-600 mt-4">
          <AdminNav to="/" icon="🏠" label="Vue utilisateur" />
        </div>
      </nav>
      <div className="p-4 border-t border-dark-600">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-purple-900/50 rounded-xl flex items-center justify-center text-purple-400 font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white truncate">{user?.name}</div>
            <div className="text-xs text-purple-400">Administrateur</div>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full btn-secondary text-sm py-2">Déconnexion</button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-dark-900">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-dark-800 border-r border-dark-600 fixed h-full flex-col z-20">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-dark-800 border-b border-dark-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white text-sm">⚙️</div>
          <span className="font-display text-lg text-white tracking-wider">ADMIN</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-gray-400 text-xl p-1">
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-black/70" onClick={() => setMobileOpen(false)}>
          <div className="w-64 h-full bg-dark-800 border-r border-dark-600" onClick={e => e.stopPropagation()}>
            <div className="pt-16 h-full"><SidebarContent /></div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-64 pt-14 md:pt-0 min-w-0">
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
