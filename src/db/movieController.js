const Movie = require('../schemas/movie.js');
const debug = require('debug')('index');

const addMovie = (movieData) => {
  const newMovie = new Movie(movieData);
  newMovie.save((err) => {
    if (err) debug(err);
  });
  return newMovie._id;
};

const findMovieByTitle = async (title) => {
  const movie = Movie.findOne({ title }, (err, movie) => {
    if (err) return err;
    return movie;
  }).lean();
  return movie;
};

const removePresence = async (userId, movieId) => {
  Movie.findOne({ _id: movieId }, (err, movie) => {
    if (err) return debug(err);
    let loopLength = movie.ratings.length;
    for (let i = 0; i < loopLength; i++) {
      if (movie.ratings[i].user_id.toString() === userId.toString()) {
        movie.ratings.splice(i, 1);
        i--;
        loopLength--;
      }
    }
    loopLength = movie.themes.length;
    for (let i = 0; i < loopLength; i++) {
      if (movie.themes[i].user_id.toString() === userId.toString()) {
        movie.themes.splice(i, 1);
        i--;
        loopLength--;
      }
    }
    loopLength = movie.date_added.length;
    for (let i = 0; i < loopLength; i++) {
      if (movie.date_added[i].user_id.toString() === userId.toString()) {
        movie.date_added.splice(i, 1);
        i--;
        loopLength--;
      }
    }

    movie.save((err) => {
      if (err) debug(err);
    });
  });
};

const addRating = (ratings, movieId) => {
  Movie.findOne({ _id: movieId }, (err, movie) => {
    if (err) return err;
    movie.ratings.push(ratings);
    movie.save((err) => err);
  });
};

const addThemes = (themes, movieId) => {
  Movie.findOne({ _id: movieId }, (err, movie) => {
    if (err) return err;
    movie.themes.push(themes);
    movie.save((err) => err);
  });
};

const addDates = (dates, movieId) => {
  Movie.findOne({ _id: movieId }, (err, movie) => {
    if (err) return err;
    movie.date_added.push(dates);
    movie.save((err) => err);
  });
};

const getRatings = (movie, userId) => {
  for (let i = 0; i < movie.ratings.length; i++) {
    if (movie.ratings[i].user_id === userId.toString()) {
      return movie.ratings[i];
    }
  }
  return null;
};

const getThemes = (movie, userId) => {
  for (let i = 0; i < movie.themes.length; i++) {
    if (movie.themes[i].user_id === userId.toString()) {
      return movie.themes[i];
    }
  }
  return null;
};

const getDates = (movie, userId) => {
  for (let i = 0; i < movie.date_added.length; i++) {
    if (movie.date_added[i].user_id === userId.toString()) {
      return movie.date_added[i];
    }
  }
  return null;
};

const filterByUser = (movie, userId) => {
  const ratings = getRatings(movie, userId);
  const themes = getThemes(movie, userId);
  const date_added = getDates(movie, userId);
  if (ratings && themes && date_added) {
    const movieData = {
      title: movie.title,
      year: movie.year,
      rated: movie.rated,
      genres: movie.genres,
      director: movie.director,
      director_gender: movie.director_gender,
      writer_gender: movie.writer_gender,
      writer: movie.writer,
      plot: movie.plot,
      entertainment_rating: ratings.entertainment_rating,
      plot_rating: ratings.plot_rating,
      style_rating: ratings.style_rating,
      bias_rating: ratings.bias_rating,
      total_rating: ratings.total_rating,
      themes: themes.themes,
      runtime: movie.runtime,
      poster: movie.poster,
      date_added,
      reviews: movie.reviews,
      _id: movie._id,
    };

    return movieData;
  }
  return {};
};

const findMoviesByUser = async (movieList, userId) => {
  const movies = await Movie.find().where('_id').in(movieList).lean()
    .exec();
  const filteredMovies = movies.map((movie) => filterByUser(movie, userId));
  return filteredMovies;
};

const getAllMovies = async () => await Movie.find();

const findMovieById = async (_id) => {
  const movie = await Movie.findOne({ _id }, (err, hit) => {
    if (err) return err;
    return hit;
  }).lean();
  return movie;
};

const updateMovieRating = async (ratings, themes, userId, _id) => {
  Movie.findOne({ _id }, (err, movie) => {
    if (err) return err;
    if (movie) {
      for (let i = 0; i < movie.ratings.length; i++) {
        if (movie.ratings[i].user_id.toString() === userId.toString()) {
          movie.ratings[i] = ratings;
        }
      }
      for (let i = 0; i < movie.themes.length; i++) {
        if (movie.themes[i].user_id.toString() === userId.toString()) {
          movie.themes[i] = themes;
        }
      }
      return movie.save((err) => err);
    }
    return 'no movie found';
  });
};

const addReview = async (review, userId, username, _id) => {
  const movie = await Movie.findOne({ _id });
  if (movie) {
    movie.reviews.push({
      review,
      user_id: userId,
      username,
    });
    await movie.save((err) => err);
    return movie;
  }
};

const deleteReview = async (_id, review_id, username) => {
  const reviews = await Movie.findOne({ _id }).select('reviews');
  const target = reviews.reviews.find((e) => e._id.toString() === review_id.toString());
  if (target.username === username) { // validated
    const users = target.upvoted_by;
    reviews.reviews.splice(reviews.reviews.indexOf(target), 1);
    await reviews.save((err) => {
      if (err) debug(err);
    });
    return users;
  }
  return [];
};

const upvoteReview = async (_id, reviewId, userId) => {
  const movie = await Movie.findOne({ _id }).select('reviews');
  const reviewIndex = movie.reviews.findIndex((e) => e._id.toString() === reviewId.toString());
  if (movie.reviews[reviewIndex].upvoted_by.indexOf(userId) === -1) {
    movie.reviews[reviewIndex].upvotes++;
    movie.reviews[reviewIndex].upvoted_by.push(userId);
    return await movie.save((err) => {
      if (err) debug(err);
    });
  }
  debug('already upvoted');
};

const downvoteReview = async (_id, reviewId, userId) => {
  const movie = await Movie.findOne({ _id }).select('reviews'); // get the reviews
  const reviewIndex = movie.reviews.findIndex((e) => e._id.toString() === reviewId.toString()); // find the target review
  if (movie.reviews[reviewIndex].upvoted_by.indexOf(userId) != -1) { // if the user has upvoted the review
    movie.reviews[reviewIndex].upvotes -= 1;
    movie.reviews[reviewIndex].upvoted_by.splice(movie.reviews[reviewIndex].upvoted_by.indexOf(userId), 1);
    return await movie.save((err) => {
      if (err) debug(err);
    });
  }
  debug('already downvoted');
};

const updateReview = async (_id, reviewId, username, review) => {
  const movie = await Movie.findOne({ _id }).select('reviews');
  const reviewIndex = movie.reviews.findIndex((e) => e._id.toString() === reviewId.toString());
  if (movie.reviews[reviewIndex].username === username) {
    debug('movie found and validated');
    movie.reviews[reviewIndex].review = review;
    return await movie.save((err) => {
      if (err) debug(err);
    });
  }
  return false;
};


module.exports = {
  addMovie,
  findMovieByTitle,
  addRating,
  addThemes,
  addDates,
  findMoviesByUser,
  removePresence,
  getAllMovies,
  findMovieById,
  filterByUser,
  updateMovieRating,
  addReview,
  deleteReview,
  upvoteReview,
  downvoteReview,
  updateReview,
};
