// @ts-check
const express = require('express');

const router = express.Router();
const crypto = require('crypto');

const connection = require('./dbConnect');

const createHashedPassword = (password) => {
  const salt = crypto.randomBytes(64).toString('base64');
  const hashedPassword = crypto
    .pbkdf2Sync(password, salt, 10, 64, 'sha512')
    .toString('base64');
  return { hashedPassword, salt };
};

router.get('/', (req, res) => {
  res.render('signup');
});

router.post('/', (req, res) => {
  const info = req.body;
  const password = createHashedPassword(info.userPW);
  connection.query(
    `INSERT INTO user (user_id, user_name, user_pw, salt) VALUES ('${info.userID}', '${info.userName}', '${password.hashedPassword}', '${password.salt}');`,
    (err) => {
      if (err) throw err;
      else res.status(201).redirect('/signin');
    }
  );
});

router.post('/check', (req, res) => {
  const info = req.body;
  connection.query(
    `SELECT ${info.category} FROM user WHERE ${info.category} = '${info.data}';`,
    (err, data) => {
      if (err) throw err;

      if (data.length === 0) res.json({ result: true });
      else res.json({ result: false });
    }
  );
});

module.exports = router;
