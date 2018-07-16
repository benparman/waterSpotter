'use strict';

const mongoose = require('mongoose');

const locationSchema = mongoose.Schema({
  contributor: {type: String, required: true},
  coordinates: {
    lat: {type: Number, required: true},
    lon: {type: Number, required: true}
  },
  date_added: {type: Date, required: true},
  id: Number,
  type: {type: String, required: true},
  verified: Boolean
});

const LocationData = mongoose.model('LocationData', locationSchema);
module.exports = {LocationData};