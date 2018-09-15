'use strict';

const geoCodingEndpoint='https://maps.googleapis.com/maps/api/geocode/json';
const geoCodingApiKey='AIzaSyB05Gh-VXpXhypmBg4R3hzZl8zFxJJYLGQ';
let currentLocation;
// let STATE.map = null;
//----------- STATE Variables -----------
const STATE = {
  map: null,
  currentLocation: null,
  defaultLocation:{
    lat: 40.543504, 
    lng: -105.127969
  },
  markerLocations: null,
  loginStatus: null,
  newMarkerStatus: false,
  viewPortWidth: Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
  currentInfoWindow: null,
  newMarkerCoords : {
    lat:'',
    lng:''
  }
};
//----------Set STATE.loginStatus--------
function checkLoginStatus() {
  if (sessionStorage.currentUser) {
    STATE.loginStatus = true;
    console.log('User Logged In: ', STATE.loginStatus);
    $('.loginStatus').html('<a href="">Log Out</a>');
  }
  else {
    STATE.loginStatus = false;
    console.log('User Logged In: ', STATE.loginStatus);
    $('.loginStatus').html('<a href="login.html">Log In</a>');
  }
}
checkLoginStatus();  // This needs to run before page load to set STATE.loginstatus
//-------------Get Server Data-----------
function getServerData(){
  const settings = {
    method: 'GET',
    url: '/locations',
    dataType: 'json',
    contentType: 'application/json',
    success: function(serverData){
      STATE.markerLocations = serverData;
      console.log('Response from getServerData(): ',serverData);
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
        STATE.currentLocation = currentLocation;
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
      STATE.map.setCenter(currentLocation);
    },
    error: function(){
      console.log('error');
    }
  };
  $.ajax(settings);
}
//--------------------------------------------
function initMap(coords) {
  const mapOptions = {
    mapTypeId: 'terrain',
    zoom: 14,
    center: coords
  };
  STATE.map = new google.maps.Map(document.getElementById('map'), mapOptions);
  addMarkersToMap();
  // $('#map').show();
}

//------Add Markers from Database Data--------
function addMarkersToMap() {
  // mapMarkers array is only to needed for logging purposes!
  let mapMarkers = [];
  STATE.markerLocations.forEach(function(location) {
    const marker = new google.maps.Marker({
      position: {
        lat: location.coordinates.lat,
        lng: location.coordinates.lon
      },
      title: location.title,
      map: STATE.map,
      icon: 'waterdrop.png', //REFERENCE: Icon RGB Value: 0:225:225, or #00e1ff,
      infoWindowContent:
      `<infoWindowContent class="windowWrapper">
          <h2 class="infoWindow">${location.title}</h2>
          <h4 class="infoWindow">Description: ${location.description}</h4>
          <p class="infoWindow">Contributor: ${location.contributor}</p>
          <p class="infoWindow">Type: ${location.type}</p>
        </infoWindowContent>`
    });

    //***************NEW - MAY NOT WORK YET /***************
    let infowindow=new google.maps.InfoWindow({
      content: marker.infoWindowContent,
      maxWidth: STATE.viewPortWidth*.6
    });
    marker.addListener('click', function() { 
      if (STATE.currentInfoWindow) {
        STATE.currentInfoWindow.close();
      }
      infowindow.open(map, marker);
      STATE.currentInfoWindow=infowindow;
    });
    //***************NEW - MAY NOT WORK YET /***************

    // not needed - only here to console.log below
    mapMarkers.push(marker);
    return marker;
  });
  // Logging here to inspect marker data
  console.log('These are the map markers :', mapMarkers);
}

//--------------Add New Marker----------------
function addNewMarker(existingMap) {
  let map = existingMap;
  let newMarker = new google.maps.Marker({
    position: map.getCenter(),
    title:'Test Marker',
    draggable: true,
    icon: 'marker_red+.png',
    infoWindowContent:
    `<infoWindowContent class="windowWrapper">
      <section class = "newMarker">
        <fieldset class = "newMarker">
          <form id="newMarker">
            <p class = newMarkerCoords></p>
            <input type="text" id="newMarkerTitle" name="newTitle" placeholder="Title...">
            <input type="text" id="newMarkerDescription" name="newDescription" placeholder="Description...">
            <select type="text" id="newMarkerType" name="newType">
              <option value="Drinking Fountain">Drinking Fountain</option>
              <option value="Spigot">Spigot</option>
              <option value="Freeze Proof Hydrant">Freeze Proof Hydrant</option>
              <option value="Natural Spring">Natural Spring</option>
              <option value="Sink">Sink</option>
              <option value="Filtering Location (ie stream)">Filtering Location (i.e. stream)</option>
            </select>
            <button id="postButton">Post New Location!</button>
          </form>
        </fieldset>
      </section>
    </infoWindowContent>`
  });

  let infowindow=new google.maps.InfoWindow({
    content: newMarker.infoWindowContent,
    maxWidth: STATE.viewPortWidth*.6
  });
  infowindow.open(map, newMarker); // Opens newMarker infoWindow on creation
  STATE.currentInfoWindow=infowindow; //Stores newMarker infoWindow in STATE
  newMarker.addListener('click', function() { 
    if (STATE.currentInfoWindow) {
      STATE.currentInfoWindow.close();
    }
    infowindow.open(map, newMarker);
    STATE.currentInfoWindow=infowindow;
  });


  if (STATE.newMarkerStatus === false) {
    STATE.newMarkerStatus = true;
    newMarker.setMap(map);
    STATE.newMarkerCoords.lat = newMarker.position.lat().toFixed(6);
    STATE.newMarkerCoords.lng= newMarker.position.lng().toFixed(6);
    $('.newMarkerCoords').text(`New Marker Coordinates: ${STATE.newMarkerCoords.lat}, ${STATE.newMarkerCoords.lng}`);
  }
  google.maps.event.addListener(newMarker,'drag',function() {
    STATE.newMarkerCoords.lat = newMarker.position.lat().toFixed(6);
    STATE.newMarkerCoords.lng= newMarker.position.lng().toFixed(6);
    $('.newMarkerCoords').text(`New Marker Coordinates: ${STATE.newMarkerCoords.lat}, ${STATE.newMarkerCoords.lng}`);
  });


  $('#map').submit('.#newMarker', event => {
    event.preventDefault();
    postLocation(
      $('#newMarkerTitle').val(),
      $('#newMarkerDescription').val(),
      STATE.newMarkerCoords.lat,
      STATE.newMarkerCoords.lng,
      $('#newMarkerType').val()
    );
    STATE.currentInfoWindow.close();
    newMarker.setMap(null);
  });


}

