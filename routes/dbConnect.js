const mysql = require('mysql');

const connection = mysql.createConnection({
  host: process.env.SQL_HOST,
  user: process.env.SQL_USER,
  password: process.env.SQL_PW,
  port: process.env.SQL_PORT,
  database: 'alllast',
  multipleStatements: true,
});
connection.connect();

module.exports = connection;
