'use strict';

const geoCodingEndpoint='https://maps.googleapis.com/maps/api/geocode/json';
const currentLocation='40.541281, -105.126432';

function initMap() {
  console.log('initMap ran on line 7');
  // The location of Uluru
  var uluru = {lat: -25.344, lng: 131.036};
  // The map, centered at Uluru
  var map = new google.maps.Map(
    document.getElementById('map'), {zoom: 4, center: uluru});
  // The marker, positioned at Uluru
  var marker = new google.maps.Marker({position: uluru, map: map});
}

function doSomething() {
  console.log('did something');
  // initMap();
}

$(document).ready(doSomething);