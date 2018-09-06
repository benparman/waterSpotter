'use strict';

exports.DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost/water-spotter';
exports.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'mongodb://ben:password1@ds247852.mlab.com:47852/test-water-spotter';
exports.PORT = process.env.PORT || 3000;
exports.JWT_SECRET = process.env.JWT_SECRET;
exports.JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';
