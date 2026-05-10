import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../api';

export default function AdminMarketingImages() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link: '',
    order: 0,
    duration: 5
  });

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const res = await api.get('/admin/marketing-images');
      setImages(res.data);
    } catch (err) {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const file = e.target.image.files[0];
    if (!file) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    setUploading(true);
    const data = new FormData();
    data.append('image', file);
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('link', formData.link);
    data.append('order', formData.order);
    data.append('duration', formData.duration);

    try {
      await api.post('/admin/marketing-images', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Image uploadée');
      setShowUpload(false);
      setFormData({ title: '', description: '', link: '', order: 0, duration: 5 });
      fetchImages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur upload');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette image ?')) return;
    try {
      await api.delete(`/admin/marketing-images/${id}`);
      toast.success('Image supprimée');
      fetchImages();
    } catch (err) {
      toast.error('Erreur');
    }
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      await api.patch(`/admin/marketing-images/${id}`, { isActive: !isActive });
      toast.success(isActive ? 'Image désactivée' : 'Image activée');
      fetchImages();
    } catch (err) {
      toast.error('Erreur');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-white">Images Marketing</h1>
          <p className="text-gray-500 text-sm mt-1">Gestion du carousel sur la page d'accueil</p>
        </div>
        <button onClick={() => setShowUpload(true)} className="btn-primary">
          + Ajouter Image
        </button>
      </div>

      {loading ? (
        <div className="card py-12 text-center">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : images.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">🖼️</div>
          <div className="text-gray-500">Aucune image marketing</div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map(image => (
            <div key={image._id} className={`card p-4 ${!image.isActive ? 'opacity-50' : ''}`}>
              <div className="aspect-video rounded-xl overflow-hidden mb-4 bg-dark-700">
                <img
                  src={image.imageUrl}
                  alt={image.title}
                  className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => setPreviewImage(image.imageUrl)}
                />
              </div>
              <h3 className="font-semibold text-white mb-1">{image.title}</h3>
              {image.description && (
                <p className="text-gray-500 text-sm mb-3">{image.description}</p>
              )}
              <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                <span>Ordre: {image.order}</span>
                <span>•</span>
                <span>Durée: {image.duration}s</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(image._id, image.isActive)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    image.isActive
                      ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
                      : 'bg-dark-600 text-gray-400 hover:bg-dark-500'
                  }`}
                >
                  {image.isActive ? 'Actif' : 'Inactif'}
                </button>
                <button
                  onClick={() => handleDelete(image._id)}
                  className="px-3 py-2 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 text-sm"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-xl text-white mb-4">Ajouter une Image</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Image *</label>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Titre *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows={2}
                />
              </div>
              <div>
                <label className="label">Lien (optionnel)</label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={e => setFormData({ ...formData, link: e.target.value })}
                  className="input"
                  placeholder="https://..."
                />
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
                <div>
                  <label className="label">Durée (secondes)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) || 5 })}
                    className="input"
                    min="1"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUpload(false)}
                  className="flex-1 btn-secondary"
                  disabled={uploading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                  disabled={uploading}
                >
                  {uploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Upload...
                    </span>
                  ) : 'Uploader'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-full rounded-xl"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 text-white text-2xl hover:text-brand-400"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
