'use strict';

let STATE = {};

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
      console.log(`ERROR! The user "${username}" was NOT added to the database!`)
    }
  };
  console.log(settings.data);
  $.ajax(settings);
}

function listen() {
  $('#signupForm').submit(event => {
    event.preventDefault();
    registerUser(
      $('#signup-username').val(),
      $('#signup-firstName').val(),
      $('#signup-lastName').val(),
      $('#signup-password').val()
    );
  });
}

$(window).on('load', function() {
  listen();
});