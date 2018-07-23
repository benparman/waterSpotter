'use strict';

const mongoose = require('mongoose');

const locationSchema = mongoose.Schema({
  contributor: {type: String, required: true},
  lat: {type: Number, required: true},
  lon: {type: Number, required: true}
  ,
  date_added: Date,
  id: Number,
  type: {type: String, required: true},
  verified: Boolean
});

locationSchema.virtual('coordinates').get(function() {
  return `${this.lat},${this.lon}`;
});

locationSchema.methods.serialize = function() {
  return{
    contributor: this.contributor,
    coordinates: this.coordinates,
    date_added: this.date_added,
    id: this._id,
    type: this.type,
    verified: this.verified
  };
};

const Location = mongoose.model('Location', locationSchema);
module.exports = { Location };