const express = require('express');
const debug = require('debug')('index');
const db = require('./db.js');
const passport = require('../../auth.js');

const movieController = require('../db/movieController');
const cache = require('../db/cache.js');

const statisticRouter = express.Router();

statisticRouter.route('/')
  .get(passport.isAuthenticated, async (req, res) => {
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
    res.render('individualStats.ejs', { movies: movieList, title: `Movie Statistics`, friend_requests: req.user.friend_requests });
  })

statisticRouter.route('/:property')
  .get(passport.isAuthenticated, async (req, res) => {
    const { property } = req.params;
    const { min } = req.query;
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
    res.render('stats', {
      property, title: `${property}`, movieArray, friend_requests: req.user.friend_requests,
    });
  });

statisticRouter.route('/:property/:value')
  .get(passport.isAuthenticated, async (req, res) => {
    const { value, property } = req.params;
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
    const results = db.findByValue(movieList, property, value, true); // call movie method that returns an array of all movies with the specified property value
    if (results.length > 0) {
      res.render('individualStats.ejs', { movies: results, title: `${property} : ${value}`, friend_requests: req.user.friend_requests });
    } else {
      res.redirect('/');
    }
  });

module.exports = statisticRouter;
