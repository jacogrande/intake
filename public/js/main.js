// post function
const post = (url, data) => {
  fetch(url, {
    method: 'post',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
  }).then((response) => response);
};

// function for focusing the textbox in the review modal
const focusModal = (id = 'review_textarea') => {
  setTimeout(() => document.getElementById(id).focus(), 500);
};

// function for submitting a review
const submitReview = async (id) => {
  const review = document.getElementById('review_textarea').value;
  document.getElementById('review_textarea').value = '';
  const response = await post(`/movies/reviews/${id}`, { review });
  const reviewSection = document.getElementById('reviewSection');
  const newReview = document.createElement('p');
  newReview.innerHTML = `<span class = 'primary padded_sm'>I said : </span> ${review} (${new Date().toDateString()})`;
  reviewSection.appendChild(newReview);
};


const deleteMovie = () => {
  fetch(window.location.href, {
    method: 'delete',
  }).then((response) => setTimeout(() => window.location.reload(), 200));
};


const rateMovie = (movie) => {
  document.getElementById('footer_main').style.visibility = 'hidden';
  document.getElementById('submit_footer').style.visibility = 'visible';
  document.getElementById('search_page_2').style.display = 'none';
  const movieDisplay = document.getElementById('search_page_3');
  movieDisplay.style.display = 'block';

  document.getElementById('search_poster_wrapper').innerHTML = `<img src = ${movie.Poster} class = 'poster clicker_cursor' />`;
  document.getElementById('submitButton').onclick = () => addMovie(movie.imdbID);
};

const displayMovieList = (movies) => {
  document.getElementById('search_page_1').style.visibility = 'hidden';
  const movieDisplay = document.getElementById('search_page_2');
  movieDisplay.style.display = 'block';

  let newRow = null;

  if (movies) {
    for (let i = 0; i < movies.length; i++) {
      if (movies[i].Poster === 'N/A') break;
      if (i % 2 === 0) {
        newRow = document.createElement('div');
        newRow.className = 'row';
        movieDisplay.appendChild(newRow);
      }

      const moviePoster = document.createElement('div');
      moviePoster.className = 'col-lg-6 col-md-6';
      moviePoster.innerHTML = `<img src = "${movies[i].Poster}" class = "poster clicker_cursor" />`;
      moviePoster.addEventListener('click', () => rateMovie(movies[i]));
      newRow.appendChild(moviePoster);
    }
  } else {
    console.log('movie not found');
  }
};

const search = async () => {
  const title = document.getElementById('searchBar').value;
  const results = await fetch(`/movies/search/${title}`).then((response) => response.json());
  displayMovieList(results.results);
};

const refreshMovieModal = () => { // cleans up the modal and refreshes it
  document.getElementById('search_page_1').style.visibility = 'visible';
  document.getElementById('search_page_3').style.display = 'none';
  document.getElementById('search_page_2').innerHTML = '';
  document.getElementById('footer_main').style.visibility = 'visible';
  document.getElementById('submit_footer').style.visibility = 'hidden';
  document.getElementById('themeWrapper').innerHTML = '';
  document.getElementById('entertainment_rating_input').value = '';
  document.getElementById('plot_rating_input').value = '';
  document.getElementById('style_rating_input').value = '';
  document.getElementById('bias_rating_input').value = '';
};

const addTheme = () => { // adds a theme input to the modal
  const themeWrapper = document.getElementById('themeWrapper');

  const theme = document.createElement('input');
  theme.className = 'theme_input';
  themeWrapper.appendChild(theme);
  const themeDeleter = document.createElement('span');
  themeDeleter.className = 'theme_deleter';
  themeDeleter.innerHTML = 'x';
  const br = document.createElement('br');
  themeDeleter.addEventListener('click', (e) => {
    themeWrapper.removeChild(theme);
    themeWrapper.removeChild(e.srcElement);
    themeWrapper.removeChild(br);
  });
  themeWrapper.appendChild(themeDeleter);
  themeWrapper.appendChild(br);
};


const addMovie = (imdbid) => {
  // get inputted ratings
  const entertainment_rating = parseInt(document.getElementById('entertainment_rating_input').value);
  const plot_rating = parseInt(document.getElementById('plot_rating_input').value);
  const style_rating = parseInt(document.getElementById('style_rating_input').value);
  const bias_rating = parseInt(document.getElementById('bias_rating_input').value);

  // get inputted themes
  const themes = [];
  const themeInputs = document.getElementById('themeWrapper').getElementsByTagName('input');
  for (let i = 0; i < themeInputs.length; i++) {
    themes.push(themeInputs[i].value);
  }

  let date = document.getElementById('viewingDate').value;
  if (date) {
    console.log('yo');
    date = new Date(date).getTime();
  } else {
    date = Date.now().toString();
  }
  fetch('/movies', {
    method: 'post',
    body: JSON.stringify({
      entertainment_rating, plot_rating, style_rating, bias_rating, themes, imdbid, date,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  }).then(async (response) => {
    const serverResponse = await response.json();
    if (serverResponse) {
      console.log(serverResponse);
      // setTimeout(() => window.location.reload(), 200);
    }
  });
};

const addListeners = () => {
  document.getElementById('entertainment_rating_input').addEventListener('change', (e) => {
    if (isNaN(parseInt(e.srcElement.value))) {
      return e.srcElement.value = '';
    }
    if (parseInt(e.srcElement.value) > 5) {
      return e.srcElement.value = '5';
    }
  });
  document.getElementById('plot_rating_input').addEventListener('change', (e) => {
    if (isNaN(parseInt(e.srcElement.value))) {
      return e.srcElement.value = '';
    }
    if (parseInt(e.srcElement.value) > 5) {
      return e.srcElement.value = '5';
    }
  });
  document.getElementById('style_rating_input').addEventListener('change', (e) => {
    if (isNaN(parseInt(e.srcElement.value))) {
      return e.srcElement.value = '';
    }
    if (parseInt(e.srcElement.value) > 5) {
      return e.srcElement.value = '5';
    }
  });
  document.getElementById('bias_rating_input').addEventListener('change', (e) => {
    if (isNaN(parseInt(e.srcElement.value))) {
      return e.srcElement.value = '';
    }
    if (parseInt(e.srcElement.value) > 5) {
      return e.srcElement.value = '5';
    }
  });
};

addListeners();


const logout = () => {
  window.location.pathname = '/logout';
};
