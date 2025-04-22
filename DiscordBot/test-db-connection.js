const sql = require('mssql');
require('dotenv').config();

// Usar la configuración del .env
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

async function diagnoseFactionQuery() {
  console.log('Iniciando diagnóstico de consulta de facciones...');
  try {
    await sql.connect(dbConfig);
    
    // 1. Verificar jugadores online
    console.log('\n1. Verificando jugadores online...');
    const onlineResult = await sql.query`
      SELECT COUNT(*) AS OnlinePlayers
      FROM PS_GameData.dbo.Chars
      WHERE LoginStatus = 1
    `;
    console.log('   Jugadores online:', onlineResult.recordset[0].OnlinePlayers);
    
    if (onlineResult.recordset[0].OnlinePlayers === 0) {
      console.log('   ⚠️ No hay jugadores online según la tabla Chars.');
      console.log('   Esto podría explicar por qué no se cuentan jugadores por facción.');
    }
    
    // 2. Verificar tabla con Country
    console.log('\n2. Verificando tablas con columna Country...');
    const countryTables = await sql.query`
      SELECT t.name AS TableName, c.name AS ColumnName
      FROM PS_GameData.sys.tables t
      JOIN PS_GameData.sys.columns c ON t.object_id = c.object_id
      WHERE c.name = 'Country'
      ORDER BY t.name
    `;
    
    if (countryTables.recordset.length === 0) {
      console.error('   ❌ No se encontraron tablas con columna Country.');
      return;
    }
    
    console.log('   Tablas encontradas con columna Country:');
    countryTables.recordset.forEach(t => console.log(`   - ${t.TableName}`));
    
    for (const table of countryTables.recordset) {
      const targetTable = table.TableName;
      
      // 3. Verificar datos en la tabla con Country
      console.log(`\n3. Verificando datos en tabla ${targetTable}...`);
      const countryData = await sql.query(`
        SELECT Country, COUNT(*) AS Count
        FROM PS_GameData.dbo.[${targetTable}]
        GROUP BY Country
      `);
      
      if (countryData.recordset.length === 0) {
        console.log(`   ⚠️ No hay datos en la tabla ${targetTable} o todos los valores Country son NULL.`);
      } else {
        console.log(`   Distribución de valores Country en ${targetTable}:`);
        countryData.recordset.forEach(row => {
          console.log(`   - Country=${row.Country !== null ? row.Country : 'NULL'}: ${row.Count} registros`);
        });
      }
      
      // 4. Probar diferentes columnas para JOIN
      console.log(`\n4. Probando posibles columnas para JOIN entre Chars y ${targetTable}...`);
      
      // Obtener las columnas en Chars
      const charsColumns = await sql.query`
        SELECT name FROM PS_GameData.sys.columns
        WHERE object_id = OBJECT_ID('PS_GameData.dbo.Chars')
      `;
      
      // Obtener las columnas en la tabla con Country
      const targetColumns = await sql.query(`
        SELECT name FROM PS_GameData.sys.columns
        WHERE object_id = OBJECT_ID('PS_GameData.dbo.[${targetTable}]')
      `);
      
      // Crear conjuntos para comparación rápida
      const charsColumnsSet = new Set(charsColumns.recordset.map(c => c.name.toLowerCase()));
      const targetColumnsSet = new Set(targetColumns.recordset.map(c => c.name.toLowerCase()));
      
      // Encontrar columnas comunes
      const commonColumns = [];
      for (const col of charsColumnsSet) {
        if (targetColumnsSet.has(col)) {
          commonColumns.push(col);
        }
      }
      
      if (commonColumns.length === 0) {
        console.log(`   ❌ No se encontraron columnas comunes entre Chars y ${targetTable}.`);
      } else {
        console.log(`   Columnas comunes encontradas: ${commonColumns.join(', ')}`);
        
        // Probar JOINs con cada columna común
        for (const joinColumn of commonColumns) {
          console.log(`\n   Probando JOIN con columna "${joinColumn}"...`);
          try {
            const joinTest = await sql.query(`
              SELECT 
                SUM(CASE WHEN t.Country = 0 THEN 1 ELSE 0 END) AS LightPlayers,
                SUM(CASE WHEN t.Country = 1 THEN 1 ELSE 0 END) AS DarkPlayers
              FROM PS_GameData.dbo.Chars c
              JOIN PS_GameData.dbo.[${targetTable}] t ON c.[${joinColumn}] = t.[${joinColumn}]
              WHERE c.LoginStatus = 1
            `);
            
            console.log(`   ✅ JOIN exitoso con columna "${joinColumn}".`);
            console.log(`   - Luz (Country=0): ${joinTest.recordset[0].LightPlayers || 0}`);
            console.log(`   - Oscuridad (Country=1): ${joinTest.recordset[0].DarkPlayers || 0}`);
            
            // Si ambos son 0, investigar más
            if ((joinTest.recordset[0].LightPlayers || 0) === 0 && 
                (joinTest.recordset[0].DarkPlayers || 0) === 0) {
              
              // Verificar si hay filas que coincidan en el JOIN
              const joinRows = await sql.query(`
                SELECT COUNT(*) AS MatchCount
                FROM PS_GameData.dbo.Chars c
                JOIN PS_GameData.dbo.[${targetTable}] t ON c.[${joinColumn}] = t.[${joinColumn}]
              `);
              
              if (joinRows.recordset[0].MatchCount === 0) {
                console.log(`   ⚠️ No hay filas que coincidan en el JOIN con "${joinColumn}".`);
              } else {
                console.log(`   ⚠️ Hay ${joinRows.recordset[0].MatchCount} filas que coinciden en el JOIN,`);
                console.log(`      pero ninguna tiene LoginStatus = 1 o valores Country válidos.`);
                
                // Mostrar algunos ejemplos de registros para diagnóstico
                const sampleRows = await sql.query(`
                  SELECT TOP 5 c.CharID, c.CharName, c.LoginStatus, t.Country
                  FROM PS_GameData.dbo.Chars c
                  JOIN PS_GameData.dbo.[${targetTable}] t ON c.[${joinColumn}] = t.[${joinColumn}]
                `);
                
                console.log(`   Ejemplos de registros:`);
                sampleRows.recordset.forEach((row, i) => {
                  console.log(`   [${i+1}] CharID: ${row.CharID}, CharName: ${row.CharName}, LoginStatus: ${row.LoginStatus}, Country: ${row.Country}`);
                });
              }
            }
          } catch (err) {
            console.log(`   ❌ Error en JOIN con columna "${joinColumn}": ${err.message}`);
          }
        }
      }
      
      // 5. Si todo falló, intentar consulta sin JOIN
      console.log(`\n5. Verificando directamente en la tabla ${targetTable}...`);
      if (targetColumnsSet.has('loginstatus')) {
        try {
          const directQuery = await sql.query(`
            SELECT 
              SUM(CASE WHEN Country = 0 THEN 1 ELSE 0 END) AS LightPlayers,
              SUM(CASE WHEN Country = 1 THEN 1 ELSE 0 END) AS DarkPlayers
            FROM PS_GameData.dbo.[${targetTable}]
            WHERE LoginStatus = 1
          `);
          
          console.log(`   ✅ Consulta directa exitosa.`);
          console.log(`   - Luz (Country=0): ${directQuery.recordset[0].LightPlayers || 0}`);
          console.log(`   - Oscuridad (Country=1): ${directQuery.recordset[0].DarkPlayers || 0}`);
        } catch (err) {
          console.log(`   ❌ Error en consulta directa: ${err.message}`);
        }
      } else {
        console.log(`   ⚠️ La tabla ${targetTable} no tiene columna LoginStatus para consulta directa.`);
      }
    }
    
    console.log('\n✅ Diagnóstico completado.');
    
  } catch (err) {
    console.error('\n❌ ERROR EN EL DIAGNÓSTICO');
    console.error(err);
  } finally {
    try {
      await sql.close();
    } catch (err) {
      console.error('Error al cerrar la conexión:', err);
    }
  }
}

diagnoseFactionQuery();