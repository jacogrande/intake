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
      cacheData[i].entertainment_rating = ratings.entertainment_rating;
      cacheData[i].plot_rating = ratings.plot_rating;
      cacheData[i].style_rating = ratings.style_rating;
      cacheData[i].bias_rating = ratings.bias_rating;
      cacheData[i].total_rating = ratings.total_rating;
      cacheData[i].themes = themes.themes;
      cache.del(userId.toString());
      cacheMovieList(userId, cacheData);
      return true;
    }
  }
  return false;
};

const addReview = (userId, username, review, _id, reviewId) => {
  debug('adding review');
  const cacheData = checkCache(userId);
  if (cacheData) {
    for (let i = 0; i < cacheData.length; i++) {
      if (cacheData[i]._id.toString() === _id.toString()) {
        cacheData[i].reviews.push({
          review,
          user_id: userId,
          username,
          upvotes: 0,
          _id: reviewId,
        });
        cache.del(userId.toString());
        cacheMovieList(userId, cacheData);
      }
    }
  }
};

const deleteReview = (_id, reviewId, username, userId) => {
  debug('deleting review');
  const cacheData = checkCache(userId);
  if (cacheData) {
    for (let i = 0; i < cacheData.length; i++) {
      if (cacheData[i]._id.toString() === _id.toString()) {
        for (let j = 0; j < cacheData[i].reviews.length; j++) {
          if (cacheData[i].reviews[j]._id.toString() === reviewId.toString() && cacheData[i].reviews[j].username === username) {
            cacheData[i].reviews.splice(j, 1);
            break;
          }
        }
      }
    }
    cache.del(userId.toString());
    cacheMovieList(userId, cacheData);
  }
};

const updateReview = (_id, reviewId, username, userId, updatedReview) => {
  const cacheData = checkCache(userId);
  if (cacheData) {
    const movie = cacheData.findIndex((e) => e._id.toString() === _id.toString());
    if (cacheData[movie]) {
      const review = cacheData[movie].reviews.findIndex((e) => e._id.toString() === reviewId.toString() && e.username === username);
      if (review != -1) {
        debug('review updated in cache');
        cacheData[movie].reviews[review].review = updatedReview;
        cache.del(userId.toString());
        cacheMovieList(userId, cacheData);
      }
    }
  }
};

const clearCache = (userId) => {
  cache.del(userId.toString());
};

module.exports = {
  cacheMovieList,
  checkCache,
  addMovie,
  removeMovie,
  updateRating,
  addReview,
  deleteReview,
  clearCache,
  updateReview,
};
