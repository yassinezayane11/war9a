import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../api';

export default function AdminEmailBroadcast() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [emailLogs, setEmailLogs] = useState([]);
  const [formData, setFormData] = useState({
    subject: '',
    htmlContent: '',
    target: 'verified' // all, verified, selected
  });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [results, setResults] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchLogs();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      // Filter users with verified emails
      const verifiedUsers = res.data.filter(u => u.email && u.emailVerified);
      setUsers(verifiedUsers);
    } catch (err) {
      toast.error('Erreur de chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await api.get('/admin/email-logs');
      setEmailLogs(res.data.slice(0, 50));
    } catch (err) {
      console.error('Error loading logs:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.htmlContent.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setSending(true);
    try {
      const payload = {
        subject: formData.subject,
        htmlContent: formData.htmlContent,
        target: formData.target,
        userIds: formData.target === 'selected' ? selectedUsers : undefined
      };

      const res = await api.post('/admin/broadcast', payload);
      toast.success(res.data.message);
      setResults(res.data.results);
      setFormData({ subject: '', htmlContent: '', target: 'verified' });
      setSelectedUsers([]);
      fetchLogs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur d\'envoi');
    } finally {
      setSending(false);
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const insertTemplate = (template) => {
    const templates = {
      welcome: `<h2>Bienvenue sur WAR9A.TN!</h2><p>Cher client,</p><p>Nous sommes ravis de vous accueillir sur notre plateforme de pronostics premium.</p><p>Commencez à gagner dès maintenant!</p>`,
      promo: `<h2>🎉 Offre Spéciale!</h2><p>Cher client,</p><p>Profitez de notre offre exceptionnelle sur les tickets premium.</p><p>Ne manquez pas cette occasion!</p>`,
      ticket: `<h2>Nouveau Ticket Disponible!</h2><p>Un nouveau ticket premium vient d'être ajouté.</p><p>Accédez-y rapidement avant qu'il ne soit complet!</p>`
    };
    setFormData({ ...formData, htmlContent: templates[template] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-white">Email Broadcast</h1>
          <p className="text-gray-500 text-sm mt-1">Envoyer des emails aux utilisateurs</p>
        </div>
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="btn-secondary"
        >
          {showLogs ? 'Masquer Logs' : 'Voir Logs'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-brand-400">{users.length}</div>
          <div className="text-sm text-gray-500">Emails vérifiés</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-400">
            {emailLogs.filter(l => l.status === 'sent').length}
          </div>
          <div className="text-sm text-gray-500">Emails envoyés (total)</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {emailLogs.filter(l => l.type === 'broadcast').length}
          </div>
          <div className="text-sm text-gray-500">Campagnes</div>
        </div>
      </div>

      {/* Broadcast Form */}
      <div className="card">
        <h3 className="font-semibold text-white mb-4">Nouvelle Campagne</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Templates */}
          <div className="flex gap-2">
            <span className="text-sm text-gray-500">Templates:</span>
            {['welcome', 'promo', 'ticket'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => insertTemplate(t)}
                className="text-xs bg-dark-600 hover:bg-dark-500 text-gray-400 px-3 py-1 rounded-full transition-colors"
              >
                {t === 'welcome' ? 'Bienvenue' : t === 'promo' ? 'Promo' : 'Nouveau Ticket'}
              </button>
            ))}
          </div>

          <div>
            <label className="label">Sujet *</label>
            <input
              type="text"
              value={formData.subject}
              onChange={e => setFormData({ ...formData, subject: e.target.value })}
              className="input"
              placeholder="Ex: Nouveau ticket disponible!"
              required
            />
          </div>

          <div>
            <label className="label">Contenu HTML *</label>
            <textarea
              value={formData.htmlContent}
              onChange={e => setFormData({ ...formData, htmlContent: e.target.value })}
              className="input font-mono text-sm"
              rows={10}
              placeholder="<h2>Votre message ici</h2><p>Contenu...</p>"
              required
            />
          </div>

          <div>
            <label className="label">Destinataires</label>
            <div className="flex gap-4">
              {[
                { value: 'verified', label: 'Tous (emails vérifiés)' },
                { value: 'all', label: 'Tous (avec email)' },
                { value: 'selected', label: 'Sélectionnés' }
              ].map(opt => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="target"
                    value={opt.value}
                    checked={formData.target === opt.value}
                    onChange={e => setFormData({ ...formData, target: e.target.value })}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-400 text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* User Selection */}
          {formData.target === 'selected' && (
            <div className="bg-dark-700 rounded-xl p-4 max-h-60 overflow-y-auto">
              <div className="text-sm text-gray-500 mb-2">
                Sélectionnez les utilisateurs ({selectedUsers.length} sélectionnés):
              </div>
              {loading ? (
                <div className="text-center py-4">
                  <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {users.map(user => (
                    <label key={user._id} className="flex items-center gap-2 p-2 rounded hover:bg-dark-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user._id)}
                        onChange={() => toggleUserSelection(user._id)}
                        className="w-4 h-4 rounded"
                      />
                      <div className="min-w-0">
                        <div className="text-white text-sm truncate">{user.name}</div>
                        <div className="text-gray-500 text-xs truncate">{user.email}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={sending || (formData.target === 'selected' && selectedUsers.length === 0)}
            className="btn-primary w-full"
          >
            {sending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Envoi en cours...
              </span>
            ) : (
              `Envoyer (${formData.target === 'selected' ? selectedUsers.length : users.length} destinataires)`
            )}
          </button>
        </form>

        {/* Results */}
        {results && (
          <div className="mt-6 p-4 bg-dark-700 rounded-xl">
            <h4 className="text-white font-medium mb-2">Résultats</h4>
            <div className="flex gap-4 text-sm">
              <span className="text-green-400">
                ✓ {results.filter(r => r.success).length} envoyés
              </span>
              <span className="text-red-400">
                ✗ {results.filter(r => !r.success).length} échecs
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Email Logs */}
      {showLogs && (
        <div className="card">
          <h3 className="font-semibold text-white mb-4">Historique d'envoi</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dark-700">
                <tr>
                  <th className="text-left p-3 text-gray-400">Date</th>
                  <th className="text-left p-3 text-gray-400">Type</th>
                  <th className="text-left p-3 text-gray-400">Sujet</th>
                  <th className="text-left p-3 text-gray-400">Destinataire</th>
                  <th className="text-left p-3 text-gray-400">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-600">
                {emailLogs.map(log => (
                  <tr key={log._id} className="hover:bg-dark-700/50">
                    <td className="p-3 text-gray-400">
                      {new Date(log.createdAt).toLocaleDateString('fr-TN')}
                    </td>
                    <td className="p-3 text-gray-400">{log.type}</td>
                    <td className="p-3 text-white">{log.subject}</td>
                    <td className="p-3 text-gray-400">{log.to}</td>
                    <td className="p-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs ${
                        log.status === 'sent' || log.status === 'delivered'
                          ? 'bg-green-900/30 text-green-400'
                          : log.status === 'failed' || log.status === 'bounced'
                            ? 'bg-red-900/30 text-red-400'
                            : 'bg-yellow-900/30 text-yellow-400'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
