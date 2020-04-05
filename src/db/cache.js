const NodeCache = require('node-cache');
const debug = require('debug')('index');

const cache = new NodeCache();

const cacheMovieList = (userId, movieList) => {
  cache.set(userId.toString(), movieList, 1800);
};

const checkCache = (userId) => cache.get(userId.toString());

const addMovie = (userId, movie) => {
  const cacheData = checkCache(userId);
  cacheData.push(movie);
  cache.del(userId.toString());
  cacheMovieList(cacheData);
};

const removeMovie = (userId, movie) => {
  const cacheData = checkCache(userId);
  cacheData.splice(cacheData.findIndex((v) => v._id === movie._id), 1);
  cache.del(userId.toString());
  cacheMovieList(cacheData);
};

module.exports = {
  cacheMovieList,
  checkCache,
  addMovie,
  removeMovie,
};
