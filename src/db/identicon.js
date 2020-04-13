const crypto = require('crypto');

const hashToHSL = (hash) => {
  const hue = parseInt(hash.substring(-7), 16) % 360;
  return `hsl(${hue}, 50%, 65%)`;
};

const generate = (username) => {
  const hash = crypto.createHash('md5').update(username).digest('hex');
  const hsl = hashToHSL(hash);

  const tilemap = [];
  let row;
  let reverse;
  for (let i = 0; i < 5; i++) {
    row = [];
    reverse = [];
    for (let j = 0; j < 3; j++) {
      if (parseInt(hash.charAt(i * 3 + j), 16) % 2) {
        row.push(0);
        if (j < 2) reverse[1 - j] = 0;
      } else {
        row.push(1);
        if (j < 2) reverse[1 - j] = 1;
      }
    }
    tilemap.push(row.concat(reverse));
  }

  return {
    color: hsl,
    tilemap,
  };
};

module.exports = generate;
