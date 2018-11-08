'use strict';

const geoCodingEndpoint='https://maps.googleapis.com/maps/api/geocode/json';
const geoCodingApiKey='AIzaSyB05Gh-VXpXhypmBg4R3hzZl8zFxJJYLGQ';
//----------- STATE Variables -----------
const STATE = {
  current : {marker: null,infoWindow: null,location: {lat: null,lng: null}},
  defaultLocation:{lat: 40.543504, lng: -105.127969},
  loginStatus: null,
  markerLocations: null, 
  map: null,
  mapMarkers: [],
  newMarkerCoords : {lat:'',lng:''},
  viewPortWidth: Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
};
//--------- Set STATE.loginStatus -------
function checkLoginStatus() {
  if (sessionStorage.currentUser) {
    STATE.loginStatus = true;
    console.log('User Logged In: ', STATE.loginStatus);
    $('.welcomeUser').html(`Hi, ${sessionStorage.currentUser}!`)
    $('.loginStatus').html('<a class = "logoutButton" href = "">Log Out</a>');
    $('.postLocation').show();
    $('.signup').hide();
  }
  else {
    STATE.loginStatus = false;
    console.log('User Logged In: ', STATE.loginStatus);
    $('.welcomeUser').html('');
    $('.loginStatus').html('<a class="showLoginForm" href="#">Log In</a>');
    $('.postLocation').hide();
    $('.signup').show();
    $('.loginPageOnly').hide();
  }
}
//---------- Reset State.current --------
function resetCurrent() {
  console.log('resetcurrent ran');
  if (STATE.current.marker !== null && STATE.current.marker.new === true) {
    STATE.current.marker.setMap();
    console.log('marker removed');
  }
  if (STATE.current.infoWindow) {
    STATE.current.infoWindow.close();
  }
  STATE.current = {marker: null,infoWindow: null,location: {lat: null,lng: null}};
}
//-------------Get Server Data-----------
function getServerData(){
  const settings = {
    method: 'GET',
    url: 'api/locations',
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
        STATE.current.location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        resolve(STATE.current.location);
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
      STATE.current.location = data.results[0].geometry.location;
      STATE.map.panTo(STATE.current.location);
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
    fullscreenControl: false,
    center: STATE.defaultLocation,
    styles: [
      {
          "featureType": "all",
          "elementType": "geometry.fill",
          "stylers": [
              {
                  "color": "#ebebeb"
              }
          ]
      },
      {
          "featureType": "landscape.man_made",
          "elementType": "geometry.fill",
          "stylers": [
              {
                  "color": "#d6d2cc"
              }
          ]
      },
      {
        "featureType": "transit",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
      "featureType": "poi",
      "elementType": "all",
      "stylers": [
          {
              "visibility": "off"
          }
      ]
  },
      // {
      //     "featureType": "poi",
      //     "elementType": "geometry.fill",
      //     "stylers": [
      //         {
      //             "color": "#8d867c",
      //             "visibility": "off"
      //         }
      //     ]
      // },
      {
          "featureType": "road.highway",
          "elementType": "geometry.fill",
          "stylers": [
              {
                  "color": "#8b1b41"
              }
          ]
      },
      {
          "featureType": "road.highway",
          "elementType": "geometry.stroke",
          "stylers": [
              {
                  "color": "#8b1b41"
              },
              {
                  "lightness": "50"
              }
          ]
      },
      {
          "featureType": "road.arterial",
          "elementType": "geometry.fill",
          "stylers": [
              {
                  "color": "#fcd27f"
              }
          ]
      },
      {
          "featureType": "road.arterial",
          "elementType": "geometry.stroke",
          "stylers": [
              {
                  "color": "#fcd27f"
              },
              {
                  "lightness": "50"
              }
          ]
      },
      {
          "featureType": "water",
          "elementType": "geometry.fill",
          "stylers": [
              {
                  "color": "#12202f"
              },
              {
                  "gamma": "2.00"
              }
          ]
      },
      {
          "featureType": "water",
          "elementType": "labels.text.fill",
          "stylers": [
              {
                  "lightness": "100"
              }
          ]
      }
  ],
    mapTypeControlOptions: {
      style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
      mapTypeIds: ['terrain', 'satellite'],
      position: google.maps.ControlPosition.LEFT_BOTTOM
    }
  };
  STATE.map = new google.maps.Map(document.getElementById('map'), mapOptions);
  addMarkersToMap();
}
//--------- Generate Marker Icons ------------
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
//------Add Markers from Database Data--------
function addMarkersToMap() {
  if (STATE.mapMarkers.length > 0) {
    console.log('***********REMOVING MARKERS');
    STATE.mapMarkers.forEach(function(mapMarker) {
      mapMarker.setMap();
    });
  }
  STATE.mapMarkers = [];
  STATE.markerLocations.forEach(function(location) {
    let deleteLocationButton = '';
    let editLocationButton = '';
    if (sessionStorage.currentUser === location.contributor) {
      deleteLocationButton = '<button class="iw-button" id="deleteButton">Delete this location.</button>';
      editLocationButton = '<button class="iw-button" id="editButton">Edit this location.</button>';
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
      `<div class = "windowWrapper">
        <h2 class="infoWindow" id="infoWindowTitle">${location.title}</h2>
        <p class="infoWindow" id="infoWindowDescription"><span class="iw-bold">Description:  </span>${location.description}</p>
        <p class="infoWindow" id="infoWindowContributor"><span class="iw-bold">Contributor:  </span>${location.contributor}</p>
        <p class="infoWindow" id="infoWindowType"><span class="iw-bold">Type:  </span>${location.type}</p>
          <div class="iw-edit-button">
            ${deleteLocationButton} ${editLocationButton}
          </div>
        </div>`
    });
    let infowindow=new google.maps.InfoWindow({
      content: marker.infoWindowContent,
      maxWidth: STATE.viewPortWidth*.6
    });
    infowindow.addListener('closeclick', function() {
      resetCurrent();
    });
    marker.addListener('click', function() {
      if (STATE.current.marker) {
        resetCurrent();
      }
      STATE.current.marker = marker;
      infowindow.open(STATE.map, marker);
      STATE.map.panTo(marker.position);
      STATE.current.infoWindow=infowindow;
    });
    STATE.mapMarkers.push(marker);
    // return marker;
  });
  console.log('These are the map markers :', STATE.mapMarkers);
}
//--------------Add New Marker----------------
function addNewMarker() {
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
    `<div class = "windowWrapper">
      <section class = "newMarker">

          <form class = "newMarker" id = "newMarker">
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
            <button id = "postButton" type = "submit">Post New Location!</button>
          </form>
          <button id = "cancel">Cancel</button>

      </section>
    </div>`
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
  STATE.current.marker.setMap(STATE.map);
  google.maps.event.addListener(STATE.current.marker,'drag',function() {
    STATE.current.marker.lat = STATE.current.marker.position.lat();
    STATE.current.marker.lng = STATE.current.marker.position.lng();
  });
  infowindow.addListener('closeclick', function() {
    resetCurrent();
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
      $('.loginStatus').show();
      // $('.js-user-form').hide();
      // $('.signup-form').hide();
      $('.signup-form').html(
        `<p class="signupMessage">Success!  You may now log in as "${username}"</p>
        <button class="dismiss">Dismiss</button>`)
      // $('#map').css('pointer-events', 'auto');
      // $('#map').css('opacity', 1);
    },
    error: function(res) {
      $('.signupMessage').html(`${res.responseJSON.location} ${res.responseJSON.message}`);
      console.log('server respons line 383 app.js: ', res.responseJSON);
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
      $('.loginStatus').show();
      $('.js-user-form').hide();
      $('#map').css('pointer-events', 'auto');
      $('#map').css('opacity', 1);
    },
    error: function(res) {
      console.log(res);
      console.log('Login Failed!');
      $('.loginMessage').html('Incorrect username or password.')
    }
  };
  checkLoginStatus();
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
function postLocation(authToken,title, description, lat, lon, type) {
  console.log('postLocation() was called with the following parameters: ', title, description,lat,lon, type);
  const settings = {
    url: 'api/locations',
    method: 'POST',
    dataType: 'json',
    contentType: 'application/json',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
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
function deleteLocation(authToken, id){
  const settings = {
    url: `api/locations/${id}`,
    method: 'DELETE',
    dataType: 'json',
    contentType: 'application/json',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
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
//------------- Update Location --------------
function updateLocation(authToken, id, title, description, type){
  console.log(`Updated Location --- ID: ${id}, TITLE: ${title}, DESCRIPTION: ${description}, TYPE: ${type}`);
  if (id === null || title === null || description === null || type === null) {
    console.log('ERRROR! All fields must have a value!');
  }
  const settings = {
    url: `api/locations/${id}`,
    method: 'PUT',
    dataType: 'json',
    contentType: 'application/json',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
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
//-------------- Event Listeners -------------
checkLoginStatus();  // This needs to run before page load to set STATE.loginstatus
$(window).on('load', function() {

  getServerData().then(initMap);

  $('header').on('submit', '.searchLocation', event => {
    event.preventDefault();
    geoCodeLocation($('.searchTerms').val(), STATE.markerLocations);
  })

  $('header').on('click', '#myLocation-button', event => {
  event.preventDefault();
    getLocation()
      .then(function(){
        STATE.map.panTo(STATE.current.location);
      });
  });

  $('.links').on('click', '.signup', function(event) {
    event.preventDefault();
    $('.js-user-form').html(
      `<form class="signup-form" id="signupForm">
      <input type="text" class="userField" id="signup-username" placeholder="Username">
      <input type="text" class="userField" id="signup-firstName" placeholder="First Name">
      <input type="text" class="userField" id="signup-lastName" placeholder="Last Name">
      <input type="password" class="userField" id="signup-password" placeholder="Password">
      <button class="userField" type = "submit">Sign Up</button>
      <button class="close-logIn-signIn-form" type = "button">Cancel</button>
      <p class="signupMessage"></p>
      </form>`
      )
    $('.js-user-form').show();
    $('#map').css('opacity', .4);
    $('#map').css('pointer-events', 'none');
  });

  $('.links').on('click', '.showLoginForm', function(event) {
    event.preventDefault();
    $('.js-user-form').html(
      `<form class="login-form">
        <input type="text" class="userField" id="loginUser" placeholder="Username or Email">
        <input type="password" class="userField" id="loginPassword" placeholder="Password">
        <button class="userField" type="submit">Log In</button>
        <button class="close-logIn-signIn-form" type = "button">Cancel</button>
        <p class="loginMessage"></p>
      </form>`
    )
    $('.js-user-form').show();
    $('#map').css('opacity', .4);
    $('#map').css('pointer-events', 'none');
  })

  $('.js-user-form').on('click', '.close-logIn-signIn-form',function(event) {
    event.preventDefault();
    $('.js-user-form').hide();
    $('#map').css('opacity', 1);
    $('#map').css('pointer-events', 'auto');
  })

  $('.js-user-form').on('submit', '.signup-form', event => {
    event.preventDefault();
    registerUser(
      $('#signup-username').val(),
      $('#signup-firstName').val(),
      $('#signup-lastName').val(),
      $('#signup-password').val()
    );
  });
  $('.js-user-form').on('click', '.dismiss', function(event) {
    event.preventDefault();
    $('.js-user-form').hide();
      // $('.signup-form').hide();
      $('#map').css('pointer-events', 'auto');
      $('#map').css('opacity', 1);
  })
  $('.js-user-form').on('submit', '.login-form', event => {
    event.preventDefault();
    loginUser(
      $('#loginUser').val(),
      $('#loginPassword').val()
    )
      .then(checkLoginStatus); 
  });
  $('.links').on('click', '.logoutButton', function(event){
    event.preventDefault();
    if (sessionStorage.currentUser) {
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('currentUser');
    }
    $('.postLocation').hide();
    checkLoginStatus();
  });
  $('header').on('click', '.postLocation', event => {
    event.preventDefault();
    addNewMarker(STATE.map);
  });
  $('#map').on('click', '#cancel', function(event) {
    event.preventDefault();
    STATE.current.infoWindow.close();
    resetCurrent();
  })
  $('#map').on('submit', '#newMarker', event => {
    event.preventDefault();
    if ($('#newMarkerTitle').val().length > 0) {
      postLocation(
        sessionStorage.accessToken,
        $('#newMarkerTitle').val(),
        $('#newMarkerDescription').val(),
        STATE.current.marker.lat,
        STATE.current.marker.lng,
        $('#newMarkerType').val()
      );
      STATE.mapMarkers.forEach(function(mapMarker) {
        mapMarker.setMap();
      });
      STATE.mapMarkers = [],
      getServerData()
        .then(addMarkersToMap);
    }
    resetCurrent();
  });
  $('#map').on('click', '#deleteButton',event => {
    event.preventDefault();
    console.log('delete button clicked');
    deleteLocation(
      sessionStorage.accessToken, 
      STATE.current.infoWindow.anchor.id
    )
      .then(function(){    
        STATE.mapMarkers.forEach(function(mapMarker) {
          mapMarker.setMap();
        });
        STATE.mapMarkers = [],
        getServerData()
          .then(addMarkersToMap);
      }); 
  });
  $('#map').on('click', '#editButton', event => {
    event.preventDefault();
    let originalTitle = document.getElementById('infoWindowTitle').innerHTML;
    console.log(originalTitle);
    let originalDescription = document.getElementById('infoWindowDescription').innerHTML.slice(13, document.getElementById('infoWindowDescription').innerHTML.length);
    let windowContent = {
      content: `
      <div class = "windowWrapper">
        <section class = "editMarker">
            <form class = "editForm">
              <p class = editMarkerCoords></p>
              <input type = "text" id = "editMarkerTitle" name = "newTitle" placeholder = "${originalTitle}">
              <input type = "text" id = "editMarkerDescription" name = "newDescription" placeholder = "${originalDescription}">
              <select type = "text" id = "editMarkerType" name = "newType">
                ${optionGenerator()}
              </select>
              <button class = "submitChanges">Submit</button>
            </form>
        </section>
      </div>
    `
    };
    STATE.current.infoWindow.close();
    optionGenerator(); //returns HTML for 'edit' infoWindow
    STATE.current.infoWindow=new google.maps.InfoWindow({
      content: windowContent.content,
      maxWidth: STATE.viewPortWidth*.6,
      edit: true
    });
    STATE.current.infoWindow.open(STATE.map, STATE.current.marker);
  });
  $('#map').on('submit', '.editMarker', event=> {
    event.preventDefault();
    $('#map').removeClass('editMarker');
    updateLocation(
      sessionStorage.accessToken,
      STATE.current.marker.id, 
      $('#map #editMarkerTitle').val(), 
      $('#map #editMarkerDescription').val(), 
      $('#map #editMarkerType').val()
    ).then(
      resetCurrent,
      getServerData().then(function(res){
        console.log('post getServerData response: ',res);
        addMarkersToMap();
      })
    );
  });

  //----------- Set and resize map height -----------
  let headerHeight = $('header').height();
  console.log(headerHeight);
  let borderWidth = parseInt($('#map').css('border-width'), 10) * 4;
  console.log(borderWidth);
  let newMapHeight = $(window).height() - headerHeight - borderWidth;
  console.log(newMapHeight);
  $('body').height('100vh');
  $('#map').height(newMapHeight);
  $(window).resize(function(){
    headerHeight = $('header').height();
    newMapHeight = $(window).height() - headerHeight - borderWidth;
    $('#map').height(newMapHeight);
    $('body').height('100vh');
  });
});