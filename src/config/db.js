const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

// Instance Sequelize partagée par l'application
const sequelize = new Sequelize({
	dialect: 'sqlite',
	storage: 'kouak_database.sqlite',
	logging: false
});

// Définition des modèles
const User = sequelize.define('User', {
	username: {
		type: DataTypes.STRING,
		allowNull: false,
		unique: true
	},
	email: {
		type: DataTypes.STRING,
		allowNull: false,
		unique: true,
		validate: { isEmail: true }
	},
	password: {
		type: DataTypes.STRING,
		allowNull: false
	}
});

const Message = sequelize.define('Message', {
	content: {
		type: DataTypes.TEXT,
		allowNull: false
	},
	timestamp: {
		type: DataTypes.DATE,
		defaultValue: DataTypes.NOW
	}
});

// Associations entre les modèles
User.hasMany(Message);
Message.belongsTo(User);

// Synchronise la base et insère un message de bienvenue si nécessaire
async function initializeDatabase() {
	try {
		await sequelize.sync({ force: false });
		console.log('Base de données synchronisée');

		const messageCount = await Message.count();
		if (messageCount === 0) {
			const [systemUser] = await User.findOrCreate({
				where: { username: 'System' },
				defaults: {
					username: 'System',
					email: 'system@kouak.app',
					password: await bcrypt.hash('system', 10)
				}
			});

			await Message.create({
				content: 'Bienvenue dans Kouak ! Votre application de chat en temps réel est prête.',
				UserId: systemUser.id
			});

			console.log('Message de bienvenue ajouté');
		}
	} catch (error) {
		console.error('Erreur de synchronisation de la base de données:', error);
	}
}

module.exports = {
	sequelize,
	User,
	Message,
	initializeDatabase
};


