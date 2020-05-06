const express = require('express');
const debug = require('debug')('index');
const passport = require('../../auth.js');

const movieController = require('../db/movieController');
const userController = require('../db/userController');
const cache = require('../db/cache.js');
const db = require('./db.js');

const friendRouter = express.Router();

friendRouter.route('/search/:username')
  .get(passport.isAuthenticated, async (req, res) => {
    const { username } = req.params;
    try {
      let possibilities = await userController.findLikeNames(username, req.user.friends);
      possibilities = possibilities.filter((user) => user.username != req.user.username);
      res.status(200).json({ users: possibilities });
    } catch (err) {
      debug(err);
      res.status(500).json(err);
    }
  });

friendRouter.route('/getInfo/:username')
  .get(passport.isAuthenticated, async (req, res) => {
    const { username } = req.params;
    try {
      const user = await userController.getPublicInfo(username);
      return res.json(user);
    } catch (err) {
      debug(err);
      res.sendStatus(500);
    }
  });

friendRouter.route('/addFriend')
  .post(passport.isAuthenticated, async (req, res) => {
    const { id } = req.body;
    try {
      await userController.makeFriendRequest(id, req.user.id);
      res.sendStatus(200);
    } catch (err) {
      debug(err);
      return res.sendStatus(500);
    }
  });

friendRouter.route('/acceptFriendRequest')
  .post(passport.isAuthenticated, async (req, res) => {
    const { id } = req.body;
    if (req.user.friend_requests.indexOf(id) !== -1) {
      try {
        await userController.acceptFriendRequest(id, req.user.id);
        req.user.friend_requests.splice(req.user.friend_requests.indexOf(id), 1);
        req.user.friends.push(id);
        await req.user.save();
        return res.sendStatus(200);
      } catch (err) {
        debug(err);
        return res.sendStatus(500);
      }
    }
    return res.sendStatus(500);
  });

friendRouter.route('/:id')
  .get(passport.isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const existsInCache = cache.checkCache(id);
    let movieList = null;
    const userData = await userController.getPublicInfoById(id);
    if (existsInCache) { // the movie list exists in the cache
      debug('cache hit');
      movieList = existsInCache;
    } else {
      movieList = await movieController.findMoviesByUser(userData.movies, id);
      cache.cacheMovieList(id.toString(), movieList);
      debug(`cached movies seen by user with id: ${id}`);
    }

    res.render('friendProfile', {
      movieList,
      username: userData.username,
      movies: movieList,
      avatar: userData.avatar,
      friend_requests: req.user.friend_requests,
    });
  });

friendRouter.route('/:id/:movieId')
  .get(passport.isAuthenticated, async (req, res) => {
    const { id, movieId } = req.params;
    const userData = await userController.getPublicInfoById(id);
    try {
      if (req.user.friends.indexOf(id) != -1) {
        const existsInCache = cache.checkCache(id);

        let { upvoted_reviews } = req.user;
        if (!upvoted_reviews) {
          upvoted_reviews = { reviews: [] };
        } else {
          upvoted_reviews = upvoted_reviews.find((e) => e.movie_id.toString() === id.toString());
          if (!upvoted_reviews) {
            upvoted_reviews = { reviews: [] };
          }
        }


        if (existsInCache) {
          debug('cache hit');
          const movie = db.find(existsInCache, movieId);
          const reviewed = movie.reviews.findIndex((e) => e.user_id.toString() === req.user._id.toString());
          if (reviewed != -1 && req.user.reviews.indexOf(movie.reviews[reviewed]._id) === -1) {
            userController.createReview(movie.reviews[reviewed]._id, req.user._id);
          }
          return res.render('movies', {
            selection: movie, username: req.user.username, upvoted_reviews: upvoted_reviews.reviews, reviewed, friend_requests: req.user.friend_requests, friend_username: userData.username,
          });
        }

        try {
          movieList = await movieController.findMoviesByUser(userData.movies, id);
          cache.cacheMovieList(id.toString(), movieList);
          debug(`movies cached to user with id: ${id}`);
          const cachedMovies = cache.checkCache(id.toString());
          const movie = db.find(cachedMovies, movieId);
          console.log(movie);
          const reviewed = movie.reviews.findIndex((e) => e.user_id.toString() === req.user._id.toString());
          return res.render('movies', {
            selection: movie, username: req.user.username, upvoted_reviews: upvoted_reviews.reviews, reviewed, friend_requests: req.user.friend_requests, friend_username: userData.username,
          });
        } catch (err) {
          debug(err);
          return res.send(err);
        }
      }
      res.redirect('/movies');
    } catch (err) {
      debug(err);
      res.send({ error: err });
    }
  });

friendRouter.route('/:id/:movieId/review/:reviewId')
  .post(passport.isAuthenticated, (req, res) => {
    const { movieId, reviewId } = req.params;
    res.redirect(307, `/movies/${movieId}/review/${reviewId}`);
  });

module.exports = friendRouter;
