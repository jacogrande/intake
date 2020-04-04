const invalidateLogin = () => {
  document.getElementById('invalid_label').style.opacity = 1;
  document.getElementById('password_input').value = '';
};

function validateEmail(email) {
  if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    return true;
  }
  return false;
}

const login = async () => {
  document.getElementById('invalid_label').style.opacity = 0;
  const username = document.getElementById('username_input').value;
  const password = document.getElementById('password_input').value;

  const serverResponse = await fetch('/login', { // send post request
    method: 'post',
    body: JSON.stringify({ username, password }),
    headers: {
      'Content-Type': 'application/json',
    },
  }).then((response) => {
    if (response.redirected) {
      return 'failure';
    }
    return response.json();
  });

  if (serverResponse === 'failure') {
    invalidateLogin();
  } else if (serverResponse.success) {
    window.location.pathname = '/movies';
  }
};

const register = async () => { // function for registering users
  // get form data
  const username = document.getElementById('username_modal_input').value;
  const email = document.getElementById('email_modal_input').value;
  const password = document.getElementById('password_modal_input').value;
  const valid_email = validateEmail(email);

  if (!valid_email) {
    document.getElementById('invalid_modal_label').innerHTML = 'Invalid email';
    document.getElementById('invalid_modal_label').style.opacity = 1; // notify the user of the error
    return false;
  }

  // make a request to the server
  const serverResponse = await fetch('/register', {
    method: 'post',
    body: JSON.stringify({ username, password, email }),
    headers: {
      'Content-Type': 'application/json',
    },
  }).then((response) => response.json());

  if (serverResponse.error) { // check for errors
    document.getElementById('invalid_modal_label').innerHTML = serverResponse.error.message;
    document.getElementById('invalid_modal_label').style.opacity = 1; // notify the user of the error
    return false;
  }
  if (serverResponse.success) { // if the registration succeeds
    window.location.pathname = '/movies';
  } else { // otherwise
    document.getElementById('invalid_modal_label').innerHTML = 'That username is not available';
    document.getElementById('invalid_modal_label').style.opacity = 1; // notify the user
  }
};

const resetPassword = () => {
  loadingScreen();
  const email = document.getElementById('email_reset_input').value;
  fetch('/passwordReset', {
    method: 'post',
    body: JSON.stringify({ email }),
    headers: {
      'Content-Type': 'application/json',
    },
  }).then((response) => {
    console.log(response);
    email.value = '';
    document.getElementById('resetSuccess').style.visibility = 'visible';
    removeLoadingScreen();
  });
};

const submitNewPassword = () => {
  loadingScreen();
  const password = document.getElementById('new_password_input').value;
  const confirmation = document.getElementById('password_confirmation_input');

  if (password != confirmation.value) {
    console.log('tough');
    document.getElementById('passwords_dont_match').style.visibility = 'visible';
    confirmation.value = '';
    return removeLoadingScreen();
  }

  fetch('', {
    method: 'post',
    body: JSON.stringify({ password }),
    headers: {
      'Content-Type': 'application/json',
    },
  }).then((response) => window.location.pathname = '/login');
};
