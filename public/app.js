'use strict';
const geoCodingEndpoint='https://maps.googleapis.com/maps/api/geocode/json';
const geoCodingApiKey='AIzaSyB05Gh-VXpXhypmBg4R3hzZl8zFxJJYLGQ';
let currentLocation={lat: 40.543504, lng: -105.127969};

let mockData = {
  'locations': [
    {
      'title': 'Lakeside Fire Station',
      'description': 'Faucet on North side of building',
      'contributor': 'John Doe',
      'coordinates': {
        'lat': 40.531654,
        'lon': -105.162646
      },
      'date_added': '2018-06-15',
      'id': 11111111,
      'type': 'Faucet',
      'verified': false
    },
    {
      'title': 'Mulholland Canyon Ranch',
      'description': 'Spigot next to gate at end of driveway',
      'contributor': 'Billy Bob',
      'coordinates': {
        'lat': 40.58,
        'lon': -105.16
      },
      'date_added': '2018-05-15',
      'id': 11111111,
      'type': 'Spigot',
      'verified': false
    },
    {
      'title': 'Monarch Crest Spring',
      'description': 'Small pipe with natural running spring water on east side of trail',
      'contributor': 'Sally Stranger',
      'coordinates': {
        'lat': 40.55,
        'lon': -105.17
      },
      'date_added': '2018-07-15',
      'id': 11111111,
      'type': 'Spring',
      'verified': false
    },
    {
      'title': 'Salida Downtown Public Restrooms',
      'description': '',
      'contributor': 'Franklin Roosevelt',
      'coordinates': {
        'lat': 40.53,
        'lon': -105.16
      },
      'date_added': '2018-07-13',
      'id': 11111111,
      'type': 'Drinking Fountain',
      'verified': false
    },
    {
      'title': 'Lakeside Fire Station',
      'description': '',
      'contributor': 'Albert Einstein',
      'coordinates': {
        'lat': 40.535,
        'lon': -105.168
      },
      'date_added': '2018-07-15',
      'id': 11111111,
      'type': 'natural spring',
      'verified': false
    }
  ]
};

console.log('This is the mock data: ', mockData);

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

function addMarkersToMap(locations, map) {
  // mapMarkers array is only to needed for logging purposes!
  let mapMarkers = [];
  locations.locations.forEach(function(storedPlace) {
    const marker = new google.maps.Marker({
      position: {
        lat: storedPlace.coordinates.lat,
        lng: storedPlace.coordinates.lat
      },
      title: storedPlace.title,
      map: map
    });
    // not needed - only here to console.log below
    mapMarkers.push(marker);
    return marker;
  });
  // this is here to visually inspect data, not necessary
  console.log('These are the map markers :', mapMarkers);
}

function initMap(coords) {
  // var location = currentLocation;
  const mapOptions = {
    mapTypeId: 'terrain',
    zoom: 14,
    center: coords
  };
  let map = new google.maps.Map(document.getElementById('map'), mapOptions);
  addMarkersToMap(mockData, map);
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