'use strict';

require('dotenv').config();
const express = require('express');
const app = express();
const { Location } = require('./models');
const { PORT, DATABASE_URL } = require('./config');
const mongoose = require('mongoose');
const morgan = require('morgan');
const passport = require('passport');
mongoose.Promise = global.Promise;

app.use(express.static('public'));
app.use(express.json());
app.use(morgan('common'));
//Using destructuring assignment, and renaming veriables from ./users and ./auth
const {router: usersRouter } = require('./users');
const {router: authRouter, localStrategy, jwtStrategy} = require('./auth');

console.log('server.js line 20 - This is LOCAL STRATEGY ', localStrategy);

//**************CORS
app.use(function(req,res,next) {
  res.header('Access-Control-Allow-Origin', '*'); //what does the asterisk mean?
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Acces-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
  if (req.method === 'OPTIONS') {
    return res.send(204);
  }
  next();
});

passport.use(localStrategy);
passport.use(jwtStrategy);

console.log('SERVER.JS LINE 35 - This is usersRouter: ', usersRouter);
app.use('/api/users/', usersRouter);
app.use('/api/auth/', authRouter);

const jwtAuth = passport.authenticate('jwt', {
  session: false
});

//---This is a protected endpoint, just for the sake of testing, not needed for app
app.get('/api/protected', jwtAuth, (req, res) => {
  return res.json({
    data: 'Congratulations, you\'ve hacked into burger king.'
  });
});

//******************


//---------GET---------
app.get('/locations', (req, res) => {
  Location
    .find()
    .then(locations => {
      res.json(locations.map((location) => location.serialize()));
      console.log('GET Request sent to /\'locations\' endpoint');
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal server error'});
    });
});

//---------GET by ID---------
app.get('/locations/:id', (req, res) => {
  Location
    .findById(req.params.id)
    .then(location => res.json(location.serialize()))
    .catch(err => {
      console.error(err);
      res.status(500).json({error: 'There was a problem with your request'});
    });
});

//---------POST---------
app.post('/locations', (req, res) => {
  const requiredFields = ['title', 'description', 'contributor', 'coordinates', 'type'];
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
      title: req.body.title,
      description: req.body.description,
      contributor: req.body.contributor,
      coordinates: {
        lat: req.body.coordinates.lat,
        lon: req.body.coordinates.lon
      },
      date_added: req.body.date_added,
      id: req.body.id,
      type: req.body.type,
      verified: false //This will always start as false, will be verified by other users.
    })
    .then(location => {
      res.status(201).json(location.serialize());
      console.log('POST to /locations/ was successful.');
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'There was a problem with your request' });
    });
});

//---------DELETE---------
app.delete('/locations/:id', (req, res) => {
  Location
    .findByIdAndRemove(req.params.id)
    .then(() => {
      // console.log('THIS IS THE RESPONSE === ', res);
      res.status(200).json({message: `Location with ID ${req.params.id} removed successfully!`});
      console.log(`Location with ID ${req.params.id} removed successfully!`);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Something went wrong, and the item was not deleted'});
    });
});

//---------PUT---------
app.put('/locations/:id', (req, res) => {
  if(!(req.params.id === req.body.id)) {
    res.status(400).json({
      error: 'Request path id, and request body id must match!'
    });
  }
  const updated = {};
  const updatedFields = ['title', 'description', 'contributor', 'coordinates', 'type', 'verified'];
  updatedFields.forEach(field => {
    if (field in req.body) {
      updated[field] = req.body[field];
    }
  });

  Location
    .findByIdAndUpdate(req.params.id, { $set: updated }, {new: true})
    .then(location => {
      res.json({'Location successfully updated': {location}});
    })
    .catch(err => res.status(500).json({ message: 'There was a problem with your request'}));
});

app.get('*', (req, res) => res.send('ok'));

let server;

function runServer(databaseUrl, port = PORT) {
  console.log('server.js - databaseUrl from line 153: ', databaseUrl);
  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      console.log('**********databaseUrl*********** server.js line 160: ', databaseUrl);
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
