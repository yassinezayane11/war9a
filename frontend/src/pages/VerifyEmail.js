import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import api from '../api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  const token = searchParams.get('token');
  const userId = searchParams.get('user');

  useEffect(() => {
    if (!token || !userId) {
      setStatus('error');
      setMessage('Lien de vérification invalide. Il manque des paramètres.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await api.get(`/email/verify?token=${token}&user=${userId}`);
        setStatus('success');
        setMessage(response.data.message);
        toast.success('Email vérifié avec succès!');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Une erreur est survenue lors de la vérification.');
        toast.error('Échec de la vérification');
      }
    };

    verifyEmail();
  }, [token, userId]);

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center text-white font-display text-2xl">W</div>
            <div className="font-display text-2xl text-white tracking-wider">WAR9A.TN</div>
          </div>
        </div>

        <div className="card text-center">
          {status === 'verifying' && (
            <>
              <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <h2 className="font-display text-xl text-white mb-2">Vérification en cours...</h2>
              <p className="text-gray-500">Veuillez patienter pendant que nous vérifions votre email.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="text-6xl mb-4">✅</div>
              <h2 className="font-display text-xl text-white mb-2">Email Vérifié!</h2>
              <p className="text-gray-500 mb-6">{message}</p>
              <p className="text-sm text-gray-600 mb-6">
                Votre adresse email a été confirmée. Vous pouvez maintenant recevoir des notifications importantes.
              </p>
              <Link to="/login" className="btn-primary w-full">
                Se connecter
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="text-6xl mb-4">❌</div>
              <h2 className="font-display text-xl text-white mb-2">Vérification Échouée</h2>
              <p className="text-red-400 mb-6">{message}</p>
              <div className="space-y-3">
                <Link to="/login" className="btn-primary w-full block">
                  Se connecter
                </Link>
                <Link to="/register" className="btn-secondary w-full block">
                  Créer un compte
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
