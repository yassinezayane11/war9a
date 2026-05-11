import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { toast } from 'react-toastify';
import api from '../../api';

function Portal({ children }) {
  return ReactDOM.createPortal(children, document.body);
}

function formatDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('fr-TN');
  } catch {
    return '—';
  }
}

function short(str, len = 12) {
  if (!str) return '—';
  return str.length <= len ? str : `${str.slice(0, len)}…`;
}

function Badge({ children, variant }) {
  const variants = {
    bronze: 'bg-amber-900/30 text-amber-400 border border-amber-900/50',
    silver: 'bg-slate-800/40 text-slate-300 border border-slate-700',
    gold: 'bg-yellow-900/30 text-yellow-400 border border-yellow-900/50',
    vip: 'bg-purple-900/30 text-purple-400 border border-purple-900/50',
    danger: 'bg-red-900/30 text-red-400 border border-red-900/50',
    ok: 'bg-green-900/30 text-green-400 border border-green-900/50',
    neutral: 'bg-dark-700 text-gray-300 border border-dark-600'
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-semibold ${variants[variant] || variants.neutral}`}>
      {children}
    </span>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('new');

  const [balanceModal, setBalanceModal] = useState(null);
  const [balanceForm, setBalanceForm] = useState({ amount: '', action: 'add' });
  const [balanceLoading, setBalanceLoading] = useState(false);

  const [detailsModal, setDetailsModal] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsData, setDetailsData] = useState(null);

  const [noteDraft, setNoteDraft] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);

  const [messageModal, setMessageModal] = useState(null);
  const [messageLoading, setMessageLoading] = useState(false);
  const [messageForm, setMessageForm] = useState({ subject: '', htmlContent: '' });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const r = await api.get('/admin/users');
      setUsers(r.data);
    } catch {
      toast.error('Erreur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const banUser = async (u) => {
    try {
      const endpoint = u.isBanned ? `/admin/unban/${u._id}` : `/admin/ban/${u._id}`;
      const { data } = await api.put(endpoint);
      toast.success(data.msg || (u.isBanned ? 'Débanni ✓' : 'Banni 🔒'));
      fetchUsers();
    } catch {
      toast.error('Erreur ban');
    }
  };

  const toggleUser = async (id) => {
    try {
      const { data } = await api.patch(`/admin/users/${id}/toggle`);
      setUsers(users.map(u => (u._id === id ? { ...u, ...data.user } : u)));
      toast.success(data.message);
    } catch {
      toast.error('Erreur');
    }
  };

  const handleBalanceSubmit = async (e) => {
    e.preventDefault();
    if (!balanceForm.amount || parseFloat(balanceForm.amount) <= 0) {
      return toast.error('Montant invalide');
    }

    setBalanceLoading(true);
    try {
      const { data } = await api.patch('/admin/users/balance', {
        userId: balanceModal._id,
        amount: parseFloat(balanceForm.amount),
        action: balanceForm.action
      });

      toast.success(data.message);
      setUsers(users.map(u => (u._id === balanceModal._id ? { ...u, balance: data.newBalance, financial: { ...u.financial, currentBalance: data.newBalance } } : u)));
      setBalanceModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setBalanceLoading(false);
    }
  };

  const openDetails = async (u) => {
    setDetailsModal(u);
    setDetailsData(null);
    setDetailsLoading(true);
    try {
      const r = await api.get(`/admin/users/${u._id}/details`);
      setDetailsData(r.data);
      setNoteDraft(r.data?.user?.adminNote || '');
    } catch {
      toast.error('Erreur chargement profil');
    } finally {
      setDetailsLoading(false);
    }
  };

  const saveNote = async () => {
    if (!detailsModal) return;
    setNoteLoading(true);
    try {
      await api.patch(`/admin/users/${detailsModal._id}/note`, { note: noteDraft });
      toast.success('Note mise à jour');
      fetchUsers();
    } catch {
      toast.error('Erreur note');
    } finally {
      setNoteLoading(false);
    }
  };

  const deleteUser = async (u) => {
    if (!window.confirm(`Supprimer le compte de ${u.name} ?`)) return;
    try {
      const r = await api.delete(`/admin/users/${u._id}`);
      toast.success(r.data?.message || 'Compte supprimé');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur suppression');
    }
  };

  const openMessage = (u) => {
    setMessageModal(u);
    setMessageForm({ subject: '', htmlContent: '' });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!messageModal) return;
    if (!messageModal.email) return toast.error('Utilisateur sans email');
    if (!messageForm.subject.trim() || !messageForm.htmlContent.trim()) return toast.error('Champs requis');

    setMessageLoading(true);
    try {
      const payload = {
        subject: messageForm.subject,
        htmlContent: messageForm.htmlContent,
        target: 'selected',
        userIds: [messageModal._id]
      };
      const r = await api.post('/admin/broadcast', payload);
      toast.success(r.data?.message || 'Envoyé');
      setMessageModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur envoi');
    } finally {
      setMessageLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();

    let base = users.filter(u => {
      const hay = `${u.name || ''} ${u.phone || ''} ${u.email || ''}`.toLowerCase();
      return !s || hay.includes(s);
    });

    if (filter === 'active') base = base.filter(u => u.isActive && !u.isBanned);
    if (filter === 'banned') base = base.filter(u => u.isBanned);
    if (filter === 'vip') base = base.filter(u => (u.vipLevel || '').toLowerCase() === 'vip');
    if (filter === 'nopurchases') base = base.filter(u => (u.ticketStats?.purchasedCount || 0) === 0);
    if (filter === 'duplicates') base = base.filter(u => u.risk?.hasDuplicateFingerprint);

    if (sort === 'new') base = base.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sort === 'deposits') base = base.slice().sort((a, b) => (b.financial?.totalDeposits || 0) - (a.financial?.totalDeposits || 0));
    if (sort === 'spent') base = base.slice().sort((a, b) => (b.financial?.totalPurchases || 0) - (a.financial?.totalPurchases || 0));

    return base;
  }, [users, search, filter, sort]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter(u => u.isActive && !u.isBanned).length,
      banned: users.filter(u => u.isBanned).length,
      vip: users.filter(u => (u.vipLevel || '').toLowerCase() === 'vip').length
    };
  }, [users]);

  return (
    <div className="space-y-6 animate-fadeInUp">


      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-white tracking-wider">UTILISATEURS</h1>
          <p className="text-gray-500">
            {stats.total} compte(s)
            {stats.banned > 0 && <span className="text-red-400"> • {stats.banned} bannis</span>}
            {stats.vip > 0 && <span className="text-purple-400"> • {stats.vip} VIP</span>}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <input
            className="input w-full sm:w-64"
            placeholder="🔍 Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="input w-full sm:w-48" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">Tous</option>
            <option value="active">Actifs</option>
            <option value="banned">Bannis</option>
            <option value="vip">VIP</option>
            <option value="nopurchases">Sans achats</option>
            <option value="duplicates">Fingerprint dupliqué</option>
          </select>
          <select className="input w-full sm:w-48" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="new">Tri: Nouveaux</option>
            <option value="deposits">Tri: Dépôts</option>
            <option value="spent">Tri: Achats</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>

      {/* MOBILE */}
          <div className="md:hidden space-y-3">
            {filtered.map(u => (
              <div key={u._id} className="card space-y-3">

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-dark-600 rounded-xl flex items-center justify-center font-bold text-brand-400">
                {u.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-white">{u.name}</div>
                <div className="text-xs text-gray-500 font-mono">+216 {u.phone}</div>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-brand-400">
                  {(u.balance || 0).toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">TND</div>
              </div>
            </div>

                <div className="flex gap-2 flex-wrap">

              <button
                onClick={() => {
                  setBalanceModal(u);
                  setBalanceForm({ amount: '', action: 'add' });
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/30"
              >
                💰 Solde
              </button>

                  {u.role !== 'admin' && (
                    <>
                      <button
                        onClick={() => openDetails(u)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-dark-600 text-gray-300 border border-dark-500"
                      >
                        👁️ Profil
                      </button>

                      <button
                        onClick={() => toggleUser(u._id)}
                        className={`text-xs py-1.5 px-3 rounded-lg ${
                          u.isActive ? 'btn-danger' : 'btn-success'
                        }`}
                      >
                        {u.isActive ? 'Désactiver' : 'Activer'}
                      </button>

                      <button
                        onClick={() => banUser(u)}
                        className={`text-xs py-1.5 px-3 rounded-lg border ${
                          u.isBanned
                            ? 'bg-green-900/20 text-green-400 border-green-900/40'
                            : 'bg-red-600/20 text-red-400 border-red-500/30'
                        }`}
                      >
                        {u.isBanned ? 'Déban' : 'Ban'}
                      </button>
                    </>
                  )}
            </div>
          </div>
            ))}
          </div>

      {/* DESKTOP */}
          <div className="hidden md:block card p-0 overflow-hidden">
            <div className="w-full overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Utilisateur</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Sécurité</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Finances</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Tickets</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-600">
                  {filtered.map(u => {
                    const vip = (u.vipLevel || 'Bronze').toLowerCase();
                    const vipVariant = vip === 'vip' ? 'vip' : vip === 'gold' ? 'gold' : vip === 'silver' ? 'silver' : 'bronze';
                    const success = u.ticketStats?.successRate ?? 0;
                    const isUser = u.role !== 'admin';

                    return (
                      <tr key={u._id} className="hover:bg-dark-700/40 transition-colors align-top">
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-dark-600 rounded-xl flex items-center justify-center font-bold text-brand-400 flex-shrink-0">
                              {u.name?.[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="font-semibold text-white truncate">{u.name}</div>
                                <Badge variant={vipVariant}>{u.vipLevel || 'Bronze'}</Badge>
                                {u.isBanned && <Badge variant="danger">Banni</Badge>}
                                {!u.isActive && <Badge variant="neutral">Désactivé</Badge>}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">Inscrit: {formatDate(u.createdAt)}</div>
                              <div className="text-xs text-gray-600">Dernier login: {formatDate(u.lastLoginAt)}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-300 font-mono">+216 {u.phone}</div>
                          <div className="text-xs text-gray-500 break-all">{u.email || '—'}</div>
                          <div className="text-xs text-purple-400 font-mono mt-1">{u.promoCode || '—'}</div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="text-xs text-gray-500">FP: <span className="text-gray-300 font-mono">{short(u.fingerprint, 16)}</span></div>
                          <div className="text-xs text-gray-500">IP: <span className="text-gray-300 font-mono">{u.lastIP || '—'}</span></div>
                          {u.risk?.hasDuplicateFingerprint && (
                            <div className="mt-2">
                              <Badge variant="danger">Dupliqué ×{u.risk.duplicateFingerprintCount}</Badge>
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <div className="text-sm font-mono font-bold text-brand-400">{(u.financial?.currentBalance ?? u.balance ?? 0).toFixed(2)} TND</div>
                          <div className="text-xs text-gray-500">Dépôts: <span className="text-gray-300 font-mono">{(u.financial?.totalDeposits || 0).toFixed(2)}</span></div>
                          <div className="text-xs text-gray-500">Achats: <span className="text-gray-300 font-mono">{(u.financial?.totalPurchases || 0).toFixed(2)}</span></div>
                          <div className="text-xs text-gray-500">P/L: <span className={`font-mono ${((u.financial?.profitLoss || 0) >= 0) ? 'text-green-400' : 'text-red-400'}`}>{(u.financial?.profitLoss || 0).toFixed(2)}</span></div>
                          <div className="text-xs text-gray-500">Ref: <span className="text-gray-300 font-mono">{(u.referral?.earnings || 0).toFixed(2)}</span></div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="text-xs text-gray-500">Achetés: <span className="text-gray-300 font-mono">{u.ticketStats?.purchasedCount || 0}</span></div>
                          <div className="text-xs text-gray-500">Gagnants: <span className="text-gray-300 font-mono">{u.ticketStats?.winningCount || 0}</span></div>
                          <div className="text-xs text-gray-500">Succès: <span className={`font-mono ${success >= 60 ? 'text-green-400' : success >= 35 ? 'text-yellow-400' : 'text-red-400'}`}>{success}%</span></div>
                          <div className="text-xs text-gray-600 mt-1 truncate max-w-[220px]">Dernier: {u.ticketStats?.lastPurchasedTicketTitle || '—'}</div>
                        </td>

                        <td className="px-4 py-3">
                          {isUser ? (
                            <div className="flex items-center justify-end gap-2 flex-wrap">
                              <button
                                onClick={() => {
                                  setBalanceModal(u);
                                  setBalanceForm({ amount: '', action: 'add' });
                                }}
                                className="text-xs px-3 py-2 rounded-lg whitespace-nowrap bg-brand-500/10 text-brand-400 border border-brand-500/30"
                              >
                                + Solde
                              </button>

                              <button
                                onClick={() => {
                                  setBalanceModal(u);
                                  setBalanceForm({ amount: '', action: 'remove' });
                                }}
                                className="text-xs px-3 py-2 rounded-lg whitespace-nowrap bg-dark-600 text-gray-300 border border-dark-500"
                              >
                                - Solde
                              </button>

                              <button
                                onClick={() => openDetails(u)}
                                className="text-xs px-3 py-2 rounded-lg whitespace-nowrap bg-dark-600 text-gray-300 border border-dark-500"
                              >
                                Profil
                              </button>

                              <button
                                onClick={() => openMessage(u)}
                                className="text-xs px-3 py-2 rounded-lg whitespace-nowrap bg-purple-900/20 text-purple-400 border border-purple-900/40"
                              >
                                Message
                              </button>

                              <button
                                onClick={() => toggleUser(u._id)}
                                className={`text-xs px-3 py-2 rounded-lg whitespace-nowrap ${u.isActive ? 'btn-danger' : 'btn-success'}`}
                              >
                                {u.isActive ? 'Désact.' : 'Activer'}
                              </button>

                              <button
                                onClick={() => banUser(u)}
                                className={`text-xs px-3 py-2 rounded-lg whitespace-nowrap border ${
                                  u.isBanned
                                    ? 'bg-green-900/20 text-green-400 border-green-900/40'
                                    : 'bg-red-600/20 text-red-400 border-red-500/30'
                                }`}
                              >
                                {u.isBanned ? 'Déban' : 'Ban'}
                              </button>

                              <button
                                onClick={() => deleteUser(u)}
                                className="text-xs px-3 py-2 rounded-lg whitespace-nowrap bg-red-900/20 text-red-400 border border-red-900/40"
                              >
                                Suppr.
                              </button>
                            </div>
                          ) : (
                            <div className="text-right text-xs text-gray-500">—</div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </>
      )}

      {/* Balance modal */}
      {balanceModal && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => !balanceLoading && setBalanceModal(null)}>
            <div className="card w-full max-w-md" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-display text-xl text-white">Solde</div>
                  <div className="text-sm text-gray-500">{balanceModal.name} • +216 {balanceModal.phone}</div>
                </div>
                <button className="text-gray-400 hover:text-white" onClick={() => !balanceLoading && setBalanceModal(null)}>✕</button>
              </div>

              <form onSubmit={handleBalanceSubmit} className="space-y-4">
                <div>
                  <label className="label">Action</label>
                  <select className="input" value={balanceForm.action} onChange={e => setBalanceForm({ ...balanceForm, action: e.target.value })}>
                    <option value="add">Ajouter</option>
                    <option value="remove">Retirer</option>
                  </select>
                </div>
                <div>
                  <label className="label">Montant</label>
                  <input
                    className="input"
                    type="number"
                    step="0.001"
                    min="0"
                    value={balanceForm.amount}
                    onChange={e => setBalanceForm({ ...balanceForm, amount: e.target.value })}
                    placeholder="0.000"
                    required
                  />
                </div>
                <button disabled={balanceLoading} className="btn-primary w-full">
                  {balanceLoading ? '...' : 'Valider'}
                </button>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Details modal */}
      {detailsModal && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => !detailsLoading && setDetailsModal(null)}>
            <div className="card w-full max-w-4xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <div className="font-display text-2xl text-white truncate">{detailsModal.name}</div>
                  <div className="text-sm text-gray-500">+216 {detailsModal.phone} • {detailsModal.email || '—'}</div>
                  <div className="text-xs text-gray-600">Fingerprint: {detailsModal.fingerprint || '—'} • IP: {detailsModal.lastIP || '—'}</div>
                </div>
                <button className="text-gray-400 hover:text-white" onClick={() => !detailsLoading && setDetailsModal(null)}>✕</button>
              </div>

              {detailsLoading ? (
                <div className="py-16 flex justify-center">
                  <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="grid lg:grid-cols-3 gap-4 max-h-[75vh] overflow-y-auto modal-scroll pr-1">
                  <div className="lg:col-span-1 space-y-4">
                    <div className="bg-dark-700 rounded-xl p-4 border border-dark-600">
                      <div className="text-sm text-white font-semibold mb-2">Note admin</div>
                      <textarea
                        className="input"
                        rows={6}
                        value={noteDraft}
                        onChange={e => setNoteDraft(e.target.value)}
                        placeholder="Ajouter une note..."
                      />
                      <button disabled={noteLoading} onClick={saveNote} className="btn-primary w-full mt-3">
                        {noteLoading ? '...' : 'Enregistrer'}
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-dark-700 rounded-xl p-4 border border-dark-600">
                      <div className="text-sm text-white font-semibold mb-3">Historique dépôts</div>
                      <div className="space-y-2">
                        {(detailsData?.deposits || []).slice(0, 8).map(d => (
                          <div key={d._id} className="flex items-center justify-between bg-dark-800 rounded-lg px-3 py-2">
                            <div className="text-xs text-gray-500">{formatDate(d.createdAt)} • {d.method} • {d.status}</div>
                            <div className="text-sm text-brand-400 font-mono font-semibold">{d.amount} TND</div>
                          </div>
                        ))}
                        {(detailsData?.deposits || []).length === 0 && <div className="text-xs text-gray-500">Aucun dépôt</div>}
                      </div>
                    </div>

                    <div className="bg-dark-700 rounded-xl p-4 border border-dark-600">
                      <div className="text-sm text-white font-semibold mb-3">Achats tickets</div>
                      <div className="space-y-2">
                        {(detailsData?.purchases || []).slice(0, 8).map(p => (
                          <div key={p._id} className="flex items-center justify-between bg-dark-800 rounded-lg px-3 py-2 gap-3">
                            <div className="min-w-0">
                              <div className="text-sm text-gray-200 truncate">{p.ticketId?.title || 'Ticket'}</div>
                              <div className="text-xs text-gray-500">{formatDate(p.createdAt)} • {p.status}</div>
                            </div>
                            <div className="text-sm text-brand-400 font-mono font-semibold whitespace-nowrap">{p.pricePaid} TND</div>
                          </div>
                        ))}
                        {(detailsData?.purchases || []).length === 0 && <div className="text-xs text-gray-500">Aucun achat</div>}
                      </div>
                    </div>

                    <div className="bg-dark-700 rounded-xl p-4 border border-dark-600">
                      <div className="text-sm text-white font-semibold mb-3">Transactions</div>
                      <div className="space-y-2">
                        {(detailsData?.transactions || []).slice(0, 8).map(t => (
                          <div key={t._id} className="flex items-center justify-between bg-dark-800 rounded-lg px-3 py-2">
                            <div className="text-xs text-gray-500">{formatDate(t.createdAt)} • {t.type} • {t.description || '—'}</div>
                            <div className="text-sm text-gray-300 font-mono whitespace-nowrap">{t.amount}</div>
                          </div>
                        ))}
                        {(detailsData?.transactions || []).length === 0 && <div className="text-xs text-gray-500">Aucune transaction</div>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Portal>
      )}

      {/* Message modal */}
      {messageModal && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => !messageLoading && setMessageModal(null)}>
            <div className="card w-full max-w-lg" onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="font-display text-xl text-white">Message</div>
                  <div className="text-sm text-gray-500">{messageModal.name} • {messageModal.email || '—'}</div>
                </div>
                <button className="text-gray-400 hover:text-white" onClick={() => !messageLoading && setMessageModal(null)}>✕</button>
              </div>

              <form onSubmit={sendMessage} className="space-y-4">
                <div>
                  <label className="label">Sujet</label>
                  <input className="input" value={messageForm.subject} onChange={e => setMessageForm({ ...messageForm, subject: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Contenu HTML</label>
                  <textarea className="input font-mono text-sm" rows={8} value={messageForm.htmlContent} onChange={e => setMessageForm({ ...messageForm, htmlContent: e.target.value })} required />
                </div>
                <button disabled={messageLoading} className="btn-primary w-full">
                  {messageLoading ? '...' : 'Envoyer'}
                </button>
              </form>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
