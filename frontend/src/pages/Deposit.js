import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../api';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

export default function Deposit() {
  const [form, setForm] = useState({ amount: '', method: 'D17', orangeCode: '', promoCode: '' });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [settings, setSettings] = useState({ d17Number: '', orangeNumber: '', promoEnabled: true, promoBonusOnDeposit: 2, orangeAmounts: [1, 5] });
  const fileRef = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    api.get('/deposits/settings').then(r => setSettings(r.data)).catch(() => {});
  }, []);

  // When switching to ORANGE, reset amount so user picks a predefined one
  const handleMethodChange = (method) => {
    setForm(f => ({ ...f, method, amount: '', orangeCode: '' }));
  };

  const handleFile = (f) => {
    if (!f) return;
    if (!ALLOWED_TYPES.includes(f.type)) return toast.error('Format invalide. Accepté: JPG, JPEG, PNG');
    if (f.size > MAX_FILE_SIZE) return toast.error('Fichier trop grand. Max 5 MB');
    setFile(f);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("⚠️ La capture d'écran est obligatoire!");
    if (!form.amount || parseFloat(form.amount) <= 0) return toast.error('Le montant est obligatoire');
    if (form.method === 'ORANGE' && !form.orangeCode.trim()) return toast.error('Le code Orange est obligatoire');

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('amount', form.amount);
      fd.append('method', form.method);
      fd.append('screenshot', file);
      if (form.method === 'ORANGE') fd.append('orangeCode', form.orangeCode.trim());
      if (form.promoCode.trim()) fd.append('promoCode', form.promoCode.trim().toUpperCase());

      const { data } = await api.post('/deposits', fd, { headers: { 'Content-Type': 'multipart/form-data' } });

      if (data.promoBonus > 0) toast.success(`Dépôt envoyé! +${data.promoBonus} TND bonus promo sera ajouté à l'approbation.`);
      else toast.success('Demande de dépôt envoyée! En attente de validation.');

      setForm({ amount: '', method: 'D17', orangeCode: '', promoCode: '' });
      setFile(null); setPreview(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la demande');
    } finally { setLoading(false); }
  };

  const activeNumber = form.method === 'D17' ? settings.d17Number : settings.orangeNumber;

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fadeInUp">
      <div>
        <h1 className="font-display text-3xl text-white tracking-wider">DÉPÔT D'ARGENT</h1>
        <p className="text-gray-500 mt-1">Rechargez votre solde</p>
      </div>

      {/* Info banner */}
      <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4 flex gap-3">
        <span className="text-2xl flex-shrink-0">ℹ️</span>
        <div className="text-sm text-blue-300">
          <p className="font-semibold mb-1">Comment déposer?</p>
          {activeNumber ? (
            <p className="text-blue-400">
              Envoyez votre paiement au numéro :{' '}
              <span className="font-mono font-bold text-white bg-blue-900/50 px-2 py-0.5 rounded">{activeNumber}</span>
              , puis soumettez ce formulaire avec la capture d'écran. Un admin validera sous 24h.
            </p>
          ) : (
            <p className="text-blue-400">Contactez l'administrateur pour le numéro de paiement.</p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        {/* Method selector */}
        <div>
          <label className="label">Méthode de paiement</label>
          <div className="grid grid-cols-2 gap-3">
            {[{ value: 'D17', label: '💳 D17' }, { value: 'ORANGE', label: '🟠 Orange Money' }].map(m => (
              <button key={m.value} type="button"
                className={`py-3 rounded-xl border font-semibold transition-all text-sm sm:text-base ${
                  form.method === m.value
                    ? 'bg-brand-500/15 border-brand-500 text-brand-400'
                    : 'bg-dark-700 border-dark-500 text-gray-400 hover:border-dark-400'
                }`}
                onClick={() => handleMethodChange(m.value)}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Payment number (read-only) */}
        {activeNumber && (
          <div className="bg-dark-700 rounded-xl p-3 flex items-center gap-3 flex-wrap">
            <span className="text-gray-500 text-sm">Envoyer au numéro:</span>
            <span className="font-mono font-bold text-white tracking-wider">{activeNumber}</span>
          </div>
        )}

        {/* Amount: free input for D17, fixed buttons for ORANGE */}
        <div>
          <label className="label">
            Montant (TND) *
            {form.method === 'ORANGE' && (
              <span className="text-xs text-orange-400 ml-2">— montants fixes uniquement</span>
            )}
          </label>

          {form.method === 'D17' ? (
            <input type="number" className="input font-mono" placeholder="0.000" min="1" step="0.001"
              value={form.amount} onChange={e => set('amount', e.target.value)} required />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {(settings.orangeAmounts || [1, 5]).map(amt => (
                <button key={amt} type="button"
                  className={`py-4 rounded-xl border font-bold font-mono text-lg transition-all ${
                    parseFloat(form.amount) === amt
                      ? 'bg-orange-500/15 border-orange-500 text-orange-400'
                      : 'bg-dark-700 border-dark-500 text-gray-300 hover:border-orange-500/50'
                  }`}
                  onClick={() => set('amount', String(amt))}>
                  {amt} TND
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Orange code — ORANGE only */}
        {form.method === 'ORANGE' && (
          <div>
            <label className="label">
              Code Orange <span className="text-red-400 font-bold">* OBLIGATOIRE</span>
            </label>
            <input className="input font-mono" placeholder="Code de recharge Orange"
              value={form.orangeCode} onChange={e => set('orangeCode', e.target.value)} required />
          </div>
        )}

        {/* Screenshot upload */}
        <div>
          <label className="label">
            Capture d'écran <span className="text-red-400 font-bold">* OBLIGATOIRE</span>
          </label>
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
              dragOver ? 'border-brand-500 bg-brand-500/10'
              : file ? 'border-green-500 bg-green-900/10'
              : 'border-dark-500 hover:border-brand-500/50'
            }`}
            onClick={() => fileRef.current.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {preview ? (
              <div className="space-y-3">
                <img src={preview} alt="preview" className="max-h-48 mx-auto rounded-xl object-contain" />
                <div className="text-green-400 text-sm font-medium truncate px-2">✓ {file.name}</div>
                <div className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)} KB</div>
                <button type="button"
                  onClick={e => { e.stopPropagation(); setFile(null); setPreview(null); }}
                  className="text-xs text-red-400 hover:underline">Supprimer</button>
              </div>
            ) : (
              <div>
                <div className="text-4xl mb-3">📷</div>
                <div className="text-white font-medium text-sm sm:text-base">Glissez ou cliquez pour uploader</div>
                <div className="text-xs text-gray-500 mt-1">JPG, JPEG, PNG — Max 5 MB</div>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png" className="hidden"
            onChange={e => handleFile(e.target.files[0])} />
        </div>

        {/* Promo code */}
        {settings.promoEnabled && (
          <div>
            <label className="label">
              Code promo <span className="text-gray-600 font-normal">(optionnel)</span>
            </label>
            <input className="input font-mono uppercase" placeholder="WAR9A..."
              value={form.promoCode}
              onChange={e => set('promoCode', e.target.value.toUpperCase())}
              maxLength={12} />
            <p className="text-xs text-green-400/70 mt-1">
              ✨ Code valide = +{settings.promoBonusOnDeposit} TND bonus à l'approbation
            </p>
          </div>
        )}

        <button type="submit" disabled={loading || !file} className="btn-primary w-full">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Envoi en cours...
            </span>
          ) : '📤 Soumettre la demande de dépôt'}
        </button>

        {!file && (
          <p className="text-center text-red-400/70 text-xs">
            ⚠️ La capture d'écran est requise pour soumettre
          </p>
        )}
      </form>
    </div>
  );
}
