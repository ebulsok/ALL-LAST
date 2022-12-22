// @ts-check
const express = require('express');

const router = express.Router();
const mysql = require('mysql');

const connection = mysql.createConnection({
  host: 'localhost',
  user: process.env.SQL_USER,
  password: process.env.SQL_PW,
  port: '3306',
  database: 'alllast',
  multipleStatements: true,
});

connection.connect();

function getTotal(s1, s2, s3, s4) {
  let obj = {};
  if (s1 === s2) {
    obj.total_1 = s1 + 25;
    obj.total_2 = s2 + 25;
    obj.total_3 = s3 - 10;
    obj.total_4 = s4 - 20;
  } else if (s2 === s3) {
    obj.total_1 = s1 + 40;
    obj.total_2 = s2;
    obj.total_3 = s3;
    obj.total_4 = s4 - 20;
  } else if (s3 === s4) {
    obj.total_1 = s1 + 40;
    obj.total_2 = s2 + 10;
    obj.total_3 = s3 - 15;
    obj.total_4 = s4 - 15;
  } else {
    obj.total_1 = s1 + 40;
    obj.total_2 = s2 + 10;
    obj.total_3 = s3 - 10;
    obj.total_4 = s4 - 20;
  }
  return obj;
}

router.get('/', (req, res) => {
  if (!req.session.userName) res.redirect('/signin');
  else {
    const name = req.session.userName;
    connection.query(
      `SELECT *, DATE_FORMAT(date, '%Y/%m/%d') AS date FROM game WHERE player_1 = '${name}' OR player_2 = '${name}' OR player_3 = '${name}' OR player_4 = '${name}';`,
      (err, data) => {
        if (err) throw err;
        else {
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
          res.status(200).render('log', { data, total });
        }
      }
    );
  }
});

router.get('/new', (req, res) => {
  if (req.session.userID) res.render('record');
  else res.redirect('/signin');
});

router.post('/new', (req, res) => {
  const d = req.body;
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
