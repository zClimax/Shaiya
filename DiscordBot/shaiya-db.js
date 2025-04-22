// Importar el módulo para SQL Server (usado comúnmente en servidores Shaiya)
const sql = require('mssql');
require('dotenv').config();

// Configuración de la conexión a la base de datos
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    trustServerCertificate: true, // Cambiar según tu configuración de seguridad
    enableArithAbort: true
  }
};

// Variable para controlar pool de conexiones
let pool = null;

// Función para obtener una conexión a la base de datos
async function getConnection() {
  if (!pool) {
    pool = await new sql.ConnectionPool(dbConfig).connect();
    console.log('Nuevo pool de conexión creado');
  }
  return pool;
}

// Función para obtener el número de jugadores conectados
async function getOnlinePlayers() {
  try {
    // Usar el pool de conexión en lugar de conectar/desconectar cada vez
    const pool = await getConnection();
    
    // Ejecutar consulta para contar jugadores online
    // Añadir OPTION (RECOMPILE) para evitar caché de plan de ejecución
    const result = await pool.request().query(`
      SELECT COUNT(*) AS OnlinePlayers
      FROM PS_GameData.dbo.Chars WITH (NOLOCK)
      WHERE LoginStatus = 1
      OPTION (RECOMPILE)
    `);
    
    // Devolver el número de jugadores online
    return result.recordset[0].OnlinePlayers;
  } catch (err) {
    console.error('Error al consultar la base de datos:', err);
    
    // Cerrar el pool en caso de error grave para forzar reconexión
    if (pool) {
      try {
        await pool.close();
        pool = null;
      } catch (closeErr) {
        console.error('Error al cerrar el pool de conexión:', closeErr);
      }
    }
    
    // Devolver 0 si hay un error
    return 0;
  }
}

// Función para obtener estadísticas adicionales del servidor
async function getServerStats() {
  try {
    // Usar el pool de conexión
    const pool = await getConnection();
    
    // Consulta para obtener recuentos de facciones (solo jugadores online)
    const factionQuery = `
      SELECT 
        SUM(CASE WHEN u.Country = 0 THEN 1 ELSE 0 END) AS LightPlayers,
        SUM(CASE WHEN u.Country = 1 THEN 1 ELSE 0 END) AS DarkPlayers
      FROM PS_GameData.dbo.Chars c WITH (NOLOCK)
      JOIN PS_GameData.dbo.UserMaxGrow u WITH (NOLOCK) ON c.UserUID = u.UserUID
      WHERE c.LoginStatus = 1
      OPTION (RECOMPILE)
    `;
    
    const factionResult = await pool.request().query(factionQuery);
    
    // Consulta para contar cuentas totales
    const accountsQuery = `
      SELECT COUNT(*) AS TotalAccounts
      FROM PS_UserData.dbo.Users_Master WITH (NOLOCK)
      OPTION (RECOMPILE)
    `;
    
    const accountsResult = await pool.request().query(accountsQuery);
    
    // Consulta para contar personajes totales
    const charsQuery = `
      SELECT COUNT(*) AS TotalChars
      FROM PS_GameData.dbo.Chars WITH (NOLOCK)
      OPTION (RECOMPILE)
    `;
    
    const charsResult = await pool.request().query(charsQuery);
    
    // Registrar resultados para diagnóstico
    console.log(`[${new Date().toISOString()}] Consulta de estadísticas completada:`, {
      light: factionResult.recordset[0].LightPlayers || 0,
      dark: factionResult.recordset[0].DarkPlayers || 0,
      totalAccounts: accountsResult.recordset[0].TotalAccounts,
      totalChars: charsResult.recordset[0].TotalChars
    });
    
    return {
      factions: {
        light: factionResult.recordset[0].LightPlayers || 0,
        dark: factionResult.recordset[0].DarkPlayers || 0
      },
      totalAccounts: accountsResult.recordset[0].TotalAccounts,
      totalChars: charsResult.recordset[0].TotalChars
    };
  } catch (err) {
    console.error('Error al obtener estadísticas del servidor:', err);
    
    // Cerrar el pool en caso de error grave
    if (pool) {
      try {
        await pool.close();
        pool = null;
      } catch (closeErr) {
        console.error('Error al cerrar el pool de conexión:', closeErr);
      }
    }
    
    return {
      factions: { light: 0, dark: 0 },
      totalAccounts: 0,
      totalChars: 0
    };
  }
}

module.exports = {
  getOnlinePlayers,
  getServerStats
};