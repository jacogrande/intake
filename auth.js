const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./src/schemas/user.js');

const validateEmail = (email) => {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

passport.use(new LocalStrategy(async (username, password, done) => { // add local strategy for logging in
  let user;
  try {
    if (validateEmail(username)) { // sign in with email
      user = await User.findOne({ email: username });
    } else {
      user = await User.findOne({ username });
    }
  } catch (err) {
    return done(err);
  }

  console.log(user);
  if (!user) return done(null, false);
  await user.verifyPassword(password, (err, isMatch) => {
    if (err) return done(err);
    if (!isMatch) return done(null, false);
    return done(null, user);
  });

  //
  //   User.findOne({ username }, (err, user) => { // find the specified user
  //     if (err) return done(err);
  //     if (!user) return done(null, false);
  //     const verify = user.verifyPassword(password, (err, isMatch) => { // verify their password
  //       if (!isMatch) return done(null, false);
  //       return done(null, user);
  //     });
  //   });
  // }
}));

passport.serializeUser((user, done) => { // serialize user method
  done(null, user.id);
});

passport.deserializeUser((id, done) => { // deserialize user method
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

passport.isAuthenticated = (req, res, next) => {
  if (req.user != null) {
    next();
  } else {
    return res.status(401).redirect('/login');
  }
};

module.exports = passport;
