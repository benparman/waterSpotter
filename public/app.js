'use strict';
const geoCodingEndpoint='https://maps.googleapis.com/maps/api/geocode/json';
const geoCodingApiKey='AIzaSyB05Gh-VXpXhypmBg4R3hzZl8zFxJJYLGQ';
let defaultLocation={lat: 40.543504, lng: -105.127969};
let currentLocation;
//--------------------------------------------
function getServerData(){
  const settings = {
    method: 'GET',
    url: '/locations',
    dataType: 'json',
    contentType: 'application/json',
    success: function(res){
      console.log(res);
    },
    error: function(err){
      console.log(err);
    }
  }; 
  return $.ajax(settings);
}
//--------------------------------------------
function getLocation() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        currentLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        resolve(currentLocation);
      });
    }
    else {
      reject(console.log('Unable to fetch current location!'));
    }
  });
}
//--------------------------------------------
function geoCodeLocation(location, serverLocationData) {
  const settings = {
    url: geoCodingEndpoint,
    data: {
      address: location,
      key: geoCodingApiKey
    },
    dataType: 'json',
    success: function(data) {
      currentLocation = data.results[0].geometry.location;
      initMap(currentLocation, serverLocationData);
    },
    error: function(){
      console.log('error');
    }
  };
  $.ajax(settings);
}
//--------------------------------------------
function initMap(coords, markerData) {
  const mapOptions = {
    mapTypeId: 'terrain',
    zoom: 14,
    center: coords
  };
  let map = new google.maps.Map(document.getElementById('map'), mapOptions);
  addMarkersToMap(markerData, map);
  $('#map').show();
}
//--------------------------------------------
function addMarkersToMap(locations, map) {
  // mapMarkers array is only to needed for logging purposes!
  let mapMarkers = [];
  locations.forEach(function(storedPlace) {
    const marker = new google.maps.Marker({
      position: {
        lat: storedPlace.coordinates.lat,
        lng: storedPlace.coordinates.lon
      },
      title: storedPlace.title,
      map: map
    });
    // not needed - only here to console.log below
    mapMarkers.push(marker);
    return marker;
  });
  // Logging here to inspect marker data
  console.log('These are the map markers :', mapMarkers);
}
//--------------------------------------------
function listen(serverLocationData) {
  $('#searchLocation').submit(function(event) {
    event.preventDefault();
    geoCodeLocation($('.searchTerms').val(), serverLocationData);
  });
  $('#myLocation-button').click(function(event){
    event.preventDefault();
    getLocation()
      .then(function(userLocation){
        initMap(userLocation, serverLocationData);
      });
  });
}
//--------------------------------------------
$(window).on('load', function() {
  getServerData()
    .then(function(serverLocationData){
      initMap(defaultLocation, serverLocationData);
      listen(serverLocationData);
    });
});