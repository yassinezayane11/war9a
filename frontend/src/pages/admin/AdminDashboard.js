import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

function StatCard({ icon, label, value, to, color }) {
  const colors = {
    orange: 'border-brand-500/30 text-brand-400',
    green:  'border-green-500/30 text-green-400',
    yellow: 'border-yellow-500/30 text-yellow-400',
    blue:   'border-blue-500/30 text-blue-400',
    purple: 'border-purple-500/30 text-purple-400',
  };
  const card = (
    <div className={`card border hover:scale-105 transition-all cursor-pointer ${colors[color] || ''}`}>
      <div className="text-2xl sm:text-3xl mb-3">{icon}</div>
      <div className={`text-2xl sm:text-3xl font-bold font-mono ${colors[color]?.split(' ')[1] || 'text-white'}`}>{value}</div>
      <div className="text-gray-500 text-sm mt-1">{label}</div>
    </div>
  );
  return to ? <Link to={to}>{card}</Link> : card;
}


const banUser = async (id) => {
  await fetch(`${API_URL}/api/admin/ban/${id}`, {
    method: "PUT"
  });

  alert("User banned");
};



export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [promoStats, setPromoStats] = useState([]);

  useEffect(() => {
    api.get('/admin/stats').then(r => setStats(r.data)).catch(() => {});
    api.get('/admin/promo-stats').then(r => setPromoStats(r.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-8 animate-fadeInUp">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl text-white tracking-wider">ADMIN DASHBOARD</h1>
        <p className="text-gray-500 mt-1">Vue d'ensemble de war9a.tn</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard icon="👥" label="Utilisateurs" value={stats?.users ?? '—'} to="/admin/users" color="blue" />
        <StatCard icon="💰" label="Total dépôts" value={stats?.deposits ?? '—'} to="/admin/deposits" color="green" />
        <StatCard icon="⏳" label="En attente" value={stats?.pendingDeposits ?? '—'} to="/admin/deposits" color="yellow" />
        <StatCard icon="🎫" label="Tickets actifs" value={stats?.tickets ?? '—'} to="/admin/tickets" color="orange" />
        <StatCard icon="🎁" label="Promos utilisées" value={stats?.promoUsages ?? '—'} color="purple" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/admin/deposits" className="card hover:border-yellow-500/30 transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-900/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">💰</div>
            <div className="min-w-0">
              <div className="font-semibold text-white group-hover:text-yellow-400 transition-colors">Gérer les dépôts</div>
              <div className="text-sm text-gray-500">{stats?.pendingDeposits ?? 0} en attente</div>
            </div>
          </div>
        </Link>
        <Link to="/admin/tickets" className="card hover:border-brand-500/30 transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-500/10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🎫</div>
            <div className="min-w-0">
              <div className="font-semibold text-white group-hover:text-brand-400 transition-colors">Gérer les tickets</div>
              <div className="text-sm text-gray-500">Créer / modifier</div>
            </div>
          </div>
        </Link>
        <Link to="/admin/users" className="card hover:border-blue-500/30 transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-900/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">👥</div>
            <div className="min-w-0">
              <div className="font-semibold text-white group-hover:text-blue-400 transition-colors">Gérer les utilisateurs</div>
              <div className="text-sm text-gray-500">{stats?.users ?? 0} comptes</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent promo usage */}
      {promoStats.length > 0 && (
        <div className="card">
          <h2 className="font-display text-xl text-white tracking-wide mb-4">CODES PROMO RÉCENTS</h2>
          <div className="space-y-3">
            {promoStats.slice(0, 5).map(p => (
              <div key={p._id} className="flex items-center justify-between p-3 bg-dark-700 rounded-xl flex-wrap gap-2">
                <div>
                  <div className="text-sm font-medium text-white">{p.userId?.name}</div>
                  <div className="text-xs text-gray-500 font-mono">a utilisé le code <span className="text-purple-400">{p.promoCode}</span></div>
                  <div className="text-xs text-gray-600">de {p.ownerId?.name}</div>
                </div>
                <div className="text-green-400 font-mono font-semibold">+{p.bonusAmount} TND</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
