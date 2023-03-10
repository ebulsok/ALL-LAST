// @ts-check
const express = require('express');

const router = express.Router();

const connection = require('./dbConnect');

const places = [
  '온라인',
  '마이티마장',
  '제니랜드',
  '이수마장',
  '마작카페',
  '역곡마장',
  '보드게임카페',
  '기타',
];

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

// 로그
router.get('/', (req, res) => {
  const name = req.session.userName;
  const page = Number(req.query.page) - 1;

  if (!name) res.redirect('/signin');
  else {
    const getCnt = `SELECT COUNT(*) as cnt FROM game WHERE player_1 = '${name}' OR player_2 = '${name}' OR player_3 = '${name}' OR player_4 = '${name}';`;
    const getGame = `SELECT *, DATE_FORMAT(date, '%Y/%m/%d') AS date FROM game WHERE player_1 = '${name}' OR player_2 = '${name}' OR player_3 = '${name}' OR player_4 = '${name}' ORDER BY date DESC, place, reg_date DESC LIMIT ${
      page * 5
    }, 5;`;
    const getStar = `SELECT game_id FROM star WHERE user_id = '${req.session.userID}';`;
    connection.query(getCnt + getGame + getStar, (err, data) => {
      if (err) throw err;
      else {
        const pageNum = Math.ceil(data[0][0].cnt / 5);
        const games = data[1];
        const stars = data[2];
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
        res.status(200).render('log', { games, total, stars, pageNum, name });
      }
    });
  }
});

// 로그 작성
router.get('/new', (req, res) => {
  const name = req.session.userName;
  if (!name) res.redirect('/signin');
  else res.render('newLog', { places, name });
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
      else res.status(201).redirect('/log?page=1');
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
router.get('/edit/:game_id', (req, res) => {
  if (!req.session.userID) res.redirect('/signin');
  else {
    const name = req.session.userName;
    connection.query(
      `SELECT *, DATE_FORMAT(date, '%Y-%m-%d') AS date FROM game WHERE game_id = ${req.params.game_id};`,
      (err, data) => {
        if (err) throw err;
        res.render('editLog', { data, places, name });
      }
    );
  }
});
router.post('/edit/:game_id', (req, res) => {
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
      else res.status(201).redirect('/log?page=1');
    }
  );
});

// 로그 삭제(star에서도 삭제)
router.delete('/delete/:game_id', (req, res) => {
  const dFromGame = `DELETE FROM game WHERE game_id = ${req.params.game_id};`;
  const dFromStar = `DELETE FROM star WHERE game_id = ${req.params.game_id} AND user_id = '${req.session.userID}';`;
  connection.query(dFromGame + dFromStar, (err) => {
    if (err) throw err;
    else res.status(200).redirect('/log?page=1');
  });
});

// 즐겨찾기 목록
router.get('/star', (req, res) => {
  const id = req.session.userID;

  if (!id) res.redirect('/signin');
  else {
    const name = req.session.userName;
    const page = Number(req.query.page) - 1;
    const getCnt = `SELECT COUNT(*) as cnt FROM star WHERE user_id = '${id}';`;
    const getGame = `SELECT s.star_id, s.memo, g.*, DATE_FORMAT(g.date, '%Y/%m/%d') AS date FROM star AS s JOIN game AS g ON s.game_id = g.game_id WHERE user_id = '${id}' ORDER BY date DESC, place, reg_date DESC LIMIT ${
      page * 5
    }, 5;`;

    connection.query(getCnt + getGame, (err, data) => {
      if (err) throw err;
      else {
        const pageNum = Math.ceil(data[0][0].cnt / 5);
        const games = data[1];

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
        res.status(200).render('star', { games, total, pageNum, name });
      }
    });
  }
});

// 즐겨찾기 추가
router.post('/star', (req, res) => {
  const info = req.body;

  connection.query(
    `INSERT INTO star (game_id, user_id, memo) VALUES (${info.gameID}, '${req.session.userID}', '${info.memo}');`,
    (err) => {
      if (err) throw err;
      else res.status(201).redirect('/log?page=1');
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
      else res.status(200).redirect('/log/star?page=1');
    }
  );
});

// 즐겨찾기 삭제
router.delete('/star/delete/:star_id', (req, res) => {
  connection.query(
    `DELETE FROM star WHERE star_id = '${req.params.star_id}';`,
    (err) => {
      if (err) throw err;
      else res.status(200).redirect('/log/star?page=1');
    }
  );
});

module.exports = { router, getTotal };
