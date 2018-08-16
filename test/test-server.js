'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');
const expect = chai.expect;
const {Location} = require('../models'); // ".."" moves up one level, out of test and into root
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');
console.log('This is TEST_DATABASE_URL: ', TEST_DATABASE_URL);
const parseDate = require('parse-date');

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
      date_added: parseDate(faker.date.past()),
      type: faker.random.word(),
      verified: false
    });
  }
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
    date_added: parseDate(faker.date.past()),
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
    it('should expose all existing locations in the \'locations\' collection in the database', function() {
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
    it('should return locations with the correct fields', function() {
      let resLocation;
      return chai.request(app)
        .get('/locations')
        .then(function(res) {
          expect(res.body).to.have.length.of.at.least(1);
          res.body.forEach(function(location) {
            expect(location).to.be.a('object');
            expect(location).to.include.keys(
              'title', 'description', 'contributor', 'coordinates', 'date_added', 'id', 'type', 'verified');
          });
          resLocation = res.body[0];
          return Location.findById(resLocation.id);
        })
        .then(function(location) {
          expect(resLocation.title).to.equal(location.title);
          expect(resLocation.description).to.equal(location.description);
          expect(resLocation.contributor).to.equal(location.contributor);
          expect(resLocation.coordinates.lat).to.equal(location.coordinates.lat);
          expect(resLocation.coordinates.lon).to.equal(location.coordinates.lon);
          expect(parseDate(resLocation.date_added).toString()).to.equal(parseDate(location.date_added).toString()); //---Not working, why?
          // expect(resLocation.id).to.equal(location.id); //---Not working, why?
          expect(resLocation.type).to.equal(location.type);
          expect(resLocation.verified).to.equal(location.verified);
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
          expect(parseDate(res.body.date_added).toString()).to.equal(parseDate(newLocation.date_added).toString()); //---Not working, why?
          expect(res.body.type).to.equal(newLocation.type);
          return Location.findById(res.body.id);
        })
        .then(function(location) {
          expect(location.contributor).to.equal(newLocation.contributor);
          expect(location.lat).to.equal(newLocation.lat);
          expect(location.lon).to.equal(newLocation.lon);
          expect(parseDate(location.date_added).toString()).to.equal(parseDate(newLocation.date_added).toString()); //---Not working, why?
          expect(location.type).to.equal(newLocation.type);
          expect(location.verified).to.equal(newLocation.verified);
        });
    });
  });
  describe('PUT endpoint', function() {
    it('should update locations with new data', function() {
      const updateData = {
        description: 'FIRE HOSE IN THE FRONT!',
        type: 'OUT OF CONTROL FIRE HOSE!'
      };

      return Location
        .findOne()
        .then(function(location) {
          updateData.id = location._id;
          return chai.request(app)
            .put(`/locations/${location._id}`)
            .send(updateData);
        })
        .then(function(res) {
          expect(res).to.have.status(200);
          return Location.findById(updateData.id);
        })
        .then(function(location) {
          expect(location.description).to.equal(updateData.description);
          expect(location.type).to.equal(updateData.type);
        });
    });
  });
  describe('DELETE endpoint', function() {
    it('Should remove the location associated with a specified ID', function() {
      let location;
      return Location
        .findOne()
        .then(function(_location) {
          location = _location;
          return chai.request(app).delete(`/locations/${location._id}`);
        })
        .then(function(res) {
          expect(res).to.have.status(200);
          return Location.findById(location._id);
        })
        .then(function(_location) {
          expect(_location).to.be.null;
        });
    });
  });
});