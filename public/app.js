'use strict';

const geoCodingEndpoint='https://maps.googleapis.com/maps/api/geocode/json';
const geoCodingApiKey='AIzaSyB05Gh-VXpXhypmBg4R3hzZl8zFxJJYLGQ';
let currentLocation;
//----------- STATE Variables -----------
const STATE = {
  map: null,
  currentLocation: null,
  defaultLocation:{
    lat: 40.543504, 
    lng: -105.127969
  },
  markerLocations: null, 
  mapMarkers: [],
  loginStatus: null,
  newMarkerStatus: false,
  viewPortWidth: Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
  currentInfoWindow: null,
  newMarkerCoords : {
    lat:'',
    lng:''
  },
  newMarker: null
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
function initMap() {
  const mapOptions = {
    mapTypeId: 'terrain',
    zoom: 14,
    center: STATE.defaultLocation
  };
  STATE.map = new google.maps.Map(document.getElementById('map'), mapOptions);
  addMarkersToMap();
  // $('#map').show();
}

//------Add Markers from Database Data--------
function addMarkersToMap() {
  // mapMarkers array is only to needed for logging purposes!
  STATE.markerLocations.forEach(function(location) {
    let uniqueIcon;
    let deleteLocationButton = '';
    let editLocationButton = '';
    if (sessionStorage.currentUser === location.contributor) {
      deleteLocationButton = '<button id="deleteButton">Delete this location.</button>';
      editLocationButton = '<button id="editButton">Edit this location.</button>';
    }
    if (location.type === 'Drinking Fountain') {
      uniqueIcon = 'drinkingFountain.png';
    } else if (location.type === 'Spigot') {
      uniqueIcon = 'drinkingWater.png';
    } else if (location.type === 'Freeze Proof Hydrant') {
      uniqueIcon = 'waterwellpump.png';
    } else if (location.type === 'Natural Spring') {
      uniqueIcon = 'waterdrop.png';
    }  else if (location.type === 'Filtering Location (ie stream)') {
      uniqueIcon = 'river-2.png';
    }  else if (location.type === 'Sink') {
      uniqueIcon = 'sink.png';
    }
    const marker = new google.maps.Marker({
      position: {
        lat: location.coordinates.lat,
        lng: location.coordinates.lon
      },
      title: location.title,
      id: location.id,
      map: STATE.map,
      icon: uniqueIcon, //REFERENCE: Icon RGB Value: 0:225:225, or #00e1ff,
      animation: google.maps.Animation.DROP,
      infoWindowContent:
      `<infoWindowContent class="windowWrapper">
          <h2 class="infoWindow" id="infoWindowTitle">${location.title}</h2>
          <h4 class="infoWindow" id="infoWindowDescription">Description: ${location.description}</h4>
          <p class="infoWindow" id="infoWindowContributor">Contributor: ${location.contributor}</p>
          <p class="infoWindow" id="infoWindowType">Type: ${location.type}</p>
          ${deleteLocationButton} ${editLocationButton}
        </infoWindowContent>`
    });

    let infowindow=new google.maps.InfoWindow({
      content: marker.infoWindowContent,
      maxWidth: STATE.viewPortWidth*.6
    });
    marker.addListener('click', function() { 
      if (STATE.currentInfoWindow) {
        STATE.currentInfoWindow.close();
      }
      infowindow.open(STATE.map, marker);
      STATE.currentInfoWindow=infowindow;
    });

    // not needed - only here to console.log below
    STATE.mapMarkers.push(marker);
    return marker;
  });
  // Logging here to inspect marker data
  console.log('These are the map markers :', STATE.mapMarkers);
}

//--------------Add New Marker----------------
function addNewMarker(existingMap) {
  let map = existingMap;
  STATE.newMarker = new google.maps.Marker({
    position: map.getCenter(),
    title:'New Location',
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
    content: STATE.newMarker.infoWindowContent,
    maxWidth: STATE.viewPortWidth*.6
  });
  infowindow.open(map, STATE.newMarker); // Opens newMarker infoWindow on creation
  STATE.currentInfoWindow=infowindow; //Stores newMarker infoWindow in STATE
  STATE.newMarker.addListener('click', function() { 
    if (STATE.currentInfoWindow) {
      STATE.currentInfoWindow.close();
    }
    infowindow.open(map, STATE.newMarker);
    STATE.currentInfoWindow=infowindow;
  });


  if (STATE.newMarkerStatus === false) {
    STATE.newMarkerStatus = true;
    STATE.newMarker.setMap(map);
    STATE.newMarkerCoords.lat = STATE.newMarker.position.lat().toFixed(6);
    STATE.newMarkerCoords.lng= STATE.newMarker.position.lng().toFixed(6);
    $('.newMarkerCoords').text(`New Marker Coordinates: ${STATE.newMarkerCoords.lat}, ${STATE.newMarkerCoords.lng}`);
  }
  google.maps.event.addListener(STATE.newMarker,'drag',function() {
    STATE.newMarkerCoords.lat = STATE.newMarker.position.lat().toFixed(6);
    STATE.newMarkerCoords.lng= STATE.newMarker.position.lng().toFixed(6);
    $('.newMarkerCoords').text(`New Marker Coordinates: ${STATE.newMarkerCoords.lat}, ${STATE.newMarkerCoords.lng}`);
  });
  // $('#map').click('img[src$="https://maps.gstatic.com/mapfiles/api-3/images/mapcnt6.png"]', event => {
  //why is the above NOT working?
  $('#map div div div div div div img').click(event => {
    console.log('WORKING!');
    event.preventDefault();
    STATE.newMarkerStatus = false;
    STATE.newMarker.setMap();
    STATE.newMarker = null;
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

//--------- POST Location to Server ----------
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

//------- Delete Location from Server --------
function deleteLocation(id){
  const settings = {
    url: `locations/${id}`,
    method: 'DELETE',
    dataType: 'json',
    contentType: 'application/json',
    success: function(res) {
      console.log('Server response from DELETE request: ', res);
    },
    error: function(err) {
      console.log('ERRROR!  Server Response: ', err);
    }
  };
  return $.ajax(settings);
}

//-------------- Event Listeners -------------
$(window).on('load', function() {
  getServerData()
    .then(function(){
      initMap();
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

  $('.loginStatus').click(function(){
    if (sessionStorage.currentUser) {
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('currentUser');
    }
  });
  $('#testButton').click(function(){
    addNewMarker(STATE.map);
  });
  $('#map').submit('.#newMarker', event => {
    event.preventDefault();
    if ($('#newMarkerTitle').val().length > 0) {
      postLocation(
        $('#newMarkerTitle').val(),
        $('#newMarkerDescription').val(),
        STATE.newMarkerCoords.lat,
        STATE.newMarkerCoords.lng,
        $('#newMarkerType').val()
      );
      STATE.mapMarkers.forEach(function(mapMarker) {
        mapMarker.setMap();
      });
      STATE.mapMarkers = [],
      getServerData().then(function(){
        addMarkersToMap();
      });
    }
    STATE.currentInfoWindow.close();
    STATE.newMarkerStatus = false;
    STATE.newMarker.setMap();
    STATE.newMarker = null;
  });
  $('#map').on('click', '#deleteButton',event => {
    event.preventDefault();
    console.log('delete button clicked');
    deleteLocation(STATE.currentInfoWindow.anchor.id).then(function(){    
      STATE.mapMarkers.forEach(function(mapMarker) {
        mapMarker.setMap();
      });
      STATE.mapMarkers = [],
      getServerData().then(function(){
        addMarkersToMap();
      });
    }); 
  });
  
  //*************************************************** */
  //*************************************************** */
  //*************************************************** */
  //*************************************************** */
  //*************************************************** */
  //*************************************************** */
  //***************WORK IN PROGRESS BELOW THIS LINE!!!! */
  $('#map').on('click', '#editButton', event => {
    event.preventDefault();
    let origTitle = document.getElementById('infoWindowTitle').innerHTML;
    let origDescription = document.getElementById('infoWindowDescription').innerHTML.slice(13, document.getElementById('infoWindowDescription').innerHTML.length);
    let origType = document.getElementById('infoWindowType').innerHTML.slice(6, document.getElementById('infoWindowType').innerHTML.length);
    let selectOptionsHTML = '';
    optionGenerator();
    function optionGenerator() {
      console.log('This is the original type: ', origType);
      let selectOptions = [
        'Drinking Fountain',
        'Spigot',
        'Freeze Proof Hydrant',
        'Natural Spring',
        'Sink',
        'Filtering Location (ie stream)'
      ];
      for (let i=0; i<selectOptions.length; i++) {
        if (selectOptions[i] === origType) {
          selectOptionsHTML += `<option selected="selected" value="${selectOptions[i]}">${selectOptions[i]}</option>`;
        }
        else {
          selectOptionsHTML += `<option value="${selectOptions[i]}">${selectOptions[i]}</option>`;
        }
      }
      console.log(selectOptionsHTML);
      console.log('This is the original title: ',origTitle);
      $('#map .windowWrapper').html(
        `<section class = "editMarker">
        <fieldset class = "editMarker">
          <form id="editMarker">
            <p class = editMarkerCoords></p>
            <input type="text" id="editMarkerTitle" name="newTitle" placeholder="${origTitle}">
            <input type="text" id="editMarkerDescription" name="newDescription" placeholder="${origDescription}">
            <select type="text" id="editMarkerType" name="newType">
              ${selectOptionsHTML}
            </select>
            <button id="submitChanges">Submit</button>
          </form>
        </fieldset>
      </section>`
      );
    }
  });
});

