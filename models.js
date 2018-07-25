'use strict';

const mongoose = require('mongoose');

const locationSchema = mongoose.Schema({
  contributor: {type: String, required: true},
  coordinates: {
    lat: {type: Number, required: true},
    lon: {type: Number, required: true}
  },
  date_added: {type: Date, default: Date.now},
  id: Number,
  type: {type: String, required: true},
  verified: Boolean
});

locationSchema.virtual('latLng').get(function() {
  return `${this.coordinates.lat},${this.coordinates.lon}`;
});

locationSchema.methods.serialize = function() {
  return{
    contributor: this.contributor,
    coordinates: {
      lat: this.coordinates.lat,
      lon: this.coordinates.lon
    },
    date_added: this.date_added,
    id: this._id,
    type: this.type,
    verified: this.verified
  };
};

const Location = mongoose.model('Location', locationSchema);
module.exports = { Location };