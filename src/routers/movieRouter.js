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

    res.render('movies', { movieList, page_title: 'All Movies' });
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
        await movieController.addRating(ratings, movieExists._id); // add the user's ratings
        await movieController.addThemes(themeData, movieExists._id);// and themes
        await movieController.addDates(dates, movieExists._id);// and date
        await userController.addMovie(req.user._id, movieExists._id); // then add the movie to the user's seen movie list

        const cachedMovie = movieExists; // create personalized movie for cache
        cachedMovie.ratings = ratings;
        cachedMovie.themeData = themeData;
        cachedMovie.date_added = dates;
        cache.addMovie(req.user._id, cachedMovie); // update the cache

        return res.status(200).json({ response: 'new ratings / theme added' });
      }
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
    return res.status(200).json({ response: 'new movie added' });
  });

// route for accessing individual movies
movieRouter.route('/:id')
  .get(passport.isAuthenticated, async (req, res) => { // returns all data on identified movie
    const { id } = req.params;
    try {
      if (req.user.movies.indexOf(id) != -1) {
        const existsInCache = cache.checkCache(req.user._id);
        // debug(existsInCache);
        let movie = null;
        if (existsInCache) {
          movie = db.find(existsInCache, id);
        } else movie = await movieController.findMovieById(id);
        if (movie) {
          return res.render('movies', { selection: movie });
        }
      }
      return res.redirect('/movies');
    } catch (err) {
      res.send({ error: err });
    }
  })
  .delete(passport.isAuthenticated, async (req, res) => {
    const { id } = req.params;
    try {
      let movie = await movieController.findMovieById(id);
      movie = movieController.filterByUser(movie, req.user._id);
      cache.removeMovie(req.user._id, movie);
      await movieController.removePresence(req.user._id, id);
      await userController.removeMovie(req.user._id, id);
      res.send('success');
    } catch (err) {
      debug(err);
      res.sendStatus(401);
    }
  });

movieRouter.route('/search/:title')
  .get(passport.isAuthenticated, async (req, res) => {
    const { title } = req.params;
    const movieOptions = await omdb.getMovies(title);
    res.status(200).json({ results: movieOptions });
  });

module.exports = movieRouter;
