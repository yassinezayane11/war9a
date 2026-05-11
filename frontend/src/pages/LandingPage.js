import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade } from 'swiper/modules';
import Countdown from 'react-countdown';
import api from '../api';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Stat Card Component
function StatCard({ value, label, suffix = '', delay = 0 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      variants={fadeInUp}
      className="bg-dark-800/80 border border-dark-600 rounded-2xl p-4 sm:p-6 text-center hover:border-brand-500/30 transition-all"
    >
      <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-brand-400 font-display mb-1 sm:mb-2">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-xs sm:text-sm text-gray-500">{label}</div>
    </motion.div>
  );
}

// Ticket Preview Card
function TicketPreviewCard({ ticket }) {
  const firstMatchDate = ticket.firstMatchDate ? new Date(ticket.firstMatchDate) : null;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-dark-800 border border-dark-600 rounded-2xl p-4 sm:p-5 hover:border-brand-500/30 transition-all"
    >
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <span className="text-xs bg-brand-500/10 text-brand-400 px-2 py-1 rounded-full">
          {ticket.category}
        </span>
        <span className="text-xs text-gray-500">{ticket.matchCount} matchs</span>
      </div>
      <h3 className="font-display text-base sm:text-lg text-white mb-2">{ticket.title}</h3>
      <div className="flex items-center justify-between mb-3">
        <div className="text-brand-400 font-bold text-sm sm:text-base">{ticket.price} TND</div>
        {ticket.globalOdds && (
          <div className="text-green-400 font-mono text-xs sm:text-sm">×{ticket.globalOdds}</div>
        )}
      </div>
      {firstMatchDate && (
        <div className="text-xs text-gray-500">
          Premier match: {firstMatchDate.toLocaleDateString('fr-TN')}
        </div>
      )}
    </motion.div>
  );
}

// Winning Ticket Card
function WinningTicketCard({ ticket }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="gradient-border p-4 sm:p-5 glow-green"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl sm:text-2xl">🏆</span>
        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
          Ticket Gagnant
        </span>
      </div>
      <h3 className="font-display text-lg sm:text-xl text-white mb-2">{ticket.title}</h3>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="bg-dark-700 rounded-xl p-2 sm:p-3 text-center">
          <div className="text-xs text-gray-500">Cote</div>
          <div className="text-green-400 font-bold text-sm sm:text-base">×{ticket.globalOdds}</div>
        </div>
        <div className="bg-dark-700 rounded-xl p-2 sm:p-3 text-center">
          <div className="text-xs text-gray-500">Gain</div>
          <div className="text-brand-400 font-bold text-sm sm:text-base">{ticket.winningAmount} TND</div>
        </div>
      </div>
      {ticket.wonAt && (
        <div className="mt-3 text-xs text-gray-500 text-center">
          Gagné le {new Date(ticket.wonAt).toLocaleDateString('fr-TN')}
        </div>
      )}
    </motion.div>
  );
}

