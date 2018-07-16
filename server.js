'use strict';

const express = require('express');
const app = express();
app.use(express.static('public'));
app.listen(process.env.PORT || 3000, function() {
  console.info(`Application is listening on ${this.address().port}`);
});


module.exports = app;
// console.log(process.env.PORT);