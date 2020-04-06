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
  cacheMovieList(userId, cacheData);
};

const removeMovie = (userId, id) => {
  const cacheData = checkCache(userId);
  cacheData.splice(cacheData.findIndex((v) => v._id === id), 1);
  cache.del(userId.toString());
  cacheMovieList(userId, cacheData);
};

const updateRating = (userId, movieId, ratings, themes) => {
  debug('updating rating');
  const cacheData = checkCache(userId);
  for (let i = 0; i < cacheData.length; i++) {
    if (cacheData[i]._id.toString() === movieId.toString()) {
      cacheData[i].ratings = ratings;
      cacheData[i].themes = themes;
      cache.del(userId.toString());
      cacheMovieList(cacheData);
      return true;
    }
  }
  return false;
};

module.exports = {
  cacheMovieList,
  checkCache,
  addMovie,
  removeMovie,
  updateRating,
};
