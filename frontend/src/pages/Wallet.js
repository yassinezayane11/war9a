import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Wallet() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [tab, setTab] = useState('transactions');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/users/transactions'),
      api.get('/deposits/my')
    ]).then(([tx, dep]) => {
      setTransactions(tx.data);
      setDeposits(dep.data);
    }).finally(() => setLoading(false));
  }, []);

  const statusBadge = (s) => {
    if (s === 'pending') return <span className="badge-pending">En attente</span>;
    if (s === 'approved') return <span className="badge-approved">Approuvé</span>;
    return <span className="badge-rejected">Rejeté</span>;
  };

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div>
        <h1 className="font-display text-3xl text-white tracking-wider">MON PORTEFEUILLE</h1>
      </div>

      {/* Balance card */}
      <div className="gradient-border p-px">
        <div className="bg-dark-800 rounded-2xl p-8">
          <div className="text-gray-500 text-sm mb-2">Solde disponible</div>
          <div className="font-mono font-bold text-5xl text-brand-400">
            {(user?.balance || 0).toFixed(3)} <span className="text-2xl text-gray-500">TND</span>
          </div>
          <div className="mt-4 flex gap-3">
            <a href="/deposit" className="btn-primary text-sm py-2">+ Déposer</a>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-dark-600">
        {['transactions', 'deposits'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-3 px-4 text-sm font-medium transition-all border-b-2 ${
              tab === t ? 'border-brand-500 text-brand-400' : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}>
            {t === 'transactions' ? '📋 Transactions' : '💰 Dépôts'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tab === 'transactions' ? (
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <div className="card text-center py-12 text-gray-600">Aucune transaction</div>
          ) : transactions.map(tx => (
            <div key={tx._id} className="card p-4 flex items-center justify-between hover:border-dark-500 transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg
                  ${tx.type === 'deposit' ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
                  {tx.type === 'deposit' ? '↓' : '↑'}
                </div>
                <div>
                  <div className="font-medium text-white text-sm">{tx.description}</div>
                  <div className="text-xs text-gray-500 font-mono">
                    {new Date(tx.createdAt).toLocaleString('fr-TN')}
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5 font-mono">
                    Avant: {tx.balanceBefore?.toFixed(2)} → Après: {tx.balanceAfter?.toFixed(2)} TND
                  </div>
                </div>
              </div>
              <div className={`font-mono font-bold text-lg ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} TND
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {deposits.length === 0 ? (
            <div className="card text-center py-12 text-gray-600">Aucun dépôt</div>
          ) : deposits.map(d => (
            <div key={d._id} className="card p-4 hover:border-dark-500 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">💳</div>
                  <div>
                    <div className="font-mono font-bold text-white text-lg">{d.amount.toFixed(3)} TND</div>
                    <div className="text-xs text-gray-500">{new Date(d.createdAt).toLocaleString('fr-TN')}</div>
                  </div>
                </div>
                {statusBadge(d.status)}
              </div>
              <div className="text-xs text-gray-500 flex gap-4 mt-1">
                <span>Méthode: <span className="text-gray-300">{d.method}</span></span>
                <span>Tél: <span className="text-gray-300 font-mono">+216 {d.phone}</span></span>
                {d.orangeCode && <span>Code: <span className="text-gray-300 font-mono">{d.orangeCode}</span></span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
