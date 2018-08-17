'use strict';

const geoCodingEndpoint='https://maps.googleapis.com/maps/api/geocode/json';
const currentLocation='40.541281, -105.126432';

function initMap() {
  console.log('initMap ran on line 7');
  var location = {lat: 40.543504, lng: -105.127969};
  const mapOptions = {
    mapTypeId: 'terrain',
    zoom: 14,
    center: location
  };
  
  let map = new google.maps.Map(document.getElementById('map'), mapOptions);
  let marker = new google.maps.Marker({position: location, map: map});
  $('#map').show();
}

function listen() {
  $('#js-location-submit-button').click(function(event) {
    console.log('did something');
    event.preventDefault();
    initMap();
  });
}


$(window).on('load', function() {
  listen();
  initMap();
});