// Testimonial Card
function TestimonialCard({ testimonial }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="bg-dark-800 border border-dark-600 rounded-2xl p-4 sm:p-6"
    >
      <div className="flex items-center gap-1 mb-3">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={i < testimonial.rating ? 'text-yellow-400' : 'text-gray-600'}>
            ★
          </span>
        ))}
      </div>
      <p className="text-gray-300 text-xs sm:text-sm mb-4 leading-relaxed">"{testimonial.text}"</p>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-400 font-bold text-sm">
          {testimonial.name[0]}
        </div>
        <div>
          <div className="font-semibold text-white text-xs sm:text-sm">{testimonial.name}</div>
          {testimonial.isVerified && (
            <div className="text-xs text-green-400">✓ Client vérifié</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Simple Ticket Card for Landing Page (purchasable tickets display)
function TicketCard({ ticket }) {
  const firstMatchDate = ticket.firstMatchDate ? new Date(ticket.firstMatchDate) : null;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-dark-800 border border-dark-600 rounded-2xl p-4 sm:p-5 hover:border-brand-500/30 transition-all h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <span className="text-xs bg-brand-500/10 text-brand-400 px-2 py-1 rounded-full">
          {ticket.category || 'Football'}
        </span>
        <span className="text-xs text-gray-500">{ticket.matchCount || 0} matchs</span>
      </div>
      <h3 className="font-display text-base sm:text-lg text-white mb-2">{ticket.title}</h3>
      <div className="mt-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="text-brand-400 font-bold text-sm sm:text-base">{ticket.price} TND</div>
          {ticket.globalOdds && (
            <div className="text-green-400 font-mono text-xs sm:text-sm">×{ticket.globalOdds}</div>
          )}
        </div>
        {firstMatchDate && (
          <div className="text-xs text-gray-500">
            Premier match: {firstMatchDate.toLocaleDateString('fr-TN')}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Main Landing Page Component
export default function LandingPage() {
  const [stats, setStats] = useState(null);
  const [winningTickets, setWinningTickets] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [marketingImages, setMarketingImages] = useState([]);
  const [availableTickets, setAvailableTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, winnersRes, testimonialsRes, imagesRes, ticketsRes] = await Promise.all([
          api.get('/public/stats').catch(() => ({ data: null })),
          api.get('/public/winning-tickets').catch(() => ({ data: [] })),
          api.get('/public/testimonials').catch(() => ({ data: [] })),
          api.get('/public/marketing-images').catch(() => ({ data: [] })),
          api.get('/public/available-tickets').catch(() => ({ data: [] }))
        ]);

        setStats(statsRes.data);
        setWinningTickets(winnersRes.data);
        setTestimonials(testimonialsRes.data);
        setMarketingImages(imagesRes.data);
        setAvailableTickets(ticketsRes.data);
      } catch (err) {
        console.error('Landing page data error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 overflow-x-hidden w-full">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/80 backdrop-blur-lg border-b border-dark-600">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white font-display text-lg sm:text-xl">W</div>
            <div className="font-display text-xl sm:text-2xl text-white tracking-wider">WAR9A.TN</div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/login" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm whitespace-nowrap">
              Connexion
            </Link>
            <Link to="/register" className="btn-primary text-xs sm:text-sm py-2 px-3 sm:px-6 whitespace-nowrap">
              Créer un compte
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-7xl mx-auto">
          <motion.div
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            <div>
              <motion.div variants={fadeInUp} className="mb-6">
                <span className="inline-flex items-center gap-2 bg-brand-500/10 text-brand-400 px-4 py-2 rounded-full text-sm border border-brand-500/20">
                  <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
                  Plateforme #1 en Tunisie
                </span>
              </motion.div>
              <motion.h1
                variants={fadeInUp}
                className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white leading-tight mb-6"
              >
                PRONOSTICS FOOTBALL
                <span className="text-brand-400"> PREMIUM</span>
              </motion.h1>
              <motion.p variants={fadeInUp} className="text-gray-400 text-base sm:text-lg mb-8 leading-relaxed">
                Rejoignez des milliers de gagnants. Des pronostics professionnels avec
                un taux de réussite exceptionnel. Vos gains commencent ici.
              </motion.p>
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link to="/register" className="btn-primary text-base sm:text-lg px-6 py-3 w-full sm:w-auto text-center">
                  Créer un compte →
                </Link>
                <Link to="/login" className="btn-secondary text-base sm:text-lg px-6 py-3 w-full sm:w-auto text-center">
                  Voir les tickets
                </Link>
              </motion.div>
            </div>

            {/* Marketing Carousel */}
            <motion.div variants={fadeInUp} className="relative w-full">
              {marketingImages.length > 0 ? (
                <Swiper
                  modules={[Autoplay, Pagination, EffectFade]}
                  effect="fade"
                  autoplay={{ delay: 5000, disableOnInteraction: false }}
                  pagination={{ clickable: true }}
                  loop
                  className="rounded-2xl overflow-hidden"
                >
                  {marketingImages.map((img) => (
                    <SwiperSlide key={img._id}>
                      <div className="aspect-video bg-dark-800 w-full">
                        <img
                          src={img.imageUrl}
                          alt={img.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-brand-500/20 to-dark-800 rounded-2xl flex items-center justify-center border border-dark-600 w-full">
                  <div className="text-center px-4">
                    <div className="text-4xl sm:text-6xl mb-4">🎯</div>
                    <div className="text-gray-400 text-sm sm:text-base">Pronostics Premium</div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-dark-800/50">
        <div className="w-full max-w-7xl mx-auto">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {stats && (
              <>
                <StatCard value={stats.totalWinningTickets} label="Tickets Gagnants" />
                <StatCard value={stats.successRate} label="Taux de Réussite" suffix="%" />
                <StatCard value={Math.floor(stats.totalGains / 1000)} label="K TND Distribués" suffix="K+" />
                <StatCard value={stats.totalUsers} label="Utilisateurs" />
              </>
            )}
          </motion.div>
        </div>
      </section>

      {/* Available Tickets Preview */}
      {availableTickets.length > 0 && (
        <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-12"
            >
              <h2 className="font-display text-xl sm:text-2xl lg:text-3xl text-white mb-4">TICKETS DISPONIBLES</h2>
              <p className="text-gray-500 text-sm sm:text-base">Achetez vos pronostics premium dès maintenant</p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {availableTickets.map((ticket, i) => (
                <motion.div
                  key={ticket._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="h-full"
                >
                  <TicketCard ticket={ticket} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Winning Tickets Section */}
      {winningTickets.length > 0 && (
        <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-dark-800/30">
          <div className="w-full max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-12"
            >
              <h2 className="font-display text-xl sm:text-2xl lg:text-3xl text-white mb-4">DERNIERS TICKETS GAGNANTS</h2>
              <p className="text-gray-500 text-sm sm:text-base">Nos pronostics qui ont rapporté gros</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {winningTickets.slice(0, 6).map((ticket, i) => (
                <motion.div
                  key={ticket._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="h-full"
                >
                  <WinningTicketCard ticket={ticket} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {testimonials.length > 0 && (
        <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-12"
            >
              <h2 className="font-display text-xl sm:text-2xl lg:text-3xl text-white mb-4">AVIS DES GAGNANTS</h2>
              <p className="text-gray-500 text-sm sm:text-base">Ce que disent nos clients satisfaits</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {testimonials.slice(0, 6).map((testimonial, i) => (
                <motion.div
                  key={testimonial._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="h-full"
                >
                  <TestimonialCard testimonial={testimonial} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-dark-800 to-dark-900">
        <div className="w-full max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl text-white mb-4 sm:mb-6">
              PRÊT À GAGNER?
            </h2>
            <p className="text-gray-400 text-sm sm:text-base lg:text-lg mb-6 sm:mb-8 px-2 sm:px-0">
              Rejoignez WAR9A.TN aujourd'hui et commencez à gagner avec nos pronostics premium.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <Link to="/register" className="btn-primary text-base sm:text-lg px-6 sm:px-8 py-3 w-full sm:w-auto text-center">
                Commencer maintenant
              </Link>
              <Link to="/login" className="btn-secondary text-base sm:text-lg px-6 sm:px-8 py-3 w-full sm:w-auto text-center">
                J'ai déjà un compte
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 border-t border-dark-600">
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white font-display">W</div>
                <div className="font-display text-lg text-white tracking-wider">WAR9A.TN</div>
              </div>
              <p className="text-gray-500 text-xs sm:text-sm">
                La plateforme de pronostics football premium en Tunisie.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Liens Rapides</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-500">
                <li><Link to="/login" className="hover:text-brand-400 transition-colors">Connexion</Link></li>
                <li><Link to="/register" className="hover:text-brand-400 transition-colors">Inscription</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Légal</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-500">
                <li><span className="hover:text-brand-400 cursor-pointer">Conditions d'utilisation</span></li>
                <li><span className="hover:text-brand-400 cursor-pointer">Politique de confidentialité</span></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Contact</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-500">
                <li>support@war9a.tn</li>
                <li>Tunisie</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-dark-600 pt-6 sm:pt-8 text-center text-gray-500 text-xs sm:text-sm">
            © 2024 WAR9A.TN. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}
