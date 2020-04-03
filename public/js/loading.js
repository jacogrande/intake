const loadingScreen = (background) => {
  if (background) {
    document.getElementById('main').style.visibility = 'hidden';
    document.getElementById('main').style.opacity = 0;
  } else {
    document.getElementById('page').style.filter = 'blur(10px)';
  }
  document.getElementById('loadingScreen').style.display = 'block';
};
const removeLoadingScreen = () => {
  document.getElementById('loadingScreen').style.display = 'none';
  document.getElementById('page').style.filter = '';
  document.getElementById('main').style.visibility = 'visible';
  document.getElementById('main').style.opacity = 1;
};