//----------- signup.html functions ----------
function registerUser(username, firsName, lastName, password) {
  const settings = {
    url: 'api/users/',
    method: 'POST',
    dataType: 'json',
    contentType: 'application/json',
    data: JSON.stringify({
      username: username,
      firstName: firsName,
      lastName: lastName,
      password: password
    }),
    success: function() {
      console.log(`The user "${username}" was successfully added to the database`);
    },
    error: function() {
      console.log(`ERROR! The user "${username}" was NOT added to the database!`);
    }
  };
  console.log(settings.data);
  $.ajax(settings);
}

//----------- login.html functions -----------
function loginUser(username, password) {
  const settings = {
    url: 'api/auth/login/',
    method: 'POST',
    dataType: 'json',
    contentType: 'application/json',
    data: JSON.stringify({
      username: username,
      password: password
    }),
    success: function(res) {
      sessionStorage.accessToken = res.authToken;
      sessionStorage.currentUser = username;
    },
    error: function() {
      console.log('Login Failed!');
    }
  };
  return $.ajax(settings);
}

//----------- get protected data -----------
function getProtected(authToken) {
  const settings = {
    async: true,
    crossDomain: true,
    url: '/api/protected',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    success: function(data){
      console.log(data);
    },
    error: function(err){
      console.log('Error! ', err);
    }
  };
  $.ajax(settings);

  //////// Below is an alternative to console.log inside success /////////
  // .done(function (response) {
  //   console.log(response);
  // });
}

//----------- login.html functions -----------
function postLocation(title, description, lat, lon, type) {
  console.log('postLocation() was called with the following parameters: ', title, description,lat,lon, type);
  const settings = {
    url: '/locations',
    method: 'POST',
    dataType: 'json',
    contentType: 'application/json',
    data: JSON.stringify({
      title: title,
      description: description,
      contributor: sessionStorage.currentUser,
      coordinates: {
        lat: lat,
        lon: lon
      },
      type: type
    }),
    success: function(res) {
      console.log('Location added!', res);
    },
    error: function(err) {
      console.log('Error, location was not added!', err);
    }
  };
  return $.ajax(settings);
}

//-------------- Event Listeners -------------
$(window).on('load', function() {
  getServerData()
    .then(function(){
      initMap(STATE.defaultLocation, STATE.markerLocations);
      // listen(serverData);
      $('#searchLocation').submit(event => {
        event.preventDefault();
        geoCodeLocation($('.searchTerms').val(), STATE.markerLocations);
      });
      $('#myLocation-button').click(event =>{
        event.preventDefault();
        getLocation()
          .then(function(){
            STATE.map.setCenter(STATE.currentLocation);
          });
      });
    });
  $('#signupForm').submit(event => {
    event.preventDefault();
    registerUser(
      $('#signup-username').val(),
      $('#signup-firstName').val(),
      $('#signup-lastName').val(),
      $('#signup-password').val()
    );
  });

  $('#login-form').submit(event => {
    event.preventDefault();
    loginUser(
      $('#login-username').val(),
      $('#login-password').val()
    )
      .then(function(JWT) {
        getProtected(JWT.authToken);
        checkLoginStatus();
      }); 
  });

  //***********THIS HAS BEEN MOVED INSIDE addNewMarker Function! */
  //****Placing it there allows access to newMarker so it can be removed */
  // $('#map').submit('.#newMarker', event => {
  //   event.preventDefault();
  //   postLocation(
  //     $('#newMarkerTitle').val(),
  //     $('#newMarkerDescription').val(),
  //     STATE.newMarkerCoords.lat,
  //     STATE.newMarkerCoords.lng,
  //     $('#newMarkerType').val()
  //   );
  //   STATE.currentInfoWindow.close();
  // });
  //***********THIS HAS BEEN MOVED INSIDE addNewMarker Function! */

  $('.loginStatus').click(function(){
    if (sessionStorage.currentUser) {
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('currentUser');
    }
  });
  $('#testButton').click(function(){
    addNewMarker(STATE.map);
  });
});