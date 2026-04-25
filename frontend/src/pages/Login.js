import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^\d{8}$/.test(form.phone)) return toast.error('Le numéro doit contenir 8 chiffres');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, data.user);
      toast.success(`Bienvenue, ${data.user.name}!`);
      navigate(data.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Identifiants invalides');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-700/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative animate-fadeInUp">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-500 rounded-2xl mb-4 shadow-lg shadow-brand-500/30">
            <span className="font-display text-3xl text-white">W</span>
          </div>
          <h1 className="font-display text-4xl text-white tracking-widest">WAR9A.TN</h1>
          <p className="text-gray-500 mt-1">Connexion à votre compte</p>
        </div>

        <div className="gradient-border p-px">
          <div className="bg-dark-800 rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Numéro de téléphone</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-500 font-mono text-sm">+216</span>
                  <input
                    type="tel"
                    className="input pl-16 font-mono"
                    placeholder="XX XXX XXX"
                    value={form.phone}
                    maxLength={8}
                    onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Mot de passe</label>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full text-center mt-2">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Connexion...
                  </span>
                ) : 'Se connecter'}
              </button>
            </form>

            <p className="text-center text-gray-500 text-sm mt-6">
              Pas encore de compte?{' '}
              <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium">
                S'inscrire
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
