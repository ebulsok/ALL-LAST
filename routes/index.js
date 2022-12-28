// @ts-check
const express = require('express');

const router = express.Router();

const getTotal = require('./log').getTotal;

const connection = require('./dbConnect');

router.get('/', (req, res) => {
  const name = req.session.userName;
  let page = Number(req.query.page) - 1;
  if (!req.query.page) page = 1;

  const getCnt = 'SELECT COUNT(*) as cnt FROM game WHERE secret = 0;';
  const getData = `SELECT *, DATE_FORMAT(date, "%Y-%m-%d") AS date FROM game WHERE secret = 0 ORDER BY game_id DESC LIMIT ${
    page * 5
  }, 5;`;
  connection.query(getCnt + getData, (err, result) => {
    if (err) throw err;

    const pageNum = Math.ceil(result[0][0].cnt / 5);
    const data = result[1];
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
    res.render('home', { data, total, name, pageNum });
  });
});

module.exports = router;
