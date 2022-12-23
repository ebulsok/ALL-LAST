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

const places = ['온라인', '마작카페', '마이티마장'];

function getTotal(s1, s2, s3, s4) {
  // 우마 계산
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

// log
router.get('/', (req, res) => {
  const name = req.session.userName;

  if (!name) res.redirect('/signin');
  else {
    const getGame = `SELECT *, DATE_FORMAT(date, '%Y/%m/%d') AS date FROM game WHERE player_1 = '${name}' OR player_2 = '${name}' OR player_3 = '${name}' OR player_4 = '${name}';`;
    const getStar = `SELECT game_id FROM star WHERE user_id = '${req.session.userID}';`;
    connection.query(getGame + getStar, (err, data) => {
      if (err) throw err;
      else {
        const games = data[0];
        const stars = data[1];
        let total = [];

        for (let i = 0; i < games.length; i++) {
          total.push(
            getTotal(
              (games[i].score_1 - 30000) / 1000,
              (games[i].score_2 - 30000) / 1000,
              (games[i].score_3 - 30000) / 1000,
              (games[i].score_4 - 30000) / 1000
            )
          );
        }
        res.status(200).render('log', { games, total, stars });
      }
    });
  }
});

// 로그 작성
router.get('/new', (req, res) => {
  if (!req.session.userID) res.redirect('/signin');
  else res.render('newLog', { places });
});
router.post('/new', (req, res) => {
  const d = req.body;
  let secret = 0;
  if (d.secret === 'on') secret = 1;

  connection.query(
    `INSERT INTO game (date, place, player_1, player_2, player_3, player_4, score_1, score_2, score_3, score_4, secret, reg_date) VALUES ('${
      d.date
    }', '${d.place}', '${d.player1}', '${d.player2}', '${d.player3}', '${
      d.player4
    }', ${Number(d.score1)}, ${Number(d.score2)}, ${Number(d.score3)}, ${Number(
      d.score4
    )}, ${secret}, now());`,
    (err) => {
      if (err) throw err;
      else res.status(201).redirect('/log');
    }
  );
});

// 유저 검색
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

// 로그 수정
router.get('/:game_id/edit', (req, res) => {
  if (!req.session.userID) res.redirect('/signin');
  else {
    connection.query(
      `SELECT *, DATE_FORMAT(date, '%Y-%m-%d') AS date FROM game WHERE game_id = ${req.params.game_id};`,
      (err, data) => {
        if (err) throw err;
        res.render('editLog', { data, places });
      }
    );
  }
});
router.post('/:game_id/edit', (req, res) => {
  const d = req.body;
  let secret = 0;
  if (d.secret === 'on') secret = 1;

  connection.query(
    `UPDATE game SET date = '${d.date}', place = '${d.place}', player_1 = '${
      d.player1
    }', player_2 = '${d.player2}', player_3 = '${d.player3}', player_4 = '${
      d.player4
    }', score_1 = ${Number(d.score1)}, score_2 = ${Number(
      d.score2
    )}, score_3 = ${Number(d.score3)}, score_4 = ${Number(
      d.score4
    )}, secret = ${secret} WHERE game_id = ${req.params.game_id};`,
    (err) => {
      if (err) throw err;
      else res.status(201).redirect('/log');
    }
  );
});

// 로그 삭제
router.delete('/:game_id/delete', (req, res) => {
  connection.query(
    `DELETE FROM game WHERE game_id = '${req.params.game_id}';`,
    (err) => {
      if (err) throw err;
      else res.status(200).redirect('/log');
    }
  );
});

// 즐겨찾기 목록
router.get('/star', (req, res) => {
  const id = req.session.userID;

  if (!id) res.redirect('/signin');
  else {
    connection.query(
      `SELECT s.star_id, s.memo, g.*, DATE_FORMAT(g.date, '%Y/%m/%d') AS date FROM star AS s JOIN game AS g ON s.game_id = g.game_id WHERE user_id = '${id}';`,
      (err, games) => {
        if (err) throw err;
        else {
          let total = [];

          for (let i = 0; i < games.length; i++) {
            total.push(
              getTotal(
                (games[i].score_1 - 30000) / 1000,
                (games[i].score_2 - 30000) / 1000,
                (games[i].score_3 - 30000) / 1000,
                (games[i].score_4 - 30000) / 1000
              )
            );
          }
          res.status(200).render('star', { games, total });
        }
      }
    );
  }
});

// 즐겨찾기 추가
router.post('/star', (req, res) => {
  const info = req.body;

  connection.query(
    `INSERT INTO star (game_id, user_id, memo) VALUES (${info.gameID}, '${req.session.userID}', '${info.memo}');`,
    (err) => {
      if (err) throw err;
      else res.status(201).redirect('/log');
    }
  );
});

// 즐겨찾기 수정
router.post('/star/edit', (req, res) => {
  const info = req.body;

  connection.query(
    `UPDATE star SET memo = '${info.memo}' WHERE star_id = ${info.starID};`,
    (err) => {
      if (err) throw err;
      else res.status(200).redirect('/log/star');
    }
  );
});

// 즐겨찾기 삭제
router.delete('/star/:star_id/delete', (req, res) => {
  connection.query(
    `DELETE FROM star WHERE star_id = '${req.params.star_id}';`,
    (err) => {
      if (err) throw err;
      else res.status(200).redirect('/log/star');
    }
  );
});

module.exports = router;
