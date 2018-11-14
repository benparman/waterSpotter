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
  return new Promise(function(resolve) {
    if (sessionStorage.currentUser) {
      resolve(
        STATE.loginStatus = true,
        console.log('User Logged In: ', STATE.loginStatus, `"${sessionStorage.currentUser}"`),
        $('.welcomeUser').html(`Hi, ${sessionStorage.currentUser}!`),
        $('.loginStatus').html('<a class = "logoutButton" href = "">Log Out</a>'),
        $('.postLocation').show(),
        $('.signup').hide(),
        $('.hiddenDivider').css('display', 'initial')
      );
    }
    else {
      STATE.loginStatus = false;
      console.log('User Logged In: ', STATE.loginStatus);
      $('.welcomeUser').html('');
      $('.loginStatus').html('<a class="showLoginForm" href="#">Log In</a>');
      $('.postLocation').hide();
      $('.signup').show();
      $('.loginPageOnly').hide();
      $('.hiddenDivider').css('display', 'none');
    }
  });
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
        'featureType': 'all',
        'elementType': 'geometry.fill',
        'stylers': [
          {
            'color': '#ebebeb'
          }
        ]
      },
      {
        'featureType': 'landscape.man_made',
        'elementType': 'geometry.fill',
        'stylers': [
          {
            'color': '#d6d2cc'
          }
        ]
      },
      {
        'featureType': 'transit',
        'elementType': 'all',
        'stylers': [
          {
            'visibility': 'off'
          }
        ]
      },
      {
        'featureType': 'poi',
        'elementType': 'all',
        'stylers': [
          {
            'visibility': 'off'
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
        'featureType': 'road.highway',
        'elementType': 'geometry.fill',
        'stylers': [
          {
            'color': '#8b1b41'
          }
        ]
      },
      {
        'featureType': 'road.highway',
        'elementType': 'geometry.stroke',
        'stylers': [
          {
            'color': '#8b1b41'
          },
          {
            'lightness': '50'
          }
        ]
      },
      {
        'featureType': 'road.arterial',
        'elementType': 'geometry.fill',
        'stylers': [
          {
            'color': '#fcd27f'
          }
        ]
      },
      {
        'featureType': 'road.arterial',
        'elementType': 'geometry.stroke',
        'stylers': [
          {
            'color': '#fcd27f'
          },
          {
            'lightness': '50'
          }
        ]
      },
      {
        'featureType': 'water',
        'elementType': 'geometry.fill',
        'stylers': [
          {
            'color': '#12202f'
          },
          {
            'gamma': '2.00'
          }
        ]
      },
      {
        'featureType': 'water',
        'elementType': 'labels.text.fill',
        'stylers': [
          {
            'lightness': '100'
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
    return 'drinkingfountain.png';
  } else if (location.type === 'Spigot') {
    return 'drinkingwater.png';
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
        <button class="dismiss">Dismiss</button>`);
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
      checkLoginStatus().then(addMarkersToMap());
    },
    error: function(res) {
      console.log(res);
      console.log('Login Failed!');
      $('.loginMessage').html('Incorrect username or password.');
    }
  };
  // checkLoginStatus();
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
    console.log('ERROR! All fields must have a value!');
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
    resetCurrent();
    geoCodeLocation($('.searchTerms').val(), STATE.markerLocations);
  });

  $('header').on('click', '#myLocation-button', event => {
    event.preventDefault();
    resetCurrent();
    getLocation()
      .then(function(){
        STATE.map.panTo(STATE.current.location);
      });
  });
  $('.js-user-form').on('submit', '.login-form', event => {
    event.preventDefault();
    loginUser(
      $('#loginUser').val(),
      $('#loginPassword').val()
    );
  });
  $('.links').on('click', '.logoutButton', function(event){
    event.preventDefault();
    if (sessionStorage.currentUser) {
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('currentUser');
    }
    $('.postLocation').hide();
    resetCurrent();
    checkLoginStatus();
    getServerData().then(
      addMarkersToMap
    );
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
      <button class="closeUserForm" type = "button">Cancel</button>
      <p class="signupMessage"></p>
      </form>`
    );
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
        <button class="closeUserForm" type = "button">Cancel</button>
        <p class="loginMessage"></p>
      </form>`
    );
    $('.js-user-form').show();
    $('#map').css('opacity', .4);
    $('#map').css('pointer-events', 'none');
  });

  //------
  $('#about').on('click', function(event) {
    event.preventDefault();
    $('.js-user-form').html(`
      <div class="about">
      <div class="aboutText">
        <p class = "aboutText">HydroMapper is a tool for finding and sharing public drinking water resources for cyclists, runners, travelers, or anyone else in need of a refill.</p>
        <p class = "aboutText">The map displays existing user added resources with unique map marker icons indicating the resource type, such as drinking fountains, spigots, natural springs, etc.  Resource details can be shown by simply clicking on one of the markers.</p>
        <p class = "aboutText">The map center can be changed by using the search box or the “My Location” button at the top of the screen.  The search box will accept very specific to very general search terms, from zip codes to states, give it try!  The ‘My Location’ button relies on availability of GPS or network location, and may not be available depending on your device and connection type.</p>
        <p class = "aboutText">The map can also be moved by dragging the map with your mouse cursor, or by touch on a mobile device.  The map is capable of showing Terrain or Satellite views, which can be changed by clicking the respective button at the bottom left of the map.  You may zoom in and out using the “+” and “-“ buttons at the bottom right of the screen, and by dragging the icon of the yellow person onto the screen, you may see the “Street View” of a location, if available.</p>
        <p class = "aboutText">If you would like to add a resource to the map, you may do so by creating an account by using the “Sign Up” link in the top right, and logging in (also a link in the top right)  which will enable a “New” button next to the “My Location” button at the top of the screen.  A unique user account is required to add new resources, and provides the ability to later edit or remove resources that an individual user added.</p>
        <p class = "aboutText">This application depends on input from users like you!  Please consider creating an account and adding reliable locations to the map that may be useful to other users.</p>
        <p class = "aboutText">Please direct any questions, comments, or concerns to ***add-address***@gmail.com</p>
        </div>
        <button class="closeUserForm" id="closeAbout" type="button">Close</button>
      </div>
      `
    );
    $('.js-user-form').show();
    $('#map').css('opacity', .4);
    $('#map').css('pointer-events', 'none');
  });

  $('#contact').on('click', function(event) {
    event.preventDefault();
    $('.js-user-form').html(`
      <div class="about">
      <div class="aboutText">
        <p class = "aboutText">Please direct any questions, comments, or concerns to ***add-address***@gmail.com</p>
        </div>
        <button class="closeUserForm" id="closeAbout" type="button">Close</button>
      </div>
      `
    );
    $('.js-user-form').show();
    $('#map').css('opacity', .4);
    $('#map').css('pointer-events', 'none');
  });
  //------


  $('.js-user-form').on('click', '.closeUserForm',function(event) {
    event.preventDefault();
    $('.js-user-form').hide();
    $('#map').css('opacity', 1);
    $('#map').css('pointer-events', 'auto');
  });

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
    $('#map').css('pointer-events', 'auto');
    $('#map').css('opacity', 1);
  });
  $('header').on('click', '.postLocation', event => {
    event.preventDefault();
    addNewMarker(STATE.map);
  });
  $('#map').on('click', '#cancel', function(event) {
    event.preventDefault();
    STATE.current.infoWindow.close();
    resetCurrent();
  });

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
      )
        .then(
          STATE.mapMarkers.forEach(function(mapMarker) {
            mapMarker.setMap();
          }),
          STATE.mapMarkers = [],
          getServerData()
            .then(addMarkersToMap)
        );
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
    let originalDescription = document.getElementById('infoWindowDescription').innerHTML.slice(43, document.getElementById('infoWindowDescription').innerHTML.length);
    let windowContent = {
      content: `
      <div class = "windowWrapper">
        <section class = "editMarker">
            <form class = "editForm">
              <input type = "text" class = "editMarkerField" id = "editMarkerTitle" name = "newTitle" val ="${originalTitle}" placeholder = "${originalTitle}">
              <input type = "text" class = "editMarkerField" id = "editMarkerDescription" name = "newDescription" val = "${originalDescription}" placeholder = "${originalDescription}">
              <select type = "text" class = "editMarkerField" id = "editMarkerType" name = "newType">${optionGenerator()}</select>
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
      STATE.mapMarkers.forEach(function(mapMarker) {
        mapMarker.setMap();
      }),
      STATE.mapMarkers = [],
      getServerData()
        .then(addMarkersToMap)
    );
    resetCurrent();
  });

  //----------- Set and resize map height -----------
  let headerHeight = $('header').height();
  let footerHeight = $('footer').height();
  let borderWidth = parseInt($('#map').css('border-width'), 10) * 2;
  let newMapHeight = $(window).height() - headerHeight - footerHeight - borderWidth;
  console.log(newMapHeight);
  $('body').height('100vh');
  $('#map').height(newMapHeight);
  $(window).resize(function(){
    headerHeight = $('header').height();
    footerHeight = $('footer').height();
    borderWidth = parseInt($('#map').css('border-width'), 10) * 2;
    newMapHeight = $(window).height() - headerHeight - footerHeight - borderWidth;
    $('#map').height(newMapHeight);
    $('body').height('100vh');
  });
});