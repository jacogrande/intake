const express = require('express');
const debug = require('debug')('index');
const passport = require('passport');
const auth = require('../../auth.js');
const omdb = require('../apis/omdb.js');
const db = require('./db.js');

const movieController = require('../db/movieController');
const userController = require('../db/userController');


const movieRouter = express.Router();

movieRouter.route('/')
  .get(passport.isAuthenticated, async (req, res) => {
    let movieList = await movieController.findMoviesByUser(req.user.movies, req.user._id);

    movieList = movieList.map((movie) => ({
      title: movie.title,
      total_rating: movie.total_rating,
      poster: movie.poster,
      _id: movie._id,
    }));

    res.render('movies', { movieList, page_title: 'All Movies' });
  })
  .post(passport.isAuthenticated, async (req, res) => {
    const { imdbid } = req.body;
    const apiData = await omdb.fetch(imdbid); // fetch movie info using omdb api


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
    debug(req.user);

    // check if the movie already exists in the database
    const movieExists = await movieController.findMovieByTitle(apiData.Title);

    if (movieExists) { // if the movie exists in the db
      const viewedByUser = () => (req.user.movies.indexOf(movieExists._id) !== -1);
      if (!viewedByUser) { // if the movie exists but the user hasn't seen it
        movieController.addRating(ratings, movieExists._id); // add the user's ratings
        movieController.addThemes(themeData, movieExists._id);// and themes
        movieController.addDates(dates, movieExists._id);// and date
        userController.addMovie(req.user._id, movieExists._id); // then add the movie to the user's seen movie list
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
    userController.addMovie(req.user._id, movieId); // add the movie's id to the user's movie list
    return res.status(200).json({ response: 'new movie added' });
  });

// route for accessing individual movies
movieRouter.route('/:id')
  .get(passport.isAuthenticated, async (req, res) => { // returns all data on identified movie
    const { id } = req.params;
    const movieList = await movieController.findMoviesByUser(req.user.movies, req.user._id);
    const selection = db.find(movieList, id);

    if (selection) {
      res.render('movies', { selection });
    } else res.redirect('../');
  })
  .delete(passport.isAuthenticated, async (req, res) => {
    const { id } = req.params;
    await movieController.removePresence(req.user._id, id);
    await userController.removeMovie(req.user._id, id);
    res.send('success');
  });

movieRouter.route('/search/:title')
  .get(passport.isAuthenticated, async (req, res) => {
    const { title } = req.params;
    const movieOptions = await omdb.getMovies(title);
    res.status(200).json({ results: movieOptions });
  });

module.exports = movieRouter;
