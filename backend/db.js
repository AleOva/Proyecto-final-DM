const sql = require('mssql');

const config = {
  user: 'sa',
  password: 'DesarrolloProyecto123',
  server: '127.0.0.1', 
  port: 1433,
  database: 'db_perfiles_app',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('¡Conectado exitosamente a SQL Server!');
    return pool;
  })
  .catch(err => console.log('Error de conexión a Database: ', err));

module.exports = {
  sql,
  poolPromise
};