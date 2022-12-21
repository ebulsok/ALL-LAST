// @ts-check
const express = require('express');

const router = express.Router();
const mysql = require('mysql');
const isSignin = require('./signin').isSignin;

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
  if (req.session.signin) res.render('log');
  else res.redirect('/signin');
});

router.get('/new', (req, res) => {
  if (req.session.signin) res.render('record');
  else res.redirect('/signin');
});

router.post('/new', (req, res) => {
  const d = req.body;
  console.log(d);
  let secret = 0;
  if (d.secret === 'on') secret = 1;

  connection.query(
    `INSERT INTO game (date, place, player_1, player_2, player_3, player_4, score_1, score_2, score_3, score_4, memo, secret) VALUES ('${
      d.date
    }', '${d.place}', '${d.player1}', '${d.player2}', '${d.player3}', '${
      d.player4
    }', ${Number(d.score1)}, ${Number(d.score2)}, ${Number(d.score3)}, ${Number(
      d.score4
    )}, '${d.memo}', ${secret});`,
    (err) => {
      if (err) throw err;
      else res.status(201).redirect('/log');
    }
  );
});

router.post('/new/search', (req, res) => {
  const info = req.body;
  connection.query(
    `SELECT user_name FROM user WHERE user_name = '${info.name}';`,
    (err, data) => {
      if (err) throw err;

      if (data.length === 0) res.json({ result: false });
      else res.json({ result: true });
    }
  );
});

module.exports = router;
