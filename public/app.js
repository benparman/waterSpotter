'use strict';

const geoCodingEndpoint='https://maps.googleapis.com/maps/api/geocode/json';
const geoCodingApiKey='AIzaSyB05Gh-VXpXhypmBg4R3hzZl8zFxJJYLGQ';
let currentLocation={lat: 40.543504, lng: -105.127969};

let getGpsLocation = new Promise((resolve, reject) => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      currentLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      resolve(console.log('resolved'), initMap(currentLocation));
    });
  }
  else {
    reject();
  }
});

function geoCodeLocation(location) {
  const settings = {
    url: geoCodingEndpoint,
    data: {
      address: location,
      key: geoCodingApiKey
    },
    dataType: 'json',
    success: function(data) {
      currentLocation = data.results[0].geometry.location;
      initMap(currentLocation);
    },
    error: function(){
      console.log('error');
    }
  };
  $.ajax(settings);
}

function initMap(coords) {
  console.log('initMap ran');
  var location = currentLocation;
  const mapOptions = {
    mapTypeId: 'terrain',
    zoom: 14,
    center: coords
  };
  
  let map = new google.maps.Map(document.getElementById('map'), mapOptions);
  // let marker = new google.maps.Marker({position: location, map: map});
  $('#map').show();
}

function listen() {
  $('#js-location-submit-button').click(function(event) {
    console.log('did something');
    event.preventDefault();
    geoCodeLocation($('#searchLocation').val() || currentLocation);
  });
}

$(window).on('load', function() {
  initMap(currentLocation);
  listen();
  getGpsLocation
    .then(console.log('resolved on 49'));
});