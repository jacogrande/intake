const express = require('express');
const debug = require('debug')('index');
const passport = require('passport');
const auth = require('../../auth.js');
const omdb = require('../apis/omdb.js');
const db = require('./db.js');

const movieController = require('../db/movieController');
const userController = require('../db/userController');
const cache = require('../db/cache.js');

const movieRouter = express.Router();

movieRouter.route('/')
  .get(passport.isAuthenticated, async (req, res) => {
    const isAdmin = db.checkCredentials(req.query.admin_key);
    if (isAdmin) {
      const allMovies = await movieController.getAllMovies();
      return res.json(allMovies);
    }
    const existsInCache = cache.checkCache(req.user._id);
    let movieList = null;
    if (existsInCache) { // the movie list exists in the cache
      debug('cache hit');
      movieList = existsInCache;
    } else {
      movieList = await movieController.findMoviesByUser(req.user.movies, req.user._id);
      cache.cacheMovieList(req.user._id.toString(), movieList);
      debug(`movies cached to user with id: ${req.user._id}`);
    }

    return res.render('movies', { movieList, page_title: 'Movies Seen', friend_requests: req.user.friend_requests });
  })
  .post(passport.isAuthenticated, async (req, res) => {
    const { imdbid } = req.body;
    const apiData = await omdb.fetch(imdbid); // fetch movie info using omdb api
    if (apiData.err) {
      return res.send({ error: apiData.err });
    }

    const {
      entertainment_rating, plot_rating, style_rating, bias_rating, themes, director_gender, writer_gender, date,
    } = req.body; // pull data from post request

    // create theme and rating objects to append to movie object
    const ratings = {
      entertainment_rating,
      plot_rating,
      style_rating,
      bias_rating,
      total_rating: plot_rating + style_rating + bias_rating + entertainment_rating,
      user_id: req.user.id,
    };
    const themeData = {
      themes,
      user_id: req.user.id,
    };

    const dates = {
      date,
      user_id: req.user.id,
    };

    // check if the movie already exists in the database
    const movieExists = await movieController.findMovieByTitle(apiData.Title);

    if (movieExists) { // if the movie exists in the db
      const viewedByUser = (req.user.movies.indexOf(movieExists._id) !== -1);
      if (!viewedByUser) { // if the movie exists but the user hasn't seen it
        const ratingsAdded = movieController.addRating(ratings, movieExists._id); // add the user's ratings
        const themesAdded = movieController.addThemes(themeData, movieExists._id); // and themes
        const datesAdded = movieController.addDates(dates, movieExists._id); // and date
        const movieAdded = userController.addMovie(req.user._id, movieExists._id); // then add the movie to the user's seen movie list
        const parallelAwait = [await ratingsAdded, await themesAdded, await datesAdded, await movieAdded];

        const cachedMovie = movieExists; // create personalized movie for cache
        cachedMovie.entertainment_rating = entertainment_rating;
        cachedMovie.plot_rating = plot_rating;
        cachedMovie.style_rating = style_rating;
        cachedMovie.bias_rating = bias_rating;
        cachedMovie.total_rating = entertainment_rating + plot_rating + style_rating + bias_rating;
        cachedMovie.themes = themes;
        cachedMovie.date_added = dates;
        cache.addMovie(req.user._id, cachedMovie); // update the cache

        return res.status(200).json({ response: 'new ratings / theme added' });
      }
      debug('movie already seen by user');
      return res.status(200).json({ response: 'error: movie already seen by user' });
    } // if the movie doesn't exist in the db
    const movieData = { // create a new movie
      title: apiData.Title,
      year: apiData.Year,
      rated: apiData.Rated,
      genres: apiData.Genre.split(', '),
      director: apiData.Director.split(', '),
      director_gender,
      writer_gender,
      writer: apiData.Writer.split(', '),
      plot: apiData.Plot,
      ratings: [
        ratings,
      ],
      themes: [
        themeData,
      ],
      date_added: [
        dates,
      ],
      runtime: apiData.Runtime,
      poster: apiData.poster,
    };

    const movieId = await movieController.addMovie(movieData); // add the movie to the db
    await userController.addMovie(req.user._id, movieId); // add the movie's id to the user's movie list

    const cachedMovie = movieData; // create personalized movie for cache
    cachedMovie.entertainment_rating = entertainment_rating;
    cachedMovie.plot_rating = plot_rating;
    cachedMovie.style_rating = style_rating;
    cachedMovie.bias_rating = bias_rating;
    cachedMovie.total_rating = entertainment_rating + plot_rating + style_rating + bias_rating;
    cachedMovie.themes = themes;
    cachedMovie.date_added = dates;
    cachedMovie._id = movieId;
    cachedMovie.reviews = [];
    cache.addMovie(req.user._id, cachedMovie); // update the cache

    return res.status(200).json({ response: 'new movie added' });
  });

movieRouter.route('/refreshPosters')
  .get(passport.isAuthenticated, async (req, res) => {
    const isAdmin = db.checkCredentials(req.query.admin_key);
    if (isAdmin) {
      await movieController.refreshPosters();
      cache.flushCache();
    }
    res.send('Refreshing...');
  });


