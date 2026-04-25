import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api';
import { useAuth } from '../context/AuthContext';

function MatchRow({ match, showOdds }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-dark-600 last:border-0">
      <div className="flex items-center gap-2 flex-1">
        <span className="text-sm font-medium text-white">{match.team1}</span>
        <span className="text-xs text-gray-600 bg-dark-600 px-2 py-0.5 rounded-full">vs</span>
        <span className="text-sm font-medium text-white">{match.team2}</span>
      </div>
      <div className="text-right ml-4">
        <div className="text-xs text-gray-500">{match.betType}</div>
        {showOdds && match.odds && (
          <div className="text-brand-400 font-mono font-semibold text-sm">×{match.odds}</div>
        )}
      </div>
    </div>
  );
}

function TicketCard({ ticket, onPurchase }) {
  const [expanded, setExpanded] = useState(false);
  const [buying, setBuying] = useState(false);

  const handleBuy = async () => {
    setBuying(true);
    try {
      await onPurchase(ticket._id);
    } finally {
      setBuying(false);
    }
  };

  const probColor = ticket.successProbability >= 70 ? 'text-green-400' :
    ticket.successProbability >= 40 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className={`card transition-all duration-300 ${ticket.isPurchased ? 'border-green-500/30 glow-green' : 'hover:border-dark-500'}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2 py-0.5 rounded-full">
              {ticket.category || 'Football'}
            </span>
            {ticket.isPurchased && (
              <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full">
                ✓ Acheté
              </span>
            )}
          </div>
          <h3 className="font-display text-xl text-white tracking-wide">{ticket.title}</h3>
        </div>
        <div className="text-right">
          <div className="font-mono font-bold text-2xl text-brand-400">{ticket.price} <span className="text-sm text-gray-500">TND</span></div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {ticket.showOdds && ticket.globalOdds && (
          <div className="bg-dark-700 rounded-xl p-3 text-center">
            <div className="text-xs text-gray-500 mb-1">Cote globale</div>
            <div className="font-mono font-bold text-brand-400">×{ticket.globalOdds}</div>
          </div>
        )}
        {ticket.successProbability != null && (
          <div className="bg-dark-700 rounded-xl p-3 text-center">
            <div className="text-xs text-gray-500 mb-1">Probabilité</div>
            <div className={`font-mono font-bold ${probColor}`}>{ticket.successProbability}%</div>
          </div>
        )}
        <div className="bg-dark-700 rounded-xl p-3 text-center">
          <div className="text-xs text-gray-500 mb-1">Matchs</div>
          <div className="font-mono font-bold text-white">{ticket.matches?.length}</div>
        </div>
      </div>

      {/* Description */}
      {ticket.description && (
        <p className="text-sm text-gray-400 mb-4 leading-relaxed">{ticket.description}</p>
      )}

      {/* Matches */}
      {ticket.isPurchased || expanded ? (
        <div className="bg-dark-700 rounded-xl p-4 mb-4">
          <div className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">Détails des matchs</div>
          {ticket.matches?.map((m, i) => (
            <MatchRow key={i} match={m} showOdds={ticket.showOdds} />
          ))}
        </div>
      ) : (
        <div className="bg-dark-700/50 rounded-xl p-4 mb-4 border border-dashed border-dark-500 text-center">
          <div className="text-4xl mb-2">🔒</div>
          <div className="text-sm text-gray-500">Achetez ce ticket pour voir les pronostics complets</div>
          <button onClick={() => setExpanded(true)} className="text-brand-400 text-xs mt-1 hover:underline">
            Aperçu des matchs ▾
          </button>
        </div>
      )}

      {!ticket.isPurchased && (
        <button onClick={handleBuy} disabled={buying} className="btn-primary w-full">
          {buying ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Achat en cours...
            </span>
          ) : `Acheter — ${ticket.price} TND`}
        </button>
      )}
    </div>
  );
}

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { refreshUser } = useAuth();

  const fetchTickets = () => {
    setLoading(true);
    api.get('/tickets')
      .then(r => setTickets(r.data))
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTickets(); }, []);

  const handlePurchase = async (id) => {
    try {
      await api.post(`/tickets/${id}/purchase`);
      toast.success('Ticket acheté avec succès!');
      fetchTickets();
      refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'achat');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div>
        <h1 className="font-display text-3xl text-white tracking-wider">TICKETS DISPONIBLES</h1>
        <p className="text-gray-500 mt-1">{tickets.length} ticket(s) actif(s)</p>
      </div>

      {tickets.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-6xl mb-4">🎫</div>
          <div className="text-gray-500">Aucun ticket disponible pour le moment</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tickets.map(ticket => (
            <TicketCard key={ticket._id} ticket={ticket} onPurchase={handlePurchase} />
          ))}
        </div>
      )}
    </div>
  );
}
