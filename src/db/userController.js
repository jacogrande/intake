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

const isViewed = async (userId, movieId) => { // function to check if a movie has been viewed by the specified user
  const user = await User.findOne({ _id: userId }, (err) => {
    if (err) return err;
  });
  if (user.movies.indexOf(movieId) === -1) {
    return false;
  }
  return true;
};

const getMovies = async (userId) => {
  const foundUser = await User.findOne({ _id: userId }, (err, user) => {
    if (err) throw err;
  });

  return foundUser.movies;
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
  return { _id: user._id };
});

const resetPassword = (_id, password) => User.findOne({ _id }, (err, user) => {
  if (err) return { err };
  user.password = password;
  return user.save((err) => err);
});

module.exports = {
  addMovie,
  isViewed,
  getMovies,
  removeMovie,
  findByEmail,
  resetPassword,
};
