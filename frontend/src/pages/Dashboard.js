import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

function StatCard({ icon, label, value, sub, color = 'brand' }) {
  return (
    <div className="card hover:border-dark-500 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-gray-500 text-sm mb-1">{label}</div>
          <div className={`text-2xl font-bold ${color === 'brand' ? 'text-brand-400' : color === 'green' ? 'text-green-400' : 'text-white'}`}>
            {value}
          </div>
          {sub && <div className="text-xs text-gray-600 mt-1">{sub}</div>}
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    refreshUser();
    api.get('/users/transactions').then(r => setTransactions(r.data)).catch(() => {});
    api.get('/deposits/my').then(r => setDeposits(r.data)).catch(() => {});
    api.get('/tickets').then(r => setTickets(r.data)).catch(() => {});
  }, []);

  const pendingDeposits = deposits.filter(d => d.status === 'pending').length;
  const purchasedTickets = tickets.filter(t => t.isPurchased).length;

  return (
    <div className="space-y-8 animate-fadeInUp">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl text-white tracking-wider">
          BONJOUR, {user?.name?.toUpperCase()} 👋
        </h1>
        <p className="text-gray-500 mt-1">Voici votre tableau de bord</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon="💰" label="Solde" value={`${(user?.balance || 0).toFixed(2)} TND`} color="brand" />
        <StatCard icon="🎫" label="Tickets achetés" value={purchasedTickets} color="green" />
        <StatCard icon="⏳" label="Dépôts en attente" value={pendingDeposits} />
        <StatCard icon="📋" label="Transactions" value={transactions.length} />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/deposit" className="card border-dashed border-brand-500/30 hover:border-brand-500 hover:bg-brand-500/5 transition-all cursor-pointer group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-500/10 rounded-xl flex items-center justify-center text-2xl group-hover:bg-brand-500/20 transition-all">💳</div>
            <div>
              <div className="font-semibold text-white">Faire un dépôt</div>
              <div className="text-sm text-gray-500">Recharger votre solde</div>
            </div>
          </div>
        </Link>
        <Link to="/tickets" className="card border-dashed border-green-500/30 hover:border-green-500 hover:bg-green-500/5 transition-all cursor-pointer group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-2xl group-hover:bg-green-500/20 transition-all">🎫</div>
            <div>
              <div className="font-semibold text-white">Voir les tickets</div>
              <div className="text-sm text-gray-500">Acheter des pronostics</div>
            </div>
          </div>
        </Link>
        <Link to="/wallet" className="card border-dashed border-blue-500/30 hover:border-blue-500 hover:bg-blue-500/5 transition-all cursor-pointer group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-2xl group-hover:bg-blue-500/20 transition-all">👛</div>
            <div>
              <div className="font-semibold text-white">Mon portefeuille</div>
              <div className="text-sm text-gray-500">Historique des transactions</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent transactions */}
      <div className="card">
        <h2 className="font-display text-xl text-white tracking-wide mb-4">TRANSACTIONS RÉCENTES</h2>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-600">Aucune transaction</div>
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 5).map(tx => (
              <div key={tx._id} className="flex items-center justify-between p-3 bg-dark-700 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm
                    ${tx.type === 'deposit' ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
                    {tx.type === 'deposit' ? '↓' : '↑'}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{tx.description}</div>
                    <div className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleDateString('fr-TN')}</div>
                  </div>
                </div>
                <div className={`font-mono font-semibold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} TND
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
