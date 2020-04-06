const addTheme_edit = (value) => {
  const themeWrapper = document.getElementById('editThemeWrapper');

  const theme = document.createElement('input');
  theme.className = 'theme_input';
  if (value) theme.value = value;
  themeWrapper.appendChild(theme);
  const themeDeleter = document.createElement('span');
  themeDeleter.className = 'theme_deleter';
  themeDeleter.innerHTML = 'x';
  const br = document.createElement('br');
  themeDeleter.addEventListener('click', (e) => {
    themeWrapper.removeChild(theme);
    themeWrapper.removeChild(e.srcElement);
    themeWrapper.removeChild(br);
    removeTheme(themeWrapper, theme, src, br);
  });
  themeWrapper.appendChild(themeDeleter);
  themeWrapper.appendChild(br);
};

const removeTheme = (wrapper, theme, src, br) => {
  wrapper.removeChild(theme);
  wrapper.removeChild(src);
  wrapper.removeChild(br);
};

const updateRating = () => {
  // get inputted ratings
  const entertainment_rating = parseInt(document.getElementById('entertainment_rating_edit').value) || 0;
  const plot_rating = parseInt(document.getElementById('plot_rating_edit').value) || 0;
  const style_rating = parseInt(document.getElementById('style_rating_edit').value) || 0;
  const bias_rating = parseInt(document.getElementById('bias_rating_edit').value) || 0;

  // get inputted themes
  const themes = [];
  const themeInputs = document.getElementById('editThemeWrapper').getElementsByTagName('input');
  for (let i = 0; i < themeInputs.length; i++) {
    if (themeInputs[i].value) themes.push(themeInputs[i].value);
  }

  loadingScreen();

  fetch('', {
    method: 'post',
    body: JSON.stringify({
      entertainment_rating, plot_rating, style_rating, bias_rating, themes,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  }).then(async (response) => {
    const serverResponse = await response.json();
    if (serverResponse) {
      window.location.reload();
    }
  });
};
