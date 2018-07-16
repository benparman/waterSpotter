'use strict';

exports.DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost/water-spotter';
exports.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'mongodb://localhost/test-water-spotter';
exports.PORT = process.env.PORT || 8080;