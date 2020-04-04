const logout = () => {
  window.location.pathname = '/logout';
};

const deleteAccount = (username) => {
  if (document.getElementById('username_confirmation').value === username) {
    fetch('/delete', {
      method: 'delete',
    }).then((response) => {
      window.location.pathname = '/login';
    });
  } else {
    document.getElementById('username_mismatch').style.visibility = 'visible';
  }
};
