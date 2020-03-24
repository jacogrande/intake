const express = require('express');
const chalk = require('chalk');
const debug = require('debug')('index');
const morgan = require('morgan');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const helmet = require('helmet');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

const User = require('./src/schemas/user.js');

const mongoUri = process.env.MONGO_URI;

// mongoose implementation
mongoose.connect(mongoUri, { useNewUrlParser: true });
const db = mongoose.connection;
db.on('error', () => debug(chalk.red('Connection error')));
db.once('open', () => {
  debug(chalk.green('mongodb online'));
});


const app = express();
const PORT = process.env.PORT || 3000;
const movieRouter = require('./src/routers/movieRouter.js');
const statisticRouter = require('./src/routers/statisticRouter.js');
const userRouter = require('./src/routers/userRouter.js');


app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true,
  store: new MongoStore({ mongooseConnection: db }),
}));

app.use(helmet());
app.disable('x-powered-by');


app.use(morgan('tiny'));
app.use('/css', express.static(path.join(__dirname, '/node_modules/bootstrap/dist/css')));
app.use('/js', express.static(path.join(__dirname, '/node_modules/bootstrap/dist/js')));
app.use('/js', express.static(path.join(__dirname, '/node_modules/jquery/dist')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('views', './src/views');
app.set('view engine', 'ejs');


// passport middleware
app.use(passport.initialize());
app.use(passport.session());


app.use('/movies', movieRouter);
app.use('/stats', statisticRouter);
app.use('/', userRouter);

app.get('/', (req, res) => {
  res.redirect('/movies');
});

app.post('/register', (req, res) => {
  User.register(new User({ username: req.body.username, email: req.body.email }), req.body.password, (err, account) => {
    if (err) return res.send(err);
    passport.authenticate('local')(req, res, () => {
      res.send('success');
    });
  });
});

app.post('/login', passport.authenticate('local'), (req, res) => {
  res.send('success');
  // res.redirect('/test');
});

app.get('/test', (req, res) => {
  res.send(req.user);
});

app.listen(PORT, () => debug(`Socket to me on port ${chalk.green(PORT)}...`));
