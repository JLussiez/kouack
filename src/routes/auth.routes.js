const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../config/db');
const { Op } = require('sequelize');
const { JWT_SECRET } = require('../config/env');

const router = express.Router();

// Inscription d'un nouvel utilisateur
router.post('/register', async (req, res) => {
	try {
		const { username, email, password } = req.body;
		if (!username || !email || !password) {
			return res.status(400).json({ error: 'Tous les champs sont requis' });
		}

		const existingUser = await User.findOne({
			where: {
				[Op.or]: [{ email }, { username }]
			}
		});
		if (existingUser) {
			return res.status(400).json({ error: 'Utilisateur ou email déjà existant' });
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const user = await User.create({ username, email, password: hashedPassword });

		const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
		res.status(201).json({
			message: 'Utilisateur créé avec succès',
			token,
			user: { id: user.id, username: user.username, email: user.email }
		});
	} catch (error) {
		console.error("Erreur lors de l'inscription:", error);
		res.status(500).json({ error: 'Erreur interne du serveur' });
	}
});

// Connexion d'un utilisateur existant
router.post('/login', async (req, res) => {
	try {
		const { email, password } = req.body;
		if (!email || !password) {
			return res.status(400).json({ error: 'Email et mot de passe requis' });
		}

		const user = await User.findOne({ where: { email } });
		if (!user) {
			return res.status(400).json({ error: 'Email ou mot de passe incorrect' });
		}

		const isValidPassword = await bcrypt.compare(password, user.password);
		if (!isValidPassword) {
			return res.status(400).json({ error: 'Email ou mot de passe incorrect' });
		}

		const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
		res.json({
			message: 'Connexion réussie',
			token,
			user: { id: user.id, username: user.username, email: user.email }
		});
	} catch (error) {
		console.error('Erreur lors de la connexion:', error);
		res.status(500).json({ error: 'Erreur interne du serveur' });
	}
});

module.exports = router;


