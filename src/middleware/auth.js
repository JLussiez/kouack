const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

// Middleware d'authentification JWT pour les routes protégées
function authenticateToken(req, res, next) {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) {
		return res.status(401).json({ error: 'Token manquant' });
	}

	jwt.verify(token, JWT_SECRET, (err, user) => {
		if (err) {
			return res.status(403).json({ error: 'Token invalide' });
		}
		req.user = user; // payload minimal: { id, username }
		next();
	});
}

module.exports = { authenticateToken };


