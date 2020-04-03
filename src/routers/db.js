const db = {};

db.find = (movieList, id) => {
  try {
    for (let i = 0; i < movieList.length; i++) { // find the selected movie
      if (movieList[i]._id.toString() === id) {
        return movieList[i];
      }
    }
    return null;
  } catch (err) {
    throw err;
  }
};

db.getValues = (movieList, property) => {
  const data = [];

  movieList.forEach((movie) => { // loop through all movies
    if (data.indexOf(movie[property]) === -1) { // if the selected property exists
      if (movie[property] instanceof Array) {
        movie[property].forEach((value) => {
          data.push(value);
        });
      } else {
        data.push(movie[property]);
      }
    }
  });
  return data;
};

const compare = (first, second) => {
  first = new String(first).toLowerCase();
  second = new String(second).toLowerCase();
  return first === second;
};

// method for fetching a list of movies with a specific value
db.findByValue = function (movieList, property, value, extensive) {
  const results = [];
  for (let i = 0; i < movieList.length; i++) { // loop through all movies
    if (movieList[i][property] instanceof Array) { // if the specified property's value is an array
      for (let j = 0; j < movieList[i][property].length; j++) { // loop through that array
        if (compare(movieList[i][property][j], value)) { // compare the property value of the current movie to the target value
          if (extensive) { // if the returned object is extensive
            results.push(movieList[i]);
            break;
          }
          results.push({ // otherwise, push the essentials
            title: movieList[i].title, total_rating: movieList[i].total_rating, _id: movieList[i]._id, poster: movieList[i].poster,
          });
          break;
        }
      }
    } else { // if the specified property's value isn't an array
      if (compare(movieList[i][property], value)) { // compare values
        if (extensive) {
          results.push(movieList[i]);
        } else {
          results.push({
            title: movieList[i].title, total_rating: movieList[i].total_rating, _id: movieList[i]._id, poster: movieList[i].poster,
          });
        }
      }
    }
  }
  return results;
};

db.checkCredentials = (admin_key) => {
  if (process.env.NODE_ENV === 'dev') {
    if (admin_key === 'beese_churger') {
      return true;
    }
  } else if (process.env.NODE_ENV === 'production') {
    if (admin_key === process.env.ADMIN_KEY) {
      return true;
    }
  }
  return false;
};

module.exports = db;
