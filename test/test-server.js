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
  console.info('Seeding Water Spotter temporary test database!');
  const seedData = [];
  for(let i =0; i<10; i++) {
    seedData.push({
      title: faker.lorem.words(),
      description: faker.lorem.sentence(),
      contributor: faker.name.firstName()+' '+faker.name.lastName(),
      coordinates: {
        lat: faker.random.number(),
        lon: faker.random.number()
      },
      date_added: faker.date.past(),
      type: faker.random.word(),
      verified: faker.random.boolean()
    });
  }
  // console.log(seedData);
  return Location.insertMany(seedData);
}

function generateLocationData() {
  return {
    title: faker.lorem.words(),
    description: faker.lorem.sentence(),
    contributor: faker.name.firstName()+' '+faker.name.lastName(),
    coordinates: {
      lat: faker.random.number(),
      lon: faker.random.number()
    },
    date_added: faker.date.past(),
    type: faker.random.word(),
    verified: false
  };
}

function tearDownDb() {
  return new Promise((resolve, reject) => {
    console.warn('Deleting temporary Water Spotter test database');
    mongoose.connection.dropDatabase()
      .then(result => resolve(result))
      .catch(err => reject(err));
  });
}
describe('Location API Resource', function() {
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });
  beforeEach(function() {
    return seedLocationData();
  });
  afterEach(function() {
    return tearDownDb();
  });
  after(function() {
    return closeServer();
  });
  describe('HTTP requests to root directory', function(){
    it('should expose a html document in the \'public\' folder', function(){
      return chai
        .request(app)
        .get('/')
        .then(function(res){
          expect(res).to.be.html;
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
          expect(res.body).to.a('array');
          expect(res).to.have.status(200);
          return Location.count();
        });
    });
  });
  describe('POST endpoint', function() {
    it('should add a new location', function() {
      const newLocation = generateLocationData();
      return chai.request(app)
        .post('/locations')
        .send(newLocation)
        .then(function(res) {
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys(
            'title', 'description', 'contributor', 'coordinates', 'type', 'date_added', 'verified', 'id');
          expect(res.body.id).not.be.be.null;
          expect(res.body.contributor).to.equal(newLocation.contributor);
          expect(res.body.lat).to.equal(newLocation.lat);
          expect(res.body.lon).to.equal(newLocation.lon);
          // expect(res.body.date_added).to.equal(newLocation.date_added);
          expect(res.body.type).to.equal(newLocation.type);
          return Location.findById(res.body.id);
        })
        .then(function(location) {
          expect(location.contributor).to.equal(newLocation.contributor);
          expect(location.lat).to.equal(newLocation.lat);
          expect(location.lon).to.equal(newLocation.lon);
          // expect(location.date_added).to.equal(newLocation.date_added);
          expect(location.type).to.equal(newLocation.type);
          expect(location.verified).to.equal(newLocation.verified);
        });
    });
  });
});
