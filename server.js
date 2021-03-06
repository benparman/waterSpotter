'use strict';

require('dotenv').config();
const express = require('express');
const app = express();
const { PORT, DATABASE_URL } = require('./config');
const mongoose = require('mongoose');
const morgan = require('morgan');
const passport = require('passport');
mongoose.Promise = global.Promise;

app.use(express.static('public'));
app.use(express.json());
app.use(morgan('common'));

//Import Locations, Auth, and Users routers
const {users} = require('./users');
const {authRouter, localStrategy, jwtStrategy} = require('./auth');
const {locationRouter} = require('./locations/index.js');

//----------- CORS -------------
app.use(function(req,res,next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Acces-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
  if (req.method === 'OPTIONS') {
    return res.send(204);
  }
  next();
});

passport.use(localStrategy);
passport.use(jwtStrategy);
app.use('/api/users/', users);
app.use('/api/auth/', authRouter);
app.use('/api/locations/', locationRouter);

let server;
function runServer(databaseUrl, port = PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if(err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Water Spotter is listening on port: ${port}`);
        resolve();
      })
        .on('error', err => {
          mongoose.disconnect();
          reject(err);
        });
    });
  });
}
function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing Water Spotter Server');
      server.close(err => {
        if(err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

if (require.main === module) {
  runServer(DATABASE_URL).catch(err => console.error(err));
}
module.exports = {app, runServer, closeServer};
