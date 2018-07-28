'use strict';
const {router} = require('./router');
const {localStrategy, jwtStrategy} = require('./strategies');

module.exorts = {router, localStrategy, jwtStrategy};