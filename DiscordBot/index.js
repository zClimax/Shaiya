// Importar dependencias
const { Client, GatewayIntentBits, ActivityType, EmbedBuilder } = require('discord.js');
const net = require('net');
require('dotenv').config();

// Importar el módulo de conexión a la base de datos
const shaiyaDB = require('./shaiya-db');

// Configurar cliente de Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Variables de configuración desde .env
const TOKEN = process.env.DISCORD_TOKEN;
const SHAIYA_IP = process.env.SHAIYA_SERVER_IP;
const SHAIYA_PORT = parseInt(process.env.SHAIYA_SERVER_PORT);
const UPDATE_INTERVAL = parseInt(process.env.UPDATE_INTERVAL); // Intervalo en milisegundos
const CHANNEL_ID = process.env.CHANNEL_ID;

// Variables para almacenar información del servidor
let serverStatus = 'Offline';
let onlinePlayers = 0;
let lastUpdate = null;

// Función para comprobar el estado del servidor Shaiya
async function checkServerStatus() {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isOnline = false;
    
    // Configurar timeout para la conexión
    socket.setTimeout(5000);
    
    socket.on('connect', () => {
      isOnline = true;
      socket.end();
    });
    
    socket.on('timeout', () => {
      socket.destroy();
    });
    
    socket.on('error', () => {
      // Error de conexión, servidor posiblemente offline
    });
    
    socket.on('close', () => {
      resolve(isOnline);
    });
    
    // Intentar conectar al servidor
    socket.connect(SHAIYA_PORT, SHAIYA_IP);
  });
}

// Función para obtener el número de jugadores
async function getPlayerCount() {
  try {
    // Usar la función del módulo de base de datos
    return await shaiyaDB.getOnlinePlayers();
  } catch (error) {
    console.error('Error al obtener el recuento de jugadores:', error);
    return 0;
  }
}

// Función para actualizar el estado del bot
async function updateStatus() {
  try {
    // Comprobar si el servidor está online
    const isOnline = await checkServerStatus();
    serverStatus = isOnline ? 'Online' : 'Offline';
    
    // Si está online, obtener recuento de jugadores
    if (isOnline) {
      onlinePlayers = await getPlayerCount();
    } else {
      onlinePlayers = 0;
    }
    
    // Actualizar actividad del bot en Discord
    client.user.setActivity({
      name: `Shaiya | ${onlinePlayers} jugadores online`,
      type: ActivityType.Playing
    });
    
    // Registrar la hora de la última actualización
    lastUpdate = new Date();
    
    // Enviar actualización al canal de Discord si está configurado
    if (CHANNEL_ID) {
      const channel = client.channels.cache.get(CHANNEL_ID);
      if (channel) {
        const statusEmbed = new EmbedBuilder()
          .setColor(isOnline ? '#00FF00' : '#FF0000')
          .setTitle('Estado del Servidor Shaiya')
          .addFields(
            { name: 'Estado', value: serverStatus, inline: true },
            { name: 'Jugadores Online', value: `${onlinePlayers}`, inline: true }
          )
          .setTimestamp()
          .setFooter({ text: 'Última actualización' });
        
        channel.send({ embeds: [statusEmbed] });
      }
    }
    
    console.log(`[${new Date().toISOString()}] Estado actualizado: ${serverStatus}, Jugadores: ${onlinePlayers}`);
  } catch (error) {
    console.error('Error al actualizar el estado:', error);
  }
}

// Eventos del cliente de Discord
client.once('ready', () => {
  console.log(`Bot conectado como ${client.user.tag}`);
  
  // Realizar la primera actualización de estado
  updateStatus();
  
  // Configurar actualizaciones periódicas
  setInterval(updateStatus, UPDATE_INTERVAL);
});

// Manejar comandos básicos
client.on('messageCreate', async (message) => {
  // Ignorar mensajes de bots para evitar bucles
  if (message.author.bot) return;
  
  // Comando para verificar el estado del servidor
  if (message.content === '!shaiya') {
    // Indicar que el bot está escribiendo
    message.channel.sendTyping();
    
    let serverStats = null;
    if (serverStatus === 'Online') {
      try {
        // Obtener estadísticas adicionales si el servidor está online
        serverStats = await shaiyaDB.getServerStats();
      } catch (error) {
        console.error('Error al obtener estadísticas:', error);
      }
    }
    
    const embed = new EmbedBuilder()
      .setColor(serverStatus === 'Online' ? '#00FF00' : '#FF0000')
      .setTitle('Estado del Servidor Shaiya')
      .addFields(
        { name: 'Estado', value: serverStatus, inline: true },
        { name: 'Jugadores Online', value: `${onlinePlayers}`, inline: true }
      )
      .setTimestamp(lastUpdate)
      .setFooter({ text: 'Última actualización' });
    
    // Añadir campos adicionales si hay estadísticas disponibles
    if (serverStats) {
      embed.addFields(
        { name: 'Facción Luz', value: `${serverStats.factions.light}`, inline: true },
        { name: 'Facción Oscura', value: `${serverStats.factions.dark}`, inline: true },
        { name: '\u200B', value: '\u200B', inline: true }, // Espacio en blanco para alineación
        { name: 'Cuentas Totales', value: `${serverStats.totalAccounts}`, inline: true },
        { name: 'Personajes Totales', value: `${serverStats.totalChars}`, inline: true }
      );
    }
    
    message.reply({ embeds: [embed] });
  }
});

// Conectar el bot a Discord
client.login(TOKEN);