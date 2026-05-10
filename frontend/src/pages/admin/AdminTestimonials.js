import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../api';

export default function AdminTestimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    text: '',
    rating: 5,
    winningAmount: '',
    isVerified: false,
    order: 0
  });

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const res = await api.get('/admin/testimonials');
      setTestimonials(res.data);
    } catch (err) {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.patch(`/admin/testimonials/${editing._id}`, formData);
        toast.success('Témoignage mis à jour');
      } else {
        await api.post('/admin/testimonials', formData);
        toast.success('Témoignage ajouté');
      }
      setShowForm(false);
      setEditing(null);
      setFormData({ name: '', text: '', rating: 5, winningAmount: '', isVerified: false, order: 0 });
      fetchTestimonials();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const handleEdit = (testimonial) => {
    setEditing(testimonial);
    setFormData({
      name: testimonial.name,
      text: testimonial.text,
      rating: testimonial.rating,
      winningAmount: testimonial.winningAmount || '',
      isVerified: testimonial.isVerified,
      order: testimonial.order
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce témoignage ?')) return;
    try {
      await api.delete(`/admin/testimonials/${id}`);
      toast.success('Témoignage supprimé');
      fetchTestimonials();
    } catch (err) {
      toast.error('Erreur');
    }
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      await api.patch(`/admin/testimonials/${id}`, { isActive: !isActive });
      toast.success(isActive ? 'Témoignage désactivé' : 'Témoignage activé');
      fetchTestimonials();
    } catch (err) {
      toast.error('Erreur');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-white">Témoignages</h1>
          <p className="text-gray-500 text-sm mt-1">Gestion des avis clients sur la page d'accueil</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + Ajouter Témoignage
        </button>
      </div>

      {loading ? (
        <div className="card py-12 text-center">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : testimonials.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">💬</div>
          <div className="text-gray-500">Aucun témoignage</div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map(t => (
            <div key={t._id} className={`card ${!t.isActive ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < t.rating ? 'text-yellow-400' : 'text-gray-600'}>★</span>
                ))}
              </div>
              <p className="text-gray-300 text-sm mb-4">"{t.text}"</p>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-400 font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">{t.name}</div>
                    {t.isVerified && (
                      <div className="text-xs text-green-400">✓ Vérifié</div>
                    )}
                  </div>
                </div>
                {t.winningAmount > 0 && (
                  <div className="text-brand-400 font-bold text-sm">
                    +{t.winningAmount} TND
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(t._id, t.isActive)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    t.isActive
                      ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
                      : 'bg-dark-600 text-gray-400 hover:bg-dark-500'
                  }`}
                >
                  {t.isActive ? 'Actif' : 'Inactif'}
                </button>
                <button
                  onClick={() => handleEdit(t)}
                  className="px-3 py-2 rounded-lg bg-dark-600 text-gray-400 hover:bg-dark-500 text-sm"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(t._id)}
                  className="px-3 py-2 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 text-sm"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg">
            <h3 className="font-display text-xl text-white mb-4">
              {editing ? 'Modifier Témoignage' : 'Ajouter Témoignage'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Nom *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Témoignage *</label>
                <textarea
                  value={formData.text}
                  onChange={e => setFormData({ ...formData, text: e.target.value })}
                  className="input"
                  rows={3}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Note (1-5)</label>
                  <input
                    type="number"
                    value={formData.rating}
                    onChange={e => setFormData({ ...formData, rating: parseInt(e.target.value) || 5 })}
                    className="input"
                    min="1"
                    max="5"
                  />
                </div>
                <div>
                  <label className="label">Montant Gagné (TND)</label>
                  <input
                    type="number"
                    value={formData.winningAmount}
                    onChange={e => setFormData({ ...formData, winningAmount: e.target.value })}
                    className="input"
                    min="0"
                    step="0.001"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Ordre</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className="input"
                    min="0"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isVerified}
                      onChange={e => setFormData({ ...formData, isVerified: e.target.checked })}
                      className="w-4 h-4 rounded border-dark-500 bg-dark-700 text-brand-500"
                    />
                    <span className="text-gray-400 text-sm">Client vérifié</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditing(null);
                    setFormData({ name: '', text: '', rating: 5, winningAmount: '', isVerified: false, order: 0 });
                  }}
                  className="flex-1 btn-secondary"
                >
                  Annuler
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  {editing ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
