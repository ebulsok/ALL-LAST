// @ts-check
const express = require('express');

const session = require('express-session');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT;

const router = require('./routes/index');
const signupRouter = require('./routes/signup');
const signinRouter = require('./routes/signin');
const logRouter = require('./routes/log');
const scoreRouter = require('./routes/score');

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(
  session({
    secret: 'alllast',
    resave: false,
    saveUninitialized: true,
  })
);

app.use('/', router);
app.use('/signup', signupRouter);
app.use('/signin', signinRouter);
app.use('/log', logRouter.router);
app.use('/score', scoreRouter);

app.use((err, req, res, next) => {
  console.log(err.stack);
  res.status(err.statusCode || 500);
  res.send(err.message);
});

app.listen(PORT, () => {
  console.log(`${PORT}번 서버`);
});
