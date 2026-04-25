import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { toast } from 'react-toastify';
import api from '../../api';

const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || '';

function Portal({ children }) { return ReactDOM.createPortal(children, document.body); }

export default function AdminDeposits() {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [preview, setPreview] = useState(null);
  const [processing, setProcessing] = useState(null);
  const [settings, setSettings] = useState({ d17Number: '', orangeNumber: '', promoEnabled: true, promoBonusOnDeposit: 2, referralBonus: 2 });
  const [showSettings, setShowSettings] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);

  const fetchDeposits = (status = filter) => {
    setLoading(true);
    const q = status !== '' ? `?status=${status}` : '';
    api.get(`/admin/deposits${q}`).then(r => setDeposits(r.data)).catch(() => toast.error('Erreur')).finally(() => setLoading(false));
  };

  const fetchSettings = () => api.get('/admin/settings').then(r => setSettings(r.data)).catch(() => {});

  useEffect(() => { fetchDeposits(filter); }, [filter]);
  useEffect(() => { fetchSettings(); }, []);

  const approve = async (id) => {
    setProcessing(id + 'a');
    try { await api.patch(`/admin/deposits/${id}/approve`); toast.success('✅ Approuvé!'); fetchDeposits(); }
    catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setProcessing(null); }
  };

  const reject = async (id) => {
    setProcessing(id + 'r');
    try { await api.patch(`/admin/deposits/${id}/reject`); toast.success('Rejeté'); fetchDeposits(); }
    catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setProcessing(null); }
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    try { await api.put('/admin/settings', settings); toast.success('Paramètres sauvegardés!'); setShowSettings(false); }
    catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSettingsLoading(false); }
  };

  const methodBadge = (m) => (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${m === 'D17' ? 'bg-blue-900/30 text-blue-400 border-blue-700/50' : 'bg-orange-900/30 text-orange-400 border-orange-700/50'}`}>{m}</span>
  );

  const filters = [{ val: 'pending', label: 'En attente' }, { val: 'approved', label: 'Approuvés' }, { val: 'rejected', label: 'Rejetés' }, { val: '', label: 'Tous' }];

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-white tracking-wider">GESTION DES DÉPÔTS</h1>
          <p className="text-gray-500">{deposits.length} résultat(s)</p>
        </div>
        <button onClick={() => setShowSettings(!showSettings)} className="btn-secondary text-sm py-2 w-full sm:w-auto">⚙️ Numéros & Promo</button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="card border-brand-500/30">
          <h2 className="font-display text-xl text-white tracking-wide mb-4">PARAMÈTRES DE PAIEMENT & PROMO</h2>
          <form onSubmit={saveSettings} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">Numéro D17</label>
              <input className="input font-mono" placeholder="ex: 12345678" value={settings.d17Number} onChange={e => setSettings(s => ({ ...s, d17Number: e.target.value }))} />
            </div>
            <div>
              <label className="label">Numéro Orange</label>
              <input className="input font-mono" placeholder="ex: 87654321" value={settings.orangeNumber} onChange={e => setSettings(s => ({ ...s, orangeNumber: e.target.value }))} />
            </div>
            <div>
              <label className="label">Bonus promo dépôt (TND)</label>
              <input type="number" className="input font-mono" min="0" step="0.5" value={settings.promoBonusOnDeposit} onChange={e => setSettings(s => ({ ...s, promoBonusOnDeposit: parseFloat(e.target.value) }))} />
            </div>
            <div>
              <label className="label">Bonus parrainage inscription (TND)</label>
              <input type="number" className="input font-mono" min="0" step="0.5" value={settings.referralBonus} onChange={e => setSettings(s => ({ ...s, referralBonus: parseFloat(e.target.value) }))} />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.promoEnabled} onChange={e => setSettings(s => ({ ...s, promoEnabled: e.target.checked }))} />
                <div className="w-11 h-6 bg-dark-500 rounded-full peer peer-checked:bg-brand-500 transition-all" />
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5" />
              </label>
              <span className="text-sm text-gray-300">Système promo activé</span>
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex gap-3">
              <button type="submit" disabled={settingsLoading} className="btn-primary text-sm py-2">{settingsLoading ? 'Sauvegarde...' : '💾 Sauvegarder'}</button>
              <button type="button" onClick={() => setShowSettings(false)} className="btn-secondary text-sm py-2">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* Filter tabs — scrollable on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map(s => (
          <button key={s.val} onClick={() => setFilter(s.val)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${filter === s.val ? 'bg-brand-500 text-white' : 'bg-dark-700 text-gray-400 hover:text-white'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : deposits.length === 0 ? (
        <div className="card text-center py-16 text-gray-600">Aucun dépôt trouvé</div>
      ) : (
        <div className="space-y-4">
          {deposits.map(d => (
            <div key={d._id} className="card hover:border-dark-500 transition-all">
              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-dark-700 cursor-pointer border border-dark-500 hover:border-brand-500 transition-all"
                      onClick={() => setPreview(`${API_BASE}/uploads/deposits/${d.screenshot}`)}>
                      <img src={`${API_BASE}/uploads/deposits/${d.screenshot}`} alt="screenshot"
                        className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                    </div>
                    <div className="text-xs text-center text-brand-400 mt-1 cursor-pointer"
                      onClick={() => setPreview(`${API_BASE}/uploads/deposits/${d.screenshot}`)}>Agrandir</div>
                  </div>

                  {/* Info grid */}
                  <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <div className="text-xs text-gray-500">Utilisateur</div>
                      <div className="text-white font-medium text-sm truncate">{d.userId?.name}</div>
                      <div className="text-xs text-gray-500 font-mono">+216 {d.userId?.phone}</div>
                      <div className="text-xs text-gray-600 font-mono">{d.userId?.balance?.toFixed(2)} TND</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Montant</div>
                      <div className="font-mono font-bold text-lg text-brand-400">{d.amount.toFixed(3)}</div>
                      <div className="text-xs text-gray-500">TND</div>
                      {d.promoBonus > 0 && <div className="text-xs text-green-400">+{d.promoBonus} bonus</div>}
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Méthode</div>
                      {methodBadge(d.method)}
                      {d.orangeCode && <div className="text-xs text-orange-400 mt-1 font-mono truncate">{d.orangeCode}</div>}
                      {d.promoCode && <div className="text-xs text-purple-400 mt-1 font-mono">🎁 {d.promoCode}</div>}
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Statut</div>
                      {d.status === 'pending' ? <span className="badge-pending">En attente</span>
                       : d.status === 'approved' ? <span className="badge-approved">Approuvé</span>
                       : <span className="badge-rejected">Rejeté</span>}
                      <div className="text-xs text-gray-600 mt-1">{new Date(d.createdAt).toLocaleDateString('fr-TN')}</div>
                    </div>
                  </div>
                </div>

                {d.status === 'pending' && (
                  <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                    <button onClick={() => approve(d._id)} disabled={!!processing} className="btn-success text-sm flex-1 disabled:opacity-50">
                      {processing === d._id + 'a' ? '...' : '✅ Approuver'}
                    </button>
                    <button onClick={() => reject(d._id)} disabled={!!processing} className="btn-danger text-sm flex-1 disabled:opacity-50">
                      {processing === d._id + 'r' ? '...' : '❌ Rejeter'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Screenshot fullscreen preview */}
      {preview && (
        <Portal>
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
            onClick={() => setPreview(null)}>
            <div style={{ maxWidth: '720px', width: '100%' }} onClick={e => e.stopPropagation()}>
              <img src={preview} alt="Preuve" className="w-full rounded-2xl shadow-2xl" />
              <button onClick={() => setPreview(null)} className="mt-4 w-full btn-secondary">Fermer</button>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
