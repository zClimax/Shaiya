// kill-feed.js
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const sql = require('mssql');
require('dotenv').config();

// Configuración Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

// Configuración DB
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

// ID del canal para kill feed
const KILL_FEED_CHANNEL = process.env.KILL_FEED_CHANNEL_ID;
const CHECK_INTERVAL = 5000; // Cada 5 segundos

// Conjunto para rastrear kills procesadas
const processedKills = new Set();
// Cantidad de kills a consultar en cada ciclo
const KILLS_TO_CHECK = 30;

// Pool de conexión
let pool = null;

// Inicializar pool de conexión
async function initPool() {
  try {
    pool = await new sql.ConnectionPool(dbConfig).connect();
    console.log("Pool de conexión inicializado con éxito");
  } catch (err) {
    console.error("Error al inicializar pool de conexión:", err);
  }
}

// Verificar nuevas kills
async function checkForNewKills() {
  if (!pool) {
    console.log("Esperando inicialización del pool...");
    return;
  }

  try {
    console.log("Buscando nuevas kills...");
    
    // Consulta para obtener las últimas N kills
    const killsQuery = `
      SELECT TOP ${KILLS_TO_CHECK}
        CharName AS KillerName, 
        Text1 AS VictimName,
        MapID,
        ActionTime AS KillTime
      FROM 
        [PS_GameLog].[dbo].[ActionLog] WITH (NOLOCK)
      WHERE 
        ActionType = 103
      ORDER BY 
        ActionTime DESC
    `;
    
    const result = await pool.request().query(killsQuery);
    
    console.log(`Query ejecutada. Resultados encontrados: ${result.recordset.length}`);
    
    // Almacenar nuevas kills encontradas
    const newKills = [];
    
    // Verificar cuáles son nuevas
    for (const kill of result.recordset) {
      // Crear un ID único para esta kill
      const killId = `${kill.KillerName}_${kill.VictimName}_${new Date(kill.KillTime).getTime()}`;
      
      // Procesar solo si es nueva
      if (!processedKills.has(killId)) {
        processedKills.add(killId);
        newKills.push(kill);
        console.log(`Nueva kill encontrada: ${kill.KillerName} mató a ${kill.VictimName}`);
      }
    }
    
    // Verificar si hay nuevas kills
    if (newKills.length > 0) {
      console.log(`${newKills.length} nuevas kills encontradas. Enviando notificaciones...`);
      
      // Ordenar por tiempo: primero las más antiguas, últimas las más recientes
      newKills.sort((a, b) => new Date(a.KillTime) - new Date(b.KillTime));
      
      // Enviar notificaciones en orden
      for (const kill of newKills) {
        await sendKillNotification(kill);
      }
    }
    
    // Limitar tamaño del conjunto de kills procesadas
    if (processedKills.size > 1000) {
      console.log(`Limpiando caché de kills procesadas...`);
      const toRemove = [...processedKills].slice(0, processedKills.size - 500);
      for (const item of toRemove) {
        processedKills.delete(item);
      }
    }
  } catch (err) {
    console.error('Error al verificar nuevas kills:', err);
  }
}

// Inicializar el conjunto de kills procesadas
async function initProcessedKills() {
  if (!pool) return;
  
  try {
    console.log("Inicializando conjunto de kills procesadas...");
    
    // Obtener las kills recientes para evitar notificaciones duplicadas al reiniciar
    const initialQuery = `
      SELECT TOP 300
        CharName AS KillerName, 
        Text1 AS VictimName,
        ActionTime AS KillTime
      FROM 
        [PS_GameLog].[dbo].[ActionLog] WITH (NOLOCK)
      WHERE 
        ActionType = 103
      ORDER BY 
        ActionTime DESC
    `;
    
    const result = await pool.request().query(initialQuery);
    
    for (const kill of result.recordset) {
      const killId = `${kill.KillerName}_${kill.VictimName}_${new Date(kill.KillTime).getTime()}`;
      processedKills.add(killId);
    }
    
    console.log(`Conjunto inicializado con ${processedKills.size} kills históricas para evitar duplicados`);
  } catch (err) {
    console.error('Error al inicializar conjunto de kills:', err);
  }
}

// Enviar notificación al canal
async function sendKillNotification(kill) {
  const channel = client.channels.cache.get(KILL_FEED_CHANNEL);
  if (!channel) {
    console.error(`Canal no encontrado: ${KILL_FEED_CHANNEL}`);
    return;
  }
  
  console.log(`Enviando notificación para: ${kill.KillerName} mató a ${kill.VictimName} en ${formatDate(kill.KillTime)}`);
  
  // Determinar color según mapa o aleatoriamente para variedad
  const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'];
  const colorIndex = Math.floor(Math.abs(hashCode(kill.KillerName)) % colors.length);
  
  const embed = new EmbedBuilder()
    .setColor(colors[colorIndex])
    .setTitle('⚔️ PK Alert')
    .setDescription(`**${kill.KillerName}** ha asesinado a **${kill.VictimName}**`)
    .addFields(
      { name: 'Asesino', value: kill.KillerName, inline: true },
      { name: 'Víctima', value: kill.VictimName, inline: true },
      { name: 'Mapa', value: getMapName(kill.MapID), inline: true },
      { name: 'Hora', value: formatDate(kill.KillTime), inline: true }
    )
    .setTimestamp();
  
  try {
    await channel.send({ embeds: [embed] });
    console.log(`Notificación enviada al canal ${KILL_FEED_CHANNEL}`);
  } catch (err) {
    console.error('Error al enviar notificación:', err);
  }
}

// Función simple de hash para generar índices de color
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash; // Convertir a entero de 32 bits
  }
  return hash;
}

// Función para obtener nombre del mapa según ID
function getMapName(mapId) {
  const maps = {
    1: 'Map 1 Light',
    2: 'Map 2 Fury',
    3: 'D1',
    4: 'Cantabo',
    11:'Kimu Room',
    35:'Apulune',
    36:'Iris',
    41:'Prison',
    45:'Desierto 1',
    47: 'Jungla',
    58:'Sera Room',
    69: 'Exiel Room',

    // Añadir más mapas según necesidad
  };
  
  return maps[mapId] || `Mapa ${mapId}`;
}

// Formatear fecha
function formatDate(date) {
  return new Date(date).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// Evento de inicio de Discord
client.once('ready', async () => {
  console.log(`Bot de Kill Feed conectado como ${client.user.tag}`);
  console.log(`La hora actual del sistema es: ${new Date().toISOString()}`);
  
  // Inicializar pool
  await initPool();
  
  // Inicializar conjunto de kills procesadas
  await initProcessedKills();
  
  // Primera verificación con retraso para asegurar inicialización completa
  setTimeout(checkForNewKills, 3000);
  
  // Iniciar verificación periódica
  setInterval(checkForNewKills, CHECK_INTERVAL);
});

// Manejo de errores no controlados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Iniciar el bot
client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log("Login de Discord exitoso"))
  .catch(err => console.error("Error al iniciar sesión en Discord:", err));