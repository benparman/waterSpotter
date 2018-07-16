'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../server.js');

const expect = chai.expect;

chai.use(chaiHttp);

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
