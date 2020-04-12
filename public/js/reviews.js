const setupReview = () => {
  document.getElementById('addReviewBtn').style.display = 'none';
  document.getElementById('submitReviewBtn').style.display = 'block';
  document.getElementById('reviewWrapper').style.display = 'block';
};

const submitReview = () => {
  loadingScreen();
  const reviewWrapper = document.getElementById('reviewWrapper');
  const review = reviewWrapper.value;

  fetch(`${window.location}/review`, {
    method: 'post',
    body: JSON.stringify({ review }),
    headers: {
      'Content-Type': 'application/json',
    },
  }).then((response) => {
    window.location.reload();
  });
};

document.getElementById('reviewWrapper').addEventListener('keydown', (e) => {
  if (e.keyCode === 9) {
    e.preventDefault();
    const TAB_SIZE = 4;
    // The one-liner that does the magic
    document.execCommand('insertText', false, ' '.repeat(TAB_SIZE));
  }
});

const upvote = async (target, src) => {
  const targetElem = document.getElementById(target);
  let vote = 0;

  // remove upvote
  if (src.getAttribute('activated') === 'true') {
    console.log('already activated');
    src.className = 'fa fa-thumbs-up clicker_cursor';
    targetElem.innerHTML = parseInt(targetElem.innerHTML) - 1;
    src.setAttribute('activated', 'false');
    vote = -1;
  } else {
    // upvote
    src.setAttribute('activated', 'true');
    src.className += ' upvoted';
    targetElem.innerHTML = parseInt(targetElem.innerHTML) + 1;
    vote = 1;
  }
  const response = await fetch(`${window.location}/review/${target}`, {
    method: 'post',
    body: JSON.stringify({ vote }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  console.log(response);
};

const setupDelete = (id) => {
  document.getElementById('reviewDeleter').onclick = () => deleteReview(id);
};

const deleteReview = (id) => {
  loadingScreen();
  fetch(`${window.location}/review/${id}`, {
    method: 'delete',
  }).then(async (response) => {
    await response.json();
    window.location.reload();
  });
};

const setupEdit = (id) => {
  const review = document.getElementById(`review_${id}`).innerHTML;
  document.getElementById('editReviewTextarea').value = review;
  document.getElementById('reviewEditButton').onclick = () => editReview(id);
};

const editReview = (id) => {
  loadingScreen();
  const review = document.getElementById('editReviewTextarea').value;

  fetch(`${window.location}/edit_review/${id}`, {
    method: 'post',
    body: JSON.stringify({ review }),
    headers: {
      'Content-Type': 'application/json',
    },
  }).then((response) => {
    window.location.reload();
  });
};
