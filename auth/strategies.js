'use strict';

const { Strategy: localStrategy } = require('passport-local');

//Use destructuring assignment to export to JwtStrategy
const {Strategy: JwtStrategy, ExtractJwt} = require('passport-jwt');

const { User } = require('../users/models');
const {JWT_SECRET } = require('../config');

const localStrategy = new localStrategy((username, password, callback) => {
  let user;
  USER.findOne({ username: username})
  .then(_user => {
    user = _user;
    if (!user) {
      // Returns a rejected promise to exit .then chain
      return Promise.reject({
        reason: 'LoginError',
        message: 'Incorrect username or password'
      });
    }
    return user.validatePassword(password);
  })
  .then(isValid => {
    if (!isValid) {
      return Promise.reject({
        reason: 'LoginError',
        message: 'Incorrect username or password'
      });
    }
    return callback(null, user);
  })
  .catch(err => {
    if (err.reason === 'LoginError') {
      return callback(null, false, err);
    }
    return callback(err, false);
  });
});

const jwtStrategy = new JwtStrategy(
  {
    secretOrKey: JWT_SECRET,
    //Looks for a JWT as a Bearer auth token
    jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('Bearer'),
    // Specifies that only HS256 tokens are permitted
    algorithm: ['HS256']
},
  (payLoad, done) => {
    done(null, payload.user);
  }
)

module.exports = { localStrategy, jwtStrategy };