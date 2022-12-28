// @ts-check
const express = require('express');

const router = express.Router();
const crypto = require('crypto');

const connection = require('./dbConnect');

const verifyPassword = (password, salt, userPassword) => {
  const hashed = crypto
    .pbkdf2Sync(password, salt, 10, 64, 'sha512')
    .toString('base64');
  if (hashed === userPassword) return true;
  return false;
};

router.get('/', (req, res) => {
  res.render('signin');
});

router.post('/', (req, res) => {
  const info = req.body;
  connection.query(
    `SELECT * FROM user WHERE user_id = '${info.userID}';`,
    (err, data) => {
      if (err) throw err;
      if (data.length === 0)
        res
          .status(300)
          .send(
            '계정 정보가 없습니다.<br /><a href="/signin">로그인 페이지로 이동</a>'
          );
      else {
        if (verifyPassword(info.userPW, data[0].salt, data[0].user_pw)) {
          req.session.userID = data[0].user_id;
          req.session.userName = data[0].user_name;
          res.status(200).redirect('/?page=1');
        } else
          res
            .status(300)
            .send(
              '비밀번호가 일치하지 않습니다.<br /><a href="/signin">로그인 페이지로 이동</a>'
            );
      }
    }
  );
});

router.get('/signout', (req, res) => {
  req.session.destroy((err) => {
    if (err) throw err;
    res.redirect('/?page=1');
  });
});

module.exports = router;
