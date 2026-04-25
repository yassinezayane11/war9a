import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { toast } from 'react-toastify';
import api from '../../api';

function Portal({ children }) { return ReactDOM.createPortal(children, document.body); }

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [balanceModal, setBalanceModal] = useState(null);
  const [balanceForm, setBalanceForm] = useState({ amount: '', action: 'add' });
  const [balanceLoading, setBalanceLoading] = useState(false);

  const fetchUsers = () => {
    api.get('/admin/users').then(r => setUsers(r.data)).catch(() => toast.error('Erreur')).finally(() => setLoading(false));
  };
  useEffect(() => { fetchUsers(); }, []);

  const toggleUser = async (id) => {
    try {
      const { data } = await api.patch(`/admin/users/${id}/toggle`);
      setUsers(users.map(u => u._id === id ? data.user : u));
      toast.success(data.message);
    } catch { toast.error('Erreur'); }
  };

  const handleBalanceSubmit = async (e) => {
    e.preventDefault();
    if (!balanceForm.amount || parseFloat(balanceForm.amount) <= 0) return toast.error('Montant invalide');
    setBalanceLoading(true);
    try {
      const { data } = await api.patch('/admin/users/balance', {
        userId: balanceModal._id, amount: parseFloat(balanceForm.amount), action: balanceForm.action
      });
      toast.success(data.message);
      setUsers(users.map(u => u._id === balanceModal._id ? { ...u, balance: data.newBalance } : u));
      setBalanceModal(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setBalanceLoading(false); }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-white tracking-wider">UTILISATEURS</h1>
          <p className="text-gray-500">{users.length} compte(s)</p>
        </div>
        <input className="input w-full sm:w-64" placeholder="🔍 Rechercher..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map(u => (
              <div key={u._id} className="card space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-dark-600 rounded-xl flex items-center justify-center font-bold text-brand-400 flex-shrink-0">
                    {u.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate">{u.name}</div>
                    <div className="text-xs text-gray-500 font-mono">+216 {u.phone}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-brand-400">{(u.balance || 0).toFixed(2)}</div>
                    <div className="text-xs text-gray-500">TND</div>
                  </div>
                </div>
                {u.promoCode && (
                  <div className="text-xs text-purple-400 bg-purple-900/20 border border-purple-800/30 rounded-lg px-3 py-1.5 font-mono">
                    🎁 Code: {u.promoCode} · {u.referralCount || 0} parrainage(s)
                  </div>
                )}
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => { setBalanceModal(u); setBalanceForm({ amount: '', action: 'add' }); }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/30 hover:bg-brand-500/20 transition-all flex-1">
                    💰 Solde
                  </button>
                  {u.role !== 'admin' && (
                    <button onClick={() => toggleUser(u._id)}
                      className={`text-xs py-1.5 px-3 rounded-lg flex-1 ${u.isActive ? 'btn-danger' : 'btn-success'}`}>
                      {u.isActive ? 'Désactiver' : 'Activer'}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="card text-center py-8 text-gray-600">Aucun utilisateur</div>}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block card p-0 overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-dark-700 border-b border-dark-600">
                <tr>
                  {['Utilisateur', 'Contact', 'Solde', 'Code promo', 'Rôle', 'Statut', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-600">
                {filtered.map(u => (
                  <tr key={u._id} className="hover:bg-dark-700/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-dark-600 rounded-xl flex items-center justify-center font-bold text-brand-400 flex-shrink-0">
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="font-medium text-white text-sm">{u.name}</div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-mono text-sm text-white">+216 {u.phone}</div>
                      {u.email && <div className="text-xs text-gray-500">{u.email}</div>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-mono font-semibold text-brand-400">{(u.balance || 0).toFixed(3)} TND</div>
                    </td>
                    <td className="px-5 py-4">
                      {u.promoCode && (
                        <div>
                          <div className="font-mono text-xs text-purple-400">{u.promoCode}</div>
                          <div className="text-xs text-gray-600">{u.referralCount || 0} parrainage(s)</div>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full border ${u.role === 'admin' ? 'bg-purple-900/30 text-purple-400 border-purple-700/50' : 'bg-dark-600 text-gray-400 border-dark-500'}`}>
                        {u.role === 'admin' ? '⚙️ Admin' : '👤 User'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full border ${u.isActive ? 'bg-green-900/30 text-green-400 border-green-800/50' : 'bg-red-900/30 text-red-400 border-red-800/50'}`}>
                        {u.isActive ? '● Actif' : '○ Inactif'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => { setBalanceModal(u); setBalanceForm({ amount: '', action: 'add' }); }}
                          className="text-xs px-3 py-1.5 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/30 hover:bg-brand-500/20 transition-all">
                          💰
                        </button>
                        {u.role !== 'admin' && (
                          <button onClick={() => toggleUser(u._id)}
                            className={u.isActive ? 'btn-danger text-xs py-1.5 px-3' : 'btn-success text-xs py-1.5 px-3'}>
                            {u.isActive ? 'Désact.' : 'Activer'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="text-center py-12 text-gray-600">Aucun utilisateur trouvé</div>}
          </div>
        </>
      )}

      {/* Balance modal via Portal */}
      {balanceModal && (
        <Portal>
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
            onClick={() => setBalanceModal(null)}>
            <div style={{ background: '#111118', border: '1px solid #2d2d3d', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '420px' }}
              onClick={e => e.stopPropagation()}>
              <h2 className="font-display text-2xl text-white tracking-wide mb-1">AJUSTER LE SOLDE</h2>
              <p className="text-gray-500 text-sm mb-6">
                <span className="text-white font-medium">{balanceModal.name}</span>
                {' · '}Solde: <span className="font-mono text-brand-400">{(balanceModal.balance || 0).toFixed(3)} TND</span>
              </p>
              <form onSubmit={handleBalanceSubmit} className="space-y-4">
                <div>
                  <label className="label">Action</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[{ value: 'add', label: '➕ Ajouter', cls: 'border-green-500 text-green-400 bg-green-900/10' },
                      { value: 'remove', label: '➖ Retirer', cls: 'border-red-500 text-red-400 bg-red-900/10' }].map(opt => (
                      <button key={opt.value} type="button"
                        className={`py-3 rounded-xl border font-semibold transition-all text-sm ${balanceForm.action === opt.value ? opt.cls : 'bg-dark-700 border-dark-500 text-gray-400'}`}
                        onClick={() => setBalanceForm(f => ({ ...f, action: opt.value }))}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Montant (TND)</label>
                  <input type="number" className="input font-mono" placeholder="0.000" min="0.001" step="0.001"
                    value={balanceForm.amount} onChange={e => setBalanceForm(f => ({ ...f, amount: e.target.value }))}
                    required autoFocus />
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={balanceLoading} className="btn-primary flex-1">
                    {balanceLoading ? 'En cours...' : 'Confirmer'}
                  </button>
                  <button type="button" onClick={() => setBalanceModal(null)} className="btn-secondary">Annuler</button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