// route for accessing individual movies
movieRouter.route('/:id')
  .get(passport.isAuthenticated, async (req, res) => { // returns all data on identified movie
    const { id } = req.params;
    try {
      if (req.user.movies.indexOf(id) != -1) {
        const existsInCache = cache.checkCache(req.user._id);

        // ===== OPTIMIZE =====

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
          const movie = db.find(existsInCache, id);
          const reviewed = movie.reviews.findIndex((e) => e.user_id.toString() === req.user._id.toString());
          if (reviewed != -1 && req.user.reviews.indexOf(movie.reviews[reviewed]._id) === -1) {
            userController.createReview(movie.reviews[reviewed]._id, req.user._id);
          }
          return res.render('movies', {
            selection: movie, username: req.user.username, upvoted_reviews: upvoted_reviews.reviews, reviewed, friend_requests: req.user.friend_requests,
          });
        }

        try {
          movieList = await movieController.findMoviesByUser(req.user.movies, req.user._id);
          cache.cacheMovieList(req.user._id.toString(), movieList);
          debug(`movies cached to user with id: ${req.user._id}`);
          const cachedMovies = cache.checkCache(req.user._id);
          const movie = db.find(cachedMovies, id);
          const reviewed = movie.reviews.findIndex((e) => e.user_id.toString() === req.user._id.toString());
          return res.render('movies', {
            selection: movie, username: req.user.username, upvoted_reviews: upvoted_reviews.reviews, reviewed, friend_requests: req.user.friend_requests,
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
  })
  .delete(passport.isAuthenticated, async (req, res) => {
    const { id } = req.params;
    try {
      if (cache.checkCache(req.user._id)) {
        cache.removeMovie(req.user._id, id);
      }
      // await new Prom
      await movieController.removePresence(req.user._id, id);
      await userController.removeMovie(req.user._id, id);
      res.send('success');
    } catch (err) {
      debug(err);
      res.sendStatus(401);
    }
  })
  .post(passport.isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const {
      entertainment_rating, plot_rating, style_rating, bias_rating,
    } = req.body;

    const total_rating = entertainment_rating + plot_rating + style_rating + bias_rating;


    const ratings = {
      entertainment_rating,
      plot_rating,
      style_rating,
      bias_rating,
      total_rating,
      user_id: req.user._id,
    };

    const themes = {
      themes: req.body.themes,
      user_id: req.user._id,
    };

    const response = await movieController.updateMovieRating(ratings, themes, req.user._id, id);
    if (response) {
      return res.status(401);
    }

    const cacheResponse = cache.updateRating(req.user._id, id, ratings, themes);
    if (cacheResponse) {
      debug('cache updated');
    }

    res.status(200).json('success');
  });

movieRouter.route('/:id/review')
  .post(passport.isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { review } = req.body;
    try {
      let reviewId = await movieController.addReview(review, req.user._id, req.user.username, id);
      reviewId = reviewId.reviews[reviewId.reviews.length - 1]._id;
      cache.addReview(req.user._id, req.user.username, review, id, reviewId);
      await userController.createReview(reviewId, req.user._id);
    } catch (err) {
      debug(err);
      return res.status(401).json(err);
    }
    res.status(200).json();
  });

movieRouter.route('/:id/review/:review_id') // upvote
  .post(passport.isAuthenticated, async (req, res) => {
    const { vote } = req.body;
    const { id, review_id } = req.params;
    // PROCESS:
    // check to see if user has upvoted the review
    // see if that correlates with the vote action (>0 = upvote, < 0 = downvote)
    // if it does, modify the review upvote count and the user's upvote history
    const { upvoted_reviews } = req.user;
    if (!upvoted_reviews) upvoted_reviews = [];
    const currentMovie = upvoted_reviews.find((e) => e.movie_id.toString() === id.toString()); // get the reviews for this movie

    if (vote === 1) { // if liked
      if (!currentMovie || currentMovie.reviews.indexOf(review_id) === -1) { // if the review doesn't exist in the movie or the movie doesn't exist
        debug('like');
        try {
          userController.addReview(req.user._id, id, review_id); // add to users reviewed list
          movieController.upvoteReview(id, review_id, req.user._id);
          cache.clearCache(req.user._id);
        } catch (err) {
          debug(err);
          return res.status(401).json(err);
        }
      } else debug('review already liked');
    } else if (currentMovie.reviews.indexOf(review_id) != -1 && vote === -1) {
      debug('dislike');
      try {
        userController.removeReview(req.user._id, id, review_id);
        movieController.downvoteReview(id, review_id, req.user._id);
      } catch (err) {
        debug(err);
        return res.status(401).json(err);
      }
    }


    res.status(200);
  })
  .delete(passport.isAuthenticated, async (req, res) => {
    const { id, review_id } = req.params;
    try {
      const users = await movieController.deleteReview(id, review_id, req.user.username);
      users.forEach((user) => {
        debug(`review data removed from user with id: ${user}`);
        userController.removeReview(user, id, review_id);
      });
      cache.deleteReview(id, review_id, req.user.username, req.user._id);
      await userController.deleteReview(review_id, req.user._id);
      return res.status(200).json('success');
    } catch (err) {
      debug(err);
      return res.status(401).json(err);
    }
  });

movieRouter.route('/:id/edit_review/:review_id')
  .post(passport.isAuthenticated, async (req, res) => {
    const { id, review_id } = req.params;
    const { review } = req.body;
    try {
      await movieController.updateReview(id, review_id, req.user.username, review);
      cache.updateReview(id, review_id, req.user.username, req.user._id, review);
      debug('review updated!');
      return res.send('success');
    } catch (err) {
      debug(err);
      return res.send(err);
    }
  });

movieRouter.route('/search/:title')
  .get(passport.isAuthenticated, async (req, res) => {
    const { title } = req.params;
    const movieOptions = await omdb.getMovies(title);
    res.status(200).json({ results: movieOptions });
  });

module.exports = movieRouter;
