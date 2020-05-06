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

const addFriend = async () => {
  const error = document.getElementById('addFriendError');
  error.style.opacity = '0';
  loadingScreen();
  const username = document.getElementById('friendSearch').value;
  const response = await fetch(`/friends/search/${username}`);

  document.getElementById('profileWrapper').className = 'no_display';

  if (response.status != 200) {
    removeLoadingScreen();
    error.innerHTML = 'Error while finding friends.';
    error.style.opacity = '1';
    return false;
  }
  let users = await response.json();
  users = users.users;

  const usersWrapper = document.getElementById('usersWrapper');
  usersWrapper.style.display = 'block';
  usersWrapper.innerHTML = '<br>';
  let avatarWrapper;
  let usernameWrapper;
  let movieCountWrapper;
  let row;
  let avatarCircle;
  let avatar;
  let link;
  users.forEach((user, i) => {
    row = document.createElement('div');
    i % 2 ? row.className = 'row vertical_padding clicker_cursor outline' : row.className = 'row dark vertical_padding clicker_cursor outline';
    row.onclick = function () {
      profilePreview(user.username);
    };

    avatarWrapper = document.createElement('div');
    avatarWrapper.className = 'col-lg-4 col-md-4';

    avatarCircle = document.createElement('div');
    avatarCircle.className = 'avatarWrapperSmall';

    avatar = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    avatar.setAttribute('class', 'avatarSmall');
    avatar.setAttribute('width', '60');
    avatar.setAttribute('height', '60');
    generateAvatar(user.avatar, avatar, 12);

    avatarCircle.appendChild(avatar);
    avatarWrapper.appendChild(avatarCircle);

    row.appendChild(avatarWrapper);

    usernameWrapper = document.createElement('div');
    usernameWrapper.className = 'col-lg-4 col-md-4';
    usernameWrapper.innerHTML = `<p class = 'bump_down_x'>${user.username}</p>`;
    row.appendChild(usernameWrapper);

    movieCountWrapper = document.createElement('div');
    movieCountWrapper.className = 'col-lg-4 col-md-4';
    movieCountWrapper.innerHTML = `<p class = 'bump_down_x primary'>Movies Seen: ${user.movies.length}</p>`;
    row.appendChild(movieCountWrapper);

    usersWrapper.appendChild(row);
  });
  removeLoadingScreen();
};

const generateAvatar = (avatar, target, size) => {
  target.innerHTML = '';
  let color;
  for (let y = 0; y < avatar.tilemap.length; y++) {
    for (let x = 0; x < avatar.tilemap[y].length; x++) {
      avatar.tilemap[y][x] === 1 ? color = avatar.color : color = 'none';
      target.innerHTML += `<rect y = '${y * size}' x = '${x * size}' width='${size}' height = '${size}' style = 'fill:${color}'></rect>`;
    }
  }
};

const formatDateRegistered = (date) => {
  const formatted = new Date(date);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const month = months[formatted.getMonth()];
  const year = formatted.getFullYear();
  return `${month}, ${year}`;
};

const profilePreview = async (username) => {
  loadingScreen();
  document.getElementById('usersWrapper').style.display = 'none';
  document.getElementById('profileWrapper').className = 'col-lg-12 col-md-12';

  const profileWrapper = document.getElementById('profileWrapper');
  let user = await fetch(`/friends/getInfo/${username}`);
  user = await user.json();

  generateAvatar(user.avatar, document.getElementById('profilePreviewAvatar'), 25);

  document.getElementById('friendRequestError').innerHTML = '';
  document.getElementById('profilePreviewUsername').innerHTML = username;
  document.getElementById('profilePreviewMoviesSeen').innerHTML = user.movies.length;
  document.getElementById('profilePreviewFriends').innerHTML = user.friends.length;
  document.getElementById('profilePreviewReviews').innerHTML = user.reviews.length;
  document.getElementById('profilePreviewDateRegistered').innerHTML = formatDateRegistered(user.date_registered);
  document.getElementById('friendAddButton').className = 'btn primary_btn';
  document.getElementById('friendAddButton').onclick = () => { sendFriendRequest(user._id); };
  document.getElementById('friendAddButton').innerHTML = 'Add Friend';

  removeLoadingScreen();
};

const sendFriendRequest = async (id) => {
  loadingScreen();
  console.log('sending friend request');
  const serverResponse = await fetch('/friends/addFriend', {
    method: 'post',
    body: JSON.stringify({ id }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (serverResponse.status === 200) {
    removeLoadingScreen();
    document.getElementById('friendAddButton').className = 'btn btn-disabled btn-secondary';
    document.getElementById('friendAddButton').onclick = () => {};
    document.getElementById('friendAddButton').innerHTML = 'Friend Request Sent';
  } else {
    removeLoadingScreen();
    document.getElementById('friendRequestError').innerHTML = 'Friend request already sent.';
  }
};

const acceptFriendRequest = async (id) => {
  loadingScreen();
  console.log('accepting friend request.');
  const serverResponse = await fetch('/friends/acceptFriendRequest', {
    method: 'post',
    body: JSON.stringify({ id }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (serverResponse.status === 200) {
    document.getElementById(`request_box_${id}`).style.display = 'none';
  } else {
    document.getElementById(`accept_warning_${id}`).innerHTML = 'Error accepting request.';
  }
  window.location.reload();
};

document.getElementById('friendSearch').addEventListener('keydown', (e) => {
  if (e.keyCode === 13) addFriend();
});
