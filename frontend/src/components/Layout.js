import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NavItem = ({ to, icon, label, end }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
        isActive
          ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
          : 'text-gray-400 hover:text-white hover:bg-dark-600'
      }`
    }
  >
    <span className="text-xl">{icon}</span>
    <span>{label}</span>
  </NavLink>
);

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-dark-600">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white font-display text-lg">W</div>
          <div>
            <div className="font-display text-xl text-white tracking-wider">WAR9A.TN</div>
            <div className="text-xs text-gray-500">Betting Platform</div>
          </div>
        </div>
      </div>

      {/* Balance */}
      <div className="mx-4 mt-4 p-4 bg-gradient-to-r from-brand-500/10 to-dark-700 border border-brand-500/20 rounded-xl">
        <div className="text-xs text-gray-500 mb-1">Solde disponible</div>
        <div className="text-2xl font-bold text-brand-400 font-mono">
          {(user?.balance || 0).toFixed(2)} <span className="text-sm text-gray-500">TND</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        <NavItem to="/" icon="🏠" label="Accueil" end />
        <NavItem to="/tickets" icon="🎫" label="Tickets" />
        <NavItem to="/deposit" icon="💳" label="Dépôt" />
        <NavItem to="/wallet" icon="👛" label="Portefeuille" />
        {user?.role === 'admin' && (
          <NavItem to="/admin" icon="⚙️" label="Admin" />
        )}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-dark-600">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-dark-500 rounded-xl flex items-center justify-center text-brand-400 font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">{user?.name}</div>
            <div className="text-xs text-gray-500 font-mono">{user?.phone}</div>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full btn-secondary text-sm py-2">
          Déconnexion
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-dark-900">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-dark-800 border-r border-dark-600 flex-col fixed h-full z-20">
        <Sidebar />
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-dark-800 border-b border-dark-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white font-display">W</div>
          <span className="font-display text-lg text-white tracking-wider">WAR9A.TN</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-gray-400 text-xl">
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-dark-900/80" onClick={() => setMobileOpen(false)}>
          <div className="w-64 h-full bg-dark-800 border-r border-dark-600" onClick={e => e.stopPropagation()}>
            <div className="pt-16"><Sidebar /></div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-64 pt-14 md:pt-0">
        <div className="max-w-6xl mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
