'use strict';
const {router} = require('./router');
const {localStrategy, jwtStrategy} = require('./strategies');

console.log("This is localStrategy :", localStrategy);

module.exports = {router, localStrategy, jwtStrategy};
