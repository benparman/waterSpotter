'use strict';

const express = require('express');
const app = express();
const { Location } = require('./models');
const { PORT, DATABASE_URL } = require('./config');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

app.use(express.static('public'));
app.use(express.json());

//---------GET---------
app.get('/locations', (req, res) => {
  Location
    .find()
    .then(locations => {
      res.json({
        locations: locations.map(
          (location) => location.serialize())
      });
      console.log('GET Request sent to /\'locations\' endpoint')
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal server error'});
    });
});

// //---------GET by ID---------
// app.get('/locations:id', (req, res) => {
//   Location
//     .findById(req.params.id)
//     .then(location => res.json(location.serialize()))
//     .catch(err => {
//       console.error(err);
//       res.status(500).json({error: 'There was a problem with your request'});
//     });
// });

//---------POST---------
app.post('/locations', (req, res) => {
  const requiredFields = ['contributor', 'lat', 'lon', 'type', 'verified'];
  for (let i=0; i<requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing '${field}' in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
  }
  Location
    .create({
      contributor: req.body.contributor,
      lat: req.body.lat,
      lon: req.body.lon,
      date_added: req.body.date_added,
      id: req.body.id,
      type: req.body.type,
      verified: req.body.verified
    })
    .then(location => res.status(201).json(location.serialize()))
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'There was a problem with your request' });
    });
});




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