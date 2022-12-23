// @ts-check
const express = require('express');

const router = express.Router();
const mysql = require('mysql');
const getTotal = require('./log').getTotal;

const connection = mysql.createConnection({
  host: 'localhost',
  user: process.env.SQL_USER,
  password: process.env.SQL_PW,
  port: '3306',
  database: 'alllast',
  multipleStatements: true,
});

connection.connect();

router.get('/', (req, res) => {
  connection.query(
    'SELECT *, DATE_FORMAT(date, "%Y-%m-%d") AS date FROM game WHERE secret = 0 ORDER BY date DESC, place, reg_date DESC;',
    (err, data) => {
      if (err) throw err;

      let total = [];

      for (let i = 0; i < data.length; i++) {
        total.push(
          getTotal(
            (data[i].score_1 - 30000) / 1000,
            (data[i].score_2 - 30000) / 1000,
            (data[i].score_3 - 30000) / 1000,
            (data[i].score_4 - 30000) / 1000
          )
        );
      }
      res.render('home', { data, total });
    }
  );
});

module.exports = router;
