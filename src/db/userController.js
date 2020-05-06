const User = require('../schemas/user.js');
const debug = require('debug')('index');
const identicon = require('./identicon.js');
const mongoose = require('mongoose');

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

const createReview = async (reviewId, _id) => {
  debug(`review created by user with id: ${_id}`);
  const user = await User.findOne({ _id }).select('reviews');
  if (user.reviews.indexOf(reviewId) === -1) {
    user.reviews.push(reviewId);
    await user.save((err) => {
      if (err) {
        debug(err);
        throw err;
      }
    });
  }
};

const deleteReview = async (reviewId, _id) => {
  const user = await User.findOne({ _id }).select('reviews');
  if (user.reviews.indexOf(reviewId) != -1) {
    debug(`deleting review by user with id: ${_id}`);
    user.reviews.splice(user.reviews.indexOf(reviewId), 1);
    user.save();
  }
};

const flushReviews = (_id) => User.findOne({ _id }, (err, user) => {
  debug(user.upvoted_reviews);
  user.upvoted_reviews = [];
  user.save();
});

const createAvatar = async (_id, username) => {
  const user = await User.findOne({ _id }).select('avatar');
  const avatar = identicon(username);
  if (avatar.color && avatar.tilemap) {
    user.avatar = avatar;
    await user.save((err) => {
      if (err) {
        debug(err);
        throw err;
      }
    });
    debug(avatar);
    return avatar;
  }
};

const findLikeNames = async (username, friends) => {
  const users = await User.find({
    username: new RegExp(username, 'i'),
    _id: { $nin: friends.map((friendId) => mongoose.Types.ObjectId(friendId)) },
  }).select('username avatar movies').lean();
  return users;
};

const getPublicInfo = async (username) => {
  const user = await User.findOne({ username }).select('avatar movies friends reviews date_registered').lean();
  if (!user.reviews) user.reviews = [];
  return user;
};

const getPublicInfoById = async (_id) => {
  const user = await User.findOne({ _id }).select('avatar movies username').lean();
  if (!user.reviews) user.reviews = [];
  return user;
};


const makeFriendRequest = async (_id, userId) => {
  const target = await User.findOne({ _id }).select('friend_requests');
  if (target.friend_requests.indexOf(userId) === -1) {
    target.friend_requests.push(userId);
    await target.save();
    console.log('friend request made');
    return true;
  }
  throw new Error('Friend request already sent.');
};

const populateFriendRequests = async (friendRequests) => await User.find({ _id: { $in: friendRequests.map((request) => mongoose.Types.ObjectId(request)) } }).select('avatar movies username').lean();
const populateFriends = async (friends) => await User.find({ _id: { $in: friends.map((request) => mongoose.Types.ObjectId(request)) } }).select('avatar username').lean();

const acceptFriendRequest = async (_id, userId) => {
  const user = await User.findOne({ _id }).select('friends');
  if (!user.friends) {
    user.friends = [];
    console.log(user);
  }
  if (user.friends.indexOf(userId) === -1) {
    user.friends.push(userId);
    await user.save();
  } else {
    throw new Error('Friend already added.');
  }
};

module.exports = {
  addMovie,
  removeMovie,
  findByEmail,
  resetPassword,
  addReview,
  removeReview,
  flushReviews,
  createAvatar,
  findLikeNames,
  getPublicInfo,
  createReview,
  deleteReview,
  makeFriendRequest,
  populateFriendRequests,
  populateFriends,
  acceptFriendRequest,
  getPublicInfoById,
};
