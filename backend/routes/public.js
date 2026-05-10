const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Purchase = require('../models/Purchase');
const Testimonial = require('../models/Testimonial');
const MarketingImage = require('../models/MarketingImage');

/**
 * GET /public/stats
 * Get public statistics for landing page
 */
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalWinningTickets,
      totalPurchases,
      totalDeposits
    ] = await Promise.all([
      User.countDocuments({ role: 'user', isActive: true }),
      Ticket.countDocuments({ isWinning: true }),
      Purchase.countDocuments(),
      Purchase.aggregate([
        { $group: { _id: null, total: { $sum: '$pricePaid' } } }
      ])
    ]);

    // Calculate success rate (winning tickets / total purchases)
    const winningPurchases = await Purchase.countDocuments({ status: 'won' });
    const successRate = totalPurchases > 0
      ? Math.round((winningPurchases / totalPurchases) * 100)
      : 85; // Default if no data

    // Calculate total gains (from winning tickets)
    const totalGains = await Purchase.aggregate([
      { $match: { status: 'won' } },
      {
        $lookup: {
          from: 'tickets',
          localField: 'ticketId',
          foreignField: '_id',
          as: 'ticket'
        }
      },
      { $unwind: '$ticket' },
      { $group: { _id: null, total: { $sum: { $multiply: ['$pricePaid', '$ticket.globalOdds'] } } } }
    ]);

    res.json({
      totalUsers,
      totalWinningTickets,
      totalPurchases,
      successRate,
      totalGains: totalGains[0]?.total || 0,
      totalDistributed: totalDeposits[0]?.total || 0
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /public/winning-tickets
 * Get winning tickets showcase (limited info for public)
 */
router.get('/winning-tickets', async (req, res) => {
  try {
    const winningTickets = await Ticket.find({
      isWinning: true,
      isActive: true
    })
      .select('title globalOdds winningAmount wonAt image category matches.team1 matches.team2')
      .sort({ wonAt: -1 })
      .limit(6);

    res.json(winningTickets);
  } catch (err) {
    console.error('Winning tickets error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /public/testimonials
 * Get active testimonials
 */
router.get('/testimonials', async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ isActive: true })
      .select('-addedBy')
      .sort({ order: 1, createdAt: -1 })
      .limit(10);

    res.json(testimonials);
  } catch (err) {
    console.error('Testimonials error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /public/marketing-images
 * Get active marketing images for carousel
 */
router.get('/marketing-images', async (req, res) => {
  try {
    const images = await MarketingImage.find({ isActive: true })
      .select('-uploadedBy -publicId')
      .sort({ order: 1, createdAt: -1 });

    res.json(images);
  } catch (err) {
    console.error('Marketing images error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /public/available-tickets
 * Get available tickets preview (limited info for public)
 */
router.get('/available-tickets', async (req, res) => {
  try {
    const now = new Date();

    const tickets = await Ticket.find({
      isActive: true,
      isExpired: false,
      isArchived: false,
      expirationDate: { $gt: now }
    })
      .select('title price globalOdds successProbability category firstMatchDate expirationDate matches')
      .sort({ createdAt: -1 })
      .limit(4);

    // Hide match details for public preview
    const sanitizedTickets = tickets.map(ticket => {
      const t = ticket.toObject();
      t.matchCount = t.matches?.length || 0;
      delete t.matches;
      return t;
    });

    res.json(sanitizedTickets);
  } catch (err) {
    console.error('Available tickets error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
