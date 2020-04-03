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

let mongoUri = '';
if (process.env.NODE_ENV === 'production') {
  mongoUri = process.env.MONGO_URI;
} else if (process.env.NODE_ENV === 'dev') {
  mongoUri = 'mongodb://localhost:27017/intake';
}

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
  secret: process.env.NODE_ENV === 'production' ? process.env.SESSION_SECRET : 'beese churger',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({
    mongooseConnection: db,
  }),
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
  if (req.user) {
    res.render('about', { loggedIn: true });
  } else {
    res.render('about', { loggedIn: false });
  }
});


app.listen(PORT, () => debug(`Socket to me on port ${chalk.green(PORT)}...`));
