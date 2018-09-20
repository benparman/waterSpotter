'use strict';
const geoCodingEndpoint='https://maps.googleapis.com/maps/api/geocode/json';
const geoCodingApiKey='AIzaSyB05Gh-VXpXhypmBg4R3hzZl8zFxJJYLGQ';
let currentLocation;



//----------- STATE Variables -----------
const STATE = {
  current : null,
  defaultLocation:{lat: 40.543504, lng: -105.127969},
  editWindowOpen: false,
  editInfowindow: null,
  loginStatus: null,
  markerLocations: null, 
  map: null,
  mapMarkers: [],
  newMarker: null,
  newMarkerCoords : {lat:'',lng:''},
  newMarkerStatus: false,
  viewPortWidth: Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
};
//---------- Reset State.current --------
function resetCurrent() {
  console.log('resetcurrent ran');
  if (STATE.current !== null) {
    if (STATE.current.marker.new === true) {
      STATE.current.marker.setMap();
      console.log('marker removed');
    }
    if (STATE.current.infoWindow) {
      STATE.current.infoWindow.close();
    }
  }
  
  STATE.current ={marker: null,infoWindow: null,location: {lat: null,lng: null}};
}
//--------- Set STATE.loginStatus -------
function checkLoginStatus() {
  if (sessionStorage.currentUser) {
    STATE.loginStatus = true;
    console.log('User Logged In: ', STATE.loginStatus);
    $('.loginStatus').html('<a href = "">Log Out</a>');
  }
  else {
    STATE.loginStatus = false;
    console.log('User Logged In: ', STATE.loginStatus);
    $('.loginStatus').html('<a href = "login.html">Log In</a>');
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
        STATE.current.location = currentLocation;
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
      STATE.map.panTo(currentLocation);
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
}

//------Add Markers from Database Data--------
function addMarkersToMap() {
  STATE.markerLocations.forEach(function(location) {
    let deleteLocationButton = '';
    let editLocationButton = '';
    if (sessionStorage.currentUser === location.contributor) {
      deleteLocationButton = '<button id = "deleteButton">Delete this location.</button>';
      editLocationButton = '<button id = "editButton">Edit this location.</button>';
    }
    const marker = new google.maps.Marker({
      position: {
        lat: location.coordinates.lat,
        lng: location.coordinates.lon
      },
      lat: location.coordinates.lat,
      lng: location.coordinates.lon,
      title: location.title,
      id: location.id,
      map: STATE.map,
      new: false,
      icon: generateMarkerIcons(location), //REFERENCE: Icon RGB Value: 0:225:225, or #00e1ff,
      animation: google.maps.Animation.DROP,
      infoWindowContent:
      `<infoWindowContent class = "windowWrapper">
          <h2 class = "infoWindow" id = "infoWindowTitle">${location.title}</h2>
          <h4 class = "infoWindow" id = "infoWindowDescription">Description: ${location.description}</h4>
          <p class = "infoWindow" id = "infoWindowContributor">Contributor: ${location.contributor}</p>
          <p class = "infoWindow" id = "infoWindowType">Type: ${location.type}</p>
          ${deleteLocationButton} ${editLocationButton}
        </infoWindowContent>`
    });
    let infowindow=new google.maps.InfoWindow({
      content: marker.infoWindowContent,
      maxWidth: STATE.viewPortWidth*.6
    });
    marker.addListener('click', function() {
      resetCurrent();
      STATE.current.marker = marker;
      infowindow.open(STATE.map, marker);
      STATE.map.panTo(marker.position);
      STATE.current.infoWindow=infowindow;
    });
    // not needed - only here to console.log below
    STATE.mapMarkers.push(marker);
    return marker;
  });
  // Logging here to inspect marker data
  console.log('These are the map markers :', STATE.mapMarkers);
}

//--------------Add New Marker----------------
function addNewMarker() {
  if (STATE.newMarker !== null) {
    STATE.newMarker.setmap();
  }
  resetCurrent();
  STATE.current.marker = new google.maps.Marker({
    position: STATE.map.getCenter(),
    lat: STATE.map.getCenter().lat(),
    lng: STATE.map.getCenter().lng(),
    title:'New Location',
    draggable: true,
    icon: 'marker_red+.png',
    new: true,
    infoWindowContent:
    `<infoWindowContent class = "windowWrapper">
      <section class = "newMarker">
        <fieldset class = "newMarker">
          <form id = "newMarker">
            <p class = newMarkerCoords></p>
            <input type = "text" id = "newMarkerTitle" name = "newTitle" placeholder = "Title...">
            <input type = "text" id = "newMarkerDescription" name = "newDescription" placeholder = "Description...">
            <select type = "text" id = "newMarkerType" name = "newType">
              <option value = "Drinking Fountain">Drinking Fountain</option>
              <option value = "Spigot">Spigot</option>
              <option value = "Freeze Proof Hydrant">Freeze Proof Hydrant</option>
              <option value = "Natural Spring">Natural Spring</option>
              <option value = "Sink">Sink</option>
              <option value = "Filtering Location (ie stream)">Filtering Location (i.e. stream)</option>
            </select>
            <button id = "postButton">Post New Location!</button>
          </form>
        </fieldset>
      </section>
    </infoWindowContent>`
  });

  let infowindow=new google.maps.InfoWindow({
    content: STATE.current.marker.infoWindowContent,
    maxWidth: STATE.viewPortWidth*.6
  });
  infowindow.open(STATE.map, STATE.current.marker); // Opens newMarker infoWindow on creation
  STATE.current.infoWindow=infowindow; //Stores newMarker infoWindow in STATE
  STATE.current.marker.addListener('click', function() {
    if (STATE.current.marker) {
      resetCurrent();
    }
    infowindow.open(STATE.map, STATE.current.marker);
    STATE.current.infoWindow=infowindow;
  });


  if (STATE.current.marker !== true) {
    STATE.current.marker.setMap(STATE.map);
    $('.newMarkerCoords').text(`New Marker Coordinates: ${STATE.current.marker.position.lat().toFixed(6)}, ${STATE.current.marker.position.lng().toFixed(6)}`);
  }
  google.maps.event.addListener(STATE.current.marker,'drag',function() {
    $('.newMarkerCoords').text(`New Marker Coordinates: ${STATE.current.marker.position.lat().toFixed(6)}, ${STATE.current.marker.position.lng().toFixed(6)}`);
  });
  // $('#map').click('img[src$ = "https://maps.gstatic.com/mapfiles/api-3/images/mapcnt6.png"]', event => {
  //why is the above NOT working?
  $('#map div div div div div div div div img').click(event => {
    event.preventDefault();
    STATE.newMarkerStatus = false;
    STATE.current.marker.setMap();
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

//----- Generate Dropdown for Edit Form ------
function optionGenerator(origTitle, origDescription, origType) {
  let selectOptionsHTML = '';
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
      selectOptionsHTML += `<option selected = "selected" value = "${selectOptions[i]}">${selectOptions[i]}</option>`;
    }
    else {
      selectOptionsHTML += `<option value = "${selectOptions[i]}">${selectOptions[i]}</option>`;
    }
  }
  return selectOptionsHTML;
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
            STATE.map.panTo(STATE.current.location);
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
  $('#map').on('submit', '#newMarker', event => {
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
    resetCurrent();
    STATE.current.marker = null;
    STATE.newMarkerStatus = false;
    STATE.newMarker.setMap();
    STATE.newMarker = null;
  });
  $('#map').on('click', '#deleteButton',event => {
    event.preventDefault();
    console.log('delete button clicked');
    deleteLocation(STATE.current.infoWindow.anchor.id).then(function(){    
      STATE.mapMarkers.forEach(function(mapMarker) {
        mapMarker.setMap();
      });
      STATE.mapMarkers = [],
      getServerData().then(function(){
        addMarkersToMap();
      });
    }); 
  });
  
  $('#map').on('click', '#editButton', event => {
    event.preventDefault();
    STATE.editWindowOpen = true;
    let originalTitle = document.getElementById('infoWindowTitle').innerHTML;
    let originalDescription = document.getElementById('infoWindowDescription').innerHTML.slice(13, document.getElementById('infoWindowDescription').innerHTML.length);
    let originalType = document.getElementById('infoWindowType').innerHTML.slice(6, document.getElementById('infoWindowType').innerHTML.length);
    STATE.current.infoWindow.close();
    optionGenerator(); //returns HTML for 'edit' infoWindow
    STATE.current.infoWindow=new google.maps.InfoWindow({
      content: `
      <infoWindowContent class = "windowWrapper">
        <section class = "editMarker">
          <fieldset class = "editMarker">
            <form id = "editMarker">
              <p class = editMarkerCoords></p>
              <input type = "text" id = "editMarkerTitle" name = "newTitle" placeholder = "${originalTitle}">
              <input type = "text" id = "editMarkerDescription" name = "newDescription" placeholder = "${originalDescription}">
              <select type = "text" id = "editMarkerType" name = "newType">
                ${optionGenerator()}
              </select>
              <button id = "submitChanges">Submit</button>
            </form>
          </fieldset>
        </section>
      </infowindowContent>
    `,
      maxWidth: STATE.viewPortWidth*.6
    });
    STATE.current.infoWindow.open(STATE.map, STATE.current.marker);
    $('#map').on('click', '#submitChanges', event=> {
      event.preventDefault();
      console.log('clicked edit submit button');
      updateLocation(
        STATE.current.marker.id, 
        $('#map #editMarkerTitle').val(), 
        $('#map #editMarkerDescription').val(), 
        $('#map #editMarkerType').val()
      ).then(
        STATE.editInfowindow.close(),
        STATE.mapMarkers.forEach(function(mapMarker) {
          mapMarker.setMap();
        }),
        getServerData().then(function(){
          addMarkersToMap();
        }
        )
      );
    });
  });
});

function updateLocation(id, title, description, type){
  const settings = {
    url: `locations/${id}`,
    method: 'PUT',
    dataType: 'json',
    contentType: 'application/json',
    data: JSON.stringify({
      id: id,
      title: title,
      description: description,
      type: type
    }),
    success: function(res) {
      console.log('Successfully Updated Location: ', res);
    },
    error: function(err) {
      console.log('ERRROR!  Server Response: ', err);
    }
  };
  return $.ajax(settings);
}
//***************WORK IN PROGRESS BELOW THIS LINE!!!! */


function generateMarkerIcons(location){
  if (location.type === 'Drinking Fountain') {
    return 'drinkingFountain.png';
  } else if (location.type === 'Spigot') {
    return 'drinkingWater.png';
  } else if (location.type === 'Freeze Proof Hydrant') {
    return 'waterwellpump.png';
  } else if (location.type === 'Natural Spring') {
    return 'waterdrop.png';
  }  else if (location.type === 'Filtering Location (ie stream)') {
    return 'river-2.png';
  }  else if (location.type === 'Sink') {
    return 'sink.png';
  }
}