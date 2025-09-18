const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const messagesRoutes = require('./routes/messages.routes');

// Création de l'application Express
const app = express();

// Middlewares globaux
// - CORS pour autoriser les requêtes cross-origin côté client
// - express.json pour parser le JSON des requêtes
// - static pour servir les fichiers du dossier public (index.html, app.css, app.js)
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Montage des routes API
// Regroupe les routes d'authentification sous /api
app.use('/api', authRoutes); // /api/register, /api/login
// Routes pour la ressource messages, protégées par JWT au niveau du routeur
app.use('/api/messages', messagesRoutes);

// Catch-all pour l'application front (SPA)
app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

module.exports = app;


