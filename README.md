# 🎫 War9a.tn — Plateforme de Tickets de Paris

Application complète de vente de tickets de paris sportifs, avec système de dépôt sécurisé et panel admin.

---

## 🛠️ Stack Technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 18 + Tailwind CSS |
| Backend | Node.js + Express |
| Base de données | MongoDB + Mongoose |
| Auth | JWT (7 jours) |
| Upload | Multer (JPG/PNG, 5MB max) |
| Sécurité | bcrypt, rate limiting, hash SHA-256 |

---

## 🚀 Installation & Démarrage

### Prérequis
- Node.js >= 18
- MongoDB (local ou Atlas)

### 1. Installer les dépendances

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configurer l'environnement

```bash
cd backend
cp .env.example .env
# Éditer .env avec vos valeurs:
# MONGODB_URI=mongodb://localhost:27017/war9atn
# JWT_SECRET=votre_secret_tres_long
# PORT=5000
# FRONTEND_URL=http://localhost:3000
```

### 3. Créer le compte admin

```bash
cd backend
node seed.js
# Crée: phone=12345678, password=admin123
```

### 4. Lancer l'application

```bash
# Terminal 1 — Backend (port 5000)
cd backend
npm run dev   # ou: npm start

# Terminal 2 — Frontend (port 3000)
cd frontend
npm start
```

Accéder à: **http://localhost:3000**

---

## 🗂️ Structure du Projet

```
war9a/
├── backend/
│   ├── models/
│   │   ├── User.js          # Utilisateurs + balance
│   │   ├── Deposit.js       # Dépôts avec hash screenshot
│   │   ├── Ticket.js        # Tickets de paris
│   │   ├── Purchase.js      # Achats tickets
│   │   └── Transaction.js   # Historique wallet
│   ├── routes/
│   │   ├── auth.js          # Register / Login
│   │   ├── users.js         # Profil, wallet, historique
│   │   ├── deposits.js      # Soumettre dépôt
│   │   ├── tickets.js       # Voir / acheter tickets
│   │   └── admin.js         # Panel admin complet
│   ├── middleware/
│   │   └── auth.js          # JWT middleware
│   ├── uploads/deposits/    # Captures d'écran (auto-créé)
│   ├── server.js
│   └── seed.js              # Créer admin initial
└── frontend/
    └── src/
        ├── pages/
        │   ├── Login.js
        │   ├── Register.js
        │   ├── Dashboard.js
        │   ├── Tickets.js
        │   ├── Deposit.js
        │   ├── Wallet.js
        │   └── admin/
        │       ├── AdminDashboard.js
        │       ├── AdminDeposits.js
        │       ├── AdminTickets.js
        │       └── AdminUsers.js
        ├── components/
        │   ├── Layout.js       # Sidebar utilisateur
        │   └── AdminLayout.js  # Sidebar admin
        ├── context/
        │   └── AuthContext.js
        └── api.js              # Axios instance
```

---

## 🔐 Sécurité des Dépôts

| Règle | Détail |
|-------|--------|
| Screenshot obligatoire | Refus si absent |
| Formats acceptés | JPG, JPEG, PNG uniquement |
| Taille max | 5 MB |
| Anti-doublon | Hash SHA-256 de l'image |
| Code Orange unique | Index unique MongoDB |
| Limite journalière | 3 dépôts par utilisateur/jour |
| Nommage sécurisé | Timestamp + 8 bytes aléatoires |

---

## 👤 Comptes par défaut

| Rôle | Téléphone | Mot de passe |
|------|-----------|--------------|
| Admin | 12345678 | admin123 |

> ⚠️ **Changer le mot de passe admin immédiatement en production!**

---

## 📡 API Endpoints

### Auth
```
POST /api/auth/register   — Inscription
POST /api/auth/login      — Connexion
```

### Utilisateur (auth required)
```
GET  /api/users/me             — Profil
GET  /api/users/transactions   — Historique
GET  /api/users/purchases      — Mes achats
GET  /api/tickets              — Liste tickets (info limitée avant achat)
POST /api/tickets/:id/purchase — Acheter ticket
POST /api/deposits             — Soumettre dépôt (multipart/form-data)
GET  /api/deposits/my          — Mes dépôts
```

### Admin (admin role required)
```
GET   /api/admin/stats               — Statistiques
GET   /api/admin/users               — Liste utilisateurs
PATCH /api/admin/users/:id/toggle    — Activer/désactiver
GET   /api/admin/deposits            — Tous les dépôts
PATCH /api/admin/deposits/:id/approve — Approuver + créditer
PATCH /api/admin/deposits/:id/reject  — Rejeter
GET   /api/admin/tickets             — Tous les tickets
POST  /api/admin/tickets             — Créer ticket
PUT   /api/admin/tickets/:id         — Modifier ticket
DELETE/api/admin/tickets/:id         — Supprimer ticket
```

---

## 🌍 Déploiement Production

### Variables d'environnement (backend)
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=secret_tres_long_min_32_chars
PORT=5000
FRONTEND_URL=https://war9a.tn
```

### Frontend
```bash
cd frontend
REACT_APP_API_URL=https://api.war9a.tn/api npm run build
```

Servir `frontend/build/` avec Nginx ou Vercel.

---

## ✅ Fonctionnalités

- [x] Inscription / Connexion JWT
- [x] Wallet avec historique des transactions
- [x] Système de dépôt avec validation stricte
- [x] Anti-doublon screenshots (SHA-256)
- [x] Limite 3 dépôts/jour
- [x] Panel admin complet
- [x] Approbation/rejet dépôts avec crédit automatique
- [x] CRUD tickets avec matchs dynamiques
- [x] Achat ticket avec débit solde
- [x] Info cachée avant achat (reveal après paiement)
- [x] Rate limiting global
- [x] Hachage mot de passe bcrypt
- [x] UI moderne dark theme
