const User = require('../schemas/user.js');
const debug = require('debug')('index');

const addMovie = (userId, movieId) => { // function for adding a new movie to the user's movie list
  User.findOne({ _id: userId }, (err, user) => {
    if (err) return error;
    if (user.movies.indexOf(movieId) === -1) {
      user.movies.push(movieId);
      user.save((err) => {
        if (err) debug(err);
      });
    }
  });
};

const removeMovie = (userId, movieId) => {
  User.findOne({ _id: userId }, (err, user) => {
    if (err) return error;
    user.movies.splice(user.movies.indexOf(movieId), 1);
    user.save((err) => {
      if (err) return debug(err);
    });
  });
};

const findByEmail = (email) => User.findOne({ email }, (err, user) => {
  if (err) return { err };
  if (user) {
    return { _id: user._id };
  }
  return null;
}).lean();

const resetPassword = (_id, password) => User.findOne({ _id }, (err, user) => {
  if (err) return { err };
  user.password = password;
  return user.save((err) => err);
});

const addReview = async (_id, movieId, reviewId) => {
  const data = await User.findOne({ _id }).select('upvoted_reviews');
  if (data.upvoted_reviews.length === 0) { // no upvoted reviews
    data.upvoted_reviews.push({
      movie_id: movieId,
      reviews: [reviewId],
    });
  } else {
    // history found
    const movie = data.upvoted_reviews.findIndex((e) => e.movie_id.toString() === movieId.toString());
    if (movie > -1) {
      // movie found
      data.upvoted_reviews[movie].reviews.push(reviewId);
    } else {
      // new movie made
      data.upvoted_reviews.push({
        movie_id: movieId,
        reviews: [reviewId],
      });
    }
  }
  data.save((err) => {
    if (err) debug(err);
  });
};

const removeReview = async (_id, movieId, reviewId) => {
  const data = await User.findOne({ _id }).select('upvoted_reviews'); // find reviews
  if (data.upvoted_reviews.length === 0) { // no upvoted reviews
    return false;
  }
  // history found
  const movie = data.upvoted_reviews.findIndex((e) => e.movie_id.toString() === movieId.toString()); // find the target movie data
  if (movie > -1) {
    // movie found
    data.upvoted_reviews[movie].reviews.splice(data.upvoted_reviews[movie].reviews.indexOf(reviewId), 1); // remove the review
    return await data.save((err) => { // save the user's review data
      if (err) debug(err);
    });
  }
  return false;
};

const flushReviews = (_id) => User.findOne({ _id }, (err, user) => {
  debug(user.upvoted_reviews);
  user.upvoted_reviews = [];
  user.save();
});

module.exports = {
  addMovie,
  removeMovie,
  findByEmail,
  resetPassword,
  addReview,
  removeReview,
  flushReviews,
};
