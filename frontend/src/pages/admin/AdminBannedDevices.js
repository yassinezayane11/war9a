import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../api';

export default function AdminBannedDevices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDevice, setNewDevice] = useState({ fingerprint: '', reason: '' });

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const res = await api.get('/admin/banned-devices');
      setDevices(res.data);
    } catch (err) {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleUnban = async (id) => {
    if (!window.confirm('Débannir cet appareil ?')) return;
    try {
      await api.patch(`/admin/banned-devices/${id}/unban`);
      toast.success('Appareil débanni');
      fetchDevices();
    } catch (err) {
      toast.error('Erreur');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/banned-devices', newDevice);
      toast.success('Appareil banni');
      setShowAddModal(false);
      setNewDevice({ fingerprint: '', reason: '' });
      fetchDevices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-white">Appareils Bannis</h1>
          <p className="text-gray-500 text-sm mt-1">Gestion des appareils bloqués</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          + Bannir Appareil
        </button>
      </div>

      {loading ? (
        <div className="card py-12 text-center">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : devices.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">🛡️</div>
          <div className="text-gray-500">Aucun appareil banni</div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-dark-700">
              <tr>
                <th className="text-left p-4 text-gray-400 text-sm font-medium">Fingerprint</th>
                <th className="text-left p-4 text-gray-400 text-sm font-medium">Utilisateur</th>
                <th className="text-left p-4 text-gray-400 text-sm font-medium">Raison</th>
                <th className="text-left p-4 text-gray-400 text-sm font-medium">Date</th>
                <th className="text-left p-4 text-gray-400 text-sm font-medium">Statut</th>
                <th className="text-right p-4 text-gray-400 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-600">
              {devices.map(device => (
                <tr key={device._id} className="hover:bg-dark-700/50">
                  <td className="p-4 font-mono text-xs text-gray-400">
                    {device.fingerprint?.slice(0, 16)}...
                  </td>
                  <td className="p-4">
                    {device.userId ? (
                      <div>
                        <div className="text-white text-sm">{device.userName}</div>
                        <div className="text-gray-500 text-xs">{device.userPhone}</div>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">-</span>
                    )}
                  </td>
                  <td className="p-4 text-gray-400 text-sm">{device.reason}</td>
                  <td className="p-4 text-gray-400 text-sm">
                    {new Date(device.bannedAt).toLocaleDateString('fr-TN')}
                  </td>
                  <td className="p-4">
                    {device.isActive ? (
                      <span className="badge-rejected">Banni</span>
                    ) : (
                      <span className="badge-approved">Débanni</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {device.isActive && (
                      <button
                        onClick={() => handleUnban(device._id)}
                        className="text-green-400 hover:text-green-300 text-sm"
                      >
                        Débannir
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <h3 className="font-display text-xl text-white mb-4">Bannir un Appareil</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="label">Fingerprint</label>
                <input
                  type="text"
                  value={newDevice.fingerprint}
                  onChange={e => setNewDevice({ ...newDevice, fingerprint: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Raison (optionnel)</label>
                <input
                  type="text"
                  value={newDevice.reason}
                  onChange={e => setNewDevice({ ...newDevice, reason: e.target.value })}
                  className="input"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 btn-secondary">
                  Annuler
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  Bannir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
