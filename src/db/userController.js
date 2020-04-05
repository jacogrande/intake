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

module.exports = {
  addMovie,
  removeMovie,
  findByEmail,
  resetPassword,
};
