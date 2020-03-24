const express = require('express');
// const debug = require('debug')('index');
const db = require('./db.js');
const passport = require('../../auth.js');

const movieController = require('../db/movieController');

const statisticRouter = express.Router();

statisticRouter.route('/')
  .get(passport.isAuthenticated, (req, res) => {
    res.render('stats', { title: 'All Stats' });
  });

statisticRouter.route('/:property')
  .get(passport.isAuthenticated, async (req, res) => {
    const { property } = req.params;
    const { min } = req.query;
    const movieList = await movieController.findMoviesByUser(req.user.movies, req.user._id);
    const allValues = db.getValues(movieList, property);
    const data = {};
    allValues.forEach((value) => {
      data[value] = db.findByValue(movieList, property, value, true);
    });
    const movieArray = [];
    Object.keys(data).forEach((key) => {
      if (min) {
        if (data[key].length >= min) movieArray.push([key, data[key]]);
      } else {
        movieArray.push([key, data[key]]);
      }
    });

    res.render('stats', { property, title: `${property}`, movieArray });
  });

statisticRouter.route('/:property/:value')
  .get(passport.isAuthenticated, async (req, res) => {
    const { value, property } = req.params;
    const movieList = await movieController.findMoviesByUser(req.user.movies, req.user._id);
    const results = db.findByValue(movieList, property, value, true); // call movie method that returns an array of all movies with the specified property value
    res.render('individualStats.ejs', { movies: results, title: `${property} : ${value}` });
  });

module.exports = statisticRouter;
