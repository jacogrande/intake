const mongoose = require('mongoose');

mongoose.set('useCreateIndex', true);
const { Schema } = mongoose;

const MovieSchema = new mongoose.Schema({
  title: String,
  year: String,
  rated: String,
  genres: [String],
  director: [String],
  director_gender: { type: String, default: 'n/a' },
  writer_gender: { type: String, default: 'n/a' },
  writer: [String],
  plot: String,
  ratings: [{
    entertainment_rating: { type: Number, default: 0 },
    plot_rating: { type: Number, default: 0 },
    style_rating: { type: Number, default: 0 },
    bias_rating: { type: Number, default: 0 },
    total_rating: { type: Number, default: 0 },
    user_id: String,
  }],
  themes: [{
    themes: [String],
    user_id: String,
  }],
  runtime: String,
  poster: String,
  date_added: [{
    date: { type: String, default: Date.now().toString() },
    user_id: String,
  }],
  reviews: [{
    review: String,
    user_id: String,
    username: String,
    date_added: { type: String, default: Date.now().toString() },
    upvotes: { type: Number, default: 0 },
    upvoted_by: [String],
  }],
});

module.exports = mongoose.model('Movie', MovieSchema);
