'use strict';

let JWT = '';

//--------------------------------------------
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
      console.log(res.authToken);
      JWT = res.authToken;
    },
    error: function() {
      console.log('Login Failed!');
    }
  };
  $.ajax(settings);
}
//--------------------------------------------
function listen() {
  $('#login-form').submit(event => {
    event.preventDefault();
    loginUser(
      $('#login-username').val(),
      $('#login-password').val()
    );
  });
}
//--------------------------------------------
$(window).on('load', function() {
  listen();
});