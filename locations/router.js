'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const express = require('express');
const { Location } = require('./models');
const locationRouter = express.Router();
const morgan = require('morgan');
const passport = require('passport');
const { localStrategy, jwtStrategy} = require('../auth');
const jwtAuth = passport.authenticate('jwt', {session: false});

passport.use(localStrategy);
passport.use(jwtStrategy);
locationRouter.use(express.json());
locationRouter.use(morgan('common'));
locationRouter.use(function(req,res,next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Acces-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
  if (req.method === 'OPTIONS') {
    return res.send(204);
  }
  next();
});

locationRouter.get('/', (req, res) => {
  Location
    .find()
    .then(location => {
      res.json(location.map((location) => location.serialize()));
      console.log('GET Request sent to api/locations/ endpoint');
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal server error'});
    });
});
locationRouter.get('/:id', (req, res) => {
  Location
    .findById(req.params.id)
    .then(location => res.json(location.serialize()))
    .catch(err => {
      console.error(err);
      res.status(500).json({error: 'There was a problem with your request'});
    });
});
locationRouter.post('/', jwtAuth, (req, res) => {
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
      console.log('POST to api/locations/ was successful.');
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'There was a problem with your request' });
    });
});
locationRouter.delete('/:id', jwtAuth, (req, res) => {
  Location
    .findByIdAndRemove(req.params.id)
    .then(() => {
      res.status(200).json({message: `Location with ID ${req.params.id} removed successfully!`});
      console.log(`Location with ID ${req.params.id} removed successfully!`);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Something went wrong, and the item was not deleted'});
    });
});
locationRouter.put('/:id', jwtAuth, (req, res) => {
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
module.exports = {locationRouter};