'use strict';
const geoCodingEndpoint='https://maps.googleapis.com/maps/api/geocode/json';
const geoCodingApiKey='AIzaSyB05Gh-VXpXhypmBg4R3hzZl8zFxJJYLGQ';
let currentLocation={lat: 40.543504, lng: -105.127969};

function getLocation() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        currentLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        resolve( initMap(currentLocation) );
      });
    }
    else {
      reject();
    }
  });
}

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
  $('#searchLocation').submit(function(event) {
    event.preventDefault();
    geoCodeLocation($('.searchTerms').val());
  });
  $('#myLocation-button').click(function(event){
    event.preventDefault();
    getLocation();
  });
}

$(window).on('load', function() {
  initMap(currentLocation);
  listen();
});