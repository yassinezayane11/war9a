import React, { useEffect, useState } from 'react';
import Countdown from 'react-countdown';
import { toast } from 'react-toastify';
import api from '../api';
import { useAuth } from '../context/AuthContext';

// Match Row Component - shows match details
function MatchRow({ match, showOdds }) {
  const matchDate = match.matchDate ? new Date(match.matchDate) : null;

  return (
    <div className="flex items-center justify-between py-3 border-b border-dark-600 last:border-0">
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-white">{match.team1}</span>
          <span className="text-xs text-gray-600 bg-dark-600 px-2 py-0.5 rounded-full">vs</span>
          <span className="text-sm font-medium text-white">{match.team2}</span>
        </div>
        {match.league && (
          <div className="text-xs text-gray-600 mt-1">{match.league}</div>
        )}
        {matchDate && (
          <div className="text-xs text-brand-400 mt-1">
            {matchDate.toLocaleDateString('fr-TN')} à {matchDate.toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
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

// Countdown renderer
const countdownRenderer = ({ days, hours, minutes, seconds, completed }) => {
  if (completed) {
    return <span className="text-red-400">Expiré</span>;
  }
  return (
    <span className="font-mono text-brand-400">
      {days > 0 && `${days}j `}{hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
    </span>
  );
};

// Watermark Overlay for purchased tickets
function WatermarkOverlay({ watermark }) {
  if (!watermark) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03] select-none">
      <div className="absolute inset-0 flex flex-wrap content-center justify-center gap-8 transform -rotate-12">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="text-dark-900 font-bold text-lg whitespace-nowrap">
            {watermark.userName} - {watermark.userPhone} - {watermark.purchaseId} - WAR9A.TN
          </div>
        ))}
      </div>
    </div>
  );
}

// Visible Watermark for purchased tickets
function VisibleWatermark({ watermark }) {
  if (!watermark) return null;

  return (
    <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-xl p-3 mb-4">
      <div className="text-xs text-yellow-400 font-medium mb-1">🔒 Protection Anti-Partage</div>
      <div className="text-xs text-gray-400">
        Ce ticket est lié à: <span className="text-yellow-400">{watermark.userName}</span> ({watermark.userPhone})
      </div>
      <div className="text-xs text-gray-500 mt-1">ID: {watermark.purchaseId}</div>
    </div>
  );
}

// Locked Preview - for non-purchased tickets
function LockedPreview() {
  return (
    <div className="bg-dark-700/50 rounded-xl p-6 mb-4 border border-dark-500">
      <div className="flex flex-col items-center justify-center py-8">
        <div className="text-5xl mb-4">🔒</div>
        <div className="text-brand-400 font-semibold mb-2">Contenu Verrouillé</div>
        <div className="text-sm text-gray-500 text-center max-w-xs">
          Achetez ce ticket pour voir les détails complets des matchs et les pronostics
        </div>
      </div>
    </div>
  );
}

// Ticket Card Component
function TicketCard({ ticket, onPurchase }) {
  const [buying, setBuying] = useState(false);
  const { user } = useAuth();

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

  const firstMatchDate = ticket.firstMatchDate ? new Date(ticket.firstMatchDate) : null;
  const expirationDate = ticket.expirationDate ? new Date(ticket.expirationDate) : null;

  return (
    <div className={`card transition-all duration-300 relative overflow-hidden ${
      ticket.isPurchased ? 'border-green-500/30 glow-green' : 'hover:border-dark-500'
    }`}>
      {/* Watermark for purchased tickets */}
      {ticket.isPurchased && ticket.watermark && <WatermarkOverlay watermark={ticket.watermark} />}

      {/* Header */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2 py-0.5 rounded-full">
              {ticket.category || 'Football'}
            </span>
            {ticket.isPurchased && (
              <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full">
                ✓ Acheté
              </span>
            )}
            {ticket.isExpired && (
              <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
                Expiré
              </span>
            )}
          </div>
          <h3 className="font-display text-xl text-white tracking-wide">{ticket.title}</h3>
        </div>
        <div className="text-right">
          <div className="font-mono font-bold text-2xl text-brand-400">{ticket.price} <span className="text-sm text-gray-500">TND</span></div>
        </div>
      </div>

      {/* Countdown Timer */}
      {expirationDate && !ticket.isExpired && (
        <div className="bg-dark-700/50 rounded-xl p-3 mb-4 flex items-center justify-between">
          <span className="text-xs text-gray-500">Temps restant:</span>
          <Countdown date={expirationDate} renderer={countdownRenderer} />
        </div>
      )}

      {/* First Match Date */}
      {firstMatchDate && (
        <div className="text-xs text-gray-500 mb-3">
          Premier match: <span className="text-brand-400">
            {firstMatchDate.toLocaleDateString('fr-TN')} à {firstMatchDate.toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4 relative z-10">
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
          <div className="font-mono font-bold text-white">{ticket.matchCount || ticket.matches?.length || 0}</div>
        </div>
      </div>

      {/* Description */}
      {ticket.description && (
        <p className="text-sm text-gray-400 mb-4 leading-relaxed relative z-10">{ticket.description}</p>
      )}

      {/* Visible Watermark for purchased tickets */}
      {ticket.isPurchased && ticket.watermark && <VisibleWatermark watermark={ticket.watermark} />}

      {/* Matches - Protected Content */}
      {ticket.isPurchased ? (
        <div className="bg-dark-700 rounded-xl p-4 mb-4 relative z-10">
          <div className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">Détails des matchs</div>
          {ticket.matches?.map((m, i) => (
            <MatchRow key={i} match={m} showOdds={ticket.showOdds} />
          ))}
        </div>
      ) : (
        <LockedPreview />
      )}

      {/* Purchase Button */}
      {!ticket.isPurchased && !ticket.isExpired && (
        <button onClick={handleBuy} disabled={buying} className="btn-primary w-full relative z-10">
          {buying ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Achat en cours...
            </span>
          ) : `Acheter — ${ticket.price} TND`}
        </button>
      )}

      {ticket.isExpired && !ticket.isPurchased && (
        <button disabled className="w-full py-3 rounded-xl bg-dark-600 text-gray-500 cursor-not-allowed relative z-10">
          Ticket Expiré
        </button>
      )}
    </div>
  );
}

// Skeleton Loader
function TicketSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="w-20 h-5 bg-dark-600 rounded-full mb-2" />
          <div className="w-3/4 h-6 bg-dark-600 rounded" />
        </div>
        <div className="w-16 h-8 bg-dark-600 rounded" />
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-dark-700 rounded-xl p-3 h-16" />
        ))}
      </div>
      <div className="bg-dark-700/50 rounded-xl p-4 mb-4 h-32" />
      <div className="h-12 bg-dark-600 rounded-xl" />
    </div>
  );
}

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { refreshUser, user } = useAuth();

  const fetchTickets = () => {
    setLoading(true);
    api.get('/tickets')
      .then(r => setTickets(r.data))
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets();
    // Refresh every minute to update countdowns
    const interval = setInterval(fetchTickets, 60000);
    return () => clearInterval(interval);
  }, []);

  const handlePurchase = async (id) => {
    try {
      const response = await api.post(`/tickets/${id}/purchase`);
      toast.success('Ticket acheté avec succès!');

      // Show watermark info
      if (response.data.watermark) {
        toast.info(
          `Ticket protégé avec votre watermark: ${response.data.watermark.userName} - ${response.data.watermark.purchaseId}`,
          { autoClose: 5000 }
        );
      }

      fetchTickets();
      refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'achat');
    }
  };

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div>
        <h1 className="font-display text-3xl text-white tracking-wider">TICKETS DISPONIBLES</h1>
        <p className="text-gray-500 mt-1">
          {loading ? 'Chargement...' : `${tickets.length} ticket(s) disponible(s)`}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <TicketSkeleton key={i} />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-6xl mb-4">🎫</div>
          <div className="text-gray-500">Aucun ticket disponible pour le moment</div>
          <p className="text-gray-600 text-sm mt-2">Revenez plus tard pour découvrir nos nouveaux pronostics</p>
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
