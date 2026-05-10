import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

function StatCard({ icon, label, value, to, color, subtext }) {
  const colors = {
    orange: 'border-brand-500/30 text-brand-400',
    green:  'border-green-500/30 text-green-400',
    yellow: 'border-yellow-500/30 text-yellow-400',
    blue:   'border-blue-500/30 text-blue-400',
    purple: 'border-purple-500/30 text-purple-400',
    red:    'border-red-500/30 text-red-400',
  };
  const card = (
    <div className={`card border hover:scale-105 transition-all cursor-pointer ${colors[color] || ''}`}>
      <div className="text-2xl sm:text-3xl mb-3">{icon}</div>
      <div className={`text-2xl sm:text-3xl font-bold font-mono ${colors[color]?.split(' ')[1] || 'text-white'}`}>{value}</div>
      <div className="text-gray-500 text-sm mt-1">{label}</div>
      {subtext && <div className="text-gray-600 text-xs mt-1">{subtext}</div>}
    </div>
  );
  return to ? <Link to={to}>{card}</Link> : card;
}

// Simple bar chart component
function RevenueChart({ data }) {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.amount));

  return (
    <div className="card">
      <h3 className="font-display text-lg text-white mb-4">Revenus des 7 derniers jours</h3>
      <div className="flex items-end gap-2 h-40">
        {data.map((day, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div
              className="w-full bg-brand-500/50 rounded-t transition-all hover:bg-brand-500"
              style={{ height: `${(day.amount / maxValue) * 100}%`, minHeight: day.amount > 0 ? '4px' : '0' }}
            />
            <div className="text-xs text-gray-500">{day._id.slice(5)}</div>
            <div className="text-xs text-brand-400">{day.amount.toFixed(0)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [promoStats, setPromoStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/promo-stats')
    ])
      .then(([statsRes, promoRes]) => {
        setStats(statsRes.data);
        setPromoStats(promoRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeInUp">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl text-white tracking-wider">ADMIN DASHBOARD</h1>
        <p className="text-gray-500 mt-1">Vue d'ensemble de war9a.tn</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          icon="👥"
          label="Utilisateurs"
          value={stats?.users?.total ?? '—'}
          to="/admin/users"
          color="blue"
          subtext={`${stats?.users?.newToday ?? 0} aujourd'hui`}
        />
        <StatCard
          icon="✉️"
          label="Emails Vérifiés"
          value={stats?.users?.verifiedEmails ?? '—'}
          color="purple"
          subtext={`sur ${stats?.users?.withEmail ?? 0} total`}
        />
        <StatCard
          icon="💰"
          label="Dépôts"
          value={stats?.deposits?.total ?? '—'}
          to="/admin/deposits"
          color="green"
          subtext={`${stats?.deposits?.pending ?? 0} en attente`}
        />
        <StatCard
          icon="🎫"
          label="Tickets Actifs"
          value={stats?.tickets?.active ?? '—'}
          to="/admin/tickets"
          color="orange"
          subtext={`${stats?.tickets?.expired ?? 0} expirés`}
        />
        <StatCard
          icon="�"
          label="Tickets Gagnants"
          value={stats?.tickets?.winning ?? '—'}
          color="yellow"
        />
        <StatCard
          icon="🚫"
          label="Bannis"
          value={stats?.users?.banned ?? '—'}
          to="/admin/banned-devices"
          color="red"
        />
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card border-green-500/30">
          <div className="text-green-400 text-sm mb-1">Revenus Totaux</div>
          <div className="text-2xl font-bold text-white font-mono">
            {(stats?.purchases?.totalRevenue ?? 0).toFixed(2)} TND
          </div>
        </div>
        <div className="card border-blue-500/30">
          <div className="text-blue-400 text-sm mb-1">Total Dépôts Approuvés</div>
          <div className="text-2xl font-bold text-white font-mono">
            {(stats?.deposits?.totalAmount ?? 0).toFixed(2)} TND
          </div>
        </div>
        <div className="card border-brand-500/30">
          <div className="text-brand-400 text-sm mb-1">Achats Aujourd'hui</div>
          <div className="text-2xl font-bold text-white font-mono">
            {stats?.purchases?.today ?? 0}
          </div>
        </div>
        <div className="card border-purple-500/30">
          <div className="text-purple-400 text-sm mb-1">Promos Utilisées</div>
          <div className="text-2xl font-bold text-white font-mono">
            {stats?.promoUsages ?? 0}
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      {stats?.weeklyRevenue && <RevenueChart data={stats.weeklyRevenue} />}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/admin/deposits" className="card hover:border-yellow-500/30 transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-900/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">💰</div>
            <div className="min-w-0">
              <div className="font-semibold text-white group-hover:text-yellow-400 transition-colors">Dépôts</div>
              <div className="text-sm text-gray-500">{stats?.deposits?.pending ?? 0} en attente</div>
            </div>
          </div>
        </Link>
        <Link to="/admin/tickets" className="card hover:border-brand-500/30 transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-500/10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🎫</div>
            <div className="min-w-0">
              <div className="font-semibold text-white group-hover:text-brand-400 transition-colors">Tickets</div>
              <div className="text-sm text-gray-500">Gérer les pronostics</div>
            </div>
          </div>
        </Link>
        <Link to="/admin/users" className="card hover:border-blue-500/30 transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-900/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">👥</div>
            <div className="min-w-0">
              <div className="font-semibold text-white group-hover:text-blue-400 transition-colors">Utilisateurs</div>
              <div className="text-sm text-gray-500">{stats?.users?.total ?? 0} comptes</div>
            </div>
          </div>
        </Link>
        <Link to="/admin/email-broadcast" className="card hover:border-purple-500/30 transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-900/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">📧</div>
            <div className="min-w-0">
              <div className="font-semibold text-white group-hover:text-purple-400 transition-colors">Email Broadcast</div>
              <div className="text-sm text-gray-500">Campagnes marketing</div>
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
