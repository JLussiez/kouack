// Gestion de l'état global côté client
let socket = null;
let currentUser = null;
let token = localStorage.getItem('kouak_token');

// Initialisation de l'application au chargement
document.addEventListener('DOMContentLoaded', function () {
	setTimeout(() => {
		document.getElementById('loading').classList.add('hidden');
		if (token) {
			initializeChat();
		} else {
			showLogin();
		}
	}, 1000);
});

// --- Authentification ---
function showLogin() {
	document.getElementById('loginScreen').classList.remove('hidden');
	document.getElementById('chatScreen').classList.add('hidden');
	document.getElementById('loginForm').classList.remove('hidden');
	document.getElementById('registerForm').classList.add('hidden');
	clearError();
}

function showRegister() {
	document.getElementById('loginForm').classList.add('hidden');
	document.getElementById('registerForm').classList.remove('hidden');
	clearError();
}

function clearError() {
	const errorDiv = document.getElementById('errorMessage');
	errorDiv.classList.add('hidden');
	errorDiv.textContent = '';
}

function showError(message) {
	const errorDiv = document.getElementById('errorMessage');
	errorDiv.textContent = message;
	errorDiv.classList.remove('hidden');
}

async function handleLogin() {
	const email = document.getElementById('loginEmail').value;
	const password = document.getElementById('loginPassword').value;
	if (!email || !password) {
		showError('Veuillez remplir tous les champs');
		return;
	}
	try {
		const response = await fetch('/api/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password })
		});
		const data = await response.json();
		if (response.ok) {
			token = data.token;
			currentUser = data.user;
			localStorage.setItem('kouak_token', token);
			initializeChat();
		} else {
			showError(data.error);
		}
	} catch (error) {
		showError('Erreur de connexion au serveur');
	}
}

async function handleRegister() {
	const username = document.getElementById('registerUsername').value;
	const email = document.getElementById('registerEmail').value;
	const password = document.getElementById('registerPassword').value;
	if (!username || !email || !password) {
		showError('Veuillez remplir tous les champs');
		return;
	}
	try {
		const response = await fetch('/api/register', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, email, password })
		});
		const data = await response.json();
		if (response.ok) {
			token = data.token;
			currentUser = data.user;
			localStorage.setItem('kouak_token', token);
			initializeChat();
		} else {
			showError(data.error);
		}
	} catch (error) {
		showError('Erreur de connexion au serveur');
	}
}

function handleLogout() {
	if (socket) {
		socket.disconnect();
	}
	localStorage.removeItem('kouak_token');
	token = null;
	currentUser = null;
	socket = null;
	showLogin();
}

// --- Chat ---
function initializeChat() {
	document.getElementById('loginScreen').classList.add('hidden');
	document.getElementById('chatScreen').classList.remove('hidden');
	if (currentUser) {
		document.getElementById('welcomeMessage').textContent = `Bienvenue, ${currentUser.username}`;
	}
	socket = io();
	socket.on('connect', () => {
		console.log('Connecté au serveur');
		socket.emit('authenticate', token);
	});
	socket.on('authenticated', () => {
		console.log('Authentification réussie');
		loadMessages();
	});
	socket.on('authentication_error', (error) => {
		console.error("Erreur d'authentification:", error);
		handleLogout();
	});
	socket.on('receive_message', (message) => {
		addMessageToChat(message);
	});
	socket.on('connected_users', (users) => {
		updateConnectedUsers(users);
	});
	socket.on('user_connected', (username) => {
		console.log(`${username} s'est connecté`);
	});
	socket.on('user_disconnected', (username) => {
		console.log(`${username} s'est déconnecté`);
	});
}

// Chargement des messages côté API REST
async function loadMessages() {
	try {
		const response = await fetch('/api/messages', {
			headers: { Authorization: `Bearer ${token}` }
		});
		if (response.ok) {
			const messages = await response.json();
			messages.forEach((message) => addMessageToChat(message, false));
			scrollToBottom();
		}
	} catch (error) {
		console.error('Erreur lors du chargement des messages:', error);
	}
}

// Utilitaires UI
function handleKeyPress(event) {
	if (event.key === 'Enter') {
		sendMessage();
	}
}

function sendMessage() {
	const input = document.getElementById('messageInput');
	const message = input.value.trim();
	if (message && socket) {
		socket.emit('send_message', { content: message });
		input.value = '';
	}
}

function addMessageToChat(message, animate = true) {
	const container = document.getElementById('messagesContainer');
	const messageDiv = document.createElement('div');
	const isOwnMessage = currentUser && message.User?.username === currentUser.username;
	messageDiv.className = `flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${animate ? 'fade-in' : ''}`;
	const time = new Date(message.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
	messageDiv.innerHTML = `
				<div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
					isOwnMessage ? 'bg-blue-500 text-white' : 'bg-white text-gray-800 shadow'
				}">
					${!isOwnMessage ? `<p class="text-sm font-semibold mb-1 text-gray-600">${message.User?.username}</p>` : ''}
					<p>${message.content}</p>
					<p class="text-xs mt-1 ${isOwnMessage ? 'text-blue-200' : 'text-gray-500'}">${time}</p>
				</div>
			`;
	container.appendChild(messageDiv);
	scrollToBottom();
}

function scrollToBottom() {
	const container = document.getElementById('messagesContainer');
	container.scrollTop = container.scrollHeight;
}

function updateConnectedUsers(users) {
	const container = document.getElementById('connectedUsers');
	const countSpan = document.getElementById('userCount');
	countSpan.textContent = `(${users.length})`;
	container.innerHTML = '';
	users.forEach((user) => {
		const userDiv = document.createElement('div');
		userDiv.className = 'flex items-center space-x-2 p-2 rounded-lg bg-gray-50 fade-in';
		userDiv.innerHTML = `
					<div class="w-2 h-2 bg-green-500 rounded-full pulse-dot"></div>
					<span class="text-gray-700">${user.username}</span>
				`;
		container.appendChild(userDiv);
	});
}


