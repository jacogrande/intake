const axios = require('axios');
const debug = require('debug')('index');

let omdb_api_key = '';
let tmdb_api_key = '';

if (process.env.NODE_ENV === 'production') {
  omdb_api_key = process.env.OMDB_API_KEY;
  tmdb_api_key = process.env.TMDB_API_KEY;
} else if (process.env.NODE_ENV === 'dev') {
  const config = require('../../config.js');
  omdb_api_key = config.OMDB_API_KEY;
  tmdb_api_key = config.TMDB_API_KEY;
}


// omdb api module
const Omdb = () => {
  const fetch = async (imdbid) => {
    let movieData = null;
    let url = `http://www.omdbapi.com/?apikey=${omdb_api_key}&i=${imdbid}`;
    try { // try and get movie data using imdbid
      movieData = await axios.get(url);
      movieData = movieData.data;
      debug(movieData.Type);
      if (movieData.Type != 'movie') {
        throw 'not a movie';
      }
    } catch (err) {
      return {
        err,
      };
    }
    // debug(movieData);
    url = `https://api.themoviedb.org/3/find/${imdbid}?api_key=${tmdb_api_key}&language=en-US&external_source=imdb_id`;
    try { // try and get the path to the movie poster from tmdb api
      let posterData = await axios.get(url);
      posterData = posterData.data.movie_results[0].poster_path;
      movieData.poster = `https://image.tmdb.org/t/p/w342/${posterData}`;
    } catch (err) {
      throw err;
    }
    return movieData;
  };
  const getMovies = async (title) => {
    const url = `http://www.omdbapi.com/?apikey=${omdb_api_key}&s=${encodeURI(title)}`;
    try { // try to get the imdbid from omdb api
      imdbid = await axios.get(url);
      return imdbid.data.Search;
    } catch (err) {
      throw err;
    }
  };
  return {
    fetch,
    getMovies,
  };
};

module.exports = Omdb();
