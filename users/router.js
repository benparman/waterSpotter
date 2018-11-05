'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const {User} = require('./models');
const users = express.Router();
const jsonParser = bodyParser.json();

users.post('/', jsonParser, (req, res) => {
  const requiredFields = ['username', 'password', 'firstName', 'lastName'];
  const missingField = requiredFields.find(field => !(field in req.body));
  if(missingField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Missing field',
      location: missingField
    });
  }
  const stringFields = ['username', 'password', 'firstName', 'lastName'];
  const nonStringField = stringFields.find(
    field => field in req.body && typeof req.body[field] !== 'string'
  );
  if (nonStringField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Incorrect field type: expected a string',
      location: nonStringField
    });
  }
  const explicitlyTrimmedFields = ['username', 'password'];
  const nonTrimmedField = explicitlyTrimmedFields.find(
    field => req.body[field].trim() !== req.body[field]
  );
  if (nonTrimmedField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Cannot start or end with whitespace',
      location: nonTrimmedField
    });
  }
  const sizedFields = {
    username: {
      min: 1,
    },
    password: {
      min: 10,
      max: 72
    },
    firstName: {
      min: 1,
      max: 24
    },
    lastName: {
      min: 1,
      max: 24
    }
  };
  const tooSmallField = Object.keys(sizedFields).find(
    field =>
      'min' in sizedFields[field] &&
        req.body[field].trim().length < sizedFields[field].min
  );
  const tooLargeField = Object.keys(sizedFields).find(
    field =>
      'max' in sizedFields[field] &&
        req.body[field].trim().length > sizedFields[field].max
  );
  if (tooSmallField || tooLargeField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: tooSmallField
        ? `must be at least ${sizedFields[tooSmallField].min} character(s) long`
        : `must be at most ${sizedFields[tooLargeField].max} characters(s) long`,
      location: tooSmallField || tooLargeField
    });
  }
  let {username, password, firstName = '', lastName = ''} = req.body;
  firstName = firstName.trim();
  lastName = lastName.trim();
  return User.find({username})
    .count()
    .then(count => {
      if (count > 0) {
        //This would indicate that username already exists
        return Promise.reject({
          code: 422,
          reason: 'ValidationError',
          message: 'Username already taken',
          location: 'username'
        });
      }
      // Hashes password if username does not already exist
      return User.hashPassword(password);
    })
    .then(hash => {
      return User.create({
        username,
        password: hash,
        firstName,
        lastName
      });
    })
    .then(user => {
      return res.status(201).json(user.serialize());
    })
    .catch(err => {
      if (err.reason === 'ValidationError') {
        return res.status(err.code).json(err);
      }
      res.status(500).json(
        {
          code: 500, 
          message: 'Internal server error'});
    });
});
users.get('/', (req, res) => {
  return User.find()
    .then(users => res.json(users.map(user => user.serialize())))
    .catch(err => res.status(500).json({message: 'Internal server error'}));
});
module.exports = {users};