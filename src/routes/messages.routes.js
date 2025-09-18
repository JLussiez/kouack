const express = require('express');
const { Message, User } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Liste des derniers messages (protégé par JWT)
router.get('/', authenticateToken, async (req, res) => {
	try {
		const messages = await Message.findAll({
			include: [{ model: User, attributes: ['username'] }],
			order: [['timestamp', 'ASC']],
			limit: 100
		});
		res.json(messages);
	} catch (error) {
		console.error('Erreur lors de la récupération des messages:', error);
		res.status(500).json({ error: 'Erreur interne du serveur' });
	}
});

// Création d'un nouveau message (protégé par JWT)
router.post('/', authenticateToken, async (req, res) => {
	try {
		const { content } = req.body;
		if (!content || !content.trim()) {
			return res.status(400).json({ error: 'Le contenu du message est requis' });
		}

		const message = await Message.create({ content: content.trim(), UserId: req.user.id });
		const messageWithUser = await Message.findByPk(message.id, {
			include: [{ model: User, attributes: ['username'] }]
		});
		res.status(201).json(messageWithUser);
	} catch (error) {
		console.error('Erreur lors de la création du message:', error);
		res.status(500).json({ error: 'Erreur interne du serveur' });
	}
});

module.exports = router;


