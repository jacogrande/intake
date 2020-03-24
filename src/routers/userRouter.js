const express = require('express');
const debug = require('debug')('index');
const User = require('../schemas/user.js');
const passport = require('../../auth.js');

const movieController = require('../db/movieController');

const userRouter = express.Router();

userRouter.route('/register') // registration route
  .get((req, res) => { // if the user is registered, send them to the profile page, otherwise, set them up with a registration page
    if (req.user != null) {
      res.redirect('/profile');
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
      res.redirect('/profile');
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

userRouter.route('/test')
  .post((req, res) => {
    debug(req.body);
    res.send('success');
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
