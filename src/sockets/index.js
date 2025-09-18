const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const { Message, User } = require('../config/db');

// Configure les événements Socket.io pour la messagerie en temps réel
function setupSocketIo(io) {
	const connectedUsers = new Map();

	io.on('connection', (socket) => {
		console.log('Nouvel utilisateur connecté:', socket.id);

		// Authentifie un client Socket.io via un token JWT
		socket.on('authenticate', (token) => {
			try {
				const decoded = jwt.verify(token, JWT_SECRET);
				socket.userId = decoded.id;
				socket.username = decoded.username;

				connectedUsers.set(socket.id, { id: decoded.id, username: decoded.username });
				socket.broadcast.emit('user_connected', decoded.username);
				io.emit('connected_users', Array.from(connectedUsers.values()));
				socket.emit('authenticated', { success: true });
			} catch (error) {
				console.error("Erreur d'authentification socket:", error);
				socket.emit('authentication_error', 'Token invalide');
			}
		});

		// Réception d'un message à diffuser à tous les clients
		socket.on('send_message', async (data) => {
			try {
				if (!socket.userId) {
					socket.emit('error', 'Utilisateur non authentifié');
					return;
				}
				if (!data.content || !data.content.trim()) {
					socket.emit('error', 'Message vide');
					return;
				}

				const message = await Message.create({ content: data.content.trim(), UserId: socket.userId });
				const messageWithUser = await Message.findByPk(message.id, {
					include: [{ model: User, attributes: ['username'] }]
				});

				io.emit('receive_message', {
					id: messageWithUser.id,
					content: messageWithUser.content,
					timestamp: messageWithUser.timestamp,
					User: { username: messageWithUser.User.username }
				});
			} catch (error) {
				console.error("Erreur lors de l'envoi du message:", error);
				socket.emit('error', "Erreur lors de l'envoi du message");
			}
		});

		socket.on('disconnect', () => {
			const user = connectedUsers.get(socket.id);
			if (user) {
				connectedUsers.delete(socket.id);
				socket.broadcast.emit('user_disconnected', user.username);
				io.emit('connected_users', Array.from(connectedUsers.values()));
			}
		});
	});
}

module.exports = { setupSocketIo };


