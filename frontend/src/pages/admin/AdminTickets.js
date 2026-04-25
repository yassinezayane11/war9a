import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { toast } from 'react-toastify';
import api from '../../api';

const emptyMatch = { team1: '', team2: '', betType: '', odds: '' };
const emptyTicket = { title: '', price: '', globalOdds: '', description: '', successProbability: '', showOdds: true, category: 'Football', matches: [{ ...emptyMatch }] };

function Portal({ children }) {
  return ReactDOM.createPortal(children, document.body);
}

function TicketModal({ title, onClose, children }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <Portal>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      >
        {/* Modal box — stops click propagation */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: '760px',
            maxHeight: '90vh',
            backgroundColor: '#111118',
            border: '1px solid #2d2d3d',
            borderRadius: '16px',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Fixed header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #2d2d3d', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <h2 className="font-display text-2xl text-white tracking-wide">{title}</h2>
            <button onClick={onClose}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #2d2d3d', color: '#9999aa', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ✕
            </button>
          </div>
          {/* Scrollable body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {children}
          </div>
        </div>
      </div>
    </Portal>
  );
}

function MatchEditor({ match, index, onChange, onRemove, canRemove }) {
  return (
    <div className="bg-dark-700 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 font-medium">Match {index + 1}</span>
        {canRemove && (
          <button type="button" onClick={onRemove} className="text-red-400 hover:text-red-300 text-xs">✕ Supprimer</button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label text-xs">Équipe 1 *</label>
          <input className="input text-sm py-2" placeholder="Équipe A" value={match.team1}
            onChange={e => onChange('team1', e.target.value)} required />
        </div>
        <div>
          <label className="label text-xs">Équipe 2 *</label>
          <input className="input text-sm py-2" placeholder="Équipe B" value={match.team2}
            onChange={e => onChange('team2', e.target.value)} required />
        </div>
        <div>
          <label className="label text-xs">Type de pari *</label>
          <input className="input text-sm py-2" placeholder="ex: 1X2, Over 2.5..." value={match.betType}
            onChange={e => onChange('betType', e.target.value)} required />
        </div>
        <div>
          <label className="label text-xs">Cote *</label>
          <input type="number" className="input text-sm py-2 font-mono" placeholder="1.50" min="1" step="0.01"
            value={match.odds} onChange={e => onChange('odds', e.target.value)} required />
        </div>
      </div>
    </div>
  );
}

function TicketForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(() => {
    if (!initial) return { ...emptyTicket, matches: [{ ...emptyMatch }] };
    return {
      ...initial,
      price: initial.price?.toString() ?? '',
      globalOdds: initial.globalOdds?.toString() ?? '',
      successProbability: initial.successProbability?.toString() ?? '',
      matches: (initial.matches || [{ ...emptyMatch }]).map(m => ({
        team1: m.team1 ?? '', team2: m.team2 ?? '', betType: m.betType ?? '', odds: m.odds?.toString() ?? '',
      }))
    };
  });

  const recalc = (matches) => {
    const odds = matches.map(m => parseFloat(m.odds)).filter(o => !isNaN(o) && o >= 1);
    return odds.length ? odds.reduce((a, b) => a * b, 1).toFixed(2) : '';
  };

  const updateMatch = (i, field, val) => {
    const ms = form.matches.map((m, idx) => idx === i ? { ...m, [field]: val } : m);
    setForm(f => ({ ...f, matches: ms, globalOdds: recalc(ms) }));
  };
  const addMatch = () => setForm(f => ({ ...f, matches: [...f.matches, { ...emptyMatch }] }));
  const removeMatch = (i) => {
    const ms = form.matches.filter((_, idx) => idx !== i);
    setForm(f => ({ ...f, matches: ms, globalOdds: recalc(ms) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Le titre est obligatoire');
    if (!form.price || parseFloat(form.price) < 0) return toast.error('Le prix est invalide');
    for (let i = 0; i < form.matches.length; i++) {
      const m = form.matches[i];
      if (!m.team1.trim()) return toast.error(`Match ${i + 1}: Équipe 1 obligatoire`);
      if (!m.team2.trim()) return toast.error(`Match ${i + 1}: Équipe 2 obligatoire`);
      if (!m.betType.trim()) return toast.error(`Match ${i + 1}: Type de pari obligatoire`);
      if (!m.odds || parseFloat(m.odds) < 1) return toast.error(`Match ${i + 1}: Cote invalide (min 1)`);
    }
    onSave({
      title: form.title.trim(), price: parseFloat(form.price),
      globalOdds: parseFloat(form.globalOdds) || 1,
      description: form.description.trim(),
      successProbability: form.successProbability ? parseFloat(form.successProbability) : undefined,
      showOdds: form.showOdds, category: form.category,
      matches: form.matches.map(m => ({ team1: m.team1.trim(), team2: m.team2.trim(), betType: m.betType.trim(), odds: parseFloat(m.odds) }))
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Titre *</label>
          <input className="input" placeholder="ex: Combo 3 matchs du week-end"
            value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
        </div>
        <div>
          <label className="label">Prix (TND) *</label>
          <input type="number" className="input font-mono" placeholder="5.000" min="0" step="0.001"
            value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
        </div>
        <div>
          <label className="label">Cote globale (auto)</label>
          <input type="number" className="input font-mono text-brand-400" placeholder="Auto"
            value={form.globalOdds} onChange={e => setForm(f => ({ ...f, globalOdds: e.target.value }))} />
        </div>
        <div>
          <label className="label">Probabilité (%)</label>
          <input type="number" className="input font-mono" placeholder="75" min="0" max="100"
            value={form.successProbability} onChange={e => setForm(f => ({ ...f, successProbability: e.target.value }))} />
        </div>
        <div>
          <label className="label">Catégorie</label>
          <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            {['Football', 'Basketball', 'Tennis', 'Volleyball', 'Autre'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Description</label>
          <textarea className="input resize-none" rows={3} placeholder="Description..."
            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>
        <div className="sm:col-span-2 flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={form.showOdds}
              onChange={e => setForm(f => ({ ...f, showOdds: e.target.checked }))} />
            <div className="w-11 h-6 bg-dark-500 rounded-full peer peer-checked:bg-brand-500 transition-all" />
            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5" />
          </label>
          <span className="text-sm text-gray-300">Afficher les cotes publiquement</span>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="label mb-0">Matchs *</label>
          <button type="button" onClick={addMatch} className="text-sm text-brand-400 hover:text-brand-300 font-medium">+ Ajouter match</button>
        </div>
        <div className="space-y-3">
          {form.matches.map((m, i) => (
            <MatchEditor key={i} match={m} index={i}
              onChange={(f, v) => updateMatch(i, f, v)}
              onRemove={() => removeMatch(i)}
              canRemove={form.matches.length > 1} />
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1">💾 Sauvegarder</button>
        <button type="button" onClick={onCancel} className="btn-secondary sm:w-auto w-full">Annuler</button>
      </div>
    </form>
  );
}

export default function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null);
  const [editData, setEditData] = useState(null);

  const fetchTickets = () => {
    setLoading(true);
    api.get('/admin/tickets').then(r => setTickets(r.data)).catch(() => toast.error('Erreur')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleSave = async (data) => {
    try {
      if (mode === 'create') { await api.post('/admin/tickets', data); toast.success('Ticket créé!'); }
      else { await api.put(`/admin/tickets/${mode}`, data); toast.success('Ticket mis à jour!'); }
      setMode(null); setEditData(null); fetchTickets();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  const closeModal = () => { setMode(null); setEditData(null); };

  const deleteTicket = async (id) => {
    if (!window.confirm('Supprimer ce ticket?')) return;
    try { await api.delete(`/admin/tickets/${id}`); toast.success('Supprimé'); fetchTickets(); }
    catch { toast.error('Erreur'); }
  };

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-white tracking-wider">GESTION DES TICKETS</h1>
          <p className="text-gray-500">{tickets.length} ticket(s)</p>
        </div>
        <button onClick={() => { setMode('create'); setEditData(null); }} className="btn-primary w-full sm:w-auto">
          + Nouveau ticket
        </button>
      </div>

      {mode && (
        <TicketModal title={mode === 'create' ? '🆕 NOUVEAU TICKET' : '✏️ MODIFIER TICKET'} onClose={closeModal}>
          <TicketForm key={mode} initial={editData} onSave={handleSave} onCancel={closeModal} />
        </TicketModal>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : tickets.length === 0 ? (
        <div className="card text-center py-16 text-gray-600">Aucun ticket. Créez-en un!</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tickets.map(t => (
            <div key={t._id} className="card hover:border-dark-500 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <span className="text-xs text-gray-500 bg-dark-700 px-2 py-0.5 rounded-full">{t.category}</span>
                  <h3 className="font-display text-lg sm:text-xl text-white mt-1 tracking-wide truncate">{t.title}</h3>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <div className="font-mono font-bold text-brand-400">{t.price} TND</div>
                  <div className={`text-xs mt-1 ${t.isActive ? 'text-green-400' : 'text-gray-500'}`}>{t.isActive ? '● Actif' : '○ Inactif'}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-4">
                <span>Cote: <span className="text-brand-400 font-mono">×{t.globalOdds}</span></span>
                {t.successProbability != null && <span>Proba: <span className="text-green-400">{t.successProbability}%</span></span>}
                <span>{t.matches?.length} match(s)</span>
                <span>{t.purchaseCount} achat(s)</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditData(t); setMode(t._id); }} className="btn-secondary text-sm py-2 flex-1">✏️ Modifier</button>
                <button onClick={() => deleteTicket(t._id)} className="btn-danger text-sm py-2 px-4">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
