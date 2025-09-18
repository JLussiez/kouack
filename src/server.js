const http = require('http');
const socketIo = require('socket.io');

const app = require('./app');
const { PORT } = require('./config/env');
const { setupSocketIo } = require('./sockets');
const { initializeDatabase } = require('./config/db');

// Crée le serveur HTTP à partir de l'app Express
const server = http.createServer(app);

// Initialise Socket.io (CORS ouvert pour le front statique)
const io = socketIo(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

// Branche les événements temps réel
setupSocketIo(io);

// Démarre le serveur et initialise la base
server.listen(PORT, () => {
	console.log(`🚀 Serveur Kouak démarré sur le port ${PORT}`);
	console.log(`📱 Application accessible sur: http://localhost:${PORT}`);
	initializeDatabase();
});


