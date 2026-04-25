import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', confirm: '', referralCode: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^\d{8}$/.test(form.phone)) return toast.error('Le téléphone doit avoir 8 chiffres');
    if (form.password.length < 6) return toast.error('Mot de passe minimum 6 caractères');
    if (form.password !== form.confirm) return toast.error('Les mots de passe ne correspondent pas');

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name: form.name, phone: form.phone,
        email: form.email || undefined,
        password: form.password,
        referralCode: form.referralCode.trim().toUpperCase() || undefined,
      });
      login(data.token, data.user);
      if (data.bonusApplied) toast.success(`✅ Compte créé! +${data.bonusApplied} TND bonus parrainage crédité!`);
      else toast.success('Compte créé avec succès!');
      navigate('/');
    } catch (err) {
      const errors = err.response?.data?.errors;
      toast.error(errors?.[0]?.msg || err.response?.data?.message || "Erreur lors de l'inscription");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-700/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative animate-fadeInUp">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-500 rounded-2xl mb-4 shadow-lg shadow-brand-500/30">
            <span className="font-display text-3xl text-white">W</span>
          </div>
          <h1 className="font-display text-4xl text-white tracking-widest">WAR9A.TN</h1>
          <p className="text-gray-500 mt-1">Créer un compte</p>
        </div>

        <div className="gradient-border p-px">
          <div className="bg-dark-800 rounded-2xl p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Nom complet *</label>
                <input className="input" placeholder="Votre nom" value={form.name}
                  onChange={e => set('name', e.target.value)} required />
              </div>

              <div>
                <label className="label">Téléphone * (8 chiffres)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-500 font-mono text-sm">+216</span>
                  <input type="tel" className="input pl-16 font-mono" placeholder="XX XXX XXX"
                    value={form.phone} maxLength={8}
                    onChange={e => set('phone', e.target.value.replace(/\D/g, ''))} required />
                </div>
              </div>

              <div>
                <label className="label">Email (optionnel)</label>
                <input type="email" className="input" placeholder="exemple@email.com"
                  value={form.email} onChange={e => set('email', e.target.value)} />
              </div>

              <div>
                <label className="label">Mot de passe *</label>
                <input type="password" className="input" placeholder="Min. 6 caractères"
                  value={form.password} onChange={e => set('password', e.target.value)} required />
              </div>

              <div>
                <label className="label">Confirmer le mot de passe *</label>
                <input type="password" className="input" placeholder="Confirmer"
                  value={form.confirm} onChange={e => set('confirm', e.target.value)} required />
              </div>

              {/* Referral code */}
              <div>
                <label className="label">
                  Code de parrainage{' '}
                  <span className="text-gray-600 font-normal">(optionnel — ex: WAR9AXYZ)</span>
                </label>
                <input className="input font-mono uppercase" placeholder="WAR9A..."
                  value={form.referralCode}
                  onChange={e => set('referralCode', e.target.value.toUpperCase())}
                  maxLength={12} />
                <p className="text-xs text-green-400/70 mt-1">✨ Entrez un code valide pour recevoir un bonus!</p>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Création...
                  </span>
                ) : 'Créer mon compte'}
              </button>
            </form>

            <p className="text-center text-gray-500 text-sm mt-6">
              Déjà inscrit?{' '}
              <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Se connecter</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
