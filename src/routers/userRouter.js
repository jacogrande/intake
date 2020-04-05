const express = require('express');
const debug = require('debug')('index');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../schemas/user.js');
const passport = require('../../auth.js');

const movieController = require('../db/movieController');
const userController = require('../db/userController');

const secret = '123123';
const token = jwt.sign({ body: 'goteem', exp: Math.floor(Date.now() / 1000) + (60 * 60) }, secret);


const userRouter = express.Router();

userRouter.route('/register') // registration route
  .get((req, res) => { // if the user is registered, send them to the profile page, otherwise, set them up with a registration page
    if (req.user != null) {
      res.redirect('/movies');
    } else {
      res.render('login');
    }
  })
  .post((req, res) => { // post request to add a new user
    const { username } = req.body;
    const { password } = req.body;
    const { email } = req.body;
    const newUser = new User({ // create a new user with the sent data
      username,
      password,
      email,
    });
    User.findOne({ username: newUser.username }, (err, response) => { // check to see if a user exists with the given username
      if (err) {
        return res.status(422).json({ error: err });
      }
      if (response) { // if a user does exist
        res.send({ success: false });
      } else { // otherwise
        newUser.save((err) => { // save the new user
          if (err) {
            debug(err);
            return res.status(422).json({ error: err });
          }
          passport.authenticate('local')(req, res, () => { // redirect them to the profile page
            debug('new user created');
            res.send({ success: true });
          });
        });
      }
    });
  });

userRouter.route('/login')
  .get((req, res) => {
    if (req.user != null) {
      res.redirect('/movies');
    } else {
      res.render('login');
    }
  })
  .post(passport.authenticate('local', { failureRedirect: '/login' }), (req, res) => {
    res.send({ success: true });
  });

userRouter.route('/profile') // profile page
  .get(passport.isAuthenticated, async (req, res) => {
    // get user movies
    let movieList = await movieController.findMoviesByUser(req.user.movies, req.user._id);
    movieList = movieList.map((movie) => ({
      title: movie.title,
      total_rating: movie.total_rating,
      poster: movie.poster,
      _id: movie._id,
    }));

    res.render('profile', { username: req.user.username, movies: movieList });
  });

// userRouter.route('/test')
//   .post((req, res) => {
//     debug(req.body);
//     res.send('success');
//   });

const getMailAuth = () => {
  if (process.env.NODE_ENV === 'dev') {
    const config = require('../../config.js');
    return {
      user: config.SENDGRID_USERNAME,
      pass: config.SENDGRID_PASSWORD,
    };
  }
  if (process.env.NODE_ENV === 'production') {
    return {
      user: process.env.SENDGRID_USERNAME,
      pass: process.env.SENDGRID_PASSWORD,
    };
  }
};

const getMailAddress = () => {
  if (process.env.NODE_ENV === 'dev') {
    const config = require('../../config.js');
    return config.EMAIL_ADDRESS;
  }
  if (process.env.NODE_ENV === 'production') {
    return process.env.EMAIL_ADDRESS;
  }
};

const getSecretKey = () => {
  if (process.env.NODE_ENV === 'dev') {
    return 'beese churger';
  }
  if (process.env.NODE_ENV === 'production') {
    return process.env.JWT_SECRET;
  }
};

userRouter.route('/passwordReset')
  .get((req, res) => {
    res.render('passwordReset', { step: 1 });
  })
  .post(async (req, res) => {
    const { email } = req.body;
    if (email) {
      let userId = null;
      try {
        userId = await userController.findByEmail(email);
      } catch (err) {
        return res.status(401).json(err);
      }
      if (userId.err) return res.send('error');

      const payload = {
        id: userId._id,
        email,
        exp: Math.floor(Date.now() / 1000) + (60 * 60),
      };

      const secret = getSecretKey();
      const token = jwt.sign(payload, secret);

      const transporter = nodemailer.createTransport({
        service: 'SendGrid',
        auth: getMailAuth(),
      });

      let emailLink = '';
      if (process.env.NODE_ENV === 'dev') {
        emailLink = `http://127.0.0.1:3000/passwordReset/${payload.id}/${token}`;
      }
      if (process.env.NODE_ENV === 'production') {
        emailLink = `https://www.intake.space/passwordReset/${payload.id}/${token}`;
      }

      const sender = getMailAddress();
      const mailOptions = {
        from: sender,
        to: email,
        subject: 'Intake Password Reset',
        text: `There has been a request to reset the password for your account on intake.space.\n\nPlease copy and paste or click the following link to reset your password.\n\n${emailLink}\n\nIf you did not request this change, please ignore this email and your password will remain unchanged.\n`,
        html: `
          <head>
            <style>
              .body{
                width:100%; font-family: Arial; font-weight: 150; background: #1E262A; color: #D5D5D5; text-align:center;
              }

              p {
                color:#d5d5d5
              }
              .nav{
                width:100%; height:50px; background: #181F24; text-align:center; font-family: Arial; font-size:25px; letter-spacing: 10px; padding-top:5px; padding-bottom:25px; border-bottom:1px solid black;
              }
              .nav p {
                color: #EF49B5;
              }
              a {
                color:#8EC3AF !important; text-decoration: none; cursor: pointer;
              }
              a:hover{
                opacity:0.85;
              }
            </style>
          </head>
          <body>
            <div class = 'body'>
              <div class = 'nav'><p>INTAKE</p></div>
              <p>There has been a request to reset the password for your account on <a href = 'https://www.intake.space'>intake.space</a>. Please copy and paste or click the following link to reset your password.</p>
              <br><br>
              <p><a href="${emailLink}">${emailLink}</a></p>
              <br><br><br>
              <p style = 'color:#aaa; padding-bottom:80px'><em>If you did not request this reset, please ignore this email and your password will remain unchanged.</em></p>
            </div>
          </body>
        `,
      };

      try {
        transporter.sendMail(mailOptions, (err, response) => {
          if (err) {
            debug(err);
          } else {
            debug(response);
            return res.status(200).json('recovery email sent');
          }
        });
      } catch (err) {
        return res.status(401).json(err);
      }
    }
  });


userRouter.route('/passwordReset/:id/:token')
  .get((req, res) => {
    try {
      const secret = getSecretKey();
      const payload = jwt.verify(req.params.token, secret);
      res.render('passwordReset', { step: 2 });
    } catch (err) {
      res.render('passwordReset', { error: true, step: null });
    }
  })
  .post(async (req, res) => {
    const secret = getSecretKey();
    const payload = jwt.verify(req.params.token, secret);
    const dbResponse = await userController.resetPassword(payload.id, req.body.password);
    res.send(dbResponse);
  });


userRouter.route('/delete')
  .delete(passport.isAuthenticated, (req, res) => {
    User.deleteOne({ _id: req.user._id }, (err) => {
      if (err) {
        return res.status(500).json({ error: err });
      }
      res.send('user deleted');
    });
  });

userRouter.route('/logout')
  .get(passport.isAuthenticated, (req, res) => {
    req.logout();
    res.redirect('/login');
  });

module.exports = userRouter;
