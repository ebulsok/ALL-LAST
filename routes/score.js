// @ts-check
const express = require('express');

const router = express.Router();
const getTotal = require('./log').getTotal;

const connection = require('./dbConnect');

// 나의 점수
router.get('/', (req, res) => {
  const name = req.session.userName;

  if (!name) res.redirect('/signin');
  else {
    const page = Number(req.query.page) - 1;
    const getCnt = `SELECT COUNT(*) as cnt FROM game WHERE player_1 = '${name}' OR player_2 = '${name}' OR player_3 = '${name}' OR player_4 = '${name}';`;
    const getGame = `SELECT *, DATE_FORMAT(date, '%Y/%m/%d') AS date FROM game WHERE player_1 = '${name}' OR player_2 = '${name}' OR player_3 = '${name}' OR player_4 = '${name}' ORDER BY date DESC, place, reg_date DESC LIMIT ${
      page * 10
    }, 10;`;

    connection.query(getCnt + getGame, (err, result) => {
      if (err) throw err;
      else {
        const pageNum = Math.ceil(result[0][0].cnt / 10);
        const data = result[1];
        let scores = [];
        let obj = {};
        for (let i = 0; i < data.length; i++) {
          if (i === 0)
            obj = { date: data[i].date, place: data[i].place, games: [] };
          else if (
            data[i - 1].date !== data[i].date ||
            data[i - 1].place !== data[i].place
          ) {
            scores.push(obj);
            obj = { date: data[i].date, place: data[i].place, games: [] };
          }

          let total = getTotal(
            (data[i].score_1 - 30000) / 1000,
            (data[i].score_2 - 30000) / 1000,
            (data[i].score_3 - 30000) / 1000,
            (data[i].score_4 - 30000) / 1000
          );
          if (data[i].player_1 === name) {
            obj.games.push({
              rank: 1,
              score: data[i].score_1,
              total: total.total_1,
            });
          } else if (data[i].player_2 === name) {
            obj.games.push({
              rank: 2,
              score: data[i].score_2,
              total: total.total_2,
            });
          } else if (data[i].player_3 === name) {
            obj.games.push({
              rank: 3,
              score: data[i].score_3,
              total: total.total_3,
            });
          } else if (data[i].player_4 === name) {
            obj.games.push({
              rank: 4,
              score: data[i].score_4,
              total: total.total_4,
            });
          }
          if (i === data.length - 1) scores.push(obj);
        }
        res.status(200).render('score', { scores, pageNum, name });
      }
    });
  }
});

module.exports = router;
