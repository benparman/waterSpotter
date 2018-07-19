'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');
const expect = chai.expect;
const {Location} = require('../models'); // ".."" moves up one level, out of test and into root
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);
//------------------------------
function seedLocationData() {
  console.info('seeding location data');
  const seedData = [];
  for(let i =0; i<10; i++) {
    seedData.push({
      contributor: faker.name.firstName(),
      coordinates: {
        lat: faker.random.number(),
        lon: faker.random.number()
      },
      date_added: faker.date.past(),
      type: faker.random.word(),
      verified: faker.random.boolean()
    });
  }
  return Location.insertMany(seedData);
}
function generateLocationData() {
  return {
    contributor: faker.name.firstName(),
    coordinates: {
      lat: faker.random.number(),
      lon: faker.random.number()
    },
    date_added: faker.date.past(),
    type: faker.random.word(),
    verified: faker.random.boolean()
  };
}
function tearDownDb() {
  return new Promise((resolve, reject) => {
    console.warn('Deleting database');
    mongoose.connection.dropDatabase()
      .then(result => resolve(result))
      .catch(err => reject(err));
  });
}
//------------------------------

describe('HTTP requests to root directory', function(){
  it('should expose a html document in the \'public\' folder', function(){
    return chai
      .request(app)
      .get('/')
      .then(function(res){
        expect(res).to.be.html;
      });
  });
  it('should return status 200', function() {
    return chai
      .request(app)
      .get('/')
      .then(function(res){
        expect(res).to.have.status(200);
      });
  });
});
describe('GET requests made to \'/locations\' endpoint', function() {
  it('should expose documents in the \'locations\' collection in the database', function() {
    return chai
      .request(app)
      .get('/locations')
      .then(function(res){
        expect(res).to.be.json;
      });
  });
});
